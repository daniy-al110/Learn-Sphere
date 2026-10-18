"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { submitQuizAnswers } from "@/lib/student/api";
import type { QuizDetail } from "@/lib/student/types";
import { confirmDialog, toast } from "@/lib/toast-store";

interface Props {
  quiz: QuizDetail;
  studentId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const optionsOf = (q: QuizDetail["questions"][number]): string[] =>
  Array.isArray(q.options) ? q.options : (JSON.parse(q.options || "[]") as string[]);

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizModal({ quiz, studentId, onClose, onSubmitted }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [remaining, setRemaining] = useState<number | null>(quiz.time_limit ? quiz.time_limit * 60 : null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; timeUp: boolean } | null>(null);
  
  const hasTimer = Boolean(quiz.time_limit);
  const finished = useRef(false);

  // Randomize questions if required
  const questions = useMemo(() => {
    if (quiz.randomize_questions) return shuffleArray(quiz.questions);
    return quiz.questions;
  }, [quiz.questions, quiz.randomize_questions]);

  // Pagination for not allowing back navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const allowBack = quiz.allow_back_navigation !== false; // defaults to true if undefined

  async function submit(isTimeUp = false) {
    if (finished.current) return;

    if (!isTimeUp) {
      const ok = await confirmDialog.confirm({
        title: "Submit Quiz", message: "Are you sure you want to submit this quiz?", confirmText: "Submit", type: "info",
      });
      if (!ok || finished.current) return;
    }
    if (!studentId) return toast.warning("Please login to submit quizzes");

    setSubmitting(true);
    try {
      const total = questions.length;
      const answered = questions.filter((q) => {
        const ans = answers[String(q.question_id)];
        return ans !== undefined && ans !== "";
      }).length;
      
      if (!isTimeUp && answered < total) {
        const unanswered = total - answered;
        const proceed = await confirmDialog.confirm({
          title: "Unanswered Questions",
          message: `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Do you still want to submit?`,
          confirmText: "Submit Anyway",
          cancelText: "Go Back",
          type: "warning",
        });
        if (!proceed || finished.current) return setSubmitting(false);
      }
      
      const score = await submitQuizAnswers(quiz.quiz_id, studentId, answers, isTimeUp);
      finished.current = true;
      setResult({ score, total, timeUp: isTimeUp });
      onSubmitted();
    } catch (err) {
      console.error("Error submitting quiz:", err);
      toast.error(err instanceof Error && err.message ? err.message : "Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  }

  const [deadline] = useState(() => (quiz.time_limit ? Date.now() + quiz.time_limit * 60 * 1000 : 0));
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    if (!hasTimer || result) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        void submitRef.current(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [hasTimer, result, deadline]);

  const mins = remaining === null ? "" : String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = remaining === null ? "" : String(remaining % 60).padStart(2, "0");

  const renderQuestion = (q: typeof questions[0], index: number) => {
    const isMCQ = !q.question_type || q.question_type === "MCQ" || q.question_type === "True/False";
    return (
      <div key={q.question_id} className="bg-white p-6 rounded-lg shadow-sm border mb-4">
        <div className="font-semibold text-lg mb-3">{index + 1}. {q.question_text}</div>
        <div className="space-y-2">
          {isMCQ ? (
            optionsOf(q).map((opt, i) => (
              <label key={i} className="flex items-start space-x-3 p-2 rounded-sm hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`q_${q.question_id}`}
                  value={i}
                  checked={answers[String(q.question_id)] === i}
                  onChange={() => setAnswers((a) => ({ ...a, [String(q.question_id)]: i }))}
                  className="mt-1"
                />
                <span className="text-gray-700">{opt}</span>
              </label>
            ))
          ) : (
            <input
              type="text"
              placeholder="Type your answer here..."
              value={(answers[String(q.question_id)] as string) || ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [String(q.question_id)]: e.target.value }))}
              className="w-full p-2 border rounded-sm"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" id="quizModal">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="text-xl font-bold">{quiz.title}</h3>
          <div className={`text-lg font-semibold ${remaining !== null && remaining <= 60 ? "text-red-600 font-bold" : ""}`}>
            {remaining !== null && !result ? `${mins}:${secs}` : ""}
          </div>
        </div>

        {result ? (
          <ResultView result={result} onClose={onClose} />
        ) : (
          <>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              {allowBack ? (
                questions.map((q, idx) => renderQuestion(q, idx))
              ) : (
                renderQuestion(questions[currentIndex], currentIndex)
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end gap-4 shrink-0">
              {allowBack && (
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-sm hover:bg-gray-300 cursor-pointer">
                  Cancel
                </button>
              )}
              
              {!allowBack && currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 cursor-pointer"
                >
                  Next Question
                </button>
              ) : (
                <button
                  id="quizSubmitBtn"
                  disabled={submitting}
                  onClick={() => submit(false)}
                  className="px-4 py-2 bg-accent text-white rounded-sm hover:bg-accent-hover cursor-pointer disabled:opacity-70"
                >
                  {submitting ? (<><span className="inline-block animate-spin mr-2">↻</span>Submitting...</>) : "Submit Quiz"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResultView({ result, onClose }: { result: { score: number; total: number; timeUp: boolean }; onClose: () => void }) {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 100;
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <div className={`text-6xl mb-4 ${pct >= 70 ? "text-green-500" : ""}`}>{pct >= 70 ? "🎉" : "📝"}</div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
      <div className={`text-4xl font-bold mb-4 ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
        {result.score}/{result.total} ({pct}%)
      </div>
      <p className="text-gray-600 mb-6">
        {result.timeUp ? "Time ran out - quiz was automatically submitted." : "Quiz submitted successfully."}
      </p>
      <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200 cursor-pointer">
        Close
      </button>
    </div>
  );
}

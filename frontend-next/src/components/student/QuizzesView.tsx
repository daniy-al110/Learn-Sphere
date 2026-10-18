"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/layout/icons";
import QuizModal from "./QuizModal";
import { EmptyState, FilterBar, LoadingBlock, PageHeading } from "./shared";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchQuizzes, loadQuizForAttempt } from "@/lib/student/api";
import { filterQuizzes } from "@/lib/student/helpers";
import type { QuizDetail } from "@/lib/student/types";

export default function QuizzesView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data, error, loading, reload } = useAsync(fetchQuizzes, studentId);
  if (error) console.error("Failed to load quizzes", error);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("title_asc");

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);

  const visible = useMemo(() => filterQuizzes(data ?? [], search, status, sort), [data, search, status, sort]);

  async function startQuiz(quizId: number) {
    setStarting(true);
    try {
      setActiveQuiz(await loadQuizForAttempt(quizId));
    } catch (err) {
      console.error("Error starting quiz:", err);
      setStartError(err instanceof Error && err.message ? err.message : "Failed to start quiz. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  let body: React.ReactNode;
  if (loading) body = <LoadingBlock text="Loading quizzes..." />;
  else if (error) body = <div className="text-red-600">Network error while loading quizzes.</div>;
  else if (visible.length === 0) body = <EmptyState text="No quizzes found matching your filters." />;
  else
    body = (
      <div className="grid gap-6">
        {visible.map((q) => (
          <div key={q.quiz_id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transition-all hover:shadow-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">{q.course_name}</span>
                <h3 className="text-xl font-bold text-gray-800">{q.title}</h3>
                <p className="text-gray-600">{q.description || "No description provided."}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" className="w-4 h-4 text-gray-400" /> {q.time_limit} minutes
                  </span>
                  {q.submitted_at && (
                    <span className="flex items-center gap-1.5 text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-sm">
                      <Icon name="check-circle" className="w-4 h-4" /> Score: {q.student_score}/{q.total_questions}
                    </span>
                  )}
                </div>
                {q.submitted_at && <p className="text-xs text-gray-400">Submitted: {new Date(q.submitted_at).toLocaleString()}</p>}
              </div>
              {!q.submitted_at && q.is_active ? (
                <button
                  onClick={() => startQuiz(q.quiz_id)}
                  disabled={starting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm transition duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-70"
                >
                  Start Quiz
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto" id="quizzes">
      <PageHeading title="Active Quizzes" subtitle="Test your knowledge, review course topics, and take active exams and quizzes." />
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search quizzes by title or course name..."
        selects={[
          { value: status, onChange: setStatus, options: [["all", "All Quizzes"], ["pending", "To Be Taken (Pending)"], ["completed", "Completed"]] },
          {
            value: sort,
            onChange: setSort,
            options: [["title_asc", "Title (A-Z)"], ["title_desc", "Title (Z-A)"], ["time_desc", "Time Limit (High-Low)"], ["time_asc", "Time Limit (Low-High)"]],
          },
        ]}
      />
      <div id="quizzesGrid" className="grid gap-6">{body}</div>

      {/* "Loading quiz..." overlay */}
      {starting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
            <p className="text-gray-700">Loading quiz...</p>
          </div>
        </div>
      )}

      {/* "Unable to Start Quiz" dialog */}
      {startError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-center">Unable to Start Quiz</h3>
            </div>
            <p className="text-gray-600 text-center mb-6">{startError}</p>
            <div className="flex justify-center">
              <button onClick={() => setStartError(null)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200 cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeQuiz && (
        <QuizModal
          key={activeQuiz.quiz_id}
          quiz={activeQuiz}
          studentId={studentId}
          onClose={() => setActiveQuiz(null)}
          onSubmitted={reload}
        />
      )}
    </div>
  );
}

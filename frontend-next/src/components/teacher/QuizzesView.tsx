"use client";

import { useState } from "react";
import CourseSelect from "./CourseSelect";
import { useAsync } from "@/hooks/useAsync";
import { useCourseParam } from "@/hooks/useCourseParam";
import { createQuizRequest, deleteQuizById, fetchTeacherQuizzes, toggleQuizActive } from "@/lib/teacher/api";
import type { QuizDraftQuestion, QuizQuestionType } from "@/lib/teacher/types";
import { confirmDialog, toast } from "@/lib/toast-store";

const emptyQuestion = (): QuizDraftQuestion => ({ type: "MCQ", text: "", options: ["", "", "", ""], correct: "0" });

export default function QuizzesView() {
  const [viewCourse, setViewCourse] = useCourseParam();
  const { data, error, loading, reload } = useAsync(fetchTeacherQuizzes, viewCourse);
  if (error) console.error("Error loading quizzes:", error);

  /* ---- create-quiz modal ---- */
  const [modalOpen, setModalOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [allowBackNavigation, setAllowBackNavigation] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [questions, setQuestions] = useState<QuizDraftQuestion[]>([]);
  const [creating, setCreating] = useState(false);

  function openModal() {
    // the "Quizzes" button on a course card used to preselect the modal's course
    if (!courseId && viewCourse) setCourseId(viewCourse);
    setModalOpen(true);
  }

  const patchQuestion = (i: number, patch: Partial<QuizDraftQuestion>) =>
    setQuestions((qs) => qs.map((q, idx) => {
      if (idx !== i) return q;
      const updated = { ...q, ...patch };
      if (patch.type) {
        if (patch.type === "True/False") updated.correct = "0"; // Default to True
        else if (patch.type === "Short Answer") updated.correct = "";
        else if (patch.type === "MCQ") updated.correct = "0";
      }
      return updated;
    }));
  const patchOption = (i: number, o: number, value: string) =>
    setQuestions((qs) =>
      qs.map((q, idx) => {
        if (idx !== i) return q;
        const options = [...q.options] as QuizDraftQuestion["options"];
        options[o] = value;
        return { ...q, options };
      }),
    );

  async function createQuiz() {
    if (!courseId || !title || !timeLimit) return toast.warning("Please fill in all quiz details");

    const built: { type: string; text: string; options: string[]; correctAnswer: string; points: number }[] = [];
    for (const q of questions) {
      if (!q.text.trim()) return toast.warning("Please enter the question text");
      let options: string[] = [];
      let correctAnswer = "";
      if (q.type === "MCQ") {
        options = q.options.map((o) => o.trim());
        if (options.some((o) => !o)) return toast.warning("Please fill in all options for MCQ");
        correctAnswer = options[Number(q.correct)];
      } else if (q.type === "True/False") {
        options = ["True", "False"];
        correctAnswer = q.correct === "0" ? "True" : "False";
      } else {
        // Short Answer
        options = [];
        correctAnswer = q.correct.trim();
        if (!correctAnswer) return toast.warning("Please enter the correct answer for Short Answer");
      }
      built.push({ type: q.type, text: q.text.trim(), options, correctAnswer, points: 1 });
    }
    if (built.length === 0) return toast.warning("Please add at least one question");

    setCreating(true);
    try {
      const data = await createQuizRequest({
        courseId: parseInt(courseId),
        title: title.trim(),
        description: "",
        timeLimit: parseInt(timeLimit),
        allowBackNavigation,
        randomizeQuestions,
        questions: built,
      });
      if (data.success) {
        toast.success("Quiz created successfully");
        setTitle("");
        setTimeLimit("");
        setAllowBackNavigation(false);
        setRandomizeQuestions(true);
        setQuestions([]);
        reload();
        setModalOpen(false);
      } else {
        toast.error("Failed to create quiz: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error creating quiz:", err);
      toast.error("Failed to create quiz. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  /* ---- list actions ---- */
  async function toggle(quizId: number, activate: boolean) {
    try {
      const res = await toggleQuizActive(quizId, activate);
      if (res.success) {
        toast.success(`Quiz ${activate ? "activated" : "deactivated"} successfully`);
        reload();
      } else {
        toast.error("Failed to toggle quiz: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Toggle quiz error:", err);
      toast.error("Network error");
    }
  }

  async function remove(quizId: number) {
    const ok = await confirmDialog.confirmDelete({
      title: "Delete Quiz",
      message: "Delete this quiz and all its questions?",
      entityName: "this quiz",
    });
    if (!ok) return;
    try {
      const res = await deleteQuizById(quizId);
      if (res.success) {
        toast.success("Quiz deleted");
        reload();
      } else {
        toast.error("Failed to delete quiz: " + (res.error || "Unknown"));
      }
    } catch (err) {
      console.error("Delete quiz error:", err);
      toast.error("Network error");
    }
  }

  let list: React.ReactNode;
  if (!viewCourse) list = <p className="text-gray-500 text-center py-6">Please select a course to view quizzes.</p>;
  else if (loading) list = <p className="text-gray-400 text-center py-6 animate-pulse">Loading quizzes...</p>;
  else if (error) list = <p className="text-red-500 text-center py-6">Failed to load quizzes.</p>;
  else if (!data || data.length === 0) list = <p className="text-gray-500 text-center py-6">No quizzes yet for this course.</p>;
  else
    list = data.map((q) => {
      const active = Boolean(q.is_active);
      return (
        <div key={q.quiz_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3 bg-gray-50 hover:bg-white transition-colors">
          <div>
            <p className="font-semibold text-gray-900">{q.title || "Untitled Quiz"}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Time Limit: {q.time_limit || "–"} min &nbsp;|&nbsp; Questions: {q.question_count || 0}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
              {active ? "Active" : "Inactive"}
            </span>
            <button
              onClick={() => toggle(q.quiz_id, !active)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                active ? "border-red-300 text-red-600 hover:bg-red-50" : "border-green-300 text-green-600 hover:bg-green-50"
              }`}
            >
              {active ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => remove(q.quiz_id)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      );
    });

  return (
    <div id="quizzes">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Manage Quizzes</h2>
        <div className="flex gap-2">
          <CourseSelect
            id="viewQuizzesCourseSelect"
            value={viewCourse}
            onChange={setViewCourse}
            className="p-2 border rounded-sm"
          />
          <button onClick={openModal} className="bg-accent text-white px-4 py-2 rounded-sm hover:bg-accent-hover cursor-pointer">
            Create Quiz
          </button>
        </div>
      </div>

      {modalOpen && (
        <div id="createQuizModal" className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl p-6 rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create New Quiz</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-600 cursor-pointer">Close</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Course</label>
                <CourseSelect id="quizCourseSelect" value={courseId} onChange={setCourseId} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quiz Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-full p-2 border rounded-sm" />
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={allowBackNavigation} onChange={(e) => setAllowBackNavigation(e.target.checked)} />
                  Allow Back Navigation
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} />
                  Randomize Questions
                </label>
              </div>

              <div className="space-y-4 max-h-80 overflow-auto border-t pt-4">
                <h4 className="font-semibold text-lg">Questions</h4>
                {questions.map((q, i) => (
                  <div key={i} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <label className="block text-sm font-medium mb-1">Question {i + 1}</label>
                      <select value={q.type} onChange={(e) => patchQuestion(i, { type: e.target.value as QuizQuestionType })} className="p-1 text-sm border rounded-sm bg-white">
                        <option value="MCQ">Multiple Choice</option>
                        <option value="True/False">True / False</option>
                        <option value="Short Answer">Short Answer</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <input
                        type="text" placeholder="Enter question" value={q.text}
                        onChange={(e) => patchQuestion(i, { text: e.target.value })}
                        className="w-full p-2 border rounded-sm"
                      />
                    </div>
                    
                    {q.type === "MCQ" && (
                      <div className="space-y-2">
                        {q.options.map((opt, o) => (
                          <input
                            key={o} type="text" placeholder={`Option ${o + 1}`} value={opt}
                            onChange={(e) => patchOption(i, o, e.target.value)}
                            className="w-full p-2 border rounded-sm"
                          />
                        ))}
                        <div className="mt-2">
                          <label className="block text-sm font-medium mb-1">Correct Answer</label>
                          <select value={q.correct} onChange={(e) => patchQuestion(i, { correct: e.target.value })} className="w-full p-2 border rounded-sm">
                            <option value="0">Option 1</option>
                            <option value="1">Option 2</option>
                            <option value="2">Option 3</option>
                            <option value="3">Option 4</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {q.type === "True/False" && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium mb-1">Correct Answer</label>
                        <select value={q.correct} onChange={(e) => patchQuestion(i, { correct: e.target.value })} className="w-full p-2 border rounded-sm">
                          <option value="0">True</option>
                          <option value="1">False</option>
                        </select>
                      </div>
                    )}

                    {q.type === "Short Answer" && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium mb-1">Correct Answer</label>
                        <input
                          type="text" placeholder="Enter correct answer" value={q.correct}
                          onChange={(e) => patchQuestion(i, { correct: e.target.value })}
                          className="w-full p-2 border rounded-sm"
                        />
                      </div>
                    )}
                    
                    <button onClick={() => setQuestions(qs => qs.filter((_, idx) => idx !== i))} className="mt-3 text-red-500 text-sm font-medium hover:underline">
                      Remove Question
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-4">
                <button onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])} className="bg-gray-200 px-4 py-2 rounded-sm hover:bg-gray-300 cursor-pointer">
                  Add Question
                </button>
                <button
                  onClick={createQuiz}
                  disabled={creating}
                  className="bg-accent text-white px-4 py-2 rounded-sm hover:bg-accent-hover cursor-pointer disabled:opacity-70"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Quiz"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Active Quizzes</h3>
        <div id="activeQuizzesList">{list}</div>
      </div>
    </div>
  );
}

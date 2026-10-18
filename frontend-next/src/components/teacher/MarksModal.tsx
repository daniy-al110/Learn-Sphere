"use client";

import { useState } from "react";
import { Icon } from "@/components/layout/icons";
import { saveGradeWithRetry } from "@/lib/teacher/api";
import { MARK_LIMITS, calculateGrade } from "@/lib/teacher/grades";
import { toast } from "@/lib/toast-store";

interface Props {
  studentId: number | string;
  courseId: string;
  onClose: () => void;
  onSaved: () => void;
}

type Field = "quiz" | "assignment" | "mid" | "final";
const FIELDS: { key: Field; label: string; errorLabel: string }[] = [
  { key: "quiz", label: "Quiz Marks (out of 15)", errorLabel: "Quiz marks" },
  { key: "assignment", label: "Assignment Marks (out of 15)", errorLabel: "Assignment marks" },
  { key: "mid", label: "Mid Term Marks (out of 30)", errorLabel: "Mid term marks" },
  { key: "final", label: "Final Marks (out of 40)", errorLabel: "Final marks" },
];

/** Port of openMarksModal / updateTotalAndGrade / saveGrade. The form starts empty each time, as before. */
export default function MarksModal({ studentId, courseId, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<Field, string>>({ quiz: "", assignment: "", mid: "", final: "" });
  const [saving, setSaving] = useState(false);

  const num = (f: Field) => (values[f] === "" ? 0 : Number(values[f]));
  const outOfRange = (f: Field) => values[f] !== "" && (num(f) < 0 || num(f) > MARK_LIMITS[f]);
  const hasErrors = FIELDS.some((f) => outOfRange(f.key));

  const total = num("quiz") + num("assignment") + num("mid") + num("final");
  const result = calculateGrade(total);
  const untouched = FIELDS.every((f) => values[f.key] === "");

  async function save() {
    const quizMarks = Number(values.quiz);
    const assignmentMarks = Number(values.assignment);
    const midMarks = Number(values.mid);
    const finalMarks = Number(values.final);

    if (!courseId || !studentId) return toast.warning("Missing course or student information");
    if (
      quizMarks < 0 || quizMarks > 15 || assignmentMarks < 0 || assignmentMarks > 15 ||
      midMarks < 0 || midMarks > 30 || finalMarks < 0 || finalMarks > 40
    ) {
      return toast.error("Cannot save: One or more marks fields contain invalid/out-of-bounds values.");
    }

    const totalMarks = quizMarks + assignmentMarks + midMarks + finalMarks;
    const { grade, cgpa } = calculateGrade(totalMarks);

    setSaving(true);
    const outcome = await saveGradeWithRetry({
      studentId, courseId, quizMarks, assignmentMarks, midMarks, finalMarks, totalMarks, grade, cgpa,
    });
    setSaving(false);

    if (outcome.kind === "saved") {
      onClose();
      onSaved();
      toast.success("Grade saved successfully");
    } else if (outcome.kind === "error") {
      console.error("Save grade failed:", outcome.message);
      toast.error("Error saving grade: " + outcome.message);
    } else {
      onSaved(); // refresh the table so the teacher can confirm whether it went through
      toast.error("Network error while saving grade. The grade may have been saved — check the table to confirm.");
    }
  }

  return (
    <div id="marksModal" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 transform transition-all duration-300">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Enter Student Academic Marks</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" aria-label="Close">
            <Icon name="x" className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {FIELDS.map((f) => {
            const bad = outOfRange(f.key);
            return (
              <div key={f.key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                <input
                  type="number" min={0} max={MARK_LIMITS[f.key]} step={0.1}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className={`w-full p-2.5 border rounded-lg focus:outline-hidden focus:ring-2 transition-all ${
                    bad ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-accent"
                  }`}
                />
                {bad && (
                  <span className="text-xs text-red-500 font-semibold mt-1 block">
                    {f.errorLabel} must be between 0.0 and {MARK_LIMITS[f.key]}.0
                  </span>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-600">Calculated Total Marks:</span>
              <span className="text-lg font-extrabold text-gray-900">{untouched ? "0/100" : `${total.toFixed(1)}/100`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600">Estimated Final Grade:</span>
              <span className="text-lg font-extrabold text-accent">
                {untouched ? "-" : `${result.grade} (${result.cgpa.toFixed(2)})`}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all cursor-pointer">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={hasErrors || saving}
            className={`px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-bold rounded-lg shadow-md transition-all cursor-pointer ${
              hasErrors || saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Save Grade
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { fetchSubmissions, saveAssignmentMarks } from "@/lib/teacher/api";
import { toast } from "@/lib/toast-store";

interface Props {
  assignmentId: number;
  title: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Port of openGradingModal / submitMarks / closeGradingModal. */
export default function GradingModal({ assignmentId, title, onClose, onSaved }: Props) {
  const { data, error, loading } = useAsync(fetchSubmissions, assignmentId);
  if (error) console.error("Failed to load students for grading", error);
  // typed marks keyed by student id; falls back to the stored mark
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [invalid, setInvalid] = useState<string | null>(null);

  const valueFor = (id: string, stored: unknown) => (id in typed ? typed[id] : stored != null ? String(stored) : "");

  async function save() {
    const marks: { studentId: number; marks: number }[] = [];
    for (const s of data ?? []) {
      const id = String(s.student_id);
      const value = valueFor(id, s.marks);
      if (value === "") continue;
      const markVal = parseFloat(value);
      if (isNaN(markVal) || markVal < 0 || markVal > 100) {
        toast.warning("Marks must be between 0 and 100.");
        setInvalid(id);
        return;
      }
      marks.push({ studentId: parseInt(id), marks: markVal });
    }
    if (marks.length === 0) return toast.warning("No marks entered.");

    try {
      const res = await saveAssignmentMarks(assignmentId, marks);
      if (res.success) {
        toast.success("Marks saved successfully");
        onSaved();
        onClose();
      } else {
        toast.error("Failed to save marks: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving marks:", err);
      toast.error("Failed to save marks. Please try again.");
    }
  }

  return (
    <div id="gradingModal" className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Grade: {title || "Assignment"}</h4>
          <button onClick={onClose} className="text-gray-600 cursor-pointer">Close</button>
        </div>
        <div className="space-y-3 max-h-96 overflow-auto">
          {loading ? (
            "Loading students..."
          ) : error ? (
            <div className="text-red-600">Failed to load students.</div>
          ) : !data || data.length === 0 ? (
            <div>No students enrolled.</div>
          ) : (
            data.map((s) => {
              const id = String(s.student_id);
              return (
                <div key={id} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-600 mb-1">ID: {s.student_id}</div>
                    {s.submitted ? (
                      <a
                        href={s.file_url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded-sm border border-blue-200"
                      >
                        📄 View PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No submission</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="number" min={0} max={100} placeholder="Marks"
                      autoFocus={invalid === id}
                      value={valueFor(id, s.marks)}
                      onChange={(e) => setTyped((t) => ({ ...t, [id]: e.target.value }))}
                      className="p-1 border rounded-sm w-24"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="mt-4 text-right">
          <button onClick={save} className="px-4 py-2 bg-accent text-white rounded-sm hover:bg-accent-hover cursor-pointer">
            Save Marks
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/layout/icons";
import { EmptyState, FilterBar, LoadingBlock, PageHeading } from "./shared";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchAssignments, submitAssignmentFile } from "@/lib/student/api";
import { filterAssignments } from "@/lib/student/helpers";
import type { Assignment } from "@/lib/student/types";
import { confirmDialog, toast } from "@/lib/toast-store";

const BADGES: Record<string, { wrap: string; dot: string; label: string }> = {
  submitted: { wrap: "bg-green-50 text-green-700", dot: "bg-green-500", label: "Submitted" },
  overdue: { wrap: "bg-red-50 text-red-700", dot: "bg-red-500", label: "Overdue" },
  pending: { wrap: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500", label: "Pending" },
};

function AssignmentCard({ a, studentId, onSubmitted }: { a: Assignment; studentId: string; onSubmitted: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const id = a.assignment_id || a.id;
  const badge = BADGES[a.status] || BADGES.pending;

  /** Port of window.submitAssignment(). */
  async function submit() {
    if (!studentId) return toast.warning("You must be logged in to submit assignments.");
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.warning("Please select a PDF file to upload.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))
      return toast.warning("Only PDF files are allowed.");

    const ok = await confirmDialog.confirm({
      title: "Submit Assignment",
      message: "Are you sure you want to submit this assignment with the selected file?",
      confirmText: "Submit",
      type: "info",
    });
    if (!ok || !id) return;

    setUploading(true);
    try {
      const res = await submitAssignmentFile(id, studentId, file);
      if (res.success) {
        toast.success("Assignment submitted successfully!");
        onSubmitted();
      } else {
        toast.error("Failed to submit assignment: " + (res.error || "Unknown error"));
        setUploading(false);
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      toast.error("Failed to submit assignment. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-pink-50 text-accent">{a.course_name}</span>
          <h3 className="text-xl font-bold text-gray-800">{a.title}</h3>
          <p className="text-gray-600 text-sm">{a.description || "No description provided."}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2">
            <span className="flex items-center gap-1">
              <Icon name="calendar" className="w-4 h-4 text-gray-400" />
              Due: {a.due_date ? new Date(a.due_date).toLocaleString() : "No due date"}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.wrap}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {a.link && (
              <a
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-bold px-4 py-2 rounded-lg shadow-xs transition duration-200 hover:-translate-y-0.5"
              >
                <Icon name="external-link" className="w-4 h-4" />
                Open
              </a>
            )}
            {a.status !== "submitted" && (
              <div className="flex flex-col items-end gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="block w-48 text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-accent hover:file:bg-pink-100"
                />
                <button
                  onClick={submit}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-xs transition duration-200 hover:-translate-y-0.5 cursor-pointer disabled:opacity-70"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Icon name="upload" className="w-4 h-4" /> Submit
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-700 mt-1">
            Marks:{" "}
            <span className={a.marks != null ? "text-green-600 font-bold" : "text-gray-400"}>
              {a.marks != null ? a.marks : "Not graded"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data, error, loading, reload } = useAsync(fetchAssignments, studentId);
  if (error) console.error("loadAssignments error", error);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("due_asc");
  const visible = useMemo(() => filterAssignments(data ?? [], search, status, sort), [data, search, status, sort]);

  let body: React.ReactNode;
  if (loading) body = <LoadingBlock text="Loading assignments..." />;
  else if (error) body = <div className="text-red-600">Network error loading assignments.</div>;
  else if (visible.length === 0) body = <EmptyState text="No assignments found matching your filters." card="rounded-xl shadow-sm" />;
  else
    body = (
      <div className="grid gap-6">
        {visible.map((a) => (
          <AssignmentCard key={a.assignment_id || a.id} a={a} studentId={studentId} onSubmitted={reload} />
        ))}
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto" id="assignments">
      <PageHeading
        title="My Assignments"
        subtitle="View your course assignments, track submission statuses, and review pending deadlines."
      />
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search assignments by title or course name..."
        selects={[
          { value: status, onChange: setStatus, options: [["all", "All Assignments"], ["pending", "To Be Submitted (Pending)"], ["completed", "Submitted (Completed)"]] },
          {
            value: sort,
            onChange: setSort,
            options: [["due_asc", "Due Date (Soonest First)"], ["due_desc", "Due Date (Furthest First)"], ["title_asc", "Title (A-Z)"], ["title_desc", "Title (Z-A)"]],
          },
        ]}
      />
      <div id="assignmentsGrid" className="space-y-6">{body}</div>
    </div>
  );
}

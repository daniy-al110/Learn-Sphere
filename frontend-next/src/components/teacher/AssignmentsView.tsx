"use client";

import { useState } from "react";
import CourseSelect from "./CourseSelect";
import GradingModal from "./GradingModal";
import { useAsync } from "@/hooks/useAsync";
import { useCourseParam } from "@/hooks/useCourseParam";
import { createAssignmentRequest, deleteAssignmentById, fetchCourseAssignments } from "@/lib/teacher/api";
import { confirmDialog, toast } from "@/lib/toast-store";

export default function AssignmentsView() {
  const [viewCourse, setViewCourse] = useCourseParam();
  const { data, error, loading, reload } = useAsync(fetchCourseAssignments, viewCourse);
  if (error) console.error("Error loading assignments:", error);

  const [grading, setGrading] = useState<{ id: number; title: string } | null>(null);

  /* ---- create modal ---- */
  const [modalOpen, setModalOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  function openModal() {
    if (!courseId && viewCourse) setCourseId(viewCourse);
    setModalOpen(true);
  }

  async function create() {
    if (!courseId || !title || !description || !link || !dueDate) return toast.warning("Please fill in all assignment details");
    const todayStr = new Date().toISOString().split("T")[0];
    if (dueDate < todayStr) return toast.warning("Due date cannot be set in the past!");

    setCreating(true);
    try {
      const res = await createAssignmentRequest({
        courseId: parseInt(courseId), title: title.trim(), description: description.trim(), link: link.trim(), dueDate,
      });
      if (res.success) {
        toast.success("Assignment created successfully");
        setTitle("");
        setDescription("");
        setLink("");
        setDueDate("");
        // the list shows the course that was just created for (the view select is synced if empty)
        if (viewCourse !== courseId && !viewCourse) setViewCourse(courseId);
        else reload();
        setModalOpen(false);
      } else {
        toast.error("Failed to create assignment: " + (res.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Create assignment error", err);
      toast.error("Network error while creating assignment");
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: number) {
    const ok = await confirmDialog.confirmDelete({
      title: "Delete Assignment",
      message: "Delete this assignment and its submissions?",
      entityName: "this assignment",
    });
    if (!ok) return;
    try {
      const res = await deleteAssignmentById(id);
      if (res.success) {
        toast.success("Assignment deleted");
        reload();
      } else {
        toast.error("Failed to delete assignment: " + (res.error || "Unknown"));
      }
    } catch (err) {
      console.error("Delete assignment error", err);
      toast.error("Network error");
    }
  }

  let list: React.ReactNode;
  if (!viewCourse) list = <p className="text-gray-500 text-center py-6">Please select a course to view assignments.</p>;
  else if (loading) list = <p className="text-gray-400 text-center py-6 animate-pulse">Loading assignments...</p>;
  else if (error) list = <p className="text-red-500 text-center py-6">Failed to load assignments.</p>;
  else if (!data || data.length === 0) list = <p className="text-gray-500 text-center py-6">No assignments yet for this course.</p>;
  else
    list = data.map((a) => (
      <div key={a.assignment_id} className="p-4 border border-gray-200 rounded-lg mb-3 bg-gray-50 hover:bg-white transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{a.title || "Untitled Assignment"}</p>
            <p className="text-sm text-gray-600 mt-1">{a.description || ""}</p>
            {a.link && (
              <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                View Link ↗
              </a>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Due: <span className="font-semibold text-gray-600">{a.due_date || "No due date"}</span>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setGrading({ id: a.assignment_id, title: a.title || "" })}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-accent text-white hover:bg-accent-hover transition-all cursor-pointer"
            >
              Grade
            </button>
            <button
              onClick={() => remove(a.assignment_id)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ));

  return (
    <div id="assignments">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Manage Assignments</h2>
        <div className="flex gap-2">
          <CourseSelect id="viewAssignmentsCourseSelect" value={viewCourse} onChange={setViewCourse} className="p-2 border rounded-sm" />
          <button onClick={openModal} className="bg-accent text-white px-4 py-2 rounded-sm hover:bg-accent-hover cursor-pointer">
            Create Assignment
          </button>
        </div>
      </div>

      {modalOpen && (
        <div id="createAssignmentModal" className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create New Assignment</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-600 cursor-pointer">Close</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Course</label>
                <CourseSelect id="assignmentCourseSelect" value={courseId} onChange={setCourseId} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assignment Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assignment Link</label>
                <input type="url" value={link} onChange={(e) => setLink(e.target.value)} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="p-2 border rounded-sm" />
              </div>
              <div className="text-right mt-4">
                <button onClick={create} disabled={creating} className="bg-accent text-white px-4 py-2 rounded-sm hover:bg-accent-hover cursor-pointer disabled:opacity-70">
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Assignment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4">Existing Assignments</h3>
        <div id="assignmentsList" className="space-y-4">{list}</div>
      </div>

      {grading && (
        <GradingModal
          key={grading.id}
          assignmentId={grading.id}
          title={grading.title}
          onClose={() => setGrading(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

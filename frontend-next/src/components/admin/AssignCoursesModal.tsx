"use client";

import { useState } from "react";
import { errText } from "./ui";
import type { AdminCourse } from "@/lib/admin/types";

export interface AssignableCourse {
  course_id: number | string;
  /** enrollment id (students) — needed to unassign; teachers unassign by course id */
}

interface Props {
  title: string;
  subtitle: string;
  courses: AdminCourse[];
  /** Set of course ids currently assigned. */
  assignedIds: Set<string>;
  onAssign: (courseId: number) => Promise<void>;
  onUnassign: (courseId: number) => Promise<void>;
  onClose: () => void;
}

/** Shared by "assign courses to student" and "assign courses to teacher" (identical UI in the old page). */
export default function AssignCoursesModal({ title, subtitle, courses, assignedIds, onAssign, onUnassign, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [msg, setMsg] = useState<{ text: string; color: string }>({ text: "", color: "#1a1a2e" });
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const q = search.toLowerCase();
  
  const groups = new Map<string, AdminCourse[]>();
  for (const c of courses) {
    if (degreeFilter && c.degree_program !== degreeFilter) continue;
    if (departmentFilter && c.department !== departmentFilter) continue;
    
    const name = c.course_name || "Untitled Course";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(c);
  }

  const visibleGroups = Array.from(groups.keys()).filter((name) => name.toLowerCase().includes(q));
  const visibleCourses = selectedGroup ? (groups.get(selectedGroup) || []) : [];

  async function toggle(course: AdminCourse, selected: boolean) {
    setMsg({ text: selected ? "Unassigning course..." : "Assigning course...", color: "#1a1a2e" });
    try {
      await (selected ? onUnassign(course.course_id) : onAssign(course.course_id));
      setMsg({ text: selected ? "Course unassigned successfully." : "Course assigned successfully.", color: "#18703a" });
    } catch (err) {
      setMsg({ text: errText(err) || (selected ? "Could not unassign course" : "Could not assign course"), color: "#be123c" });
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/40 px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-pink-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(135deg, #1a1a2e, #e94560)" }}>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
            <p className="text-sm text-pink-100">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg px-3 py-2 font-bold transition cursor-pointer"
            style={{ width: "auto", marginBottom: 0, background: "transparent", border: "none" }}
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">{selectedGroup ? `Select Section for ${selectedGroup}` : "Search Courses"}</label>
              <div className="flex gap-2">
                {selectedGroup && (
                  <button onClick={() => setSelectedGroup(null)} className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 font-bold transition">← Back</button>
                )}
                {!selectedGroup && (
                  <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by course title..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={{ marginBottom: 0 }}
                  />
                )}
              </div>
            </div>
            
            {!selectedGroup && (
              <div className="flex gap-3">
                <select value={degreeFilter} onChange={(e) => setDegreeFilter(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent flex-1">
                  <option value="">All Degrees</option>
                  <option value="BS">BS</option>
                  <option value="MS">MS</option>
                  <option value="PhD">PhD</option>
                </select>
                <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent flex-1">
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                </select>
              </div>
            )}
          </div>
          
          {!selectedGroup ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {visibleGroups.length === 0 ? (
                <div className="col-span-full text-gray-400">No matching courses found.</div>
              ) : (
                visibleGroups.map((groupName) => {
                  const items = groups.get(groupName) || [];
                  const assignedCount = items.filter(c => assignedIds.has(String(c.course_id))).length;
                  return (
                    <button
                      key={groupName}
                      type="button"
                      onClick={() => setSelectedGroup(groupName)}
                      className="text-left rounded-lg border px-4 py-3 font-semibold transition cursor-pointer hover:border-accent"
                      style={{ marginBottom: 0, width: "100%", background: "#fff7f9", color: "#1a1a2e", borderColor: assignedCount > 0 ? "#1a1a2e" : "#f7c8d0" }}
                    >
                      <span className="block text-sm font-bold">{groupName}</span>
                      <span className="block text-xs mt-0.5 text-gray-500">{items.length} section{items.length !== 1 ? 's' : ''} available</span>
                      {assignedCount > 0 && <span className="block text-xs mt-1 font-semibold text-accent">{assignedCount} assigned</span>}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {visibleCourses.length === 0 ? (
                <div className="col-span-full text-gray-400">No sections found.</div>
              ) : (
                visibleCourses.map((course) => {
                  const selected = assignedIds.has(String(course.course_id));
                  return (
                    <button
                      key={course.course_id}
                      type="button"
                      onClick={() => toggle(course, selected)}
                      className="text-left rounded-lg border px-4 py-3 font-semibold transition cursor-pointer"
                      style={{
                        marginBottom: 0, width: "100%",
                        background: selected ? "#1a1a2e" : "#fff7f9",
                        color: selected ? "#ffffff" : "#1a1a2e",
                        borderColor: selected ? "#1a1a2e" : "#f7c8d0",
                      }}
                    >
                      <span className="block text-sm font-bold">{course.course_name || "Untitled Course"}{course.section_name ? ` (${course.section_name})` : ""}</span>
                      <span className="block text-xs mt-0.5" style={{ color: selected ? "#fbd0d8" : "#6b7280" }}>
                        Teacher: {course.teacher_name || "Unassigned"}
                      </span>
                      <span className="block text-xs mt-1 font-semibold" style={{ color: selected ? "#fbd0d8" : "#e94560" }}>
                        {selected ? "Selected - click to unassign" : "Click to assign"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
          
          <p className="mt-4 text-sm font-semibold" style={{ color: msg.color }}>{msg.text}</p>
        </div>
      </div>
    </div>
  );
}

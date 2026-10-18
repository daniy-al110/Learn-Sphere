"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast-store";
import { useSession } from "@/hooks/useSession";
import { API_BASE_URL } from "@/lib/config";
import { Icon } from "../layout/icons";
import { useTeacherCourses } from "./TeacherCoursesProvider";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase for direct client-side storage uploads
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Lecture {
  lecture_id: number;
  course_id: number;
  title: string;
  description: string;
  content_type: string;
  media_url: string;
  duration_minutes: number | null;
  upload_date: string;
}

export default function LecturesView() {
  const { session } = useSession();
  const { courses, loading: coursesLoading } = useTeacherCourses();
  
  const [selectedCourse, setSelectedCourse] = useState<number | "">("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "MP4",
    media_url: "",
    duration_minutes: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedCourse) {
      fetchLectures(selectedCourse as number);
    } else {
      setLectures([]);
    }
  }, [selectedCourse]);

  async function fetchLectures(courseId: number) {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/lectures?course_id=${courseId}&teacher_id=${session.userId}`);
      const data = await res.json();
      if (data.success) {
        setLectures(data.lectures);
      } else {
        toast.error("Failed to fetch lectures");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this lecture?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/lectures/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Lecture deleted");
        setLectures((prev) => prev.filter((l) => l.lecture_id !== id));
      } else {
        toast.error("Failed to delete lecture");
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return toast.error("Please select a course first");

    setUploading(true);
    let finalMediaUrl = formData.media_url;

    try {
      if (formData.content_type === "MP4" && videoFile) {
        toast.info("Uploading video... This may take a moment.");
        const fileExt = videoFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `lectures/${selectedCourse}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("videos")
          .upload(filePath, videoFile);

        if (uploadError) {
          throw new Error("Failed to upload video to storage bucket. " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(filePath);
        finalMediaUrl = publicUrlData.publicUrl;
        toast.success("Upload complete!");
      }

      if (!finalMediaUrl) {
        throw new Error("Media URL or video file is required.");
      }

      const res = await fetch(`${API_BASE_URL}/api/lectures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          media_url: finalMediaUrl,
          course_id: selectedCourse,
          teacher_id: session.userId,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Lecture saved successfully");
        setShowModal(false);
        setVideoFile(null);
        setFormData({ title: "", description: "", content_type: "MP4", media_url: "", duration_minutes: "" });
        fetchLectures(selectedCourse as number);
      } else {
        throw new Error(data.error || "Failed to save lecture record");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lectures & Materials</h1>
          <p className="text-sm text-gray-500">Upload and organize your course video lectures.</p>
        </div>
        <button
          onClick={() => {
            if (!selectedCourse) return toast.error("Select a course first to add a lecture");
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          <Icon name="plus" className="w-5 h-5" />
          Add Lecture
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-1/3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : "")}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-accent focus:ring-accent"
              disabled={coursesLoading}
            >
              <option value="">-- Select Course --</option>
              {courses.map((c) => (
                <option key={String(c.course_id)} value={String(c.course_id)}>
                  {c.course_name as string}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-0">
          {!selectedCourse ? (
            <div className="p-12 text-center text-gray-500">Please select a course to view lectures.</div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : lectures.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Icon name="play-circle" className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No lectures yet</h3>
              <p className="text-sm text-gray-500 max-w-sm">You haven't uploaded any video lectures for this course. Click the "Add Lecture" button to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lectures.map((l) => (
                <div key={l.lecture_id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center relative group">
                    <Icon name={l.content_type === 'YouTube' ? "video" : "play-circle"} className="w-8 h-8 text-gray-400 group-hover:text-accent transition-colors" />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      {l.duration_minutes ? `${l.duration_minutes}m` : l.content_type}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 truncate">{l.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{l.description || "No description provided."}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Uploaded {new Date(l.upload_date).toLocaleDateString()}</span>
                      <a href={l.media_url} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                        <Icon name="external-link" className="w-3 h-3" /> Watch
                      </a>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleDelete(l.lecture_id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Lecture"
                    >
                      <Icon name="trash-2" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Add New Lecture</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="lectureForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-accent focus:ring-accent"
                    placeholder="e.g. Introduction to Calculus"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-accent focus:ring-accent"
                    placeholder="Brief summary of what this lecture covers..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                    <select
                      value={formData.content_type}
                      onChange={(e) => setFormData({ ...formData, content_type: e.target.value, media_url: "" })}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-accent focus:ring-accent"
                    >
                      <option value="MP4">Video File Upload</option>
                      <option value="YouTube">YouTube Link</option>
                      <option value="Recording">Other Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-accent focus:ring-accent"
                      placeholder="e.g. 45"
                    />
                  </div>
                </div>

                {formData.content_type === "MP4" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video File <span className="text-red-500">*</span></label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <Icon name="upload" className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-accent hover:text-accent-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="video/mp4,video/webm" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">MP4, WEBM up to 500MB</p>
                        {videoFile && <p className="text-sm font-semibold text-accent mt-2">{videoFile.name}</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL <span className="text-red-500">*</span></label>
                    <input
                      type="url"
                      required
                      value={formData.media_url}
                      onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-accent focus:ring-accent"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="lectureForm"
                disabled={uploading}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Icon name="refresh-cw" className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Lecture"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

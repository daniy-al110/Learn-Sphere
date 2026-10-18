"use client";
import { API_BASE_URL } from "@/lib/config";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast-store";
import { useSession } from "@/hooks/useSession";

interface Meeting {
  meeting_id: number;
  title: string;
  description: string;
  meeting_type: "Online" | "Offline";
  start_time: string;
  end_time: string;
  location_or_url: string;
}

interface Attendee {
  meeting_id: number;
  student_id: number;
  student_name: string;
  status: "Pending" | "Attended" | "Absent";
}

export default function MeetingsView() {
  const { session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingType, setMeetingType] = useState<"Online" | "Offline">("Online");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationOrUrl, setLocationOrUrl] = useState("");

  // Attendees modal
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  useEffect(() => {
    if (session.userId) {
      fetchMeetings();
    }
  }, [session]);

  async function fetchMeetings() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings?role=${session.role}&user_id=${session.userId}`);
      const data = await res.json();
      if (data.success) {
        setMeetings(data.meetings);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault();
    try {
      let finalUrl = locationOrUrl;
      if (meetingType === 'Online') {
        const roomId = 'ls-class-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        finalUrl = '/meeting/' + roomId;
      }
      
      const payload = {
        title,
        description,
        host_id: session.userId,
        host_type: session.role,
        meeting_type: meetingType,
        start_time: startTime,
        end_time: endTime,
        location_or_url: finalUrl,
        attendees: [] // you could optionally add student IDs here
      };

      const res = await fetch(`${API_BASE_URL}/api/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Meeting scheduled successfully");
        setIsModalOpen(false);
        fetchMeetings();
        // Reset form
        setTitle(""); setDescription(""); setStartTime(""); setEndTime(""); setLocationOrUrl("");
      } else {
        toast.error("Failed to schedule meeting");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  async function handleDeleteMeeting(id: number) {
    if (!confirm("Delete this meeting?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Meeting deleted");
        fetchMeetings();
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  async function openAttendees(meetingId: number) {
    setSelectedMeeting(meetingId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/attendees`);
      const data = await res.json();
      if (data.success) {
        setAttendees(data.attendees);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendees");
    }
  }

  async function updateAttendance(studentId: number, status: string) {
    if (!selectedMeeting) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${selectedMeeting}/attendees/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Attendance updated");
        setAttendees(prev => prev.map(a => a.student_id === studentId ? { ...a, status: status as any } : a));
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  if (loading) return <div className="p-6 animate-pulse text-gray-500">Loading meetings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Manage Meetings</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent text-white px-4 py-2 rounded hover:bg-accent-hover transition-colors"
        >
          Schedule Meeting
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded border border-dashed">
            No meetings scheduled yet.
          </div>
        ) : meetings.map(m => (
          <div key={m.meeting_id} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{m.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${m.meeting_type === 'Online' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                  {m.meeting_type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{m.description}</p>
              
              <div className="space-y-1 mb-4 text-sm">
                <div className="flex items-center text-gray-700">
                  <span className="w-5 font-bold">⏱</span> 
                  {new Date(m.start_time).toLocaleString()} - {new Date(m.end_time).toLocaleTimeString()}
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="w-5 font-bold">📍</span> 
                  {m.meeting_type === 'Online' ? (
                    <a href={m.location_or_url} className="text-blue-600 hover:underline break-all">Start Live Class</a>
                  ) : (
                    <span>{m.location_or_url}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button 
                onClick={() => openAttendees(m.meeting_id)}
                className="text-accent hover:underline text-sm font-medium"
              >
                View Attendance
              </button>
              <button 
                onClick={() => handleDeleteMeeting(m.meeting_id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4">Schedule a Meeting</h3>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded rows-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={meetingType} onChange={e => setMeetingType(e.target.value as any)} className="w-full border p-2 rounded bg-white">
                    <option value="Online">Online (Native LMS Class)</option>
                    <option value="Offline">Offline (In-person)</option>
                  </select>
                </div>
                {meetingType === 'Offline' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Location (Room Number)</label>
                    <input required type="text" value={locationOrUrl} onChange={e => setLocationOrUrl(e.target.value)} className="w-full border p-2 rounded" placeholder="Room 101" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input required type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input required type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border p-2 rounded" />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {selectedMeeting !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4">Meeting Attendance</h3>
            <div className="flex-1 overflow-auto">
              {attendees.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students invited to this meeting yet.</p>
              ) : (
                <ul className="divide-y">
                  {attendees.map(a => (
                    <li key={a.student_id} className="py-3 flex justify-between items-center">
                      <span className="font-medium text-gray-800">{a.student_name}</span>
                      <select 
                        value={a.status} 
                        onChange={e => updateAttendance(a.student_id, e.target.value)}
                        className={`text-sm p-1 rounded border font-semibold outline-none ${
                          a.status === 'Attended' ? 'bg-green-50 text-green-700 border-green-200' : 
                          a.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Attended">Attended</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 pt-4 border-t text-right shrink-0">
              <button onClick={() => setSelectedMeeting(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

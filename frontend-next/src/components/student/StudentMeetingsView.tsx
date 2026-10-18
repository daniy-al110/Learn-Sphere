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
  attendance_status: "Pending" | "Attended" | "Absent";
}

export default function StudentMeetingsView() {
  const { session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session.userId) {
      fetchMeetings();
    }
  }, [session]);

  async function fetchMeetings() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings?role=student&user_id=${session.userId}`);
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

  if (loading) return <div className="p-6 animate-pulse text-gray-500">Loading your meetings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">My Meetings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {meetings.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded border border-dashed">
            You don't have any upcoming meetings.
          </div>
        ) : meetings.map(m => {
          const isOnline = m.meeting_type === 'Online';
          const isAttended = m.attendance_status === 'Attended';
          const isAbsent = m.attendance_status === 'Absent';
          
          return (
            <div key={m.meeting_id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-xl text-gray-800">{m.title}</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${isOnline ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                  {m.meeting_type}
                </span>
              </div>
              <p className="text-gray-600 mb-5">{m.description || "No description provided."}</p>
              
              <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-md border border-gray-100">
                <div className="flex items-center text-gray-700">
                  <span className="w-6 font-bold text-lg">⏱</span> 
                  <span className="font-medium">{new Date(m.start_time).toLocaleString()} - {new Date(m.end_time).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="w-6 font-bold text-lg">📍</span> 
                  {isOnline ? (
                    <a href={m.location_or_url} className="text-blue-600 hover:underline font-medium break-all">Join Live Class</a>
                  ) : (
                    <span className="font-medium">{m.location_or_url}</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Attendance Status:</span>
                <span className={`text-sm font-bold px-3 py-1.5 rounded-md ${
                  isAttended ? 'bg-green-100 text-green-800' : 
                  isAbsent ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {m.attendance_status || "Pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

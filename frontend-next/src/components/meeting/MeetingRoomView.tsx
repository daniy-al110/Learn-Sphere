"use client";

import { useSession } from "@/hooks/useSession";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast-store";

export default function MeetingRoomView({ roomId }: { roomId: string }) {
  const { session, ready } = useSession();
  const router = useRouter();
  const [hasLeft, setHasLeft] = useState(false);

  if (!ready) {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading class...</div>;
  }

  if (!session.userName) {
    // If not logged in, force them out
    router.replace("/login");
    return null;
  }

  const isTeacher = session.role === "teacher" || session.role === "admin";

  const handleReadyToClose = () => {
    setHasLeft(true);
    toast.success("You have left the class.");
    router.back(); // Go back to the dashboard
  };

  if (hasLeft) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h2 className="text-2xl font-bold mb-4">You left the class.</h2>
        <button onClick={() => router.back()} className="px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col">
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center shadow-md z-10 relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent/20 rounded text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">Live Class: {roomId}</h1>
        </div>
        <div>
          <span className="text-sm text-gray-300 mr-4">Logged in as {session.userName}</span>
          <button onClick={handleReadyToClose} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors">
            Exit
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomId}
          configOverwrite={{
            startWithAudioMuted: !isTeacher,
            startWithVideoMuted: !isTeacher,
            disableModeratorIndicator: false,
            enableEmailInStats: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          userInfo={{
            displayName: session.userName,
            email: session.userEmail,
          }}
          onApiReady={(externalApi) => {
            // Attach event listeners
            externalApi.addListener("readyToClose", handleReadyToClose);
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
            iframeRef.style.border = "none";
          }}
        />
      </div>
    </div>
  );
}

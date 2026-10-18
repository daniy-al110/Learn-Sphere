"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "@/hooks/useSession";
import { changePassword } from "@/lib/student/api";

const RULES = [
  { label: "8+ Characters", test: (v: string) => v.length >= 8 },
  { label: "1+ Uppercase Letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "1+ Number", test: (v: string) => /[0-9]/.test(v) },
  { label: "1+ Special Character (@$!%*?&_#)", test: (v: string) => /[@$!%*?&_#]/.test(v) },
];

function PasswordField(props: {
  id: string; label: string; value: string; onChange: (v: string) => void; children?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor={props.id}>{props.label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"} id={props.id} required placeholder="••••••••"
          value={props.value} onChange={(e) => props.onChange(e.target.value)}
          className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-hidden focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-hidden cursor-pointer flex items-center justify-center w-auto h-auto m-0 p-0 bg-transparent border-none"
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
      {props.children}
    </div>
  );
}

export default function ChangePasswordView({
  role = "student",
  fallbackUserId = "",
}: {
  role?: "student" | "teacher" | "admin";
  fallbackUserId?: string;
}) {
  const { session } = useSession();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!RULES.every((r) => r.test(newPw))) {
      return setMessage({ text: "Please satisfy all password strength criteria.", ok: false });
    }
    if (newPw !== confirmPw) {
      return setMessage({ text: "New passwords do not match!", ok: false });
    }
    try {
      const res = await changePassword(session.userId ?? fallbackUserId, oldPw, newPw, role);
      if (!res.ok || !res.body.success) {
        setMessage({ text: res.body.error || "Password update failed.", ok: false });
      } else {
        setMessage({ text: "Password updated successfully!", ok: true });
        setOldPw("");
        setNewPw("");
        setConfirmPw("");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setMessage({ text: "Error connecting to the server.", ok: false });
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto" id="change-password">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Change Password</h2>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <PasswordField id="oldPassword" label="Current Password" value={oldPw} onChange={setOldPw} />
          <PasswordField id="newPassword" label="New Password" value={newPw} onChange={setNewPw}>
            <div className="mt-2 text-xs space-y-1">
              {RULES.map((r) => {
                const ok = r.test(newPw);
                return (
                  <div key={r.label} className={`flex items-center gap-1 transition-all duration-200 ${ok ? "text-green-600" : "text-red-600"}`}>
                    <span>{ok ? "✅" : "❌"}</span> {r.label}
                  </div>
                );
              })}
            </div>
          </PasswordField>
          <PasswordField id="confirmPassword" label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} />
          <button
            type="submit"
            className="hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-semibold w-full transition cursor-pointer"
            style={{ backgroundColor: "#e94560" }}
          >
            Update Password
          </button>
        </form>
        {message && <p className={`mt-4 text-center ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
      </div>
    </div>
  );
}

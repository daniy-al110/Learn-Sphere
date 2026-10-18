"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/login/login.module.css";
import { loginRequest, passwordResetRequest } from "@/lib/api";
import { parseLoginResponse, roleHome, saveSession } from "@/lib/auth";
import { toast } from "@/lib/toast-store";

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export default function LoginForm() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "forgot">("login");

  // login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // forgot-password form
  const [lmsEmail, setLmsEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const res = await loginRequest(email.toLowerCase().trim(), password);
      console.log("✅ Login HTTP:", res.status, res.body);

      if (!res.ok) {
        const msg = typeof res.body.error === "string" && res.body.error ? res.body.error : res.statusText || "Login failed";
        toast.error("Login failed: " + msg);
        return;
      }

      const parsed = parseLoginResponse(res.body);
      if (!parsed.ok) {
        toast.error(parsed.error);
        return;
      }

      saveSession(parsed.role, parsed.user, parsed.userId);
      console.log("User logged in:", { role: parsed.role, userId: parsed.userId, user: parsed.user });
      router.push(roleHome(parsed.role));
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error("Login failed: " + errMsg(error, "Network error"));
    } finally {
      // original called loginForm.reset() after every attempt
      setEmail("");
      setPassword("");
    }
  }

  async function handleForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lms = lmsEmail.toLowerCase().trim();
    const personal = personalEmail.toLowerCase().trim();

    if (!lms || !personal) {
      toast.warning("Please fill in all fields.");
      return;
    }

    try {
      const res = await passwordResetRequest(lms, personal);
      if (!res.ok || !res.body.success) {
        const msg = typeof res.body.error === "string" && res.body.error ? res.body.error : res.statusText || "Password reset failed";
        toast.error(msg);
        return;
      }
      toast.success(
        (typeof res.body.message === "string" && res.body.message) || "A temporary password has been sent to your personal email.",
      );
      setView("login");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Password reset failed: " + errMsg(error, "Network error"));
    } finally {
      setLmsEmail("");
      setPersonalEmail("");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.authContainer} id="authContainer">
        {/* Login */}
        <div
          className={`${styles.formContainer} ${styles.loginContainer}`}
          style={view === "forgot" ? { display: "none" } : undefined}
        >
          <form className="w-full" id="loginForm" onSubmit={handleLogin}>
            <h2 className={`${styles.title} text-3xl mb-6`}>Log In</h2>

            <input
              type="email"
              className={styles.authInput}
              id="loginEmail"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                className={`${styles.authInput} ${styles.passwordInput}`}
                id="loginPassword"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                id="toggleLoginPassword"
                className={styles.toggleBtn}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button type="submit" className={styles.authBtn}>LOG IN</button>
            <p className="mt-4 text-sm text-center">
              <button type="button" id="forgotLink" className={styles.linkBtn} onClick={() => setView("forgot")}>
                Forgot Password?
              </button>
            </p>
          </form>
        </div>

        {/* Forgot password */}
        <div
          className={`${styles.formContainer} ${styles.forgotContainer}`}
          style={{ display: view === "forgot" ? "block" : "none" }}
        >
          <form className="w-full" id="forgotForm" onSubmit={handleForgot}>
            <h2 className={`${styles.title} text-3xl mb-6`}>Reset Password</h2>



            <input
              type="email"
              className={styles.authInput}
              id="forgotLmsEmail"
              placeholder="LMS Institutional Email"
              required
              value={lmsEmail}
              onChange={(e) => setLmsEmail(e.target.value)}
            />
            <input
              type="email"
              className={styles.authInput}
              id="forgotPersonalEmail"
              placeholder="Personal Email (to receive password)"
              required
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
            />

            <button type="submit" className={styles.authBtn}>Send New Password</button>
            <p className="mt-4 text-sm text-center">
              Remembered?{" "}
              <button type="button" id="backToLogin" className={styles.linkBtn} onClick={() => setView("login")}>
                Log in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

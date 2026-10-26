"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "@/lib/toast-store";
import {
  X,
  Copy,
  CheckCircle,
  Share2,
  RefreshCw,
  Lock,
  Globe,
  AlertTriangle,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

interface ShareClassModalProps {
  courseId: number;
  courseName: string;
  onClose: () => void;
}

interface TokenInfo {
  token: string;
  isPublicLinkEnabled: boolean;
  updatedAt?: string;
}

export default function ShareClassModal({
  courseId,
  courseName,
  onClose,
}: ShareClassModalProps) {
  const [loading, setLoading] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/courses/token-info/${courseId}`);
        const data = await res.json();
        if (data.success) {
          setTokenInfo(data.tokenInfo);
        } else {
          toast.error("Could not fetch class link");
        }
      } catch (e) {
        toast.error("Failed to load class link");
      } finally {
        setLoading(false);
      }
    }
    fetchTokenInfo();
  }, [courseId]);

  const joinUrl = typeof window !== "undefined" && tokenInfo?.token
    ? `${window.location.origin}/join?token=${tokenInfo.token}`
    : "";

  const handleCopy = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("Class link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!joinUrl) return;
    const text = encodeURIComponent(
      `Join my class "${courseName}" on LearnSphere LMS:\n${joinUrl}\n\nClick the link to join directly!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleRegenerate = async () => {
    if (!confirm("Are you sure? Regenerating will invalidate any previously shared links immediately.")) {
      return;
    }
    try {
      setRegenerating(true);
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/regenerate-token`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setTokenInfo(data.tokenInfo);
        toast.success("New secure link generated! Old link is now revoked.");
      } else {
        toast.error("Failed to regenerate link");
      }
    } catch (e) {
      toast.error("Network error while regenerating link");
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleInviteOnly = async () => {
    if (!tokenInfo) return;
    const nextState = !tokenInfo.isPublicLinkEnabled;
    try {
      setToggling(true);
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/toggle-public-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState })
      });
      const data = await res.json();
      if (data.success) {
        setTokenInfo(data.tokenInfo);
        toast.info(nextState ? "Public link joining enabled" : "Switched to Invite-Only mode");
      } else {
        toast.error("Failed to update link setting");
      }
    } catch (e) {
      toast.error("Network error while updating link status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-white/15 p-6 sm:p-8 shadow-2xl text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Share Class Link</h3>
            <p className="text-xs text-slate-400 mt-0.5">{courseName}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading secure class link...</div>
        ) : (
          <div className="space-y-5">
            {/* Security Pill */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Protected by High-Entropy Token & Anti-Brute-Force</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Active
              </span>
            </div>

            {/* Invite-Only Toggle Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  {tokenInfo?.isPublicLinkEnabled ? (
                    <>
                      <Globe className="w-4 h-4 text-pink-400" />
                      <span>Public Link Joining: Enabled</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Invite-Only Mode: Enabled</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {tokenInfo?.isPublicLinkEnabled
                    ? "Students with this link can join directly."
                    : "Public link is disabled. Only Admin can add students."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleInviteOnly}
                disabled={toggling}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tokenInfo?.isPublicLinkEnabled
                    ? "bg-slate-800 text-slate-300 hover:text-white border border-white/10"
                    : "bg-pink-500 text-white shadow-md shadow-pink-500/30"
                }`}
              >
                {toggling ? "Saving..." : tokenInfo?.isPublicLinkEnabled ? "Disable Link" : "Enable Link"}
              </button>
            </div>

            {/* Link Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Direct Class Join Link
              </label>
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950 border border-white/10">
                <input
                  type="text"
                  readOnly
                  value={joinUrl}
                  className="flex-1 bg-transparent px-2.5 text-xs font-mono text-slate-200 focus:outline-none truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/30 transition-all cursor-pointer shrink-0"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="py-3 px-4 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
                <span>{regenerating ? "Regenerating..." : "Regenerate Link"}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              If you regenerate the link, the previous link will immediately stop working for anyone who tries it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

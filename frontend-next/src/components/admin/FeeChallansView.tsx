"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/layout/icons";
import { useAsync } from "@/hooks/useAsync";
import {
  fetchFeeChallans, generateBulkFeeChallans, generateFeeChallan, updateFeeChallanStatus,
} from "@/lib/admin/api";
import { getDefaultDueDate, getDefaultSemester } from "@/lib/admin/helpers";
import { challanPrintHtml, formatPKR } from "@/lib/student/helpers";
import type { FeeChallan } from "@/lib/student/types";
import { confirmDialog, toast } from "@/lib/toast-store";

const none = null;
const TH = "px-6 py-3 border-b text-left text-sm font-semibold text-white";
const HEAD_BG = { background: "linear-gradient(135deg, #1a1a2e, #16213e)" };
const LINK_BTN = { background: "none", border: "none", padding: 0, width: "auto", marginBottom: 0 } as const;

function printChallan(challan: FeeChallan) {
  const win = window.open("", "_blank");
  if (!win) return toast.error("Pop-up blocked. Please allow pop-ups to print the challan.");
  win.document.write(challanPrintHtml(challan));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}

export default function FeeChallansView() {
  const { data, error, loading, reload } = useAsync(fetchFeeChallans, none);

  const [studentId, setStudentId] = useState("");
  const [semester, setSemester] = useState(getDefaultSemester);
  const [dueDate, setDueDate] = useState(getDefaultDueDate);
  const [reissue, setReissue] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let challans = [...(data ?? [])];
    if (statusFilter) challans = challans.filter((c) => c.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q)
      challans = challans.filter((c) =>
        [c.challan_number, c.student_name, c.student_email, c.semester].some((v) => String(v || "").toLowerCase().includes(q)),
      );
    return challans;
  }, [data, search, statusFilter]);

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!studentId || !semester || !dueDate) return toast.warning("Student ID, semester, and due date are required.");
    setSubmitting(true);
    try {
      const challan = await generateFeeChallan({ student_id: Number(studentId), semester, due_date: dueDate, reissue });
      toast.success(`Challan generated: ${challan.challan_number}`);
      setStudentId("");
      setReissue(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function generateBulk() {
    const sem = semester || getDefaultSemester();
    const due = dueDate || getDefaultDueDate();
    const ok = await confirmDialog.confirm({
      title: "Generate Bulk Challans",
      message: `Generate fee challans for all enrolled students for ${sem}?`,
      confirmText: "Generate",
      type: "info",
    });
    if (!ok) return;
    try {
      const res = await generateBulkFeeChallans({ semester: sem, due_date: due, reissue });
      toast.success(`Issued ${res.issued.length} challan(s). Skipped ${res.skipped.length}.`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function setStatus(challan: FeeChallan) {
    try {
      await updateFeeChallanStatus(challan.challan_id!, challan.status === "Paid" ? "pending" : "paid");
      toast.success("Challan status updated.");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  let rows: React.ReactNode;
  if (loading) rows = <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading challans...</td></tr>;
  else if (error) rows = <tr><td colSpan={7} className="px-6 py-8 text-center text-red-500">{error.message}</td></tr>;
  else if (filtered.length === 0) rows = <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No fee challans found.</td></tr>;
  else
    rows = filtered.map((c) => (
      <tr key={c.challan_number} className="hover:bg-gray-50 border-b border-gray-100 transition">
        <td className="px-6 py-4 text-sm font-mono text-gray-900">{c.challan_number}</td>
        <td className="px-6 py-4 text-sm">
          <div className="font-semibold text-gray-900">{c.student_name || "Unknown"}</div>
          <div className="text-xs text-gray-500">{c.student_email || ""}</div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-700">{c.semester || "Current Semester"}</td>
        <td className="px-6 py-4 text-sm text-gray-700">{c.total_credit_hours ?? "-"}</td>
        <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatPKR(c.total_amount || c.amount)}</td>
        <td className="px-6 py-4 text-sm">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {c.status}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => printChallan(c)} className="text-blue-600 hover:text-blue-900 font-bold hover:underline cursor-pointer" style={LINK_BTN}>
              Print
            </button>
            <button onClick={() => setStatus(c)} className="text-green-600 hover:text-green-900 font-bold hover:underline cursor-pointer" style={LINK_BTN}>
              {c.status === "Paid" ? "Mark Pending" : "Mark Paid"}
            </button>
          </div>
        </td>
      </tr>
    ));

  return (
    <div id="feeChallans">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800" style={{ marginBottom: 0 }}>Fee Challan Management</h1>
          <p className="text-gray-600 mt-1">Generate semester fee challans from enrolled courses and credit hours.</p>
        </div>
        <button
          onClick={generateBulk}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-4 rounded-lg shadow-xs transition cursor-pointer"
          style={{ backgroundColor: "#e94560", width: "auto", marginBottom: 0 }}
        >
          <Icon name="receipt" className="w-4 h-4" />
          Generate Semester Bulk
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Issue Challan</h2>
          <form onSubmit={generate} className="space-y-4" style={{ boxShadow: "none", padding: 0, marginBottom: 0 }}>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Student ID *</label>
              <input type="number" required placeholder="e.g. 1" value={studentId} onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={{ marginBottom: 0 }} />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Semester *</label>
              <input type="text" required placeholder="Spring 2026" value={semester} onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={{ marginBottom: 0 }} />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Due Date *</label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={{ marginBottom: 0 }} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={reissue} onChange={(e) => setReissue(e.target.checked)} className="w-4 h-4" style={{ width: "auto", marginBottom: 0 }} />
              Reissue even if this semester already has a challan
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-white hover:bg-accent-hover font-semibold py-2.5 px-5 rounded-lg transition cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: "#e94560", width: "auto", display: "inline-flex", marginBottom: 0 }}
            >
              Generate Challan
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Search Challans</label>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, challan ID, or semester..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={{ marginBottom: 0 }} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-hidden focus:border-accent" style={{ marginBottom: 0 }}>
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full" id="feeChallanTable">
              <thead>
                <tr style={HEAD_BG}>
                  {["Challan", "Student", "Semester", "Credits", "Amount", "Status", "Actions"].map((h) => (
                    <th key={h} className={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody id="feeChallanTableBody">{rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

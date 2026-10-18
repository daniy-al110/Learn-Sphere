"use client";

import { useRef, useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/hooks/useSession";
import { fetchTranscript } from "@/lib/student/api";
import { averageCgpa, rowCgpa } from "@/lib/student/helpers";
import { toast } from "@/lib/toast-store";

export default function TranscriptView() {
  const { session } = useSession();
  const studentId = session.userId ?? "";
  const { data: rows, error, loading } = useAsync(fetchTranscript, studentId);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  if (error) console.error("❌ Failed to fetch transcript:", error);

  /** html2canvas + jsPDF, as in downloadTranscriptPDF() — now installed as real dependencies. */
  async function downloadPdf() {
    setDownloading(true);
    try {
      if (!containerRef.current) throw new Error("Transcript container not found");
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(containerRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const props = pdf.getImageProperties(imgData);
      const pdfHeight = (props.height * pdfWidth) / props.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`transcript_${studentId || "student"}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate PDF. Check console for details.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto" id="transcript">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Transcript</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Average CGPA: <span id="avgCgpa">{rows && rows.length ? averageCgpa(rows) : "N/A"}</span>
          </div>
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="px-4 py-2 bg-accent text-white rounded-sm hover:bg-accent-hover cursor-pointer disabled:opacity-60"
          >
            Download PDF
          </button>
        </div>
      </div>
      <div ref={containerRef} className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left" style={{ backgroundColor: "#fff0f2", color: "#e94560" }}>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody>
            {loading || !rows ? null : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">No courses enrolled yet.</td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const n = rowCgpa(r);
                const cgpaStr = !isNaN(n) ? ` (${n.toFixed(2)})` : "";
                const status = r.grade && r.grade !== "F" ? "Pass" : r.grade === "F" ? "Fail" : "Enrolled";
                return (
                  <tr key={i}>
                    <td className="px-4 py-3">{r.name || "Unknown Course"}</td>
                    <td className="px-4 py-3">3</td>
                    <td className="px-4 py-3">{status}</td>
                    <td className="px-4 py-3">{r.grade ? r.grade + cgpaStr : "N/A"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

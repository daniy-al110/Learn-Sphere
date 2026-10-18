import type { AttendanceCourse, Assignment, Course, FeeChallan, QuizSummary, TranscriptRow } from "./types";

/* ───────────── formatting ───────────── */

export function formatPkDisplay(isoValue?: string | null): string {
  if (!isoValue) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-PK", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoValue));
  } catch {
    return isoValue;
  }
}

export const formatPKR = (amount: unknown) => `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;

export function initialsOf(name: string): string {
  if (!name) return "S";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/* ───────────── CGPA ───────────── */

/** Map total (0-100) to cgpa (same rules as the teacher dashboard). */
export function calculateCgpaFromTotal(total: unknown): number | null {
  const t = Number(total);
  if (isNaN(t)) return null;
  if (t >= 90) return 4.0;
  if (t >= 86) return 3.67;
  if (t >= 82) return 3.33;
  if (t >= 78) return 3.0;
  if (t >= 74) return 2.67;
  if (t >= 70) return 2.33;
  if (t >= 66) return 2.0;
  if (t >= 62) return 1.67;
  if (t >= 58) return 1.33;
  if (t >= 50) return 1.0;
  return 0.0;
}

/** Numeric cgpa of a transcript row, falling back to marks -> cgpa; NaN when unavailable. */
export function rowCgpa(r: TranscriptRow): number {
  let n = parseFloat(String(r.cgpa));
  if (isNaN(n) && r.total_marks != null) {
    const c = calculateCgpaFromTotal(r.total_marks);
    n = c != null ? Number(c) : NaN;
  }
  return n;
}

export function averageCgpa(rows: TranscriptRow[]): string {
  const nums = rows.map(rowCgpa).filter((v) => !isNaN(v));
  return nums.length ? (nums.reduce((s, v) => s + v, 0) / nums.length).toFixed(2) : "N/A";
}

/* ───────────── list filtering (ports of filterCourses / filterAttendance / ...) ───────────── */

export type CourseSort = "name_asc" | "name_desc" | "id_desc";

export function filterCourses(courses: Course[], search: string, category: string, sortBy: string): Course[] {
  const q = search.toLowerCase().trim();
  const filtered = courses.filter((course) => {
    const matchesSearch =
      course.course_name.toLowerCase().includes(q) || (course.description || "").toLowerCase().includes(q);

    let matchesCategory = true;
    if (category !== "all") {
      const text = (course.course_name + " " + (course.description || "")).toLowerCase();
      if (category === "tech")
        matchesCategory = ["tech", "program", "web", "database", "python", "js"].some((k) => text.includes(k));
      else if (category === "business") matchesCategory = ["business", "market", "manage"].some((k) => text.includes(k));
      else if (category === "design")
        matchesCategory = ["design", "art", "ui", "ux", "creative"].some((k) => text.includes(k));
    }
    return matchesSearch && matchesCategory;
  });

  if (sortBy === "name_asc") filtered.sort((a, b) => a.course_name.localeCompare(b.course_name));
  else if (sortBy === "name_desc") filtered.sort((a, b) => b.course_name.localeCompare(a.course_name));
  else if (sortBy === "id_desc") filtered.sort((a, b) => Number(b.course_id) - Number(a.course_id));
  return filtered;
}

export function filterAttendance(list: AttendanceCourse[], search: string, standing: string, sortBy: string) {
  let filtered = [...list];
  const q = search.toLowerCase().trim();
  if (q) filtered = filtered.filter((c) => c.course_name.toLowerCase().includes(q));
  if (standing === "good") filtered = filtered.filter((c) => c.attendance_percentage >= 75);
  else if (standing === "risk") filtered = filtered.filter((c) => c.attendance_percentage < 75);

  if (sortBy === "name_asc") filtered.sort((a, b) => a.course_name.localeCompare(b.course_name));
  else if (sortBy === "name_desc") filtered.sort((a, b) => b.course_name.localeCompare(a.course_name));
  else if (sortBy === "pct_desc") filtered.sort((a, b) => b.attendance_percentage - a.attendance_percentage);
  else if (sortBy === "pct_asc") filtered.sort((a, b) => a.attendance_percentage - b.attendance_percentage);
  return filtered;
}

export function filterQuizzes(list: QuizSummary[], search: string, status: string, sortBy: string) {
  let filtered = [...list];
  const q = search.toLowerCase().trim();
  if (q)
    filtered = filtered.filter((x) => x.title.toLowerCase().includes(q) || (x.course_name || "").toLowerCase().includes(q));
  if (status === "completed") filtered = filtered.filter((x) => !!x.submitted_at);
  else if (status === "pending") filtered = filtered.filter((x) => !x.submitted_at);

  if (sortBy === "title_asc") filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === "title_desc") filtered.sort((a, b) => b.title.localeCompare(a.title));
  else if (sortBy === "time_desc") filtered.sort((a, b) => b.time_limit - a.time_limit);
  else if (sortBy === "time_asc") filtered.sort((a, b) => a.time_limit - b.time_limit);
  return filtered;
}

export function filterAssignments(list: Assignment[], search: string, status: string, sortBy: string) {
  let filtered = [...list];
  const q = search.toLowerCase().trim();
  if (q)
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.course_name || "").toLowerCase().includes(q),
    );
  if (status === "completed") filtered = filtered.filter((a) => a.status === "submitted");
  else if (status === "pending") filtered = filtered.filter((a) => a.status === "pending" || a.status === "overdue");

  const due = (a: Assignment) => new Date(a.due_date || 0).getTime();
  if (sortBy === "due_asc") filtered.sort((a, b) => due(a) - due(b));
  else if (sortBy === "due_desc") filtered.sort((a, b) => due(b) - due(a));
  else if (sortBy === "title_asc") filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === "title_desc") filtered.sort((a, b) => b.title.localeCompare(a.title));
  return filtered;
}

/* ───────────── fee challan print view ───────────── */

export function challanPrintHtml(challan: FeeChallan): string {
  const fee = challan.fee_per_credit_hour || 8000;
  const e = escapeHtml;
  const rows = (challan.courses || [])
    .map(
      (course) => `
    <tr>
      <td>${e(course.course_id || "")}</td>
      <td>${e(course.course_name || "")}</td>
      <td style="text-align:right;">${e(course.credit_hours ?? "-")}</td>
      <td style="text-align:right;">${e(formatPKR((course.credit_hours || 0) * fee))}</td>
    </tr>`,
    )
    .join("");
  return `<!doctype html>
<html><head><title>${e(challan.challan_number)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Arial, sans-serif; color: #111827; }
  .header { border-bottom: 2px solid #e94560; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { margin: 0; color: #1a1a2e; font-size: 24px; }
  h2 { margin: 4px 0 0; color: #e94560; font-size: 16px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 18px; }
  .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
  .value { font-weight: bold; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #d1d5db; padding: 9px; font-size: 13px; }
  th { background: #1a1a2e; color: white; text-align: left; }
  .total { margin-top: 18px; text-align: right; font-size: 18px; font-weight: bold; }
  .footer { margin-top: 36px; display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
</style></head><body>
  <div class="header"><h1>Learning Sphere LMS</h1><h2>Semester Fee Challan</h2></div>
  <div class="grid">
    <div><div class="label">Challan ID</div><div class="value">${e(challan.challan_number)}</div></div>
    <div><div class="label">Status</div><div class="value">${e(challan.status)}</div></div>
    <div><div class="label">Student</div><div class="value">${e(challan.student_name || "")}</div></div>
    <div><div class="label">Email</div><div class="value">${e(challan.student_email || "")}</div></div>
    <div><div class="label">Semester</div><div class="value">${e(challan.semester || "")}</div></div>
    <div><div class="label">Issue Date</div><div class="value">${e(challan.issue_date || "")}</div></div>
    <div><div class="label">Due Date</div><div class="value">${e(challan.due_date || "")}</div></div>
    <div><div class="label">Fee Per Credit Hour</div><div class="value">${e(formatPKR(fee))}</div></div>
  </div>
  <table>
    <thead><tr><th>Course ID</th><th>Course</th><th style="text-align:right;">Credit Hours</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">Total Credit Hours: ${e(challan.total_credit_hours ?? "-")}<br>Total Payable: ${e(formatPKR(challan.total_amount || challan.amount))}</div>
  <div class="footer"><span>Generated by Learning Sphere LMS</span><span>Accounts Office Signature: ____________________</span></div>
</body></html>`;
}

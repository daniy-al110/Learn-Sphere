"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/layout/icons";
import { useSession } from "@/hooks/useSession";
import { API_BASE_URL } from "@/lib/config";
import { toast, confirmDialog } from "@/lib/toast-store";
import { useAsync } from "@/hooks/useAsync";
import { PageHeading, EmptyState, LoadingBlock } from "@/components/student/shared";

interface RegWindow {
  id: number;
  degree_program: string;
  semester: string;
  open_date: string;
  close_date: string;
  late_open_date: string | null;
  late_close_date: string | null;
  max_credit_hours: number;
  min_credit_hours: number;
  fee_per_credit_hour: number;
  is_active: boolean;
  created_at: string;
}

export default function RegistrationWindowsView() {
  const { session } = useSession();
  const [windows, setWindows] = useState<RegWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RegWindow | null>(null);

  // Form State
  const [degreeProgram, setDegreeProgram] = useState("Bachelors");
  const [semester, setSemester] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [lateOpenDate, setLateOpenDate] = useState("");
  const [lateCloseDate, setLateCloseDate] = useState("");
  const [minCredits, setMinCredits] = useState(12);
  const [maxCredits, setMaxCredits] = useState(21);
  const [feePerCredit, setFeePerCredit] = useState(8000);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWindows();
  }, []);

  const fetchWindows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/registration-windows`);
      const data = await res.json();
      if (data.success) {
        setWindows(data.windows || []);
      } else {
        toast.error(data.error || "Failed to load registration windows");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (w?: RegWindow) => {
    if (w) {
      setEditing(w);
      setDegreeProgram(w.degree_program);
      setSemester(w.semester);
      setOpenDate(w.open_date.slice(0, 16));
      setCloseDate(w.close_date.slice(0, 16));
      setLateOpenDate(w.late_open_date ? w.late_open_date.slice(0, 16) : "");
      setLateCloseDate(w.late_close_date ? w.late_close_date.slice(0, 16) : "");
      setMinCredits(w.min_credit_hours);
      setMaxCredits(w.max_credit_hours);
      setFeePerCredit(w.fee_per_credit_hour || 8000);
      setIsActive(w.is_active);
    } else {
      setEditing(null);
      setDegreeProgram("Bachelors");
      setSemester("");
      setOpenDate("");
      setCloseDate("");
      setLateOpenDate("");
      setLateCloseDate("");
      setMinCredits(12);
      setMaxCredits(21);
      setFeePerCredit(8000);
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing 
        ? `${API_BASE_URL}/api/admin/registration-windows/${editing.id}`
        : `${API_BASE_URL}/api/admin/registration-windows`;
      
      const payload = {
        degree_program: degreeProgram,
        semester,
        open_date: new Date(openDate).toISOString(),
        close_date: new Date(closeDate).toISOString(),
        late_open_date: lateOpenDate ? new Date(lateOpenDate).toISOString() : null,
        late_close_date: lateCloseDate ? new Date(lateCloseDate).toISOString() : null,
        min_credit_hours: minCredits,
        max_credit_hours: maxCredits,
        fee_per_credit_hour: feePerCredit,
        is_active: isActive
      };

      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editing ? "Registration window updated" : "Registration window created");
        setIsModalOpen(false);
        fetchWindows();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDialog.confirm({
      title: "Delete Window",
      message: "Are you sure you want to delete this registration window?",
      confirmText: "Delete",
      type: "danger"
    });
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/registration-windows/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Window deleted");
        fetchWindows();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <PageHeading title="Registration Windows" subtitle="Manage course registration periods for different degree programs" />
        <button
          onClick={() => openModal()}
          className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent-hover transition flex items-center"
        >
          <Icon name="plus" className="w-5 h-5 mr-2" /> Create Window
        </button>
      </div>

      {loading ? (
        <LoadingBlock text="Loading registration windows..." />
      ) : windows.length === 0 ? (
        <EmptyState text="No registration windows configured" />
      ) : (
        <div className="grid gap-6">
          {windows.map(w => {
            const now = new Date();
            const open = new Date(w.open_date);
            const close = new Date(w.close_date);
            const lateOpen = w.late_open_date ? new Date(w.late_open_date) : null;
            const lateClose = w.late_close_date ? new Date(w.late_close_date) : null;
            
            let statusBadge = <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">Closed</span>;
            
            if (w.is_active) {
              if (now >= open && now <= close) {
                statusBadge = <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Active</span>;
              } else if (lateOpen && lateClose && now >= lateOpen && now <= lateClose) {
                statusBadge = <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>Late Registration Active</span>;
              } else if (now < open) {
                statusBadge = <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Upcoming</span>;
              }
            } else {
              statusBadge = <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Disabled</span>;
            }

            return (
              <div key={w.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col md:flex-row justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{w.semester}</h3>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-semibold">{w.degree_program}</span>
                    {statusBadge}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="flex items-center gap-2 mb-1"><Icon name="calendar" className="w-4 h-4 text-gray-400" /> <b>Main Window:</b> {new Date(w.open_date).toLocaleString()} — {new Date(w.close_date).toLocaleString()}</p>
                    {w.late_open_date && (
                      <p className="flex items-center gap-2 text-yellow-700"><Icon name="clock" className="w-4 h-4 text-yellow-600" /> <b>Late Window:</b> {new Date(w.late_open_date).toLocaleString()} — {new Date(w.late_close_date!).toLocaleString()}</p>
                    )}
                  </div>

                  <div className="flex gap-4 text-sm font-medium text-gray-500">
                    <span className="bg-gray-50 px-3 py-1 rounded border border-gray-200">Min Credits: {w.min_credit_hours}</span>
                    <span className="bg-gray-50 px-3 py-1 rounded border border-gray-200">Max Credits: {w.max_credit_hours}</span>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-start gap-2">
                  <button onClick={() => openModal(w)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                    <Icon name="edit-3" className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(w.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                    <Icon name="trash-2" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">{editing ? "Edit Window" : "Create Window"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700"><Icon name="x" className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Degree Program</label>
                  <select value={degreeProgram} onChange={e => setDegreeProgram(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none">
                    <option value="Bachelors">Bachelors</option>
                    <option value="Masters">Masters</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Semester (e.g. Fall 2026)</label>
                  <input type="text" value={semester} onChange={e => setSemester(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-700 mb-3">Main Registration Period</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Open Date</label>
                    <input type="datetime-local" value={openDate} onChange={e => setOpenDate(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Close Date</label>
                    <input type="datetime-local" value={closeDate} onChange={e => setCloseDate(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-700 mb-3">Late Registration Period (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Late Open Date</label>
                    <input type="datetime-local" value={lateOpenDate} onChange={e => setLateOpenDate(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Late Close Date</label>
                    <input type="datetime-local" value={lateCloseDate} onChange={e => setLateCloseDate(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Credit Hours</label>
                  <input type="number" value={minCredits} onChange={e => setMinCredits(Number(e.target.value))} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Credit Hours</label>
                  <input type="number" value={maxCredits} onChange={e => setMaxCredits(Number(e.target.value))} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fee per Credit (Rs)</label>
                  <input type="number" value={feePerCredit} onChange={e => setFeePerCredit(Number(e.target.value))} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none" />
                </div>
              </div>

              <div className="pt-2 flex items-center">
                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5 text-accent rounded mr-2" />
                <label htmlFor="isActive" className="font-medium">Window is Active</label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover disabled:opacity-70 flex items-center">
                  {saving ? <Icon name="loader" className="w-5 h-5 animate-spin mr-2" /> : <Icon name="check" className="w-5 h-5 mr-2" />}
                  {editing ? "Update Window" : "Create Window"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, FormEvent } from "react";
import { AddButton, errText } from "./ui";
import { confirmDialog, toast } from "@/lib/toast-store";
import { API_BASE_URL } from "@/lib/config";

const NO_MARGIN = { marginBottom: 0 } as const;
const FIELD = "w-full px-4 py-3 border rounded-lg focus:outline-hidden focus:border-accent bg-gray-50/50";

interface Section {
  id: number;
  name: string;
  semester: number;
}

export default function SectionsView() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<{ name: string; semester: string } | null>(null);
  

  useEffect(() => {
    fetchSections();
  }, []);

  async function fetchSections() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sections`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSections(json.data);
    } catch (err) {
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), semester: Number(form.semester) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      
      toast.success("Section created successfully!");
      setForm(null);
      fetchSections();
    } catch (err) {
      toast.error("Could not save section: " + errText(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    const ok = await confirmDialog.confirmDelete({ entityName: "this section" });
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sections/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      
      toast.success("Section removed.");
      fetchSections();
    } catch (e) {
      toast.error("Could not remove section: " + errText(e));
    }
  }

  if (form) {
    return (
      <div id="sections">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800" style={NO_MARGIN}>Sections Management</h1>
          <AddButton onClick={() => setForm(null)}>Cancel Form</AddButton>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 max-w-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Section</h2>
          <form onSubmit={submit} className="space-y-6" style={{ boxShadow: "none", padding: 0, marginBottom: 0 }}>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Section Name *</label>
              <input type="text" required placeholder="e.g. 3N" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })} className={FIELD} style={NO_MARGIN} />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Semester (1-8) *</label>
              <input type="number" min={1} max={8} step={1} required placeholder="e.g. 3" value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })} className={FIELD} style={NO_MARGIN} />
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-lg font-bold transition flex items-center gap-2" style={{ width: "auto", marginBottom: 0 }}>
                {saving ? "Saving..." : "Save Section"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="sections">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sections Management</h1>
          <p className="text-gray-500">Define sections to automatically expand course offerings by semester.</p>
        </div>
        <AddButton onClick={() => setForm({ name: "", semester: "1" })}>Add New Section</AddButton>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="p-4 font-semibold w-1/3">Section Name</th>
                <th className="p-4 font-semibold w-1/3">Semester</th>
                <th className="p-4 font-semibold text-center w-1/3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading sections...</td></tr>
              ) : sections.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500">No sections defined yet.</td></tr>
              ) : (
                sections.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition" style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td className="p-4 font-semibold text-gray-800">{s.name}</td>
                    <td className="p-4 text-gray-600">Semester {s.semester}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => remove(s.id)} className="text-accent hover:text-accent/80 font-semibold cursor-pointer" style={{ width: "auto", background: "none", border: "none", marginBottom: 0, display: "inline-block" }}>
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

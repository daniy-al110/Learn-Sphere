"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast-store";

import { API_BASE_URL } from "@/lib/config";

interface Admin {
  admin_id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
}

interface Role {
  role_id: number;
  role_name: string;
}

export default function AddAdminView() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // New Admin Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [roleId, setRoleId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [resAdmins, resRoles] = await Promise.all([
        fetch(`${API_BASE_URL}/api/super-admin/admins`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/super-admin/roles`).then(r => r.json())
      ]);
      if (resAdmins.success) setAdmins(resAdmins.admins);
      if (resRoles.success) {
        setRoles(resRoles.roles);
        if (resRoles.roles.length > 0) setRoleId(String(resRoles.roles[0].role_id));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admins or roles");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !roleId) {
      return toast.warning("All fields are required");
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/super-admin/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role_id: parseInt(roleId) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Admin created! An email has been sent with their password.");
        setName("");
        setEmail("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to create admin");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  async function handleDeleteAdmin(id: number) {
    if (!confirm("Are you sure you want to remove this admin?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/super-admin/admins/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Admin removed");
        fetchData();
      } else {
        toast.error(data.error || "Failed to remove admin");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading Admins...</div>;

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-3xl font-bold mb-4">Manage System Admins</h2>

      {/* Add New Admin Form */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Add New Admin</h3>
        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-2 border rounded-sm focus:ring-2 focus:ring-accent outline-none"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-2 border rounded-sm focus:ring-2 focus:ring-accent outline-none"
              placeholder="admin@university.edu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Admin Role</label>
            <select 
              value={roleId} 
              onChange={e => setRoleId(e.target.value)} 
              className="w-full p-2 border rounded-sm focus:ring-2 focus:ring-accent outline-none bg-white"
              required
            >
              {roles.map(r => (
                <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 mt-2">
            <button 
              type="submit" 
              className="bg-accent text-white px-6 py-2 rounded-sm hover:bg-accent-hover transition-colors font-medium w-full md:w-auto"
            >
              Create Admin Account
            </button>
          </div>
        </form>
      </div>

      {/* Admin List Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Existing Admins</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {admins.map(admin => (
            <div key={admin.admin_id} className="border border-gray-200 p-4 rounded-lg flex flex-col justify-between bg-white hover:shadow-md transition-shadow">
              <div>
                <div className="font-bold text-lg text-gray-900">{admin.name || "No Name"}</div>
                <div className="text-sm text-gray-500 mb-2">{admin.email}</div>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                  {admin.role_name || "No Role"}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => handleDeleteAdmin(admin.admin_id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                >
                  Remove Admin
                </button>
              </div>
            </div>
          ))}
          {admins.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No admins found in the system.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

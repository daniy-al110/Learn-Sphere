"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast-store";
import { API_BASE_URL } from "@/lib/config";

interface Permission {
  permission_id: number;
  permission_name: string;
  description: string;
}

interface Role {
  role_id: number;
  role_name: string;
  description: string;
  permissions: { permission_id: number; permission_name: string }[];
}

export default function ConfigAdminView() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // New Role Form
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [resRoles, resPerms] = await Promise.all([
        fetch(`${API_BASE_URL}/api/super-admin/roles`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/super-admin/permissions`).then(r => r.json())
      ]);
      if (resRoles.success) setRoles(resRoles.roles);
      if (resPerms.success) setPermissions(resPerms.permissions);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load roles/permissions");
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePermission(roleId: number, permId: number, hasPerm: boolean) {
    const role = roles.find(r => r.role_id === roleId);
    if (!role) return;

    let newPermIds = role.permissions.map(p => p.permission_id);
    if (hasPerm) {
      newPermIds = newPermIds.filter(id => id !== permId);
    } else {
      newPermIds.push(permId);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/super-admin/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_ids: newPermIds })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Permissions updated");
        fetchData();
      } else {
        toast.error(data.error || "Failed to update permissions");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  async function handleAddRole() {
    if (!newRoleName.trim()) return toast.warning("Role name is required");
    try {
      const res = await fetch(`${API_BASE_URL}/api/super-admin/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_name: newRoleName, description: newRoleDesc })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Role added successfully");
        setNewRoleName("");
        setNewRoleDesc("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to add role");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-500 animate-pulse">Loading Config...</div>;

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-3xl font-bold mb-4">Configure Admin Roles</h2>

      {/* Add New Role */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-3">Add New Role</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <input 
              type="text" 
              value={newRoleName} 
              onChange={e => setNewRoleName(e.target.value)} 
              className="w-full p-2 border rounded-sm"
              placeholder="e.g. Content Admin"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <input 
              type="text" 
              value={newRoleDesc} 
              onChange={e => setNewRoleDesc(e.target.value)} 
              className="w-full p-2 border rounded-sm"
              placeholder="Role description"
            />
          </div>
          <button 
            onClick={handleAddRole} 
            className="bg-accent text-white px-6 py-2 rounded-sm hover:bg-accent-hover transition-colors"
          >
            Create Role
          </button>
        </div>
      </div>

      {/* Roles & Permissions Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-200">
                <th className="p-3 font-semibold text-gray-700 border-r border-gray-200">Role</th>
                {permissions.map(p => (
                  <th key={p.permission_id} className="p-3 font-semibold text-gray-700 text-center text-xs">
                    {p.permission_name.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.role_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="p-3 border-r border-gray-200">
                    <div className="font-medium text-gray-900">{role.role_name}</div>
                    <div className="text-xs text-gray-500">{role.description}</div>
                  </td>
                  {permissions.map(p => {
                    const hasPerm = role.permissions.some(rp => rp.permission_id === p.permission_id);
                    return (
                      <td key={p.permission_id} className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={hasPerm}
                          onChange={() => handleTogglePermission(role.role_id, p.permission_id, hasPerm)}
                          className="w-4 h-4 text-accent cursor-pointer rounded border-gray-300 focus:ring-accent"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={permissions.length + 1} className="p-4 text-center text-gray-500">No roles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

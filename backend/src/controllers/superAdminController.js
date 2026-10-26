const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');
const planUpgrades = require('../utils/planUpgrades');

exports.get_api_super_admin_roles = async (req, res) => {
  try {
    const { data: roles, error: rolesErr } = await supabase.from('roles').select('*');
    if (rolesErr) throw rolesErr;
    
    const { data: rolePerms, error: rpErr } = await supabase.from('role_permissions').select('role_id, permission_id, permissions(permission_name)');
    if (rpErr) throw rpErr;

    const mappedRoles = roles.map(r => ({
      ...r,
      permissions: rolePerms
        .filter(rp => rp.role_id === r.role_id)
        .map(rp => ({
          role_id: rp.role_id,
          permission_id: rp.permission_id,
          permission_name: rp.permissions?.permission_name
        }))
    }));
    res.json({ success: true, roles: mappedRoles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.post_api_super_admin_roles = async (req, res) => {
  try {
    const { role_name, description } = req.body;
    const { error } = await supabase.from('roles').insert([{ role_name, description }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.put_api_super_admin_roles_id_permissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { permission_ids } = req.body; // array of IDs
    await supabase.from('role_permissions').delete().eq('role_id', roleId);
    
    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      const inserts = permission_ids.map(pId => ({ role_id: roleId, permission_id: pId }));
      const { error } = await supabase.from('role_permissions').insert(inserts);
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_api_super_admin_permissions = async (req, res) => {
  try {
    const { data: permissions, error } = await supabase.from('permissions').select('*');
    if (error) throw error;
    res.json({ success: true, permissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_api_super_admin_admins = async (req, res) => {
  try {
    const { data, error } = await supabase.from('admins').select('admin_id, name, email, role_id, roles(role_name)');
    if (error) throw error;
    
    const admins = data.map(a => ({
      admin_id: a.admin_id,
      name: a.name,
      email: a.email,
      role_id: a.role_id,
      role_name: a.roles?.role_name
    }));
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.post_api_super_admin_admins = async (req, res) => {
  try {
    const { name, email, role_id } = req.body;
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(tempPassword, 10);

    const { error } = await supabase.from('admins').insert([{ name, email, password: hashed, role_id }]);
    if (error) throw error;
    
    try {
      await emailService.sendWelcomeEmail(email, name, email, tempPassword);
    } catch (emailErr) {
      console.error("Failed to send welcome email to admin:", emailErr);
    }

    res.json({ success: true, message: "Admin created and email sent" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.delete_api_super_admin_admins_id = async (req, res) => {
  try {
    const { error } = await supabase.from('admins').delete().eq('admin_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/super-admin/platform/overview - View all platform classes, total students, teachers, and active plans
exports.get_api_super_admin_platform_overview = async (req, res) => {
  try {
    const data = await planUpgrades.getPlatformOverview();
    res.json(data);
  } catch (err) {
    console.error('Super admin platform overview error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/super-admin/platform/upgrade-requests - View all upgrade requests with payment screenshots
exports.get_api_super_admin_upgrade_requests = (req, res) => {
  try {
    const requests = planUpgrades.readRequests();
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/super-admin/platform/submit-upgrade - Academy admin submits plan upgrade with receipt screenshot
exports.post_api_super_admin_submit_upgrade = (req, res) => {
  try {
    const request = planUpgrades.submitUpgradeRequest(req.body);
    res.json({ success: true, message: 'Upgrade request submitted for review', request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/super-admin/platform/approve-upgrade - Super Super Admin approves upgrade after checking screenshot
exports.post_api_super_admin_approve_upgrade = (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });
    const result = planUpgrades.approveRequest(requestId);
    if (!result.success) return res.status(404).json(result);
    res.json({ success: true, message: 'Plan upgrade approved successfully', request: result.request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/super-admin/platform/reject-upgrade - Super Super Admin rejects upgrade
exports.post_api_super_admin_reject_upgrade = (req, res) => {
  try {
    const { requestId, reason } = req.body;
    if (!requestId) return res.status(400).json({ success: false, error: 'requestId is required' });
    const result = planUpgrades.rejectRequest(requestId, reason);
    if (!result.success) return res.status(404).json(result);
    res.json({ success: true, message: 'Plan upgrade request rejected', request: result.request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/super-admin/platform/create-super-admin - Can ONLY be created from Super Super Admin Platform
exports.post_api_super_admin_create_super_admin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const { data: existing } = await supabase
      .from('admins')
      .select('admin_id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, error: 'An admin with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    // Role 1 is designated Super Super Admin
    const { data: newAdmin, error: createErr } = await supabase
      .from('admins')
      .insert([{ name: name.trim(), email: cleanEmail, password: hashed, role_id: 1 }])
      .select('admin_id, name, email, role_id')
      .single();

    if (createErr) throw createErr;

    res.json({
      success: true,
      message: 'New Super Super Admin created successfully',
      admin: {
        ...newAdmin,
        is_super_admin: true
      }
    });
  } catch (err) {
    console.error('Create super admin error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

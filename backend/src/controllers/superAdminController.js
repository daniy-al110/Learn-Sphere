const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

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


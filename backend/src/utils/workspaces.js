const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/db');

const WORKSPACE_FILE = path.resolve(__dirname, '../data/workspaces.json');

function ensureFile() {
  const dir = path.dirname(WORKSPACE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(WORKSPACE_FILE)) {
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

function getWorkspaces() {
  try {
    ensureFile();
    return JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf8') || '{}');
  } catch (e) {
    return {};
  }
}

function saveWorkspaces(data) {
  try {
    ensureFile();
    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving workspaces:', e);
  }
}

function registerAdminWorkspace(adminId, adminEmail, academyName, initialCourseId) {
  const ws = getWorkspaces();
  const key = String(adminId || adminEmail).toLowerCase();
  ws[key] = {
    admin_id: Number(adminId) || null,
    admin_email: (adminEmail || '').toLowerCase(),
    academy_name: academyName || 'My Academy',
    created_at: new Date().toISOString(),
    course_ids: initialCourseId ? [Number(initialCourseId)] : [],
    teacher_ids: [],
    student_ids: [],
  };
  saveWorkspaces(ws);
  return ws[key];
}

async function resolveWorkspaceCourseIds(adminId, adminEmail) {
  const ws = getWorkspaces();
  const idKey = adminId ? String(adminId) : null;
  const emailKey = adminEmail ? String(adminEmail).toLowerCase() : null;
  let item = null;
  if (idKey && ws[idKey]) item = ws[idKey];
  else if (emailKey && ws[emailKey]) item = ws[emailKey];
  else {
    for (const val of Object.values(ws)) {
      if ((adminId && Number(val.admin_id) === Number(adminId)) || (emailKey && val.admin_email === emailKey)) {
        item = val;
        break;
      }
    }
  }

  const courseIds = new Set(item && Array.isArray(item.course_ids) ? item.course_ids : []);

  // Also query courses table for matching academy name or department if known
  try {
    let academyName = item ? item.academy_name : null;
    if (!academyName && adminEmail) {
      // Look up admin in admins table
      const { data: adminRow } = await supabase
        .from('admins')
        .select('name')
        .eq('email', adminEmail.toLowerCase().trim())
        .maybeSingle();
      if (adminRow && adminRow.name) {
        academyName = adminRow.name;
      }
    }

    if (academyName) {
      const cleanName = academyName.trim();
      const { data: matchedCourses } = await supabase
        .from('courses')
        .select('course_id, description')
        .ilike('description', `%${cleanName}%`);
      if (matchedCourses) {
        matchedCourses.forEach(c => courseIds.add(c.course_id));
      }
    }
  } catch (err) {
    console.error('Error resolving workspace courses:', err.message);
  }

  return Array.from(courseIds);
}

function isPlatformSuperAdmin(email, roleId) {
  if (!email && !roleId) return false;
  const clean = (email || '').toLowerCase().trim();
  // Role 1 is Platform Super Admin, or specific master emails
  return clean === 'kradtech4@gmail.com' || clean === 'admin@kradtech.com' || clean === 'admin@learnsphere.com' || Number(roleId) === 1;
}

module.exports = {
  getWorkspaces,
  registerAdminWorkspace,
  resolveWorkspaceCourseIds,
  isPlatformSuperAdmin
};

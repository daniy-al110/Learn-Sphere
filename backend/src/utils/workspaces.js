const fs = require('fs');
const path = require('path');

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
    section_ids: [],
  };
  saveWorkspaces(ws);
  return ws[key];
}

function getAdminWorkspace(adminId, adminEmail) {
  const ws = getWorkspaces();
  const idKey = adminId ? String(adminId) : null;
  const emailKey = adminEmail ? String(adminEmail).toLowerCase() : null;
  if (idKey && ws[idKey]) return ws[idKey];
  if (emailKey && ws[emailKey]) return ws[emailKey];
  for (const item of Object.values(ws)) {
    if ((adminId && Number(item.admin_id) === Number(adminId)) || (emailKey && item.admin_email === emailKey)) {
      return item;
    }
  }
  return null;
}

function addEntityToWorkspace(adminId, adminEmail, entityType, entityId) {
  const ws = getWorkspaces();
  let item = getAdminWorkspace(adminId, adminEmail);
  if (!item) {
    item = registerAdminWorkspace(adminId, adminEmail, 'My Academy', null);
  }
  const key = String(item.admin_id || item.admin_email).toLowerCase();
  const prop = `${entityType}_ids`;
  if (!Array.isArray(item[prop])) item[prop] = [];
  const numId = Number(entityId);
  if (!item[prop].includes(numId)) {
    item[prop].push(numId);
  }
  ws[key] = item;
  saveWorkspaces(ws);
}

function isPlatformSuperAdmin(email, roleId) {
  if (!email && !roleId) return false;
  const clean = (email || '').toLowerCase().trim();
  return clean === 'kradtech4@gmail.com' || clean === 'admin@kradtech.com' || Number(roleId) === 1;
}

module.exports = {
  getWorkspaces,
  getAdminWorkspace,
  registerAdminWorkspace,
  addEntityToWorkspace,
  isPlatformSuperAdmin
};

const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/db');

const DATA_FILE = path.resolve(__dirname, '../data/plan_upgrade_requests.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Seed with a sample request so Super Super Admin can immediately test screenshot verification!
    const sample = [
      {
        id: "REQ-" + Date.now(),
        academy_name: "Apex Coaching Academy",
        contact_name: "Prof. Asad Khan",
        contact_email: "asad@apexacademy.edu.pk",
        phone: "+92 300 1234567",
        requested_tier: "tuition",
        billing_cycle: "monthly",
        amount_pkr: 1999,
        transaction_id: "RAAST-892374619",
        status: "pending",
        submitted_at: new Date(Date.now() - 3600000).toISOString(),
        screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        notes: "Meezan bank mobile app transfer completed for Tuition Center tier."
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(sample, null, 2), 'utf8');
  }
}

function readRequests() {
  try {
    ensureDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading plan upgrade requests:', err);
    return [];
  }
}

function writeRequests(requests) {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing plan upgrade requests:', err);
  }
}

async function getPlatformOverview() {
  try {
    // 1. Fetch all courses
    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select('course_id, course_name, description, credit_hours, teacher_id, status, category, created_at');
    
    // 2. Fetch all teachers
    const { data: teachers, error: tErr } = await supabase
      .from('teachers')
      .select('teacher_id, name, email, department');

    // 3. Fetch all students count
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    // 4. Fetch enrollments count
    const { count: enrollCount } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });

    const requests = readRequests();
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    // Attach join code to each course
    const formattedCourses = (courses || []).map(c => {
      const teacher = (teachers || []).find(t => t.teacher_id === c.teacher_id);
      const prefix = (c.course_name || 'CLS').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
      return {
        ...c,
        teacher_name: teacher ? teacher.name : 'Unassigned',
        teacher_email: teacher ? teacher.email : '',
        join_code: `LS-${c.course_id}-${prefix}`,
        active_plan: c.credit_hours > 3 ? 'tuition' : 'free'
      };
    });

    return {
      success: true,
      stats: {
        total_courses: (courses || []).length,
        total_teachers: (teachers || []).length,
        total_students: studentCount || 0,
        total_enrollments: enrollCount || 0,
        pending_upgrade_requests: pendingCount
      },
      courses: formattedCourses,
      recent_requests: requests
    };
  } catch (err) {
    console.error('Error in getPlatformOverview:', err.message);
    throw err;
  }
}

function submitUpgradeRequest({
  academy_name,
  contact_name,
  contact_email,
  phone,
  requested_tier,
  billing_cycle,
  amount_pkr,
  transaction_id,
  screenshot_base64,
  notes
}) {
  const requests = readRequests();
  const newRequest = {
    id: "REQ-" + Date.now(),
    academy_name: academy_name || "My Academy",
    contact_name: contact_name || "Admin",
    contact_email: contact_email || "",
    phone: phone || "",
    requested_tier: requested_tier || "tuition",
    billing_cycle: billing_cycle || "monthly",
    amount_pkr: Number(amount_pkr) || (requested_tier === "academy" ? 4499 : 1999),
    transaction_id: transaction_id || "TRX-" + Math.floor(100000 + Math.random() * 900000),
    status: "pending",
    submitted_at: new Date().toISOString(),
    screenshot_url: screenshot_base64 || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    notes: notes || "Payment submitted via online transfer."
  };
  requests.unshift(newRequest);
  writeRequests(requests);
  return newRequest;
}

function approveRequest(requestId) {
  const requests = readRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return { success: false, error: 'Request not found' };
  req.status = 'approved';
  req.approved_at = new Date().toISOString();
  writeRequests(requests);
  return { success: true, request: req };
}

function rejectRequest(requestId, reason) {
  const requests = readRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return { success: false, error: 'Request not found' };
  req.status = 'rejected';
  req.rejected_at = new Date().toISOString();
  req.rejection_reason = reason || 'Payment could not be verified.';
  writeRequests(requests);
  return { success: true, request: req };
}

module.exports = {
  getPlatformOverview,
  readRequests,
  submitUpgradeRequest,
  approveRequest,
  rejectRequest
};

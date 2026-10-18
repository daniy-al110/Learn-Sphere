const { supabase, db, getAsync, runAsync, allAsync } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

exports.get_api_health = (req, res) => {

  res.json({ success: true, message: 'OK', uptime: process.uptime(), timestamp: Date.now() });

};

exports.post_api_user_login = async (req, res) => {

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  const lookupEmail = String(email).toLowerCase().trim();

  // Helper to verify in a specific table
  const verifyInTable = async (table, idField, roleName) => {
    const { data: user, error } = await supabase
      .from(table)
      .select('*')
      .eq('email', lookupEmail)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;

    delete user.password;
    
    // Fetch permissions if admin
    if (table === 'admins' && user.role_id) {
      const { data: rolePerms } = await supabase.from('role_permissions').select('permissions(permission_name)').eq('role_id', user.role_id);
      if (rolePerms) {
        user.permissions = rolePerms.map(rp => rp.permissions?.permission_name).filter(Boolean);
      }
    }

    return { role: roleName, data: user };
  };

  try {
    let result = null;

    // 1. Detect role by email pattern first for absolute speed
    if (lookupEmail.endsWith("@student.lms.edu")) {
      result = await verifyInTable('students', 'student_id', 'student');
    } else if (lookupEmail.endsWith("@lms.edu") && lookupEmail !== "admin@lms.edu") {
      result = await verifyInTable('teachers', 'teacher_id', 'teacher');
    } else if (lookupEmail === "admin@lms.edu") {
      result = await verifyInTable('admins', 'id', 'admin');
    }

    // 2. If pattern matching didn't yield a result, query sequentially as a fallback
    if (!result) {
      result = await verifyInTable('admins', 'id', 'admin');
    }
    if (!result) {
      result = await verifyInTable('teachers', 'teacher_id', 'teacher');
    }
    if (!result) {
      result = await verifyInTable('students', 'student_id', 'student');
    }

    if (!result) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    res.json({
      success: true,
      role: result.role,
      [result.role]: result.data
    });
  } catch (err) {
    console.error("Unified login error:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }

};

exports.post_api_password_reset = async (req, res) => {

  const { lmsEmail, personalEmail, email } = req.body;
  const lookupEmail = (lmsEmail || email || "").toLowerCase().trim();
  const targetPersonalEmail = (personalEmail || "").toLowerCase().trim();

  if (!lookupEmail || !targetPersonalEmail) {
    return res.status(400).json({ success: false, error: "LMS email and personal email are required" });
  }

  const lookupUserInTable = async (table, column) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(column, lookupEmail)
        .maybeSingle();

      if (error) {
        const message = String(error.message || "").toLowerCase();
        if (message.includes('column') || message.includes('unknown')) {
          return null;
        }
        throw error;
      }
      return data ? { user: data, table } : null;
    } catch (err) {
      const message = String(err.message || "").toLowerCase();
      if (message.includes('column') || message.includes('unknown')) {
        return null;
      }
      throw err;
    }
  };

  try {
    let result = null;
    const tables = ['admins', 'teachers', 'students'];
    const columns = ['email', 'personal_email', 'personalEmail'];

    for (const table of tables) {
      for (const column of columns) {
        result = await lookupUserInTable(table, column);
        if (result) break;
      }
      if (result) break;
    }

    if (!result) {
      return res.status(404).json({ success: false, error: "LMS Email not found" });
    }

    const { user, table } = result;

    const temporaryPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const { error: updateError } = await supabase
      .from(table)
      .update({ password: hashedPassword })
      .eq('email', user.email);

    if (updateError) throw updateError;

    await emailService.sendPasswordResetEmail(targetPersonalEmail, user.name || user.email, user.email, temporaryPassword);

    res.json({ success: true, message: `A temporary password has been sent to ${targetPersonalEmail}.` });
  } catch (err) {
    console.error("Password reset error:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }

};

exports.post_api_user_change_password = async (req, res) => {

  const { role, userId, oldPassword, newPassword } = req.body;

  if (!role || !userId || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  const tableMap = {
    teacher: 'teachers',
    student: 'students',
    admin: 'admins',
  };
  const table = tableMap[String(role).toLowerCase()];
  const idColMap = {
    teacher: 'teacher_id',
    student: 'student_id',
    admin: 'id',
  };
  const idCol = idColMap[String(role).toLowerCase()];

  if (!table || !idCol) {
    return res.status(400).json({ success: false, error: "Invalid role" });
  }

  try {
    // 1. Fetch user from Supabase
    const { data: user, error: fetchErr } = await supabase
      .from(table)
      .select('*')
      .eq(idCol, userId)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // 2. Verify current password
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, error: "Incorrect current password" });
    }

    // 3. Hash new password and update
    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase
      .from(table)
      .update({ password: hashed })
      .eq(idCol, userId);

    if (updateErr) throw updateErr;

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Change password error:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }

};

exports.get_api_open_enrollment_window = async (req, res) => {

  try {
    const windowRow = await getOpenEnrollmentWindow();
    res.json({ success: true, window: windowRow });
  } catch (err) {
    console.error('Get open enrollment window error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_schedule = async (req, res) => {

  try {
    // 1. Fetch courses
    const { data: courses, error: err1 } = await supabase
      .from('courses')
      .select('course_id, course_name, credit_hours, schedule, duration, teacher_id');

    if (err1) throw err1;

    // 2. Fetch teachers
    const { data: teachers, error: err2 } = await supabase
      .from('teachers')
      .select('teacher_id, name');

    if (err2) throw err2;

    // 3. Process data
    const result = courses ? courses.map(c => {
      const teacher = teachers ? teachers.find(t => t.teacher_id === c.teacher_id) : null;
      
      return {
        course_id: c.course_id,
        course_name: c.course_name,
        credit_hours: getCourseCreditHours(c),
        schedule: c.schedule,
        duration: c.duration,
        teacher_id: c.teacher_id,
        teacher_name: teacher ? teacher.name : 'Unknown'
      };
    }) : [];

    // Sort by course_name
    result.sort((x, y) => x.course_name.localeCompare(y.course_name));

    res.json({ success: true, schedule: result });
  } catch (err) {
    console.error('Get schedule error:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_enroll = async (req, res) => {

  try {
    const { studentId, courseId, paymentMethod, amount } = req.body;

    if (!studentId || !courseId || !paymentMethod || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if student exists
    const student = await getAsync('SELECT student_id FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(400).json({ success: false, error: 'Student not found' });
    }

    // Check if course exists
    const course = await getAsync('SELECT course_id FROM courses WHERE course_id = ?', [courseId]);
    if (!course) {
      return res.status(400).json({ success: false, error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await getAsync('SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
    }

    // Create enrollment record
    const result = await runAsync(
      'INSERT INTO enrollments (student_id, course_id, enrollment_date) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [studentId, courseId]
    );

    res.json({ success: true, enrollmentId: result.lastID, message: 'Enrollment successful!' });
  } catch (err) {
    console.error('Enrollment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_enrollment_request = async (req, res) => {

  try {
    const { studentId, courseId, studentName, courseName } = req.body;

    if (!studentId || !courseId || !studentName || !courseName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get student email
    const student = await getAsync('SELECT email FROM students WHERE student_id = ?', [studentId]);
    if (!student) {
      return res.status(400).json({ success: false, error: 'Student not found' });
    }

    // Check if course exists
    const course = await getAsync('SELECT course_name FROM courses WHERE course_id = ?', [courseId]);
    if (!course) {
      return res.status(400).json({ success: false, error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await getAsync('SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
    }

    // Check if request already pending
    const pendingRequest = await getAsync('SELECT request_id FROM enrollment_requests WHERE student_id = ? AND course_id = ? AND status = ?', [studentId, courseId, 'pending']);
    if (pendingRequest) {
      return res.status(400).json({ success: false, error: 'Enrollment request already pending' });
    }

    // Generate fee challan number
    const challanNumber = `LEARN-${Date.now()}-${studentId}`;
    const feeAmount = 500;

    // Create enrollment request
    const result = await runAsync(
      'INSERT INTO enrollment_requests (student_id, course_id, student_name, student_email, course_name, fee_amount, challan_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, courseId, studentName, student.email, course.course_name, feeAmount, challanNumber]
    );

    // Create fee challan
    await runAsync(
      'INSERT INTO fee_challans (request_id, challan_number, student_name, course_name, amount) VALUES (?, ?, ?, ?, ?)',
      [result.lastID, challanNumber, studentName, course.course_name, feeAmount]
    );

    res.json({
      success: true,
      requestId: result.lastID,
      challanNumber: challanNumber,
      studentName: studentName,
      courseName: course.course_name,
      amount: feeAmount,
      message: 'Fee challan generated successfully!'
    });
  } catch (err) {
    console.error('Enrollment request error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_messages = async (req, res) => {

  try {
    const { user_key } = req.query; // e.g. student_1, teacher_2, admin_1
    if (!user_key) return res.status(400).json({ success: false, error: 'user_key is required' });

    // Fetch received messages
    const { data: received, error: rErr } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_key', user_key)
      .order('created_at', { ascending: false });
      
    if (rErr) throw rErr;

    // Fetch sent messages
    const { data: sent, error: sErr } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_key', user_key)
      .order('created_at', { ascending: false });

    if (sErr) throw sErr;

    res.json({ success: true, received: received || [], sent: sent || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_messages = async (req, res) => {

  try {
    const { sender_key, receiver_key, sender_name, receiver_name, subject, content } = req.body;
    if (!sender_key || !receiver_key || !content) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_key,
        receiver_key,
        sender_name,
        receiver_name,
        subject: subject || 'No Subject',
        content,
        is_read: 0
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_users = async (req, res) => {

  try {
    const [admins, teachers, students] = await Promise.all([
      supabase.from('admins').select('admin_id, name, email'),
      supabase.from('teachers').select('teacher_id, name, email'),
      supabase.from('students').select('student_id, name, email')
    ]);

    const users = [];
    if (admins.data) {
      admins.data.forEach(a => users.push({ user_key: 'admin_' + a.admin_id, name: a.name, email: a.email, role: 'Admin' }));
    }
    if (teachers.data) {
      teachers.data.forEach(t => users.push({ user_key: 'teacher_' + t.teacher_id, name: t.name, email: t.email, role: 'Teacher' }));
    }
    if (students.data) {
      students.data.forEach(s => users.push({ user_key: 'student_' + s.student_id, name: s.name, email: s.email, role: 'Student' }));
    }

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_register = async (req, res) => {

  try {
    const { name, email, password, degree_program } = req.body;
    if (!name || !email || !password || !degree_program) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check if exists
    const { data: existing } = await supabase.from('students').select('*').eq('email', email).maybeSingle();
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const { data, error } = await supabase.from('students').insert([{
      name,
      email,
      password,
      degree_program
    }]).select().single();

    if (error) throw error;
    res.json({ success: true, message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};


exports.patch_api_messages_id_read = async (req, res) => {
  const { supabase } = require('../config/db');
  try {
    const { error } = await supabase.from('messages').update({ is_read: 1 }).eq('message_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

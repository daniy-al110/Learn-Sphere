const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');
const security = require('../utils/security');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

// POST /api/courses/verify-token - Strict exact match + IP rate-limiting
exports.post_api_courses_verify_token = async (req, res) => {
  try {
    const { token } = req.body;
    const ip = getClientIp(req);
    const verification = security.verifyTokenStrict(token, ip);

    if (!verification.valid) {
      return res.status(verification.status).json({
        success: false,
        error: verification.error
      });
    }

    // Fetch course details
    const { data: course, error } = await supabase
      .from('courses')
      .select('course_id, course_name, description, credit_hours, teacher_id, section_name')
      .eq('course_id', verification.courseId)
      .maybeSingle();

    if (error) throw error;
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Fetch teacher name if assigned
    let teacherName = 'Assigned Instructor';
    if (course.teacher_id) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('name')
        .eq('teacher_id', course.teacher_id)
        .maybeSingle();
      if (teacher) teacherName = teacher.name;
    }

    res.json({
      success: true,
      course: {
        ...course,
        teacher_name: teacherName
      }
    });
  } catch (err) {
    console.error('Verify token error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/courses/join-by-token - Direct enrollment via valid token
exports.post_api_courses_join_by_token = async (req, res) => {
  try {
    const { token, student_id, name, email, password } = req.body;
    const ip = getClientIp(req);
    const verification = security.verifyTokenStrict(token, ip);

    if (!verification.valid) {
      return res.status(verification.status).json({
        success: false,
        error: verification.error
      });
    }

    const courseId = verification.courseId;
    let targetStudentId = student_id;
    let studentUser = null;

    // Case 1: Existing student ID provided
    if (targetStudentId) {
      const { data: s, error: sErr } = await supabase
        .from('students')
        .select('student_id, name, email')
        .eq('student_id', targetStudentId)
        .maybeSingle();
      if (sErr || !s) {
        return res.status(404).json({ success: false, error: 'Student account not found' });
      }
      studentUser = s;
    } else {
      // Case 2: New student registration on join
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and password are required to join'
        });
      }

      const cleanEmail = email.toLowerCase().trim();
      const { data: existingStudent } = await supabase
        .from('students')
        .select('student_id, name, email, password')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingStudent) {
        // Authenticate with existing password
        const ok = await bcrypt.compare(password, existingStudent.password);
        if (!ok) {
          return res.status(401).json({
            success: false,
            error: 'An account with this email already exists, but the password provided is incorrect. Please log in first.'
          });
        }
        targetStudentId = existingStudent.student_id;
        studentUser = existingStudent;
      } else {
        // Create new student
        const hashed = await bcrypt.hash(password, 10);
        const { data: newS, error: createErr } = await supabase
          .from('students')
          .insert([{ name: name.trim(), email: cleanEmail, password: hashed }])
          .select('student_id, name, email')
          .single();

        if (createErr) throw createErr;
        targetStudentId = newS.student_id;
        studentUser = newS;
      }
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('enrollment_id')
      .eq('student_id', targetStudentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingEnrollment) {
      return res.json({
        success: true,
        already_enrolled: true,
        message: 'You are already enrolled in this class!',
        course_id: courseId,
        student: studentUser
      });
    }

    // Enroll student directly into course
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert([{ student_id: targetStudentId, course_id: courseId }]);

    if (enrollErr) throw enrollErr;

    res.json({
      success: true,
      message: 'Successfully enrolled in class!',
      course_id: courseId,
      student: studentUser
    });
  } catch (err) {
    console.error('Join by token error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/courses/token-info/:id - Retrieve active token & invite-only status
exports.get_api_courses_token_info = (req, res) => {
  try {
    const courseId = req.params.id;
    const tokenInfo = security.getCourseTokenInfo(courseId);
    res.json({ success: true, tokenInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/courses/:id/regenerate-token - Revokes old link, generates new token
exports.post_api_courses_regenerate_token = (req, res) => {
  try {
    const courseId = req.params.id;
    const tokenInfo = security.regenerateCourseToken(courseId);
    res.json({ success: true, message: 'Class link regenerated successfully', tokenInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/courses/:id/toggle-public-link - Toggles Invite-Only mode
exports.post_api_courses_toggle_public_link = (req, res) => {
  try {
    const courseId = req.params.id;
    const { enabled } = req.body;
    const tokenInfo = security.toggleCoursePublicLink(courseId, enabled);
    res.json({
      success: true,
      message: enabled ? 'Public link joining enabled' : 'Class set to Invite-Only mode',
      tokenInfo
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_api_courses_id = async (req, res) => {
  try {
    const id = req.params.id;
    const { data: course, error } = await supabase
      .from('courses')
      .select('course_id, course_name, description, credit_hours, teacher_id, schedule, duration, created_at, reviews_enabled, reviews_window_start, reviews_window_end, student_feedback_enabled, student_feedback_window_start, student_feedback_window_end')
      .eq('course_id', id)
      .maybeSingle();
    if (error) throw error;
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    const norm = (v) => (v ? String(v).replace(' ', 'T') : v);
    const out = {
      ...course,
      name: course.course_name,
      reviews_window_start: norm(course.reviews_window_start),
      reviews_window_end: norm(course.reviews_window_end),
      student_feedback_window_start: norm(course.student_feedback_window_start),
      student_feedback_window_end: norm(course.student_feedback_window_end),
    };
    res.json({ success: true, course: out });
  } catch (err) {
    console.error('Get course error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.put_api_courses_id = async (req, res) => {
  try {
    const id = req.params.id;
    let { schedule, duration, description, teacher_id, course_name, credit_hours, reviews_enabled, reviews_window_start, reviews_window_end, student_feedback_enabled, student_feedback_window_start, student_feedback_window_end, prerequisite_course_id } = req.body;

    const updateData = {};
    if (schedule !== undefined) updateData.schedule = schedule;
    if (duration !== undefined) updateData.duration = duration;
    if (description !== undefined) updateData.description = description;
    if (teacher_id !== undefined) updateData.teacher_id = teacher_id;
    if (prerequisite_course_id !== undefined) updateData.prerequisite_course_id = prerequisite_course_id ? Number(prerequisite_course_id) : null;
    if (course_name !== undefined) updateData.course_name = course_name;
    if (credit_hours !== undefined) {
      const parsedCreditHours = Number(credit_hours);
      if (!Number.isFinite(parsedCreditHours) || parsedCreditHours <= 0) {
        return res.status(400).json({ success: false, error: 'Credit hours must be a positive number' });
      }
      updateData.credit_hours = parsedCreditHours;
    }
    
    const normalizeIn = (v) => v ? String(v).replace('T', ' ') : v;
    
    if (reviews_enabled !== undefined) updateData.reviews_enabled = reviews_enabled ? 1 : 0;
    if (reviews_window_start !== undefined) updateData.reviews_window_start = normalizeIn(reviews_window_start) || null;
    if (reviews_window_end !== undefined) updateData.reviews_window_end = normalizeIn(reviews_window_end) || null;
    if (student_feedback_enabled !== undefined) updateData.student_feedback_enabled = student_feedback_enabled ? 1 : 0;
    if (student_feedback_window_start !== undefined) updateData.student_feedback_window_start = normalizeIn(student_feedback_window_start) || null;
    if (student_feedback_window_end !== undefined) updateData.student_feedback_window_end = normalizeIn(student_feedback_window_end) || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('course_id', id);

    if (error) throw error;
    res.json({ success: true, updated: 1 });
  } catch (err) {
    console.error('Update course error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_api_course_courseId_assignments = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.query.studentId;

  try {
    const { data: assignments, error: errA } = await supabase
      .from('assignments')
      .select('assignment_id, course_id, title, description, link, due_date, created_at')
      .eq('course_id', courseId);

    if (errA) throw errA;

    if (!assignments || assignments.length === 0) {
      return res.json({ success: true, assignments: [] });
    }

    const assignmentIds = assignments.map(a => a.assignment_id);

    const { data: course, error: errC } = await supabase
      .from('courses')
      .select('course_name')
      .eq('course_id', courseId)
      .single();

    if (errC) throw errC;

    let submissions = [];
    if (studentId) {
      const { data: subs, error: errS } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, marks, submitted_at')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds);

      if (errS) throw errS;
      submissions = subs || [];
    }

    const result = assignments.map(a => {
      const submission = submissions.find(s => s.assignment_id === a.assignment_id);
      return {
        assignment_id: a.assignment_id,
        course_id: a.course_id,
        title: a.title,
        description: a.description,
        link: a.link,
        due_date: a.due_date,
        created_at: a.created_at,
        course_name: course ? course.course_name : 'Unknown',
        student_marks: submission ? (submission.marks != null ? submission.marks : -1) : -1,
        submission_date: submission ? submission.submitted_at : null
      };
    });

    result.sort((x, y) => {
      if (!x.due_date) return 1;
      if (!y.due_date) return -1;
      return new Date(x.due_date) - new Date(y.due_date);
    });

    res.json({ success: true, assignments: result });
  } catch (err) {
    console.error('Failed to fetch course assignments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

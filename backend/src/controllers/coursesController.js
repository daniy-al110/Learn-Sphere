const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

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
    // Normalize stored datetimes to 'T' format for frontend parsing
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
    console.log(`PUT /api/courses/${id} - Request received`);
    let { schedule, duration, description, teacher_id, course_name, credit_hours, reviews_enabled, reviews_window_start, reviews_window_end, student_feedback_enabled, student_feedback_window_start, student_feedback_window_end, prerequisite_course_id } = req.body;

    // Build update object for Supabase
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

    console.log(`✓ Course ${id} updated in Supabase`);
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
    // 1. Fetch assignments
    const { data: assignments, error: errA } = await supabase
      .from('assignments')
      .select('assignment_id, course_id, title, description, link, due_date, created_at')
      .eq('course_id', courseId);

    if (errA) throw errA;

    if (!assignments || assignments.length === 0) {
      return res.json({ success: true, assignments: [] });
    }

    const assignmentIds = assignments.map(a => a.assignment_id);

    // 2. Fetch course name
    const { data: course, error: errC } = await supabase
      .from('courses')
      .select('course_name')
      .eq('course_id', courseId)
      .single();

    if (errC) throw errC;

    // 3. Fetch submissions if studentId is provided
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

    // 4. Process data
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

    // Sort by due_date ASC
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


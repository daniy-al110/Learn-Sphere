const { supabase, db, getAsync, runAsync, allAsync } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

exports.get_api_teacher_courses_courseId_feedback = async (req, res) => {

      try {
        const courseId = req.params.courseId;
        const { data: feedbacks, error } = await supabase
          .from('feedback')
          .select('student_id, rating, review, created_at')
          .eq('course_id', courseId);

        if (error) throw error;

        res.json({ success: true, feedbacks });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    
};

exports.post_api_teacher_student_review = async (req, res) => {

      try {
        const { teacher_id, student_id, course_id, rating, review } = req.body;
        if (!teacher_id || !student_id || !course_id || !rating || !review) {
          return res.status(400).json({ success: false, error: 'Missing fields' });
        }

        const course = await getAsync('SELECT teacher_id, reviews_enabled, reviews_window_start, reviews_window_end FROM courses WHERE course_id = ?', [course_id]);
        if (!course) {
          return res.status(400).json({ success: false, error: 'Course not found' });
        }
        if (String(course.teacher_id) !== String(teacher_id)) {
          return res.status(403).json({ success: false, error: 'Not authorized for this course' });
        }
        if (!course.reviews_enabled) {
          return res.status(403).json({ success: false, error: 'Reviews disabled by admin' });
        }

        // If a window is set, ensure we're inside it now
        if (course.reviews_window_start || course.reviews_window_end) {
          const now = new Date();
          const normStart = course.reviews_window_start ? String(course.reviews_window_start).replace(' ', 'T') : null;
          const normEnd = course.reviews_window_end ? String(course.reviews_window_end).replace(' ', 'T') : null;
          const startOk = normStart ? now >= new Date(normStart) : true;
          const endOk = normEnd ? now <= new Date(normEnd) : true;
          if (!(startOk && endOk)) {
            return res.status(403).json({ success: false, error: 'Review window closed' });
          }
        }

        // Check for existing review
        const existing = await getAsync('SELECT review_id, created_at FROM teacher_reviews WHERE teacher_id = ? AND student_id = ? AND course_id = ?', [teacher_id, student_id, course_id]);
        if (existing) {
          const existingCreated = existing.created_at ? new Date(String(existing.created_at).replace(' ', 'T')) : null;
          const windowStart = course.reviews_window_start ? new Date(String(course.reviews_window_start).replace(' ', 'T')) : null;
          const windowEnd = course.reviews_window_end ? new Date(String(course.reviews_window_end).replace(' ', 'T')) : null;

          if (windowStart || windowEnd) {
            const inWindow = (windowStart ? existingCreated >= windowStart : true) && (windowEnd ? existingCreated <= windowEnd : true);
            if (inWindow) {
              return res.status(403).json({ success: false, error: 'Review already submitted in this review period' });
            }
            // existing review is outside current window -> allow update
            await runAsync('UPDATE teacher_reviews SET rating = ?, review = ?, created_at = CURRENT_TIMESTAMP WHERE review_id = ?', [rating, review, existing.review_id]);
            return res.json({ success: true, message: 'Review updated (outside previous period)' });
          }

          // No review window defined: treat previous submission as final
          return res.status(403).json({ success: false, error: 'Review already submitted' });
        }

        // Insert new review
        await runAsync('INSERT INTO teacher_reviews (teacher_id, student_id, course_id, rating, review) VALUES (?, ?, ?, ?, ?)', [teacher_id, student_id, course_id, rating, review]);
        res.json({ success: true });
      } catch (err) {
        console.error('Teacher review error:', err && err.message ? err.message : err);
        if (err && err.code === '23505') {
          return res.status(409).json({ success: false, error: 'Review already exists' });
        }
        res.status(500).json({ success: false, error: err.message || String(err) });
      }
    
};

exports.get_api_teacher_course_courseId_reviews = async (req, res) => {

      try {
        const courseId = req.params.courseId;
        
        // 1. Fetch reviews
        const { data: reviews, error: err1 } = await supabase
          .from('teacher_reviews')
          .select('review_id, teacher_id, student_id, rating, review, created_at')
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });

        if (err1) throw err1;

        if (!reviews || reviews.length === 0) {
          return res.json({ success: true, reviews: [] });
        }

        const studentIds = reviews.map(r => r.student_id);

        // 2. Fetch students
        const { data: students, error: err2 } = await supabase
          .from('students')
          .select('student_id, name')
          .in('student_id', studentIds);

        if (err2) throw err2;

        // 3. Process data
        const result = reviews.map(r => {
          const student = students ? students.find(s => s.student_id === r.student_id) : null;
          return {
            review_id: r.review_id,
            teacher_id: r.teacher_id,
            student_id: r.student_id,
            student_name: student ? student.name : 'Unknown',
            rating: r.rating,
            review: r.review,
            created_at: r.created_at
          };
        });

        res.json({ success: true, reviews: result });
      } catch (err) {
        console.error('Get teacher reviews error:', err.message);
        res.status(500).json({ success: false, error: err.message });
      }
    
};

exports.post_api_teacher_login = async (req, res) => {

  const { email, password } = req.body;
  try {
    const { data: t, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!t) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, t.password);
    if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

    delete t.password;
    res.json({ success: true, teacher: t });
  } catch (err) {
    console.error("Teacher login error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_teacher_courses_teacherId = async (req, res) => {

  try {
    const { teacherId } = req.params;
    const { data: courses, error } = await supabase
      .from('courses')
      .select('course_id, course_name, description, credit_hours, teacher_id, reviews_enabled, reviews_window_start, reviews_window_end, created_at')
      .eq('teacher_id', teacherId);

    if (error) throw error;

    const norm = (v) => (v ? String(v).replace(' ', 'T') : v);
    const out = (courses || []).map(c => ({
      ...c,
      reviews_window_start: norm(c.reviews_window_start),
      reviews_window_end: norm(c.reviews_window_end)
    }));
    res.json({ success: true, courses: out });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }

};

exports.delete_api_teacher_remove_course_id = async (req, res) => {

  (async () => {
    const id = req.params.id;
    const teacherId = req.query.teacherId;
    const cascade = String(req.query.cascade || '').toLowerCase() === 'true' || req.query.cascade === '1';

    if (!teacherId) return res.status(400).json({ success: false, error: 'Missing teacherId query parameter' });

    try {
      // Verify the course belongs to this teacher
      const course = await getAsync('SELECT course_id FROM courses WHERE course_id = ? AND teacher_id = ?', [id, teacherId]);
      if (!course) return res.status(404).json({ success: false, error: 'Course not found for this teacher' });

      // Check dependencies
      const deps = await getAsync(
        `SELECT
           (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) AS enrollments_count,
           (SELECT COUNT(*) FROM assignments WHERE course_id = ?) AS assignments_count,
           (SELECT COUNT(*) FROM quizzes WHERE course_id = ?) AS quizzes_count,
           (SELECT COUNT(*) FROM attendance WHERE course_id = ?) AS attendance_count
         `,
        [id, id, id, id]
      );

      const blockers = [];
      if (deps && deps.enrollments_count && deps.enrollments_count > 0) blockers.push({ type: 'enrollments', count: deps.enrollments_count });
      if (deps && deps.assignments_count && deps.assignments_count > 0) blockers.push({ type: 'assignments', count: deps.assignments_count });
      if (deps && deps.quizzes_count && deps.quizzes_count > 0) blockers.push({ type: 'quizzes', count: deps.quizzes_count });
      if (deps && deps.attendance_count && deps.attendance_count > 0) blockers.push({ type: 'attendance', count: deps.attendance_count });

      if (blockers.length && !cascade) {
        return res.status(409).json({
          success: false,
          error: 'Course has dependent records and cannot be deleted',
          dependencies: blockers,
          hint: 'Remove dependent records first or retry with ?cascade=true to delete related data.'
        });
      }

      if (cascade) {
        try {
          await runAsync('BEGIN TRANSACTION');
          await runAsync('DELETE FROM assignment_submissions WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM assignments WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM quiz_responses WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM quiz_questions WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id = ?)', [id]);
          await runAsync('DELETE FROM quizzes WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM attendance WHERE course_id = ?', [id]);
          await runAsync('DELETE FROM enrollments WHERE course_id = ?', [id]);
          const result = await runAsync('DELETE FROM courses WHERE course_id = ? AND teacher_id = ?', [id, teacherId]);
          await runAsync('COMMIT');
          return res.json({ success: true, deleted: result.changes });
        } catch (err) {
          console.error('Teacher cascade delete failed:', err && err.message ? err.message : err);
          try { await runAsync('ROLLBACK'); } catch (e) { }
          return res.status(500).json({ success: false, error: err.message || String(err) });
        }
      }

      // No blockers: safe to delete
      db.run('DELETE FROM courses WHERE course_id = ? AND teacher_id = ?', [id, teacherId], function (err) {
        if (err) {
          console.error('Teacher remove course error:', err.message);
          if (String(err.message).toLowerCase().includes('foreign key')) {
            return res.status(409).json({ success: false, error: 'Could not delete: dependent records exist', details: err.message });
          }
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, deleted: this.changes });
      });
    } catch (err) {
      console.error('Teacher remove course (check) error:', err && err.message ? err.message : err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  })();

};

exports.get_api_teacher_courses_courseId_students = async (req, res) => {

  try {
    const courseId = req.params.courseId;
    
    // 1. Fetch enrollments
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('student_id, created_at')
      .eq('course_id', courseId);

    if (err1) throw err1;

    if (!enrollments || enrollments.length === 0) {
      // Still need to fetch course details
      const { data: course, error: errC } = await supabase
        .from('courses')
        .select('course_id, course_name, description, teacher_id')
        .eq('course_id', courseId)
        .single();
        
      return res.json({ success: true, course: course || null, students: [] });
    }

    const studentIds = enrollments.map(e => e.student_id);

    // 2. Fetch students
    const { data: students, error: err2 } = await supabase
      .from('students')
      .select('student_id, name, email')
      .in('student_id', studentIds);

    if (err2) throw err2;

    // 3. Process data
    const result = enrollments.map(e => {
      const student = students ? students.find(s => s.student_id === e.student_id) : null;
      return {
        student_id: e.student_id,
        name: student ? student.name : 'Unknown',
        email: student ? student.email : 'Unknown',
        enrolled_at: e.created_at
      };
    });

    // 4. Fetch course details
    const { data: course, error: err4 } = await supabase
      .from('courses')
      .select('course_id, course_name, description, teacher_id')
      .eq('course_id', courseId)
      .single();

    res.json({ success: true, course: course || null, students: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }

};

exports.get_api_teacher_course_courseId_students = async (req, res) => {

  const { courseId } = req.params;
  try {
    // 1. Fetch enrollments
    const { data: enrollments, error: errE } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId);

    if (errE) throw errE;

    if (!enrollments || enrollments.length === 0) {
      return res.json([]);
    }

    const studentIds = enrollments.map(e => e.student_id);

    // 2. Fetch students
    const { data: students, error: errS } = await supabase
      .from('students')
      .select('student_id, name, email')
      .in('student_id', studentIds);

    if (errS) throw errS;

    // 3. Fetch attendance
    const { data: attendance, error: errA } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('course_id', courseId)
      .in('student_id', studentIds);

    if (errA) throw errA;

    // 4. Process data
    const result = students.map(s => {
      const studentAttendance = attendance ? attendance.filter(a => a.student_id === s.student_id) : [];
      const present_count = studentAttendance.filter(a => a.status === 'present').length;
      const absent_count = studentAttendance.filter(a => a.status === 'absent').length;

      return {
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        present_count,
        absent_count
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Failed to fetch course students:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_teacher_attendance_old = (req, res) => {

  const { courseId, attendance } = req.body; // attendance: [{ studentId, status, date }]
  if (!courseId || !Array.isArray(attendance)) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  const stmt = db.prepare(`INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)`);
  let errored = false;
  attendance.forEach(rec => {
    stmt.run([rec.studentId, courseId, rec.date, rec.status], (err) => {
      if (err) errored = true;
    });
  });
  stmt.finalize((err) => {
    if (err || errored) return res.status(500).json({ success: false, error: 'Failed to save attendance' });
    res.json({ success: true });
  });

};

exports.post_api_teacher_quiz = async (req, res) => {

  const { courseId, title, description, timeLimit, allowBackNavigation, randomizeQuestions, questions } = req.body;
  if (!courseId || !title || !Array.isArray(questions)) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  try {
    // 1. Insert the quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        course_id: courseId,
        title,
        description: description || null,
        time_limit: timeLimit || null,
        allow_back_navigation: allowBackNavigation ? true : false,
        randomize_questions: randomizeQuestions ? true : false,
        is_active: false
      }])
      .select('quiz_id')
      .single();

    if (quizError) throw quizError;
    const quizId = quizData.quiz_id;

    // 2. Normalize and insert questions
    const questionRows = questions.map(q => {
      let correctAnswer = q.correctAnswer;
      if (typeof correctAnswer === 'string') {
        if (correctAnswer.length === 1 && /[a-z]/i.test(correctAnswer)) {
          correctAnswer = correctAnswer.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
        } else {
          const opts = Array.isArray(q.options) ? q.options : [];
          const idx = opts.findIndex(opt => String(opt).toLowerCase() === String(correctAnswer).toLowerCase());
          correctAnswer = idx === -1 ? 0 : idx;
        }
      }
      return {
        quiz_id: quizId,
        question_type: q.type || 'MCQ',
        question_text: q.text,
        options: JSON.stringify(q.options || []),
        correct_answer: String(correctAnswer),
        points: q.points || 1
      };
    });

    if (questionRows.length > 0) {
      const { error: qError } = await supabase.from('quiz_questions').insert(questionRows);
      if (qError) throw qError;
    }

    res.json({ success: true, quizId });
  } catch (err) {
    console.error('Failed to create quiz:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_teacher_quizzes_courseId = async (req, res) => {

  const { courseId } = req.params;
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('quiz_id, course_id, title, description, time_limit, is_active, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(quizzes || []);
  } catch (err) {
    console.error('Failed to fetch teacher quizzes:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_teacher_quiz_quizId_toggle = async (req, res) => {

  const { quizId } = req.params;
  const { isActive } = req.body;
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .update({ is_active: isActive ? true : false })
      .eq('quiz_id', quizId);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Toggle quiz error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_teacher_quiz_quizId_results = async (req, res) => {

  const { quizId } = req.params;
  try {
    const { data: responses, error } = await supabase
      .from('quiz_responses')
      .select('score')
      .eq('quiz_id', quizId);

    if (error) throw error;

    const totalParticipants = responses ? responses.length : 0;
    const totalScore = responses ? responses.reduce((acc, r) => acc + (r.score || 0), 0) : 0;
    const averageScore = totalParticipants > 0 ? totalScore / totalParticipants : 0;

    res.json({ totalParticipants, averageScore });
  } catch (err) {
    console.error('Get quiz results error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_teacher_assignment = async (req, res) => {

  const { courseId, title, description, link, dueDate } = req.body;
  if (!courseId || !title) return res.status(400).json({ success: false, error: 'Missing fields' });
  
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert([
        { 
          course_id: parseInt(courseId), 
          title: title.trim(), 
          description: description ? description.trim() : null, 
          link: link ? link.trim() : null, 
          due_date: dueDate || null 
        }
      ])
      .select();

    if (error) throw error;

    const newId = data && data[0] ? data[0].assignment_id : null;
    res.json({ success: true, assignmentId: newId });
  } catch (err) {
    console.error('Failed to create assignment:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_teacher_assignment_assignmentId_marks = async (req, res) => {

  const { assignmentId } = req.params;
  const { marks } = req.body; // Expecting [{ studentId, marks }, ...]

  if (!Array.isArray(marks)) {
    return res.status(400).json({ success: false, error: 'Expected marks array' });
  }

  try {
    for (const m of marks) {
      if (m.marks != null) {
        const val = parseFloat(m.marks);
        if (isNaN(val) || val < 0 || val > 100) {
          return res.status(400).json({ success: false, error: 'Marks must be a number between 0 and 100' });
        }
      }
    }

    const records = marks.map(m => ({
      assignment_id: parseInt(assignmentId),
      student_id: parseInt(m.studentId),
      marks: m.marks != null ? parseFloat(m.marks) : null
    }));

    const { error } = await supabase
      .from('assignment_submissions')
      .upsert(records, { onConflict: 'assignment_id,student_id' });

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to save assignment marks:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_teacher_assignment_assignmentId_submissions = async (req, res) => {

  const { assignmentId } = req.params;
  try {
    // 1. Fetch course_id for the assignment
    const { data: assignment, error: errA } = await supabase
      .from('assignments')
      .select('course_id')
      .eq('assignment_id', assignmentId)
      .single();

    if (errA) throw errA;
    if (!assignment) return res.json({ success: true, students: [] });

    const courseId = assignment.course_id;

    // 2. Fetch enrollments for that course
    const { data: enrollments, error: errE } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId);

    if (errE) throw errE;
    if (!enrollments || enrollments.length === 0) return res.json({ success: true, students: [] });

    const studentIds = enrollments.map(e => e.student_id);

    // 3. Fetch students
    const { data: students, error: errS } = await supabase
      .from('students')
      .select('student_id, name')
      .in('student_id', studentIds);

    if (errS) throw errS;

    // 4. Fetch submissions for this assignment
    const { data: submissions, error: errSub } = await supabase
      .from('assignment_submissions')
      .select('student_id, marks')
      .eq('assignment_id', assignmentId);

    if (errSub) throw errSub;

    // 5. Process data
    const result = students.map(st => {
      const submission = submissions ? submissions.find(sub => sub.student_id === st.student_id) : null;
      return {
        student_id: st.student_id,
        name: st.name,
        marks: submission ? submission.marks : null,
        submitted: !!submission,
        file_url: submission ? `https://qupkoahkwisctivxmtlf.supabase.co/storage/v1/object/public/assignments/assignment_${assignmentId}_student_${st.student_id}.pdf` : null
      };
    });

    // Sort by name
    result.sort((x, y) => x.name.localeCompare(y.name));

    res.json({ success: true, students: result });
  } catch (err) {
    console.error('Failed to fetch assignment submissions:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_teacher_quiz_quizId = async (req, res) => {

  const { quizId } = req.params;
  try {
    await supabase.from('quiz_responses').delete().eq('quiz_id', quizId);
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
    const { error } = await supabase.from('quizzes').delete().eq('quiz_id', quizId);
    if (error) throw error;
    res.json({ success: true, deleted: 1 });
  } catch (err) {
    console.error('Delete quiz error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_teacher_course_courseId_marks = async (req, res) => {

  const { courseId } = req.params;
  try {
    // 1. Fetch enrollments
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', courseId);

    if (err1) throw err1;
    if (!enrollments || enrollments.length === 0) return res.json({ success: true, students: [] });

    const studentIds = enrollments.map(e => e.student_id);

    // 2. Fetch students
    const { data: students, error: err2 } = await supabase
      .from('students')
      .select('student_id, name')
      .in('student_id', studentIds);

    if (err2) throw err2;

    // 3. Fetch student grades
    const { data: grades, error: err3 } = await supabase
      .from('student_grades')
      .select('student_id, quiz_marks, assignment_marks, mid_marks, final_marks, total_marks, grade')
      .eq('course_id', courseId)
      .in('student_id', studentIds);

    if (err3) throw err3;

    // 4. Process data
    const result = students.map(s => {
      const grade = grades ? grades.find(g => g.student_id === s.student_id) : null;
      return {
        student_id: s.student_id,
        name: s.name,
        quiz_marks: grade ? grade.quiz_marks : null,
        assignment_marks: grade ? grade.assignment_marks : null,
        mid_marks: grade ? grade.mid_marks : null,
        final_marks: grade ? grade.final_marks : null,
        total_marks: grade ? grade.total_marks : null,
        grade: grade ? grade.grade : null
      };
    });

    // Sort by name
    result.sort((x, y) => x.name.localeCompare(y.name));

    res.json({ success: true, students: result });
  } catch (err) {
    console.error('Failed to fetch course marks:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_teacher_course_courseId_marks = async (req, res) => {

  const { courseId } = req.params;
  const { studentId, midMarks, finalMarks } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'Missing studentId' });
  }

  // Validate mark ranges
  if (midMarks && (midMarks < 0 || midMarks > 30)) {
    return res.status(400).json({ success: false, error: 'Mid marks must be between 0 and 30' });
  }
  if (finalMarks && (finalMarks < 0 || finalMarks > 40)) {
    return res.status(400).json({ success: false, error: 'Final marks must be between 0 and 40' });
  }

  try {
    const sql = `
      INSERT INTO mid_final_marks (student_id, course_id, mid_marks, final_marks)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id, course_id) DO UPDATE SET
      mid_marks = COALESCE(excluded.mid_marks, mid_marks),
      final_marks = COALESCE(excluded.final_marks, final_marks),
      updated_at = CURRENT_TIMESTAMP
      ON CONFLICT(student_id, course_id) DO UPDATE SET
      mid_marks = COALESCE(excluded.mid_marks, mid_marks),
      final_marks = COALESCE(excluded.final_marks, final_marks)
    `;

    await runAsync(sql, [studentId, courseId, midMarks || null, finalMarks || null]);
    res.json({ success: true });
  } catch (err) {
    console.error('Update marks error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_teacher_course_courseId_student_studentId_quizzes = async (req, res) => {

  const { courseId, studentId } = req.params;
  try {
    const sql = `
      SELECT 
        q.quiz_id,
        q.title,
        (SELECT SUM(qr.marks) 
         FROM quiz_responses qr 
         JOIN quiz_questions qq ON qr.question_id = qq.question_id 
         WHERE qq.quiz_id = q.quiz_id AND qr.student_id = ?) as marks
      FROM quizzes q
      WHERE q.course_id = ?
      ORDER BY q.created_at DESC
    `;
    const quizzes = await allAsync(sql, [studentId, courseId]);
    res.json({ success: true, quizzes });
  } catch (err) {
    console.error('Get student quizzes error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_teacher_course_courseId_student_studentId_assignments = async (req, res) => {

  const { courseId, studentId } = req.params;
  try {
    const sql = `
      SELECT 
        a.assignment_id,
        a.title,
        asub.marks
      FROM assignments a
      LEFT JOIN assignment_submissions asub 
        ON a.assignment_id = asub.assignment_id 
        AND asub.student_id = ?
      WHERE a.course_id = ?
      ORDER BY a.due_date DESC
    `;
    const assignments = await allAsync(sql, [studentId, courseId]);
    res.json({ success: true, assignments });
  } catch (err) {
    console.error('Get student assignments error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_teacher_assignment_assignmentId = async (req, res) => {

  const { assignmentId } = req.params;
  try {
    const { data, error } = await supabase
      .from('assignments')
      .delete()
      .eq('assignment_id', assignmentId);

    if (error) throw error;

    res.json({ success: true, deleted: 1 });
  } catch (err) {
    console.error('Delete assignment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_teacher_student_grade = async (req, res) => {

  const { studentId, courseId, quizMarks, assignmentMarks, midMarks, finalMarks, totalMarks, grade } = req.body;

  if (!studentId || !courseId || !grade) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const sql = `
      INSERT INTO student_grades (
        student_id, course_id, quiz_marks, assignment_marks, 
        mid_marks, final_marks, total_marks, grade, cgpa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, course_id) DO UPDATE SET
        quiz_marks = excluded.quiz_marks,
        assignment_marks = excluded.assignment_marks,
        mid_marks = excluded.mid_marks,
        final_marks = excluded.final_marks,
        total_marks = excluded.total_marks,
        grade = excluded.grade,
        cgpa = excluded.cgpa,
        created_at = CURRENT_TIMESTAMP
    `;

    await runAsync(sql, [
      studentId, courseId, quizMarks, assignmentMarks,
      midMarks, finalMarks, totalMarks, grade, req.body.cgpa || null
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Save grade error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_teacher_attendance = async (req, res) => {

  const { courseId, attendance } = req.body;
  if (!courseId || !Array.isArray(attendance)) return res.status(400).json({ success: false, error: 'Missing fields: courseId and attendance array are required' });
  try {
    for (const rec of attendance) {
      const studentId = rec.studentId || rec.student_id;
      const date = rec.date;
      const status = rec.status;
      if (!studentId || !date || !['present', 'absent'].includes(status)) continue; // skip invalid

      const { data: existing, error: findError } = await supabase
        .from('attendance')
        .select('attendance_id')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .eq('date', date);

      if (findError) throw findError;

      if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ status })
          .eq('attendance_id', existing[0].attendance_id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('attendance')
          .insert({ student_id: studentId, course_id: courseId, date, status });
        if (insertError) throw insertError;
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Batch update attendance error:', err.message || err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update attendance' });
  }

};

exports.post_api_instructor_report = async (req, res) => {

  try {
    const { teacher_id, rating, comments, period_start, period_end } = req.body;
    if (!teacher_id || !rating) return res.status(400).json({ success: false, error: 'Missing fields' });
    const result = await runAsync(`INSERT INTO instructor_performance (teacher_id, period_start, period_end, rating, comments) VALUES (?, ?, ?, ?, ?)`, [teacher_id, period_start || null, period_end || null, rating, comments || null]);
    res.json({ success: true, report_id: result.lastID });
  } catch (err) {
    console.error('Submit instructor report error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_instructor_reports_teacherId = async (req, res) => {

  try {
    const teacherId = req.params.teacherId;
    const reports = await allAsync(`SELECT report_id, teacher_id, period_start, period_end, rating, comments, created_at FROM instructor_performance WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 100`, [teacherId]);
    const agg = await getAsync(`SELECT COUNT(*) as count, AVG(rating) as avg_rating, MIN(rating) as min_rating, MAX(rating) as max_rating FROM instructor_performance WHERE teacher_id = ?`, [teacherId]);
    res.json({ success: true, reports, aggregate: agg });
  } catch (err) {
    console.error('Get instructor reports error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};


exports.patch_api_teacher_attendance = async (req, res) => {
  const { supabase } = require('../config/db');
  const { courseId, date, studentId, status } = req.body;
  if (!courseId || !date || !status) return res.status(400).json({ success: false, error: 'Missing fields' });
  if (!['present', 'absent'].includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
  try {
    if (studentId) {
      const { data: ex, error: fe } = await supabase.from('attendance').select('attendance_id').eq('course_id', courseId).eq('student_id', studentId).eq('date', date);
      if (fe) throw fe;
      if (ex && ex.length > 0) {
        const { error: ue } = await supabase.from('attendance').update({ status }).eq('attendance_id', ex[0].attendance_id);
        if (ue) throw ue;
      } else {
        const { error: ie } = await supabase.from('attendance').insert({ student_id: studentId, course_id: courseId, date, status });
        if (ie) throw ie;
      }
      return res.json({ success: true });
    }
    const { data: enr, error: ee } = await supabase.from('enrollments').select('student_id').eq('course_id', courseId);
    if (ee) throw ee;
    for (const s of (enr || [])) {
      const { data: ex2, error: fe2 } = await supabase.from('attendance').select('attendance_id').eq('course_id', courseId).eq('student_id', s.student_id).eq('date', date);
      if (fe2) throw fe2;
      if (ex2 && ex2.length > 0) {
        const { error: ue2 } = await supabase.from('attendance').update({ status }).eq('attendance_id', ex2[0].attendance_id);
        if (ue2) throw ue2;
      } else {
        const { error: ie2 } = await supabase.from('attendance').insert({ student_id: s.student_id, course_id: courseId, date, status });
        if (ie2) throw ie2;
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update attendance error:', err.message || err);
    res.status(500).json({ success: false, error: err.message || 'Failed to update attendance' });
  }
};

const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

exports.post_api_student_feedback = async (req, res) => {

      const { student_id, course_id, teacher_id, rating, review } = req.body;
      if (!student_id || !course_id || !teacher_id || !rating || !review) {
        return res
          .status(400)
          .json({ success: false, error: "Missing fields" });
      }
      try {
        // Fetch course from Supabase
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('student_feedback_enabled, student_feedback_window_start, student_feedback_window_end')
          .eq('course_id', course_id)
          .single();

        if (courseError || !course) {
          return res.status(404).json({ success: false, error: 'Course not found' });
        }

        const sfFlag = (course.student_feedback_enabled === undefined || course.student_feedback_enabled === null) ? 1 : Number(course.student_feedback_enabled);
        if (!sfFlag) {
          return res.status(403).json({ success: false, error: 'Student feedback disabled' });
        }

        if (course.student_feedback_window_start || course.student_feedback_window_end) {
          const now = new Date();
          const normStart = course.student_feedback_window_start ? String(course.student_feedback_window_start).replace(' ', 'T') : null;
          const normEnd = course.student_feedback_window_end ? String(course.student_feedback_window_end).replace(' ', 'T') : null;
          const startOk = normStart ? now >= new Date(normStart) : true;
          const endOk = normEnd ? now <= new Date(normEnd) : true;
          if (!(startOk && endOk)) {
            return res.status(403).json({ success: false, error: 'Student feedback window closed' });
          }
        }

        // Check if feedback already exists in Supabase
        const { data: existing, error: existingError } = await supabase
          .from('feedback')
          .select('feedback_id, created_at')
          .eq('student_id', student_id)
          .eq('teacher_id', teacher_id)
          .eq('course_id', course_id)
          .maybeSingle();

        if (existing) {
          const existingCreated = existing.created_at ? new Date(existing.created_at) : null;
          const windowStart = course.student_feedback_window_start ? new Date(course.student_feedback_window_start.replace(' ', 'T')) : null;
          const windowEnd = course.student_feedback_window_end ? new Date(course.student_feedback_window_end.replace(' ', 'T')) : null;

          if (windowStart || windowEnd) {
            const inWindow = (windowStart ? existingCreated >= windowStart : true) && (windowEnd ? existingCreated <= windowEnd : true);
            if (inWindow) {
              return res.status(403).json({ success: false, error: 'Feedback already submitted in this feedback period' });
            }
            
            // Update feedback in Supabase
            const { error: updateError } = await supabase
              .from('feedback')
              .update({ rating, review, created_at: new Date().toISOString() })
              .eq('feedback_id', existing.feedback_id);

            if (updateError) throw updateError;
            return res.json({ success: true, message: 'Feedback updated (outside previous period)' });
          }

          return res.status(403).json({ success: false, error: 'Feedback already submitted' });
        }

        // Insert new feedback into Supabase
        const { error: insertError } = await supabase
          .from('feedback')
          .insert([{ student_id, course_id, teacher_id, rating, review }]);

        if (insertError) throw insertError;

        res.json({ success: true, message: "Feedback submitted" });
      } catch (err) {
        console.error("Feedback error:", err && err.message ? err.message : err);
        res.status(500).json({ success: false, error: err.message || String(err) });
      }
    
};

exports.post_api_student_login = async (req, res) => {

  const { email, password } = req.body;
  try {
    const { data: s, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!s) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, s.password);
    if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

    delete s.password;
    res.json({ success: true, student: s });
  } catch (err) {
    console.error("Student login error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_student_signup = (req, res) => {

  res.status(403).json({ success: false, error: "Signup is disabled" });

};

exports.get_api_student_attendance_studentId = async (req, res) => {

  try {
    const { studentId } = req.params;

    // Validate student exists (Using Supabase Client)
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('student_id')
      .eq('student_id', studentId)
      .single();

    if (studentErr || !student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // 1. Fetch enrollments with course names
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('course_id, courses(course_name)')
      .eq('student_id', studentId);

    if (err1) throw err1;

    // 2. Fetch attendance records for this student
    const { data: attendance, error: err2 } = await supabase
      .from('attendance')
      .select('course_id, date, status')
      .eq('student_id', studentId);

    if (err2) throw err2;

    // 3. Process data
    const processedRows = enrollments.map(e => {
      const courseId = e.course_id;
      const courseName = e.courses ? e.courses.course_name : 'Unknown';
      
      const records = attendance ? attendance.filter(a => a.course_id === courseId) : [];
      const total = records.length;
      const present = records.filter(a => a.status === 'present').length;
      const absent = records.filter(a => a.status === 'absent').length;
      
      const percentage = total === 0 ? 0 : parseFloat(((present * 100) / total).toFixed(2));
      
      const details = records.map(a => ({ date: a.date, status: a.status }));

      return {
        course_id: courseId,
        course_name: courseName,
        attendance_details: details,
        present_count: present,
        absent_count: absent,
        attendance_percentage: percentage
      };
    });

    res.json({ success: true, data: processedRows });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance records',
      details: err.message
    });
  }

};

exports.get_api_student_studentId_quizzes = async (req, res) => {

  const { studentId } = req.params;
  try {
    // 1. Fetch enrollments with course names
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('course_id, courses(course_name)')
      .eq('student_id', studentId);

    if (err1) throw err1;

    if (!enrollments || enrollments.length === 0) {
      return res.json({ success: true, quizzes: [] });
    }

    const courseIds = enrollments.map(e => e.course_id);

    // 2. Fetch quizzes for these courses
    const { data: quizzes, error: err2 } = await supabase
      .from('quizzes')
      .select('quiz_id, title, description, time_limit, is_active, course_id')
      .in('course_id', courseIds);

    if (err2) throw err2;

    // 3. Fetch quiz responses for this student
    const { data: responses, error: err3 } = await supabase
      .from('quiz_responses')
      .select('quiz_id, score, submitted_at')
      .eq('student_id', studentId);

    if (err3) throw err3;

    // 4. Fetch total questions for each quiz
    const quizIds = quizzes ? quizzes.map(q => q.quiz_id) : [];
    const { data: questions, error: err4 } = await supabase
      .from('quiz_questions')
      .select('quiz_id')
      .in('quiz_id', quizIds);

    if (err4) throw err4;

    // 5. Process data
    const result = quizzes ? quizzes.map(q => {
      const course = enrollments.find(e => e.course_id === q.course_id);
      const courseName = course && course.courses ? course.courses.course_name : 'Unknown';
      
      const response = responses ? responses.find(r => r.quiz_id === q.quiz_id) : null;
      
      const quizQuestions = questions ? questions.filter(qq => qq.quiz_id === q.quiz_id) : [];
      
      return {
        quiz_id: q.quiz_id,
        title: q.title,
        description: q.description,
        time_limit: q.time_limit,
        is_active: q.is_active,
        course_id: q.course_id,
        course_name: courseName,
        student_score: response ? response.score : null,
        submitted_at: response ? response.submitted_at : null,
        total_questions: quizQuestions.length
      };
    }) : [];

    res.json({ success: true, quizzes: result });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch quizzes' });
  }

};

exports.get_api_student_studentId_assignments = async (req, res) => {

  const { studentId } = req.params;
  try {
    // 1. Fetch enrollments with course names
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('course_id, courses(course_name)')
      .eq('student_id', studentId);

    if (err1) throw err1;

    if (!enrollments || enrollments.length === 0) {
      return res.json({ success: true, assignments: [] });
    }

    const courseIds = enrollments.map(e => e.course_id);

    // 2. Fetch assignments for these courses
    const { data: assignments, error: err2 } = await supabase
      .from('assignments')
      .select('assignment_id, title, description, link, due_date, created_at, course_id')
      .in('course_id', courseIds);

    if (err2) throw err2;

    // 3. Fetch submissions for this student
    const { data: submissions, error: err3 } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, submission_id, marks, submitted_at')
      .eq('student_id', studentId);

    if (err3) throw err3;

    // 4. Process data
    const now = new Date();
    const result = assignments ? assignments.map(a => {
      const course = enrollments.find(e => e.course_id === a.course_id);
      const courseName = course && course.courses ? course.courses.course_name : 'Unknown';
      
      const submission = submissions ? submissions.find(s => s.assignment_id === a.assignment_id) : null;
      
      let status = 'pending';
      if (submission && submission.submitted_at) {
        status = 'submitted';
      } else if (new Date(a.due_date) < now) {
        status = 'overdue';
      }

      return {
        assignment_id: a.assignment_id,
        title: a.title,
        description: a.description,
        link: a.link,
        due_date: a.due_date,
        created_at: a.created_at,
        course_id: a.course_id,
        course_name: courseName,
        submission_id: submission ? submission.submission_id : null,
        marks: submission ? submission.marks : null,
        submitted_at: submission ? submission.submitted_at : null,
        status: status
      };
    }) : [];

    // Sort by due_date ASC
    result.sort((x, y) => new Date(x.due_date) - new Date(y.due_date));

    res.json({ success: true, assignments: result });
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }

};

exports.post_api_student_enroll = async (req, res) => {

  const { student_id, course_id } = req.body || {};

  if (!student_id || !course_id) {
    return res.status(400).json({ success: false, error: 'Student ID and Course ID are required' });
  }

  try {

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('student_id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('course_id, course_name, teacher_id, prerequisite_course_id')
      .eq('course_id', course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    if (course.prerequisite_course_id) {
      const { data: grades, error: prereqErr } = await supabase
        .from('student_grades')
        .select('grade')
        .eq('student_id', student_id)
        .eq('course_id', course.prerequisite_course_id);
      
      if (prereqErr) throw prereqErr;
      
      const passed = grades && grades.some(g => g.grade && g.grade.toUpperCase() !== 'F');
      if (!passed) {
        return res.status(400).json({ success: false, error: 'You must pass the prerequisite course first' });
      }
    }

    const { data: existing, error: existingError } = await supabase
      .from('enrollments')
      .select('enrollment_id')
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return res.status(400).json({ success: false, error: 'You are already enrolled in this course' });
    }

    const { data: enrollment, error: insertError } = await supabase
      .from('enrollments')
      .insert([{ student_id, course_id }])
      .select('enrollment_id')
      .single();

    if (insertError) throw insertError;

    res.json({
      success: true,
      enrollment_id: enrollment.enrollment_id,
      message: `Enrolled in ${course.course_name} successfully`
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error('Student enroll error:', err.message);
    res.status(statusCode).json({ success: false, error: err.message });
  }

};

exports.get_api_student_enrollments_studentId = async (req, res) => {

  try {
    const studentId = req.params.studentId;
    
    // 1. Fetch enrollments
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('enrollment_id, student_id, course_id, created_at')
      .eq('student_id', studentId);

    if (err1) throw err1;

    if (!enrollments || enrollments.length === 0) {
      return res.json({ success: true, enrollments: [] });
    }

    const courseIds = enrollments.map(e => e.course_id);

    // 2. Fetch courses
    const { data: courses, error: err2 } = await supabase
      .from('courses')
      .select('course_id, course_name, credit_hours, schedule, duration, teacher_id')
      .in('course_id', courseIds);

    if (err2) throw err2;

    const teacherIds = courses ? courses.map(c => c.teacher_id).filter(id => id) : [];

    // 3. Fetch teachers
    const { data: teachers, error: err3 } = await supabase
      .from('teachers')
      .select('teacher_id, name')
      .in('teacher_id', teacherIds);

    if (err3) throw err3;

    // 4. Process data
    const result = enrollments.map(e => {
      const course = courses ? courses.find(c => c.course_id === e.course_id) : null;
      const courseName = course ? course.course_name : 'Unknown';
      const creditHours = course ? getCourseCreditHours(course) : 0;
      const schedule = course ? course.schedule : null;
      const duration = course ? course.duration : null;
      const teacherId = course ? course.teacher_id : null;
      
      const teacher = teachers ? teachers.find(t => t.teacher_id === teacherId) : null;
      const teacherName = teacher ? teacher.name : 'Unknown';

      return {
        enrollment_id: e.enrollment_id,
        student_id: e.student_id,
        course_id: e.course_id,
        course_name: courseName,
        credit_hours: creditHours,
        schedule: schedule,
        duration: duration,
        teacher_id: teacherId,
        teacher_name: teacherName,
        created_at: e.created_at
      };
    });

    // Sort by course_id ASC
    result.sort((x, y) => x.course_id - y.course_id);

    res.json({ success: true, enrollments: result });
  } catch (err) {
    console.error('Failed to fetch student enrollments:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_student_studentId_fee_challans = async (req, res) => {

  try {
    const { studentId } = req.params;
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id, name, email')
      .eq('student_id', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const { data, error } = await supabase
      .from('fee_challans')
      .select('*')
      .eq('student_name', student.name)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const challans = (data || [])
      .map(parseChallanRow)
      .filter(challan => !challan.student_id || String(challan.student_id) === String(studentId));

    res.json({ success: true, challans });
  } catch (err) {
    console.error('Student fee challans error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_student_quiz_quizId_questions = async (req, res) => {

  const { quizId } = req.params;
  try {
    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .select('quiz_id, title, time_limit, is_active, allow_back_navigation, randomize_questions')
      .eq('quiz_id', quizId)
      .single();

    if (quizErr) throw quizErr;
    if (!quiz || !quiz.is_active) {
      return res.status(404).json({ success: false, error: 'Quiz not found or not active' });
    }

    const { data: questions, error: qErr } = await supabase
      .from('quiz_questions')
      .select('question_id, question_type, question_text, options')
      .eq('quiz_id', quizId);

    if (qErr) throw qErr;

    res.json({
      success: true,
      quiz: {
        quizId: quiz.quiz_id,
        title: quiz.title,
        timeLimit: quiz.time_limit,
        allow_back_navigation: quiz.allow_back_navigation,
        randomize_questions: quiz.randomize_questions,
        questions: questions.map(q => {
          let opts = q.options;
          if (typeof opts === 'string') {
            try { opts = JSON.parse(opts); } catch (e) { /* keep as-is */ }
          }
          return {
            question_id: q.question_id,
            question_type: q.question_type,
            question_text: q.question_text,
            options: opts
          };
        })
      }
    });
  } catch (err) {
    console.error('Get quiz questions error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_student_quiz_quizId_submit = async (req, res) => {

  const { quizId } = req.params;
  const studentId = req.body.studentId || req.body.student_id;
  const answers = req.body.answers;
  if (!studentId || !answers) return res.status(400).json({ success: false, error: 'Missing fields: studentId and answers are required' });

  console.log('Quiz submit received:', { quizId, studentId, answersCount: (answers && typeof answers === 'object') ? Object.keys(answers).length : 0 });

  try {
    const { data: questions, error: fetchError } = await supabase
      .from('quiz_questions')
      .select('question_id, correct_answer, points, options')
      .eq('quiz_id', quizId);

    if (fetchError) throw fetchError;

    let score = 0;

    (questions || []).forEach(q => {
      try {
        const given = answers[q.question_id];
        if (given == null) return; // no answer provided

        // Parse options safely
        let questionOptions = [];
        try {
          questionOptions = JSON.parse(q.options || '[]');
        } catch (e) {
          console.error(`Failed to parse options for question ${q.question_id}:`, e);
          return; // skip this question
        }

        // Normalize student answer to index (robust: accept index, letter, or option text)
        let studentIndex = null;
        try {
          const rawGiven = given;
          const numGiven = Number(rawGiven);
          if (!isNaN(numGiven) && Number.isFinite(numGiven) && numGiven >= 0 && numGiven < questionOptions.length) {
            studentIndex = numGiven;
          } else if (typeof rawGiven === 'string' && /^[a-zA-Z]$/.test(rawGiven)) {
            studentIndex = rawGiven.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
          } else {
            // match by option text
            studentIndex = questionOptions.findIndex(opt => String(opt).trim().toLowerCase() === String(rawGiven).trim().toLowerCase());
            if (studentIndex === -1) studentIndex = null;
          }
        } catch (e) {
          studentIndex = null;
        }

        // Determine correct answer index robustly
        let correctIndex = null;
        try {
          let ca = q.correct_answer;
          // If stored as JSON (e.g., "1" or ["1"]), try parsing
          if (typeof ca === 'string') {
            try {
              const parsed = JSON.parse(ca);
              if (typeof parsed === 'number' || typeof parsed === 'string') ca = parsed;
              else if (Array.isArray(parsed) && parsed.length > 0) ca = parsed[0];
            } catch (e) {
              // not JSON, keep as-is
            }
          }

          const numCa = Number(ca);
          if (!isNaN(numCa) && Number.isFinite(numCa) && numCa >= 0 && numCa < questionOptions.length) {
            correctIndex = numCa;
          } else if (typeof ca === 'string' && /^[a-zA-Z]$/.test(ca)) {
            correctIndex = ca.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
          } else {
            correctIndex = questionOptions.findIndex(opt => String(opt).trim().toLowerCase() === String(ca).trim().toLowerCase());
            if (correctIndex === -1) correctIndex = null;
          }
        } catch (e) {
          correctIndex = null;
        }

        console.log(`Question ${q.question_id} comparison:`, { studentIndex, correctIndex, studentGiven: given });

        if (studentIndex !== null && correctIndex !== null && studentIndex === correctIndex) {
          score += (q.points != null ? Number(q.points) : 1) || 1;
          console.log(`Question ${q.question_id}: CORRECT`);
        } else {
          console.log(`Question ${q.question_id}: WRONG (expected ${correctIndex} got ${studentIndex})`);
        }

      } catch (e) {
        console.error(`Error processing question ${q.question_id}:`, e);
      }
    });

    const { error: insertError } = await supabase
      .from('quiz_responses')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        answers: JSON.stringify(answers),
        score: score
      });

    if (insertError) throw insertError;

    return res.json({ success: true, score });
  } catch (err) {
    console.error('Quiz submit error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_student_studentId_grades = async (req, res) => {

  const { studentId } = req.params;

  try {
    const { data: grades, error: gradesError } = await supabase
      .from('student_grades')
      .select('course_id, total_marks, grade, cgpa')
      .eq('student_id', studentId);

    if (gradesError) throw gradesError;

    const courseIds = (grades || []).map(g => g.course_id).filter(Boolean);
    let coursesById = new Map();
    if (courseIds.length > 0) {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('course_id, course_name')
        .in('course_id', courseIds);

      if (coursesError) throw coursesError;
      coursesById = new Map((courses || []).map(c => [String(c.course_id), c.course_name]));
    }

    const result = (grades || []).map(g => ({
      course_id: g.course_id,
      course_name: coursesById.get(String(g.course_id)) || 'Unknown',
      marks_obtained: g.total_marks,
      total_marks: g.total_marks,
      grade: g.grade,
      cgpa: g.cgpa
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Get student grades error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_student_transcript_studentId = async (req, res) => {

  const { studentId } = req.params;
  try {
    // 1. Fetch enrollments
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('course_id, courses(course_name)')
      .eq('student_id', studentId);

    if (err1) throw err1;

    if (!enrollments || enrollments.length === 0) {
      return res.json({ success: true, transcript: [] });
    }

    const courseIds = enrollments.map(e => e.course_id);

    // 2. Fetch student grades
    const { data: grades, error: err2 } = await supabase
      .from('student_grades')
      .select('course_id, total_marks, grade, cgpa')
      .eq('student_id', studentId);

    if (err2) throw err2;

    // 3. Process data
    const result = enrollments.map(e => {
      const courseId = e.course_id;
      const courseName = e.courses ? e.courses.course_name : 'Unknown';
      
      const grade = grades ? grades.find(g => g.course_id === courseId) : null;
      
      return {
        course_id: courseId,
        name: courseName,
        total_marks: grade ? grade.total_marks : null,
        grade: grade ? grade.grade : null,
        cgpa: grade ? grade.cgpa : null
      };
    });

    // Sort by name
    result.sort((x, y) => x.name.localeCompare(y.name));

    res.json({ success: true, transcript: result });
  } catch (err) {
    console.error('Get transcript error:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_student_assignment_assignmentId_submit = async (req, res) => {

  const { assignmentId } = req.params;
  const studentId = req.body.studentId || req.body.student_id;

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'Missing studentId' });
  }

  try {
    // Check if assignment exists and is not past due date
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignments')
      .select('due_date')
      .eq('assignment_id', assignmentId)
      .limit(1);

    if (assignmentError) throw assignmentError;
    const assignment = assignments && assignments.length > 0 ? assignments[0] : null;

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
      return res.status(400).json({ success: false, error: 'Assignment is past due date' });
    }

    // Check if already submitted
    const { data: existing, error: existingError } = await supabase
      .from('assignment_submissions')
      .select('submission_id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .limit(1);

    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Assignment already submitted' });
    }

    // Upload file to Supabase Storage if present
    if (req.file) {
      const fileName = `assignment_${assignmentId}_student_${studentId}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
      
      if (uploadError) {
        console.error('File upload failed:', uploadError);
        return res.status(500).json({ success: false, error: 'Failed to upload PDF file' });
      }
    }

    // Submit the assignment
    const { error: insertError } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId
      });
      
    if (insertError) throw insertError;

    res.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (err) {
    console.error('Error submitting assignment:', err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_student_fee_challans_challanId_pay = async (req, res) => {

  try {
    const { amount, card_last4 } = req.body;
    
    // In a real scenario, we'd verify with Stripe or another gateway here.
    // For now, we simulate success and mark the challan as Paid in Supabase.
    
    const { error } = await supabase
      .from('fee_challans')
      .update({ status: 'Paid' })
      .eq('challan_id', req.params.challanId);
      
    if (error) throw error;
    
    res.json({ success: true, message: 'Payment successful', amount_paid: amount, card: card_last4 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_student_studentId_registration_window = async (req, res) => {

  try {
    const { studentId } = req.params;
    
    // Get student's degree program
    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('degree_program')
      .eq('student_id', studentId)
      .single();
    
    if (sErr || !student) return res.status(404).json({ success: false, error: 'Student not found' });
    
    const degreeProgram = student.degree_program || null;
    
    if (!degreeProgram) {
      return res.json({ success: true, eligible: false, reason: 'No degree program assigned to your account. Please contact admin.', window: null });
    }
    
    // Find active window for this degree
    const now = new Date().toISOString();
    const { data: windows, error: wErr } = await supabase
      .from('registration_windows')
      .select('*')
      .eq('degree_program', degreeProgram)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (wErr) throw wErr;
    
    const activeWindow = (windows || []).find(w => {
      const inMain = now >= w.open_date && now <= w.close_date;
      const inLate = w.late_open_date && w.late_close_date && now >= w.late_open_date && now <= w.late_close_date;
      return inMain || inLate;
    });
    
    const nextWindow = (windows || []).find(w => now < w.open_date);
    
    if (activeWindow) {
      const now2 = new Date();
      const inLate = activeWindow.late_open_date && now2 >= new Date(activeWindow.late_open_date) && now2 <= new Date(activeWindow.late_close_date);
      return res.json({ 
        success: true, 
        eligible: true, 
        isLateRegistration: Boolean(inLate),
        window: activeWindow,
        degree_program: degreeProgram
      });
    }
    
    if (nextWindow) {
      return res.json({ 
        success: true, 
        eligible: false, 
        reason: `Registration opens on ${new Date(nextWindow.open_date).toLocaleDateString()} for ${degreeProgram} students.`,
        window: nextWindow,
        degree_program: degreeProgram
      });
    }
    
    return res.json({ 
      success: true, 
      eligible: false, 
      reason: `No active registration window for ${degreeProgram} program. Please contact admin.`,
      window: null,
      degree_program: degreeProgram
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};


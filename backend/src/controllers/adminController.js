const { registerAdminWorkspace, resolveWorkspaceCourseIds, isPlatformSuperAdmin } = require('../utils/workspaces');
const { supabase, db, getAsync, runAsync, allAsync } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

exports.post_api_admin_signup = async (req, res) => {
  const { name, email, password, academy_name, first_class_name } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email, and password are required" });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    // Check if admin already exists
    const { data: existing } = await supabase
      .from('admins')
      .select('admin_id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, error: "An admin account with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    // Role 2 is regular Academy Admin (Role 1 is Super Super Admin)
    const { data: newAdmin, error: adminErr } = await supabase
      .from('admins')
      .insert([{ name: name.trim(), email: cleanEmail, password: hashed, role_id: 2 }])
      .select('admin_id, name, email, role_id')
      .single();

    if (adminErr) throw adminErr;

    let createdCourseId = null;
    if (first_class_name && first_class_name.trim()) {
      const courseTitle = first_class_name.trim();
      const { data: newCourse, error: cErr } = await supabase
        .from('courses')
        .insert([{
          course_name: courseTitle,
          description: `Academic batch for ${courseTitle} at ${academy_name || 'Academy'}.`,
          credit_hours: 3,
          status: 'Published',
          category: 'General'
        }])
        .select('course_id')
        .single();

      if (!cErr && newCourse) {
        createdCourseId = newCourse.course_id;
      }
    }

    registerAdminWorkspace(
      newAdmin.admin_id,
      newAdmin.email,
      academy_name || name + "'s Academy",
      createdCourseId
    );

    res.json({
      success: true,
      admin: {
        ...newAdmin,
        is_super_admin: false,
        academy_name: academy_name || name + "'s Academy"
      },
      course_id: createdCourseId
    });
  } catch (err) {
    console.error("Admin signup error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.post_api_admin_login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: "Missing fields" });

  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!admin) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

    // Identify if this is the single Super Super Admin (daniyal@learnsphere.com or role_id 1)
    const isSuperAdmin = admin.email.toLowerCase() === 'daniyal@learnsphere.com' || admin.role_id === 1;

    delete admin.password;
    res.json({
      success: true,
      admin: {
        ...admin,
        is_super_admin: isSuperAdmin
      }
    });
  } catch (err) {
    console.error("Admin login error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.post_api_admin_add_teacher = async (req, res) => {

  try {
    const { name, personalEmail } = req.body;
    if (!name || !personalEmail)
      return res.status(400).json({ success: false, error: "Name and personalEmail are required" });

    // Generate LMS email and temporary password
    const baseEmail = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000) + '@lms.edu';
    const tempPassword = Math.random().toString(36).slice(-8);

    // Check if generated email already exists in Supabase
    const { data: existing, error: existingError } = await supabase
      .from('teachers')
      .select('teacher_id')
      .eq('email', baseEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Generated email already exists. Please try again.",
      });
    }

    const hashed = await bcrypt.hash(tempPassword, 10);

    // Insert teacher into Supabase
    const { data: newTeacher, error: insertError } = await supabase
      .from('teachers')
      .insert([{ name, email: baseEmail, password: hashed }])
      .select('teacher_id')
      .single();

    if (insertError) throw insertError;

    // Send welcome email with credentials
    try {
      await emailService.sendWelcomeEmail(personalEmail, name, baseEmail, tempPassword);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
      return res.json({
        success: true,
        teacher_id: newTeacher.teacher_id,
        emailSent: false,
        message: "Teacher added but email failed to send."
      });
    }

    return res.json({
      success: true,
      teacher_id: newTeacher.teacher_id,
      emailSent: true
    });
  } catch (err) {
    console.error("Add teacher error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_teachers = async (req, res) => {

  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('teacher_id, name, email, created_at')
      .order('teacher_id', { ascending: false });

    if (error) {
      console.error("List teachers error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    const teacherIds = (teachers || []).map(t => t.teacher_id);
    let courses = [];
    let courseTeacherRows = [];

    if (teacherIds.length > 0) {
      const { data: courseRows, error: courseError } = await supabase
        .from('courses')
        .select('course_id, course_name, section_name, teacher_id')
        .in('teacher_id', teacherIds);

      if (courseError) throw courseError;
      courses = courseRows || [];

      const { data: joinedRows, error: joinedError } = await supabase
        .from('course_teachers')
        .select('course_id, teacher_id')
        .in('teacher_id', teacherIds);

      if (!joinedError) {
        courseTeacherRows = joinedRows || [];
        const joinedCourseIds = [...new Set(courseTeacherRows.map(row => row.course_id).filter(Boolean))];
        const missingCourseIds = joinedCourseIds.filter(courseId => !courses.some(course => String(course.course_id) === String(courseId)));
        if (missingCourseIds.length > 0) {
          const { data: joinedCourses, error: joinedCoursesError } = await supabase
            .from('courses')
            .select('course_id, course_name, section_name, teacher_id')
            .in('course_id', missingCourseIds);

          if (joinedCoursesError) throw joinedCoursesError;
          courses = courses.concat(joinedCourses || []);
        }
      }
    }

    const teachersWithCourses = (teachers || []).map(teacher => ({
      ...teacher,
      teaching_courses: courses
        .filter(course =>
          String(course.teacher_id) === String(teacher.teacher_id) ||
          courseTeacherRows.some(row =>
            String(row.teacher_id) === String(teacher.teacher_id) &&
            String(row.course_id) === String(course.course_id)
          )
        )
        .map(course => ({
          course_id: course.course_id,
          course_name: course.course_name,
          section_name: course.section_name
        }))
    }));

    const reqEmail = req.headers['x-user-email'];
    const reqId = req.headers['x-user-id'];
    const isMaster = isPlatformSuperAdmin(reqEmail, null);
    let filteredTeachers = teachersWithCourses;
    if (!isMaster && (reqEmail || reqId)) {
      const courseIds = await resolveWorkspaceCourseIds(reqId, reqEmail);
      filteredTeachers = teachersWithCourses.filter(t =>
        t.assignedCourses && t.assignedCourses.some(ac => courseIds.includes(ac.id || ac.course_id))
      );
    }
    res.json({ success: true, teachers: filteredTeachers });
  } catch (err) {
    console.error("List teachers error:", err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_update_teacher = async (req, res) => {

  const { teacher_id, name } = req.body;

  if (!teacher_id || !name) {
    return res.status(400).json({ success: false, error: "Teacher ID and name are required" });
  }

  try {
    const { error } = await supabase
      .from('teachers')
      .update({ name: String(name).trim() })
      .eq('teacher_id', teacher_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Update teacher error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_admin_remove_teacher_id = async (req, res) => {

  const id = req.params.id;
  try {
    // Delete feedback, teacher_reviews, instructor_performance
    await supabase.from('feedback').delete().eq('teacher_id', id);
    await supabase.from('teacher_reviews').delete().eq('teacher_id', id);
    await supabase.from('instructor_performance').delete().eq('teacher_id', id);

    // Get courses taught by this teacher
    const { data: courses } = await supabase.from('courses').select('course_id').eq('teacher_id', id);
    const courseIds = (courses || []).map(c => c.course_id);

    if (courseIds.length > 0) {
      // Delete dependencies of those courses
      const { data: assignments } = await supabase.from('assignments').select('assignment_id').in('course_id', courseIds);
      const assignmentIds = (assignments || []).map(a => a.assignment_id);
      
      const { data: quizzes } = await supabase.from('quizzes').select('quiz_id').in('course_id', courseIds);
      const quizIds = (quizzes || []).map(q => q.quiz_id);

      if (assignmentIds.length > 0) {
        await supabase.from('assignment_submissions').delete().in('assignment_id', assignmentIds);
      }
      
      if (quizIds.length > 0) {
        await supabase.from('quiz_responses').delete().in('quiz_id', quizIds);
        await supabase.from('quiz_questions').delete().in('quiz_id', quizIds);
      }

      await supabase.from('assignments').delete().in('course_id', courseIds);
      await supabase.from('quizzes').delete().in('course_id', courseIds);
      await supabase.from('attendance').delete().in('course_id', courseIds);
      await supabase.from('enrollments').delete().in('course_id', courseIds);
      await supabase.from('student_grades').delete().in('course_id', courseIds);
      
      // Finally delete the courses
      await supabase.from('courses').delete().in('course_id', courseIds);
    }

    // Finally delete the teacher
    const { error: deleteTeacherError } = await supabase.from('teachers').delete().eq('teacher_id', id);
    if (deleteTeacherError) throw deleteTeacherError;

    res.json({ success: true, deleted: 1 });
  } catch (err) {
    console.error('Remove teacher error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_add_student = async (req, res) => {

  try {
    const { name, personalEmail } = req.body;

    if (!name || !personalEmail) {
      return res.status(400).json({
        success: false,
        error: "Name and personalEmail are required",
      });
    }

    // Generate LMS email and temporary password
    const baseEmail = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000) + '@student.lms.edu';
    const tempPassword = Math.random().toString(36).slice(-8);

    // Check if generated email already exists in Supabase
    const { data: existing, error: existingError } = await supabase
      .from('students')
      .select('student_id')
      .eq('email', baseEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Generated email already exists. Please try again.",
      });
    }

    const hashed = await bcrypt.hash(tempPassword, 10);
    
    // Insert student into Supabase
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert([{ name, email: baseEmail, password: hashed }])
      .select('student_id')
      .single();

    if (insertError) throw insertError;

    // Send welcome email with credentials
    try {
      await emailService.sendWelcomeEmail(personalEmail, name, baseEmail, tempPassword);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
      return res.json({
        success: true,
        student_id: newStudent.student_id,
        emailSent: false,
        message: "Student added but email failed to send."
      });
    }

    return res.json({
      success: true,
      student_id: newStudent.student_id,
      emailSent: true
    });

  } catch (err) {
    console.error("Add student error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }

};

exports.get_api_admin_students = async (req, res) => {

  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('student_id, name, email, created_at')
      .order('student_id', { ascending: false });

    if (error) {
      console.error("List students error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    const studentIds = (students || []).map(s => s.student_id);
    let enrollments = [];
    let courses = [];

    if (studentIds.length > 0) {
      const { data: enrollmentRows, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('enrollment_id, student_id, course_id')
        .in('student_id', studentIds);

      if (enrollmentError) throw enrollmentError;
      enrollments = enrollmentRows || [];

      const courseIds = [...new Set(enrollments.map(e => e.course_id).filter(Boolean))];
      if (courseIds.length > 0) {
        const { data: courseRows, error: courseError } = await supabase
          .from('courses')
          .select('course_id, course_name, section_name')
          .in('course_id', courseIds);

        if (courseError) throw courseError;
        courses = courseRows || [];
      }
    }

    const coursesById = new Map(courses.map(c => [String(c.course_id), c]));
    const studentsWithCourses = (students || []).map(student => {
      const assigned_courses = enrollments
        .filter(e => String(e.student_id) === String(student.student_id))
        .map(e => {
          const course = coursesById.get(String(e.course_id));
          return {
            enrollment_id: e.enrollment_id,
            course_id: e.course_id,
            course_name: course ? (course.section_name ? `${course.course_name} (${course.section_name})` : course.course_name) : 'Unknown Course'
          };
        });

      return { ...student, assigned_courses };
    });

    const reqEmail = req.headers['x-user-email'];
    const reqId = req.headers['x-user-id'];
    const isMaster = isPlatformSuperAdmin(reqEmail, null);
    let filteredStudents = studentsWithCourses;
    if (!isMaster && (reqEmail || reqId)) {
      const courseIds = await resolveWorkspaceCourseIds(reqId, reqEmail);
      filteredStudents = studentsWithCourses.filter(s =>
        s.assigned_courses && s.assigned_courses.some(ac => courseIds.includes(ac.course_id))
      );
    }
    res.json({ success: true, students: filteredStudents });
  } catch (err) {
    console.error("List students error:", err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_update_student = async (req, res) => {

  const { student_id, name } = req.body;

  if (!student_id || !name) {
    return res.status(400).json({ success: false, error: "Student ID and name are required" });
  }

  try {
    const { error } = await supabase
      .from('students')
      .update({ name: String(name).trim() })
      .eq('student_id', student_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Update student error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_admin_remove_student_id = async (req, res) => {

  const id = req.params.id;
  try {
    await supabase.from('attendance').delete().eq('student_id', id);
    await supabase.from('enrollments').delete().eq('student_id', id);
    await supabase.from('quiz_responses').delete().eq('student_id', id);
    await supabase.from('assignment_submissions').delete().eq('student_id', id);
    await supabase.from('feedback').delete().eq('student_id', id);
    await supabase.from('student_grades').delete().eq('student_id', id);
    await supabase.from('mid_final_marks').delete().eq('student_id', id);

    // Finally delete student record
    const { error: deleteError } = await supabase.from('students').delete().eq('student_id', id);
    if (deleteError) throw deleteError;

    res.json({ success: true, deleted: 1 });
  } catch (err) {
    console.error('Remove student error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_sections = async (req, res) => {

  try {
    const { data, error } = await supabase.from('sections').select('*').order('semester', { ascending: true }).order('name', { ascending: true });
    if (error && !error.message.includes('relation "sections" does not exist')) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error("Fetch sections error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_sections = async (req, res) => {

  const { name, semester } = req.body;
  if (!name || !semester) return res.status(400).json({ success: false, error: "Name and semester are required" });
  try {
    const { error } = await supabase.from('sections').insert([{ name, semester: Number(semester) }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Add section error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_admin_sections_id = async (req, res) => {

  try {
    const { error } = await supabase.from('sections').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Delete section error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_add_course = async (req, res) => {

  console.log("📩 Add course request body:", req.body);
  const { course_name, description, teacher_id, teacher_ids, status, category, credit_hours } = req.body;
  const parsedCreditHours = Number(credit_hours);

  if (!course_name || !description || !Number.isFinite(parsedCreditHours) || parsedCreditHours <= 0) {
    return res
      .status(400)
      .json({ success: false, error: "Course name, description, and positive credit hours are required" });
  }

  try {
    const { offerings, section_name, teacher_id, teacher_ids, semester } = req.body;
    let finalOfferings = [];
    
    if (semester !== undefined && semester !== null && semester !== "") {
      // Auto-Expand: fetch sections for this semester
      const { data: secs } = await supabase.from('sections').select('name').eq('semester', Number(semester));
      if (secs && secs.length > 0) {
        finalOfferings = secs.map(s => ({ section_name: s.name, teacher_ids: [] }));
      } else {
        // Fallback if no sections in this semester
        finalOfferings = [{ section_name: "", teacher_ids: [] }];
      }
    } else if (Array.isArray(offerings) && offerings.length > 0) {
      finalOfferings = offerings;
    } else {
      // Legacy fallback
      const legacyTeacherIds = Array.isArray(teacher_ids) && teacher_ids.length ? teacher_ids : (teacher_id ? [teacher_id] : []);
      finalOfferings = [{ section_name: section_name || "", teacher_ids: legacyTeacherIds }];
    }

    // Insert first offering
    const firstOff = finalOfferings[0];
    const firstTeachers = await validateTeacherIds(firstOff.teacher_ids || []);
    let prereqId = null;
    if (req.body.prerequisite_course_id) {
      prereqId = Number(req.body.prerequisite_course_id) || null;
    }
    const firstCoursePayload = {
      course_name,
      description,
      credit_hours: parsedCreditHours,
      status: status || 'Draft',
      category: category || 'General',
      section_name: firstOff.section_name || null,
      teacher_id: firstTeachers[0] || null
    };
    if (prereqId) firstCoursePayload.prerequisite_course_id = prereqId;

    const { data: firstCourse, error: firstErr } = await supabase
      .from('courses')
      .insert([firstCoursePayload])
      .select('course_id')
      .single();

    if (firstErr) throw firstErr;
    const parentId = firstCourse.course_id;
    if (firstTeachers.length > 0) await syncCourseTeachers(parentId, firstTeachers);

    const insertedIds = [parentId];

    // Insert remaining offerings
    for (let i = 1; i < finalOfferings.length; i++) {
      const off = finalOfferings[i];
      const offTeachers = await validateTeacherIds(off.teacher_ids || []);
      const childPayload = {
        course_name,
        description,
        credit_hours: parsedCreditHours,
        status: status || 'Draft',
        category: category || 'General',
        section_name: off.section_name || null,
        teacher_id: offTeachers[0] || null,
        parent_course_id: parentId
      };
      if (prereqId) childPayload.prerequisite_course_id = prereqId;

      const { data: childCourse, error: childErr } = await supabase
        .from('courses')
        .insert([childPayload])
        .select('course_id')
        .single();
      
      if (childErr) throw childErr;
      insertedIds.push(childCourse.course_id);
      if (offTeachers.length > 0) await syncCourseTeachers(childCourse.course_id, offTeachers);
    }

    const adminEmail = req.headers['x-user-email'] || req.body.admin_email;
    const adminId = req.headers['x-user-id'] || req.body.admin_id;
    if (adminEmail || adminId) {
      insertedIds.forEach(id => addEntityToWorkspace(adminId, adminEmail, 'course', id));
    }
    console.log("✅ Courses added IDs:", insertedIds);
    res.json({ success: true, course_ids: insertedIds, parent_course_id: parentId });
  } catch (err) {
    console.error("Add course error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_update_course = async (req, res) => {

  console.log("📩 Update course request body:", req.body);
  const { course_id, course_name, section_name, description, teacher_id, teacher_ids, status, category, credit_hours } = req.body;
  const parsedCreditHours = Number(credit_hours);

  if (!course_id || !course_name || !description || !Number.isFinite(parsedCreditHours) || parsedCreditHours <= 0) {
    return res
      .status(400)
      .json({ success: false, error: "Course ID, name, description, and positive credit hours are required" });
  }

  try {
    // Update course in Supabase
    const updatePayload = {
      course_name,
      section_name: section_name || null,
      description,
      credit_hours: parsedCreditHours,
      status: status || 'Draft',
      category: category || 'General'
    };

    if (req.body.teacher_ids !== undefined) {
      const selectedTeacherIds = await validateTeacherIds(
        Array.isArray(teacher_ids) && teacher_ids.length ? teacher_ids : (teacher_id ? [teacher_id] : [])
      );
      updatePayload.teacher_id = selectedTeacherIds[0] || null;
      await syncCourseTeachers(course_id, selectedTeacherIds);
    }

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updatePayload)
      .eq('course_id', course_id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (err) {
    console.error("Update course error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_assign_teacher_course = async (req, res) => {

  const { teacher_id, course_id } = req.body;
  if (!teacher_id || !course_id) {
    return res.status(400).json({ success: false, error: "Teacher ID and Course ID are required" });
  }
  try {
    // 1. Update the course's teacher_id
    const { error: courseError } = await supabase
      .from('courses')
      .update({ teacher_id: Number(teacher_id) })
      .eq('course_id', Number(course_id));

    if (courseError) throw courseError;

    // 2. Sync course_teachers (delete old relations, insert new one) - Gracefully ignore missing table
    try {
      const { error: deleteError } = await supabase.from('course_teachers').delete().eq('course_id', Number(course_id));
      if (deleteError && !deleteError.message.includes("schema cache")) {
        throw deleteError;
      }
      
      const { error: insertError } = await supabase
        .from('course_teachers')
        .insert([{ course_id: Number(course_id), teacher_id: Number(teacher_id) }]);
      if (insertError && !insertError.message.includes("schema cache")) {
        throw insertError;
      }
    } catch (tblErr) {
      console.warn("⚠️ course_teachers sync skipped:", tblErr.message);
    }

    res.json({ success: true, message: "Teacher assigned to course successfully" });
  } catch (err) {
    console.error("Assign teacher to course failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_unassign_teacher_course = async (req, res) => {

  const { teacher_id, course_id } = req.body;
  if (!teacher_id || !course_id) {
    return res.status(400).json({ success: false, error: "Teacher ID and Course ID are required" });
  }
  try {
    // 1. Update the course's teacher_id to null
    const { error: courseError } = await supabase
      .from('courses')
      .update({ teacher_id: null })
      .eq('course_id', Number(course_id))
      .eq('teacher_id', Number(teacher_id));

    if (courseError) throw courseError;

    // 2. Delete relation from course_teachers - Gracefully ignore missing table
    try {
      const { error: deleteError } = await supabase
        .from('course_teachers')
        .delete()
        .eq('course_id', Number(course_id))
        .eq('teacher_id', Number(teacher_id));
      if (deleteError && !deleteError.message.includes("schema cache")) {
        throw deleteError;
      }
    } catch (tblErr) {
      console.warn("⚠️ course_teachers delete skipped:", tblErr.message);
    }

    res.json({ success: true, message: "Teacher unassigned from course successfully" });
  } catch (err) {
    console.error("Unassign teacher from course failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_courses = async (req, res) => {

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('course_id, course_name, section_name, description, credit_hours, teacher_id, status, category, created_at, teachers!teacher_id(name)')
      .order('course_id', { ascending: false });

    if (error) {
      console.error("List courses error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    const { data: ctData } = await supabase
      .from('course_teachers')
      .select('course_id, teacher_id, teachers(name)');

    const courses = (data || []).map(r => {
      // Find all teachers assigned via course_teachers for this course
      const assignedTeachers = (ctData || [])
        .filter(ct => ct.course_id === r.course_id && ct.teachers)
        .map(ct => ({ id: ct.teacher_id, name: ct.teachers.name }));
        
      // Also include the primary teacher_id if it's not in the course_teachers table (legacy fallback)
      if (r.teacher_id && r.teachers && !assignedTeachers.some(t => t.id === r.teacher_id)) {
        assignedTeachers.push({ id: r.teacher_id, name: r.teachers.name });
      }

      const teacher_name = assignedTeachers.length > 0 
        ? assignedTeachers.map(t => t.name).join(', ') 
        : 'Unassigned';

      return {
        ...r,
        teacher_name,
        teacher_ids: assignedTeachers.map(t => t.id)
      };
    });
    
    const reqEmail = req.headers['x-user-email'];
    const reqId = req.headers['x-user-id'];
    const isMaster = isPlatformSuperAdmin(reqEmail, null);
    let filteredCourses = courses;
    if (!isMaster && (reqEmail || reqId)) {
      const courseIds = await resolveWorkspaceCourseIds(reqId, reqEmail);
      filteredCourses = courses.filter(c => courseIds.includes(c.course_id));
    }
    res.json({ success: true, courses: filteredCourses });
  } catch (err) {
    console.error("List courses error:", err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_admin_remove_course_id = async (req, res) => {

  const id = req.params.id;
  const cascade = String(req.query.cascade || '').toLowerCase() === 'true' || req.query.cascade === '1';

  try {
    // Check for dependent records that would block deletion
    const { count: enrollmentsCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', id);
    const { count: assignmentsCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('course_id', id);
    const { count: quizzesCount } = await supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('course_id', id);
    const { count: attendanceCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('course_id', id);
    const { count: gradesCount } = await supabase.from('student_grades').select('*', { count: 'exact', head: true }).eq('course_id', id);

    const blockers = [];
    if (enrollmentsCount > 0) blockers.push({ type: 'enrollments', count: enrollmentsCount });
    if (assignmentsCount > 0) blockers.push({ type: 'assignments', count: assignmentsCount });
    if (quizzesCount > 0) blockers.push({ type: 'quizzes', count: quizzesCount });
    if (attendanceCount > 0) blockers.push({ type: 'attendance', count: attendanceCount });
    if (gradesCount > 0) blockers.push({ type: 'grades', count: gradesCount });

    if (blockers.length && !cascade) {
      return res.status(409).json({
        success: false,
        error: 'Course has dependent records and cannot be deleted',
        dependencies: blockers,
        hint: 'Remove or reassign dependent enrollments/assignments/quizzes, or retry with ?cascade=true to delete related data.'
      });
    }

    if (cascade) {
      // First get assignments and quizzes for these courses
      const { data: assignments } = await supabase.from('assignments').select('assignment_id').eq('course_id', id);
      const assignmentIds = (assignments || []).map(a => a.assignment_id);
      
      const { data: quizzes } = await supabase.from('quizzes').select('quiz_id').eq('course_id', id);
      const quizIds = (quizzes || []).map(q => q.quiz_id);

      if (assignmentIds.length > 0) {
        await supabase.from('assignment_submissions').delete().in('assignment_id', assignmentIds);
      }
      
      if (quizIds.length > 0) {
        await supabase.from('quiz_responses').delete().in('quiz_id', quizIds);
        await supabase.from('quiz_questions').delete().in('quiz_id', quizIds);
      }

      await supabase.from('assignments').delete().eq('course_id', id);
      await supabase.from('quizzes').delete().eq('course_id', id);
      await supabase.from('attendance').delete().eq('course_id', id);
      await supabase.from('enrollments').delete().eq('course_id', id);
      await supabase.from('student_grades').delete().eq('course_id', id);
      await supabase.from('feedback').delete().eq('course_id', id);
    }

    const { error: deleteError } = await supabase.from('courses').delete().eq('course_id', id);
    if (deleteError) throw deleteError;

    res.json({ success: true, deleted: 1 });
  } catch (err) {
    console.error('Remove course error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_add_enrollment = async (req, res) => {

  const { student_id, course_id } = req.body;

  if (!student_id || !course_id) {
    return res
      .status(400)
      .json({ success: false, error: "Student ID and Course ID are required" });
  }

  try {
    // Check if student exists in Supabase
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('student_id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, error: "Student not found" });
    }

    // Check if course exists in Supabase
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('course_id')
      .eq('course_id', course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // Check if already enrolled in Supabase
    const { data: existing, error: existingError } = await supabase
      .from('enrollments')
      .select('enrollment_id')
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Student is already enrolled in this course",
      });
    }

    // Insert enrollment into Supabase
    const { data: result, error: insertError } = await supabase
      .from('enrollments')
      .insert([{ student_id, course_id }])
      .select('enrollment_id')
      .single();

    if (insertError) throw insertError;

    res.json({
      success: true,
      message: "Enrollment added successfully",
      enrollment_id: result.enrollment_id,
    });
  } catch (err) {
    console.error("❌ Add enrollment failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_open_enrollment_window = async (req, res) => {

  try {
    const windowRow = await getOpenEnrollmentWindow();
    res.json({ success: true, window: windowRow });
  } catch (err) {
    console.error('Get admin open enrollment window error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_open_enrollment_window = async (req, res) => {

  try {
    const { semester_name, open_at, close_at, timezone } = req.body || {};

    if (!semester_name || !open_at || !close_at) {
      return res.status(400).json({ success: false, error: 'Semester name, open date/time, and close date/time are required' });
    }

    const openDate = new Date(open_at);
    const closeDate = new Date(close_at);

    if (Number.isNaN(openDate.getTime()) || Number.isNaN(closeDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid open or close date/time' });
    }

    if (closeDate <= openDate) {
      return res.status(400).json({ success: false, error: 'Close date/time must be after open date/time' });
    }

    const payload = {
      window_id: 1,
      semester_name: String(semester_name).trim(),
      open_at: openDate.toISOString(),
      close_at: closeDate.toISOString(),
      timezone: String(timezone || 'Asia/Karachi'),
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('open_enrollment_windows')
      .upsert(payload, { onConflict: 'window_id' })
      .select('*')
      .single();

    if (error) throw error;

    res.json({ success: true, window: computeOpenEnrollmentState(data) });
  } catch (err) {
    console.error('Save open enrollment window error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_enrollments = async (req, res) => {

  try {
    // 1. Fetch enrollments
    const { data: enrollments, error: err1 } = await supabase
      .from('enrollments')
      .select('enrollment_id, student_id, course_id, created_at');

    if (err1) throw err1;

    if (!enrollments || enrollments.length === 0) {
      return res.json({ success: true, enrollments: [] });
    }

    const studentIds = enrollments.map(e => e.student_id);
    const courseIds = enrollments.map(e => e.course_id);

    // 2. Fetch students
    const { data: students, error: err2 } = await supabase
      .from('students')
      .select('student_id, name')
      .in('student_id', studentIds);

    if (err2) throw err2;

    // 3. Fetch courses
    const { data: courses, error: err3 } = await supabase
      .from('courses')
      .select('course_id, course_name, section_name, teacher_id')
      .in('course_id', courseIds);

    if (err3) throw err3;

    // 4. Process data
    const result = enrollments.map(e => {
      const student = students ? students.find(s => s.student_id === e.student_id) : null;
      const course = courses ? courses.find(c => c.course_id === e.course_id) : null;

      return {
        enrollment_id: e.enrollment_id,
        student_id: e.student_id,
        student_name: student ? student.name : 'Unknown',
        course_id: e.course_id,
        course_name: course ? (course.section_name ? `${course.course_name} (${course.section_name})` : course.course_name) : 'Unknown',
        teacher_id: course ? course.teacher_id : null,
        created_at: e.created_at
      };
    });

    // Sort by enrollment_id DESC
    result.sort((x, y) => y.enrollment_id - x.enrollment_id);

    const reqEmail = req.headers['x-user-email'];
    const reqId = req.headers['x-user-id'];
    const isMaster = isPlatformSuperAdmin(reqEmail, null);
    let filteredEnrollments = result;
    if (!isMaster && (reqEmail || reqId)) {
      const courseIds = await resolveWorkspaceCourseIds(reqId, reqEmail);
      filteredEnrollments = result.filter(e => courseIds.includes(e.course_id));
    }
    res.json({ success: true, enrollments: filteredEnrollments });
  } catch (err) {
    console.error("❌ Failed to fetch enrollments:", err);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_admin_remove_enrollment_id = async (req, res) => {

  const id = req.params.id;
  try {
    const { error: deleteError } = await supabase.from('enrollments').delete().eq('enrollment_id', id);
    if (deleteError) throw deleteError;
    res.json({ success: true, deleted: 1 });
  } catch (err) {
    console.error("Remove enrollment error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_fee_challans = async (req, res) => {

  try {
    const { data, error } = await supabase
      .from('fee_challans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const challans = (data || []).map(parseChallanRow);
    res.json({ success: true, challans });
  } catch (err) {
    console.error('List fee challans error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_fee_challans_generate = async (req, res) => {

  try {
    const { student_id, semester, due_date, reissue } = req.body || {};
    if (!student_id) {
      return res.status(400).json({ success: false, error: 'student_id is required' });
    }

    const challan = await issueFeeChallan({
      studentId: student_id,
      semester,
      dueDate: due_date,
      reissue: Boolean(reissue)
    });

    res.json({ success: true, challan });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message, existing: err.existing || null });
  }

};

exports.post_api_admin_fee_challans_generate_bulk = async (req, res) => {

  try {
    const { semester, due_date, reissue } = req.body || {};
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('student_id');

    if (error) throw error;

    const studentIds = [...new Set((enrollments || []).map(e => e.student_id).filter(Boolean))];
    const issued = [];
    const skipped = [];

    for (const studentId of studentIds) {
      try {
        const challan = await issueFeeChallan({
          studentId,
          semester,
          dueDate: due_date,
          reissue: Boolean(reissue)
        });
        issued.push(challan);
      } catch (err) {
        skipped.push({ student_id: studentId, reason: err.message });
      }
    }

    res.json({ success: true, issued, skipped });
  } catch (err) {
    console.error('Bulk fee challan generation error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_reviews_activate_all = async (req, res) => {

  try {
    const { reviews_window_start, reviews_window_end } = req.body || {};
    const start = reviews_window_start || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const end = reviews_window_end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await runAsync('UPDATE courses SET reviews_enabled = 1, reviews_window_start = ?, reviews_window_end = ?', [start, end]);
    res.json({ success: true });
  } catch (err) {
    console.error('Activate all reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_reviews_close_all = async (req, res) => {

  try {
    await runAsync('UPDATE courses SET reviews_enabled = 0', []);
    res.json({ success: true });
  } catch (err) {
    console.error('Close all reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_student_reviews_activate_all = async (req, res) => {

  try {
    const { student_feedback_window_start, student_feedback_window_end } = req.body || {};
    const start = student_feedback_window_start || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const end = student_feedback_window_end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await runAsync('UPDATE courses SET student_feedback_enabled = 1, student_feedback_window_start = ?, student_feedback_window_end = ?', [start, end]);
    res.json({ success: true });
  } catch (err) {
    console.error('Activate all student reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_student_reviews_close_all = async (req, res) => {

  try {
    await runAsync('UPDATE courses SET student_feedback_enabled = 0', []);
    res.json({ success: true });
  } catch (err) {
    console.error('Close all student reviews error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_enrollment_requests = async (req, res) => {

  try {
    const { data: requests, error: reqError } = await supabase
      .from('enrollment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (reqError) throw reqError;

    const courseIds = [...new Set((requests || []).map(r => r.course_id).filter(Boolean))];
    let coursesById = new Map();
    if (courseIds.length > 0) {
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select('course_id, course_name')
        .in('course_id', courseIds);
      if (courseError) throw courseError;
      coursesById = new Map((courses || []).map(c => [String(c.course_id), c.course_name]));
    }

    const rows = (requests || []).map(r => ({
      ...r,
      course_name: r.course_name || coursesById.get(String(r.course_id)) || 'Unknown'
    }));

    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error('Get enrollment requests error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_enrollment_request_requestId_approve = async (req, res) => {

  try {
    const { requestId } = req.params;

    // Get enrollment request
    const request = await getAsync('SELECT * FROM enrollment_requests WHERE request_id = ?', [requestId]);
    if (!request) {
      return res.status(400).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request already processed' });
    }

    // Create enrollment record
    await runAsync(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [request.student_id, request.course_id]
    );

    // Update enrollment request status and approved timestamp (do not generate or store credentials)
    await runAsync(
      'UPDATE enrollment_requests SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE request_id = ?',
      ['approved', requestId]
    );

    // Update fee challan status
    await runAsync(
      'UPDATE fee_challans SET status = ? WHERE request_id = ?',
      ['paid', requestId]
    );

    res.json({
      success: true,
      message: 'Enrollment approved!',
      studentEmail: request.student_email
    });
  } catch (err) {
    console.error('Approve enrollment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_enrollment_request_requestId_reject = async (req, res) => {

  try {
    const { requestId } = req.params;

    // Get enrollment request
    const request = await getAsync('SELECT * FROM enrollment_requests WHERE request_id = ?', [requestId]);
    if (!request) {
      return res.status(400).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request already processed' });
    }

    // Update enrollment request
    await runAsync(
      'UPDATE enrollment_requests SET status = ? WHERE request_id = ?',
      ['rejected', requestId]
    );

    // Update fee challan status
    await runAsync(
      'UPDATE fee_challans SET status = ? WHERE request_id = ?',
      ['rejected', requestId]
    );

    res.json({ success: true, message: 'Enrollment request rejected!' });
  } catch (err) {
    console.error('Reject enrollment error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_admin_registration_windows = async (req, res) => {

  try {
    const { data, error } = await supabase
      .from('registration_windows')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, windows: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_admin_registration_windows = async (req, res) => {

  try {
    const { degree_program, semester, open_date, close_date, late_open_date, late_close_date, max_credit_hours, min_credit_hours, fee_per_credit_hour, is_active } = req.body;
    if (!degree_program || !semester || !open_date || !close_date) {
      return res.status(400).json({ success: false, error: 'degree_program, semester, open_date, close_date are required' });
    }
    const { data, error } = await supabase
      .from('registration_windows')
      .insert([{ degree_program, semester, open_date, close_date, late_open_date: late_open_date || null, late_close_date: late_close_date || null, max_credit_hours: max_credit_hours || 21, min_credit_hours: min_credit_hours || 12, fee_per_credit_hour: fee_per_credit_hour || 8000, is_active: is_active !== undefined ? is_active : true }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, window: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_admin_registration_windows_id = async (req, res) => {

  try {
    const { error } = await supabase
      .from('registration_windows')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};


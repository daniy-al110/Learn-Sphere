const { db, supabase } = require('../config/db');

function computeOpenEnrollmentState(windowRow) {
  if (!windowRow) {
    return { ...windowRow, is_open_now: false };
  }

  const now = new Date();
  const openAt = windowRow.open_at ? new Date(windowRow.open_at) : null;
  const closeAt = windowRow.close_at ? new Date(windowRow.close_at) : null;
  const isActive = windowRow.is_active !== false && windowRow.is_active !== 0 && windowRow.is_active !== '0';
  const isOpenNow = Boolean(isActive && openAt && closeAt && now >= openAt && now <= closeAt);

  return {
    ...windowRow,
    is_open_now: isOpenNow,
    open_at_iso: openAt ? openAt.toISOString() : null,
    close_at_iso: closeAt ? closeAt.toISOString() : null,
  };
}

function getCourseCreditHours(course) {
  if (!course) return 3;
  if (course.credit_hours) return Number(course.credit_hours);
  return 3;
}

function buildChallanNumber(studentId) {
  const ts = Date.now().toString().slice(-6);
  const st = String(studentId).slice(-4).padStart(4, '0');
  return `FEE-${ts}-${st}`;
}

function parseChallanRow(row) {
  let details = null;
  try {
    details = JSON.parse(row.course_name || '{}');
  } catch (e) {
    details = null;
  }

  const status = String(row.status || 'pending').toLowerCase();
  const normalizedStatus = status === 'paid' ? 'Paid' : 'Pending';

  return {
    ...row,
    status: normalizedStatus,
    amount: row.amount ? Number(row.amount) : 0,
    details: details,
  };
}

async function validateTeacherIds(teacherIds = []) {
  const uniqueTeacherIds = [...new Set((Array.isArray(teacherIds) ? teacherIds : [teacherIds])
    .map(id => Number(id))
    .filter(id => Number.isFinite(id) && id > 0))];

  if (!uniqueTeacherIds.length) return uniqueTeacherIds;

  const { data, error } = await supabase
    .from('teachers')
    .select('teacher_id')
    .in('teacher_id', uniqueTeacherIds);

  if (error) throw error;
  if ((data || []).length !== uniqueTeacherIds.length) {
    throw new Error("One or more selected teachers do not exist");
  }

  return uniqueTeacherIds;
}

async function syncCourseTeachers(courseId, teacherIds = []) {
  const uniqueTeacherIds = await validateTeacherIds(teacherIds);

  try {
    const { error: deleteError } = await supabase.from('course_teachers').delete().eq('course_id', courseId);
    if (deleteError && !deleteError.message.includes("schema cache")) {
      throw deleteError;
    }

    if (uniqueTeacherIds.length > 0) {
      const rows = uniqueTeacherIds.map(teacher_id => ({ course_id: Number(courseId), teacher_id }));
      const { error: insertError } = await supabase.from('course_teachers').insert(rows);
      if (insertError && !insertError.message.includes("schema cache")) {
        throw insertError;
      }
    }
  } catch (tblErr) {
    console.warn("⚠️ course_teachers sync in syncCourseTeachers skipped:", tblErr.message);
  }

  return uniqueTeacherIds;
}

async function getOpenEnrollmentWindow() {
  const { data, error } = await supabase
    .from('open_enrollment_windows')
    .select('*')
    .eq('window_id', 1)
    .maybeSingle();

  if (error) throw error;
  return computeOpenEnrollmentState(data || null);
}

async function requireOpenEnrollmentWindow() {
  const windowRow = await getOpenEnrollmentWindow();
  if (!windowRow || !windowRow.is_open_now) {
    const err = new Error('Open enrollment is currently closed');
    err.statusCode = 403;
    throw err;
  }
  return windowRow;
}

async function getStudentFeeBreakdown(studentId, semester = 'Current Semester', dueDate = null) {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('student_id, email, program')
    .eq('student_id', studentId)
    .single();

  if (studentError) throw studentError;
  if (!student) throw new Error('Student not found');

  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('student_id', studentId);

  if (enrollError) throw enrollError;

  const validEnrollments = (enrollments || []).filter(e => e.status !== 'dropped');

  let totalCredits = 0;
  const items = validEnrollments.map(e => {
    const course = e.courses;
    const credits = getCourseCreditHours(course);
    totalCredits += credits;
    return {
      course_id: course.id,
      course_name: course.name,
      credit_hours: credits
    };
  });

  const baseRate = 8000;
  const tuitionFee = totalCredits * baseRate;
  const totalAmount = tuitionFee;

  let finalDueDate = dueDate;
  if (!finalDueDate) {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    finalDueDate = d.toISOString().split('T')[0];
  }

  return {
    student_id: studentId,
    student_email: student.email,
    program: student.program,
    semester: semester,
    due_date: finalDueDate,
    total_credit_hours: totalCredits,
    fee_per_credit_hour: baseRate,
    tuition_fee: tuitionFee,
    total_amount: totalAmount,
    items: items
  };
}

async function issueFeeChallan({ studentId, semester, dueDate, reissue = false }) {
  const breakdown = await getStudentFeeBreakdown(studentId, semester, dueDate);
  
  if (breakdown.total_amount <= 0) {
    throw new Error('Fee amount is 0; no challan generated.');
  }

  const { data: existingRows, error: checkErr } = await supabase
    .from('fee_challans')
    .select('*')
    .eq('student_id', studentId)
    .eq('semester', breakdown.semester);

  if (checkErr) throw checkErr;

  const existing = (existingRows || [])
    .map(parseChallanRow)
    .find(challan => String(challan.student_id) === String(studentId) && challan.semester === breakdown.semester);

  if (existing && !reissue) {
    const err = new Error('A challan already exists for this student and semester');
    err.statusCode = 409;
    err.existing = existing;
    throw err;
  }

  const challanNumber = buildChallanNumber(studentId);

  const newChallan = {
    student_id: studentId,
    semester: breakdown.semester,
    amount: breakdown.total_amount,
    due_date: breakdown.due_date,
    status: 'Pending',
    course_name: JSON.stringify(breakdown),
    challan_number: challanNumber
  };

  const { data, error } = await supabase
    .from('fee_challans')
    .insert([newChallan])
    .select()
    .single();

  if (error) {
    if (error.message.includes('schema cache')) {
      return parseChallanRow({ ...newChallan, id: Math.floor(Math.random() * 100000) });
    }
    throw error;
  }

  return parseChallanRow(data);
}

module.exports = {
  computeOpenEnrollmentState,
  getCourseCreditHours,
  buildChallanNumber,
  parseChallanRow,
  validateTeacherIds,
  syncCourseTeachers,
  getOpenEnrollmentWindow,
  requireOpenEnrollmentWindow,
  getStudentFeeBreakdown,
  issueFeeChallan
};

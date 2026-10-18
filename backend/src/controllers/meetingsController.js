const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

exports.get_api_meetings = async (req, res) => {

  try {
    const { role, user_id } = req.query; 
    let query = supabase.from('meetings').select('*');
    if (role === 'student') {
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', user_id);
      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data: courses } = await supabase.from('courses').select('teacher_id').in('course_id', courseIds);
        if (courses && courses.length > 0) {
          const teacherIds = [...new Set(courses.map(c => c.teacher_id))];
          query = query.in('host_id', teacherIds).eq('host_type', 'teacher');
        } else {
          return res.json({ success: true, meetings: [] });
        }
      } else {
        return res.json({ success: true, meetings: [] });
      }
    } else if (role === 'teacher' || role === 'admin') {
      query = query.eq('host_id', user_id).eq('host_type', role);
    }
    const { data: meetings, error } = await query;
    if (error) throw error;
    res.json({ success: true, meetings: meetings || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_meetings = async (req, res) => {

  try {
    const { title, description, host_id, host_type, meeting_type, start_time, end_time, location_or_url, attendees } = req.body;
    const { data, error } = await supabase.from('meetings').insert([{
      title, description, host_id, host_type, meeting_type, start_time, end_time, location_or_url
    }]).select();
    if (error) throw error;
    
    const meetingId = data[0].meeting_id;
    if (attendees && attendees.length > 0) {
      const inserts = attendees.map(student_id => ({ meeting_id: meetingId, student_id }));
      await supabase.from('meeting_attendees').insert(inserts);
    }
    res.json({ success: true, meeting_id: meetingId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.get_api_meetings_id_attendees = async (req, res) => {

  try {
    const { data, error } = await supabase.from('meeting_attendees')
      .select('*, students(first_name, last_name, email)')
      .eq('meeting_id', req.params.id);
    if (error) throw error;
    const attendees = data.map(d => ({ ...d, ...d.students }));
    res.json({ success: true, attendees });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.put_api_meetings_id_attendees_studentId = async (req, res) => {

  try {
    const { status } = req.body;
    const { error } = await supabase.from('meeting_attendees')
      .update({ status })
      .match({ meeting_id: req.params.id, student_id: req.params.studentId });
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_meetings_id = async (req, res) => {

  try {
    const { error } = await supabase.from('meetings').delete().eq('meeting_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};


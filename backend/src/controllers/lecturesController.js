const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

exports.get_api_lectures = async (req, res) => {

  try {
    const { course_id, teacher_id } = req.query;
    let query = supabase.from('lectures').select('*');
    if (course_id) query = query.eq('course_id', course_id);
    if (teacher_id) query = query.eq('teacher_id', teacher_id);
    
    const { data: lectures, error } = await query.order('upload_date', { ascending: false });
    if (error) throw error;
    res.json({ success: true, lectures });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.post_api_lectures = async (req, res) => {

  try {
    const { course_id, teacher_id, title, description, content_type, media_url, duration_minutes } = req.body;
    const { data, error } = await supabase.from('lectures').insert([{
      course_id, teacher_id, title, description, content_type, media_url, duration_minutes
    }]).select();
    if (error) throw error;
    res.json({ success: true, lecture: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};

exports.delete_api_lectures_id = async (req, res) => {

  try {
    const { error } = await supabase.from('lectures').delete().eq('lecture_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }

};


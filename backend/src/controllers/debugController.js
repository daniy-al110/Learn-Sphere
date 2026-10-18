const { supabase, db } = require('../config/db');
const { computeOpenEnrollmentState, getCourseCreditHours, buildChallanNumber, parseChallanRow, validateTeacherIds, syncCourseTeachers, getOpenEnrollmentWindow, requireOpenEnrollmentWindow, getStudentFeeBreakdown, issueFeeChallan } = require('../utils/helpers');
const bcrypt = require('bcryptjs');
const emailService = require('../../emailService');

exports.get_api_debug_quiz_quizId_full = (req, res) => {

  const { quizId } = req.params;
  db.serialize(() => {
    // Get quiz info
    db.get('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId], (err, quiz) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

      // Get questions with all details
      db.all(`
        SELECT 
          qq.question_id,
          qq.question_text,
          qq.options,
          qq.correct_answer,
          qq.points,
          (
            SELECT COUNT(*) 
            FROM quiz_responses qr 
            WHERE qr.quiz_id = ? AND json_extract(qr.answers, '$.' || qq.question_id) = qq.correct_answer
          ) as times_answered_correctly
        FROM quiz_questions qq
        WHERE qq.quiz_id = ?
      `, [quizId, quizId], (err, questions) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        // Process each question
        const processedQuestions = questions.map(q => ({
          ...q,
          options: (() => {
            try { return JSON.parse(q.options); }
            catch (e) { return q.options; }
          })(),
          correct_answer_raw: q.correct_answer,
          correct_answer_parsed: (() => {
            try { return JSON.parse(q.correct_answer); }
            catch (e) { return q.correct_answer; }
          })(),
        }));

        res.json({
          success: true,
          quiz,
          questions: processedQuestions,
          debug_note: 'Compare correct_answer_raw vs correct_answer_parsed to see storage format'
        });
      });
    });
  });

};

exports.get_api_debug_quizzes = (req, res) => {

  db.all(`
    SELECT 
      q.quiz_id,
      q.title,
      q.is_active,
      COUNT(qq.question_id) as question_count,
      GROUP_CONCAT(qq.correct_answer) as answer_formats
    FROM quizzes q
    LEFT JOIN quiz_questions qq ON q.quiz_id = qq.quiz_id
    GROUP BY q.quiz_id
  `, [], (err, quizzes) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, quizzes });
  });

};

exports.get_api_debug_quiz_quizId = (req, res) => {

  const { quizId } = req.params;
  db.all(
    'SELECT question_id, question_text, options, correct_answer FROM quiz_questions WHERE quiz_id = ?',
    [quizId],
    (err, questions) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true, questions: questions.map(q => ({
          ...q,
          options: JSON.parse(q.options || '[]'),
          correct_answer: q.correct_answer,
          correct_answer_parsed: (() => {
            try { return JSON.parse(q.correct_answer); }
            catch (e) { return q.correct_answer; }
          })()
        }))
      });
    }
  );

};


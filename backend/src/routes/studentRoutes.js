const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/feedback', studentController.post_api_student_feedback);
router.post('/login', studentController.post_api_student_login);
router.post('/signup', studentController.post_api_student_signup);
router.get('/attendance/:studentId', studentController.get_api_student_attendance_studentId);
router.get('/:studentId/quizzes', studentController.get_api_student_studentId_quizzes);
router.get('/:studentId/assignments', studentController.get_api_student_studentId_assignments);
router.post('/enroll', studentController.post_api_student_enroll);
router.get('/enrollments/:studentId', studentController.get_api_student_enrollments_studentId);
router.get('/:studentId/fee-challans', studentController.get_api_student_studentId_fee_challans);
router.get('/quiz/:quizId/questions', studentController.get_api_student_quiz_quizId_questions);
router.post('/quiz/:quizId/submit', studentController.post_api_student_quiz_quizId_submit);
router.get('/:studentId/grades', studentController.get_api_student_studentId_grades);
router.get('/transcript/:studentId', studentController.get_api_student_transcript_studentId);
router.post('/assignment/:assignmentId/submit', upload.single('assignment_file'), studentController.post_api_student_assignment_assignmentId_submit);
router.post('/fee-challans/:challanId/pay', studentController.post_api_student_fee_challans_challanId_pay);
router.get('/:studentId/registration-window', studentController.get_api_student_studentId_registration_window);

module.exports = router;

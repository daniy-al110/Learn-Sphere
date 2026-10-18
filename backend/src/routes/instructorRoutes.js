const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.post('/report', teacherController.post_api_instructor_report);
router.get('/reports/:teacherId', teacherController.get_api_instructor_reports_teacherId);

module.exports = router;

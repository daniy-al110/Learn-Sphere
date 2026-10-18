const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');

// /api/course/:courseId/assignments
router.get('/:courseId/assignments', coursesController.get_api_course_courseId_assignments);

module.exports = router;

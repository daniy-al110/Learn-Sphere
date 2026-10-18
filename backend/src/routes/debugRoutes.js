const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');

router.get('/quiz/:quizId/full', debugController.get_api_debug_quiz_quizId_full);
router.get('/quizzes', debugController.get_api_debug_quizzes);
router.get('/quiz/:quizId', debugController.get_api_debug_quiz_quizId);

module.exports = router;

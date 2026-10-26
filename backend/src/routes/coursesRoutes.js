const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');

// Token & Join Security Routes
router.post('/verify-token', coursesController.post_api_courses_verify_token);
router.post('/join-by-token', coursesController.post_api_courses_join_by_token);
router.get('/token-info/:id', coursesController.get_api_courses_token_info);
router.post('/:id/regenerate-token', coursesController.post_api_courses_regenerate_token);
router.post('/:id/toggle-public-link', coursesController.post_api_courses_toggle_public_link);

// Course Management Routes
router.get('/:id', coursesController.get_api_courses_id);
router.put('/:id', coursesController.put_api_courses_id);

module.exports = router;

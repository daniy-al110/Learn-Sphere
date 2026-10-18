const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');

router.get('/health', generalController.get_api_health);
router.post('/user/login', generalController.post_api_user_login);
router.post('/password/reset', generalController.post_api_password_reset);
router.post('/user/change-password', generalController.post_api_user_change_password);
router.get('/open-enrollment-window', generalController.get_api_open_enrollment_window);
router.get('/schedule', generalController.get_api_schedule);
router.post('/enroll', generalController.post_api_enroll);
router.post('/enrollment-request', generalController.post_api_enrollment_request);
router.get('/messages', generalController.get_api_messages);
router.post('/messages', generalController.post_api_messages);
router.patch('/messages/:id/read', generalController.patch_api_messages_id_read);
router.get('/users', generalController.get_api_users);
router.post('/register', generalController.post_api_register);

module.exports = router;

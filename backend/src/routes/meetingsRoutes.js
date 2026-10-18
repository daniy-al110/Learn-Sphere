const express = require('express');
const router = express.Router();
const meetingsController = require('../controllers/meetingsController');

router.get('/', meetingsController.get_api_meetings);
router.post('/', meetingsController.post_api_meetings);
router.get('/:id/attendees', meetingsController.get_api_meetings_id_attendees);
router.put('/:id/attendees/:studentId', meetingsController.put_api_meetings_id_attendees_studentId);
router.delete('/:id', meetingsController.delete_api_meetings_id);

module.exports = router;

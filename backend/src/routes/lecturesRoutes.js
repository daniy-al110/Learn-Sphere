const express = require('express');
const router = express.Router();
const lecturesController = require('../controllers/lecturesController');

router.get('/', lecturesController.get_api_lectures);
router.post('/', lecturesController.post_api_lectures);
router.delete('/:id', lecturesController.delete_api_lectures_id);

module.exports = router;

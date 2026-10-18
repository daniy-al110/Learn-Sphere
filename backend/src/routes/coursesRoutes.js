const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');

router.get('/:id', coursesController.get_api_courses_id);
router.put('/:id', coursesController.put_api_courses_id);

module.exports = router;

const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');

router.get('/roles', superAdminController.get_api_super_admin_roles);
router.post('/roles', superAdminController.post_api_super_admin_roles);
router.put('/roles/:id/permissions', superAdminController.put_api_super_admin_roles_id_permissions);
router.get('/permissions', superAdminController.get_api_super_admin_permissions);
router.get('/admins', superAdminController.get_api_super_admin_admins);
router.post('/admins', superAdminController.post_api_super_admin_admins);
router.delete('/admins/:id', superAdminController.delete_api_super_admin_admins_id);

module.exports = router;

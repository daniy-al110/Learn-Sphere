const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');

// Role & admin management
router.get('/roles', superAdminController.get_api_super_admin_roles);
router.post('/roles', superAdminController.post_api_super_admin_roles);
router.put('/roles/:id/permissions', superAdminController.put_api_super_admin_roles_id_permissions);
router.get('/permissions', superAdminController.get_api_super_admin_permissions);
router.get('/admins', superAdminController.get_api_super_admin_admins);
router.post('/admins', superAdminController.post_api_super_admin_admins);
router.delete('/admins/:id', superAdminController.delete_api_super_admin_admins_id);

// Super Super Admin Platform Center & Upgrade Verification
router.get('/platform/overview', superAdminController.get_api_super_admin_platform_overview);
router.get('/platform/upgrade-requests', superAdminController.get_api_super_admin_upgrade_requests);
router.post('/platform/submit-upgrade', superAdminController.post_api_super_admin_submit_upgrade);
router.post('/platform/approve-upgrade', superAdminController.post_api_super_admin_approve_upgrade);
router.post('/platform/reject-upgrade', superAdminController.post_api_super_admin_reject_upgrade);
router.post('/platform/create-super-admin', superAdminController.post_api_super_admin_create_super_admin);

module.exports = router;

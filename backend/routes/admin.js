const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllUsers,
  updateUserRole,
  getAllTasks,
  getTaskLogs,
  addUserToProject,
  removeUserFromProject,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
  getAllProjects,
  getProjectMembers,
  adminAddUserToProject,
  adminRemoveUserFromProject
} = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const userRoleValidation = [
  body('role')
    .isIn(['user', 'admin', 'super_admin'])
    .withMessage('Role must be user, admin, or super_admin')
];

const addUserToProjectValidation = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid integer'),
  body('role')
    .isIn(['viewer', 'member', 'admin'])
    .withMessage('Role must be viewer, member, or admin'),
  body('can_edit')
    .optional()
    .isBoolean()
    .withMessage('can_edit must be a boolean'),
  body('can_delete')
    .optional()
    .isBoolean()
    .withMessage('can_delete must be a boolean')
];

const resetPasswordValidation = [
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const paramValidation = [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a valid integer'),
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a valid integer'),
  param('taskId').isInt({ min: 1 }).withMessage('Task ID must be a valid integer')
];

// Admin Routes (Admin & Super Admin access)
router.get('/users', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  getAllUsers
);

router.put('/users/:userId/role', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  param('userId').isInt({ min: 1 }),
  userRoleValidation,
  updateUserRole
);

router.get('/tasks', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  getAllTasks
);

router.get('/tasks/:taskId/logs', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  param('taskId').isInt({ min: 1 }),
  getTaskLogs
);

router.get('/tasks/logs', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  getTaskLogs
);

router.post('/projects/:projectId/members', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  param('projectId').isInt({ min: 1 }),
  addUserToProjectValidation,
  addUserToProject
);

router.delete('/projects/:projectId/members/:userId', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  param('projectId').isInt({ min: 1 }),
  param('userId').isInt({ min: 1 }),
  removeUserFromProject
);

// Super Admin Only Routes
router.put('/users/:userId/password', 
  authenticateToken, 
  authorize('super_admin'),
  param('userId').isInt({ min: 1 }),
  resetPasswordValidation,
  resetUserPassword
);

router.put('/users/:userId/toggle-status', 
  authenticateToken, 
  authorize('super_admin'),
  param('userId').isInt({ min: 1 }),
  toggleUserStatus
);

router.delete('/users/:userId', 
  authenticateToken, 
  authorize('super_admin'),
  param('userId').isInt({ min: 1 }),
  deleteUser
);

// Project management routes
router.get('/projects', 
  authenticateToken, 
  authorize('admin', 'super_admin'), 
  getAllProjects
);

router.get('/projects/:projectId/members', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  param('projectId').isInt({ min: 1 }),
  getProjectMembers
);

router.post('/projects/:projectId/add-member', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  param('projectId').isInt({ min: 1 }),
  body('userId').isInt({ min: 1 }),
  adminAddUserToProject
);

router.delete('/projects/:projectId/remove-member/:userId', 
  authenticateToken, 
  authorize('admin', 'super_admin'),
  param('projectId').isInt({ min: 1 }),
  param('userId').isInt({ min: 1 }),
  adminRemoveUserFromProject
);

module.exports = router;
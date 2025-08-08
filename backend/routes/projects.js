const express = require('express');
const { body, param } = require('express-validator');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMember,
  removeMember,
  inviteMember
} = require('../controllers/projectController');
const { authenticateToken, checkProjectPermission } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
];

const updateProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Project name is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters')
];

const addMemberValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Role must be admin, member, or viewer'),
  body('can_edit')
    .optional()
    .isBoolean()
    .withMessage('can_edit must be a boolean'),
  body('can_delete')
    .optional()
    .isBoolean()
    .withMessage('can_delete must be a boolean')
];

const inviteMemberValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Role must be admin, member, or viewer'),
  body('can_edit')
    .optional()
    .isBoolean()
    .withMessage('can_edit must be a boolean'),
  body('can_delete')
    .optional()
    .isBoolean()
    .withMessage('can_delete must be a boolean')
];

const updateMemberValidation = [
  body('role')
    .isIn(['admin', 'member', 'viewer'])
    .withMessage('Role must be admin, member, or viewer'),
  body('can_edit')
    .isBoolean()
    .withMessage('can_edit must be a boolean'),
  body('can_delete')
    .isBoolean()
    .withMessage('can_delete must be a boolean')
];

// Routes
router.get('/', authenticateToken, getProjects);

router.get('/:projectId', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }), 
  checkProjectPermission, 
  getProjectById
);

router.post('/', 
  authenticateToken, 
  createProjectValidation, 
  createProject
);

router.put('/:projectId', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }),
  checkProjectPermission,
  updateProjectValidation, 
  updateProject
);

router.delete('/:projectId', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }),
  checkProjectPermission,
  deleteProject
);

// Member management routes (only project owners can manage members)
router.post('/:projectId/members', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }),
  checkProjectPermission,
  addMemberValidation, 
  addMember
);

// Invite new member (creates account and adds to project)
router.post('/:projectId/invite', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }),
  checkProjectPermission,
  inviteMemberValidation, 
  inviteMember
);

router.put('/:projectId/members/:memberId', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }),
  param('memberId').isInt({ min: 1 }),
  checkProjectPermission,
  updateMemberValidation, 
  updateMember
);

router.delete('/:projectId/members/:memberId', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }),
  param('memberId').isInt({ min: 1 }),
  checkProjectPermission,
  removeMember
);

module.exports = router;
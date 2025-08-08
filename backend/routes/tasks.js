const express = require('express');
const { body, param } = require('express-validator');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment
} = require('../controllers/taskController');
const { authenticateToken, checkProjectPermission } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assigned_to')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a valid user ID'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'doing', 'done'])
    .withMessage('Status must be todo, doing, or done'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('assigned_to')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a valid user ID'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
];

const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content is required and must be less than 500 characters')
];

const paramValidation = [
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a valid integer'),
  param('taskId').isInt({ min: 1 }).withMessage('Task ID must be a valid integer')
];

// Routes
router.get('/project/:projectId', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }), 
  checkProjectPermission, 
  getTasks
);

router.get('/:taskId', 
  authenticateToken, 
  param('taskId').isInt({ min: 1 }), 
  getTaskById
);

router.post('/project/:projectId', 
  authenticateToken, 
  param('projectId').isInt({ min: 1 }), 
  checkProjectPermission,
  createTaskValidation, 
  createTask
);

router.put('/:taskId', 
  authenticateToken, 
  param('taskId').isInt({ min: 1 }),
  updateTaskValidation, 
  updateTask
);

router.delete('/:taskId', 
  authenticateToken, 
  param('taskId').isInt({ min: 1 }),
  deleteTask
);

router.post('/:taskId/comments', 
  authenticateToken, 
  param('taskId').isInt({ min: 1 }),
  commentValidation, 
  addComment
);

module.exports = router;
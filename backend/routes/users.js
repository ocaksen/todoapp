const express = require('express');
const { param, query } = require('express-validator');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all users (for member assignment)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const db = getConnection();
    
    let query = 'SELECT id, name, email, avatar_url FROM users';
    let queryParams = [];
    
    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ?';
      queryParams = [`%${search}%`, `%${search}%`];
    }
    
    query += ' ORDER BY name ASC LIMIT 50';
    
    const [users] = await db.execute(query, queryParams);
    
    res.json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Get user by ID
router.get('/:userId', 
  authenticateToken,
  param('userId').isInt({ min: 1 }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const db = getConnection();
      
      const [users] = await db.execute(
        'SELECT id, name, email, avatar_url, role, created_at FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          user: users[0]
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  }
);

// Get user's task statistics
router.get('/:userId/stats', 
  authenticateToken,
  param('userId').isInt({ min: 1 }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const db = getConnection();
      
      // Only allow users to see their own stats or if they're admin
      if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
          SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END) as doing_tasks,
          SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done_tasks,
          SUM(CASE WHEN due_date < DATE('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue_tasks
        FROM tasks 
        WHERE assigned_to = ?
      `, [userId]);
      
      res.json({
        success: true,
        data: {
          stats: stats[0]
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  }
);

module.exports = router;
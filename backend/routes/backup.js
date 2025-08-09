const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Database backup endpoint (only for super_admin)
router.get('/database', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const db = getConnection();
    
    // Get all data from important tables
    const backup = {};
    
    const [users] = await db.execute('SELECT * FROM users');
    const [projects] = await db.execute('SELECT * FROM projects');
    const [tasks] = await db.execute('SELECT * FROM tasks');
    const [projectMembers] = await db.execute('SELECT * FROM project_members');
    
    backup.users = users;
    backup.projects = projects;
    backup.tasks = tasks;
    backup.project_members = projectMembers;
    backup.timestamp = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Database backup created',
      data: backup
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup'
    });
  }
});

// Database stats endpoint
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = getConnection();
    
    const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [projectCount] = await db.execute('SELECT COUNT(*) as count FROM projects');
    const [taskCount] = await db.execute('SELECT COUNT(*) as count FROM tasks');
    
    res.json({
      success: true,
      data: {
        users: userCount[0].count,
        projects: projectCount[0].count,
        tasks: taskCount[0].count
      }
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

module.exports = router;
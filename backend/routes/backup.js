const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const backupService = require('../services/backupService');

const router = express.Router();

// Manual backup endpoint (only for super_admin)
router.post('/create', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { type = 'manual' } = req.body;
    const result = await backupService.createBackup(type);
    
    if (result.success) {
      res.json({
        success: true,
        message: `${type.toUpperCase()} backup created successfully`,
        data: {
          filename: result.filename,
          size: result.size
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create backup',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup'
    });
  }
});

// List all backups
router.get('/list', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}, async (req, res) => {
  try {
    const backups = await backupService.getBackupList();
    
    res.json({
      success: true,
      data: {
        backups: backups,
        count: backups.length
      }
    });
    
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups'
    });
  }
});

// Restore backup endpoint (only for super_admin)
router.post('/restore/:filename', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await backupService.restoreBackup(filename);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restored successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to restore backup',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup'
    });
  }
});

// Database stats endpoint
router.get('/stats', authenticateToken, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}, async (req, res) => {
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
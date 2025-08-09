const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const db = getConnection();
    const [users] = await db.execute(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

const checkProjectPermission = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    const db = getConnection();
    
    // Check if user is project owner or member
    const [permissions] = await db.execute(`
      SELECT 
        p.owner_id,
        pm.role as member_role,
        pm.can_edit,
        pm.can_delete
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      WHERE p.id = ?
    `, [userId, projectId]);

    if (permissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const permission = permissions[0];
    
    // User is owner or member
    if (permission.owner_id === userId || permission.member_role) {
      req.projectPermission = {
        isOwner: permission.owner_id === userId,
        role: permission.member_role || 'owner',
        canEdit: permission.owner_id === userId || permission.can_edit,
        canDelete: permission.owner_id === userId || permission.can_delete
      };
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this project'
    });
  } catch (error) {
    console.error('Project permission check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking project permissions'
    });
  }
};

// Convenience function for single role requirement
const requireRole = (role) => {
  return authorize(role);
};

module.exports = {
  authenticateToken,
  authorize,
  requireRole,
  checkProjectPermission
};
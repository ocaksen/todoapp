const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { getConnection } = require('../config/database');

// Get all users (Admin & Super Admin)
const getAllUsers = async (req, res) => {
  try {
    const db = getConnection();
    
    const [users] = await db.execute(`
      SELECT 
        id, name, email, role, created_at, last_login,
        CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END as status
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Update user role (Admin & Super Admin)
const updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { role } = req.body;
    const currentUser = req.user;
    const db = getConnection();

    // Prevent non-super-admin from changing super admin roles
    if (currentUser.role !== 'super_admin' && role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can assign Super Admin role'
      });
    }

    // Get target user
    const [users] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const targetUser = users[0];

    // Prevent admin from changing super admin roles
    if (currentUser.role !== 'super_admin' && targetUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can modify Super Admin roles'
      });
    }

    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Get all tasks (Admin can see all)
const getAllTasks = async (req, res) => {
  try {
    const { status, project_id } = req.query;
    const db = getConnection();

    let query = `
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        assignee.email as assignee_email,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    
    const queryParams = [];

    if (status) {
      query += ' AND t.status = ?';
      queryParams.push(status);
    }

    if (project_id) {
      query += ' AND t.project_id = ?';
      queryParams.push(project_id);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await db.execute(query, queryParams);

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Get task change logs (Admin & Super Admin)
const getTaskLogs = async (req, res) => {
  try {
    const { taskId } = req.params;
    const db = getConnection();

    const [logs] = await db.execute(`
      SELECT 
        th.*,
        u.name as changed_by_name,
        t.title as task_title
      FROM task_history th
      LEFT JOIN users u ON th.changed_by = u.id
      LEFT JOIN tasks t ON th.task_id = t.id
      WHERE th.task_id = ? OR ? IS NULL
      ORDER BY th.created_at DESC
    `, [taskId || null, taskId || null]);

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    console.error('Get task logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task logs',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Add user to project (Admin & Super Admin)
const addUserToProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const { user_id, role, can_edit, can_delete } = req.body;
    const db = getConnection();

    // Check if user already in project
    const [existing] = await db.execute(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    await db.execute(
      'INSERT INTO project_members (project_id, user_id, role, can_edit, can_delete) VALUES (?, ?, ?, ?, ?)',
      [projectId, user_id, role, can_edit ? 1 : 0, can_delete ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'User added to project successfully'
    });
  } catch (error) {
    console.error('Add user to project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add user to project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Remove user from project (Admin & Super Admin)
const removeUserFromProject = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const db = getConnection();

    const [result] = await db.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in project'
      });
    }

    res.json({
      success: true,
      message: 'User removed from project successfully'
    });
  } catch (error) {
    console.error('Remove user from project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Reset user password (Super Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { new_password } = req.body;
    const db = getConnection();

    const hashedPassword = await bcrypt.hash(new_password, 12);
    
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Deactivate/Activate user (Super Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getConnection();

    // Get current status
    const [users] = await db.execute('SELECT is_active FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newStatus = users[0].is_active === 1 ? 0 : 1;
    
    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);

    res.json({
      success: true,
      message: `User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Delete user (Super Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const db = getConnection();

    // Prevent self-deletion
    if (parseInt(userId) === currentUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const [users] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transfer ownership of projects to current user
    await db.execute(
      'UPDATE projects SET owner_id = ? WHERE owner_id = ?',
      [currentUser.id, userId]
    );

    // Remove from project memberships
    await db.execute('DELETE FROM project_members WHERE user_id = ?', [userId]);
    
    // Update task assignments to null
    await db.execute('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    
    // Delete user
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  getAllTasks,
  getTaskLogs,
  addUserToProject,
  removeUserFromProject,
  resetUserPassword,
  toggleUserStatus,
  deleteUser
};
const { validationResult } = require('express-validator');
const { getConnection } = require('../config/database');

const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getConnection();

    // Get projects where user is owner or member
    const [projects] = await db.execute(`
      SELECT DISTINCT
        p.*,
        owner.name as owner_name,
        CASE 
          WHEN p.owner_id = ? THEN 'owner'
          ELSE pm.role
        END as user_role,
        CASE 
          WHEN p.owner_id = ? THEN TRUE
          ELSE pm.can_edit
        END as can_edit,
        CASE 
          WHEN p.owner_id = ? THEN TRUE
          ELSE pm.can_delete
        END as can_delete
      FROM projects p
      LEFT JOIN users owner ON p.owner_id = owner.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = ? OR pm.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId, userId, userId, userId, userId]);

    res.json({
      success: true,
      data: {
        projects
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getConnection();

    const [projects] = await db.execute(`
      SELECT 
        p.*,
        owner.name as owner_name,
        owner.email as owner_email
      FROM projects p
      JOIN users owner ON p.owner_id = owner.id
      WHERE p.id = ?
    `, [projectId]);

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project members
    const [members] = await db.execute(`
      SELECT 
        pm.*,
        u.name,
        u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.joined_at ASC
    `, [projectId]);

    res.json({
      success: true,
      data: {
        project: projects[0],
        members
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;
    const userId = req.user.id;
    const db = getConnection();

    const [result] = await db.execute(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description, userId]
    );

    const projectId = result.insertId;

    // Get the created project
    const [projects] = await db.execute(`
      SELECT 
        p.*,
        owner.name as owner_name
      FROM projects p
      JOIN users owner ON p.owner_id = owner.id
      WHERE p.id = ?
    `, [projectId]);

    console.log('Created project query result:', projects);

    if (projects && projects.length > 0) {
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          project: projects[0]
        }
      });
    } else {
      // Fallback: return basic project info if query fails
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          project: {
            id: projectId,
            name,
            description,
            owner_id: userId
          }
        }
      });
    }
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const updateProject = async (req, res) => {
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
    const { name, description } = req.body;
    const db = getConnection();

    const [result] = await db.execute(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description, projectId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get updated project
    const [projects] = await db.execute(`
      SELECT 
        p.*,
        owner.name as owner_name
      FROM projects p
      JOIN users owner ON p.owner_id = owner.id
      WHERE p.id = ?
    `, [projectId]);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: projects[0]
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getConnection();

    const [result] = await db.execute('DELETE FROM projects WHERE id = ?', [projectId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const addMember = async (req, res) => {
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
    const { email, role = 'member', can_edit = true, can_delete = false } = req.body;
    const db = getConnection();

    // Find user by email
    const [users] = await db.execute('SELECT id, name, email FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Check if user is already a member
    const [existingMembers] = await db.execute(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, user.id]
    );

    if (existingMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add member
    await db.execute(
      'INSERT INTO project_members (project_id, user_id, role, can_edit, can_delete) VALUES (?, ?, ?, ?, ?)',
      [projectId, user.id, role, can_edit, can_delete]
    );

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        member: {
          user_id: user.id,
          name: user.name,
          email: user.email,
          role,
          can_edit,
          can_delete
        }
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const updateMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId, memberId } = req.params;
    const { role, can_edit, can_delete } = req.body;
    const db = getConnection();

    const [result] = await db.execute(
      'UPDATE project_members SET role = ?, can_edit = ?, can_delete = ? WHERE project_id = ? AND user_id = ?',
      [role, can_edit, can_delete, projectId, memberId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project'
      });
    }

    res.json({
      success: true,
      message: 'Member updated successfully'
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const db = getConnection();

    const [result] = await db.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, memberId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project'
      });
    }

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const inviteMember = async (req, res) => {
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
    const { email, name, password, role = 'member', can_edit = true, can_delete = false } = req.body;
    const db = getConnection();
    const bcrypt = require('bcryptjs');

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists. Use "Add Member" instead.'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const [userResult] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );

    const newUserId = userResult.insertId;

    // Check if user is already a member (shouldn't happen but just in case)
    const [existingMembers] = await db.execute(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, newUserId]
    );

    if (existingMembers.length === 0) {
      // Add user to project
      await db.execute(
        'INSERT INTO project_members (project_id, user_id, role, can_edit, can_delete) VALUES (?, ?, ?, ?, ?)',
        [projectId, newUserId, role, can_edit, can_delete]
      );
    }

    res.status(201).json({
      success: true,
      message: 'User created and added to project successfully',
      data: {
        user: {
          id: newUserId,
          name,
          email,
          role: role
        }
      }
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invite member',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMember,
  removeMember,
  inviteMember
};
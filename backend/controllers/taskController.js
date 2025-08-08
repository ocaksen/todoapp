const { validationResult } = require('express-validator');
const { getConnection } = require('../config/database');

const logTaskChange = async (taskId, userId, fieldName, oldValue, newValue) => {
  try {
    const db = getConnection();
    await db.execute(
      'INSERT INTO task_history (task_id, changed_by, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
      [taskId, userId, fieldName, oldValue, newValue]
    );
  } catch (error) {
    console.error('Error logging task change:', error);
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assigned_to } = req.query;
    const db = getConnection();

    let query = `
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        assignee.email as assignee_email
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.project_id = ?
    `;
    
    const queryParams = [projectId];

    if (status) {
      query += ' AND t.status = ?';
      queryParams.push(status);
    }

    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      queryParams.push(assigned_to);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await db.execute(query, queryParams);

    res.json({
      success: true,
      data: {
        tasks
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const db = getConnection();

    const [tasks] = await db.execute(`
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        assignee.email as assignee_email
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [taskId]);

    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get task comments
    const [comments] = await db.execute(`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at DESC
    `, [taskId]);

    res.json({
      success: true,
      data: {
        task: tasks[0],
        comments
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const createTask = async (req, res) => {
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
    const { title, description, priority, assigned_to, due_date } = req.body;
    const userId = req.user.id;
    const db = getConnection();

    // Check if assigned user exists and has access to project
    if (assigned_to) {
      const [assigneeCheck] = await db.execute(`
        SELECT u.id 
        FROM users u
        LEFT JOIN project_members pm ON u.id = pm.user_id AND pm.project_id = ?
        LEFT JOIN projects p ON p.id = ? AND p.owner_id = u.id
        WHERE u.id = ? AND (pm.user_id IS NOT NULL OR p.owner_id IS NOT NULL)
      `, [projectId, projectId, assigned_to]);

      if (assigneeCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not have access to this project'
        });
      }
    }

    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, priority, assigned_to, created_by, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, priority, assigned_to, userId, projectId, due_date]
    );

    const taskId = result.insertId;

    // Get the created task with user details
    const [tasks] = await db.execute(`
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        assignee.email as assignee_email
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [taskId]);

    // Emit real-time update
    req.io.to(`project-${projectId}`).emit('task-created', {
      task: tasks[0],
      projectId
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: tasks[0]
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskId } = req.params;
    const userId = req.user.id;
    const db = getConnection();

    // Get current task data
    const [currentTasks] = await db.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (currentTasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const currentTask = currentTasks[0];
    const updates = [];
    const values = [];

    // Build dynamic update query and log changes
    const allowedFields = ['title', 'description', 'status', 'priority', 'assigned_to', 'due_date'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== currentTask[field]) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
        
        // Log the change
        await logTaskChange(taskId, userId, field, currentTask[field], req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided'
      });
    }

    values.push(taskId);
    
    await db.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated task
    const [updatedTasks] = await db.execute(`
      SELECT 
        t.*,
        creator.name as creator_name,
        assignee.name as assignee_name,
        assignee.email as assignee_email
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [taskId]);

    // Emit real-time update
    req.io.to(`project-${currentTask.project_id}`).emit('task-updated', {
      task: updatedTasks[0],
      projectId: currentTask.project_id,
      changedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: updatedTasks[0]
      }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const db = getConnection();

    // Get task to check project_id for real-time update
    const [tasks] = await db.execute('SELECT project_id FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const projectId = tasks[0].project_id;

    // Delete task (cascade will handle related records)
    const [result] = await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Emit real-time update
    req.io.to(`project-${projectId}`).emit('task-deleted', {
      taskId: parseInt(taskId),
      projectId,
      deletedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const db = getConnection();

    // Check if task exists
    const [tasks] = await db.execute('SELECT project_id FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskId, userId, content]
    );

    // Get the created comment with user details
    const [comments] = await db.execute(`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    // Emit real-time update
    req.io.to(`project-${tasks[0].project_id}`).emit('comment-added', {
      comment: comments[0],
      taskId: parseInt(taskId),
      projectId: tasks[0].project_id
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: comments[0]
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment
};
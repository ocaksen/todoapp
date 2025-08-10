import React, { useState } from 'react';
import { Calendar, User, MessageCircle, Clock, AlertTriangle, Trash2, Edit3, Check, X } from 'lucide-react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const StatusButton = ({ status, onClick, disabled }) => {
  const statusConfig = {
    todo: { color: 'bg-red-500', label: 'Todo', textColor: 'text-white' },
    doing: { color: 'bg-yellow-500', label: 'Doing', textColor: 'text-white' },
    done: { color: 'bg-green-500', label: 'Done', textColor: 'text-white' },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${config.color} ${config.textColor} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {config.label}
    </button>
  );
};

const TaskCard = ({ task, onTaskUpdate, onTaskDelete, canEdit = true }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    due_date: task.due_date || ''
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleStatusChange = async () => {
    if (!canEdit) return;
    
    const statusOrder = ['todo', 'doing', 'done'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    setIsUpdating(true);
    try {
      const response = await taskAPI.update(task.id, { status: nextStatus });
      onTaskUpdate(response.data.data.task);
      toast.success(`Task status updated to ${nextStatus}`);
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Status update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!canEdit) return;
    
    const isConfirmed = window.confirm(
      `Are you sure you want to delete the task "${task.title}"? This action cannot be undone.`
    );
    
    if (!isConfirmed) return;

    setIsUpdating(true);
    try {
      await taskAPI.delete(task.id);
      onTaskDelete(task.id);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Delete task error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || ''
    });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || ''
    });
  };

  const handleEditSave = async () => {
    if (!editData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        title: editData.title.trim(),
        description: editData.description.trim(),
        priority: editData.priority,
        due_date: editData.due_date || null
      };

      const response = await taskAPI.update(task.id, updateData);
      onTaskUpdate(response.data.data.task);
      setIsEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Update task error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className={`card border-l-4 ${getPriorityColor(task.priority)} hover:shadow-lg transition-shadow relative group`}>
      <div className="flex items-start justify-between">
        {canEdit && (
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <button
                onClick={handleEditStart}
                disabled={isUpdating}
                className="text-gray-400 hover:text-blue-600 p-1"
                title="Edit Task"
              >
                <Edit3 size={16} />
              </button>
            )}
            <button
              onClick={handleDeleteTask}
              disabled={isUpdating || isEditing}
              className="text-gray-400 hover:text-red-600 p-1"
              title="Delete Task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 pr-12">
          <div className="flex items-center space-x-2 mb-2">
            <StatusButton
              status={task.status}
              onClick={handleStatusChange}
              disabled={isUpdating || !canEdit}
            />
            {task.priority === 'high' && (
              <AlertTriangle size={16} className="text-red-500" />
            )}
            {isOverdue && (
              <Clock size={16} className="text-red-500" />
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3 mb-4">
              {/* Edit Title */}
              <div>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  placeholder="Task title..."
                  autoFocus
                />
              </div>
              
              {/* Edit Description */}
              <div>
                <textarea
                  value={editData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Task description..."
                  rows="3"
                />
              </div>
              
              {/* Edit Priority & Due Date */}
              <div className="flex space-x-3">
                <div className="flex-1">
                  <select
                    value={editData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={editData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              
              {/* Save/Cancel Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleEditSave}
                  disabled={isUpdating}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
              
              {task.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">{task.description}</p>
              )}
            </>
          )}

          {!isEditing && (
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {task.assignee_name && (
                <div className="flex items-center space-x-1">
                  <User size={12} />
                  <span>{task.assignee_name}</span>
                </div>
              )}
              
              {task.due_date && (
                <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-500' : ''}`}>
                  <Calendar size={12} />
                  <span>
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                    {isOverdue && ' (Overdue)'}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <MessageCircle size={12} />
                <span>0 comments</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Created by {task.creator_name}</span>
          <span className="capitalize">{task.priority} priority</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
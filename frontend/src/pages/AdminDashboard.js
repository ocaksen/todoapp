import React, { useState, useEffect } from 'react';
import { Users, Settings, Activity, Shield, Eye, Trash2, UserX, KeyRound } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  console.log('Current user:', user);
  console.log('Is admin:', isAdmin);
  console.log('Is super admin:', isSuperAdmin);

  useEffect(() => {
    if (!isAdmin) {
      console.log('User is not admin, not loading data');
      return;
    }
    
    console.log('Loading admin data for tab:', activeTab);
    loadData();
  }, [activeTab, isAdmin, loadData]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'users':
          await loadUsers();
          break;
        case 'tasks':
          await loadTasks();
          break;
        case 'logs':
          await loadTaskLogs();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      const response = await adminAPI.getAllUsers();
      console.log('Users API response:', response.data);
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Load users error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Failed to load users');
    }
  };

  const loadTasks = async () => {
    try {
      const response = await adminAPI.getAllTasks();
      setTasks(response.data.data.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Load tasks error:', error);
    }
  };

  const loadTaskLogs = async () => {
    try {
      const response = await adminAPI.getTaskLogs();
      setTaskLogs(response.data.data.logs);
    } catch (error) {
      toast.error('Failed to load task logs');
      console.error('Load task logs error:', error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, { role: newRole });
      toast.success('User role updated successfully');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handlePasswordReset = async (userId, newPassword) => {
    try {
      await adminAPI.resetUserPassword(userId, { new_password: newPassword });
      toast.success('Password reset successfully');
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success('User status updated successfully');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setShowModal(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700';
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-red-100 text-red-700';
      case 'doing':
        return 'bg-yellow-100 text-yellow-700';
      case 'done':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard
          </h1>
          <p className="text-gray-600">Manage users, tasks, and system settings</p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Super Admin</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="inline h-4 w-4 mr-2" />
            All Tasks
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="inline h-4 w-4 mr-2" />
            Task Logs
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="inline h-4 w-4 mr-2" />
              System Settings
            </button>
          )}
        </nav>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Users Management</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  View and manage all registered users
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {users.map((userItem) => (
                  <li key={userItem.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {userItem.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{userItem.name}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                              {userItem.role === 'super_admin' ? 'Super Admin' : userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userItem.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {userItem.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{userItem.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined {format(new Date(userItem.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Role Change */}
                        <select
                          value={userItem.role}
                          onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                          disabled={!isSuperAdmin && userItem.role === 'super_admin'}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 disabled:bg-gray-100"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                        </select>
                        
                        {/* Actions for Super Admin */}
                        {isSuperAdmin && userItem.id !== user.id && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openModal('password', userItem)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Reset Password"
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(userItem.id)}
                              className={`p-1 ${userItem.status === 'Active' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                              title={userItem.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                            >
                              <UserX size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">All Tasks</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  View and manage all tasks across all projects
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.project_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.assignee_name || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.creator_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(task.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Task Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Task Change Logs</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Track all changes made to tasks
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {taskLogs.map((log) => (
                  <li key={log.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.task_title} - {log.field_name} changed
                        </p>
                        <p className="text-sm text-gray-500">
                          From: <span className="font-mono bg-red-100 px-1">{log.old_value || 'null'}</span> 
                          → To: <span className="font-mono bg-green-100 px-1">{log.new_value || 'null'}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          Changed by {log.changed_by_name} on {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* System Settings Tab - Super Admin Only */}
          {activeTab === 'settings' && isSuperAdmin && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">System Settings</h3>
                <div className="mt-6">
                  <p className="text-sm text-gray-500">System settings management will be implemented here.</p>
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Coming soon:</p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1">
                      <li>• Application settings management</li>
                      <li>• Email configuration</li>
                      <li>• Security settings</li>
                      <li>• Database backups</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Password Reset Modal */}
      {showModal && modalType === 'password' && selectedUser && (
        <PasswordResetModal
          user={selectedUser}
          onSubmit={handlePasswordReset}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

const PasswordResetModal = ({ user, onSubmit, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(user.id, newPassword);
      setNewPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
          <h3 className="text-lg font-semibold mb-4">Reset Password for {user.name}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="Enter new password"
                minLength="6"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? <LoadingSpinner size="small" /> : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
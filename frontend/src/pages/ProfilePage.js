import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Save } from 'lucide-react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
  });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const response = await userAPI.getStats(user.id);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        avatar_url: user.avatar_url || '',
      });
      loadStats();
    }
  }, [user, loadStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await updateProfile(formData);
    
    if (result.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.message);
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
                  Avatar URL (optional)
                </label>
                <input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member Since
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={user?.created_at ? formatDate(user.created_at) : ''}
                    disabled
                    className="input pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Statistics</h3>
            
            {isStatsLoading ? (
              <LoadingSpinner className="py-8" />
            ) : stats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-semibold">{stats.total_tasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">Todo</span>
                  <span className="font-semibold text-red-600">{stats.todo_tasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600">In Progress</span>
                  <span className="font-semibold text-yellow-600">{stats.doing_tasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Completed</span>
                  <span className="font-semibold text-green-600">{stats.done_tasks}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Overdue</span>
                    <span className="font-semibold text-red-600">{stats.overdue_tasks}</span>
                  </div>
                </div>
                
                {stats.total_tasks > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">Completion Rate</div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(stats.done_tasks / stats.total_tasks) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((stats.done_tasks / stats.total_tasks) * 100)}% completed
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No task data available
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Role</span>
                <span className="font-medium capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID</span>
                <span className="font-mono text-xs">{user?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
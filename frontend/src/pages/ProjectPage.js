import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Users, Settings, Filter } from 'lucide-react';
import { projectAPI, taskAPI } from '../services/api';
import { joinProject, onTaskUpdated, onTaskCreated, onTaskDeleted, offTaskUpdated, offTaskCreated, offTaskDeleted } from '../services/socket';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskCard from '../components/TaskCard';

const CreateTaskModal = ({ isOpen, onClose, projectId, onSuccess, projectMembers = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData
      };
      // Only include assigned_to if it has a value
      if (formData.assigned_to) {
        submitData.assigned_to = parseInt(formData.assigned_to);
      }
      await taskAPI.create(projectId, submitData);
      toast.success('Task created successfully!');
      onSuccess();
      onClose();
      setFormData({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
          <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="Enter task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input h-20 resize-none"
                placeholder="Enter task description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to (optional)
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member) => (
                  <option key={member.user_id || member.id} value={member.user_id || member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input"
                />
              </div>
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
                {isLoading ? <LoadingSpinner size="small" /> : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MembersModal = ({ isOpen, onClose, project, projectMembers, onMembersUpdate }) => {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Project Members</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Project Owner */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{project.project.owner_name}</p>
                <p className="text-sm text-gray-500">{project.project.owner_email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                  Owner
                </span>
              </div>
            </div>

            {/* Project Members */}
            {projectMembers.filter(member => member.user_id !== project.project.owner_id).map((member) => (
              <div key={member.user_id || member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {member.role || 'Member'}
                  </span>
                </div>
              </div>
            ))}

            {projectMembers.filter(member => member.user_id !== project.project.owner_id).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No additional members in this project
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  useEffect(() => {
    loadProject();
    loadTasks();
    
    // Join project room for real-time updates
    joinProject(projectId);

    // Set up real-time listeners
    const handleTaskUpdate = (data) => {
      if (data.projectId === parseInt(projectId)) {
        setTasks(prev => prev.map(task => 
          task.id === data.task.id ? data.task : task
        ));
        if (data.changedBy) {
          toast.success(`Task updated by ${data.changedBy}`);
        }
      }
    };

    const handleTaskCreate = (data) => {
      if (data.projectId === parseInt(projectId)) {
        setTasks(prev => [data.task, ...prev]);
        toast.success('New task created');
      }
    };

    const handleTaskDelete = (data) => {
      if (data.projectId === parseInt(projectId)) {
        setTasks(prev => prev.filter(task => task.id !== data.taskId));
        toast.success(`Task deleted by ${data.deletedBy}`);
      }
    };

    onTaskUpdated(handleTaskUpdate);
    onTaskCreated(handleTaskCreate);
    onTaskDeleted(handleTaskDelete);

    return () => {
      offTaskUpdated(handleTaskUpdate);
      offTaskCreated(handleTaskCreate);
      offTaskDeleted(handleTaskDelete);
    };
  }, [projectId]);

  useEffect(() => {
    const filtered = statusFilter === 'all' 
      ? tasks 
      : tasks.filter(task => task.status === statusFilter);
    setFilteredTasks(filtered);
  }, [tasks, statusFilter]);

  const loadProject = async () => {
    try {
      const response = await projectAPI.getById(projectId);
      const projectData = response.data.data;
      setProject(projectData);
      
      // Combine project owner and members for assignment
      const allMembers = [...(projectData.members || [])];
      
      // Add project owner if not already in members
      const owner = {
        id: projectData.project.owner_id,
        user_id: projectData.project.owner_id,
        name: projectData.project.owner_name,
        email: projectData.project.owner_email,
        role: 'owner'
      };
      
      if (!allMembers.find(member => member.user_id === owner.id)) {
        allMembers.push(owner);
      }
      
      setProjectMembers(allMembers);
    } catch (error) {
      toast.error('Failed to load project');
      console.error('Load project error:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await taskAPI.getByProject(projectId);
      setTasks(response.data.data.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Load tasks error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const doing = tasks.filter(t => t.status === 'doing').length;
    const done = tasks.filter(t => t.status === 'done').length;
    return { total, todo, doing, done };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Project not found</div>
      </div>
    );
  }

  const stats = getTaskStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.project.name}</h1>
          {project.project.description && (
            <p className="text-gray-600 mt-1">{project.project.description}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Owner: {project.project.owner_name}</span>
            <span>•</span>
            <span>{projectMembers.length} members</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsMembersModalOpen(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Users size={16} />
            <span>Members</span>
          </button>
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card bg-gray-50">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="card bg-red-50">
          <div className="text-2xl font-bold text-red-600">{stats.todo}</div>
          <div className="text-sm text-red-700">Todo</div>
        </div>
        <div className="card bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-600">{stats.doing}</div>
          <div className="text-sm text-yellow-700">Doing</div>
        </div>
        <div className="card bg-green-50">
          <div className="text-2xl font-bold text-green-600">{stats.done}</div>
          <div className="text-sm text-green-700">Done</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-700">Filter by status:</span>
        </div>
        <div className="flex space-x-2">
          {['all', 'todo', 'doing', 'done'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {tasks.length === 0 ? 'No tasks yet' : `No ${statusFilter} tasks`}
          </div>
          {tasks.length === 0 && (
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="btn-primary"
            >
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              canEdit={true}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={projectId}
        onSuccess={loadTasks}
        projectMembers={projectMembers}
      />

      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        project={project}
        projectMembers={projectMembers}
        onMembersUpdate={loadProject}
      />
    </div>
  );
};

export default ProjectPage;
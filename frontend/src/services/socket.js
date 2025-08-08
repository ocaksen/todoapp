import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinProject = (projectId) => {
  if (socket) {
    socket.emit('join-project', projectId);
  }
};

export const emitTaskUpdate = (data) => {
  if (socket) {
    socket.emit('task-updated', data);
  }
};

export const onTaskUpdated = (callback) => {
  if (socket) {
    socket.on('task-updated', callback);
  }
};

export const onTaskCreated = (callback) => {
  if (socket) {
    socket.on('task-created', callback);
  }
};

export const onTaskDeleted = (callback) => {
  if (socket) {
    socket.on('task-deleted', callback);
  }
};

export const onCommentAdded = (callback) => {
  if (socket) {
    socket.on('comment-added', callback);
  }
};

export const offTaskUpdated = (callback) => {
  if (socket) {
    socket.off('task-updated', callback);
  }
};

export const offTaskCreated = (callback) => {
  if (socket) {
    socket.off('task-created', callback);
  }
};

export const offTaskDeleted = (callback) => {
  if (socket) {
    socket.off('task-deleted', callback);
  }
};

export const offCommentAdded = (callback) => {
  if (socket) {
    socket.off('comment-added', callback);
  }
};

export { socket };
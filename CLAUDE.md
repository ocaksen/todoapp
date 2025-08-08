# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack collaborative To-Do application built with:
- **Backend**: Node.js + Express.js + MySQL + Socket.IO
- **Frontend**: React + TailwindCSS + Socket.IO Client  
- **CLI**: Node.js command-line tool for daily task summaries

## Development Commands

### Installation & Setup
- `npm run install:all`: Install all dependencies (root, backend, frontend, CLI)
- `npm run setup:db`: Initialize database with tables and sample data

### Development
- `npm run dev`: Run both backend and frontend in development mode
- `npm run server:dev`: Run only backend server (http://localhost:5000)
- `npm run client:dev`: Run only frontend dev server (http://localhost:3000)

### Production
- `npm run client:build`: Build frontend for production
- `npm run server:start`: Start production backend server

### CLI Tool
- `npm run cli`: Launch interactive CLI for daily task summaries

### Database Management
- `npm run db:migrate`: Create database tables
- `npm run db:seed`: Add sample data
- `npm run db:setup`: Run migrations + seed data

## Architecture Overview

### Backend API Structure (`/backend`)
- **Authentication**: JWT-based with bcrypt password hashing
- **Real-time**: Socket.IO for live updates
- **Database**: MySQL with connection pooling
- **Security**: Helmet, CORS, rate limiting, input validation
- **Routes**: RESTful API design with middleware-based authorization

### Frontend Architecture (`/frontend`)
- **State Management**: React Context API for auth, local state for components
- **Real-time Updates**: Socket.IO client with event listeners
- **Routing**: React Router with protected routes
- **Styling**: TailwindCSS with custom components
- **API Integration**: Axios with interceptors for auth and error handling

### Key Features
- **Task Status System**: Color-coded (Red=Todo, Yellow=Doing, Green=Done)
- **Real-time Collaboration**: Instant updates across all connected clients
- **Role-based Permissions**: Project owners, members, viewers with granular access
- **Task Management**: Assignment, due dates, priorities, comments, history tracking

## Environment Configuration

Backend requires `.env` file:
```env
# Database
DB_HOST=localhost
DB_USER=your_db_user  
DB_PASSWORD=your_db_password
DB_NAME=todoapp

# Security
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=24h

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Database Schema

### Core Tables
- `users`: Authentication and user profiles
- `projects`: Project information and ownership
- `project_members`: Team membership with role-based permissions  
- `tasks`: Task data with status, priority, assignment, due dates
- `task_history`: Audit log of all task changes
- `comments`: Task discussions

### Relationships
- Projects have owners and members
- Tasks belong to projects and can be assigned to users
- All changes are logged for audit trails

## API Patterns

### Authentication Flow
1. Register/Login → Receive JWT token
2. Include `Authorization: Bearer <token>` header
3. Middleware validates token and attaches user to request

### Real-time Updates
1. Client joins project room via Socket.IO
2. Task changes emit events to project room
3. All connected clients receive instant updates

### Permission Checking
- Project-level permissions (owner, admin, member, viewer)
- Task-level permissions (can edit, can delete)
- Middleware validates access before operations

## Common Development Patterns

### Adding New API Endpoints
1. Create controller in `/controllers`
2. Add validation rules using express-validator
3. Create route in `/routes` with proper middleware
4. Update frontend API service in `/services/api.js`

### Adding Real-time Features
1. Emit events from backend controllers using `req.io`
2. Listen for events in React components
3. Update local state when events received
4. Clean up listeners in useEffect cleanup

### Database Operations
- Always use parameterized queries to prevent SQL injection
- Use connection pooling from `config/database.js`
- Log important changes to `task_history` table
- Handle transactions for multi-table operations

## Testing Approach

Use sample accounts for development:
- john@example.com / password123 (Admin)
- jane@example.com / password123 (User)  
- bob@example.com / password123 (User)

Run `npm run setup:db` to create sample projects and tasks for testing.
# TodoApp - Full-Stack Collaborative Task Management

A modern, full-stack Todo application with real-time collaboration features, built with Node.js, Express, React, and MySQL.

## 🚀 Features

### User Management
- ✅ User registration and authentication (JWT-based)
- ✅ Secure password hashing with bcrypt
- ✅ Role-based access control (admin/user)
- ✅ User profiles with avatars

### Task Management
- ✅ Create, read, update, delete tasks
- ✅ Task status management (Todo/Doing/Done) with color-coded system:
  - 🔴 **Red**: Todo (Not started)
  - 🟡 **Yellow**: Doing (In progress)  
  - 🟢 **Green**: Done (Completed)
- ✅ Priority levels (Low, Medium, High)
- ✅ Due date tracking with overdue detection
- ✅ Task comments and discussions
- ✅ Task assignment to team members

### Project Collaboration
- ✅ Multi-project support
- ✅ Team member management with granular permissions
- ✅ Role-based access (Owner, Admin, Member, Viewer)
- ✅ Real-time updates across all connected clients

### Real-Time Features
- ✅ Live task status updates via WebSocket
- ✅ Real-time notifications for task changes
- ✅ Collaborative editing with instant sync

### Additional Features
- ✅ Responsive design with TailwindCSS
- ✅ RESTful API architecture
- ✅ CLI tool for daily task summaries
- ✅ Task history logging
- ✅ Advanced filtering and search

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcrypt.js** - Password hashing
- **Socket.IO** - Real-time communication
- **express-validator** - Input validation
- **helmet** + **cors** - Security middleware

### Frontend  
- **React 18** - UI framework
- **React Router** - Navigation
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time updates
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### CLI Tool
- **Node.js** - Runtime
- **Inquirer** - Interactive prompts
- **Chalk** - Terminal colors
- **Table** - Data formatting

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd todoapp
\`\`\`

### 2. Install Dependencies
\`\`\`bash
# Install root dependencies
npm run install:all
\`\`\`

This command installs dependencies for:
- Root package (concurrently)
- Backend (Express, MySQL, Socket.IO, etc.)
- Frontend (React, TailwindCSS, etc.)  
- CLI tool (Inquirer, Chalk, etc.)

### 3. Database Setup

#### Create MySQL Database
\`\`\`sql
CREATE DATABASE todoapp;
CREATE USER 'todoapp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON todoapp.* TO 'todoapp_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

#### Configure Environment Variables
\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

Edit \`.env\` file:
\`\`\`env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=todoapp_user
DB_PASSWORD=your_secure_password
DB_NAME=todoapp

# JWT Secret - CHANGE THIS TO A STRONG SECRET
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_random_123456789

# JWT Expiration
JWT_EXPIRE=24h

# CORS Origin
CORS_ORIGIN=http://localhost:3000
\`\`\`

⚠️ **Security Note**: Generate a strong JWT secret using:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

#### Run Database Migrations
\`\`\`bash
npm run setup:db
\`\`\`

This creates all necessary tables:
- \`users\` - User accounts
- \`projects\` - Project information
- \`project_members\` - Team membership
- \`tasks\` - Task data
- \`task_history\` - Change logging
- \`comments\` - Task comments

### 4. Development Setup

#### Option A: Run Both Frontend & Backend Together
\`\`\`bash
# From root directory
npm run dev
\`\`\`

This starts:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

#### Option B: Run Separately
\`\`\`bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend  
npm run client:dev
\`\`\`

### 5. Production Setup

#### Build Frontend
\`\`\`bash
npm run client:build
\`\`\`

#### Start Production Server
\`\`\`bash
npm run server:start
\`\`\`

## 📋 Usage

### Web Application

1. **Registration**: Create a new account at http://localhost:3000/register
2. **Login**: Sign in at http://localhost:3000/login
3. **Create Projects**: Start by creating your first project
4. **Add Team Members**: Invite collaborators via email
5. **Manage Tasks**: Create, assign, and track task progress
6. **Real-time Updates**: See changes instantly across all devices

### CLI Tool

The CLI provides a terminal interface for daily task summaries:

\`\`\`bash
# Run from root directory
npm run cli
\`\`\`

Features:
- 📊 **Daily Summary**: Overview of all projects and statistics  
- 📅 **Today's Tasks**: Tasks due today
- 📈 **Task Statistics**: Personal productivity metrics
- 🎨 **Color-coded Output**: Visual status indicators

## 🏗 Project Structure

\`\`\`
todoapp/
├── backend/                 # Express.js API server
│   ├── config/             # Database configuration  
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth & validation middleware
│   ├── models/             # Database models (if using ORM)
│   ├── routes/             # API routes
│   ├── scripts/            # Database migrations & seeds
│   └── server.js           # Main server file
│
├── frontend/               # React application
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route components  
│       ├── context/        # React context providers
│       ├── services/       # API & socket services
│       ├── hooks/          # Custom React hooks
│       └── utils/          # Utility functions
│
├── cli/                    # Command-line interface
│   ├── index.js           # Main CLI script
│   └── package.json       # CLI dependencies
│
└── package.json           # Root package configuration
\`\`\`

## 🔧 API Endpoints

### Authentication
\`\`\`
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update user profile
\`\`\`

### Projects
\`\`\`
GET    /api/projects                          # Get user projects
GET    /api/projects/:id                      # Get project details
POST   /api/projects                          # Create project
PUT    /api/projects/:id                      # Update project
DELETE /api/projects/:id                      # Delete project
POST   /api/projects/:id/members              # Add team member
PUT    /api/projects/:id/members/:memberId    # Update member role
DELETE /api/projects/:id/members/:memberId    # Remove member
\`\`\`

### Tasks
\`\`\`
GET    /api/tasks/project/:projectId          # Get project tasks
GET    /api/tasks/:id                         # Get task details
POST   /api/tasks/project/:projectId          # Create task
PUT    /api/tasks/:id                         # Update task
DELETE /api/tasks/:id                         # Delete task
POST   /api/tasks/:id/comments                # Add comment
\`\`\`

### Users
\`\`\`
GET /api/users              # Search users (for team member assignment)
GET /api/users/:id          # Get user details
GET /api/users/:id/stats    # Get user task statistics
\`\`\`

## 🎨 Task Status Colors

The application uses a color-coded system for task status:

| Status | Color | Description |
|--------|-------|-------------|
| **Todo** | 🔴 Red | Task not started |
| **Doing** | 🟡 Yellow | Task in progress |  
| **Done** | 🟢 Green | Task completed |

Status changes are:
- ⚡ **Instant**: Updates reflect immediately across all clients
- 🔄 **Cyclical**: Click status button to cycle through states
- 📱 **Responsive**: Works on desktop, tablet, and mobile

## 🔒 Security Features

- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **Input Validation**: Server-side validation with express-validator
- ✅ **Rate Limiting**: Prevents abuse and brute force attacks
- ✅ **CORS Protection**: Configurable cross-origin resource sharing
- ✅ **Helmet Security**: Various HTTP security headers
- ✅ **SQL Injection Prevention**: Parameterized queries
- ✅ **Permission-based Access**: Role and permission validation

## 📊 Database Schema

### Users Table
\`\`\`sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
\`\`\`

### Projects Table
\`\`\`sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
\`\`\`

### Tasks Table
\`\`\`sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'doing', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  assigned_to INT,
  created_by INT NOT NULL,
  project_id INT NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
\`\`\`

## 🚀 Deployment

### Environment Variables for Production
\`\`\`env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_production_password
JWT_SECRET=your_very_secure_production_jwt_secret
CORS_ORIGIN=https://yourdomain.com
\`\`\`

### Docker Deployment (Optional)
\`\`\`dockerfile
# Example Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
EXPOSE 5000
CMD ["npm", "start"]
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit changes (\`git commit -m 'Add AmazingFeature'\`)
4. Push to branch (\`git push origin feature/AmazingFeature\`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
\`\`\`bash
# Check MySQL service status
sudo systemctl status mysql

# Test database connection
mysql -u todoapp_user -p todoapp
\`\`\`

**Port Already in Use**
\`\`\`bash
# Find process using port 5000
lsof -i :5000

# Kill process (replace PID)
kill -9 PID
\`\`\`

**Frontend Build Issues**
\`\`\`bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules
cd frontend && npm install
\`\`\`

**JWT Token Issues**
- Ensure JWT_SECRET is set and consistent
- Check token expiration time
- Verify CORS_ORIGIN matches frontend URL

## 📞 Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoints and database schema above

---

**Happy Task Managing! 📝✨**
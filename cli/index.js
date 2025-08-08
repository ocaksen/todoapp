#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { table } = require('table');
require('dotenv').config({ path: '../.env' });

class TodoCLI {
  constructor() {
    this.API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
    this.token = null;
    this.user = null;
  }

  async login() {
    console.log(chalk.blue.bold('\n📝 TodoApp CLI - Daily Task Summary\n'));

    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) || 'Please enter a valid email address';
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
      },
    ]);

    try {
      const response = await axios.post(`${this.API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      this.token = response.data.data.token;
      this.user = response.data.data.user;

      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      
      console.log(chalk.green(`✅ Welcome back, ${this.user.name}!\n`));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ Login failed:'), error.response?.data?.message || 'Unknown error');
      return false;
    }
  }

  async getUserProjects() {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/projects`);
      return response.data.data.projects;
    } catch (error) {
      console.log(chalk.red('❌ Failed to fetch projects'));
      return [];
    }
  }

  async getProjectTasks(projectId) {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/tasks/project/${projectId}`);
      return response.data.data.tasks;
    } catch (error) {
      console.log(chalk.red(`❌ Failed to fetch tasks for project ${projectId}`));
      return [];
    }
  }

  async getUserStats() {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/users/${this.user.id}/stats`);
      return response.data.data.stats;
    } catch (error) {
      console.log(chalk.red('❌ Failed to fetch user statistics'));
      return null;
    }
  }

  formatTaskStatus(status) {
    switch (status) {
      case 'todo':
        return chalk.red('● TODO');
      case 'doing':
        return chalk.yellow('● DOING');
      case 'done':
        return chalk.green('● DONE');
      default:
        return status;
    }
  }

  formatPriority(priority) {
    switch (priority) {
      case 'high':
        return chalk.red.bold('HIGH');
      case 'medium':
        return chalk.yellow('MEDIUM');
      case 'low':
        return chalk.blue('LOW');
      default:
        return priority;
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    
    if (diffDays < 0) {
      return chalk.red(`${formatted} (${Math.abs(diffDays)} days overdue)`);
    } else if (diffDays === 0) {
      return chalk.yellow(`${formatted} (Today)`);
    } else if (diffDays === 1) {
      return chalk.yellow(`${formatted} (Tomorrow)`);
    } else if (diffDays <= 7) {
      return chalk.cyan(`${formatted} (in ${diffDays} days)`);
    } else {
      return formatted;
    }
  }

  async displayDailySummary() {
    console.log(chalk.blue.bold('📊 Daily Task Summary\n'));

    // Get user statistics
    const stats = await getUserStats.call(this);
    if (stats) {
      console.log(chalk.bold('📈 Your Task Statistics:'));
      console.log(`   Total Tasks: ${chalk.cyan(stats.total_tasks)}`);
      console.log(`   ${chalk.red('Todo:')} ${stats.todo_tasks}`);
      console.log(`   ${chalk.yellow('In Progress:')} ${stats.doing_tasks}`);
      console.log(`   ${chalk.green('Completed:')} ${stats.done_tasks}`);
      if (stats.overdue_tasks > 0) {
        console.log(`   ${chalk.red.bold('⚠️  Overdue:')} ${stats.overdue_tasks}`);
      }
      
      if (stats.total_tasks > 0) {
        const completionRate = Math.round((stats.done_tasks / stats.total_tasks) * 100);
        console.log(`   Completion Rate: ${chalk.cyan(completionRate + '%')}`);
      }
      console.log('');
    }

    // Get projects and their tasks
    const projects = await this.getUserProjects();
    if (projects.length === 0) {
      console.log(chalk.yellow('📝 No projects found. Create your first project to get started!'));
      return;
    }

    console.log(chalk.bold(`📁 Your Projects (${projects.length}):\n`));

    for (const project of projects) {
      console.log(chalk.bold.underline(`${project.name}`));
      if (project.description) {
        console.log(chalk.gray(`   ${project.description}`));
      }
      console.log(chalk.gray(`   Role: ${project.user_role} | Owner: ${project.owner_name}`));
      
      const tasks = await this.getProjectTasks(project.id);
      
      if (tasks.length === 0) {
        console.log(chalk.gray('   No tasks in this project\n'));
        continue;
      }

      // Filter tasks assigned to current user
      const myTasks = tasks.filter(task => task.assigned_to === this.user.id);
      const otherTasks = tasks.filter(task => task.assigned_to !== this.user.id);

      if (myTasks.length > 0) {
        console.log(chalk.cyan.bold('   📋 Your Tasks:'));
        
        const tableData = [
          ['Status', 'Title', 'Priority', 'Due Date']
        ];

        myTasks.forEach(task => {
          tableData.push([
            this.formatTaskStatus(task.status),
            task.title.length > 40 ? task.title.substring(0, 37) + '...' : task.title,
            this.formatPriority(task.priority),
            this.formatDate(task.due_date)
          ]);
        });

        console.log(table(tableData, {
          border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',
            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',
            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',
            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼'
          }
        }));
      }

      if (otherTasks.length > 0) {
        console.log(chalk.magenta.bold('   👥 Team Tasks:'));
        const statusCount = {
          todo: otherTasks.filter(t => t.status === 'todo').length,
          doing: otherTasks.filter(t => t.status === 'doing').length,
          done: otherTasks.filter(t => t.status === 'done').length
        };
        
        console.log(`      ${chalk.red('Todo:')} ${statusCount.todo} | ${chalk.yellow('Doing:')} ${statusCount.doing} | ${chalk.green('Done:')} ${statusCount.done}`);
      }
      
      console.log('');
    }
  }

  async displayTodaysTasks() {
    console.log(chalk.blue.bold('📅 Today\'s Focus\n'));

    const projects = await this.getUserProjects();
    let todaysTasks = [];

    for (const project of projects) {
      const tasks = await this.getProjectTasks(project.id);
      const myTodaysTasks = tasks.filter(task => {
        if (task.assigned_to !== this.user.id) return false;
        if (!task.due_date) return false;
        
        const taskDate = new Date(task.due_date);
        const today = new Date();
        
        return taskDate.toDateString() === today.toDateString();
      });

      myTodaysTasks.forEach(task => {
        todaysTasks.push({ ...task, projectName: project.name });
      });
    }

    if (todaysTasks.length === 0) {
      console.log(chalk.green('🎉 No tasks due today! You\'re all caught up.'));
      return;
    }

    console.log(chalk.yellow.bold(`⚡ You have ${todaysTasks.length} task(s) due today:\n`));

    todaysTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${this.formatTaskStatus(task.status)} ${chalk.bold(task.title)}`);
      console.log(`   Project: ${chalk.cyan(task.projectName)}`);
      console.log(`   Priority: ${this.formatPriority(task.priority)}`);
      if (task.description) {
        const desc = task.description.length > 80 ? task.description.substring(0, 77) + '...' : task.description;
        console.log(`   ${chalk.gray(desc)}`);
      }
      console.log('');
    });
  }

  async displayMenu() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to see?',
        choices: [
          { name: '📊 Daily Summary (All projects and statistics)', value: 'summary' },
          { name: '📅 Today\'s Tasks (Tasks due today)', value: 'today' },
          { name: '🚪 Exit', value: 'exit' }
        ],
      },
    ]);

    switch (action) {
      case 'summary':
        await this.displayDailySummary();
        break;
      case 'today':
        await this.displayTodaysTasks();
        break;
      case 'exit':
        console.log(chalk.blue('👋 Have a productive day!'));
        return false;
    }

    console.log('\n' + chalk.gray('─'.repeat(80)) + '\n');
    return true;
  }

  async run() {
    try {
      // Login first
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        process.exit(1);
      }

      // Show menu and handle user choices
      let continueRunning = true;
      while (continueRunning) {
        continueRunning = await this.displayMenu();
      }
    } catch (error) {
      console.log(chalk.red('❌ An error occurred:'), error.message);
      process.exit(1);
    }
  }
}

// Create and run the CLI
const cli = new TodoCLI();
cli.run();

// Export for potential use as a module
module.exports = TodoCLI;
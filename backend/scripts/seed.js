const bcrypt = require('bcryptjs');
const { initializeDatabase, getConnection } = require('../config/database');

const seedData = async () => {
  try {
    await initializeDatabase();
    const db = getConnection();

    console.log('🌱 Seeding database with sample data...');

    // Create sample users
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'admin'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com', 
        password: await bcrypt.hash('password123', 12),
        role: 'user'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user'
      }
    ];

    console.log('👤 Creating sample users...');
    const userIds = [];
    for (const user of users) {
      const result = await db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [user.name, user.email, user.password, user.role]
      );
      userIds.push(result.lastID);
      console.log(`   ✅ Created user: ${user.name} (${user.email})`);
    }

    // Create sample projects
    const projects = [
      {
        name: 'Website Redesign',
        description: 'Complete redesign of the company website with modern UI/UX',
        owner_id: userIds[0]
      },
      {
        name: 'Mobile App Development', 
        description: 'Develop iOS and Android mobile application',
        owner_id: userIds[1]
      },
      {
        name: 'Marketing Campaign',
        description: 'Q4 marketing campaign planning and execution',
        owner_id: userIds[0]
      }
    ];

    console.log('📁 Creating sample projects...');
    const projectIds = [];
    for (const project of projects) {
      const result = await db.run(
        'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
        [project.name, project.description, project.owner_id]
      );
      projectIds.push(result.lastID);
      console.log(`   ✅ Created project: ${project.name}`);
    }

    // Add project members
    console.log('👥 Adding project members...');
    const memberships = [
      { project_id: projectIds[0], user_id: userIds[1], role: 'member', can_edit: 1, can_delete: 0 },
      { project_id: projectIds[0], user_id: userIds[2], role: 'viewer', can_edit: 0, can_delete: 0 },
      { project_id: projectIds[1], user_id: userIds[0], role: 'admin', can_edit: 1, can_delete: 1 },
      { project_id: projectIds[2], user_id: userIds[1], role: 'member', can_edit: 1, can_delete: 0 },
    ];

    for (const membership of memberships) {
      await db.run(
        'INSERT INTO project_members (project_id, user_id, role, can_edit, can_delete) VALUES (?, ?, ?, ?, ?)',
        [membership.project_id, membership.user_id, membership.role, membership.can_edit, membership.can_delete]
      );
    }
    console.log(`   ✅ Added ${memberships.length} project memberships`);

    // Create sample tasks
    const tasks = [
      // Website Redesign Project
      {
        title: 'Design Homepage Mockup',
        description: 'Create wireframes and mockups for the new homepage design',
        status: 'doing',
        priority: 'high',
        assigned_to: userIds[1],
        created_by: userIds[0],
        project_id: projectIds[0],
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'Set up Development Environment',
        description: 'Configure local development environment with required tools',
        status: 'done',
        priority: 'medium',
        assigned_to: userIds[2],
        created_by: userIds[0],
        project_id: projectIds[0],
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'Content Audit',
        description: 'Review and audit all existing website content',
        status: 'todo',
        priority: 'low',
        assigned_to: userIds[1],
        created_by: userIds[0],
        project_id: projectIds[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      // Mobile App Project
      {
        title: 'Define App Requirements',
        description: 'Document functional and non-functional requirements',
        status: 'done',
        priority: 'high',
        assigned_to: userIds[1],
        created_by: userIds[1],
        project_id: projectIds[1],
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'UI/UX Design',
        description: 'Create user interface designs and user experience flow',
        status: 'doing',
        priority: 'high',
        assigned_to: userIds[0],
        created_by: userIds[1],
        project_id: projectIds[1],
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'Set up CI/CD Pipeline',
        description: 'Configure continuous integration and deployment',
        status: 'todo',
        priority: 'medium',
        assigned_to: userIds[0],
        created_by: userIds[1],
        project_id: projectIds[1],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      // Marketing Campaign Project
      {
        title: 'Market Research',
        description: 'Conduct research on target audience and competitors',
        status: 'done',
        priority: 'high',
        assigned_to: userIds[1],
        created_by: userIds[0],
        project_id: projectIds[2],
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'Create Campaign Materials',
        description: 'Design graphics, copy, and other marketing materials',
        status: 'doing',
        priority: 'high',
        assigned_to: userIds[1],
        created_by: userIds[0],
        project_id: projectIds[2],
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        title: 'Budget Planning',
        description: 'Plan and allocate budget for the marketing campaign',
        status: 'todo',
        priority: 'medium',
        assigned_to: null,
        created_by: userIds[0],
        project_id: projectIds[2],
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    console.log('📋 Creating sample tasks...');
    const taskIds = [];
    for (const task of tasks) {
      const result = await db.run(
        'INSERT INTO tasks (title, description, status, priority, assigned_to, created_by, project_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [task.title, task.description, task.status, task.priority, task.assigned_to, task.created_by, task.project_id, task.due_date]
      );
      taskIds.push(result.lastID);
      console.log(`   ✅ Created task: ${task.title} (${task.status})`);
    }

    // Create sample comments
    const comments = [
      {
        task_id: taskIds[0],
        user_id: userIds[0],
        content: 'Great progress on the mockup! The color scheme looks perfect.'
      },
      {
        task_id: taskIds[0], 
        user_id: userIds[1],
        content: 'Thanks! I\'ll have the final version ready by tomorrow.'
      },
      {
        task_id: taskIds[4],
        user_id: userIds[1],
        content: 'The design is coming along nicely. Should we schedule a review meeting?'
      },
      {
        task_id: taskIds[7],
        user_id: userIds[0],
        content: 'Let\'s focus on social media channels for this campaign.'
      }
    ];

    console.log('💬 Creating sample comments...');
    for (const comment of comments) {
      await db.run(
        'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
        [comment.task_id, comment.user_id, comment.content]
      );
    }
    console.log(`   ✅ Created ${comments.length} comments`);

    // Create some task history entries
    console.log('📊 Creating sample task history...');
    const historyEntries = [
      {
        task_id: taskIds[1],
        changed_by: userIds[2],
        field_name: 'status',
        old_value: 'doing',
        new_value: 'done'
      },
      {
        task_id: taskIds[3],
        changed_by: userIds[1],
        field_name: 'status',
        old_value: 'todo',
        new_value: 'done'
      },
      {
        task_id: taskIds[6],
        changed_by: userIds[1],
        field_name: 'status',
        old_value: 'todo',
        new_value: 'done'
      }
    ];

    for (const entry of historyEntries) {
      await db.run(
        'INSERT INTO task_history (task_id, changed_by, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
        [entry.task_id, entry.changed_by, entry.field_name, entry.old_value, entry.new_value]
      );
    }
    console.log(`   ✅ Created ${historyEntries.length} history entries`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('Sample accounts created:');
    console.log('  📧 john@example.com / password123 (Admin)');
    console.log('  📧 jane@example.com / password123 (User)');
    console.log('  📧 bob@example.com / password123 (User)');
    console.log('\n💡 You can now log in with any of these accounts to explore the application.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
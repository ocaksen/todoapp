const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const seedDatabase = async () => {
  const db = new sqlite3.Database(dbPath);
  
  console.log('🌱 Adding sample data...');

  // Create users first
  const password = await bcrypt.hash('password123', 12);
  
  const runAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  };

  try {
    // Insert users
    const user1 = await runAsync(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['John Doe', 'john@example.com', password, 'admin']
    );
    
    const user2 = await runAsync(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Jane Smith', 'jane@example.com', password, 'user']
    );

    console.log('✅ Created users');

    // Insert projects
    const project1 = await runAsync(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      ['Website Redesign', 'Complete redesign of the company website', user1]
    );

    console.log('✅ Created projects');

    // Insert tasks
    await runAsync(
      'INSERT INTO tasks (title, description, status, priority, assigned_to, created_by, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Design Homepage', 'Create mockups for homepage', 'todo', 'high', user2, user1, project1]
    );

    await runAsync(
      'INSERT INTO tasks (title, description, status, priority, assigned_to, created_by, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Setup Development Environment', 'Configure local dev environment', 'doing', 'medium', user1, user1, project1]
    );

    await runAsync(
      'INSERT INTO tasks (title, description, status, priority, assigned_to, created_by, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Test New Features', 'Test all implemented features', 'done', 'low', user2, user1, project1]
    );

    console.log('✅ Created tasks');

    console.log('\n🎉 Sample data added successfully!');
    console.log('Login accounts:');
    console.log('  📧 john@example.com / password123');
    console.log('  📧 jane@example.com / password123');

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    db.close();
    process.exit(1);
  }
};

seedDatabase();
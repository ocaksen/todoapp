const bcrypt = require('bcryptjs');
const { initializeDatabase, getConnection } = require('../config/database');

const updateSchema = async () => {
  try {
    await initializeDatabase();
    const db = getConnection();

    console.log('📝 Updating users table schema...');

    // Create backup
    await db.run('DROP TABLE IF EXISTS users_backup');
    await db.run('CREATE TABLE users_backup AS SELECT * FROM users');
    
    // Drop and recreate users table with super_admin support
    await db.run('DROP TABLE users');
    await db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'super_admin')),
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert back all data
    await db.run('INSERT INTO users SELECT * FROM users_backup');
    
    // Clean up backup
    await db.run('DROP TABLE users_backup');
    
    console.log('✅ Users table updated with super_admin role');

    // Now create super admin user
    console.log('👤 Creating super admin user...');
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    
    // Check if user already exists and update
    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', ['osman@admin.com']);
    
    if (existingUser && existingUser.length > 0) {
      await db.run(
        'UPDATE users SET name = ?, password = ?, role = ? WHERE email = ?',
        ['Osman Admin', hashedPassword, 'super_admin', 'osman@admin.com']
      );
      console.log('✅ Super Admin user updated');
    } else {
      const result = await db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Osman Admin', 'osman@admin.com', hashedPassword, 'super_admin']
      );
      console.log('✅ Super Admin user created with ID:', result.lastID);
    }
    console.log('📧 Email: osman@admin.com');
    console.log('🔐 Password: admin123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
};

updateSchema();
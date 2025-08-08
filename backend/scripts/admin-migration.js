const { initializeDatabase, getConnection } = require('../config/database');

const migrateForAdmin = async () => {
  try {
    await initializeDatabase();
    const db = getConnection();

    console.log('🔧 Running admin migration...');

    // Add new columns if they don't exist
    try {
      await db.run('ALTER TABLE users ADD COLUMN last_login DATETIME');
      console.log('✅ Added last_login column');
    } catch (e) {
      console.log('⚠️ last_login column already exists or error');
    }
    
    try {
      await db.run('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1');
      console.log('✅ Added is_active column');
    } catch (e) {
      console.log('⚠️ is_active column already exists or error');
    }

    // Create new users table with updated schema
    await db.run(`
      CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'super_admin')),
        avatar_url TEXT,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Copy existing data
    await db.run(`
      INSERT INTO users_new (id, email, password, name, role, avatar_url, created_at, updated_at, last_login, is_active)
      SELECT id, email, password, name, role, avatar_url, created_at, updated_at, 
             COALESCE(last_login, created_at), COALESCE(is_active, 1)
      FROM users
    `);

    // Replace old table
    await db.run('DROP TABLE users');
    await db.run('ALTER TABLE users_new RENAME TO users');

    console.log('✅ Updated users table schema successfully');

    // Create a super admin if none exists
    const [superAdmins] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ['super_admin']);
    
    if (superAdmins[0].count === 0) {
      // Make the first admin user a super admin
      const [admins] = await db.execute('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
      
      if (admins.length > 0) {
        await db.execute('UPDATE users SET role = ? WHERE id = ?', ['super_admin', admins[0].id]);
        console.log('✅ Promoted first admin user to super admin');
      } else {
        // Make the first user a super admin
        const [users] = await db.execute('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
        if (users.length > 0) {
          await db.execute('UPDATE users SET role = ? WHERE id = ?', ['super_admin', users[0].id]);
          console.log('✅ Promoted first user to super admin');
        }
      }
    }

    console.log('🎉 Admin migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateForAdmin();
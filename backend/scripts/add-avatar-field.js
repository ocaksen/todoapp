const { getConnection } = require('../config/database');

const addAvatarField = async () => {
  try {
    const db = getConnection();
    
    // Check if avatar_url column exists
    const [columns] = await db.execute("PRAGMA table_info(users)");
    const hasAvatarUrl = columns.some(col => col.name === 'avatar_url');
    
    if (!hasAvatarUrl) {
      await db.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT');
      console.log('✅ avatar_url field added to users table');
    } else {
      console.log('✅ avatar_url field already exists');
    }
    
  } catch (error) {
    console.error('❌ Failed to add avatar_url field:', error);
    process.exit(1);
  }
};

// Eğer bu script doğrudan çalıştırılırsa
if (require.main === module) {
  addAvatarField();
}

module.exports = { addAvatarField };
const { getConnection } = require('../config/database');

const addAvatarField = async () => {
  try {
    const db = getConnection();
    
    // Simply try to add the field - SQLite will ignore if it exists
    try {
      await db.execute('ALTER TABLE users ADD COLUMN avatar_url TEXT');
      console.log('✅ avatar_url field added to users table');
    } catch (error) {
      if (error.message.includes('duplicate column')) {
        console.log('✅ avatar_url field already exists');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to add avatar_url field:', error);
    // Don't exit - continue without avatar field
  }
};

// Eğer bu script doğrudan çalıştırılırsa
if (require.main === module) {
  addAvatarField();
}

module.exports = { addAvatarField };
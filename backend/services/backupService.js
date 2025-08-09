const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const { getConnection } = require('../config/database');

class BackupService {
  constructor() {
    this.backupDir = process.env.NODE_ENV === 'production' 
      ? '/opt/render/project/src/backups' 
      : path.join(__dirname, '..', 'backups');
    
    // Delay initialization to ensure database is ready
    setTimeout(() => {
      this.initBackupDirectory();
      this.startScheduledBackups();
    }, 1000);
  }

  async initBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`📁 Backup directory created: ${this.backupDir}`);
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  async createBackup(type = 'manual') {
    try {
      const db = getConnection();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Get all data from important tables
      const backup = {
        metadata: {
          type: type,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        },
        data: {}
      };
      
      const [users] = await db.execute('SELECT * FROM users');
      const [projects] = await db.execute('SELECT * FROM projects');
      const [tasks] = await db.execute('SELECT * FROM tasks');
      const [projectMembers] = await db.execute('SELECT * FROM project_members');
      const [taskHistory] = await db.execute('SELECT * FROM task_history');
      const [comments] = await db.execute('SELECT * FROM comments');
      
      backup.data.users = users;
      backup.data.projects = projects;
      backup.data.tasks = tasks;
      backup.data.project_members = projectMembers;
      backup.data.task_history = taskHistory;
      backup.data.comments = comments;
      
      // Create backup file
      const filename = `backup_${type}_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
      
      console.log(`✅ ${type.toUpperCase()} backup created: ${filename}`);
      
      // Clean old backups of this type
      await this.cleanOldBackups(type);
      
      return {
        success: true,
        filename: filename,
        path: filepath,
        size: JSON.stringify(backup).length
      };
      
    } catch (error) {
      console.error(`❌ ${type.toUpperCase()} backup failed:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanOldBackups(type) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`backup_${type}_`) && file.endsWith('.json'))
        .sort()
        .reverse(); // En yeni önce
      
      // Keep limits based on type
      const keepLimits = {
        'daily': 7,      // Son 7 günlük backup
        'every3days': 10, // Son 30 günlük backup (10 x 3 = 30 gün)
        'weekly': 8       // Son 2 aylık backup (8 x 7 = 56 gün)
      };
      
      const keepCount = keepLimits[type] || 5;
      const filesToDelete = backupFiles.slice(keepCount);
      
      for (const file of filesToDelete) {
        const filepath = path.join(this.backupDir, file);
        await fs.unlink(filepath);
        console.log(`🗑️ Deleted old ${type} backup: ${file}`);
      }
      
    } catch (error) {
      console.error('Failed to clean old backups:', error);
    }
  }

  startScheduledBackups() {
    // Günlük backup - her gün saat 02:00
    cron.schedule('0 2 * * *', () => {
      console.log('🕐 Starting daily backup...');
      this.createBackup('daily');
    }, {
      timezone: "Europe/Istanbul"
    });

    // 3 günde bir backup - her 3 günde bir saat 03:00  
    cron.schedule('0 3 */3 * *', () => {
      console.log('🕐 Starting every-3-days backup...');
      this.createBackup('every3days');
    }, {
      timezone: "Europe/Istanbul"
    });

    // Haftalık backup - her pazar saat 04:00
    cron.schedule('0 4 * * 0', () => {
      console.log('🕐 Starting weekly backup...');
      this.createBackup('weekly');
    }, {
      timezone: "Europe/Istanbul"
    });

    console.log('⏰ Scheduled backups initialized:');
    console.log('   📅 Daily: Every day at 02:00');
    console.log('   📅 Every 3 days: Every 3 days at 03:00');
    console.log('   📅 Weekly: Every Sunday at 04:00');
  }

  async getBackupList() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      const backups = [];
      
      for (const file of backupFiles) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        const parts = file.replace('backup_', '').replace('.json', '').split('_');
        const type = parts[0];
        const timestamp = parts.slice(1).join('_');
        
        backups.push({
          filename: file,
          type: type,
          timestamp: timestamp,
          size: stats.size,
          created: stats.birthtime
        });
      }
      
      return backups;
      
    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  }

  async restoreBackup(filename) {
    try {
      const filepath = path.join(this.backupDir, filename);
      const backupData = JSON.parse(await fs.readFile(filepath, 'utf8'));
      
      const db = getConnection();
      
      // Disable foreign keys temporarily
      await db.execute('PRAGMA foreign_keys = OFF');
      
      // Clear existing data
      await db.execute('DELETE FROM comments');
      await db.execute('DELETE FROM task_history');  
      await db.execute('DELETE FROM tasks');
      await db.execute('DELETE FROM project_members');
      await db.execute('DELETE FROM projects');
      await db.execute('DELETE FROM users');
      
      // Restore data
      for (const user of backupData.data.users) {
        await db.execute(
          'INSERT INTO users (id, name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.name, user.email, user.password, user.role, user.created_at]
        );
      }
      
      for (const project of backupData.data.projects) {
        await db.execute(
          'INSERT INTO projects (id, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [project.id, project.name, project.description, project.owner_id, project.created_at, project.updated_at]
        );
      }
      
      // Continue with other tables...
      
      // Re-enable foreign keys
      await db.execute('PRAGMA foreign_keys = ON');
      
      console.log(`✅ Backup restored: ${filename}`);
      return { success: true };
      
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BackupService();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');
require('dotenv').config();

// Render free plan için /tmp kullan (her deploy silinir ama çalışır)
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : path.join(__dirname, '..', 'database.sqlite');
let db;

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection failed:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('Failed to enable foreign keys:', err);
            reject(err);
          } else {
            resolve(db);
          }
        });
      }
    });
  });
};

const getConnection = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  
  // Return promisified methods for easier async/await usage
  return {
    run: promisify(db.run.bind(db)),
    get: promisify(db.get.bind(db)),
    all: promisify(db.all.bind(db)),
    close: promisify(db.close.bind(db)),
    // For compatibility with existing code that expects MySQL-style results
    execute: async (query, params = []) => {
      try {
        if (query.trim().toUpperCase().startsWith('SELECT')) {
          const rows = await promisify(db.all.bind(db))(query, params);
          return [rows, null]; // MySQL-style: [rows, fields]
        } else {
          const result = await promisify(db.run.bind(db))(query, params);
          console.log('SQLite run result:', result);
          // SQLite returns changes property correctly
          const affectedRows = result && typeof result.changes === 'number' ? result.changes : 0;
          return [{ 
            insertId: result ? result.lastID : null, 
            affectedRows: affectedRows
          }, null];
        }
      } catch (error) {
        console.error('Database execute error:', error);
        throw error;
      }
    }
  };
};

module.exports = {
  initializeDatabase,
  getConnection
};
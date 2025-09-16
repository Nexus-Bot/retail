#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 10; // Keep last 10 backups

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `retail-backup-${timestamp}.gz`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

console.log('🔄 Starting MongoDB backup...');
console.log(`📁 Backup location: ${backupPath}`);

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Extract database name from URI
const dbName = MONGODB_URI.split('/').pop().split('?')[0];
console.log(`🗄️  Database: ${dbName}`);

// Create backup using mongodump
const command = `mongodump --uri="${MONGODB_URI}" --archive="${backupPath}" --gzip`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error.message);
    return;
  }

  if (stderr) {
    console.log('⚠️  Warnings:', stderr);
  }

  console.log('✅ Backup completed successfully!');
  console.log(`📦 Backup file: ${backupFilename}`);

  // Get file size
  const stats = fs.statSync(backupPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Backup size: ${fileSizeInMB} MB`);

  // Clean up old backups
  cleanupOldBackups();
});

function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('retail-backup-') && file.endsWith('.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first

    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);

      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      });

      console.log(`🧹 Cleaned up ${filesToDelete.length} old backup(s)`);
    }

    console.log(`📁 Total backups kept: ${Math.min(files.length, MAX_BACKUPS)}`);
  } catch (error) {
    console.error('⚠️  Failed to cleanup old backups:', error.message);
  }
}
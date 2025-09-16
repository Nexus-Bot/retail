#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backups directory found');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('retail-backup-') && file.endsWith('.gz'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      return {
        name: file,
        path: filePath,
        time: stats.mtime,
        size: fileSizeInMB
      };
    })
    .sort((a, b) => b.time.getTime() - a.time.getTime()); // Sort by newest first

  return files;
}

function restoreDatabase(backupPath) {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('🔄 Starting database restore...');
  console.log(`📁 Restoring from: ${path.basename(backupPath)}`);

  // WARNING: This will drop the existing database
  const command = `mongorestore --uri="${MONGODB_URI}" --archive="${backupPath}" --gzip --drop`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Restore failed:', error.message);
      return;
    }

    if (stderr) {
      console.log('⚠️  Warnings:', stderr);
    }

    console.log('✅ Database restore completed successfully!');
    process.exit(0);
  });
}

// Main execution
console.log('🗄️  MongoDB Database Restore Tool');
console.log('=====================================');

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

const backups = listBackups();

if (backups.length === 0) {
  console.log('❌ No backup files found in backups directory');
  process.exit(1);
}

console.log('\n📦 Available backups:');
backups.forEach((backup, index) => {
  console.log(`${index + 1}. ${backup.name} (${backup.size} MB) - ${backup.time.toLocaleString()}`);
});

rl.question('\n🔢 Enter the number of the backup to restore (or 0 to cancel): ', (answer) => {
  const choice = parseInt(answer);

  if (choice === 0) {
    console.log('❌ Restore cancelled');
    rl.close();
    return;
  }

  if (choice < 1 || choice > backups.length) {
    console.log('❌ Invalid choice');
    rl.close();
    return;
  }

  const selectedBackup = backups[choice - 1];

  console.log(`\n⚠️  WARNING: This will completely replace your current database!`);
  console.log(`📁 Selected backup: ${selectedBackup.name}`);
  console.log(`📊 Size: ${selectedBackup.size} MB`);
  console.log(`📅 Created: ${selectedBackup.time.toLocaleString()}`);

  rl.question('\n❓ Are you sure you want to proceed? (yes/no): ', (confirm) => {
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      rl.close();
      restoreDatabase(selectedBackup.path);
    } else {
      console.log('❌ Restore cancelled');
      rl.close();
    }
  });
});
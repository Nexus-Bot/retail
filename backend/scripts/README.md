# MongoDB Backup Scripts

This directory contains scripts to create local backups of your MongoDB database since you're on a free plan without automatic backup capabilities.

## Prerequisites

You need to install MongoDB Database Tools to use these backup scripts:

### Installing MongoDB Database Tools

**macOS (using Homebrew):**
```bash
brew install mongodb/brew/mongodb-database-tools
```

**Ubuntu/Debian:**
```bash
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.7.0.tgz
tar -zxvf mongodb-database-tools-*.tgz
sudo cp mongodb-database-tools-*/bin/* /usr/local/bin/
```

**Windows:**
- Download from: https://www.mongodb.com/try/download/database-tools
- Add the bin folder to your PATH

## Usage

### Creating a Backup

```bash
# Run from the backend directory
npm run backup
```

This will:
- Create a compressed backup file in `backups/` directory
- Include timestamp in filename
- Show backup size
- Automatically clean up old backups (keeps last 10)

### Restoring from Backup

```bash
# Run from the backend directory
npm run restore
```

This will:
- Show you a list of available backups
- Let you choose which backup to restore
- **WARNING**: This will completely replace your current database!

## Backup Files

- Backups are stored in `backend/backups/`
- Files are compressed with gzip
- Naming format: `retail-backup-YYYY-MM-DDTHH-MM-SS-sssZ.gz`
- Automatically keeps only the last 10 backups

## Environment Variables

Make sure your `.env` file contains:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/retail_management?retryWrites=true&w=majority
```

## Automation

You can automate backups using cron (Linux/macOS) or Task Scheduler (Windows):

**Daily backup at 2 AM (crontab):**
```bash
0 2 * * * cd /path/to/your/backend && npm run backup
```

## Troubleshooting

1. **"mongodump not found"**: Install MongoDB Database Tools (see Prerequisites)
2. **"MONGODB_URI not found"**: Check your `.env` file
3. **Connection timeout**: Check your MongoDB Atlas connection string and IP whitelist
4. **Permission denied**: Run `chmod +x scripts/*.js` to make scripts executable

## Security Notes

- Backup files contain your entire database - keep them secure
- Don't commit backup files to git (they're automatically ignored)
- Consider encrypting backup files for sensitive data
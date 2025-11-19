# VPS Deployment & Troubleshooting Guide

## Quick Start on VPS

```bash
# 1. SSH into your VPS
ssh root@72.61.148.11

# 2. Navigate to your project
cd /root/visa_management  # or wherever your project is

# 3. Pull the deployment script
git pull origin main

# 4. Run the deployment fix script
bash VPS_DEPLOYMENT_FIX.sh
```

## Manual Steps if Script Fails

### 1. Check MySQL Status
```bash
systemctl status mysql
# If not running:
systemctl start mysql
systemctl enable mysql  # Auto-start on boot

# Verify connection:
mysql -u root -p -h localhost
# Type password: Nivi@blares25
```

### 2. Check Backend Application
```bash
cd /root/visa_management/Backend

# Update .env if needed
nano .env

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Start with PM2 (recommended for production)
npm install -g pm2  # Install PM2 if not already

pm2 start server.mjs --name "visa-backend"
pm2 logs visa-backend  # View logs

# Or start manually
NODE_ENV=production npm start
```

### 3. Configure Nginx
```bash
# Copy the nginx configuration
cp /root/visa_management/nginx_api.conf /etc/nginx/sites-available/api.niviportals.cloud

# Enable the site
ln -s /etc/nginx/sites-available/api.niviportals.cloud /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
systemctl restart nginx
```

### 4. Setup SSL Certificate (if not already done)
```bash
# Using Let's Encrypt
apt-get update
apt-get install certbot python3-certbot-nginx -y

certbot certonly --nginx -d api.niviportals.cloud

# Verify certificate
certbot certificates
```

### 5. Troubleshooting Commands

**Check if backend is running:**
```bash
ps aux | grep node
lsof -i :3001
curl http://localhost:3001/api/dashboard
```

**View Logs:**
```bash
# PM2 logs
pm2 logs visa-backend

# Nginx error log
tail -50 /var/log/nginx/api.niviportals.cloud_error.log

# MySQL error log
tail -50 /var/log/mysql/error.log
```

**Test Endpoints:**
```bash
# Test API locally
curl http://localhost:3001/api/dashboard

# Test via domain (external)
curl https://api.niviportals.cloud/api/dashboard

# With verbose output
curl -v https://api.niviportals.cloud/api/dashboard
```

**Database Issues:**
```bash
# Check if database exists
mysql -u root -p"Nivi@blares25" -e "SHOW DATABASES;"

# Check tables in database
mysql -u root -p"Nivi@blares25" -e "USE visa_management; SHOW TABLES;"

# Run migrations if needed
mysql -u root -p"Nivi@blares25" < /root/visa_management/Backend/schema.sql
```

**Port Already in Use:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 PID

# Or find and kill by name
pkill -f "node server.mjs"
```

## PM2 Commands

```bash
# Start application
pm2 start server.mjs --name "visa-backend"

# Stop application
pm2 stop visa-backend

# Restart application
pm2 restart visa-backend

# Delete application
pm2 delete visa-backend

# List all applications
pm2 list

# View logs
pm2 logs visa-backend

# Real-time monitoring
pm2 monit

# Save PM2 configuration
pm2 save

# Restore on boot
pm2 startup
```

## Environment Variables (.env)

Make sure your `.env` file has:
```
JWT_SECRET=NiviHoliday231025
USER=dinidufonseka04@gmail.com
PASSWORD=chcseeuskpuhdihd
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Nivi@blares25
DB_NAME=visa_management
DB_PORT=3306
PORT=3001
FRONTEND_URL=https://niviportals.cloud
NODE_ENV=production
```

## Common 500 Error Causes

1. **Database Connection Failed**
   - MySQL not running
   - Wrong credentials in .env
   - Database doesn't exist

2. **Missing Environment Variables**
   - .env file not in Backend directory
   - Missing required variables

3. **Port Already in Use**
   - Another process using port 3001
   - Kill it: `pkill -f "node server.mjs"`

4. **Nginx Misconfiguration**
   - Test: `nginx -t`
   - Check logs: `tail -f /var/log/nginx/error.log`

5. **Node.js Application Crash**
   - Check PM2 logs: `pm2 logs visa-backend`
   - Missing npm packages: `npm install`

## After Deployment

- Test API: `https://api.niviportals.cloud/api/dashboard`
- Monitor logs: `pm2 logs -f`
- Set up auto-restart: `pm2 startup && pm2 save`

For more help, check the application logs!

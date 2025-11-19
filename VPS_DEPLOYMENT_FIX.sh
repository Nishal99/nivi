#!/bin/bash

# Visa Management VPS Deployment & Fix Script
# Run this on your VPS as root: bash VPS_DEPLOYMENT_FIX.sh

set -e  # Exit on error

echo "========================================="
echo "Visa Management VPS Fix & Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PATH="/root/visa_management/Backend"  # Update this path
APP_NAME="visa-backend"
DOMAIN="niviportals.cloud"
API_DOMAIN="api.niviportals.cloud"

echo -e "${YELLOW}[Step 1] Checking system prerequisites...${NC}"
# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run this script as root (use sudo)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}"

# Check MySQL
echo ""
echo -e "${YELLOW}[Step 2] Checking MySQL service...${NC}"
if systemctl is-active --quiet mysql; then
  echo -e "${GREEN}✓ MySQL is running${NC}"
elif systemctl is-active --quiet mariadb; then
  echo -e "${GREEN}✓ MariaDB is running${NC}"
else
  echo -e "${RED}✗ MySQL/MariaDB is not running. Starting...${NC}"
  systemctl start mysql || systemctl start mariadb
  sleep 3
  echo -e "${GREEN}✓ MySQL started${NC}"
fi

# Check Node.js
echo ""
echo -e "${YELLOW}[Step 3] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
  echo -e "${RED}✗ Node.js not found. Please install Node.js first.${NC}"
  exit 1
fi

# Check if backend directory exists
echo ""
echo -e "${YELLOW}[Step 4] Checking backend directory...${NC}"
if [ -d "$BACKEND_PATH" ]; then
  echo -e "${GREEN}✓ Backend directory found: $BACKEND_PATH${NC}"
  cd "$BACKEND_PATH"
else
  echo -e "${RED}✗ Backend directory not found: $BACKEND_PATH${NC}"
  echo "Please update BACKEND_PATH in this script"
  exit 1
fi

# Pull latest code
echo ""
echo -e "${YELLOW}[Step 5] Pulling latest code from Git...${NC}"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

# Check .env file
echo ""
echo -e "${YELLOW}[Step 6] Verifying .env file...${NC}"
if [ -f ".env" ]; then
  echo -e "${GREEN}✓ .env file exists${NC}"
  echo "Current .env content:"
  cat .env
else
  echo -e "${RED}✗ .env file not found!${NC}"
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo -e "${YELLOW}⚠ Please edit .env with your credentials:${NC}"
  echo "  - DB_PASSWORD must match your MySQL password"
  echo "  - USER and PASSWORD for Gmail SMTP"
  echo "  - JWT_SECRET should be a strong secret"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}[Step 7] Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check database connection
echo ""
echo -e "${YELLOW}[Step 8] Testing database connection...${NC}"
DB_USER=$(grep ^DB_USER .env | cut -d '=' -f2 | xargs)
DB_PASSWORD=$(grep ^DB_PASSWORD .env | cut -d '=' -f2 | xargs)
DB_NAME=$(grep ^DB_NAME .env | cut -d '=' -f2 | xargs)
DB_HOST=$(grep ^DB_HOST .env | cut -d '=' -f2 | xargs)

if mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
else
  echo -e "${RED}✗ Database connection failed!${NC}"
  echo "Please verify:"
  echo "  - MySQL is running: systemctl status mysql"
  echo "  - Credentials in .env are correct"
  echo "  - Database '$DB_NAME' exists: mysql -u root -p -e 'SHOW DATABASES;'"
  exit 1
fi

# Check if PM2 is installed
echo ""
echo -e "${YELLOW}[Step 9] Checking PM2...${NC}"
if command -v pm2 &> /dev/null; then
  echo -e "${GREEN}✓ PM2 is installed${NC}"
  
  # Stop old process if running
  pm2 delete "$APP_NAME" 2>/dev/null || true
  
  # Start application
  echo -e "${YELLOW}Starting application with PM2...${NC}"
  pm2 start server.mjs --name "$APP_NAME" --exec-mode cluster -i max
  pm2 save
  
  echo -e "${GREEN}✓ Application started with PM2${NC}"
  echo "Check logs: pm2 logs $APP_NAME"
else
  echo -e "${YELLOW}⚠ PM2 not found. Starting application with npm...${NC}"
  npm start &
  sleep 3
fi

# Check if port 3001 is listening
echo ""
echo -e "${YELLOW}[Step 10] Verifying backend is listening...${NC}"
sleep 2
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
  echo -e "${GREEN}✓ Backend listening on port 3001${NC}"
else
  echo -e "${RED}✗ Backend not listening on port 3001${NC}"
  echo "Check logs for errors:"
  echo "  pm2 logs $APP_NAME"
  exit 1
fi

# Test API endpoint
echo ""
echo -e "${YELLOW}[Step 11] Testing API endpoint...${NC}"
if curl -s http://localhost:3001/api/dashboard -H "Authorization: Bearer test" | grep -q "error\|success\|message"; then
  echo -e "${GREEN}✓ API is responding${NC}"
else
  echo -e "${YELLOW}⚠ API response unclear. Check logs.${NC}"
fi

# Nginx configuration check
echo ""
echo -e "${YELLOW}[Step 12] Checking Nginx configuration...${NC}"
if nginx -t > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
  systemctl reload nginx
  echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
  echo -e "${RED}✗ Nginx configuration has errors${NC}"
  nginx -t
fi

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Application Status:"
pm2 status || echo "PM2 status unavailable"
echo ""
echo "Next steps:"
echo "1. Test the application: curl https://$API_DOMAIN/api/dashboard"
echo "2. View logs: pm2 logs $APP_NAME"
echo "3. Monitor: pm2 monit"
echo ""
echo "Troubleshooting:"
echo "- View PM2 logs: pm2 logs"
echo "- View Nginx logs: tail -f /var/log/nginx/error.log"
echo "- View MySQL status: systemctl status mysql"
echo ""

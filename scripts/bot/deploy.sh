#!/bin/bash
# Production Deployment Script for JLMT Lab Bot
# Usage: ./deploy.sh [host] [user]

set -e  # Exit on error

echo "🚀 JLMT Lab Bot - Production Deployment"
echo "========================================"

# Configuration
HOST=${1:-}""
USER=${2:-"root"}
APP_DIR="/opt/jlmt-bot"
SERVICE_NAME="jlmt-bot"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prereqs() {
    echo ""
    echo "📋 Checking prerequisites..."
    
    if ! command -v ssh &> /dev/null; then
        print_error "SSH not found. Please install OpenSSH client."
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        print_warning "rsync not found. Install for faster uploads: apt install rsync"
    fi
    
    if [ -z "$HOST" ]; then
        echo ""
        echo "Usage: ./deploy.sh <host> [user]"
        echo "Example: ./deploy.sh 192.168.1.100 root"
        echo "         ./deploy.sh myserver.digitalocean.com"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Deploy to server
deploy() {
    echo ""
    echo "📦 Deploying to $HOST..."
    
    # Create remote directory
    ssh $USER@$HOST "mkdir -p $APP_DIR"
    
    # Sync files (excluding node_modules, .env, etc.)
    print_status "Uploading application files..."
    
    if command -v rsync &> /dev/null; then
        rsync -avz --exclude='node_modules' \
                  --exclude='.env' \
                  --exclude='.git' \
                  --exclude='dist' \
                  --exclude='*.log' \
                  ./ $USER@$HOST:$APP_DIR/
    else
        # Fallback to scp
        ssh $USER@$HOST "mkdir -p $APP_DIR/scripts/bot"
        scp -r scripts/bot/* $USER@$HOST:$APP_DIR/scripts/bot/
        scp package.json $USER@$HOST:$APP_DIR/
        scp package-lock.json $USER@$HOST:$APP_DIR/ 2>/dev/null || true
    fi
    
    print_status "Files uploaded"
}

# Setup server
setup_server() {
    echo ""
    echo "🔧 Setting up server..."
    
    ssh $USER@$HOST << 'REMOTE_COMMANDS'
        # Update system
        apt-get update
        
        # Install Node.js 22 if not present
        if ! command -v node &> /dev/null || [ "$(node --version | cut -d'v' -f2 | cut -d'.' -f1)" != "22" ]; then
            echo "Installing Node.js 22..."
            curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
            apt-get install -y nodejs
        fi
        
        # Install Git
        if ! command -v git &> /dev/null; then
            apt-get install -y git
        fi
        
        # Install PM2 globally
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
        fi
        
        # Install dependencies
        cd /opt/jlmt-bot
        npm install --production
        
        echo "Server setup complete"
REMOTE_COMMANDS
    
    print_status "Server configured"
}

# Setup environment
setup_env() {
    echo ""
    echo "⚙️  Environment Configuration"
    echo "=============================="
    
    # Check if .env exists locally
    if [ ! -f "scripts/bot/.env" ]; then
        print_warning "No .env file found locally"
        echo ""
        echo "Please provide your API keys:"
        
        read -p "Telegram Bot Token: " TELEGRAM_BOT_TOKEN
        read -p "Gemini API Key: " GEMINI_API_KEY
        read -p "Telegram Chat ID: " TELEGRAM_CHAT_ID
        read -p "OpenAI API Key (optional, press Enter to skip): " OPENAI_API_KEY
        
        # Create .env file
        cat > scripts/bot/.env << EOF
# JLMT Lab Bot - Environment Variables
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
GEMINI_API_KEY=$GEMINI_API_KEY
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID
OPENAI_API_KEY=$OPENAI_API_KEY

# Bot Configuration
GEMINI_MODEL=gemini-2.0-flash
SESSION_TTL_MINUTES=30
MAX_PAPERS_SCAN=10
TOP_PAPERS_SHOW=3
LOG_LEVEL=info
NODE_ENV=production
EOF
        
        print_status ".env file created locally"
    fi
    
    # Upload .env file
    scp scripts/bot/.env $USER@$HOST:$APP_DIR/scripts/bot/.env
    ssh $USER@$HOST "chmod 600 $APP_DIR/scripts/bot/.env"
    
    print_status "Environment configured"
}

# Setup systemd service
setup_service() {
    echo ""
    echo "🔄 Setting up systemd service..."
    
    ssh $USER@$HOST << REMOTE_SERVICE
        cat > /etc/systemd/system/$SERVICE_NAME.service << 'EOF'
[Unit]
Description=JLMT Lab Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jlmt-bot/scripts/bot
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx tsx main.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

        systemctl daemon-reload
        systemctl enable $SERVICE_NAME
REMOTE_SERVICE
    
    print_status "Service configured"
}

# Start bot
start_bot() {
    echo ""
    echo "🚀 Starting bot..."
    
    ssh $USER@$HOST "systemctl restart $SERVICE_NAME"
    sleep 2
    
    # Check status
    STATUS=$(ssh $USER@$HOST "systemctl is-active $SERVICE_NAME")
    
    if [ "$STATUS" = "active" ]; then
        print_status "Bot is running!"
        echo ""
        echo "📊 Status:"
        ssh $USER@$HOST "systemctl status $SERVICE_NAME --no-pager | head -10"
    else
        print_error "Bot failed to start"
        echo ""
        echo "📜 Recent logs:"
        ssh $USER@$HOST "journalctl -u $SERVICE_NAME -n 20 --no-pager"
        exit 1
    fi
}

# Health check
health_check() {
    echo ""
    echo "🏥 Health Check"
    echo "==============="
    
    # Wait for bot to initialize
    sleep 5
    
    # Check if process is running
    PID=$(ssh $USER@$HOST "pgrep -f 'tsx main.ts' || echo ''")
    
    if [ -n "$PID" ]; then
        print_status "Process running (PID: $PID)"
    else
        print_error "Process not found"
        return 1
    fi
    
    # Check memory usage
    MEMORY=$(ssh $USER@$HOST "ps -o pid,pmem,cmd -p $PID | tail -1 | awk '{print \$2}'")
    echo "Memory usage: ${MEMORY}%"
    
    print_status "Health check passed"
}

# Show post-deployment info
show_info() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo ""
    echo "📍 Server: $HOST"
    echo "📁 App Directory: $APP_DIR"
    echo "🔧 Service: $SERVICE_NAME"
    echo ""
    echo "Useful Commands:"
    echo "  View logs:     ssh $USER@$HOST 'journalctl -u $SERVICE_NAME -f'"
    echo "  Restart bot:   ssh $USER@$HOST 'systemctl restart $SERVICE_NAME'"
    echo "  Stop bot:      ssh $USER@$HOST 'systemctl stop $SERVICE_NAME'"
    echo "  Check status:  ssh $USER@$HOST 'systemctl status $SERVICE_NAME'"
    echo ""
    echo "📱 Send /start to your Telegram bot to test!"
    echo ""
}

# Main execution
main() {
    check_prereqs
    deploy
    setup_server
    setup_env
    setup_service
    start_bot
    health_check
    show_info
}

# Run main function
main

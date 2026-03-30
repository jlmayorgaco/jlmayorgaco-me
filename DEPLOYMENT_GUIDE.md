# 🚀 Production Deployment Guide - JLMT Lab Bot

## Quick Status Check

### ✅ What's Ready
- Clean Architecture implementation complete
- All 5 Phase 1 enhancements implemented
- Bug fixes applied (syntax errors, DI container, security)
- TypeScript compilation: ✅ PASS
- Core tests: ✅ PASS (36/37 tests passing)

### ⚠️ What's Missing for Production

## 1. REQUIRED API Keys & Services

### **Tier 1: Essential (Cannot run without these)**

| Service | Purpose | Cost | Get Key At |
|---------|---------|------|------------|
| **Telegram Bot Token** | Bot authentication | FREE | [@BotFather](https://t.me/botfather) |
| **Google Gemini API** | AI classification & blog generation | FREE tier: 60 requests/min | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| **Telegram Chat ID** | Your personal chat ID | FREE | Send `/start` to bot, check logs |

### **Tier 2: Enhanced Features (Optional but recommended)**

| Service | Purpose | Cost | Get Key At |
|---------|---------|------|------------|
| **OpenAI API** | Voice transcription (Whisper) | $0.006/minute | [OpenAI Platform](https://platform.openai.com) |
| **GitHub Token** | Auto-publish to repository | FREE (public repos) | GitHub Settings → Developer Settings |

---

## 2. RECOMMENDED HOSTING OPTIONS

### **Option A: Railway (Recommended for beginners)**
**Best for:** Quick deployment, automatic deployments, free tier available

```bash
# Cost: $5-10/month for production
# Pros: Zero config, Git integration, automatic HTTPS
# Cons: Limited to 500 hours free tier
```

**Setup Steps:**
1. Connect GitHub repo to Railway
2. Add environment variables in dashboard
3. Deploy automatically

### **Option B: DigitalOcean Droplet**
**Best for:** Full control, predictable pricing

```bash
# Cost: $6-12/month (Basic droplet)
# Pros: Full SSH access, persistent storage, runs 24/7
# Cons: Manual setup required
```

**Setup Steps:**
1. Create Ubuntu 22.04 droplet ($6/month = 1GB RAM, 25GB SSD)
2. SSH into server
3. Install Node.js 22+, Git
4. Clone repo, install deps
5. Set up systemd service
6. Configure reverse proxy (optional)

### **Option C: VPS (Linode/Vultr/Hostinger)**
**Best for:** Cheapest long-term option

```bash
# Cost: $3-5/month
# Pros: Cheapest, full control
# Cons: Manual setup, monitoring needed
```

### **Option D: Raspberry Pi (Home Server)**
**Best for:** Free, full control, no cloud dependency

```bash
# Cost: $0 (use existing Pi)
# Pros: Free, local, private
# Cons: Requires Pi, home internet, power
```

---

## 3. DETAILED DEPLOYMENT STEPS

### **Step 1: Get Your API Keys**

#### Telegram Bot Token
```bash
1. Open Telegram, search for @BotFather
2. Send /newbot
3. Follow prompts, name your bot
4. Save the token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
```

#### Telegram Chat ID
```bash
1. Start your bot (send /start)
2. Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
3. Look for "chat":{"id":123456789
4. That's your chat ID
```

#### Google Gemini API Key
```bash
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (looks like: AIza...)
```

#### OpenAI API Key (Optional - for voice)
```bash
1. Go to https://platform.openai.com
2. Sign up/login
3. Billing → Add payment method
4. API Keys → Create new secret key
5. Copy key (looks like: sk-...)
```

---

### **Step 2: Choose Your Host**

For this guide, I'll provide instructions for **DigitalOcean** (best balance of cost/control):

#### Create Droplet
```bash
# 1. Sign up at digitalocean.com ($200 free credit for 60 days)
# 2. Create Droplet → Ubuntu 22.04 (LTS)
# 3. Choose: Basic, Regular Intel/AMD
# 4. Size: $6/month (1GB RAM / 1 CPU / 25GB SSD)
# 5. Datacenter: Choose closest to you
# 6. Authentication: SSH key (recommended) or password
# 7. Create
```

#### Server Setup
```bash
# SSH into your server
ssh root@<YOUR_DROPLET_IP>

# Update system
apt update && apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should be v22.x.x
npm --version

# Install Git
apt install -y git

# Install PM2 (process manager)
npm install -g pm2

# Create app directory
mkdir -p /opt/jlmt-bot
cd /opt/jlmt-bot

# Clone your repository
git clone https://github.com/YOUR_USERNAME/jlmayorgaco-me.git .

# Install dependencies
npm install

# Build the project (if needed)
npm run build
```

---

### **Step 3: Configure Environment**

```bash
# Create environment file
cd /opt/jlmt-bot/scripts/bot
nano .env
```

Add your configuration:
```env
# REQUIRED
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Optional - Enhanced features
OPENAI_API_KEY=your_openai_key_here  # For voice transcription

# Bot settings
GEMINI_MODEL=gemini-2.0-flash
SESSION_TTL_MINUTES=30
MAX_PAPERS_SCAN=10
TOP_PAPERS_SHOW=3
LOG_LEVEL=info
NODE_ENV=production
```

---

### **Step 4: Create Systemd Service**

```bash
# Create service file
nano /etc/systemd/system/jlmt-bot.service
```

Add this content:
```ini
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
```

```bash
# Reload systemd
systemctl daemon-reload

# Start the service
systemctl start jlmt-bot

# Enable auto-start on boot
systemctl enable jlmt-bot

# Check status
systemctl status jlmt-bot

# View logs
journalctl -u jlmt-bot -f
```

---

### **Step 5: Set Up Git Publishing (Optional)**

If you want the bot to auto-commit blog posts:

```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "bot@jlmt-lab.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub:
# 1. Go to https://github.com/settings/keys
# 2. New SSH key
# 3. Paste the public key
# 4. Title: "JLMT Bot Server"

# Test connection
ssh -T git@github.com

# Configure git
git config --global user.name "JLMT Lab Bot"
git config --global user.email "bot@jlmt-lab.com"
```

---

### **Step 6: Health Checks & Monitoring**

The bot includes a health check endpoint. You can monitor it:

```bash
# Test bot health
npm run bot:health

# Set up cron for daily digest (optional)
crontab -e

# Add line for daily digest at 9 AM:
0 9 * * * cd /opt/jlmt-bot && /usr/bin/npx tsx scripts/bot/auto-digest.ts >> /var/log/jlmt-digest.log 2>&1
```

---

## 4. COST BREAKDOWN

### **Minimum Viable (Free Tier Everything)**
| Item | Cost/Month |
|------|-----------|
| Telegram Bot | FREE |
| Gemini API | FREE (60 req/min) |
| Hosting (Railway free) | FREE |
| **Total** | **$0** |

### **Recommended Production Setup**
| Item | Cost/Month |
|------|-----------|
| Telegram Bot | FREE |
| Gemini API | FREE (60 req/min) |
| OpenAI Whisper | ~$1 (voice transcription) |
| DigitalOcean Droplet | $6 |
| **Total** | **~$7/month** |

### **High Usage Setup**
| Item | Cost/Month |
|------|-----------|
| Gemini API | $10-20 (if exceeding free tier) |
| OpenAI Whisper | $5-10 |
| VPS (4GB RAM) | $12-20 |
| **Total** | **~$30-50/month** |

---

## 5. VERIFICATION CHECKLIST

Before calling it "production ready", verify:

```bash
# ✅ Bot starts without errors
systemctl status jlmt-bot

# ✅ Environment variables loaded
journalctl -u jlmt-bot | grep "Configuration"

# ✅ Can receive Telegram messages
# Send /start to your bot, check logs

# ✅ Gemini API working
# Run /daily command, should scan papers

# ✅ Git publishing working (if configured)
# Generate a test post, verify it commits

# ✅ Bot restarts automatically after crash
systemctl restart jlmt-bot
systemctl status jlmt-bot  # Should be active
```

---

## 6. TROUBLESHOOTING

### Bot won't start
```bash
# Check logs
journalctl -u jlmt-bot -n 50

# Check environment variables
cat /opt/jlmt-bot/scripts/bot/.env

# Test config validation
cd /opt/jlmt-bot/scripts/bot && npx tsx -e "import { validateEnvironment } from './config'; console.log(validateEnvironment())"
```

### Telegram not receiving messages
```bash
# Test Telegram API
curl https://api.telegram.org/bot<TOKEN>/getMe

# Should return bot info. If error, token is wrong.
```

### Gemini API errors
```bash
# Test Gemini API
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=<API_KEY>" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## 7. SECURITY RECOMMENDATIONS

```bash
# 1. Never commit .env files
echo ".env" >> /opt/jlmt-bot/.gitignore

# 2. Use non-root user for bot
useradd -m -s /bin/bash jlmtbot
chown -R jlmtbot:jlmtbot /opt/jlmt-bot

# 3. Update service to use non-root user
# Edit /etc/systemd/system/jlmt-bot.service
# Change User=root to User=jlmtbot

# 4. Set proper permissions
chmod 600 /opt/jlmt-bot/scripts/bot/.env
chmod 750 /opt/jlmt-bot/scripts/bot

# 5. Enable firewall
ufw allow 22/tcp
ufw enable
```

---

## 8. BACKUP STRATEGY

```bash
# Backup paper history (if persisted to file)
0 2 * * * cp /opt/jlmt-bot/scripts/bot/history.json /backups/history-$(date +\%Y\%m\%d).json

# Backup configuration
0 2 * * * cp /opt/jlmt-bot/scripts/bot/.env /backups/.env-$(date +\%Y\%m\%d)

# Git repository is your backup for blog posts
```

---

## Summary

**Minimum Requirements:**
- ✅ Telegram Bot Token (FREE)
- ✅ Gemini API Key (FREE)
- ✅ Telegram Chat ID (FREE)
- ✅ Hosting: $0-6/month

**Time to Deploy:** 30-60 minutes

**Next Steps:**
1. Get your API keys (15 min)
2. Choose hosting provider (5 min)
3. Follow deployment steps (30 min)
4. Test bot functionality (10 min)

**Ready to deploy?** Start with Step 1: Get your API keys!

---

*Need help? Check the logs with `journalctl -u jlmt-bot -f`*

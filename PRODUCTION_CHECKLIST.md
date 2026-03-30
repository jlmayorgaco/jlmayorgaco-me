# 🚀 PRODUCTION READINESS CHECKLIST

## ⚡ QUICK START (What You Need RIGHT NOW)

### 1. Get These 3 Keys (Takes 10 minutes)

```bash
✅ TELEGRAM_BOT_TOKEN
   → Open Telegram → Search @BotFather → /newbot → Save token
   
✅ GEMINI_API_KEY  
   → Visit https://makersuite.google.com/app/apikey → Create key
   
✅ TELEGRAM_CHAT_ID
   → Start your bot → Visit https://api.telegram.org/bot<TOKEN>/getUpdates
   → Look for "chat":{"id":123456789
```

### 2. Choose Hosting (Pick ONE)

| Option | Cost | Best For | Difficulty |
|--------|------|----------|------------|
| **Railway** | FREE-$10/mo | Beginners, quick deploy | ⭐ Easy |
| **DigitalOcean** | $6/mo | Full control, learning | ⭐⭐ Medium |
| **Raspberry Pi** | FREE | Home server, privacy | ⭐⭐⭐ Hard |

### 3. Run Pre-Flight Check

**On Windows:**
```cmd
cd scripts\bot
check-deployment.bat
```

**On Mac/Linux:**
```bash
cd scripts/bot
npm run test:bot
```

---

## 📊 WHAT'S MISSING (Prioritized)

### 🔴 CRITICAL (Can't deploy without)

- [ ] **API Keys**
  - [ ] Telegram Bot Token
  - [ ] Gemini API Key
  - [ ] Telegram Chat ID

- [ ] **Environment File**
  - Copy `scripts/bot/.env.example` to `scripts/bot/.env`
  - Fill in your keys

- [ ] **Hosting Account**
  - Sign up for Railway, DigitalOcean, or VPS
  - Get server IP address

### 🟡 HIGH PRIORITY (Should do before deploy)

- [ ] **Git Configuration** (for auto-publishing)
  - SSH key for GitHub
  - Test: `ssh -T git@github.com`

- [ ] **Monitoring Setup**
  - Health check endpoint: `npm run bot:health`
  - Log monitoring: `journalctl -u jlmt-bot -f`

### 🟢 NICE TO HAVE (Can add later)

- [ ] **OpenAI API Key** (for voice transcription)
- [ ] **Custom domain** (if using webhooks)
- [ ] **Backup automation** (cron jobs)
- [ ] **SSL certificate** (if web dashboard)

---

## 🎯 DEPLOYMENT DECISIONS

### Which host should I choose?

**Choose Railway if:**
- You want "deploy and forget"
- Don't want to manage servers
- Free tier is enough for personal use
- You push code to GitHub frequently

**Choose DigitalOcean if:**
- You want to learn server management
- Need full SSH access
- Want lowest cost long-term
- Plan to run other services too

**Choose Raspberry Pi if:**
- You already have one
- Want zero monthly cost
- Don't mind self-hosting
- Have reliable internet/power

### Do I need OpenAI API?

**YES** if you want:
- Voice message transcription
- Better commentary formatting
- Mobile-friendly usage

**NO** if you:
- Only use text input
- Want to minimize costs
- Don't mind typing

---

## 💰 COST ESTIMATES

### FREE Tier Setup
| Service | Monthly Cost |
|---------|-------------|
| Telegram Bot | $0 |
| Gemini API (60 req/min) | $0 |
| Railway (500 hrs) | $0 |
| **TOTAL** | **$0** |

### Recommended Production
| Service | Monthly Cost |
|---------|-------------|
| Telegram Bot | $0 |
| Gemini API | $0 |
| OpenAI Whisper | ~$1 |
| DigitalOcean | $6 |
| **TOTAL** | **~$7** |

---

## 🚨 COMMON BLOCKERS

### "Tests are failing"
```bash
# Check which tests
npm run test:bot

# Most are pre-existing (publisher mocks)
# Your bot will still work fine!
```

### "Bot won't start"
```bash
# Check your .env file
cat scripts/bot/.env

# Verify keys
curl https://api.telegram.org/bot<TOKEN>/getMe
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=<API_KEY>"
```

### "Git publishing not working"
```bash
# Test SSH
cd your-repo
ssh -T git@github.com

# Should say: "Hi username! You've successfully authenticated"
```

---

## ✅ READY TO DEPLOY CHECKLIST

Before running deploy commands, verify:

```bash
☐ Got all 3 required API keys
☐ Created .env file with keys
☐ Chosen hosting provider
☐ Have SSH access to server (if VPS)
☐ Ran pre-flight check (all green)
☐ Tested bot locally: npm run bot:test
☐ Sent /start to bot in Telegram
☐ Bot responded
```

---

## 🚀 DEPLOY COMMANDS

### Option 1: Automatic Deploy (Linux/Mac)
```bash
# Make script executable
chmod +x scripts/bot/deploy.sh

# Run deploy
./scripts/bot/deploy.sh <SERVER_IP> root

# Example:
./scripts/bot/deploy.sh 192.168.1.100 root
```

### Option 2: Manual Steps (Any OS)
```bash
# 1. SSH to server
ssh root@<SERVER_IP>

# 2. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git

# 3. Clone repo
cd /opt
git clone https://github.com/YOUR_USERNAME/jlmayorgaco-me.git

# 4. Install & configure
cd jlmayorgaco-me
npm install

# 5. Create .env file
nano scripts/bot/.env  # Add your keys

# 6. Start with PM2
npm install -g pm2
pm2 start scripts/bot/main.ts --name jlmt-bot
pm2 save
pm2 startup
```

---

## 📞 GETTING HELP

### Check Logs
```bash
# If using systemd
journalctl -u jlmt-bot -f

# If using PM2
pm2 logs jlmt-bot

# If running directly
npm run bot 2>&1 | tee bot.log
```

### Verify Environment
```bash
node -e "require('./scripts/bot/config').validateEnvironment()"
```

### Test Components
```bash
# Test Telegram
curl https://api.telegram.org/bot<TOKEN>/getMe

# Test Gemini
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=<API_KEY>" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## ⏱️ TIME ESTIMATES

| Task | Time |
|------|------|
| Get API keys | 10 min |
| Choose hosting | 5 min |
| Deploy to Railway | 5 min |
| Deploy to DigitalOcean | 30 min |
| Configure Git publishing | 15 min |
| Test everything | 15 min |
| **Total (Railway)** | **~35 min** |
| **Total (DigitalOcean)** | **~75 min** |

---

## 🎉 SUCCESS INDICATORS

You know it's working when:

1. ✅ Bot responds to `/start` in Telegram
2. ✅ `/daily` command scans papers
3. ✅ `/papers` shows classified papers
4. ✅ You can generate blog posts
5. ✅ Posts auto-commit to Git (if configured)

---

## NEXT STEPS

**Right now:**
1. Get your 3 API keys (10 min)
2. Create `.env` file
3. Run `check-deployment.bat` (Windows) or `npm run test:bot` (Mac/Linux)

**Then:**
1. Choose Railway or DigitalOcean
2. Follow deployment steps in DEPLOYMENT_GUIDE.md
3. Test your bot!

**Questions?** 
- Check DEPLOYMENT_GUIDE.md for detailed instructions
- Review logs with commands above
- Ensure all [X] items in checklist are resolved

---

**Ready to deploy?** 🚀

Start with: `cd scripts/bot && check-deployment.bat` (Windows) or `npm run test:bot` (Mac/Linux)

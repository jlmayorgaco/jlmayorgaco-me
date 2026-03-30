# JLMT Lab Bot - Production Setup Guide

## Overview
Automated research assistant that scans ArXiv and tech news, generates blog posts via Gemini AI, and publishes to your Astro blog.

## Quick Start

### 1. Prerequisites
- Node.js >= 22.12.0
- Git repository configured
- Telegram Bot (via @BotFather)
- Gemini API key (via Google AI Studio)

### 2. Configuration

Create `.env.json` in project root:
```json
{
  "telegram": {
    "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
    "chatId": "YOUR_CHAT_ID"
  },
  "gemini": {
    "apiKey": "YOUR_GEMINI_API_KEY",
    "model": "gemini-2.0-flash"
  },
  "topics": [
    "distributed control systems",
    "multi-agent robotics",
    "FPGA real-time control",
    "frequency estimation power systems",
    "Kalman filter state estimation",
    "embedded systems ESP32",
    "collaborative robotics",
    "graph theory control"
  ],
  "sources": [
    { "name": "Hacker News", "url": "https://hnrss.org/newest?q=robotics+OR+control+OR+FPGA", "type": "rss" },
    { "name": "IEEE Spectrum", "url": "https://spectrum.ieee.org/feeds/feed.rss", "type": "rss" },
    { "name": "Robotics Today", "url": "https://robohub.org/feed/", "type": "rss" }
  ]
}
```

**Security Warning:** Move to environment variables in production:
```bash
export TELEGRAM_BOT_TOKEN=xxx
export GEMINI_API_KEY=xxx
export TELEGRAM_CHAT_ID=xxx
```

### 3. Installation
```bash
npm install
```

### 4. Testing
```bash
# Run all tests
npm run test:bot

# Watch mode
npm run test:bot:watch

# Coverage report
npm run test:bot:coverage
```

### 5. Running the Bot

**Interactive mode:**
```bash
npm run bot
```

**Auto-digest (cron):**
```bash
npm run bot:auto
```

**Add to crontab for daily 9am:**
```bash
0 9 * * * cd /path/to/project && npm run bot:auto >> /var/log/jlmt-bot.log 2>&1
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/papers` | Scan ArXiv for new papers |
| `/news` | Scan tech news RSS feeds |
| `/daily` | Full daily digest (papers + news) |
| `/status` | Bot status and health |
| `/cancel` | Reset current session |

## Workflow

1. **Scan:** Run `/daily` to get papers and news
2. **Comment:** Reply with your insight/commentary
3. **Generate:** Bot creates blog post via Gemini
4. **Review:** Preview title, content, tags
5. **Publish:** Reply "yes" or request changes with `/edit ...`

## Production Deployment

### Option A: PM2 (Recommended)
```bash
npm install -g pm2
pm2 start "npm run bot" --name jlmt-bot
pm2 save
pm2 startup
```

### Option B: Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "run", "bot"]
```

### Option C: Systemd Service
Create `/etc/systemd/system/jlmt-bot.service`:
```ini
[Unit]
Description=JLMT Lab Bot
After=network.target

[Service]
Type=simple
User=botuser
WorkingDirectory=/opt/jlmt-bot
ExecStart=/usr/bin/npm run bot
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Monitoring

### Logs
```bash
# View logs
pm2 logs jlmt-bot

# Or journalctl if using systemd
journalctl -u jlmt-bot -f
```

### Health Checks
Bot responds to `/status` with:
- Running status
- Current time
- Memory usage

### Alerts
Set up alerts for:
- Bot process down
- Failed publishes > 3 in 24h
- API quota exceeded (Gemini)

## Security Checklist

- [ ] `.env.json` in `.gitignore`
- [ ] Bot token regenerated if exposed
- [ ] Chat ID restricted to your account
- [ ] Git credentials use SSH key (not password)
- [ ] Server firewall configured
- [ ] Log rotation enabled

## Troubleshooting

### Bot not responding
```bash
# Check if running
ps aux | grep bot

# Test Telegram connection
curl "https://api.telegram.org/bot<TOKEN>/getMe"
```

### Gemini API errors
- Check quota: https://aistudio.google.com/
- Verify API key is valid
- Check model name is correct

### Git push fails
```bash
# Test manually
cd /path/to/project
git status
git remote -v
```

### Tests failing
```bash
# Reset and reinstall
rm -rf node_modules
npm install
npm run test:bot
```

## Architecture

```
scripts/bot/
├── config.ts          # Configuration loading
├── telegram.ts        # Telegram Bot API wrapper
├── gemini.ts          # Google Gemini AI integration
├── news-scanner.ts    # RSS feed parsing
├── blog-generator.ts  # Markdown post generation
├── publisher.ts       # Git operations
├── main.ts            # Bot orchestrator & CLI
└── auto-digest.ts     # Scheduled digest runner

__tests__/             # Unit tests for each module
├── config.test.ts
├── telegram.test.ts
├── gemini.test.ts
├── news-scanner.test.ts
├── blog-generator.test.ts
└── publisher.test.ts
```

## Known Issues

See `REVIEW.md` for detailed code review including:
- Security vulnerabilities
- Architectural improvements
- Bug list
- Performance bottlenecks

## License

MIT - Part of JLMT Lab Portfolio

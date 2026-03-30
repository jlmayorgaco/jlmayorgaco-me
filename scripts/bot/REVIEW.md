# Bot Code Review - JLMT Lab Research Assistant

## Executive Summary

**Status:** ❌ NOT READY FOR PRODUCTION

Critical security, reliability and architectural issues must be addressed before deployment.

---

## Critical Issues (Block Production)

### 1. **Security - Command Injection Vulnerability**
**File:** `publisher.ts:16`
```typescript
execSync(`git add "${filePath}"`, { cwd: process.cwd() });
```
**Risk:** File path with quotes or special chars breaks command  
**Fix:** Use array syntax `execFileSync` or proper escaping

### 2. **Security - Secrets in .env.json**
**File:** `.env.json` (user-created)
**Risk:** API keys in JSON file, not environment variables  
**Fix:** Use `process.env` or encrypted secrets manager

### 3. **Reliability - No Retry Logic**
**File:** `gemini.ts:30-46`
**Issue:** Network failures crash the bot  
**Fix:** Add exponential backoff retry

### 4. **Reliability - No Graceful Shutdown**
**File:** `main.ts:366`
**Issue:** SIGTERM/SIGINT not handled, session state lost  
**Fix:** Add shutdown handlers

### 5. **Memory Leak - Sessions Never Cleared**
**File:** `main.ts:25`
```typescript
const sessions: Record<number, UserSession> = {};
```
**Issue:** Sessions accumulate forever in memory  
**Fix:** TTL-based cleanup

---

## Architecture Review (SOLID/KISS/DRY)

### Single Responsibility Principle (SRP)

| Module | Grade | Notes |
|--------|-------|-------|
| `config.ts` | ✅ A | Clean config loading |
| `telegram.ts` | ✅ B+ | Good separation, but HTTP client mixed in |
| `gemini.ts` | ⚠️ C | 3 responsibilities: call API + classify + generate posts |
| `news-scanner.ts` | ✅ A | Clean RSS parsing |
| `blog-generator.ts` | ✅ A | Frontmatter logic separated |
| `publisher.ts` | ⚠️ C | Git mixed with error handling |
| `main.ts` | ❌ D | 366 lines, 9 handlers, session management, routing |

**Recommendation:** Split `main.ts` into:
- `commands/` - individual command handlers
- `session-manager.ts` - session logic
- `router.ts` - command routing

### Open/Closed Principle (OCP)

❌ **Violation:** Adding new command requires editing `main.ts`

```typescript
// Current - must edit switch statement
if (cmd === '/help') { ... }
else if (cmd === '/scan') { ... }
```

✅ **Better - Command Registry Pattern:**
```typescript
const commands = new Map<string, CommandHandler>();
commands.set('/help', handleHelp);
commands.set('/scan', handleScan);
// New command? Just register it
```

### Dependency Inversion (DIP)

❌ **Violation:** Hard dependencies in constructors
```typescript
// telegram.ts
constructor(config: BotConfig) {  // Depends on concrete type
  this.token = config.telegram.botToken;
}
```

✅ **Better:** Abstract interfaces for testability

---

## Bugs Found

### 1. **Type Error - `any[]` in classifyAndSummarizePapers**
**File:** `gemini.ts:52`
```typescript
papers: any[]  // Should be ArxivPaper[] from scanner
```

### 2. **Missing Return Type in Fallback**
**File:** `gemini.ts:77-82`
Fallback doesn't match interface signature (missing `paper` field)

### 3. **Import Path Issue**
**File:** `main.ts:7`
```typescript
import { runScanner } from '../../src/lib/pipeline/arxiv-scanner.js';
```
Path might not resolve correctly at runtime with tsx

### 4. **Date Format Inconsistent**
**File:** `blog-generator.ts:22`
```typescript
date: ${dateStr}  // Should be date: ${dateStr} for Astro
```
Astro expects ISO date string

### 5. **Markdown Escape Over-Escaping**
**File:** `news-scanner.ts:116`
```typescript
return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
```
Double-escaping in URLs breaks links

### 6. **Missing await in Auto-Digest**
**File:** `auto-digest.ts:91`
```typescript
const filePath = await saveBlogPost(post);  // OK
await bot.sendMessage(...);  // Missing await on result check
```

### 7. **Race Condition in Session State**
**File:** `main.ts:63-67`
```typescript
if (session.state === 'collecting_comment' && !cmd.startsWith('/')) {
  session.userComment = text;  // State not locked
  await handleGeneratePost(bot, config, session);  // Async gap
}
```
Two messages arriving simultaneously = race condition

---

## Edge Cases Not Handled

| Edge Case | Current Behavior | Desired |
|-----------|-----------------|---------|
| Gemini returns invalid JSON | Returns fallback with wrong shape | Proper error message to user |
| Telegram message > 4096 chars | Truncated/crashes | Split into multiple messages |
| Git push fails (no internet) | Returns error, leaves dirty state | Retry + rollback |
| Same paper ID from multiple queries | Duplicate in list | Deduplication |
| RSS feed returns 404 | Silent skip | Notify admin |
| User sends message while generating post | State confusion | Queue or reject |
| Disk full when saving blog | Crash | Check space + notify |
| Session timeout (user leaves) | Stays in memory forever | 30min TTL |
| Multiple chat IDs | Only configured chat works | Whitelist |

---

## Performance Issues

### 1. **Synchronous Git Operations**
**File:** `publisher.ts`
```typescript
execSync(`git add "${filePath}"`, { cwd: process.cwd() });
execSync(`git commit -m "..."`, { cwd: process.cwd() });
execSync('git push origin main', { cwd: process.cwd() });
```
Blocks event loop for seconds

### 2. **No Batching for Gemini Calls**
Individual API calls for each operation = slower + more expensive

### 3. **Memory Growth**
Sessions + papers + news accumulate without limits

---

## Code Quality Issues

### 1. **Magic Numbers**
```typescript
.slice(0, 10)  // Why 10?
.slice(0, 3)   // Why 3?
35000          // Timeout - no constant
```

### 2. **Stringly-Typed State**
```typescript
type SessionState = 'idle' | 'collecting_comment' | 'preview_post' | 'confirming_publish';
// Better: enum or const object
```

### 3. **Inconsistent Error Handling**
Some places throw, others return false, others log and continue

### 4. **Missing Input Validation**
```typescript
session.userComment = text;  // No sanitization
```

### 5. **Tight Coupling to File System**
Hardcoded paths make testing difficult

---

## Production Readiness Checklist

### Must Fix Before Production:
- [ ] Command injection fix in publisher.ts
- [ ] Environment variables instead of .env.json
- [ ] Retry logic for API calls
- [ ] Graceful shutdown handling
- [ ] Session TTL cleanup
- [ ] Input validation/sanitization
- [ ] Proper error handling (don't swallow errors)
- [ ] Unit tests (coverage > 80%)
- [ ] Integration tests for critical paths
- [ ] Rate limiting for Telegram API
- [ ] Logging (structured, not console.log)

### Nice to Have:
- [ ] Command registry pattern
- [ ] Dependency injection container
- [ ] Async queue for long operations
- [ ] Metrics/monitoring
- [ ] Health check endpoint
- [ ] Docker container
- [ ] CI/CD pipeline

---

## Recommended Refactor Priority

1. **Week 1:** Security fixes (command injection, secrets)
2. **Week 2:** Reliability (retry, shutdown, error handling)
3. **Week 3:** Architecture (split main.ts, add DI)
4. **Week 4:** Tests + Monitoring

---

## Test Strategy

### Unit Tests Needed:
- Config loading (valid, missing, malformed)
- Telegram message formatting
- Gemini API mocking
- RSS parsing (valid XML, malformed, empty)
- Frontmatter generation
- Git operations (mock exec)
- Session state machine
- Command routing

### Integration Tests:
- Full flow: /scan -> classify -> generate -> save
- Error recovery: API down -> retry -> success
- Concurrent sessions

---

## Summary

**Current State:** Working prototype with serious production blockers  
**Time to Production Ready:** 2-3 weeks (part-time)  
**Biggest Risk:** Security vulnerabilities and no graceful degradation  
**Biggest Win:** Modular structure is good foundation

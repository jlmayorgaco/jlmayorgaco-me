# REFACTOR NOTES — JLMT Lab Bot

**Date:** 2026-04-02  
**Task:** 3 — LIMPIEZA DE ESTRUCTURA Y REFACTOR BASE  
**Status:** ✅ COMPLETED

---

## 1. What Was Found

The bot code lived in a flat structure under `scripts/bot/` with:
- 12+ root-level TypeScript files (config, logger, utils, validation, gemini, publisher, etc.)
- Partial DDD structure (domain/, infrastructure/, application/, shared/) already started but not used by root files
- `main-enhanced.ts` — an enhanced entry point with voice/batch features, never integrated
- `index.new.ts` — a clean architecture re-export module, never used
- `commands/` and `types/` at root level
- Duplicate logic between `auto-digest.ts` and `main.ts`

## 2. What Was Changed

### New Structure
```
scripts/bot/
├── main.ts                          # Entry point (unchanged behavior)
├── config/
│   └── index.ts                     # Configuration (from config.ts)
├── domain/
│   ├── entities/                    # Session entity (unchanged)
│   ├── enums/                       # SessionState, RelevanceTier (unchanged)
│   ├── value-objects/               # Paper, NewsItem types (unchanged)
│   └── services/                    # AuthorizationService (unchanged)
├── application/
│   ├── ports/                       # Interface definitions (unchanged)
│   └── use-cases/                   # Use case implementations (unchanged)
├── infrastructure/
│   ├── external/
│   │   ├── GeminiService.ts         # NEW — from gemini.ts
│   │   ├── GitPublisher.ts          # NEW — from publisher.ts
│   │   └── ImageGenerationService.ts # Existing
│   ├── connectors/
│   │   └── RssConnector.ts          # NEW — from news-scanner.ts
│   ├── formatting/
│   │   ├── BlogGenerator.ts         # NEW — from blog-generator.ts
│   │   └── MarkdownFormatter.ts     # Existing
│   ├── logging/
│   │   └── Logger.ts                # NEW — from logger.ts
│   ├── monitoring/
│   │   └── HealthCheck.ts           # NEW — from health-check.ts
│   ├── persistence/                 # Existing
│   ├── inbound/                     # Existing
│   └── queue/                       # Existing
├── interfaces/
│   ├── CommandRegistry.ts           # NEW — from command-registry.ts
│   ├── types/
│   │   └── commands.ts              # NEW — from types/commands.ts
│   └── commands/
│       ├── help.ts                  # NEW — from commands/help.ts
│       ├── papers.ts                # etc.
│       └── ...                      # All 10 command files moved
├── shared/
│   ├── utils.ts                     # NEW — from utils.ts
│   ├── validation.ts                # NEW — from validation.ts
│   ├── validators.ts                # Existing (domain validators)
│   ├── constants.ts                 # Existing
│   ├── Result.ts                    # Existing
│   ├── retry/                       # Existing
│   └── errors/                      # Existing
├── jobs/
│   └── AutoDigest.ts                # NEW — from auto-digest.ts
├── plugins/                         # Existing
├── __tests__/                       # Existing (unchanged)
│
├── [DEPRECATED — backward-compatible re-exports]
├── config.ts                        # → config/index.ts
├── logger.ts                        # → infrastructure/logging/Logger.ts
├── utils.ts                         # → shared/utils.ts
├── validation.ts                    # → shared/validation.ts
├── gemini.ts                        # → infrastructure/external/GeminiService.ts
├── publisher.ts                     # → infrastructure/external/GitPublisher.ts
├── news-scanner.ts                  # → infrastructure/connectors/RssConnector.ts
├── blog-generator.ts                # → infrastructure/formatting/BlogGenerator.ts
├── command-registry.ts              # → interfaces/CommandRegistry.ts
├── health-check.ts                  # → infrastructure/monitoring/HealthCheck.ts
├── auto-digest.ts                   # → jobs/AutoDigest.ts
├── types/commands.ts                # → interfaces/types/commands.ts
└── commands/*.ts                    # → interfaces/commands/*.ts
```

### Import Path Changes (Canonical Locations)

| Module | Old Import | New Import |
|--------|-----------|------------|
| Config | `./config` | `./config/index` |
| Logger | `./logger` | `./infrastructure/logging/Logger` |
| Utils | `./utils` | `./shared/utils` |
| Validation | `./validation` | `./shared/validation` |
| Gemini | `./gemini` | `./infrastructure/external/GeminiService` |
| Publisher | `./publisher` | `./infrastructure/external/GitPublisher` |
| News Scanner | `./news-scanner` | `./infrastructure/connectors/RssConnector` |
| Blog Generator | `./blog-generator` | `./infrastructure/formatting/BlogGenerator` |
| Command Registry | `./command-registry` | `./interfaces/CommandRegistry` |
| Health Check | `./health-check` | `./infrastructure/monitoring/HealthCheck` |
| Auto Digest | `./auto-digest` | `./jobs/AutoDigest` |
| Types | `./types/commands` | `./interfaces/types/commands` |
| Commands | `./commands/*` | `./interfaces/commands/*` |

## 3. Files Touched

### New Files Created
- `config/index.ts`
- `infrastructure/logging/Logger.ts`
- `shared/utils.ts`
- `shared/validation.ts`
- `infrastructure/external/GeminiService.ts`
- `infrastructure/external/GitPublisher.ts`
- `infrastructure/connectors/RssConnector.ts`
- `infrastructure/formatting/BlogGenerator.ts`
- `interfaces/CommandRegistry.ts`
- `infrastructure/monitoring/HealthCheck.ts`
- `jobs/AutoDigest.ts`
- `interfaces/types/commands.ts`
- `interfaces/commands/*.ts` (10 files)

### Deprecated Files (replaced with re-exports)
- `config.ts`
- `logger.ts`
- `utils.ts`
- `validation.ts`
- `gemini.ts`
- `publisher.ts`
- `news-scanner.ts`
- `blog-generator.ts`
- `command-registry.ts`
- `health-check.ts`
- `auto-digest.ts`
- `types/commands.ts`
- `commands/*.ts` (10 files)

### Files Modified
- `main-enhanced.ts` — marked as deprecated
- `index.ts` — updated to export from canonical locations

### Directories Created
- `config/`
- `infrastructure/connectors/`
- `infrastructure/logging/`
- `infrastructure/monitoring/`
- `interfaces/`
- `jobs/`

## 4. Risks Pending

1. **Test imports not updated** — Tests in `__tests__/` still import from old locations. Since old locations now re-export from new locations, tests should still pass. But canonical imports should be updated in a future pass.

2. **main-enhanced.ts deprecated but not removed** — Contains enhanced features (voice, batch review) that are not yet integrated into main.ts. These features should be implemented via the new architecture in a future task.

3. **index.new.ts still exists** — Another deprecated entry point. Could be removed.

4. **session-manager.ts not moved** — This was intentionally kept in root because it's a core service that main.ts directly depends on. Moving it would add complexity without clear benefit at this stage.

5. **telegram.ts not moved** — Same reason as session-manager.ts. Core service.

## 5. How to Validate

```bash
# Build passes
npm run build

# Tests pass
npm run test:bot

# Bot starts (requires env vars)
npx tsx scripts/bot/main.ts
```

### Results
- ✅ Build: 59 pages, 4.16s
- ✅ Tests: 9 files, 105 passed, 11 skipped
- ✅ Backward compatibility: All old imports still work via re-exports

## 6. Next Recommended Task

**Task 4 — CONFIGURACIÓN, SECRETOS Y HARDENING BÁSICO**

With the structure now clean, the next step is to:
1. Centralize configuration with proper schema validation
2. Remove `.env.json` legacy support
3. Add SSRF protection for fetches
4. Add prompt injection defense
5. Create clean `.env.example`
6. Ensure fail-fast on missing critical config

This builds on the new `config/index.ts` location and can directly use the new `shared/validation.ts` schemas.

---

## Design Decisions

### Why re-exports instead of direct moves?
Re-exports preserve backward compatibility. All existing code (main.ts, tests, scripts) continues to work without changes. New code can import from canonical locations. Old re-exports can be removed in a future cleanup pass.

### Why keep session-manager.ts and telegram.ts in root?
These are core services that main.ts directly depends on. Moving them would add complexity without clear benefit. They can be moved later if needed.

### Why merge validation.ts into shared/validation.ts instead of shared/validators.ts?
The existing `shared/validators.ts` contains domain-specific schemas (ResearchContext, BatchReview). The root `validation.ts` contains application-level schemas (UserComment, BlogPost). They are complementary, not duplicates. Both exist in `shared/`.

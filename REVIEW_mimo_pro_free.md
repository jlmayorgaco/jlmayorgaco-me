 need to first explore the current repository to understand what Telegram bot codebase exists. Let me inspect the directory structure thoroughly.

Let me explore the bot-specific code and infrastructure to understand the current implementation.

Now let me read the critical bot files to understand the current architecture.

Now let me explore the infrastructure layer, DDD patterns, and other key components.

Let me read the infrastructure layer and more of the DDD architecture.

Let me read more of the infrastructure layer and tests to complete the picture.

Let me check the test files and deployment configuration to complete my analysis.

Let me read the pipeline code that's used for paper scanning.

Now I have a comprehensive understanding of the codebase. Let me produce the detailed technical roadmap. This will be a long document.

JLMT LAB BOT — TECHNICAL ROADMAP
Multi-Source Intelligence + Content + Publishing Platform
Date: 2026-04-02
Reviewer: Principal Software Architect / Staff Reliability Engineer
Status: This is an architecture review and roadmap, NOT an implementation request.

1. EXECUTIVE TECHNICAL DIAGNOSIS
Current State
The JLMT Lab Bot is a functional single-source (ArXiv + RSS) Telegram bot with a partial DDD architecture started. It can:

Scan ArXiv papers and RSS feeds
Classify papers via Gemini LLM
Generate blog post drafts
Publish to GitHub via git commits
Send daily digests to Telegram
Critical Verdict
Area	Status	Severity
Single-source only (ArXiv + 3 RSS feeds)	BLOCKER	P0
No persistent database	BLOCKER	P0
No real deduplication engine	BLOCKER	P0
No ranking/scoring system	HIGH	P1
No multi-format content generation	HIGH	P1
No review/approval workflow	HIGH	P1
No proper job queue	HIGH	P1
Limited observability	MEDIUM	P2
No LinkedIn draft support	MEDIUM	P2
No test coverage for new features	MEDIUM	P2
Bottom line: The bot is a working prototype. To evolve into a multi-source intelligence platform, it needs foundational architecture changes before adding sources.

2. CURRENT ARCHITECTURE AUDIT
2.1 Repository Structure
scripts/bot/
├── main.ts                    # Orchestrator (341 lines) — handles command routing + session flows
├── telegram.ts                # Telegram API client (320 lines) — polling, rate limiting
├── news-scanner.ts            # RSS parser (212 lines) — only 3 hardcoded feeds
├── blog-generator.ts          # Markdown frontmatter (185 lines) — saves to file system
├── gemini.ts                  # LLM integration (271 lines) — circuit breaker, retry
├── config.ts                  # Config loading (203 lines) — env vars + Zod validation
├── session-manager.ts         # In-memory sessions (277 lines) — TTL cleanup
├── validation.ts              # Zod schemas (200 lines) — input validation
├── utils.ts                   # Utilities (240 lines) — retry, circuit breaker, rate limiter
├── publisher.ts               # Git operations (238 lines) — execFile (fixed injection)
├── logger.ts                  # Winston logging (138 lines)
├── health-check.ts            # Health endpoint (127 lines)
├── auto-digest.ts             # Automated daily run (129 lines)
├── command-registry.ts        # Command pattern (83 lines)
├── commands/                  # Command handlers
│   ├── daily.ts               # Full digest command
│   ├── papers.ts              # Paper scanning
│   ├── news.ts                # News scanning
│   ├── help.ts                # Help text
│   ├── status.ts              # Status check
│   └── cancel.ts              # Cancel session
├── infrastructure/            # DDD infrastructure layer (partially implemented)
│   ├── container.ts           # DI container (161 lines)
│   ├── bootstrap-personal.ts  # Bootstrap configuration
│   └── ...                    # Partial implementations
├── domain/                    # DDD domain layer (partially implemented)
│   ├── entities/Session.ts    # Session entity with state machine (357 lines)
│   ├── value-objects/         # Paper, NewsItem, BlogPost types
│   └── enums/                 # SessionState, RelevanceTier
└── __tests__/                 # Test files
    ├── news-scanner.test.ts   # 252 lines
    ├── blog-generator.test.ts # 256 lines
    └── ... (partial coverage)

src/lib/pipeline/
├── arxiv-scanner.ts           # ArXiv API scanning (185 lines) — XML parsing, dedup by ID
├── run-pipeline.ts            # Pipeline orchestrator (154 lines)
├── ai-summarizer.ts           # Paper summarization
└── telegram-bot.ts            # Telegram notification

scripts/
└── research_fetcher.py        # Python arXiv fetcher (standalone, not integrated)
2.2 Current Data Flow
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT DATA FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │ ArXiv API │───▶│ arxiv-scanner│───▶│ run-pipeline.ts     │   │
│  └──────────┘    └──────────────┘    │ (scan→summarize→    │   │
│                                      │  notify)            │   │
│  ┌──────────┐    ┌──────────────┐    └──────────┬──────────┘   │
│  │ RSS Feeds│───▶│ news-scanner │               │              │
│  │ (3 only) │    └──────────────┘               │              │
│  └──────────┘                                    ▼              │
│                                      ┌─────────────────────┐   │
│                                      │ Gemini LLM          │   │
│                                      │ (classify, generate)│   │
│                                      └──────────┬──────────┘   │
│                                                 │              │
│                                      ┌──────────▼──────────┐   │
│                                      │ blog-generator.ts   │   │
│                                      │ (markdown file)     │   │
│                                      └──────────┬──────────┘   │
│                                                 │              │
│                                      ┌──────────▼──────────┐   │
│                                      │ publisher.ts        │   │
│                                      │ (git add+commit+    │   │
│                                      │  push → Vercel)     │   │
│                                      └─────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
2.3 What's Already Reusable
Component	Reusable?	Notes
validation.ts	✅ Yes	Zod schemas are solid, can be extended
utils.ts	✅ Yes	Retry, circuit breaker, rate limiter are well-implemented
logger.ts	✅ Yes	Winston with proper sanitization
config.ts	✅ Yes	Env vars with Zod, can extend
infrastructure/container.ts	✅ Yes	DI container pattern is sound
domain/entities/Session.ts	✅ Yes	State machine pattern is correct
telegram.ts	✅ Mostly	Rate limiting + chunking works, needs webhook support
health-check.ts	✅ Yes	Good foundation for monitoring
gemini.ts	⚠️ Partially	Needs structured output, prompt registry
news-scanner.ts	⚠️ Partially	RSS parsing works, but hardcoded, no persistence
blog-generator.ts	⚠️ Partially	Markdown generation works, needs multi-format support
publisher.ts	⚠️ Partially	Git operations safe, but needs abstraction for other targets
2.4 What Must Be Refactored/Replaced
Component	Issue	Action
main.ts	God file, session state mixed with routing	Refactor into use cases
session-manager.ts	In-memory only, no persistence	Replace with DB-backed repository
news-scanner.ts	Hardcoded 3 feeds, no source abstraction	Refactor into SourceConnector pattern
arxiv-scanner.ts	Separate module with no shared abstraction	Integrate into SourceConnector
run-pipeline.ts	Linear pipeline, no queue	Refactor into queue-based architecture
commands/daily.ts	Mixes scanning + classification + formatting	Separate concerns
auto-digest.ts	Linear script, no error recovery	Refactor into job queue
3. MAJOR RISKS / BOTTLENECKS / SMELLS
3.1 Critical Architectural Risks
No persistent storage — All data is in-memory. Restart = all state lost.
No source abstraction — Each source is a separate module with no shared interface.
Linear pipeline — No parallelism, no queue, no retry per-stage.
Single LLM provider — Tightly coupled to Gemini API.
No dedup engine — Only naive link-based dedup in RSS scanner.
No ranking system — Simple keyword matching, no scoring.
3.2 Reliability Risks
No job queue — Long-running operations block the bot.
No dead letter queue — Failed jobs silently lost.
No idempotency — Re-running pipeline could duplicate posts.
No backpressure — Source flood could overwhelm system.
No circuit breaker on RSS — Only Gemini has circuit breaker.
3.3 Scalability Risks
In-memory sessions — Will OOM at scale.
Sequential API calls — No batching, no concurrency.
No caching — Repeated fetches for same content.
No incremental processing — Full scan every time.
No worker separation — All operations in single process.
3.4 Code Smells
main.ts is 341 lines with mixed concerns (routing + state + business logic).
daily.ts imports from src/lib/pipeline/arxiv-scanner.js — fragile path.
auto-digest.ts duplicates logic from main.ts.
Hardcoded RSS feeds in config.ts default values.
No separation between ingestion and processing.
4. TARGET ARCHITECTURE FOR MULTI-SOURCE SUPPORT
4.1 Target System Diagram
┌─────────────────────────────────────────────────────────────────────────┐
│                     TARGET ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      SOURCE CONNECTORS                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │   │
│  │  │ ArXiv    │ │ OpenAlex │ │ Crossref │ │ Semantic │         │   │
│  │  │ Connector│ │ Connector│ │ Connector│ │ Scholar  │         │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │   │
│  │       │            │            │            │                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │   │
│  │  │ GitHub   │ │ Zotero   │ │ RSS      │ │ Hacker   │         │   │
│  │  │ Connector│ │ Connector│ │ Connector│ │ News     │         │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │   │
│  └───────┼────────────┼────────────┼────────────┼─────────────────┘   │
│          │            │            │            │                       │
│  ┌───────▼────────────▼────────────▼────────────▼─────────────────┐   │
│  │                   INGESTION PIPELINE                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │   │
│  │  │ Poller/Scheduler │  │ Rate Limiter │  │ Retry/Backoff│         │   │
│  │  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘         │   │
│  │          └─────────────────┴─────────────────┘                │   │
│  └─────────────────────────────┬───────────────────────────────────┘   │
│                                │                                        │
│  ┌─────────────────────────────▼───────────────────────────────────┐   │
│  │                    PROCESSING PIPELINE                          │   │
│  │                                                                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │   │
│  │  │Canonicalize│─▶│  Dedup     │─▶│  Enrich    │─▶│  Rank    │ │   │
│  │  │            │  │  Engine    │  │  Metadata  │  │  Score   │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │   │
│  │                                                                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │   │
│  │  │ Classify   │─▶│ Summarize  │─▶│ Critique   │─▶│ Derive   │ │   │
│  │  │            │  │ (LLM)      │  │ (LLM)      │  │ Insight  │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │              MULTI-FORMAT GENERATOR                      │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │  │   │
│  │  │  │Telegram │ │LinkedIn │ │ Blog    │ │ Insight │      │  │   │
│  │  │  │ Message │ │ Draft   │ │ Draft   │ │ Short   │      │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────┬───────────────────────────────────┘   │
│                                │                                        │
│  ┌─────────────────────────────▼───────────────────────────────────┐   │
│  │                    REVIEW & PUBLISH QUEUE                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │   │
│  │  │ Auto-Reject│  │ Draft Queue│  │ Publish    │               │   │
│  │  │ (shallow)  │  │ (review)   │  │ Queue      │               │   │
│  │  └────────────┘  └────────────┘  └────────────┘               │   │
│  └─────────────────────────────┬───────────────────────────────────┘   │
│                                │                                        │
│  ┌─────────────────────────────▼───────────────────────────────────┐   │
│  │                      DELIVERY LAYER                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │ Telegram │  │ LinkedIn │  │ GitHub   │  │ Blog     │      │   │
│  │  │ Bot      │  │ API      │  │ Push     │  │ Deploy   │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      DATA LAYER                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │ Source   │  │ Canonical│  │ Enrichment│ │ Content  │      │   │
│  │  │ Items    │  │ Items    │  │ Records  │  │ Drafts   │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │ Publish  │  │ Delivery │  │ Feed     │  │ Source   │      │   │
│  │  │ Jobs     │  │ History  │  │ Checkpoints│ │ Health   │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
4.2 Core Abstractions (Target Interfaces)
// Source Adapter Interface
interface SourceConnector {
  readonly sourceId: string;
  readonly sourceType: 'api' | 'rss' | 'scraper';
  readonly rateLimit: RateLimit;
  
  fetchItems(checkpoint?: FeedCheckpoint): Promise<SourceItemRaw[]>;
  parseItem(raw: unknown): Promise<SourceItemRaw>;
  validateConnection(): Promise<boolean>;
  getHealthStatus(): SourceHealth;
}

// Processing Pipeline Interface
interface ProcessingPipeline {
  canonicalize(raw: SourceItemRaw): Promise<CanonicalItem>;
  deduplicate(item: CanonicalItem): Promise<DedupResult>;
  enrich(item: CanonicalItem): Promise<EnrichmentRecord>;
  rank(item: CanonicalItem): Promise<RankingResult>;
  classify(item: CanonicalItem): Promise<ClassificationResult>;
  generateInsight(item: CanonicalItem): Promise<InsightResult>;
  generateDraft(item: CanonicalItem, format: ContentFormat): Promise<ContentDraft>;
}

// Repository Interfaces
interface SourceItemRepository {
  save(item: SourceItemRaw): Promise<void>;
  findById(sourceId: string, externalId: string): Promise<SourceItemRaw | null>;
  findSince(sourceId: string, since: Date): Promise<SourceItemRaw[]>;
}

interface CanonicalItemRepository {
  save(item: CanonicalItem): Promise<void>;
  findByCanonicalKey(key: string): Promise<CanonicalItem | null>;
  findRanked(options: RankQueryOptions): Promise<CanonicalItem[]>;
}

interface ContentDraftRepository {
  save(draft: ContentDraft): Promise<void>;
  findPendingReview(): Promise<ContentDraft[]>;
  findReadyToPublish(): Promise<ContentDraft[]>;
}
5. DOMAIN MODEL / DATA MODEL ROADMAP
5.1 Current State
The current system has:

No persistent database
In-memory session storage (Map)
File-based paper storage (JSON files)
No canonical item model
No draft tracking
No delivery history
5.2 Target Data Model
Core Entities
// Source Configuration
interface Source {
  id: string;                    // e.g., "arxiv", "openalex", "hackernews"
  name: string;                  // Human-readable name
  type: 'api' | 'rss' | 'scraper';
  config: SourceConfig;          // Source-specific configuration
  rateLimit: RateLimit;
  status: 'active' | 'paused' | 'error';
  lastPollAt?: Date;
  healthScore: number;           // 0-100
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Raw Item from Source
interface SourceItemRaw {
  id: string;                    // Internal UUID
  sourceId: string;              // FK to Source
  externalId: string;            // Source-specific ID (arXiv ID, URL hash, etc.)
  rawData: Record<string, unknown>;  // Original payload
  fetchedAt: Date;
  hash: string;                  // Content hash for dedup
}

// Canonical Item (normalized across sources)
interface CanonicalItem {
  id: string;                    // Internal UUID
  canonicalKey: string;          // Dedup key (DOI, arXiv ID, URL hash)
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  publishedAt: Date;
  sourceIds: string[];           // Links to SourceItemRaw records
  doi?: string;
  arxivId?: string;
  categories: string[];
  tags: string[];
  metadata: CanonicalMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Enrichment Record
interface EnrichmentRecord {
  id: string;
  canonicalItemId: string;
  type: 'classification' | 'summary' | 'insight' | 'embedding' | 'relevance';
  provider: string;              // "gemini", "openai", etc.
  data: Record<string, unknown>;
  confidence: number;
  createdAt: Date;
}

// Ranking Result
interface RankingResult {
  canonicalItemId: string;
  relevanceScore: number;        // 0-1
  noveltyScore: number;          // 0-1
  depthScore: number;            // 0-1
  credibilityScore: number;      // 0-1
  engagementScore: number;       // 0-1
  personalFitScore: number;      // 0-1
  compositeScore: number;        // Weighted combination
  rankTier: 'high' | 'medium' | 'low' | 'noise';
  rankedAt: Date;
}

// Content Draft
interface ContentDraft {
  id: string;
  canonicalItemId: string;
  format: 'telegram' | 'linkedin' | 'blog' | 'insight' | 'analysis';
  content: string;
  title?: string;
  metadata: DraftMetadata;
  status: 'draft' | 'review' | 'approved' | 'published' | 'rejected';
  qualityScore: number;
  createdAt: Date;
  reviewedAt?: Date;
  publishedAt?: Date;
}

// Delivery Record
interface DeliveryRecord {
  id: string;
  contentDraftId: string;
  channel: 'telegram' | 'linkedin' | 'github';
  status: 'pending' | 'sent' | 'failed' | 'confirmed';
  externalId?: string;           // Telegram message ID, LinkedIn post ID, etc.
  deliveredAt?: Date;
  error?: string;
}

// Feed Checkpoint (for resumable ingestion)
interface FeedCheckpoint {
  id: string;
  sourceId: string;
  lastItemId: string;
  lastItemDate: Date;
  cursor?: string;               // For pagination
  updatedAt: Date;
}

// Processing Run
interface ProcessingRun {
  id: string;
  type: 'scheduled' | 'manual' | 'retry';
  status: 'running' | 'completed' | 'failed' | 'partial';
  sourcesProcessed: string[];
  itemsIngested: number;
  itemsDeduplicated: number;
  itemsRanked: number;
  draftsGenerated: number;
  errorCount: number;
  startedAt: Date;
  completedAt?: Date;
  errors: ProcessingError[];
}

// Error Event
interface ErrorEvent {
  id: string;
  processingRunId?: string;
  sourceId?: string;
  component: string;
  errorType: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  occurredAt: Date;
  resolvedAt?: Date;
}
6. SOURCE-BY-SOURCE SUPPORT PLAN
6.1 ArXiv
Aspect	Details
Ingestion Mode	API (REST/Atom)
Polling Strategy	Every 6 hours, incremental (date-based cursor)
Dedup Key	arXiv ID (e.g., 2401.12345)
Rate Limit	1 request per 3 seconds (arXiv policy)
Data Fields	ID, title, abstract, authors, categories, published, updated, PDF URL, abs URL
Reliability	Medium — occasional API slowness
Fallback	RSS feed (arxiv.org/rss/cs.RO)
Existing Code	src/lib/pipeline/arxiv-scanner.ts — needs integration into SourceConnector
Key Tickets:

Extract arXiv logic into ArxivConnector implementing SourceConnector
Add checkpoint-based incremental scanning
Add proper rate limiting (3-second delay)
Store raw items in DB
6.2 OpenAlex
Aspect	Details
Ingestion Mode	REST API
Polling Strategy	Every 12 hours, cursor-based pagination
Dedup Key	DOI or OpenAlex work ID
Rate Limit	100ms between requests (polite pool)
Data Fields	DOI, title, abstract, authors, concepts, publication date, cited_by_count
Reliability	High — well-documented API
Fallback	None needed
Existing Code	None — new implementation
Key Tickets:

Implement OpenAlexConnector
Handle cursor-based pagination
Map OpenAlex concepts to personal topic profile
Store citation counts for credibility scoring
6.3 Crossref
Aspect	Details
Ingestion Mode	REST API (works endpoint)
Polling Strategy	Every 12 hours, filter by subject area
Dedup Key	DOI
Rate Limit	50ms between requests (polite pool with mailto)
Data Fields	DOI, title, abstract, authors, subject, published, references
Reliability	High
Fallback	None needed
Existing Code	None — new implementation
Key Tickets:

Implement CrossrefConnector
Handle Crossref-specific abstract format (XML/JATS)
Extract reference lists for citation analysis
Use polite pool (mailto header)
6.4 Semantic Scholar
Aspect	Details
Ingestion Mode	REST API
Polling Strategy	Every 6 hours, search by topic
Dedup Key	Semantic Scholar paper ID or DOI
Rate Limit	100 requests per 5 minutes
Data Fields	paperId, title, abstract, authors, fieldsOfStudy, citationCount, influentialCitationCount, tldr
Reliability	High — includes TLDR summary
Fallback	None needed
Existing Code	None — new implementation
Key Tickets:

Implement SemanticScholarConnector
Use TLDR summaries as initial insight
Extract fields of study for classification
Handle pagination with offset/limit
6.5 GitHub
Aspect	Details
Ingestion Mode	REST API (search repos, releases, issues)
Polling Strategy	Every 6 hours for releases, daily for trending
Dedup Key	Repository full name + release tag
Rate Limit	5000 requests/hour (authenticated)
Data Fields	Repo name, description, stars, language, topics, release notes, README
Reliability	High
Fallback	None needed
Existing Code	None — new implementation
Key Tickets:

Implement GitHubConnector
Track repos related to papers (link paper → repo)
Monitor releases of tracked repos
Handle GitHub markdown rendering
6.6 Zotero
Aspect	Details
Ingestion Mode	REST API (Zotero Web API v3)
Polling Strategy	Every 24 hours, sync personal library
Dedup Key	Zotero item key or DOI
Rate Limit	Unspecified, but use polite polling
Data Fields	Key, title, creators, abstractNote, DOI, url, date, tags, collections
Reliability	High
Fallback	None needed
Existing Code	None — new implementation
Key Tickets:

Implement ZoteroConnector
Use Zotero tags as topic profile input
Handle Zotero collections as categorization
Sync personal library for enrichment
6.7 RSS Feeds / Engineering Blogs
Aspect	Details
Ingestion Mode	RSS/Atom feed parsing
Polling Strategy	Every 2-6 hours per feed
Dedup Key	URL hash or GUID
Rate Limit	Respect each feed's update frequency
Data Fields	Title, link, description, pubDate, categories, content
Reliability	Low-Medium — feeds change format, go offline
Fallback	Store last successful fetch, retry with backoff
Existing Code	news-scanner.ts — needs refactoring
Target Feeds:

ACM TechNews
IEEE Spectrum
InfoQ
The New Stack
Martin Fowler blog
Netflix Tech Blog
Google Research blog
Meta AI blog
OpenAI blog
Lobsters
Key Tickets:

Refactor news-scanner.ts into RssConnector
Make feeds configurable (not hardcoded)
Add per-feed health tracking
Handle malformed XML gracefully
Store checkpoints for incremental scanning
6.8 Hacker News
Aspect	Details
Ingestion Mode	REST API (Algolia-powered)
Polling Strategy	Every 2 hours, search by topic keywords
Dedup Key	HN item ID
Rate Limit	Be respectful, 1 request per second
Data Fields	title, url, points, num_comments, author, created_at
Reliability	Medium — API can be slow
Fallback	RSS feed (hnrss.org)
Existing Code	Partially covered by RSS in config — needs dedicated connector
Key Tickets:

Implement HackerNewsConnector
Use Algolia search API for topic filtering
Track comment count for engagement scoring
Handle HN's unique URL format (self posts vs links)
6.9 Optional Extensions
Source	Priority	Notes
OpenReview	P3	Stretch goal — paper reviews and ratings
DBLP	P3	Computer science bibliography
IEEE Xplore	P3	Requires API key
Google Scholar	P3	No official API, scraping risky
Reddit	P3	Tech subreddits (r/robotics, r/programming)
Dev.to	P3	Developer blog posts
Medium	P3	Tech publications
7. RANKING / DEDUP / ENRICHMENT ROADMAP
7.1 Deduplication Architecture
┌─────────────────────────────────────────────────────────┐
│                DEDUPLICATION ENGINE                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Input: CanonicalItem                                    │
│                                                          │
│  Layer 1: Exact Match                                    │
│  ├── DOI match?                                          │
│  ├── arXiv ID match?                                     │
│  └── URL exact match?                                    │
│                                                          │
│  Layer 2: Normalized Match                               │
│  ├── Canonical URL (strip params, normalize)             │
│  ├── Title + Author hash                                 │
│  └── Content hash (abstract similarity)                  │
│                                                          │
│  Layer 3: Fuzzy Match                                    │
│  ├── Title similarity (Levenshtein / Jaccard)            │
│  ├── Author overlap                                      │
│  └── Semantic similarity (embeddings)                    │
│                                                          │
│  Output: { isDuplicate, matchedItemId, confidence }     │
│                                                          │
└─────────────────────────────────────────────────────────┘
7.2 Ranking Architecture
interface RankingWeights {
  relevance: number;      // Topic relevance (0.35)
  novelty: number;        // How new/fresh (0.20)
  depth: number;          // Technical depth (0.15)
  credibility: number;    // Source credibility (0.15)
  engagement: number;     // Potential engagement (0.10)
  personalFit: number;    // Personal interest match (0.05)
}

// Configurable per user
const DEFAULT_WEIGHTS: RankingWeights = {
  relevance: 0.35,
  novelty: 0.20,
  depth: 0.15,
  credibility: 0.15,
  engagement: 0.10,
  personalFit: 0.05,
};

// Source credibility table
const SOURCE_CREDIBILITY: Record<string, number> = {
  'arxiv': 0.9,
  'openalex': 0.85,
  'crossref': 0.85,
  'semantic_scholar': 0.8,
  'ieee_spectrum': 0.85,
  'acm_technews': 0.8,
  'infoq': 0.75,
  'martin_fowler': 0.9,
  'netflix_tech': 0.75,
  'hackernews': 0.5,
  'lobsters': 0.5,
  'rss_generic': 0.4,
};
8. LLM / PROMPTING / INSIGHT GENERATION ROADMAP
8.1 Current LLM Usage Problems
No prompt registry — Prompts are inline strings in gemini.ts
No structured outputs — Relies on JSON parsing from free-form text
No style separation — Same prompt for all output formats
No insight enforcement — Generates summaries, not insights
No critique step — No quality gate before publishing
8.2 Target LLM Pipeline
┌─────────────────────────────────────────────────────────┐
│                  LLM PIPELINE                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Stage 1: CLASSIFY                                       │
│  ├── Input: CanonicalItem (title, abstract)              │
│  ├── Output: { topic, subtopic, relevance, depth }       │
│  └── Prompt: classification-prompt-v1                    │
│                                                          │
│  Stage 2: SUMMARIZE                                      │
│  ├── Input: CanonicalItem                                │
│  ├── Output: { summary, keyPoints, technicalTerms }      │
│  └── Prompt: summary-prompt-v1                           │
│                                                          │
│  Stage 3: CRITIQUE                                       │
│  ├── Input: CanonicalItem + Summary                      │
│  ├── Output: { strengths, weaknesses, gaps, claims }     │
│  └── Prompt: critique-prompt-v1                          │
│                                                          │
│  Stage 4: DERIVE INSIGHT                                 │
│  ├── Input: CanonicalItem + Summary + Critique           │
│  ├── Output: { insight, whyItMatters, experimentIdeas }  │
│  └── Prompt: insight-prompt-v1                           │
│                                                          │
│  Stage 5: GENERATE DRAFT (per format)                    │
│  ├── Telegram: { message, inline_keyboard }              │
│  ├── LinkedIn: { hook, body, hashtags, cta }             │
│  ├── Blog: { title, description, content, tags }         │
│  └── Insight: { oneLiner, detail, link }                 │
│                                                          │
│  Stage 6: QUALITY GATE                                   │
│  ├── Input: Draft                                        │
│  ├── Check: Is it an insight (not just summary)?         │
│  ├── Check: Factual accuracy (no hallucinated claims)?   │
│  └── Output: { pass, score, issues[] }                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
8.3 Prompt Registry Design
interface PromptTemplate {
  id: string;
  version: string;
  name: string;
  systemInstruction: string;
  userTemplate: string;           // Handlebars-style {{variable}}
  outputSchema: ZodSchema;        // Expected output structure
  temperature: number;
  maxTokens: number;
  tags: string[];                 // For categorization
}

// Example prompts
const PROMPTS = {
  'classify-v1': { ... },
  'summarize-v1': { ... },
  'critique-v1': { ... },
  'insight-v1': { ... },
  'draft-telegram-v1': { ... },
  'draft-linkedin-v1': { ... },
  'draft-blog-v1': { ... },
  'quality-gate-v1': { ... },
};
9. TELEGRAM UX / REVIEW WORKFLOW ROADMAP
9.1 Current Commands
Command	Action
/help	Show available commands
/papers	Scan ArXiv papers
/news	Scan RSS feeds
/daily	Full digest (papers + news)
/status	Check bot status
/cancel	Cancel current session
9.2 Target Commands
Command	Action
/digest	Generate daily digest (papers + news)
/papers	Scan and show papers
/news	Scan and show news
/insight [topic]	Generate insight on specific topic
/compare [id1] [id2]	Compare two papers/items
/drafts	List pending drafts
/approve [id]	Approve a draft
/reject [id] [reason]	Reject a draft
/publishqueue	Show items ready to publish
/sources	List configured sources
/sources add [type] [url]	Add new source
/sources pause [id]	Pause a source
/sources resume [id]	Resume a source
/preferences	Set topic preferences
/feedback [rating]	Rate content quality
/weekly	Generate weekly report
9.3 Inline Actions
✅ Approve draft
❌ Reject draft
✏️ Edit draft (opens edit flow)
🔗 View source
⭐ Rate content (1-5)
📌 Save for later
🔄 Generate alternative version
10. LINKEDIN DRAFT / PUBLISHING ROADMAP
10.1 Draft Model
interface LinkedInDraft {
  id: string;
  hook: string;                    // First line (critical for LinkedIn)
  body: string;                    // Main content
  hashtags: string[];              // 3-5 relevant hashtags
  callToAction: string;            // Engagement prompt
  sourceUrls: string[];            // Attribution links
  imageUrl?: string;               // Optional image
  format: 'post' | 'article' | 'carousel';
  status: 'draft' | 'review' | 'approved' | 'scheduled' | 'published';
  scheduledAt?: Date;
  publishedAt?: Date;
  linkedinPostId?: string;
  qualityScore: number;
  createdAt: Date;
}
10.2 Quality Gate
interface LinkedInQualityGate {
  check(draft: LinkedInDraft): QualityResult;
}

interface QualityResult {
  pass: boolean;
  score: number;
  checks: {
    hookEngaging: boolean;        // First line grabs attention
    noShallowSummary: boolean;    // Not just "X happened"
    hasInsight: boolean;          // Contains unique perspective
    hasCallToAction: boolean;     // Asks question or prompts discussion
    lengthOk: boolean;            // Within LinkedIn limits
    noSpam: boolean;              // No excessive hashtags or emojis
    hasAttribution: boolean;      // Links to source
    factualAccuracy: boolean;     // No hallucinated claims
  };
  issues: string[];
}
10.3 Publishing Safeguards
Human-in-the-loop approval — Never auto-publish LinkedIn
Rate limiting — Max 1 post per day, 3 per week
Idempotency — Track LinkedIn post IDs to prevent duplicates
Retry with backoff — Handle LinkedIn API rate limits
Audit trail — Log all publish attempts
Rollback — Ability to delete published posts
Scheduling — Post at optimal times (Tue-Thu, 8-10am)
Anti-spam — Vary content format, don't post same pattern
11. TESTING / QA / RELIABILITY ROADMAP
11.1 Current Test Coverage
Module	Coverage	Gaps
news-scanner.ts	~60%	Missing: network errors, rate limiting
blog-generator.ts	~50%	Missing: edge cases, file system errors
gemini.ts	~30%	Missing: circuit breaker, timeout
config.ts	~40%	Missing: env var parsing
session-manager.ts	~30%	Missing: TTL, cleanup
validation.ts	~50%	Missing: edge cases
main.ts	~10%	Missing: command routing, state machine
publisher.ts	~20%	Missing: git operations
telegram.ts	~20%	Missing: rate limiting, chunking
commands/*	~10%	Missing: all command handlers
11.2 Missing Test Categories
Connector tests — Mock API responses, test parsing
Parser tests — RSS, Atom, arXiv XML, OpenAlex JSON
LLM contract tests — Validate structured outputs
Dedup tests — Cross-source dedup scenarios
Ranking tests — Scoring algorithm validation
Integration tests — End-to-end pipeline
Fixtures — Fake feed responses, mock API data
DB migration tests — Schema evolution
Publish workflow tests — Approval → publish flow
Retry/idempotency tests — Verify no duplicates on re-run
12. PERFORMANCE / SCALABILITY / OPERATIONS ROADMAP
12.1 Current Performance Issues
Sequential API calls — Each source fetched one at a time
No batching — Each paper classified individually
Blocking I/O — Git operations block event loop
No caching — Re-fetches same content
No concurrency — Single-threaded processing
No backpressure — Source flood = system overload
12.2 Target Performance Architecture
// Queue-based processing
interface JobQueue {
  enqueue(job: Job): Promise<string>;
  process(handler: JobHandler): Promise<void>;
  getStatus(jobId: string): Promise<JobStatus>;
  retry(jobId: string): Promise<void>;
  getDeadLetterQueue(): Promise<Job[]>;
}

// Bounded concurrency
interface WorkerPool {
  maxConcurrency: number;
  execute<T>(fn: () => Promise<T>): Promise<T>;
}

// Batch processing
interface BatchProcessor {
  processBatch<T>(items: T[], processor: (item: T) => Promise<void>): Promise<void>;
}
13. SECURITY / ROBUSTNESS ROADMAP
13.1 Current Security Status
Area	Status
Command injection	✅ Fixed (execFile instead of exec)
Secrets in code	⚠️ .env.json still supported
Input validation	✅ Zod schemas
Log sanitization	✅ Winston with redaction
Path traversal	✅ Validated
Prompt injection	⚠️ Partial
SSRF protection	❌ None
Rate limiting	✅ Telegram only
13.2 Security Tickets
Remove .env.json support — Only env vars
Add SSRF protection — Validate URLs before fetching
Add prompt injection defense — Sanitize user input for LLM
Add webhook secret validation — For future webhook mode
Add audit logging — All publish actions logged
Add secret rotation — Support API key rotation
Add IP allowlisting — For health check endpoint
14. EDGE CASES AND FAILURE MODES
14.1 Critical Edge Cases
Edge Case	Impact	Mitigation
Duplicate items with different URLs	Content duplication	DOI/arXiv ID dedup
Partial metadata	Missing fields	Default values, enrichment
Deleted feed items	Stale content	Checkpoint-based scanning
Malformed RSS	Parse failure	Graceful degradation
API outage	No new content	Cached fallback, retry
Rate limiting	Blocked requests	Per-source rate limiter
Empty digest day	No content to post	Skip, notify user
Same paper in several sources	Dedup needed	Cross-source canonical key
GitHub repo without clear paper linkage	Enrichment failure	Manual mapping
Article changed after first ingest	Stale content	Content hash comparison
LLM hallucinated claims	Factual errors	Quality gate, human review
No good post candidates	Low quality output	Threshold filtering
Repeated failed publish attempts	Content loss	Dead letter queue
Bad markdown rendering in Telegram	Poor UX	Markdown escaping
Source flood (100+ items)	System overload	Rate limiting, batch limits
Timezone issues in scheduling	Wrong timing	UTC internally
Item ranking oscillation	Unstable output	Ranking smoothing
Stale drafts	Clutter	Auto-expire old drafts
Job reruns after crash	Duplicates	Idempotent operations
Content loop (duplicate posting)	Spam	Delivery history check
14.2 Failure Mode Matrix
Failure	Impact	Recovery
Gemini API down	No classification	Circuit breaker → fallback classification
Telegram API down	No messages	Queue → retry on reconnect
ArXiv API slow	Delayed scan	Timeout → partial results
RSS feed offline	Missing news	Skip source → log error
Git push fails	Draft not published	Retry → DLQ → manual
Database down	No persistence	In-memory fallback
LLM timeout	Incomplete generation	Retry with shorter context
Rate limit exceeded	Blocked requests	Backoff → queue
15. PRIORITIZED EPICS
EPIC 1: Foundation — Database + Source Abstraction (P0)
Goal: Establish persistent storage and source connector pattern
Why: Without this, nothing else scales
Effort: XL (3-4 weeks)

EPIC 2: Dedup + Ranking Engine (P0)
Goal: Cross-source deduplication and multi-signal ranking
Why: Prevents duplicate content, ensures quality
Effort: L (2-3 weeks)

EPIC 3: Source Connectors (P1)
Goal: Implement all target source connectors
Why: Multi-source ingestion
Effort: XL (4-6 weeks)

EPIC 4: LLM Pipeline — Insights, Not Summaries (P1)
Goal: Prompt registry, structured outputs, quality gate
Why: Differentiator — technical depth
Effort: L (2-3 weeks)

EPIC 5: Content Generation — Multi-Format (P1)
Goal: Telegram, LinkedIn, blog, insight formats
Why: Multi-channel publishing
Effort: L (2-3 weeks)

EPIC 6: Review Workflow + Approval Queue (P1)
Goal: Human-in-the-loop review before publishing
Why: Safety and quality control
Effort: M (1-2 weeks)

EPIC 7: Job Queue + Scheduler (P2)
Goal: Reliable background processing
Why: Decouple ingestion from bot
Effort: L (2 weeks)

EPIC 8: Observability + Monitoring (P2)
Goal: Metrics, tracing, dashboards
Why: Operational visibility
Effort: M (1-2 weeks)

EPIC 9: Testing Infrastructure (P2)
Goal: Fixtures, integration tests, contract tests
Why: Confidence in changes
Effort: L (2-3 weeks)

EPIC 10: LinkedIn Auto-Publish (P3)
Goal: Optional LinkedIn auto-posting
Why: Content distribution
Effort: M (1-2 weeks)

16. DETAILED TICKETS
TICKET-001 — Set Up PostgreSQL Database
Priority: P0
Effort: M
Depends on: None
Problem: No persistent storage; all state is in-memory
Current evidence: session-manager.ts uses Map<number, SessionEntry>
Root cause: No database configured
Proposed fix: Add PostgreSQL with Prisma ORM, create initial schema
Files/modules likely affected: New prisma/ directory, infrastructure/persistence/
Edge cases: Database unavailable at startup
Tests required: Connection tests, migration tests
Acceptance criteria: DB connects, schema created, basic CRUD works
TICKET-002 — Define Core Database Schema
Priority: P0
Effort: L
Depends on: TICKET-001
Problem: No schema for Source, SourceItemRaw, CanonicalItem, etc.
Current evidence: Only file-based JSON storage in data/ directory
Root cause: No schema definition
Proposed fix: Create Prisma schema for all core entities
Files/modules likely affected: prisma/schema.prisma
Edge cases: Schema migration on existing data
Tests required: Schema validation, migration tests
Acceptance criteria: All entities defined, migrations work, no data loss
TICKET-003 — Implement SourceConnector Interface
Priority: P0
Effort: M
Depends on: TICKET-002
Problem: Each source is a separate module with no shared abstraction
Current evidence: news-scanner.ts and arxiv-scanner.ts have different interfaces
Root cause: No connector abstraction
Proposed fix: Define SourceConnector interface and base class
Files/modules likely affected: domain/ports/SourceConnector.ts, infrastructure/connectors/
Edge cases: Source-specific configuration
Tests required: Interface compliance tests
Acceptance criteria: Interface defined, base class implemented, tests pass
TICKET-004 — Implement ArxivConnector
Priority: P0
Effort: M
Depends on: TICKET-003
Problem: ArXiv scanning is in separate module, no checkpoint support
Current evidence: src/lib/pipeline/arxiv-scanner.ts has no checkpoint
Root cause: Linear scan every time
Proposed fix: Extract into ArxivConnector with checkpoint support
Files/modules likely affected: infrastructure/connectors/ArxivConnector.ts
Edge cases: API slowness, partial results
Tests required: Parse tests, checkpoint tests, rate limit tests
Acceptance criteria: Connector works, checkpoints saved, rate limit respected
TICKET-005 — Implement RssConnector
Priority: P0
Effort: M
Depends on: TICKET-003
Problem: RSS feeds hardcoded in config, no per-feed tracking
Current evidence: news-scanner.ts uses config.sources array
Root cause: No feed abstraction
Proposed fix: Create RssConnector with configurable feeds
Files/modules likely affected: infrastructure/connectors/RssConnector.ts, refactor news-scanner.ts
Edge cases: Malformed XML, feed offline, Atom vs RSS
Tests required: Parse tests, error handling, format detection
Acceptance criteria: Configurable feeds, checkpoint support, health tracking
TICKET-006 — Implement OpenAlexConnector
Priority: P1
Effort: M
Depends on: TICKET-003
Problem: No OpenAlex support
Current evidence: No OpenAlex code exists
Root cause: New feature
Proposed fix: Implement OpenAlex API connector
Files/modules likely affected: infrastructure/connectors/OpenAlexConnector.ts
Edge cases: API changes, pagination limits
Tests required: API response parsing, pagination
Acceptance criteria: Fetches papers, parses correctly, respects rate limits
TICKET-007 — Implement CrossrefConnector
Priority: P1
Effort: M
Depends on: TICKET-003
Problem: No Crossref support
Current evidence: No Crossref code exists
Root cause: New feature
Proposed fix: Implement Crossref API connector
Files/modules likely affected: infrastructure/connectors/CrossrefConnector.ts
Edge cases: Abstract format (JATS XML), rate limits
Tests required: API parsing, abstract extraction
Acceptance criteria: Fetches works, parses abstracts, uses polite pool
TICKET-008 — Implement SemanticScholarConnector
Priority: P1
Effort: M
Depends on: TICKET-003
Problem: No Semantic Scholar support
Current evidence: No Semantic Scholar code exists
Root cause: New feature
Proposed fix: Implement Semantic Scholar API connector
Files/modules likely affected: infrastructure/connectors/SemanticScholarConnector.ts
Edge cases: TLDR not available for all papers
Tests required: API parsing, TLDR extraction
Acceptance criteria: Fetches papers, extracts TLDR, respects rate limits
TICKET-009 — Implement GitHubConnector
Priority: P1
Effort: M
Depends on: TICKET-003
Problem: No GitHub monitoring
Current evidence: No GitHub code exists
Root cause: New feature
Proposed fix: Implement GitHub API connector for repos, releases
Files/modules likely affected: infrastructure/connectors/GitHubConnector.ts
Edge cases: Rate limits, README rendering
Tests required: Repo search, release parsing
Acceptance criteria: Monitors repos, tracks releases, links to papers
TICKET-010 — Implement ZoteroConnector
Priority: P2
Effort: M
Depends on: TICKET-003
Problem: No Zotero support
Current evidence: No Zotero code exists
Root cause: New feature
Proposed fix: Implement Zotero Web API connector
Files/modules likely affected: infrastructure/connectors/ZoteroConnector.ts
Edge cases: API key management, sync conflicts
Tests required: Library sync, item parsing
Acceptance criteria: Syncs personal library, extracts tags, enriches topics
TICKET-011 — Implement HackerNewsConnector
Priority: P1
Effort: S
Depends on: TICKET-003
Problem: No dedicated HN connector
Current evidence: Only RSS feed in config
Root cause: No dedicated connector
Proposed fix: Implement HN Algolia API connector
Files/modules likely affected: infrastructure/connectors/HackerNewsConnector.ts
Edge cases: API slowness, self-posts vs links
Tests required: Search API, item parsing
Acceptance criteria: Searches by topic, tracks comments, handles URLs
TICKET-012 — Implement Canonicalizer
Priority: P0
Effort: L
Depends on: TICKET-002
Problem: No normalization of raw items to canonical form
Current evidence: Each source stores its own format
Root cause: No canonicalization layer
Proposed fix: Create ItemCanonicalizer that maps any source item to CanonicalItem
Files/modules likely affected: application/services/ItemCanonicalizer.ts
Edge cases: Missing fields, conflicting metadata
Tests required: Multi-source mapping, field extraction
Acceptance criteria: All source types produce consistent CanonicalItem
TICKET-013 — Implement Deduplication Engine
Priority: P0
Effort: L
Depends on: TICKET-012
Problem: Only naive link-based dedup exists
Current evidence: news-scanner.ts uses Set<string> for links
Root cause: No cross-source dedup
Proposed fix: Create DedupEngine with multi-layer matching
Files/modules likely affected: application/services/DedupEngine.ts
Edge cases: DOI collisions, similar titles
Tests required: Cross-source dedup, fuzzy matching
Acceptance criteria: DOI/arXiv ID exact match, URL normalization, title similarity
TICKET-014 — Implement Ranking Pipeline
Priority: P1
Effort: L
Depends on: TICKET-013
Problem: Simple keyword matching only
Current evidence: news-scanner.ts uses topicKeywords.filter(kw => text.includes(kw))
Root cause: No multi-signal ranking
Proposed fix: Create RankingPipeline with configurable weights
Files/modules likely affected: application/services/RankingPipeline.ts
Edge cases: Weight tuning, score normalization
Tests required: Scoring algorithm, weight configuration
Acceptance criteria: Multi-signal scoring, configurable weights, source credibility table
TICKET-015 — Create Prompt Registry
Priority: P1
Effort: M
Depends on: TICKET-002
Problem: Prompts are inline strings, versioned by accident
Current evidence: gemini.ts has hardcoded prompts
Root cause: No prompt management
Proposed fix: Create prompt registry with versioned templates
Files/modules likely affected: infrastructure/prompts/, config/prompts.json
Edge cases: Prompt version migration
Tests required: Template rendering, version management
Acceptance criteria: Prompts stored, versioned, loadable by ID
TICKET-016 — Implement Structured LLM Outputs
Priority: P1
Effort: M
Depends on: TICKET-015
Problem: LLM returns free-form text, parsed by string manipulation
Current evidence: gemini.ts does response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
Root cause: No structured output enforcement
Proposed fix: Use JSON mode or function calling for structured outputs
Files/modules likely affected: gemini.ts, prompt templates
Edge cases: LLM not following schema
Tests required: Schema validation, fallback handling
Acceptance criteria: Outputs validated against Zod schemas, fallback on failure
TICKET-017 — Implement Insight Generator (not Summary)
Priority: P1
Effort: M
Depends on: TICKET-016
Problem: Current LLM generates summaries, not insights
Current evidence: gemini.ts:generateBlogPost generates generic summaries
Root cause: No insight-specific prompt chain
Proposed fix: Create 4-stage pipeline: classify → summarize → critique → derive insight
Files/modules likely affected: application/services/InsightGenerator.ts
Edge cases: Chain failure, token limits
Tests required: Multi-stage pipeline, quality assessment
Acceptance criteria: Generates unique insights, not rephrased summaries
TICKET-018 — Implement Quality Gate
Priority: P1
Effort: M
Depends on: TICKET-017
Problem: No quality check before publishing
Current evidence: Posts saved directly without review
Root cause: No quality gate
Proposed fix: Create QualityGate service that validates drafts
Files/modules likely affected: application/services/QualityGate.ts
Edge cases: False positives, threshold tuning
Tests required: Quality scoring, pass/fail criteria
Acceptance criteria: Drafts scored, shallow content rejected, factual accuracy checked
TICKET-019 — Implement Telegram Draft Formatter
Priority: P1
Effort: S
Depends on: TICKET-017
Problem: No format-specific content generation
Current evidence: blog-generator.ts only generates blog markdown
Root cause: Single format assumption
Proposed fix: Create TelegramFormatter service
Files/modules likely affected: infrastructure/formatting/TelegramFormatter.ts
Edge cases: Character limits, markdown escaping
Tests required: Format conversion, length limits
Acceptance criteria: Generates Telegram-formatted messages with proper escaping
TICKET-020 — Implement LinkedIn Draft Generator
Priority: P2
Effort: M
Depends on: TICKET-019
Problem: No LinkedIn content generation
Current evidence: No LinkedIn code exists
Root cause: New feature
Proposed fix: Create LinkedInFormatter and LinkedInDraft model
Files/modules likely affected: infrastructure/formatting/LinkedInFormatter.ts, domain/entities/LinkedInDraft.ts
Edge cases: LinkedIn character limits, hashtag rules
Tests required: Format generation, quality checks
Acceptance criteria: Generates LinkedIn posts with hooks, hashtags, CTAs
TICKET-021 — Implement Review Command System
Priority: P1
Effort: M
Depends on: TICKET-020
Problem: No review workflow
Current evidence: /daily auto-generates and prompts yes/no
Root cause: No review queue
Proposed fix: Create /drafts, /approve, /reject commands
Files/modules likely affected: commands/drafts.ts, commands/approve.ts, commands/reject.ts
Edge cases: Concurrent reviews
Tests required: Command execution, state management
Acceptance criteria: Drafts listed, approval workflow works, rejections logged
TICKET-022 — Implement Job Queue (BullMQ)
Priority: P2
Effort: L
Depends on: TICKET-001
Problem: Long-running operations block bot
Current evidence: daily.ts runs scanning + classification synchronously
Root cause: No queue system
Proposed fix: Add BullMQ with Redis for background jobs
Files/modules likely affected: infrastructure/queue/, new Redis dependency
Edge cases: Redis unavailable, job failures
Tests required: Queue operations, retry behavior
Acceptance criteria: Jobs queued, processed asynchronously, failures handled
TICKET-023 — Implement Scheduler
Priority: P2
Effort: S
Depends on: TICKET-022
Problem: No automated scheduling
Current evidence: auto-digest.ts must be run manually or via cron
Root cause: No built-in scheduler
Proposed fix: Add node-cron for scheduled jobs
Files/modules likely affected: infrastructure/scheduler/
Edge cases: Timezone issues, overlapping runs
Tests required: Schedule execution, idempotency
Acceptance criteria: Jobs run on schedule, no overlapping runs
TICKET-024 — Implement Metrics Collection
Priority: P2
Effort: M
Depends on: TICKET-022
Problem: No metrics beyond logs
Current evidence: logger.ts only logs, no metrics
Root cause: No metrics system
Proposed fix: Add Prometheus metrics
Files/modules likely affected: infrastructure/metrics/
Edge cases: Metric cardinality
Tests required: Metric recording, export
Acceptance criteria: API latency, error rates, processing counts tracked
TICKET-025 — Implement Dead Letter Queue
Priority: P2
Effort: M
Depends on: TICKET-022
Problem: Failed jobs silently lost
Current evidence: Errors logged but job not retried
Root cause: No DLQ
Proposed fix: Add DLQ for failed jobs with manual retry
Files/modules likely affected: infrastructure/queue/DeadLetterQueue.ts
Edge cases: DLQ overflow
Tests required: Failure handling, retry mechanism
Acceptance criteria: Failed jobs in DLQ, manual retry available
TICKET-026 — Refactor main.ts into Use Cases
Priority: P1
Effort: L
Depends on: TICKET-003
Problem: main.ts is 341 lines with mixed concerns
Current evidence: main.ts contains routing + state + business logic
Root cause: No separation of concerns
Proposed fix: Extract into use cases following existing DDD pattern
Files/modules likely affected: application/use-cases/, main.ts
Edge cases: State management during refactor
Tests required: Use case tests, integration tests
Acceptance criteria: main.ts < 100 lines, logic in use cases
TICKET-027 — Implement In-Memory → Database Migration
Priority: P0
Effort: L
Depends on: TICKET-001, TICKET-002
Problem: Sessions lost on restart
Current evidence: session-manager.ts uses Map
Root cause: No persistence
Proposed fix: Migrate sessions to database
Files/modules likely affected: infrastructure/persistence/PostgresSessionRepository.ts
Edge cases: Data migration, schema changes
Tests required: CRUD operations, migration tests
Acceptance criteria: Sessions persisted, survive restart
TICKET-028 — Implement Checkpoint Persistence
Priority: P0
Effort: S
Depends on: TICKET-002
Problem: No checkpoint storage for resumable ingestion
Current evidence: run-pipeline.ts uses file-based paper tracking
Root cause: No checkpoint abstraction
Proposed fix: Store FeedCheckpoint in database
Files/modules likely affected: infrastructure/persistence/FeedCheckpointRepository.ts
Edge cases: Checkpoint corruption
Tests required: Checkpoint CRUD, resumption
Acceptance criteria: Checkpoints saved, ingestion resumes from last position
TICKET-029 — Implement Delivery History
Priority: P1
Effort: S
Depends on: TICKET-002
Problem: No tracking of what was delivered where
Current evidence: No delivery tracking exists
Root cause: No delivery model
Proposed fix: Create DeliveryRecord entity and repository
Files/modules likely affected: domain/entities/DeliveryRecord.ts, repository
Edge cases: Delivery confirmation failures
Tests required: CRUD, duplicate prevention
Acceptance criteria: Deliveries tracked, duplicates prevented
TICKET-030 — Implement Processing Run Tracking
Priority: P2
Effort: S
Depends on: TICKET-002
Problem: No audit trail for pipeline runs
Current evidence: Console logs only
Root cause: No processing run model
Proposed fix: Create ProcessingRun entity for pipeline tracking
Files/modules likely affected: domain/entities/ProcessingRun.ts, repository
Edge cases: Run never completed
Tests required: Run lifecycle, error tracking
Acceptance criteria: Runs tracked, errors logged, metrics computed
TICKET-031 — Implement Topic Profile
Priority: P1
Effort: M
Depends on: TICKET-002
Problem: Topics are hardcoded in config
Current evidence: config.ts has topics array
Root cause: No dynamic topic management
Proposed fix: Create TopicProfile entity with configurable weights
Files/modules likely affected: domain/entities/TopicProfile.ts
Edge cases: Profile updates affecting ranking
Tests required: Topic management, relevance scoring
Acceptance criteria: Topics configurable, weights adjustable
TICKET-032 — Implement Source Credibility Table
Priority: P1
Effort: S
Depends on: TICKET-002
Problem: No source credibility scoring
Current evidence: All sources treated equally
Root cause: No credibility model
Proposed fix: Create configurable credibility table
Files/modules likely affected: domain/value-objects/SourceCredibility.ts
Edge cases: Credibility changes over time
Tests required: Credibility lookup, ranking integration
Acceptance criteria: Sources have credibility scores, used in ranking
TICKET-033 — Implement Batch Processing for LLM Calls
Priority: P2
Effort: M
Depends on: TICKET-016
Problem: Each paper classified individually
Current evidence: classifyAndSummarizePapers batches but still sends all in one prompt
Root cause: No true batching
Proposed fix: Batch papers and process in parallel with rate limiting
Files/modules likely affected: infrastructure/external/GeminiServiceAdapter.ts
Edge cases: Batch size limits, partial failures
Tests required: Batch processing, error handling
Acceptance criteria: Papers batched, parallel processing, failures handled
TICKET-034 — Implement Async Source Fetching
Priority: P2
Effort: M
Depends on: TICKET-003
Problem: Sources fetched sequentially
Current evidence: news-scanner.ts has for (const source of config.sources)
Root cause: No concurrency
Proposed fix: Fetch sources concurrently with bounded parallelism
Files/modules likely affected: application/services/SourceAggregator.ts
Edge cases: One source slow, others fast
Tests required: Parallel fetching, error isolation
Acceptance criteria: Sources fetched in parallel, errors isolated
TICKET-035 — Implement Content Format Registry
Priority: P1
Effort: M
Depends on: TICKET-019
Problem: No registry of content formats
Current evidence: Only blog format exists
Root cause: Single format assumption
Proposed fix: Create ContentFormatter interface and registry
Files/modules likely affected: application/ports/ContentFormatter.ts, formatters
Edge cases: Format-specific validation
Tests required: Format generation, registry lookup
Acceptance criteria: Multiple formats supported, pluggable
TICKET-036 — Implement Telegram Inline Keyboard Actions
Priority: P1
Effort: M
Depends on: TICKET-021
Problem: No inline actions for approve/reject
Current evidence: Only text-based confirmation
Root cause: No inline keyboard support
Proposed fix: Add callback query handling for inline actions
Files/modules likely affected: telegram.ts, command handlers
Edge cases: Callback timeout, concurrent actions
Tests required: Callback handling, state updates
Acceptance criteria: Inline buttons work, callbacks processed
TICKET-037 — Implement Source Health Monitoring
Priority: P2
Effort: S
Depends on: TICKET-003
Problem: No per-source health tracking
Current evidence: Only overall health check
Root cause: No source health model
Proposed fix: Track per-source error rates, response times
Files/modules likely affected: infrastructure/monitoring/SourceHealthTracker.ts
Edge cases: Flapping sources
Tests required: Health tracking, alerting
Acceptance criteria: Sources monitored, health visible in /sources
TICKET-038 — Implement Per-Source Rate Limiting
Priority: P0
Effort: M
Depends on: TICKET-003
Problem: No per-source rate limiting
Current evidence: Only Telegram rate limit exists
Root cause: Rate limits hardcoded per API
Proposed fix: Create configurable rate limiter per source
Files/modules likely affected: infrastructure/ratelimit/SourceRateLimiter.ts
Edge cases: Rate limit configuration changes
Tests required: Rate limiting per source, backoff
Acceptance criteria: Each source respects its rate limit
TICKET-039 — Implement SSRF Protection
Priority: P1
Effort: S
Depends on: None
Problem: No URL validation before fetching
Current evidence: news-scanner.ts fetches arbitrary URLs
Root cause: No SSRF protection
Proposed fix: Validate URLs against allowlist before fetching
Files/modules likely affected: shared/validators.ts
Edge cases: Localhost URLs, internal IPs
Tests required: URL validation, blocklist
Acceptance criteria: Malicious URLs blocked, legitimate URLs allowed
TICKET-040 — Implement Prompt Injection Defense
Priority: P1
Effort: S
Depends on: None
Problem: User input goes directly to LLM
Current evidence: main.ts passes session.userComment to Gemini
Root cause: No prompt injection defense
Proposed fix: Sanitize user input, use system/user message separation
Files/modules likely affected: shared/validators.ts, gemini.ts
Edge cases: False positives blocking legitimate input
Tests required: Injection detection, sanitization
Acceptance criteria: Common injection patterns blocked, legitimate input allowed
TICKET-041 — Remove .env.json Support
Priority: P0
Effort: S
Depends on: None
Problem: Secrets can be stored in JSON file
Current evidence: config.ts:127 has loadFromFile() function
Root cause: Legacy config support
Proposed fix: Remove JSON file loading, only env vars
Files/modules likely affected: config.ts
Edge cases: Existing users with .env.json
Tests required: Config loading, error on missing vars
Acceptance criteria: Only env vars accepted, JSON file rejected
TICKET-042 — Implement Integration Test Suite
Priority: P2
Effort: L
Depends on: TICKET-001
Problem: No integration tests
Current evidence: Only unit tests exist
Root cause: No test infrastructure
Proposed fix: Create integration test suite with test DB
Files/modules likely affected: __tests__/integration/
Edge cases: Test data cleanup
Tests required: End-to-end pipeline, multi-source flows
Acceptance criteria: Integration tests pass, cover critical paths
TICKET-043 — Create API Fixture Library
Priority: P2
Effort: M
Depends on: None
Problem: No test fixtures for API responses
Current evidence: Tests use inline XML strings
Root cause: No fixture management
Proposed fix: Create fixture files for all source APIs
Files/modules likely affected: __tests__/fixtures/
Edge cases: Fixture staleness
Tests required: Fixture loading, response matching
Acceptance criteria: All source APIs have fixtures, tests use them
TICKET-044 — Implement LLM Contract Tests
Priority: P2
Effort: M
Depends on: TICKET-016
Problem: No validation that LLM returns expected format
Current evidence: gemini.ts does string manipulation then JSON.parse
Root cause: No contract testing
Proposed fix: Create contract tests for all LLM prompts
Files/modules likely affected: __tests__/contracts/
Edge cases: LLM version changes
Tests required: Schema validation, prompt compliance
Acceptance criteria: All prompts have contract tests, failures detected
TICKET-045 — Implement Weekly Report Generator
Priority: P3
Effort: M
Depends on: TICKET-017
Problem: No weekly summary
Current evidence: No weekly report code
Root cause: New feature
Proposed fix: Create weekly report aggregation and generation
Files/modules likely affected: application/use-cases/GenerateWeeklyReportUseCase.ts
Edge cases: Empty week
Tests required: Aggregation, formatting
Acceptance criteria: Weekly report generated, includes top items and trends
17. SUGGESTED REFACTOR ORDER
Phase 0: Stabilization (Week 1-2)
TICKET-041: Remove .env.json support
TICKET-039: SSRF protection
TICKET-040: Prompt injection defense
Refactor main.ts partially (extract command handlers)
Phase 1: Foundation (Week 3-5)
TICKET-001: Set up PostgreSQL
TICKET-002: Define schema
TICKET-027: Migrate sessions to DB
TICKET-003: SourceConnector interface
Phase 2: Sources (Week 6-9)
TICKET-004: ArXiv connector
TICKET-005: RSS connector
TICKET-006: OpenAlex connector
TICKET-007: Crossref connector
TICKET-008: Semantic Scholar connector
Phase 3: Processing (Week 10-12)
TICKET-012: Canonicalizer
TICKET-013: Dedup engine
TICKET-014: Ranking pipeline
TICKET-028: Checkpoint persistence
Phase 4: LLM + Content (Week 13-16)
TICKET-015: Prompt registry
TICKET-016: Structured outputs
TICKET-017: Insight generator
TICKET-018: Quality gate
TICKET-019-020: Format generators
Phase 5: Publishing (Week 17-19)
TICKET-021: Review commands
TICKET-036: Inline actions
TICKET-029: Delivery history
TICKET-022: Job queue
Phase 6: Operations (Week 20-22)
TICKET-024: Metrics
TICKET-025: Dead letter queue
TICKET-037: Source health monitoring
TICKET-042: Integration tests
18. QUICK WINS
Ticket	Effort	Impact
TICKET-041 (Remove .env.json)	S	Security fix
TICKET-039 (SSRF protection)	S	Security fix
TICKET-040 (Prompt injection)	S	Security fix
TICKET-038 (Per-source rate limiting)	M	Reliability
TICKET-028 (Checkpoint persistence)	S	Reliability
TICKET-019 (Telegram formatter)	S	Feature
TICKET-011 (HackerNews connector)	S	Source
TICKET-043 (API fixtures)	M	Testing
19. HIGH-RISK UNKNOWN REQUIRING DECISIONS
Decision	Options	Risk
Database choice	PostgreSQL vs SQLite vs MongoDB	PostgreSQL recommended for production
Queue system	BullMQ vs custom vs SQS	BullMQ with Redis is simplest
LLM provider	Gemini only vs multi-provider	Multi-provider adds abstraction complexity
LinkedIn API	Use API vs manual copy-paste	API has rate limits and approval requirements
Embedding model	Gemini embeddings vs OpenAI vs local	Cost vs quality tradeoff
Deployment	Docker vs serverless vs VM	Docker recommended for control
20. FINAL RECOMMENDED EXECUTION SEQUENCE
Week 1-2:  Security fixes + quick wins
Week 3-5:  Database + source abstraction
Week 6-9:  Source connectors (ArXiv, RSS, OpenAlex, Crossref, Semantic Scholar)
Week 10-12: Dedup + ranking engine
Week 13-16: LLM pipeline + content generation
Week 17-19: Review workflow + publishing
Week 20-22: Observability + testing
Week 23-24: LinkedIn integration + polish
Total estimated effort: 24 weeks (part-time) or 12 weeks (full-time)

DOCUMENT COMPLETE

This roadmap provides a clear, prioritized path from the current prototype to a production-ready multi-source intelligence platform. Each ticket is specific enough to implement without ambiguity.

Key principle: Foundation before features. The database and source abstraction must come first — everything else builds on top.
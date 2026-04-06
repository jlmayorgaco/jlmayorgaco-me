/**
 * Bootstrap for Personal Use
 * Wires together all enhanced services for single-user academic research
 */

import { Container, TOKENS } from './container';
import { InMemorySessionRepository } from './persistence/InMemorySessionRepository';
import { InMemoryPaperHistoryRepository } from './persistence/InMemoryPaperHistoryRepository';
import { InMemoryResearchContextRepository } from './persistence/InMemoryResearchContextRepository';
import { 
  WhisperTranscriptionService, 
  CommentaryFormatter 
} from './external/WhisperTranscriptionService';
import { EnhancedScanPapersUseCase } from '../application/use-cases/EnhancedScanPapersUseCase';
import { EnhancedGenerateBlogPostUseCase } from '../application/use-cases/EnhancedGenerateBlogPostUseCase';
import { GenerateBlogPostUseCase } from '../application/use-cases/GenerateBlogPostUseCase';
import { ScanPapersUseCase } from '../application/use-cases/ScanPapersUseCase';
import { PublishPostUseCase } from '../application/use-cases/PublishPostUseCase';

export interface PersonalBotConfig {
  userId: string;
  chatId: number;
  geminiApiKey: string;
  telegramBotToken: string;
  openAiApiKey?: string;
  gitRepoPath?: string;
  maxHistorySize?: number;
}

export function bootstrapPersonalBot(config: PersonalBotConfig): Container {
  const container = new Container();

  // Register config
  container.registerInstance(TOKENS.BotConfig, config);

  // Register repositories (In-Memory for personal use)
  container.register(TOKENS.SessionRepository, () => new InMemorySessionRepository(), true);
  
  container.register(
    TOKENS.PaperHistoryRepository, 
    () => new InMemoryPaperHistoryRepository(config.maxHistorySize || 10000), 
    true
  );
  
  container.register(
    TOKENS.ResearchContextRepository,
    () => new InMemoryResearchContextRepository(),
    true
  );

  // Register voice services (optional - only if API key provided)
  if (config.openAiApiKey) {
    container.register(
      TOKENS.VoiceTranscriptionService,
      () => new WhisperTranscriptionService(config.openAiApiKey!),
      true
    );
    container.register(
      TOKENS.CommentaryFormatter,
      () => new CommentaryFormatter(),
      true
    );
  }

  // Note: MessagePort, GeminiService, Publisher need to be registered by the caller
  // as they depend on external configuration (Telegram bot, Git, etc.)

  // Register use cases
  container.register(
    TOKENS.ScanPapersUseCase,
    (c) => new ScanPapersUseCase(
      c.resolve(TOKENS.GeminiService),
      c.resolve(TOKENS.SessionRepository),
      c.resolve(TOKENS.MessagePort)
    )
  );

  container.register(
    TOKENS.GenerateBlogPostUseCase,
    (c) => new GenerateBlogPostUseCase(
      c.resolve(TOKENS.GeminiService),
      c.resolve(TOKENS.SessionRepository),
      c.resolve(TOKENS.MessagePort),
      c.has(TOKENS.ImageGenerationService) ? c.resolve(TOKENS.ImageGenerationService) : undefined
    )
  );

  container.register(
    TOKENS.PublishPostUseCase,
    (c) => new PublishPostUseCase(
      c.resolve(TOKENS.SessionRepository),
      c.resolve(TOKENS.Publisher),
      c.resolve(TOKENS.MessagePort)
    )
  );

  // Register enhanced use cases
  container.register(
    TOKENS.EnhancedScanPapersUseCase,
    (c) => new EnhancedScanPapersUseCase(
      c.resolve(TOKENS.GeminiService),
      c.resolve(TOKENS.SessionRepository),
      c.resolve(TOKENS.MessagePort),
      c.resolve(TOKENS.PaperHistoryRepository),
      c.resolve(TOKENS.ResearchContextRepository)
    )
  );

  container.register(
    TOKENS.EnhancedGenerateBlogPostUseCase,
    (c) => new EnhancedGenerateBlogPostUseCase(
      c.resolve(TOKENS.GeminiService),
      c.resolve(TOKENS.SessionRepository),
      c.resolve(TOKENS.MessagePort),
      c.has(TOKENS.VoiceTranscriptionService) 
        ? c.resolve(TOKENS.VoiceTranscriptionService) 
        : undefined,
      c.has(TOKENS.CommentaryFormatter) 
        ? c.resolve(TOKENS.CommentaryFormatter) 
        : undefined,
      c.has(TOKENS.ResearchContextRepository) 
        ? c.resolve(TOKENS.ResearchContextRepository) 
        : undefined
    )
  );

  return container;
}

// Export all enhanced features
export { InMemoryPaperHistoryRepository } from './persistence/InMemoryPaperHistoryRepository';
export { InMemoryResearchContextRepository } from './persistence/InMemoryResearchContextRepository';
export { WhisperTranscriptionService, CommentaryFormatter } from './external/WhisperTranscriptionService';
export { EnhancedScanPapersUseCase } from '../application/use-cases/EnhancedScanPapersUseCase';
export { EnhancedGenerateBlogPostUseCase } from '../application/use-cases/EnhancedGenerateBlogPostUseCase';
export { RelevanceTier, TierEmojis, TierLabels } from '../domain/enums/RelevanceTier';
export { ReactionEmoji, ReactionLabels } from '../domain/value-objects/BatchReview';


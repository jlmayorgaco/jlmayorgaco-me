/**
 * Personal Research Context Port
 * Stores and retrieves user's research interests and preferences
 */

export interface IResearchContextRepository {
  /**
   * Get user's research context
   */
  getContext(userId: string): Promise<ResearchContext>;
  
  /**
   * Update context with new information
   */
  updateContext(userId: string, update: ContextUpdate): Promise<void>;
  
  /**
   * Get research interests as weighted keywords
   */
  getInterests(userId: string): Promise<WeightedInterest[]>;
  
  /**
   * Record paper interaction to learn preferences
   */
  recordInteraction(userId: string, interaction: PaperInteraction): Promise<void>;
  
  /**
   * Get personalized classification prompt
   */
  getClassificationPrompt(userId: string): Promise<string>;
}

export interface ResearchContext {
  userId: string;
  researchAreas: string[];
  preferredTopics: string[];
  avoidedTopics: string[];
  preferredJournals: string[];
  keyResearchers: string[];
  methodologyPreferences: string[];
  lastUpdated: Date;
}

export interface WeightedInterest {
  term: string;
  weight: number;  // 0-1
  category: 'topic' | 'method' | 'author' | 'journal';
}

export interface PaperInteraction {
  paperId: string;
  action: 'opened' | 'read' | 'saved' | 'shared' | 'cited' | 'dismissed';
  timestamp: Date;
  duration?: number;  // seconds spent reading
  notes?: string;
}

export interface ContextUpdate {
  researchAreas?: string[];
  addTopics?: string[];
  removeTopics?: string[];
  addAvoidedTopics?: string[];
  addJournals?: string[];
  addResearchers?: string[];
}


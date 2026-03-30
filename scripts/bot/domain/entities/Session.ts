/**
 * Session Entity - Rich domain model for user sessions
 * Encapsulates state machine logic and business rules
 */

import { SessionState } from '../enums/SessionState';
import { StateTransitionError } from '../../shared/errors/AppError';
import { CONSTANTS } from '../../shared/constants';
import type { Paper, NewsItem, BlogPost } from '../value-objects';
import type { BatchReviewSession, PaperReaction } from '../value-objects/BatchReview';

export interface SessionData {
  chatId: number;
  state: SessionState;
  papers: Paper[];
  news: NewsItem[];
  selectedItems: string[];
  userComment: string;
  pendingPost: BlogPost | null;
  imageQuery: string;
  createdAt: Date;
  lastActivity: Date;
  batchReview?: BatchReviewSession;
}

export class Session {
  private _chatId: number;
  private _state: SessionState;
  private _papers: Paper[];
  private _news: NewsItem[];
  private _selectedItems: string[];
  private _userComment: string;
  private _pendingPost: BlogPost | null;
  private _imageQuery: string;
  private _createdAt: Date;
  private _lastActivity: Date;
  private _batchReview: BatchReviewSession | null;

  constructor(chatId: number) {
    this._chatId = chatId;
    this._state = SessionState.IDLE;
    this._papers = [];
    this._news = [];
    this._selectedItems = [];
    this._userComment = '';
    this._pendingPost = null;
    this._imageQuery = '';
    this._batchReview = null;
    this._createdAt = new Date();
    this._lastActivity = new Date();
  }

  // Factory method to recreate from data
  static fromData(data: SessionData): Session {
    const session = new Session(data.chatId);
    session._state = data.state;
    session._papers = [...data.papers];
    session._news = [...data.news];
    session._selectedItems = [...data.selectedItems];
    session._userComment = data.userComment;
    session._pendingPost = data.pendingPost;
    session._imageQuery = data.imageQuery;
    session._batchReview = data.batchReview ? {
      ...data.batchReview,
      reactions: new Map(
        Array.isArray(data.batchReview.reactions) 
          ? data.batchReview.reactions 
          : []
      ),
    } : null;
    session._createdAt = new Date(data.createdAt);
    session._lastActivity = new Date(data.lastActivity);
    return session;
  }

  // State machine transitions
  startCollectingComment(): void {
    if (this._state !== SessionState.IDLE) {
      throw new StateTransitionError(
        `Cannot start collecting comment from state: ${this._state}`,
        this._state,
        SessionState.COLLECTING_COMMENT
      );
    }
    this._state = SessionState.COLLECTING_COMMENT;
    this.touch();
  }

  setComment(comment: string): void {
    if (this._state !== SessionState.COLLECTING_COMMENT) {
      throw new StateTransitionError(
        `Cannot set comment in state: ${this._state}`,
        this._state,
        this._state
      );
    }
    this._userComment = comment;
    this.touch();
  }

  setPendingPost(post: BlogPost, imageQuery: string): void {
    if (this._state !== SessionState.COLLECTING_COMMENT) {
      throw new StateTransitionError(
        `Cannot set pending post from state: ${this._state}`,
        this._state,
        SessionState.CONFIRMING_PUBLISH
      );
    }
    this._pendingPost = post;
    this._imageQuery = imageQuery;
    this._state = SessionState.CONFIRMING_PUBLISH;
    this.touch();
  }

  confirmPublish(): void {
    if (this._state !== SessionState.CONFIRMING_PUBLISH) {
      throw new StateTransitionError(
        `Cannot confirm publish from state: ${this._state}`,
        this._state,
        SessionState.IDLE
      );
    }
    if (!this._pendingPost) {
      throw new StateTransitionError(
        'Cannot publish: no pending post',
        this._state,
        SessionState.IDLE
      );
    }
    this._state = SessionState.IDLE;
    this._pendingPost = null;
    this._imageQuery = '';
    this._selectedItems = [];
    this._userComment = '';
    this.touch();
  }

  cancel(): void {
    if (this._state === SessionState.IDLE) {
      return; // Idempotent
    }
    this._state = SessionState.IDLE;
    this._pendingPost = null;
    this._imageQuery = '';
    this._userComment = '';
    this.touch();
  }

  reset(): void {
    this._state = SessionState.IDLE;
    this._papers = [];
    this._news = [];
    this._selectedItems = [];
    this._userComment = '';
    this._pendingPost = null;
    this._imageQuery = '';
    this.touch();
  }

  // Business rules
  canPublish(): boolean {
    return this._state === SessionState.CONFIRMING_PUBLISH && this._pendingPost !== null;
  }

  hasPendingChanges(): boolean {
    return this._state !== SessionState.IDLE;
  }

  isExpired(ttlMinutes: number): boolean {
    const ttlMs = ttlMinutes * 60 * 1000;
    return Date.now() - this._lastActivity.getTime() > ttlMs;
  }

  isStale(): boolean {
    return this.isExpired(CONSTANTS.SESSION.DEFAULT_TTL_MINUTES);
  }

  // Data management
  setPapers(papers: Paper[]): void {
    this._papers = [...papers];
    this.touch();
  }

  setNews(news: NewsItem[]): void {
    this._news = [...news];
    this.touch();
  }

  setSelectedItems(items: string[]): void {
    this._selectedItems = [...items];
    this.touch();
  }

  updatePendingPost(post: Partial<BlogPost>): void {
    if (!this._pendingPost) {
      throw new StateTransitionError(
        'Cannot update: no pending post',
        this._state,
        this._state
      );
    }
    this._pendingPost = { ...this._pendingPost, ...post };
    this.touch();
  }

  // Private helper
  private touch(): void {
    this._lastActivity = new Date();
  }

  // Getters
  get chatId(): number {
    return this._chatId;
  }

  get state(): SessionState {
    return this._state;
  }

  get papers(): readonly Paper[] {
    return Object.freeze([...this._papers]);
  }

  get news(): readonly NewsItem[] {
    return Object.freeze([...this._news]);
  }

  get selectedItems(): readonly string[] {
    return Object.freeze([...this._selectedItems]);
  }

  get userComment(): string {
    return this._userComment;
  }

  get pendingPost(): BlogPost | null {
    return this._pendingPost ? Object.freeze({ ...this._pendingPost }) : null;
  }

  get imageQuery(): string {
    return this._imageQuery;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get lastActivity(): Date {
    return new Date(this._lastActivity);
  }

  get age(): number {
    return Date.now() - this._createdAt.getTime();
  }

  // Batch Review methods
  startBatchReview(batch: BatchReviewSession): void {
    if (this._state !== SessionState.IDLE) {
      throw new StateTransitionError(
        `Cannot start batch review from state: ${this._state}`,
        this._state,
        SessionState.BATCH_REVIEWING
      );
    }
    this._batchReview = batch;
    this._state = SessionState.BATCH_REVIEWING;
    this.touch();
  }

  addReaction(paperId: string, reaction: PaperReaction['reaction']): void {
    if (this._state !== SessionState.BATCH_REVIEWING || !this._batchReview) {
      throw new StateTransitionError(
        'Cannot add reaction: not in batch review mode',
        this._state,
        this._state
      );
    }

    this._batchReview.reactions.set(paperId, {
      paperId,
      reaction,
      timestamp: new Date(),
    });

    // Check if all papers have been reviewed
    const allReviewed = this._batchReview.items.every(
      item => this._batchReview!.reactions.has(item.paperId)
    );

    if (allReviewed) {
      this._batchReview.submitted = true;
      // Move to collecting comment for selected papers
      this._state = SessionState.COLLECTING_COMMENT;
      
      // Build selected items from reactions
      this._selectedItems = Array.from(this._batchReview.reactions.entries())
        .filter(([, r]) => r.reaction !== '⏭️') // Exclude skipped papers
        .map(([paperId]) => paperId);
    }

    this.touch();
  }

  skipBatchItem(paperId: string): void {
    this.addReaction(paperId, '⏭️');
  }

  getBatchReview(): BatchReviewSession | null {
    return this._batchReview ? { ...this._batchReview } : null;
  }

  isBatchComplete(): boolean {
    return this._batchReview?.submitted ?? false;
  }

  submitBatchReview(): void {
    if (!this._batchReview || !this._batchReview.submitted) {
      throw new StateTransitionError(
        'Cannot submit: batch review incomplete',
        this._state,
        SessionState.COLLECTING_COMMENT
      );
    }

    // State already updated when last reaction was added
    this._batchReview = null;
    this.touch();
  }

  // Serialization
  toData(): SessionData {
    return {
      chatId: this._chatId,
      state: this._state,
      papers: [...this._papers],
      news: [...this._news],
      selectedItems: [...this._selectedItems],
      userComment: this._userComment,
      pendingPost: this._pendingPost,
      imageQuery: this._imageQuery,
      batchReview: this._batchReview ? {
        ...this._batchReview,
        reactions: Array.from(this._batchReview.reactions.entries()),
      } : undefined,
      createdAt: new Date(this._createdAt),
      lastActivity: new Date(this._lastActivity),
    };
  }

  // Clone for immutability
  clone(): Session {
    return Session.fromData(this.toData());
  }
}

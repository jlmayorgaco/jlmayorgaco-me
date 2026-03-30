/**
 * Type-safe session states
 * Replaces string literals with enum
 */

export enum SessionState {
  IDLE = 'idle',
  BATCH_REVIEWING = 'batch_reviewing',
  COLLECTING_COMMENT = 'collecting_comment',
  PREVIEW_POST = 'preview_post',
  CONFIRMING_PUBLISH = 'confirming_publish',
}

export const isValidSessionState = (value: string): value is SessionState => {
  return Object.values(SessionState).includes(value as SessionState);
};

export const getSessionStateLabel = (state: SessionState): string => {
  const labels: Record<SessionState, string> = {
    [SessionState.IDLE]: 'Idle',
    [SessionState.BATCH_REVIEWING]: 'Batch Reviewing',
    [SessionState.COLLECTING_COMMENT]: 'Collecting Comment',
    [SessionState.PREVIEW_POST]: 'Preview Post',
    [SessionState.CONFIRMING_PUBLISH]: 'Confirming Publish',
  };
  return labels[state];
};

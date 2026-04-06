/**
 * Voice/Style Profiles
 * 
 * Writing profiles:
 * - tÃ©cnico formal
 * - LinkedIn profesional
 * - mÃ¡s crÃ­tico
 * - mÃ¡s pedagÃ³gico
 *
 * @module application/services/VoiceProfiles
 */

export type VoiceProfile = 'formal-technical' | 'linkedin-professional' | 'critical' | 'pedagogical';
export type AudienceMode = 'engineers' | 'researchers' | 'hiring-managers' | 'mixed';

export interface VoiceConfig {
  tone: string;
  vocabulary: string[];
  sentenceStructure: 'simple' | 'complex' | 'varied';
  emojis: boolean;
  technicalDepth: 'shallow' | 'medium' | 'deep';
  personalOpinion: boolean;
}

export const VOICE_CONFIGS: Record<VoiceProfile, VoiceConfig> = {
  'formal-technical': {
    tone: 'academic and precise',
    vocabulary: ['methodology', 'empirical', 'statistically', 'proposition', 'theorem'],
    sentenceStructure: 'complex',
    emojis: false,
    technicalDepth: 'deep',
    personalOpinion: false,
  },
  'linkedin-professional': {
    tone: 'professional and engaging',
    vocabulary: ['insights', 'learnings', 'highlights', 'key takeaways', 'perspective'],
    sentenceStructure: 'varied',
    emojis: true,
    technicalDepth: 'medium',
    personalOpinion: true,
  },
  'critical': {
    tone: 'analytical and questioning',
    vocabulary: ['however', 'concerns', 'limitations', 'caveats', 'counterpoints'],
    sentenceStructure: 'complex',
    emojis: false,
    technicalDepth: 'deep',
    personalOpinion: true,
  },
  'pedagogical': {
    tone: 'teaching and explanatory',
    vocabulary: ['essentially', 'in other words', 'let me explain', 'key concept', 'example'],
    sentenceStructure: 'simple',
    emojis: true,
    technicalDepth: 'medium',
    personalOpinion: false,
  },
};

export const AUDIENCE_CONFIGS: Record<AudienceMode, { focus: string[]; avoid: string[] }> = {
  'engineers': {
    focus: ['implementation details', 'code', 'architecture', 'tradeoffs'],
    avoid: ['pure theory without practical application', 'oversimplified explanations'],
  },
  'researchers': {
    focus: ['methodology', 'novel contributions', 'literature context', 'limitations'],
    avoid: ['oversimplification of research', 'missing citations'],
  },
  'hiring-managers': {
    focus: ['impact', 'scalability', 'team skills', 'business value'],
    avoid: ['too much technical jargon', 'unprofessional tone'],
  },
  'mixed': {
    focus: ['accessibility', 'key insights', 'actionable takeaways'],
    avoid: ['extreme depth', 'assumed knowledge'],
  },
};

export class VoiceProfileManager {
  private currentProfile: VoiceProfile = 'linkedin-professional';
  private currentAudience: AudienceMode = 'mixed';

  setProfile(profile: VoiceProfile): void {
    this.currentProfile = profile;
  }

  setAudience(audience: AudienceMode): void {
    this.currentAudience = audience;
  }

  getConfig(): { voice: VoiceConfig; audience: { focus: string[]; avoid: string[] } } {
    return {
      voice: VOICE_CONFIGS[this.currentProfile],
      audience: AUDIENCE_CONFIGS[this.currentAudience],
    };
  }

  transformContent(content: string): string {
    const config = this.getConfig();

    let transformed = content;

    if (!config.voice.emojis) {
      transformed = transformed.replace(/[^\x00-\x7F]/g, '');
    }

    if (config.voice.sentenceStructure === 'simple') {
      transformed = transformed.replace(/;/g, '.');
      transformed = transformed.replace(/,/g, '. ');
    }

    return transformed;
  }

  getSystemPrompt(): string {
    const config = this.getConfig();
    const voice = config.voice;
    const audience = config.audience;

    let prompt = `You are writing in a ${voice.tone} voice. `;
    prompt += `Use ${voice.sentenceStructure} sentence structure. `;
    prompt += `Technical depth: ${voice.technicalDepth}. `;

    prompt += `\n\nFocus on: ${audience.focus.join(', ')}. `;
    prompt += `Avoid: ${audience.avoid.join(', ')}.`;

    return prompt;
  }

  formatForTelegram(): string {
    const config = this.getConfig();
    
    let msg = `*Voice Profile*: ${this.currentProfile.replace('-', ' ')}\n`;
    msg += `*Audience*: ${this.currentAudience.replace('-', ' ')}\n\n`;
    msg += `Tone: ${config.voice.tone}\n`;
    msg += `Technical: ${config.voice.technicalDepth}`;
    
    return msg;
  }
}


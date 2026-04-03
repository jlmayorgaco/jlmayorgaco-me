/**
 * Security utilities for URL validation and SSRF protection
 *
 * @module shared/security
 */

import { z } from 'zod';

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254',
  'metadata.aws.internal',
  'instancemetadata.googleusercontent.com',
]);

const BLOCKED_PROTOCOLS = new Set(['file:', 'javascript:', 'data:', 'vbscript:']);

const BLOCKED_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const DANGEROUS_PORTS = new Set([22, 23, 25, 53, 110, 143, 445, 3389, 5900]);

const INJECTION_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /data:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /\$\{.*?\}/g,
  /\{\{.*?\}\}/g,
  /<%/g,
  /%>/g,
];

const PROMPT_INJECTION_MARKERS = [
  'ignore previous instructions',
  'ignore all instructions',
  'system prompt',
  'you are now',
  'you are a',
  'disregard',
  'forget everything',
  'new instructions',
  'override',
  'jailbreak',
  'dan',
  'developer mode',
  'root user',
  'admin mode',
];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUrl(urlString: string): UrlValidationResult {
  try {
    const url = new URL(urlString);

    if (BLOCKED_PROTOCOLS.has(url.protocol)) {
      return { valid: false, error: `Protocol '${url.protocol}' is not allowed` };
    }

    if (url.hostname === '' || url.hostname === 'null') {
      return { valid: false, error: 'Invalid hostname' };
    }

    if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
      return { valid: false, error: `Host '${url.hostname}' is blocked` };
    }

    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(url.hostname)) {
        return { valid: false, error: `Private IP range '${url.hostname}' is blocked` };
      }
    }

    const port = url.port ? parseInt(url.port, 10) : null;
    if (port !== null && DANGEROUS_PORTS.has(port)) {
      return { valid: false, error: `Port ${port} is not allowed` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateAndSanitizeUrl(urlString: string): string {
  const result = validateUrl(urlString);
  if (!result.valid) {
    throw new Error(`URL validation failed: ${result.error}`);
  }

  const url = new URL(urlString);
  return url.toString();
}

export interface PromptInjectionResult {
  safe: boolean;
  detected?: string;
}

export function detectPromptInjection(text: string): PromptInjectionResult {
  const lowerText = text.toLowerCase();

  for (const marker of PROMPT_INJECTION_MARKERS) {
    if (lowerText.includes(marker)) {
      return { safe: false, detected: marker };
    }
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, detected: 'injection pattern' };
    }
  }

  return { safe: true };
}

export function sanitizeForLLM(input: string): string {
  const cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe/gi, '')
    .replace(/<object/gi, '')
    .replace(/<embed/gi, '')
    .replace(/\$\{.*?\}/g, '')
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/<%/g, '')
    .replace(/%>/g, '')
    .slice(0, 10000);

  return cleaned;
}

export function wrapInInstruction(userInput: string, systemPrompt: string): string {
  const injectionCheck = detectPromptInjection(userInput);
  if (!injectionCheck.safe) {
    throw new Error(`Input blocked: potential prompt injection detected (${injectionCheck.detected})`);
  }

  return `System: ${systemPrompt}\n\nUser: ${sanitizeForLLM(userInput)}`;
}

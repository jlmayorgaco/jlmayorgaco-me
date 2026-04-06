#!/usr/bin/env node

/**
 * Health check endpoint for monitoring
 *
 * @module infrastructure/monitoring/HealthCheck
 */

import { loadConfig, validateEnvironment } from '../../config/index';
import { TelegramBot } from '../inbound/TelegramBot';
import { getGeminiCircuitStatus } from '../external/GeminiService';
import { validateGitSetup } from '../external/GitPublisher';
import { logError } from '../logging/Logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    telegram: { status: string; connected: boolean };
    gemini: { status: string; circuitState: string };
    git: { status: string; configured: boolean; errors?: string[] };
    environment: { status: string; valid: boolean; missing?: string[] };
  };
  metrics?: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
  };
}

async function healthCheck(): Promise<void> {
  const status: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.1',
    checks: {
      telegram: { status: 'unknown', connected: false },
      gemini: { status: 'unknown', circuitState: 'unknown' },
      git: { status: 'unknown', configured: false },
      environment: { status: 'unknown', valid: false },
    },
  };

  let allHealthy = true;

  const envCheck = validateEnvironment();
  status.checks.environment = {
    status: envCheck.valid ? 'ok' : 'error',
    valid: envCheck.valid,
    missing: envCheck.missing,
  };

  if (!envCheck.valid) {
    allHealthy = false;
    status.status = 'unhealthy';
  }

  try {
    const config = await loadConfig();
    const bot = new TelegramBot(config);
    const connected = await bot.testConnection();

    status.checks.telegram = {
      status: connected ? 'ok' : 'error',
      connected,
    };

    if (!connected) {
      allHealthy = false;
      status.status = 'degraded';
    }
  } catch (error) {
    status.checks.telegram = {
      status: 'error',
      connected: false,
    };
    allHealthy = false;
    status.status = 'degraded';
  }

  const geminiStatus = getGeminiCircuitStatus();
  status.checks.gemini = {
    status: geminiStatus.state === 'open' ? 'error' : 'ok',
    circuitState: geminiStatus.state,
  };

  if (geminiStatus.state === 'open') {
    allHealthy = false;
    status.status = 'degraded';
  }

  const gitStatus = await validateGitSetup();
  status.checks.git = {
    status: gitStatus.valid ? 'ok' : 'warning',
    configured: gitStatus.valid,
    errors: gitStatus.errors,
  };

  if (!gitStatus.valid) {
    status.status = status.status === 'healthy' ? 'degraded' : status.status;
  }

  status.metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  console.log(JSON.stringify(status, null, 2));

  process.exit(allHealthy ? 0 : 1);
}

healthCheck().catch(error => {
  logError('Health check failed', error);
  console.log(
    JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    }),
  );
  process.exit(1);
});

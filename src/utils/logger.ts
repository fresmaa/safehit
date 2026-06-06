export const logger = {
  log: (...args: any[]) => console.log('[SafeHit]', ...args),
  error: (...args: any[]) => console.error('[SafeHit]', ...args),
  warn: (...args: any[]) => console.warn('[SafeHit]', ...args),
};

logger.log('Logger initialized');

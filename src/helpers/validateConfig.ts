import { RetrieConfig } from '../types';

export function validateConfig(
  config: RetrieConfig = {},
): void {
  ([
    'maxRetries',
    'minTimeout',
    'maxTimeout',
  ] as unknown as (keyof RetrieConfig)[]).forEach((prop) => {
    const value = config[prop] as number;
    if (value !== undefined && value < 0 && !Number.isInteger(value)) {
      throw new Error(`Retrie: ${prop} must be a positive integer.`);
    }
  });

  if (config.backoff !== undefined && typeof config.backoff !== 'number' && config.backoff < 0) {
    throw new Error(`Retrie: backoff must be a positive number.`);
  }

  if (config.backoffType !== undefined && config.backoffType !== 'linear' && config.backoffType !== 'exponential') {
    throw new Error(`Retrie: backoffType must be either 'linear' or 'exponential'.`);
  }
}

// Types
import { Retrie, RetrieConfig, RetrieState } from './types';

// Utils
import sleep from './utils/sleep';

// Helpers
import { validateConfig } from './helpers/validateConfig';

export { Retrie, RetrieConfig, RetrieState };

export function retrie<T>(
  fn: (retrie: Retrie<T>) => T | Promise<T>,
  config: RetrieConfig = {},
): Retrie<T> {
  validateConfig(config);

  const settings = {
    maxRetries: config.maxRetries ?? 3,
    minTimeout: config.minTimeout ?? 1000,
    maxTimeout: config.maxTimeout ?? 60000,
    backoff: config.backoff ?? 100,
    backoffType: config.backoffType ?? 'linear',
  };

  const state: RetrieState<T> = {
    startedAt: Date.now(),
    cancelled: false,
    result: undefined,
    retries: 0,
    timeout: settings.minTimeout,
    finished: false,
    active: true,
  };

  const errors: Record<string, any> = {
    last: undefined,
  };

  const promiseInterface = {} as {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
  };

  let currentTimeout: NodeJS.Timeout | null = null;

  const promise = new Promise<T>(async (resolve, reject) => {
    promiseInterface.resolve = resolve;
    promiseInterface.reject = reject;

    // Await next processor tick so that retrie is defined.
    await sleep(0);


    // This is a do-while loop, so it will always run at least once.
    do {
      if (!state.active) return;
      try {
        // We need this up here because the retrie could have been cancelled during the sleep.
        
        const result = await fn(retrie);
        if (!state.active) return;

        state.result = { value: result, type: 'success' };
        state.finished = true;
        state.active = false;
        return resolve(result);
      } catch (error) {
        if (!state.active) return;
        errors.last = error;
        if (state.retries >= settings.maxRetries) {
          state.result = { error, type: 'error' };
          state.finished = true;
          state.active = false;
          return reject(error);
        }

        const timeout = state.timeout;
        state.timeout = Math.min(
          settings.maxTimeout,
          settings.backoffType === 'linear'
            ? timeout + settings.backoff
            : timeout * settings.backoff,
        );

        await sleep(timeout, (timeoutId) => currentTimeout = timeoutId);
        currentTimeout = null;
      }
    }
    // This chck is not necessary, aside from the increment, but is here
    // as an extra precaution for any code changes simply to avoid infinite loops.
    while (state.retries++ < settings.maxRetries);
  });

  function cancel(error?: any) {
    if (currentTimeout) clearTimeout(currentTimeout);
    if (!state.active) return;
    state.cancelled = true;
    state.finished = false;
    state.active = false;

    state.result = {
      error: error || errors.last || new Error('Cancelled.'),
      type: 'error',
    };

    promiseInterface.reject(state.result.error);
  }

  const retrie: Retrie<T> = {
    promise,
    cancel,
    get state() {
      return {
        ...state,
        result: state.result ? { ...state.result } : undefined,
      };
    },
  };

  return retrie;
}

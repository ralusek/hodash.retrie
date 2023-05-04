import { Retrie, RetrieConfig, RetrieState } from './types';

export function retrie<T>(
  fn: (retrie: Retrie<T>) => T | Promise<T>,
  config: RetrieConfig = {},
): Retrie<T> {
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

  const promise = new Promise<T>(async (resolve, reject) => {
    function rejectAndSetError(error: any, finished: boolean = false) {
      state.result = { error, type: 'error' };
      state.finished = finished;
      state.active = false;
      reject(error);
    }

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let lastError: any;

    // This is a do-while loop, so it will always run at least once.
    do {
      try {
        // We need this up here because the retrie could have been cancelled during the sleep.
        if (state.cancelled) return rejectAndSetError(lastError);
        const result = await fn(retrie);
        state.result = { value: result, type: 'success' };
        state.finished = true;
        state.active = false;
        return resolve(result);
      } catch (error) {
        lastError = error;
        if (state.cancelled) return rejectAndSetError(error);
        if (state.retries >= settings.maxRetries) return rejectAndSetError(error, true);

        const timeout = state.timeout;
        state.timeout = Math.min(
          settings.maxTimeout,
          settings.backoffType === 'linear'
            ? timeout + settings.backoff
            : timeout * settings.backoff,
        );

        await sleep(timeout);
      }
    }
    // This chck is not necessary, aside from the increment, but is here
    // as an extra precaution for any code changes simply to avoid infinite loops.
    while (state.retries++ < settings.maxRetries);
  });

  function cancel() {
    state.cancelled = true;
  }

  const retrie: Retrie<T> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
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

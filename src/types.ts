export type Retrie<T> = {
  then: Promise<T>['then'];
  catch: Promise<T>['catch'];
  finally: Promise<T>['finally'];
  promise: Promise<T>;
  cancel: () => void;
  state: RetrieState<T>;
};

export type RetrieConfig = {
  maxRetries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  backoff?: number;
  backoffType?: 'linear' | 'exponential';
};

export type RetrieState<T> = {
  startedAt: number;
  cancelled: boolean;
  result: { value: T, type: 'success' } | { error: any, type: 'error' } | undefined;
  retries: number;
  timeout: number;
  // Actually completed fully and did not cancel
  finished: boolean;
  // Whether the promise is still active. If finished OR cancelled, this is false.
  active: boolean;
};

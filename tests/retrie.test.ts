import { retrie } from '../src';

describe('retrie', () => {
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  it('should resolve immediately if the function is successful', async () => {
    const fn = jest.fn(() => Promise.resolve('success'));
    const retried = retrie(fn, { maxRetries: 3, minTimeout: 100 });
    const result = await retried;
    expect(result).toBe('success');
    expect(retried.state.result).toEqual({ value: 'success', type: 'success' });
    expect(retried.state.finished).toBe(true);
    expect(retried.state.active).toBe(false);
    expect(retried.state.retries).toBe(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry if the function fails', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('failure 1'))
      .mockRejectedValueOnce(new Error('failure 2'))
      .mockResolvedValue('success');
    const retried = retrie(fn, { maxRetries: 3, minTimeout: 100 });
    const result = await retried;
    expect(result).toBe('success');
    expect(retried.state.result).toEqual({ value: 'success', type: 'success' });
    expect(retried.state.finished).toBe(true);
    expect(retried.state.active).toBe(false);
    expect(retried.state.retries).toBe(2);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fail if max retries is reached', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('failure'));
    const retried = retrie(fn, { maxRetries: 3, minTimeout: 100 });
    await expect(retried).rejects.toThrow('failure');
    expect(retried.state.result).toEqual({ error: new Error('failure'), type: 'error' });
    expect(retried.state.finished).toBe(true);
    expect(retried.state.active).toBe(false);
    expect(retried.state.retries).toBe(3);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('should respect timeout between retries', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('failure 1'))
      .mockRejectedValueOnce(new Error('failure 2'))
      .mockResolvedValue('success');
    const retried = retrie(fn, { maxRetries: 3, minTimeout: 1000 });
    const startTime = Date.now();
    await retried.promise;
    const endTime = Date.now();
    // Expect at least 2 seconds delay (2 retries * 1000ms minTimeout)
    expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
  });

  it('should cancel retrying when cancel is called', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('failure'));
    const retried = retrie(fn, { maxRetries: 3, minTimeout: 1000 });
    setTimeout(() => retried.cancel(), 1500); // Cancel after 1.5 seconds
    await expect(retried.promise).rejects.toThrow('failure');
    // Since cancellation happened after the first retry but before the second, we expect 2 calls
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw a specific error if cancel is called with a value', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('failure'));
    const retried = retrie(fn, { maxRetries: 3, minTimeout: 1000 });
    setTimeout(() => retried.cancel(new Error('cancel')), 1500); // Cancel after 1.5 seconds
    await expect(retried.promise).rejects.toThrow('cancel');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

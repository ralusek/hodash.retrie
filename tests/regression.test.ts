import { retrie } from '../src/';

describe('regressions', () => {
  let firstCall: number;
  it('should always have a starting state of 0 retries', async () => {
    const result = retrie(async ({ cancel, state }) => {
      if (firstCall === undefined) firstCall = state.retries;
      throw new Error('failure');
    }, {
      maxRetries: 3,
      minTimeout: 100,
      maxTimeout: 1000,
      backoff: 200,
      backoffType: 'linear',
    });

    expect(result.state.retries).toBe(0);

    await result
    .catch(err => {
      expect(err.message).toBe('failure');
    });
  
    expect(firstCall).toBe(0);
    expect(result.state.retries).toBe(3);
  })
});

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ralusek/hodash.retrie/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/hodash.retrie.svg?style=flat)](https://www.npmjs.com/package/hodash.retrie)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ralusek/hodash.retrie/blob/master/LICENSE)

### What is a retrie?

A retrie is a retrier like you'd find from bluebird-retry or async-retry, but returns a modified promise that lets you track or cancel the retry process from both within the retry and externally. A good example of when this would be useful is if you have a case where you are reaching out to multiple data sources for something in a race scenario, and some data sources involve retries, this allows you to cancel the rest of them upon any succeeding.

# Installation
`npm install --save retrie`

# Usage
First, import retrie:

```ts
import { retrie } from 'hodash.retrie';
```

You can then use retrie to create a retried operation:

```ts
const operation = () => fetch('https://api.example.com/data');
const retried = retrie(operation, { maxRetries: 3, minTimeout: 1000 });
```

This creates a new operation that will be retried up to 3 times, with a minimum delay of 1000 milliseconds between attempts.

The retried object has a promise property containing the promise for the resolution of its function.

```ts
const result = await retried.promise;

// or

retried.promise
.then((result) => {})
.catch(err => {});
```

### Canceling
You can cancel a retry process from happening from within your function or from outside.

```ts
// From outside
const retried = retrie(operation, { maxRetries: 3, minTimeout: 1000 });
retried.cancel();

// From inside

retrie(({ cancel, retries }) => {
  // Maybe something happened where in this particular case, after n retries, we cancel early
  if (retries > 3 && thingHappened) cancel();
});

// Specific cancel error
retrie(({ cancel, retries }) => {
  // We can pass cancel an error that will be thrown in place of the last error the retrie encountered.
  if (retries > 3 && thingHappened) cancel(new Error('Special error));
});
```

## Scenario

### Race Scenario

Consider a scenario where you are reaching out to multiple data sources in a race scenario. If any of the sources resolve successfully, you might want to cancel the rest:

```ts
const source1 = retrie(fetchDataFromSource1, { maxRetries: 3, minTimeout: 1000 });
const source2 = retrie(fetchDataFromSource2, { maxRetries: 3, minTimeout: 1000 });

const result = await Promise.race([source1.promise, source2.promise])
.catch(err => {}); // Swallow any errors from race failures

// Cancel any active retries (the "winner" will be unaffected)
source1.cancel();
source2.cancel();
```

# Contributing
We welcome contributions! Please see our contributing guidelines for more information.

# License
MIT

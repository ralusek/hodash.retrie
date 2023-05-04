<## retrie: It's ex-retrie cool!

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ralusek/retrie/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/retrie.svg?style=flat)](https://www.npmjs.com/package/retrie)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ralusek/retrie/blob/master/LICENSE)

### What is a retrie?

A retrie is a retrier like you'd find from bluebird-retry or async-retry, but returns a modified promise that lets you track or cancel the retry process from both within the retry and externally. A good example of when this would be useful is if you have a case where you are reaching out to multiple data sources for something in a race scenario, and some data sources involve retries, this allows you to cancel the rest of them upon any succeeding.

# Installation
`npm install --save retrie`

# Examples


# Contributing
We welcome contributions! Please see our contributing guidelines for more information.

# License
MIT

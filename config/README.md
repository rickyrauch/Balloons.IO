# Balloons.IO Configuration

There are two methods allowed for configuration: `environment` variables or writing a `config.json` file.

## Inheritance

1. Environment (`env.js`)
2. `config.json`


The above list means that `environment` configuration variables will override those from `config.json` file.

## Install

### From file

1. Copy `config.sample.json` to `config.json`.
2. Set Twitter and/or Facebook application keys. Check README.md for a detailed description on this.
3. Run `node balloons.js` at the root of this application.

### From environment variables

1. Define your variables like this: `PORT=8000`
2. Run `node balloons.js` at the root of this application.

There are different ways to define environment variables with node. Use the one that fits you best.

## Notes

1. We should have a `default.js` in the config inheritance. With this we may free `env.js` from all the `this || that` ugly definitions.
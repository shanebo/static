# Static

Middleware for Dylan which serves static assets.

## Install

`npm install @dylan/static`

## Usage

``` js
const dylan = require('dylan');
const static = require('@dylan/static');
const app = dylan();
const isDev = process.env.NODE_ENV === 'development';

app.use(static('path/to/assets/dir', {
  buildWait: isDev ? 2000 : 0,
  cacheControl: isDev ? 'no-cache' : 'max-age=31536000, public, immutable'
}));
```

# Static

Middleware for Dylan which serves static assets.

## Install

`npm install @dylan/static`

## Usage

``` js
const dylan = require('dylan');
const static = require('@dylan/static');
const app = dylan();

app.use(static('path/to/assets/dir', {
  cacheControl: 'max-age=31536000, public, immutable'
}));
```

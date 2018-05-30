# Static

Middleware for Dylan which serves static assets.

## Install

`npm install @dylanjs/static`

## Usage

``` js
const dylan = require('dylan');
const static = require('@dylanjs/static');
const app = dylan();
app.use(static('path/to/assets/dir'));
```

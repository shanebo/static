const fs = require('fs');
const traversy = require('traversy');
const mime = require('mime');
const zlib = require('zlib');
const { resolve } = require('path');


const buildAsset = (path, cacheControl) => {
  const body = fs.readFileSync(path);
  const buffer = zlib.gzipSync(body);
  return {
    buffer,
    headers: {
      ...cacheControl && {
        'Cache-Control': cacheControl
      },
      'Content-Encoding': 'gzip',
      'Content-Length': buffer.length,
      'Content-Type': mime.getType(path),
      'Vary': 'Accept-Encoding'
      // 'Last-Modified': fs.statSync(path).mtime.toUTCString(),
      // Expires: Mon, 25 Jun 2013 21:31:12 GMT
    }
  };
}

const cacheAssets = (root, cache, cacheControl) => {
  const filterNonDotFiles = '\/[^\.][^\/]+$';

  traversy(root, filterNonDotFiles, (path) => {
    const keyRegex = new RegExp(`^${root}`);
    const key = path.replace(keyRegex, '');
    cache[key] = buildAsset(path, cacheControl);
  });
}

module.exports = (dir, cacheControl, buildWait = 0) => {
  const cache = {};
  const root = resolve(dir);

  buildWait
    ? setTimeout(cacheAssets.bind(null, root, cache, cacheControl), buildWait)
    : cacheAssets(root, cache, cacheControl);

  return (req, res, next) => {
    const asset = cache[req.pathname];

    if (req.method === 'GET' && asset) {
      asset.headers.Date = new Date().toUTCString();
      res.writeHead(200, asset.headers);
      res.end(asset.buffer);
    } else {
      next();
    }
  }
}

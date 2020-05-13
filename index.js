const fs = require('fs');
const traversy = require('traversy');
const mime = require('mime');
const zlib = require('zlib');
const { resolve } = require('path');

module.exports = (dir) => {
  const cache = {};
  const root = resolve(dir);
  const filterNonDotFiles = '\/[^\.][^\/]+$';

  const buildAsset = (path) => {
    // const mtime = fs.statSync(path).mtime.toUTCString();
    const body = fs.readFileSync(path);
    const buffer = zlib.gzipSync(body);
    return {
      buffer,
      headers: {
        'Cache-Control': 'max-age=31536000, public',
        'Content-Encoding': 'gzip',
        'Content-Length': buffer.length,
        'Content-Type': mime.getType(path),
        'Vary': 'Accept-Encoding'
        // 'Last-Modified': mtime,
        // Expires: Mon, 25 Jun 2013 21:31:12 GMT
      }
    };
  }

  traversy(root, filterNonDotFiles, (path) => {
    const keyRegex = new RegExp(`^${root}`);
    const key = path.replace(keyRegex, '');
    cache[key] = buildAsset(path);
  });

  return (req, res, next) => {
    const asset = cache[req.pathname];

    if (req.method === 'GET' && asset) {
      asset.headers.Date = new Date().toUTCString();
      res.writeHead(200, asset.headers);
      res.end(asset.buffer);
      // fs.createReadStream(join(root, req.pathname)).pipe(res);
    } else {
      next();
    }
  }
}

const fs = require('fs');
const traversy = require('traversy');
const mime = require('mrmime');
const zlib = require('zlib');
const { join, resolve } = require('path');


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
      'Content-Type': mime.lookup(path)
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

module.exports = (dir, { cacheControl } = {}) => {
  const cache = {};
  const root = resolve(dir);
  const notDev = process.env.NODE_ENV !== 'development';

  if (notDev) {
    cacheAssets(root, cache, cacheControl);
  }

  return (req, res, next) => {
    const { method, pathname } = req;

    if (method !== 'GET') {
      next();
    } else if (notDev) {
      const asset = cache[pathname];

      if (asset) {
        const vary = res.get('Vary');
        asset.headers.Vary = vary ? `Accept-Encoding, ${vary}` : 'Accept-Encoding';
        asset.headers.Date = new Date().toUTCString();
        res.writeHead(200, asset.headers);
        res.end(asset.buffer);
      } else {
        next();
      }
    } else {
      const path = join(root, pathname);

      if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {
        res.status(200)
          .set('Date', new Date().toUTCString())
          .set('Content-Type', mime.lookup(pathname))
          .set('Cache-Control', 'no-cache');
        fs.createReadStream(path).pipe(res);
      } else {
        next();
      }
    }
  }
}

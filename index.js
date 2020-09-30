const fs = require('fs');
const traversy = require('traversy');
const mime = require('mime');
const zlib = require('zlib');
const { resolve } = require('path');


const buildAsset = (path, browserCaching = true) => {
  const body = fs.readFileSync(path);
  const buffer = zlib.gzipSync(body);
  return {
    buffer,
    headers: {
      'Cache-Control': browserCaching ? 'max-age=31536000, public' : 'no-cache',
      'Content-Encoding': 'gzip',
      'Content-Length': buffer.length,
      'Content-Type': mime.getType(path),
      'Vary': 'Accept-Encoding'
      // 'Last-Modified': fs.statSync(path).mtime.toUTCString(),
      // Expires: Mon, 25 Jun 2013 21:31:12 GMT
    }
  };
}

const cacheAssets = (root, cache, browserCaching) => {
  const filterNonDotFiles = '\/[^\.][^\/]+$';

  traversy(root, filterNonDotFiles, (path) => {
    const keyRegex = new RegExp(`^${root}`);
    const key = path.replace(keyRegex, '');
    cache[key] = buildAsset(path, browserCaching);
  });
}

module.exports = (dir, wait = 0) => {
  const cache = {};
  const root = resolve(dir);

  wait
    ? setTimeout(cacheAssets.bind(null, root, cache, false), wait)
    : cacheAssets(root, cache, true);

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


// const { resolve, join } = require('path');

// module.exports = (dir, cacheOn = true) => {
//   const cache = {};
//   const root = resolve(dir);
//   const filterNonDotFiles = '\/[^\.][^\/]+$';

//   if (cacheOn) {
//     traversy(root, filterNonDotFiles, (path) => {
//       const keyRegex = new RegExp(`^${root}`);
//       const key = path.replace(keyRegex, '');
//       cache[key] = buildAsset(path);
//     });
//   }

//   return (req, res, next) => {
//     const asset = cache[req.pathname];

//     if (req.method !== 'GET' || req.pathname === '/') {
//       next();
//       return;
//     }

//     if (asset) {
//       asset.headers.Date = new Date().toUTCString();
//       res.writeHead(200, asset.headers);
//       res.end(asset.buffer);
//     } else if (!cacheOn) {
//       const filePath = join(root, req.pathname);

//       if (fs.existsSync(filePath)) {
//         res
//           .status(200)
//           .set('Cache-Control', 'no-cache')
//           .set('Date', new Date().toUTCString())
//           .set('Content-Type', mime.getType(req.pathname));

//         fs.createReadStream(filePath).pipe(res);
//       } else {
//         next();
//       }
//     } else {
//       next();
//     }
//   }
// }

const fs = require('fs');
const path = require('path');
const log = require('@vladmandic/pilogger');
const metadata = require('./metadata.js');

function api(app) {
  log.state('RESTful API ready');
  metadata.init();

  app.get('/api/log', (req, res) => {
    res.status(200).send('true');
    const msg = decodeURI(req.query.msg || '').replace(/\s+/g, ' ');
    log.info(`Client ${req.session.user}@${req.ip}`, msg);
  });

  app.get('/api/shares', async (req, res) => {
    if (req.session.share) res.json([]);
    else {
      let shares = await global.db.find({ images: { $exists: true } });
      if (!shares) shares = [];
      const data = shares.map((a) => ({ key: a.share, processed: a.processed, name: a.name, creator: a.creator, size: a.images.length }));
      res.json(data);
    }
  });

  app.get('/api/share', async (req, res) => {
    if (req.query.id) {
      const data = await global.db.findOne({ share: req.query.id });
      const images = [];
      for (const image of data.images) {
        images.push(await global.db.findOne({ image }));
      }
      log.info(`API Share Get ${req.ip} creator: ${data.creator} name: "${data.name}" key: ${data.share} images: ${images.length}`);
      res.json(images);
    } else if (req.query.rm) {
      const data = await global.db.findOne({ share: req.query.rm });
      log.info(`API Share Remove ${req.ip} ${data.creator} name: "${data.name}" key: ${data.share} images: ${data.images.length}`);
      global.db.remove({ share: data.share }, { multi: false });
      res.status(200).send('true');
    } else {
      res.status(400).json([]);
    }
  });

  app.post('/api/share', (req, res) => {
    if (req.session.admin) {
      const data = req.body;
      const obj = {};
      obj.creator = data.creator;
      obj.name = data.name;
      obj.processed = new Date();
      obj.images = data['images[]'];
      obj.share = parseInt(obj.processed.getTime() / 1000, 10).toString(36);
      global.db.update({ share: obj.share }, obj, { upsert: true });
      log.info(`API Share Create: "${obj.name}" key: ${obj.share} creator: ${obj.creator} images: `, obj.images.length);
      res.status(200).json({ key: obj.share });
    } else {
      res.status(401).json({});
    }
  });

  app.get('/api/list', async (req, res) => {
    if (req.session.admin) {
      const list = [];
      let filesAll = [];
      for (const location of global.config.locations) {
        const folder = await metadata.list(location.folder, location.match, location.recursive, location.force);
        list.push({ location, files: folder.process });
        filesAll = [...filesAll, ...folder.files];
      }
      res.json(list);
      metadata.check(filesAll);
    } else {
      res.status(401).json([]);
    }
  });

  app.get('/api/dir', async (req, res) => {
    if (req.session.admin) {
      if (!req.query.folder) {
        res.status(400).json([]);
        return;
      }
      const folder = await metadata.list(req.query.folder, '', true, true);
      res.json(folder.process);
    } else {
      res.status(401).json([]);
    }
  });

  app.get('/api/get', async (req, res) => {
    if (!req.query.find) {
      res.status(400).json([]);
      return;
    }
    const data = [];
    if (!req.session.share || req.session.share === '') {
      const root = new RegExp(`^${req.session.root || 'media/'}`);
      const limit = req.query.limit || global.config.server.resultsLimit;
      const time = req.query.time ? new Date(parseInt(req.query.time, 10)) : new Date(0);
      const records = await global.db
        .find({ image: root, processed: { $gte: time } })
        .sort({ processed: -1 })
        .limit(limit);
      for (const record of records) data.push(record);
      log.info(`API Get ${req.session.user}@${req.ip} root: ${req.session.root} data:`, data.length, 'limit:', limit, 'since:', new Date(time));
    } else {
      const records = await global.db.findOne({ share: req.session.share });
      for (const image of records.images) {
        data.push(await global.db.findOne({ image }));
      }
      log.info(`API Share Get ${req.ip} creator: ${data.creator} name: "${data.name}" key: ${data.share} images: ${data.length}`);
    }
    res.set('content-Size', JSON.stringify(data).length);
    res.json(data);
  });

  app.post('/api/metadata', async (req, res) => {
    if (req.session.admin) {
      const data = req.body;
      const exif = await metadata.exif(data.image);
      const hash = await metadata.hash(data.image, 'sha256');
      const location = await metadata.location(exif);
      const descriptions = await metadata.descriptions(data);
      const result = { ...data, exif, location, descriptions, hash };
      const tags = await metadata.tags(result);
      result.tags = tags;
      res.status(200).json(result);
      metadata.store(result);
    } else {
      res.status(401).json({});
    }
  });

  app.get('/api/user', (req, res) => {
    res.json({ user: req.session.user, admin: req.session.admin, root: req.session.root });
  });

  app.get(`${global.config.server.mediaRoot}/*`, async (req, res) => {
    const fileName = decodeURI(req.url);
    if (fileName.startsWith('/')) fileName.substr(1);
    if (!fileName.startsWith(req.session.root)) {
      res.sendStatus(401);
      return;
    }
    if (!fs.existsSync(fileName)) {
      res.sendStatus(404);
      return;
    }
    const stat = fs.statSync(fileName);
    const fileSize = stat.size;
    const splitName = fileName.split('.');
    const fileExt = splitName[splitName.length - 1].toLowerCase();
    const share = req.session.share ? 'Share: ' + req.session.share : '';
    log.info(`API File: ${share} ${req.session.share ? '' : req.session.user}@${req.ip} ${fileName} ${fileSize} bytes`);
    let contentType;
    if (fileExt === 'jpeg' || fileExt === 'jpg') contentType = 'image/jpeg';
    if (fileExt === 'mp4') contentType = 'video/mp4';
    if (contentType && req.headers.range) {
      const parts = req.headers.range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      fs.createReadStream(fileName, { start, end }).pipe(res);
    } else if (contentType) {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(fileName).pipe(res);
    } else {
      res.sendFile(fileName, { root: path.join(__dirname, '../') });
    }
  });

  app.post('/api/auth', (req, res) => {
    req.session.user = undefined;
    // if (!req.body.authEmail || req.body.authEmail === '') req.session.user = undefined;
    let email;
    let passwd;
    if (req.body.authShare) {
      email = 'share@pigallery.ddns.net';
      passwd = 'd1ff1cuTpa33w0RD';
    } else {
      email = req.body.authEmail;
      passwd = req.body.authPassword;
    }
    const found = global.config.users.find((a) => ((a.email && a.email === email) && (a.passwd && a.passwd === passwd) && (a.disabled ? a.disabled === 'false' : true)));
    if (found) {
      req.session.user = found.email;
      req.session.admin = found.admin;
      req.session.root = found.mediaRoot;
      req.session.share = req.body.authShare;
    }
    log.info(`API Login: ${email} from ${req.ip} ${req.session.user ? 'success' : 'fail'}`);
    res.redirect('/');
  });
}

exports.init = api;

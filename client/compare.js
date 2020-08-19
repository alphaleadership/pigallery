const tf = require('@tensorflow/tfjs');
// const tf = require('/home/vlado/dev/tensorflow@1.7.4/tfjs-core');
// const tf = require('/home/vlado/dev/tensorflow@2.3.0/tfjs-core/dist/index.js');
// const tf = faceapi.tf;
const faceapi = require('@vladmandic/face-api');
const log = require('./log.js');
const config = require('./config.js').default;
const modelClassify = require('./modelClassify.js');
const modelDetect = require('./modelDetect.js');
const modelYolo = require('./modelYolo.js');
const processImage = require('./processImage.js');

const models = [];
window.cache = [];

async function init() {
  const res = await fetch('/api/user');
  if (res.ok) window.user = await res.json();
  if (window.user && window.user.user) {
    $('#btn-user').toggleClass('fa-user-slash fa-user');
    $('#user').text(window.user.user.split('@')[0]);
    log.state(`Logged in: ${window.user.user} root:${window.user.root} admin:${window.user.admin}`);
    if (!window.user.admin) $('#btn-update').css('color', 'gray');
  } else {
    window.location = '/client/auth.html';
  }
  log.state(`TensorFlow/JS Version: ${tf.version_core}`);
  // eslint-disable-next-line no-console
  await tf.setBackend(config.backEnd);
  await tf.enableProdMode();
  tf.ENV.set('DEBUG', false);
  if (!config.floatPrecision) await tf.webgl.forceHalfFloat();
  const f = `float Precision: ${config.floatPrecision ? '32bit' : '16bit'}`;
  log.state(`Configuration: backend: ${tf.getBackend().toUpperCase()} parallel processing: ${config.batchProcessing} image resize: ${config.maxSize}px shape: ${config.squareImage ? 'square' : 'native'} ${f}`);
  log.state(`Features: ${JSON.stringify(tf.ENV.features)}`);
  // eslint-disable-next-line no-console
  console.log(tf.ENV.features);
}

async function loadClassify(options) {
  let engine;
  const stats = {};
  stats.time0 = window.performance.now();
  engine = await tf.engine();
  stats.bytes0 = engine.state.numBytes;
  stats.tensors0 = engine.state.numTensors;

  const model = await modelClassify.load(options);
  engine = await tf.engine();
  stats.time1 = window.performance.now();
  stats.bytes1 = engine.state.numBytes;
  stats.tensors1 = engine.state.numTensors;

  stats.size = Math.round((stats.bytes1 - stats.bytes0) / 1024 / 1024);
  stats.tensors = Math.round(stats.tensors1 - stats.tensors0);
  stats.time = Math.round(stats.time1 - stats.time0);
  models.push({ name: options.name, stats, model });
  log.state(`Loaded model: ${options.name}  in ${stats.time.toLocaleString()} ms ${stats.size.toLocaleString()} MB ${stats.tensors.toLocaleString()} tensors`);
}

async function loadDetect(options) {
  let engine;
  const stats = {};
  stats.time0 = window.performance.now();
  engine = await tf.engine();
  stats.bytes0 = engine.state.numBytes;
  stats.tensors0 = engine.state.numTensors;

  const model = await modelDetect.load(options);
  engine = await tf.engine();
  stats.time1 = window.performance.now();
  stats.bytes1 = engine.state.numBytes;
  stats.tensors1 = engine.state.numTensors;

  stats.size = Math.round((stats.bytes1 - stats.bytes0) / 1024 / 1024);
  stats.tensors = Math.round(stats.tensors1 - stats.tensors0);
  stats.time = Math.round(stats.time1 - stats.time0);
  models.push({ name: options.name, stats, model });
  log.state(`Loaded model: ${options.name}  in ${stats.time.toLocaleString()} ms ${stats.size.toLocaleString()} MB ${stats.tensors.toLocaleString()} tensors`);
}

async function match(file) {
  const image = window.cache.find((a) => a.file === file);
  log.state('Building face descriptors');
  const sorted = window.cache
    .map((a) => {
      a.descriptor = (a.results[0] && a.results[0].data[0] && a.results[0].data[0].descriptor) ? a.results[0].data[0].descriptor : null;
      a.match = a.descriptor ? 1 - faceapi.euclideanDistance(image.results[0].data[0].descriptor, a.descriptor) : 0;
      return a;
    })
    .filter((a) => a.match > 0.46)
    .sort((a, b) => b.match - a.match);
  // eslint-disable-next-line no-console
  for (const item of sorted) console.log(`${item.file} ${Math.round(100 * item.match)} % ${JSON.stringify(item.descriptor || {}).length}`);
}

async function print(file, image, results) {
  window.cache.push({ file, results });
  let text = '';
  let all = [];
  for (const model of results) {
    let classified = model.model.name || model.model;
    all = all.concat(model.data);
    for (const res of model.data) {
      if (res.score && res.class) classified += ` | ${Math.round(res.score * 100)}% ${res.class}`;
      if (res.age && res.gender) classified += ` | gender: ${Math.round(100 * res.genderProbability)}% ${res.gender} age: ${res.age.toFixed(1)}`;
      if (res.expression) {
        const emotion = Object.entries(res.expressions).reduce(([keyPrev, valPrev], [keyCur, valCur]) => (valPrev > valCur ? [keyPrev, valPrev] : [keyCur, valCur]));
        classified += ` emotion: ${emotion[1]}% ${emotion[0]}`;
      }
    }
    text += `${classified}<br>`;
  }
  const found = [];
  all = all
    .sort((a, b) => b.score - a.score)
    .filter((a) => {
      if (found.includes(a.class)) return false;
      found.push(a.class);
      return true;
    });
  let combined = 'Combined';
  for (const res of all) {
    combined += ` | ${Math.round(res.score * 100)}% ${res.class}`;
  }
  const item = document.createElement('div');
  item.className = 'listitem';
  item.innerHTML = `
    <div class="col thumbnail">
      <img class="thumbnail" src="${image.thumbnail}" align="middle" tag="${file}">
    </div>
    <div class="col description">
      <p class="listtitle">${file}</p>
      ${combined}<br>
      ${text}
    </div>
  `;
  $('#results').append(item);
}

async function redraw() {
  $('#results').html('');
  for (const item of window.cache) await print(item.file, item.image, item.results);
}

async function classify() {
  log.state('Loading models ...');
  // console.table('Clean', tf.memory());
  // await loadClassify({ name: 'ImageNet MobileNet v1', modelPath: '/models/mobilenet-v1/model.json', score: 0.2, topK: 3 });
  await loadClassify({ name: 'ImageNet MobileNet v2', modelPath: '/models/mobilenet-v2/model.json', score: 0.2, topK: 3 });
  // await loadClassify({ name: 'ImageNet Inception v1', modelPath: 'models/inception-v1/model.json', score: 0.2, topK: 3 });
  // await loadClassify({ name: 'ImageNet Inception v2', modelPath: 'models/inception-v2/model.json', score: 0.2, topK: 3 });
  await loadClassify({ name: 'ImageNet Inception v3', modelPath: 'models/inception-v3/model.json', score: 0.2, topK: 3 });
  await loadClassify({ name: 'ImageNet Inception v4', modelPath: 'models/inception-v4/model.json', score: 0.22, topK: 3, useFloat: false, tensorSize: 299, scoreScale: 200 });
  // await loadClassify({ name: 'ImageNet ResNet v2-50', modelPath: '/models/resnet-v2-50/model.json', score: 0.2, topK: 3, tensorSize: 224 });
  // await loadClassify({ name: 'ImageNet ResNet v2-101', modelPath: '/models/resnet-v2-101/model.json', score: 0.2, topK: 3 });
  // await loadClassify({ name: 'ImageNet Inception-ResNet v2', modelPath: '/models/inception-resnet-v2/model.json', score: 0.2, topK: 3, tensorSize: 224 });
  // await loadClassify({ name: 'ImageNet NASNet-A Mobile', modelPath: 'models/nasnet-mobile/model.json', score: 0.2, topK: 3, slice: 0 });
  // await loadClassify({ name: 'ImageNet EfficientNet B0', modelPath: 'models/efficientnet-b0/model.json', score: 0.2, topK: 3, slice: 0, tensorSize: 224, offset: 0 });
  await loadClassify({ name: 'ImageNet EfficientNet B4', modelPath: 'models/efficientnet-b4/model.json', score: 0.1, topK: 3, slice: 0, tensorSize: 380, offset: 0, scoreScale: 1 });
  // await loadClassify({ name: 'ImageNet EfficientNet B5', modelPath: 'models/efficientnet-b5/model.json', score: 0.2, topK: 3, slice: 0, tensorSize: 456, offset: 0 });
  // await loadClassify({ name: 'ImageNet EfficientNet B7', modelPath: 'models/efficientnet-b7/model.json', score: 0.2, topK: 3, slice: 0, tensorSize: 600, offset: 0 });
  // await loadClassify({ name: 'ImageNet-21k BiT-S R101x1', modelPath: 'models/bit-s-r101x1/model.json', score: 0.2, topK: 3, slice: 0, tensorSize: 224, offset: 1, classes: 'assets/ImageNet-Labels21k.json' });
  // await loadClassify({ name: 'ImageNet-21k BiT-M R101x1', modelPath: 'models/bit-m-r101x1/model.json', score: 0.2, topK: 3, slice: 0, tensorSize: 224, offset: 1, classes: 'assets/ImageNet-Labels21k.json' });
  // await loadClassify({ name: 'DeepDetect Inception v3', modelPath: 'models/deepdetect-6k/model.json', score: 0.1, topK: 5, useFloat: false, tensorSize: 299, scoreScale: 1000, classes: 'assets/DeepDetect-Labels.json', offset: 0 });
  // await loadClassify({ name: 'iNaturalist Food MobileNet v1', modelPath: 'models/inaturalist/food/model.json', score: 0.38, scoreScale: 500, topK: 1, useFloat: false, tensorSize: 192, classes: 'assets/iNaturalist-Food-Labels.json', offset: 0 });
  // await loadClassify({ name: 'iNaturalist Plants MobileNet v2', modelPath: 'models/inaturalist/plants/model.json', score: 0.2, scoreScale: 200, topK: 1, useFloat: false, tensorSize: 224, classes: 'assets/iNaturalist-Plants-Labels.json', offset: 0, background: 2101 });
  // await loadClassify({ name: 'iNaturalist Birds MobileNet v2', modelPath: 'models/inaturalist/birds/model.json', score: 0.25, scoreScale: 200, topK: 1, useFloat: false, tensorSize: 224, classes: 'assets/iNaturalist-Birds-Labels.json', offset: 0, background: 964 });
  // await loadClassify({ name: 'iNaturalist Insects MobileNet v2', modelPath: 'models/inaturalist/insects/model.json', score: 0.3, scoreScale: 200, topK: 1, useFloat: false, tensorSize: 224, classes: 'assets/iNaturalist-Insects-Labels.json', offset: 0, background: 1021 });
  await loadClassify({ name: 'NSFW Inception v3', modelPath: 'models/nsfw-inception-v3/model.json', score: 0.7, topK: 4, scoreScale: 2, slice: 0, tensorSize: 299, offset: 0, modelType: 'layers', classes: 'assets/NSFW-Labels.json' });
  // console.table('Loaded', tf.memory());

  log.state('Warming up ...');
  const warmup = await processImage.getImage('assets/warmup.jpg');
  await modelClassify.classify(models[0].model, warmup.canvas);
  // console.table('Warmed up', tf.memory());

  const api = await fetch('/api/dir?folder=Samples/Objects/');
  // const api = await fetch('/api/dir?folder=Samples/NSFW/');
  const files = await api.json();
  log.state(`Received list from server: ${files.length} images`);

  const stats = [];
  // eslint-disable-next-line no-unused-vars
  for (const m in models) stats.push(0);

  // eslint-disable-next-line no-console
  console.table('Starting', tf.memory());
  for (const file of files) {
    const results = [];
    const image = await processImage.getImage(file);
    for (const m in models) {
      log.dot();
      const t0 = window.performance.now();
      const data = await modelClassify.classify(models[m].model, image.canvas);
      const t1 = window.performance.now();
      stats[m] += (t1 - t0);
      results.push({ model: models[m], data });
    }
    print(file, image, results);
  }
  log.state('');
  // eslint-disable-next-line no-console
  console.table('Finished', tf.memory());
  for (const m in models) {
    log.state(`${models[m].name}: ${Math.round(stats[m]).toLocaleString()} ms / ${Math.round(stats[m] / files.length)} avg`);
  }
}

// eslint-disable-next-line no-unused-vars
async function yolo() {
  log.state('Loading models ...');
  const yolov1tiny = await modelYolo.v1tiny();
  const yolov2tiny = await modelYolo.v2tiny();
  const yolov3tiny = await modelYolo.v3tiny();
  const yolov3full = await modelYolo.v3();

  const api = await fetch('/api/dir?folder=Samples/Objects/');
  const files = await api.json();
  log.state(`Received list from server: ${files.length} images`);

  const stats = [];
  // eslint-disable-next-line no-unused-vars
  for (const m in models) stats.push(0);
  let data;
  // eslint-disable-next-line no-console
  console.table('Starting', tf.memory());
  for (const file of files) {
    const results = [];
    const image = await processImage.getImage(file);
    log.dot();
    data = await yolov1tiny.predict(image.canvas);
    results.push({ model: 'CoCo DarkNet/Yolo v1 Tiny', data });
    data = await yolov2tiny.predict(image.canvas);
    results.push({ model: 'CoCo DarkNet/Yolo v2 Tiny', data });
    data = await yolov3tiny.predict(image.canvas);
    results.push({ model: 'CoCo DarkNet/Yolo v3 Tiny', data });
    data = await yolov3full.predict(image.canvas);
    results.push({ model: 'CoCo DarkNet/Yolo v1 Full', data });
    print(file, image, results);
  }
  log.state('');
}

// eslint-disable-next-line no-unused-vars
async function person() {
  log.state(`FaceAPI version: ${faceapi.tf.version_core}`);
  log.state('Loading models ...');

  let engine;
  let stats = {};
  stats.time0 = window.performance.now();
  engine = await tf.engine();
  stats.bytes0 = engine.state.numBytes;
  stats.tensors0 = engine.state.numTensors;

  const options = [];
  options[0] = { name: 'FaceAPI Tiny', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'tinyFaceDetector' };
  // options[1] = { name: 'FaceAPI SSD/MobileNet v1', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'ssdMobilenetv1' };
  // options[2] = { name: 'FaceAPI MTCNN', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'mtcnn' };
  // options[3] = { name: 'FaceAPI Yolo v2', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'tinyYolov2' };

  if (options[0]) await faceapi.nets.tinyFaceDetector.load(options[0].modelPath);
  if (options[1]) await faceapi.nets.ssdMobilenetv1.load(options[1].modelPath);
  if (options[2]) await faceapi.nets.mtcnn.load(options[2].modelPath);
  if (options[3]) await faceapi.nets.tinyYolov2.load(options[1].modelPath);

  await faceapi.nets.ageGenderNet.load(options[0].modelPath);
  await faceapi.nets.faceLandmark68Net.load(options[0].modelPath);
  await faceapi.nets.faceRecognitionNet.load(options[0].modelPath);
  await faceapi.nets.faceExpressionNet.load(options[0].modelPath);

  if (options[0]) options[0].face = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3, inputSize: 416 });
  if (options[1]) options[1].face = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3, maxResults: 5 });
  if (options[2]) options[2].face = new faceapi.MtcnnOptions({ scoreThreshold: 0.3 }); // minFaceSize, scaleFactor, maxNumScales, scoreThresholds, scaleSteps
  if (options[3]) options[3].face = new faceapi.TinyYolov2Options({ minConfidence: 0.5, maxResults: 5, scoreThreshold: 0.5, minFaceSize: 100, scaleFactor: 0.8, inputSize: 128 });

  engine = await tf.engine();
  stats.time1 = window.performance.now();
  stats.bytes1 = engine.state.numBytes;
  stats.tensors1 = engine.state.numTensors;

  stats.size = Math.round((stats.bytes1 - stats.bytes0) / 1024 / 1024);
  stats.tensors = Math.round(stats.tensors1 - stats.tensors0);
  stats.time = Math.round(stats.time1 - stats.time0);
  log.state(`Loaded model: FaceAPI in ${stats.time.toLocaleString()} ms ${stats.size.toLocaleString()} MB ${stats.tensors.toLocaleString()} tensors`);

  const api = await fetch('/api/dir?folder=Samples/Persons/');
  const files = await api.json();
  log.state(`Received list from server: ${files.length} images`);

  stats = [];
  // eslint-disable-next-line no-unused-vars
  for (const m in options) stats.push(0);
  for (const file of files) {
    const results = [];
    const image = await processImage.getImage(file);
    for (const m in options) {
      const t0 = window.performance.now();
      const data = await faceapi
        .detectAllFaces(image.canvas, options[m].face)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors()
        .withAgeAndGender();
      const t1 = window.performance.now();
      stats[m] += t1 - t0;
      results.push({ model: options[m], data });
    }
    print(file, image, results);
  }
  for (const m in options) {
    log.state(`${options[m].name}: ${Math.round(stats[m]).toLocaleString()} ms / ${Math.round(stats[m] / files.length)} avg`);
  }
  $('.thumbnail').click((evt) => match(evt.target.getAttribute('tag')));
}

// eslint-disable-next-line no-unused-vars
async function detect() {
  log.state('Loading models ...');
  // await loadDetect({ name: 'CoCo SSD v1', modelPath: 'models/cocossd-v1/model.json', score: 0.4, topK: 6, overlap: 0.5, exec: modelDetect.detectCOCO });
  await loadDetect({ name: 'CoCo SSD v2', modelPath: 'models/cocossd-v2/model.json', score: 0.4, topK: 6, overlap: 0.5, exec: modelDetect.detectCOCO });
  // await loadDetect({ name: 'CoCo DarkNet/Yolo v1 Tiny', modelPath: 'models/yolo-v1-tiny/model.json', score: 0.4, topK: 6, overlap: 0.5, modelType: 'layers' });
  // await loadDetect({ name: 'CoCo DarkNet/Yolo v2 Tiny', modelPath: 'models/yolo-v2-tiny/model.json', score: 0.4, topK: 6, overlap: 0.5, modelType: 'layers' });
  // await loadDetect({ name: 'CoCo DarkNet/Yolo v3 Tiny', modelPath: 'models/yolo-v3-tiny/model.json', score: 0.4, topK: 6, overlap: 0.5, modelType: 'layers' });
  // await loadDetect({ name: 'CoCo DarkNet/Yolo v3 Full', modelPath: 'models/yolo-v3-full/model.json', score: 0.4, topK: 6, overlap: 0.5, modelType: 'layers' });
  await loadDetect({ name: 'OpenImages SSD/MobileNet v2', modelPath: 'models/ssd-mobilenet-v2/model.json', score: 0.2, topK: 6, useFloat: true, classes: 'assets/OpenImage-Labels.json', exec: modelDetect.detectSSD });
  // await loadDetect({ name: 'OpenImages RCNN/Inception-ResNet v2', modelPath: 'models/rcnn-inception-resnet-v2/model.json', score: 0.2, topK: 6, useFloat: true, classes: 'assets/OpenImage-Labels.json', exec: modelDetect.detectSSD });

  log.state('Warming up ...');
  const warmup = await processImage.getImage('assets/warmup.jpg');
  // await modelDetect.detect(models[0].model, warmup.canvas);
  await modelDetect.exec(models[0].model, warmup.canvas);
  const api = await fetch('/api/dir?folder=Samples/Objects/');
  const files = await api.json();
  log.state(`Received list from server: ${files.length} images`);

  const stats = [];
  // eslint-disable-next-line no-unused-vars
  for (const m in models) stats.push(0);
  // eslint-disable-next-line no-console
  console.table('Starting', tf.memory());
  for (const file of files) {
    const results = [];
    const image = await processImage.getImage(file);
    for (const m in models) {
      log.dot();
      const t0 = window.performance.now();
      const data = await modelDetect.exec(models[m].model, image.canvas);
      const t1 = window.performance.now();
      stats[m] += (t1 - t0);
      results.push({ model: models[m], data });
    }
    print(file, image, results);
  }
  log.state('');
  for (const m in models) {
    log.state(`${models[m].name}: ${Math.round(stats[m]).toLocaleString()} ms / ${Math.round(stats[m] / files.length)} avg`);
  }
}

async function main() {
  await init();
  // tf.ENV.set('WEBGL_PACK', false);
  // tf.ENV.set('WEBGL_CONV_IM2COL', false);

  $('#btn-classify').click(() => classify());
  $('#btn-detect').click(() => detect());
  $('#btn-person').click(() => person());
  // $('#btn-detect').click(() => yolo());

  $('#btn-redraw').click(() => redraw());
}

window.onload = main;

// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"config.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* eslint-disable no-multi-spaces */
const config = {
  // General configuration
  backEnd: 'webgl',
  // back-end used by tensorflow for image processing, can be webgl, cpu, wasm
  maxSize: 780,
  // maximum image width or height that will be used for processing before resizing is required
  thumbnail: 128,
  // resolution in which to store image thumbnail embedded in result set
  batchProcessing: 20,
  // how many images to process in parallel
  squareImage: false,
  // resize proportional to the original image or to a square image
  floatPrecision: false,
  // use float32 or float16 for WebGL tensors
  // Default models
  classify: {
    name: 'Inception v3',
    modelPath: 'models/inception-v3/model.json',
    score: 0.2,
    topK: 3
  },
  detect: {
    name: 'Coco/SSD v2',
    modelPath: 'models/cocossd-v2/model.json',
    score: 0.4,
    topK: 6,
    overlap: 0.1
  },
  person: {
    name: 'FaceAPI SSD',
    modelPath: 'models/faceapi/',
    score: 0.4,
    topK: 1,
    type: 'ssdMobilenetv1'
  } // alternative classification models - you can pick none of one

  /*
  classify: { name: 'MobileNet v1', modelPath: '/models/mobilenet-v1/model.json' },
  classify: { name: 'MobileNet v2', modelPath: '/models/mobilenet-v2/model.json' },
  classify: { name: 'Inception v1', modelPath: 'https://tfhub.dev/google/tfjs-model/imagenet/inception_v1/classification/3/default/1' },
  classify: { name: 'Inception v2', modelPath: 'https://tfhub.dev/google/tfjs-model/imagenet/inception_v2/classification/3/default/1' },
  classify: { name: 'Inception v3', modelPath: '/models/inception-v3/model.json' },
  classify: { name: 'Inception ResNet v2', modelPath: '/models/inception-resnet-v2/model.json' },
  classify: { name: 'ResNet v2', modelPath: 'https://tfhub.dev/google/tfjs-model/imagenet/resnet_v2_101/classification/3/default/1' },
  classify: { name: 'NasNet Mobile', modelPath: 'https://tfhub.dev/google/tfjs-model/imagenet/nasnet_mobile/classification/3/default/1' },
  */
  // alternative detect models: enable darknet/yolo model in a separate module - you can pick none, enable coco/ssd-v2 or enable darknet/yolo (not js module is initialized by default)
  // detect: { name: 'Coco/SSD v2', modelPath: 'models/cocossd-v2/model.json', score: 0.4, topK: 6, overlap: 0.1 },
  // alternative face-api models - you can pick none or one of following

  /*
  person: { name: 'FaceAPI SSD', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'ssdMobilenetv1' },
  person: { name: 'FaceAPI Yolo', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'tinyYolov2' },
  person: { name: 'FaceAPI Tiny', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'tinyFaceDetector' },
  person: { name: 'FaceAPI MTCNN', modelPath: 'models/faceapi/', score: 0.5, topK: 1, type: 'mtcnn' },
  */

};
var _default = config;
exports.default = _default;
},{}],"log.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const div = {};

async function dot() {
  div.Log.innerHTML += '.';
}

async function result(...msg) {
  let msgs = '';
  msgs += msg.map(a => a);
  if (div && div.Log) div.Log.innerHTML += `${msgs.replace(' ', '&nbsp')}<br>`;
  if (msgs.length > 0) fetch(`/log?msg=${msgs}`).then(res => res.text()); // eslint-disable-next-line no-console

  console.log(...msg);
}

async function active(...msg) {
  if (div && div.Active) div.Active.innerHTML = `${msg}<br>`; // eslint-disable-next-line no-console
  else console.log(...msg);
}

function init() {
  div.Log = document.getElementById('log');
  div.Active = document.getElementById('active');
}

const log = {
  result,
  active,
  init,
  dot
};
var _default = log;
exports.default = _default;
},{}],"gallery.js":[function(require,module,exports) {
"use strict";

var _config = _interopRequireDefault(require("./config.js"));

var _log = _interopRequireDefault(require("./log.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let results = [];
let filtered = [];
const popupConfig = {
  showDetails: true,
  showBoxes: true,
  showFaces: true
};
const listConfig = {
  showDetails: true
}; // draw boxes for detected objects, faces and face elements

function drawBoxes(img, object) {
  const canvas = document.getElementById('popup-canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = img.offsetLeft;
  canvas.style.top = img.offsetTop;
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.linewidth = 2;
  ctx.font = '16px Roboto';
  const resizeX = img.width / object.processedSize.width;
  const resizeY = img.height / object.processedSize.height; // draw detected objects

  if (popupConfig.showBoxes && object.detect) {
    ctx.strokeStyle = 'lightyellow';
    ctx.fillStyle = 'lightyellow';

    for (const obj of object.detect) {
      const x = obj.box[0] * resizeX;
      const y = obj.box[1] * resizeY;
      ctx.beginPath();
      ctx.rect(x, y, obj.box[2] * resizeX, obj.box[3] * resizeY);
      ctx.stroke();
      ctx.fillText(`${(100 * obj.score).toFixed(0)}% ${obj.class}`, x + 2, y + 18);
    }
  } // draw faces


  if (popupConfig.showFaces && object.person && object.person.face) {
    // draw box around face
    const x = object.person.face.box.x * resizeX;
    const y = object.person.face.box.y * resizeY;
    ctx.strokeStyle = 'deepskyblue';
    ctx.fillStyle = 'deepskyblue';
    ctx.beginPath();
    ctx.rect(x, y, object.person.face.box.width * resizeX, object.person.face.box.height * resizeY);
    ctx.stroke();
    ctx.fillText('face', x + 2, y + 18); // draw face points

    ctx.fillStyle = 'lightblue';
    const pointSize = 2;

    for (const pt of object.person.face.points) {
      ctx.beginPath();
      ctx.arc(pt.x * resizeX, pt.y * resizeY, pointSize, 0, 2 * Math.PI);
      ctx.fill();
    }
    /*
    const jaw = object.person.boxes.landmarks.getJawOutline() || [];
    const nose = object.person.boxes.landmarks.getNose() || [];
    const mouth = object.person.boxes.landmarks.getMouth() || [];
    const leftEye = object.person.boxes.landmarks.getLeftEye() || [];
    const rightEye = object.person.boxes.landmarks.getRightEye() || [];
    const leftEyeBrow = object.person.boxes.landmarks.getLeftEyeBrow() || [];
    const rightEyeBrow = object.person.boxes.landmarks.getRightEyeBrow() || [];
    faceDetails = `Points jaw:${jaw.length} mouth:${mouth.length} nose:${nose.length} left-eye:${leftEye.length} right-eye:${rightEye.length} left-eyebrow:${leftEyeBrow.length} right-eyebrow:${rightEyeBrow.length}`;
    */

  }
}

function JSONtoStr(json) {
  if (json) return JSON.stringify(json).replace(/{|}|"/g, '').replace(/,/g, ', ');
} // show details popup


async function showPopup() {
  $('#popup').toggle(true);
  const img = document.getElementById('popup-image');
  const object = filtered.find(a => a.image === img.img);
  if (!object) return;
  let classified = 'Classified ';
  if (object.classify) for (const obj of object.classify) classified += ` | ${(100 * obj.score).toFixed(0)}% ${obj.class}`;
  let detected = 'Detected ';
  if (object.detect) for (const obj of object.detect) detected += ` | ${(100 * obj.score).toFixed(0)}% ${obj.class}`;
  let person = '';

  if (object.person && object.person.age) {
    person = `Person | 
        Gender: ${(100 * object.person.scoreGender).toFixed(0)}% ${object.person.gender} | 
        Age: ${object.person.age.toFixed(1)} | 
        Emotion: ${(100 * object.person.scoreEmotion).toFixed(0)}% ${object.person.emotion}`;
  }

  let nsfw = '';

  if (object.person && object.person.class) {
    nsfw = `Class: ${(100 * object.person.scoreClass).toFixed(0)}% ${object.person.class} `;
  }

  let desc = '<h2>Description:</h2><ul>';

  if (object.descriptions) {
    for (const description of object.descriptions) {
      for (const lines of description) {
        desc += `<li><b>${lines.name}</b>: <i>${lines.desc}</i></li>`;
      }

      desc += '<br>';
    }
  }

  desc += '</ul>';
  let exif = '';

  if (object.exif) {
    const mp = (img.naturalWidth * img.naturalHeight / 1000000).toFixed(1);
    const complexity = img.naturalWidth * img.naturalHeight / object.exif.bytes;
    if (object.exif.make) exif += `Camera: ${object.exif.make} ${object.exif.model || ''} ${object.exif.lens || ''}<br>`;
    if (object.exif.bytes) exif += `Size: ${mp} MP in ${object.exif.bytes.toLocaleString()} bytes with compression factor ${complexity.toFixed(2)}<br>`;
    if (object.exif.created) exif += `Taken: ${new Date(1000 * object.exif.created).toLocaleString()} Edited: ${new Date(1000 * object.exif.modified).toLocaleString()}<br>`;
    if (object.exif.software) exif += `Software: ${object.exif.software}<br>`;
    if (object.exif.exposure) exif += `Settings: ${object.exif.fov || 0}mm ISO${object.exif.iso || 0} f/${object.exif.apperture || 0} 1/${(1 / (object.exif.exposure || 1)).toFixed(0)}sec<br>`;
  }

  let location = '';
  if (object.location && object.location.city) location += `Location: ${object.location.city}, ${object.location.country}, ${object.location.continent} (near ${object.location.near})<br>`;
  if (object.exif && object.exif.lat) location += `Coordinates: Lat ${object.exif.lat.toFixed(3)} Lon ${object.exif.lon.toFixed(3)}<br>`;
  const html = `
      <h2>Image: ${object.image}</h2>
      Image size: ${img.naturalWidth} x ${img.naturalHeight}
        Processed in ${object.perf.total.toFixed(0)} ms<br>
        Classified using ${_config.default.classify ? _config.default.classify.name : 'N/A'} in ${object.perf.classify.toFixed(0)} ms<br>
        Detected using ${_config.default.detect ? _config.default.detect.name : 'N/A'} in ${object.perf.detect.toFixed(0)} ms<br>
        Person using ${_config.default.person ? _config.default.person.name : 'N/A'} in ${object.perf.person.toFixed(0)} ms<br>
      <h2>Image Data</h2>
      ${exif}
      <h2>Location</h2>
      ${location}
      <h2>${classified}</h2>
      <h2>${detected}</h2>
      <h2>${person} ${nsfw}</h2>
      ${desc}
      <h2>Tags</h2>
      ${JSONtoStr(object.tags)}
      </div>
    `;

  if (popupConfig.showDetails) {
    $('#popup-details').toggle(true);
    $('#popup-image').css('max-width', '80vw');
    $('#popup-details').html(html);
  } else {
    $('#popup-details').toggle(false);
    $('#popup-image').css('max-width', '100vw');
  }

  drawBoxes(img, object);
}

async function showNextDetails(left) {
  const img = document.getElementById('popup-image');
  const id = filtered.findIndex(a => a.image === img.img);
  if (id === -1) return;

  if (left === true && id > 0 && filtered[id - 1]) {
    img.img = filtered[id - 1].image;
    img.src = filtered[id - 1].image;
  } else if (left === false && id <= filtered.length && filtered[id + 1]) {
    img.img = filtered[id + 1].image;
    img.src = filtered[id + 1].image;
  }
} // print results strip with thumbnail for a given object


async function printResult(object) {
  let classified = '';

  if (object.classify && object.classify[0]) {
    classified = 'Classified';

    for (const obj of object.classify) classified += ` | ${(100 * obj.score).toFixed(0)}% ${obj.class}`;
  }

  let detected = '';

  if (object.detect && object.detect[0]) {
    detected = 'Detected';

    for (const obj of object.detect) detected += ` | ${(100 * obj.score).toFixed(0)}% ${obj.class}`;
  }

  let person = '';

  if (object.person && object.person.age) {
    person = `Person | 
      Gender: ${(100 * object.person.scoreGender).toFixed(0)}% ${object.person.gender} 
      Age: ${object.person.age.toFixed(1)} 
      Emotion: ${(100 * object.person.scoreEmotion).toFixed(0)}% ${object.person.emotion}`;
  }

  let nsfw = '';

  if (object.person && object.person.class) {
    nsfw = `Class: ${(100 * object.person.scoreClass).toFixed(0)}% ${object.person.class} `;
  }

  let location = '';

  if (object.location && object.location.city) {
    location = 'Location';
    location += ` | ${object.location.city}, ${object.location.country}, ${object.location.continent} (near ${object.location.near})`;
  }

  let camera = '';

  if (object.exif.make) {
    camera = 'Camera';
    camera += `: ${object.exif.make} ${object.exif.model || ''}`;
  }

  const divItem = document.createElement('div');
  divItem.className = 'listitem';
  divItem.innerHTML = `
    <div class="col thumbnail" style="min-height: ${_config.default.thumbnail}px; max-height: ${_config.default.thumbnail}px; min-width: ${_config.default.thumbnail}px; max-width: ${_config.default.thumbnail}px">
      <img id="thumb-${object.id}" src="${object.thumbnail}" align="middle" width="${_config.default.thumbnail}px" height="${_config.default.thumbnail}px">
    </div>
    <div id="desc-${object.id}" class="col description">
      <b>${decodeURI(object.image)}</b><br>
      Image: ${object.naturalSize.width}x${object.naturalSize.height} ${camera}<br>
      ${location}<br>
      ${classified}<br>
      ${detected}<br>
      ${person} ${nsfw}<br>
    </div>
  `;
  await $('#results').append(divItem);
  $('.description').toggle(listConfig.showDetails);
  document.getElementById(`thumb-${object.id}`).img = object.image;
  document.getElementById(`desc-${object.id}`).img = object.image;
  const img = document.getElementById('popup-image');
  img.addEventListener('load', showPopup);
  divItem.addEventListener('click', evt => {
    img.img = evt.target.img;
    img.src = object.image; // this triggers showDetails via onLoad event(
  });
}

function filterWord(object, word) {
  if (!object) return null;
  const skip = ['in', 'a', 'the', 'of', 'with', 'using', 'wearing', 'and', 'at', 'during'];
  if (skip.includes(word)) return object;
  const res = object.filter(obj => {
    let ok = false;

    for (const tag of obj.tags) {
      const str = Object.values(tag)[0].toString() || '';
      ok |= str.startsWith(word.toLowerCase());
    }

    return ok;
  });
  return res;
}

function filterResults(words) {
  filtered = results;
  let foundWords = 0;

  for (const word of words.split(' ')) {
    filtered = filterWord(filtered, word);
    foundWords += filtered && filtered.length > 0 ? 1 : 0;
  }

  if (filtered && filtered.length > 0) _log.default.result(`Searching for "${words}" found ${foundWords} words in ${filtered.length || 0} results out of ${results.length} matches`);else _log.default.result(`Searching for "${words}" found ${foundWords} of ${words.split(' ').length} terms`);
  $('#results').html('');
  $('#number').html(filtered.length);

  for (const obj of filtered) printResult(obj);
} // Fisher-Yates (aka Knuth) Shuffle


function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex]; // eslint-disable-next-line no-param-reassign

    array[currentIndex] = array[randomIndex]; // eslint-disable-next-line no-param-reassign

    array[randomIndex] = temporaryValue;
  }

  return array;
}

function sortResults(sort) {
  if (!filtered || filtered.length === 0) filtered = results;
  if (sort.includes('random')) shuffle(filtered);
  if (sort.includes('alpha-down')) filtered.sort((a, b) => a.image > b.image ? 1 : -1);
  if (sort.includes('alpha-up')) filtered.sort((a, b) => a.image < b.image ? 1 : -1);
  if (sort.includes('numeric-down')) filtered.sort((a, b) => b.exif.created - a.exif.created);
  if (sort.includes('numeric-up')) filtered.sort((a, b) => a.exif.created - b.exif.created);
  if (sort.includes('amount-down')) filtered.sort((a, b) => b.pixels - a.pixels);
  if (sort.includes('amount-up')) filtered.sort((a, b) => a.pixels - b.pixels);
  $('#results').html('');

  for (const obj of filtered) printResult(obj);
} // calls main detectxion and then print results for all images matching spec


async function loadGallery() {
  _log.default.result('Loading gallery ...');

  const res = await fetch('/get?find=all');
  results = await res.json();
  filtered = results;

  _log.default.result(`Received ${results.length} images in ${JSON.stringify(results).length} bytes`);

  $('#number').html(results.length);
  $('#results').html('');

  for (const id in results) {
    results[id].id = id;
    printResult(results[id]);
  }
} // pre-fetching DOM elements to avoid multiple runtime lookups


function initHandlers() {
  // hide those elements initially
  $('#popup').toggle(false);
  $('#searchbar').toggle(false);
  $('#sortbar').toggle(false);
  $('#sortbar').toggle(false);
  $('#configbar').toggle(false);
  $('#btn-search').click(() => {
    $('#sortbar').toggle(false);
    $('#configbar').toggle(false);
    $('#searchbar').toggle('fast');
    $('#btn-search').toggleClass('fa-search fa-search-location');
    $('#search-input').focus();
  });
  $('#search-input').keyup(() => {
    event.preventDefault();
    if (event.keyCode === 191) $('#search-input')[0].value = ''; // reset on key=/

    if (event.keyCode === 13) filterResults($('#search-input')[0].value);
  });
  $('#btn-sort').click(() => {
    $('#searchbar').toggle(false);
    $('#configbar').toggle(false);
    $('#sortbar').toggle('fast');
  });
  $('.sortbutton').click(evt => {
    sortResults(evt.target.className);
  });
  $('#btn-desc').click(() => {
    listConfig.showDetails = !listConfig.showDetails;
    $('.description').toggle('slow');
    $('#btn-desc').toggleClass('fa-eye fa-eye-slash');
  });
  $('#btn-config').click(() => {
    $('#searchbar').toggle(false);
    $('#sortbar').toggle(false);
    $('#configbar').toggle('fast');
  });
  $('#details-desc').click(() => {
    $('#details-desc').toggleClass('fa-comment fa-comment-slash');
    popupConfig.showDetails = !popupConfig.showDetails;
  });
  $('#details-boxes').click(() => {
    $('#details-boxes').toggleClass('fa-store fa-store-slash');
    popupConfig.showBoxes = !popupConfig.showBoxes;
  });
  $('#details-faces').click(() => {
    $('#details-faces').toggleClass('fa-user fa-user-slash');
    popupConfig.showFaces = !popupConfig.showFaces;
  });
  $('#popup').click(() => {
    if (event.screenX < 50) showNextDetails(true);else if (event.screenX > window.innerWidth - 50) showNextDetails(false);else $('#popup').toggle('fast');
  });
  $('html').keydown(() => {
    const current = $('#results').scrollTop();
    const page = $('#results').height();
    const bottom = $('#results').prop('scrollHeight');
    $('#results').stop();

    switch (event.keyCode) {
      case 33:
      case 36:
        $('#results').animate({
          scrollTop: 0
        }, 1000);
        break;
      // pgup or home

      case 34:
      case 35:
        $('#results').animate({
          scrollTop: bottom
        }, 1000);
        break;
      // pgdn or end

      case 38:
        $('#results').animate({
          scrollTop: current - page + 36
        }, 400);
        break;
      // up

      case 40:
        $('#results').animate({
          scrollTop: current + page - 36
        }, 400);
        break;
      // down

      case 37:
        showNextDetails(true);
        break;

      case 39:
        showNextDetails(false);
        break;

      case 191:
        $('#btn-search').click();
        break;
      // key=/

      case 190:
        $('#btn-sort').click();
        break;
      // key=.

      case 32:
        $('#btn-desc').click();
        break;
      // key=space

      case 82:
        $('#results').scrollTop(0);
        loadGallery();
        break;
      // r

      case 27:
        $('#searchbar').toggle(false);
        $('#sortbar').toggle(false);
        $('#sortbar').toggle(false);
        $('#configbar').toggle(false);
        $('#popup').toggle(false);
        break;
      // escape

      default:
        _log.default.result('Unhandled keydown event', event.keyCode);

    }
  });
}

async function main() {
  _log.default.init();

  initHandlers();
  await loadGallery();
}

window.onload = main;
},{"./config.js":"config.js","./log.js":"log.js"}]},{},["gallery.js"], null)
//# sourceMappingURL=/gallery.js.map
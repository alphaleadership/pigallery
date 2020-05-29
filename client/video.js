// import * as nsfwjs from 'nsfwjs';
// import yolo from './modelYolo.js';

import config from './config.js';
import * as tf from './processVideo.js';

window.config = config;
let video;
let parent;
let front = true;

async function drawDetectionBoxes(object) {
  if (!object || !object.detect || object.detect.length === 0) return;
  const detect = object.detect;
  const canvas = document.createElement('canvas');
  canvas.width = video.width;
  canvas.height = video.height;
  const ctx = canvas.getContext('2d');
  parent.appendChild(canvas);
  ctx.strokeStyle = 'lightyellow';
  ctx.fillStyle = 'lightyellow';
  ctx.linewidth = 2;
  ctx.font = '16px Roboto';
  const resizeX = $('#main').width() / object.canvas.width;
  const resizeY = $('#main').height() / object.canvas.height;
  for (const obj of detect) {
    ctx.beginPath();
    const x = obj.box[0] * resizeX;
    const y = obj.box[1] * resizeY;
    const width = obj.box[2] * resizeX;
    const height = obj.box[3] * resizeY;
    ctx.rect(x, y, width, height);
    ctx.stroke();
    ctx.fillText(`${(100 * obj.score).toFixed(0)}% ${obj.class}`, x + 2, y + 18);
  }
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parent.removeChild(canvas);
  }, 500);
}

async function drawFaces(object) {
  if (!object || !object.face || object.face.length < 1) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.width;
  canvas.height = video.height;
  parent.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  /*
  import * as faceapi from 'face-api.js';
  for (const face of object.face) {
    const displaySize = { width: $('#main').width(), height: $('#main').height() };
    faceapi.matchDimensions(canvas, displaySize);
    const resized = faceapi.resizeResults(face, displaySize);
    new faceapi.draw.DrawBox(resized.detection.box, { boxColor: 'lightskyblue' }).draw(canvas);
    new faceapi.draw.DrawFaceLandmarks(resized.landmarks, { lineColor: 'skyblue', pointColor: 'deepskyblue' }).draw(canvas);
  }
  */
  const resizeX = $('#main').width() / object.canvas.width;
  const resizeY = $('#main').height() / object.canvas.height;
  for (const i in object.face) {
    const x = object.face[i].detection.box.x * resizeX;
    const y = object.face[i].detection.box.y * resizeY;
    const width = object.face[i].detection.box.width * resizeX;
    const height = object.face[i].detection.box.height * resizeY;
    ctx.strokeStyle = 'deepskyblue';
    ctx.fillStyle = 'deepskyblue';
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    ctx.fillText(`face#${1 + parseInt(i, 10)}`, x + 2, y + 18);
    ctx.fillStyle = 'lightblue';
    const pointSize = 2;
    for (const pt of object.face[i].landmarks.positions) {
      ctx.beginPath();
      // eslint-disable-next-line no-underscore-dangle
      ctx.arc(pt._x * resizeX, pt._y * resizeY, pointSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parent.removeChild(canvas);
  }, 500);
}

async function showDetails(object) {
  if (!object) return;
  let detected = 'Objects';
  if (object.detect) {
    for (const obj of object.detect) detected += ` | ${(100 * obj.score).toFixed(0)}% ${obj.class}`;
  }
  let face = 'People';
  if (object.face) {
    for (const person of object.face) face += ` | ${(100 * person.genderProbability).toFixed(0)}% ${person.gender} ${person.age.toFixed(1)}y`;
  }
  $('#detected').text(detected);
  $('#face').text(face);
}

function time(t0) {
  const t1 = window.performance.now();
  return Math.round(t1 - t0).toLocaleString();
}

async function loadModels() {
  let t0;
  $('#active').text('Initializing ...');
  t0 = window.performance.now();
  await tf.load();
  t0 = window.performance.now();
  await tf.process(video);
  $('#active').text(`Ready in ${time(t0)} ms ... `);
}

async function startProcessing() {
  video.removeEventListener('loadeddata', startProcessing);
  $('#text-resolution').text(`${video.videoWidth} x ${video.videoHeight}`);

  const ratio = 1.0 * video.videoWidth / video.videoHeight;
  video.width = ratio >= 1 ? $('#main').width() : 1.0 * $('#main').height() * ratio;
  video.height = video.width / ratio;

  while (!video.paused && !video.ended) {
    const t0 = window.performance.now();
    const object = video.readyState > 1 ? await tf.process(video) : null;
    $('#active').text(`Detection: ${(1000 / time(t0)).toFixed(1)} FPS`);
    await showDetails(object);
    await drawDetectionBoxes(object);
    await drawFaces(object);
  }
  $('#active').text('Idle ...');
}

async function stopProcessing() {
  const stream = video.srcObject;
  const tracks = stream.getTracks();
  if (tracks) tracks.forEach((track) => track.stop());
}

async function getCameraStream() {
  video.addEventListener('loadeddata', startProcessing);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    $('#active').text('Camera not supported');
    return;
  }
  const constraints = {
    audio: false,
    video: {
      width: { min: 480, ideal: 1920, max: 3840 },
      height: { min: 480, ideal: 1080, max: 3840 },
      facingMode: front ? 'user' : 'environment',
    },
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  await video.play();
}

async function getVideoStream(url) {
  video.addEventListener('loadeddata', startProcessing);
  video.src = url;
  await video.play();
  $('#text-resolution').text(`${video.videoWidth} x ${video.videoHeight}`);
}

async function main() {
  $('#active').text('Starting ...');
  video = document.getElementById('video');
  parent = document.getElementById('main');

  const navbarHeight = $('#navbar').height();
  $('#main').css('top', `${navbarHeight}px`);
  video.width = $('#main').width();
  video.height = $('#main').height();

  await loadModels();

  $('#btn-play').click(() => {
    $('#btn-play').toggleClass('fa-play-circle fa-pause-circle');
    if ($('#btn-play').hasClass('fa-play-circle')) {
      $('#text-play').text('Live Video');
      video.pause();
      stopProcessing();
    } else {
      $('#text-play').text('Pause Video');
      getCameraStream();
      // getVideoStream('media/Samples/Videos/video-appartment.mp4');
      // getVideoStream('media/Samples/Videos/video-jen.mp4');
      // getVideoStream('media/Samples/Videos/video-dash.mp4');
      // getVideoStream('media/Samples/Videos/video-r1.mp4');
    }
  });

  $('#btn-facing').click(() => {
    front = !front;
    $('#text-facing').text(front ? 'Front' : 'Back');
    getCameraStream();
  });

  // transcode rtsp from camera to m3u8
  // ffmpeg -hide_banner -y -i rtsp://user:pwd@reolink-black:554/h264Preview_01_main -vcodec copy reolink.m3u8
  // video.src = 'media/reolink.m3u8'; video.width = 720; video.height = 480;
}

window.onload = main;

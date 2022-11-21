import './style.css'
// import { predictNonblocking } from './gesture.js'
import { initPlayerVideo } from './video'
import { makePrediction } from './prediction'
import { RockGesture, PaperGesture, ScissorsGesture } from './gesture.js';

async function checkSource(playerVideoElement, gestures, callback, options) {
  const prediction = await makePrediction();
  const videoPromise = initPlayerVideo(playerVideoElement);
  const predictPromise = prediction.init(gestures);

  console.log("Initialize game...");

  return Promise.all([videoPromise, predictPromise])
  .then(result => {
      // result[0] will contain the initialized video element
      playerVideo = result[0];
      playerVideo.play();

      console.log("Initialization finished");
      prediction.runBackground(playerVideo, callback, options);

  });
}



const knownGestures = [RockGesture, PaperGesture, ScissorsGesture];
var playerVideo = document.querySelector('#player-video');
var title = document.querySelector('#gesture');
const options = {
  requiredDuration: 20,  // ms
  minimumScore: 7,        // up to 10?
}

await checkSource(playerVideo, knownGestures, (gesture) => {
  console.log("Received: " + gesture);
  if(gesture != title.textContent) {
    title.textContent = gesture;
  }
}, options);

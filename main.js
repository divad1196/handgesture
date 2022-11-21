import './style.css'
// import { predictNonblocking } from './gesture.js'
import { initPlayerVideo } from './video'
import { makePrediction } from './prediction'
import { RockGesture, PaperGesture, ScissorsGesture } from './gesture.js';


const knownGestures = [RockGesture, PaperGesture, ScissorsGesture];
const prediction = await makePrediction();
var playerVideo = document.querySelector('#player-video');


const videoPromise = initPlayerVideo(playerVideo);
const predictPromise = prediction.init(knownGestures);

console.log("Initialize game...");

Promise.all([videoPromise, predictPromise])
.then(result => {

    // result[0] will contain the initialized video element
    playerVideo = result[0];
    playerVideo.play();

    console.log("Initialization finished");
    prediction.runBackground(playerVideo, (gesture) => {
      console.log("Received: " + gesture);
    }, 50);

});

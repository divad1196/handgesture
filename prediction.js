// import handpose
import * as handpose from '@tensorflow-models/handpose';
import { GestureEstimator } from 'fingerpose';

// import WebGL backend for TensorFLow
// note: this backend is included by default in '@tensorflow/tfjs'
// this import is just added in case you want to replace it with the WASM backend
import '@tensorflow/tfjs-backend-webgl';

async function makePrediction() {
    // store references
    let handposeModel, gestureEstimator;
    var lastResult = "";

    return {
        init: async function(knownGestures) {

            // initialize finger gesture recognizer with known gestures
            // const knownGestures = [RockGesture, PaperGesture, ScissorsGesture];
            gestureEstimator = new GestureEstimator(knownGestures);

            // load handpose model
            console.log("Loading handpose model...")
            handposeModel = await handpose.load();
            console.log("Model loaded");

            // make one prediction on a sample image
            // this is to "warm up" the model so there won't be a delay
            // before the actual predictions later
            /*console.log("Warm up model");
            await handposeModel.estimateHands(sample, false);
            console.log("Model is hot!");*/
        },

        predictGesture: async function(sourceElement, minimumScore) {

            const predictions = await handposeModel.estimateHands(sourceElement, false);
            // console.log(predictions);

            if(predictions.length > 0) {

                // detect gestures
                const gestureEstimations = gestureEstimator.estimate(
                    predictions[0].landmarks, minimumScore
                );

                // get gesture with highest match score
                if(gestureEstimations.gestures.length > 0) {

                    // this will reduce an array of results to a single value
                    // containing only the gesture with the highest score
                    const gestureResult = gestureEstimations.gestures.reduce((p, c) => {
                        return (p.confidence > c.confidence) ? p : c;
                    });

                    return gestureResult.name;
                }
            }

            return '';
        },


        detectPlayerGesture: function(playerVideo, callback, requiredDuration) { // duration in ms

            let lastGesture = "";
            let gestureDuration = 0;

            const predictNonblocking = () => {

                setTimeout(() => {

                    const predictionStartTS = Date.now();

                    // predict gesture (require high confidence)
                    this.predictGesture(playerVideo, 9).then(playerGesture => {

                        if(playerGesture != "") {

                            if(playerGesture == lastGesture) {
                                // player keeps holding the same gesture
                                // -> keep timer running
                                const deltaTime = Date.now() - predictionStartTS;
                                gestureDuration += deltaTime;
                            }
                            else {
                                // detected a different gesture
                                // -> reset timer
                                lastGesture = playerGesture;
                                gestureDuration = 0;
                            }
                        }
                        else {
                            lastGesture = "";
                            gestureDuration = 0;
                        }

                        if(gestureDuration < requiredDuration) {
                            // update timer and repeat
                            // UI.setTimerProgress(gestureDuration / requiredDuration);
                            predictNonblocking();
                        }
                        else {

                            // player result available
                            // -> stop timer and check winner
                            // check the game result
                            callback(playerGesture);
                        }
                    });

                }, 0);
            };

            predictNonblocking();
        },
        runBackground: function(playerVideo, callback, requiredDuration) {
            const nonblocking = () => {
                setTimeout(() => {
                    this.detectPlayerGesture(playerVideo, (gesture) => {
                        lastResult = gesture;
                        callback(gesture);
                    }, requiredDuration);
                    nonblocking();
                }, 0);
            };
            nonblocking();
        },
        getLastResult: function() {
            return lastResult;
        }

    }
}
export { makePrediction };

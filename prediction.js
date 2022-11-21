// import handpose
import * as handpose from '@tensorflow-models/handpose';
import { GestureEstimator } from 'fingerpose';

// import WebGL backend for TensorFLow
// note: this backend is included by default in '@tensorflow/tfjs'
// this import is just added in case you want to replace it with the WASM backend
import '@tensorflow/tfjs-backend-webgl';

function launch(f) {
    const nonblocking = () => {
        setTimeout(() => {
            if(f()) {
                nonblocking();
            }
        }, 0);
    };
    nonblocking();
}

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


        detectPlayerGesture: function(sourceElement, callback, options) { // duration in ms
            options = Object.assign({
                requiredDuration: 50,  // ms
                minimumScore: 9,        // up to 10?
            }, (options || {}));


            let lastGesture = "";
            let gestureDuration = 0;


            /*launch(async () => {
                const predictionStartTS = Date.now();

                // predict gesture (require high confidence)
                const playerGesture = await this.predictGesture(sourceElement, options.minimumScore);
                if(playerGesture == "") {
                    lastGesture = "";
                    gestureDuration = 0;
                    return true;
                }

                if(playerGesture != lastGesture) {
                    // detected a different gesture
                    // -> reset timer
                    lastGesture = playerGesture;
                    gestureDuration = 0;
                    return true;
                }

                // player keeps holding the same gesture
                // -> keep timer running
                const deltaTime = Date.now() - predictionStartTS;
                gestureDuration += deltaTime;

                if(gestureDuration < options.requiredDuration) {
                    return true;
                }

                callback(playerGesture);

            });*/

            const nonblocking = () => {

                setTimeout(() => {

                    const predictionStartTS = Date.now();

                    // predict gesture (require high confidence)
                    this.predictGesture(sourceElement, options.minimumScore).then(playerGesture => {

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

                        if(gestureDuration < options.requiredDuration) {
                            nonblocking();
                        }
                        else {
                            // player result available
                            // -> stop timer and check winner
                            callback(playerGesture);
                        }
                    });

                }, 0);
            };

            nonblocking();
        },
        runBackground: function(playerVideo, callback, options) {
            const nonblocking = () => {
                setTimeout(() => {
                    this.detectPlayerGesture(
                        playerVideo,
                        (gesture) => {
                            lastResult = gesture;
                            callback(gesture);
                        },
                        options
                    );
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

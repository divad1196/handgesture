const defaultCamConfig = {
    audio: false,
    video: {
        facingMode: "user",
        width: 50,
        height: 50,
        frameRate: { max: 30 }
    }
};

async function initPlayerVideo(playerVideo, constraints) {
    if(!constraints) {
        constraints = defaultCamConfig;
    }
    // get cam video stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    playerVideo.srcObject = stream;

    return new Promise(resolve => {
        playerVideo.onloadedmetadata = () => {
            playerVideo.onloadeddata = () => {
                resolve(playerVideo);
            };
        };
    });
}


export {
    initPlayerVideo
};

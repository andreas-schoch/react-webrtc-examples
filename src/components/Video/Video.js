import React, { useState, useEffect, useRef } from 'react';
// import './Video.css';

const Video = () => {
    // references to the <video> elements
    const video = useRef(null);

    const [state, setState] = useState({
        stream: null
    });

    // observes and automatically sets src of <video> to own stream
    useEffect(() => {
        if (video.current && state.stream) {
            // sets src of <video> to the livestream of the webcam
            video.current.srcObject = state.stream;

            // starts playing a livestream of your webcam in the referenced <video> element
            video.current.oncanplay = () => {
                video.current.play();
                video.current.muted = true; // set to false to hear/test your own audio sound
            };
        }
    }, [state.stream]);

    const startStream = async () => {
        try {
            // get stream for webcam and microphone signal (user get's asked for permission first time)
            let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            // reference the stream in state
            // A useEffect is observing state.stream and will set the <video src={stream} /> automatically whenever state.stream is valid
            setState({ ...state, stream });
        } catch (error) {
            console.error(error);
        }
    };

    const handleStartStream = event => {
        startStream();
    };

    return (
        <div>
            {/* will play a livestream of your own webcam whenever available */}
            <video ref={video} className='video' />

            {/* click to start a livestream of your own webcam */}
            <button onClick={handleStartStream}>Start My Stream</button>
        </div>
    );
};

export default Video;

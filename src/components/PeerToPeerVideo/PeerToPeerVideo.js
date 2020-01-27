import React, { useState, useEffect, useRef } from 'react';
import styles from './PeerToPeerVideo.module.scss';
import Peer from 'simple-peer';

const PeerToPeerVideo = () => {
    //////////////////////
    //// STATE & REFS ////
    //////////////////////
    const video = useRef(null);
    const remoteVideo = useRef(null);

    const [peer, setPeer] = useState(null);
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [initiator] = useState(window.location.hash === '#init');
    const [username] = useState(initiator ? 'PEER 1' : 'PEER 2');
    // const [messages] = useState([]);
    const [inputState, setInputState] = useState({
        connectData: '',
        message: ''
    });

    /////////////////
    //// EFFECTS ////
    /////////////////
    // set src of <video> to own stream when available
    useEffect(() => {
        if (video.current && stream) {
            video.current.srcObject = stream;
            video.current.oncanplay = () => {
                video.current.play();
                video.current.muted = true; // set to false to hear/test your own audio
            };
        }
    }, [stream]);

    // set src of <video> to remote stream when available
    useEffect(() => {
        if (remoteVideo.current && remoteStream) {
            remoteVideo.current.srcObject = remoteStream;
            remoteVideo.current.oncanplay = () => {
                remoteVideo.current.play();
                remoteVideo.current.muted = false; // set to false to hear/test remote audio
            };
        }
    }, [remoteStream]);

    useEffect(() => {
        console.log('Peer', peer);
        if (peer) {
            peer.on('error', err => console.error('error', err));

            peer.on('signal', data => {
                if (data.type === 'offer' || data.type === 'answer') {
                    console.log(`%c ${JSON.stringify(data)}`, 'background: #222; color: #bada55');
                    alert(
                        'open console and copy the console.log with the black background. Give it to the other peer to connect'
                    );
                }
            });

            peer.on('connect', () => {
                console.log('CONNECT');
            });

            peer.on('data', data => {
                const parsedData = JSON.parse(data);
                console.log('parsed', parsedData);

                if (parsedData.message) {
                    console.log(
                        `%c MESSAGE - ${parsedData.message.author}: "${parsedData.message.text}"`,
                        'background: black; color: white; padding: 1rem'
                    );
                }
            });

            peer.on('stream', remoteMediaStream => {
                setRemoteStream(remoteMediaStream);
            });
        }
    }, [peer]);

    /////////////////
    //// METHODS ////
    /////////////////
    const initPeer = () => {
        // trickle false prevents the lookout for "ICE candidates" (Candidates are best ways to connect to peers or something like that)
        setPeer(new Peer({ initiator: initiator, trickle: false, stream: stream }));
    };

    const startStream = async () => {
        try {
            let mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
        } catch (error) {
            console.error('stream couldnt be started via "startStream()"', error);
        }
    };

    const connect = () => {
        peer.signal(JSON.parse(inputState.connectData));
    };

    const sendMessage = () => {
        if (peer) {
            const message = { author: username, text: inputState.message };
            peer.send(JSON.stringify({ message }));
        }
    };

    //////////////////
    //// HANDLERS ////
    //////////////////
    const handleChange = e => setInputState({ ...inputState, [e.target.name]: e.target.value });
    const handleStartStream = e => startStream();
    const handleInitPeer = e => initPeer();

    const handleSendMessage = e => {
        e.preventDefault();
        console.log('sending message');
        sendMessage();
    };

    const handleConnect = e => {
        e.preventDefault();
        connect();
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.left}>
                <h2>My Stream</h2>
                {/* will play a livestream of your own webcam whenever available */}
                <video ref={video} className={styles.video} />

                <h2>Remote Stream</h2>
                {/* will play a livestream of the remote webcam whenever connection is established stream and available */}
                <video ref={remoteVideo} className={styles.video} />
            </div>

            <div className={styles.right}>
                {/* click to start a livestream of your own webcam */}
                <button onClick={handleStartStream}>Start My Stream</button>

                {/* click to initialize this user as a peer */}
                <button onClick={handleInitPeer}>{`Init This Peer ${initiator ? '(Generates Offer)' : ''}`}</button>

                <form onSubmit={handleConnect} className={[styles.form, styles.connectForm].join(' ')}>
                    <fieldset>
                        <legend>Connect</legend>
                        <textarea
                            name='connectData'
                            id='connectData'
                            onChange={handleChange}
                            value={inputState.connectData}
                            placeholder={`${initiator ? 'Enter Answer' : 'Enter Offer'} of other Peer`}
                        />

                        <button type='submit'>connect {!initiator ? '(Generates Answer)' : ''}</button>
                    </fieldset>
                </form>

                <form onSubmit={handleSendMessage} className={[styles.form, styles.sendMessageForm].join(' ')}>
                    <fieldset>
                        <legend>Send Message to Peer</legend>
                        <input
                            type='text'
                            aria-label='chat input'
                            name='message'
                            value={inputState.message}
                            onChange={handleChange}
                            placeholder='Hello Peer...'
                        />
                        <button type='submit'>send</button>
                    </fieldset>
                </form>
            </div>
        </div>
    );
};

export default PeerToPeerVideo;

/*
THINGS TO LEARN ABOUT
- NAT (NAT = Network Address Translation)
- STUN SERVER ( STUN = Session Traversal of UDP Through NATs ) (also STUN = Session Traversal Utilities for NAT ) 
- TURN SERVER ( TURN = Traversal Using Relay NAT )
- SIGNALING
- ICE CANDIDATES (ICE = Interactive Connectivity Establishment)
- 



*/

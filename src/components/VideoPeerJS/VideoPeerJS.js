import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoPeerJS.module.scss';
import Peer from 'peerjs';

const VideoPeerJS = () => {
    //////////////////////
    //// STATE & REFS ////
    //////////////////////
    const video = useRef(null);
    const remoteVideo = useRef(null);

    const [peer, setPeer] = useState(null);
    const [connection, setConnection] = useState(null);

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

    // init event listeners for peer when peer is available
    useEffect(() => {
        if (peer) {
            peer.on('open', id => {
                console.log('My peer ID is: ' + id);
                console.log('PEERr', peer);
            });

            peer.on('connection', conn => {
                console.log('connection', conn);
                setConnection(conn);
            });
        }
    }, [peer]);

    // init event listeners for connection when connection is established
    useEffect(() => {
        if (connection) {
            console.log('CONNECTION ESTABLISHED');

            connection.on('open', () => {
                // connection.on('data', data => {
                //     console.log('RECEIVED', data);
                // });

                connection.on('data', data => {
                    const parsedData = JSON.parse(data);
                    console.log('parsed', parsedData);

                    if (parsedData.message) {
                        console.log(
                            `%c MESSAGE - ${parsedData.message.author}: "${parsedData.message.text}"`,
                            'background: black; color: white; padding: 1rem'
                        );
                    }
                });
            });
        }
    }, [connection]);

    /////////////////
    //// METHODS ////
    /////////////////
    const initPeer = () => {
        setPeer(new Peer({ debug: true, config: { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] } }));
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
        setConnection(peer.connect(inputState.connectData));
    };

    const sendMessage = () => {
        if (peer && connection) {
            const message = { author: username, text: inputState.message };
            connection.send(JSON.stringify({ message }));
            console.log('sending message');
            // connection.send('Hello!');
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
        // console.log('sending message');
        sendMessage();
    };

    const handleConnect = e => {
        e.preventDefault();
        connect();
    };

    return (
        <div className={styles.wrapper}>
            <button onClick={() => console.log(peer.id)}>log id</button>
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

export default VideoPeerJS;

/*
THINGS TO LEARN ABOUT
- NAT (NAT = Network Address Translation)
- STUN SERVER ( STUN = Session Traversal of UDP Through NATs ) (also STUN = Session Traversal Utilities for NAT ) 
- TURN SERVER ( TURN = Traversal Using Relay NAT )
- SIGNALING
- ICE CANDIDATES (ICE = Interactive Connectivity Establishment)
- 



*/

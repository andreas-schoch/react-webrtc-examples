import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoVanillaWebRTC.module.scss';
import Peer from 'simple-peer';

const iceCandidates = [];

const VideoVanillaWebRTC = () => {
    //////////////////////
    //// STATE & REFS ////
    //////////////////////
    const descriptionRef = useRef(null); // display the offer/answer
    const iceCandidatesRef = useRef(null); // display the ICE candidates as a stringified array

    const localVideo = useRef(null);
    const remoteVideo = useRef(null);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const [peerConnection, setPeerConnection] = useState(null);
    // const [localIceCandidates, setLocalIceCandidates] = useState([]);

    const [initiator, setInitiator] = useState(false);
    const [inputState, setInputState] = useState({
        description: '',
        message: '',
        remoteIceCandidates: ''
    });

    /////////////////
    //// EFFECTS ////
    /////////////////
    // set src of <video> to own stream when available
    useEffect(() => {
        if (localVideo.current && localStream) {
            localVideo.current.srcObject = localStream;
            localVideo.current.oncanplay = () => {
                localVideo.current.play();
                localVideo.current.muted = true; // set to false to hear/test your own audio
            };
        }
    }, [localStream]);

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
        if (peerConnection) {
            console.log('useEffect - localPeerConnection was set', peerConnection);

            peerConnection.addStream(localStream);
            console.log('useEffect - localPeerConnection addStream(localStream)', peerConnection);

            peerConnection.addEventListener('icecandidate', (evt) => {
                const iceCandidate = evt.candidate;

                if (iceCandidate) {
                    const newIceCandidate = new RTCIceCandidate(iceCandidate);
                    iceCandidates.push(iceCandidate);
                    iceCandidatesRef.current.value = JSON.stringify(iceCandidates);
                //     setLocalIceCandidates([...localIceCandidates, newIceCandidate]);
                //     iceCandidatesRef.current.value = JSON.stringify(localIceCandidates);
                //     console.log('on icecandidate', JSON.stringify(localIceCandidates));
                }
            });

            peerConnection.addEventListener('iceconnectionstatechange', (evt) => {
                console.log('on iceconnectionstatechange', evt);
            });

            peerConnection.addEventListener('addstream', (evt) => {
                console.log('------------STREAM RECEIVED FROM OTHER PEER', evt);
                setRemoteStream(evt.stream);
            });

            if (initiator) {
                // Set up to exchange only video.
                const offerOptions = {offerToReceiveVideo: 1};
                peerConnection.createOffer(offerOptions).then(description => {
                    peerConnection.setLocalDescription(description)
                    descriptionRef.current.value = JSON.stringify(description);
                });
            }
        }
    }, [peerConnection]);

    const startStream = async () => {
        try {
            let mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(mediaStream);
        } catch (error) {
            console.error('stream couldnt be started via "startStream()"', error);
        }
    };

    const handleChange = evt => setInputState({...inputState, [evt.target.name]: evt.target.value});

    const handleCreatePeerConnection = evt => {
        const servers = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
        setPeerConnection(new RTCPeerConnection(servers));
        console.log('creating localPeerConnection');
    }

    const handleConnect = evt => {
        evt.preventDefault();

        console.log('handle connect', inputState);

        const description = new RTCSessionDescription(JSON.parse(inputState.description));
        if (description) {
            if (initiator && description.type === 'answer') {
                console.log('handle connect - initiator - answer received');
                peerConnection.setRemoteDescription(description);
            } else if (!initiator && description.type === 'offer') {
                console.log('handle connect - !initiator - offer received - now an answer should be created!');
                peerConnection.setRemoteDescription(description);

                peerConnection.createAnswer().then(description => {
                    peerConnection.setLocalDescription(description)
                    descriptionRef.current.value = JSON.stringify(description);

                    // TODO signal other peer
                });
            }
        }
    }

    const handleAddIceCandidates = evt => {
        evt.preventDefault();
        const parsedCandidates = JSON.parse(inputState.remoteIceCandidates);

        parsedCandidates.forEach(candidate => {
            console.log('addIceCandidate of remote peer:', candidate);
           peerConnection.addIceCandidate(candidate);
        });
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.left}>
                <h2>My Stream</h2>
                {/* will play a livestream of your own webcam whenever available */}
                <video ref={localVideo} className={styles.video} />

                <h2>Remote Stream</h2>
                {/* will play a livestream of the remote webcam whenever connection is established stream and available */}
                <video ref={remoteVideo} className={styles.video} />
            </div>

            <div className={styles.right}>
                <button onClick={() => setInitiator(!initiator)}>
                    {initiator ? 'Change to receiving Peer' : 'Change to Initializing Peer'}
                </button>

                {/* click to start a livestream of your own webcam */}
                <button onClick={startStream}>Start My Stream</button>

                {/* click to initialize this user as a peer */}
                <button onClick={handleCreatePeerConnection}>{`Init This Peer ${initiator ? '(Generates Offer)' : ''}`}</button>


                <form onSubmit={handleConnect} className={[styles.form, styles.connectForm].join(' ')}>
                    <fieldset>
                        <legend>Connect</legend>
                        <textarea
                            name='description'
                            id='description'
                            onChange={handleChange}
                            value={inputState.description}
                            placeholder={`${initiator ? 'Enter Answer' : 'Enter Offer'} of other Peer`}
                        />

                        <button type='submit'>connect {!initiator ? '(Generates Answer)' : ''}</button>
                    </fieldset>
                </form>

                <form onSubmit={handleAddIceCandidates} className={[styles.form, styles.connectForm].join(' ')}>
                    <fieldset>
                        <legend>Add the ICE Candidates of other peer</legend>
                        <textarea
                            name='remoteIceCandidates'
                            id='remoteIceCandidates'
                            onChange={handleChange}
                            value={inputState.remoteIceCandidates}
                            placeholder='Enter the ICE Candidates of the other peer'
                        />

                        <button type='submit'>Add Candidates</button>
                    </fieldset>
                </form>

                {/*<form onSubmit={handleSendMessage} className={[styles.form, styles.sendMessageForm].join(' ')}>*/}
                {/*    <fieldset>*/}
                {/*        <legend>Send Message to Peer</legend>*/}
                {/*        <input*/}
                {/*            type='text'*/}
                {/*            aria-label='chat input'*/}
                {/*            name='message'*/}
                {/*            value={inputState.message}*/}
                {/*            onChange={handleChange}*/}
                {/*            placeholder='Hello Peer...'*/}
                {/*        />*/}
                {/*        <button type='submit'>send</button>*/}
                {/*    </fieldset>*/}
                {/*</form>*/}
            </div>

            <div className={styles.description}>
                <h2 className={styles.descriptionLabel}>{initiator ? 'Offer' : 'Answer'}</h2>
                <div>Once it appears, give the {initiator ? 'Offer' : 'Answer'} below to the other peer</div>
                <textarea className={styles.descriptionTextarea} ref={descriptionRef} disabled/>
            </div>

            <div className={styles.iceCandidates}>
                <h1 className={styles.iceCandidatesLabel}>Ice Candidates</h1>
                <div>Once they appear give them to the other peer</div>
                <textarea className={styles.iceCandidatesTextarea} ref={iceCandidatesRef} disabled/>
            </div>

        </div>
    );
};

export default VideoVanillaWebRTC;

/*
- NAT (NAT = Network Address Translation)
- STUN SERVER ( STUN = Session Traversal of UDP Through NATs ) (also STUN = Session Traversal Utilities for NAT )
- TURN SERVER ( TURN = Traversal Using Relay NAT )
- ICE CANDIDATES (ICE = Interactive Connectivity Establishment)
*/


// TODO add dataChannel to send messages

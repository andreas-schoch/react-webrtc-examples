import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import VideoSimplePeer from '../VideoSimplePeer/VideoSimplePeer';
import VideoPeerJS from '../VideoPeerJS/VideoPeerJS';
import VideoVanillaWebRTC from '../VideoVanillaWebRTC/VideoVanillaWebRTC';

const App = () => {
    return (
        <Router>
            <Link to='/vanilla-webrtc'>Vanilla WebRTC Test</Link>
            <Link to='/simplepeer'>Simple Peer Test</Link>
            <Link to='/peerjs'>Peer JS Test</Link>

            <Switch>
                <Route path='/simplepeer' component={VideoSimplePeer} />
                <Route path='/peerJS' component={VideoPeerJS} />
                <Route path='/vanilla-webrtc' component={VideoVanillaWebRTC} />
            </Switch>
        </Router>
    );
};

export default App;

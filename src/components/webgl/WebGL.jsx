import React from "react";
import { Canvas } from "@react-three/fiber";

import './WebGL.scss';
import CheckerShader from "./shaders/CheckerShader";
import MetaballShader from "./shaders/MetaballShader";
import HyperRealShader from "./shaders/HyperRealShader";




class WebGL extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            init_time: Date.now(),
            time: 0,
            aspect_ratio: 1920/1080
        }

        
    }

    componentDidMount() {
        this.interval = setInterval( () => { 
            const width = this.element.clientWidth;
            const height = this.element.clientHeight;
            if(width/height !== this.state.aspect_ratio) {
                this.setState({ aspect_ratio: width/height });

            }
        }, 1000/5);
        
    }

    componentWillUnmount () {
        clearInterval(this.interval);
    }

    render() {
        console.log("Rerender: "+this.state.aspect_ratio);
        return (
            <div className = "webgl-div-container" ref={ (element) => { this.element = element } } style = {{width: "100%", height: "100vh"}} >
                <Canvas>
                    <HyperRealShader vertex={ this.props.vertex } fragment={ this.props.fragment } aspect_ratio={ this.state.aspect_ratio }/>
                </Canvas>
                <Canvas>
                    <MetaballShader vertex={ this.props.vertex } fragment={ this.props.fragment } aspect_ratio={ this.state.aspect_ratio }/>
                </Canvas>
                <Canvas>
                    <CheckerShader vertex={ this.props.vertex } fragment={ this.props.fragment } aspect_ratio={ this.state.aspect_ratio }/>
                </Canvas>
            </div>
        );
    }
}

export default WebGL;
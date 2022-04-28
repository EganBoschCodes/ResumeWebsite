import React from 'react';
import ReactDOM from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber'

import Navbar from 'components/navbar/Navbar';
import Banner from 'components/banner/Banner';
import Counter from 'components/counter/Counter';
import Dragbox from 'components/dragbox/Dragbox';
import DragDropbox from 'components/dragdropbox/DragDropbox';
import Box from 'components/three-box/Box';
import WebGL from 'components/webgl/WebGL';

import banner_img from 'assets/banner-img.jpg';

import demofrag from "assets/shaders/fragment/demofrag.glsl";
import demovert from "assets/shaders/vertex/demovert.glsl";

import "./index.scss";

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  /* 
    <Navbar />
    <Banner splash="Hire Me" src={ banner_img } />
  */
  <React.StrictMode>
    <WebGL fragment= "demofrag" vertex={ demovert } />
  </React.StrictMode>
);

import React from "react";
import { Vector3 } from "three";

class Vector3D {
    constructor (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    mag () {
        return Math.sqrt(this.mag2());
    }

    mag2 () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    add (v) {
        return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    mult (c) {
        return new Vector3D(this.x * c, this.y * c, this.z * c);
    }

    diff (v) {
        return this.add(v.mult(-1));
    }

    norm () {
        return this.mult(1 / this.mag());
    }

    v3 () { return new Vector3(this.x, this.y, this.z) }

}

class Camera {
    constructor (x, y, z) {
        this.position = [x, y, z];
        
        this.heading = [0, 0];
    }

    pos () {
        return new Vector3D(this.position[0], this.position[1], this.position[2]);
    }

    move (x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;

        return this;
    }

    moveTo (x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;

        return this;
    }

    lookAt(x, y, z) {
		this.heading[0] = Math.atan2(x - this.position[0], z - this.position[2]);
		this.heading[1] = Math.atan((y - this.position[1]) / Math.sqrt((x - this.position[0]) * (x - this.position[0]) + (z - this.position[2]) * (z - this.position[2])));

        return this;
	}

    turn (dt, dp) {
        this.heading[0] += dt;
        this.heading[1] += dp;

        return this;
    }

    getHeadingX () {
        return new Vector3D(Math.cos(this.heading[0]), 0, -Math.sin(this.heading[0]));
    }

    getHeadingY () {
        return new Vector3D(-Math.sin(this.heading[1]) * Math.sin(this.heading[0]), Math.cos(this.heading[1]), -Math.sin(this.heading[1]) * Math.cos(this.heading[0]));
    }

    getHeadingZ () {
        return new Vector3D(Math.sin(this.heading[0]), Math.sin(this.heading[1]), Math.cos(this.heading[0]) * Math.cos(this.heading[1]));
    }
}

class HyperRealShader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            init_time: Date.now(),
            time: 0,
            aspect_ratio: props.aspect_ratio,
            camera: new Camera(500, 100, 500),



            vert_shader: `
            varying vec4 pos;

            uniform float time;
            uniform float aspect_ratio;

            uniform vec3 camera_position;
            uniform vec3 camera_heading_x;
            uniform vec3 camera_heading_y;
            uniform vec3 camera_heading_z;

            varying float frames;

            float FOV = 1.5;
            
            void main() {
                gl_Position = vec4(position, 1.0);
                frames = time * 500.0;
                pos = vec4(position.xy, FOV, aspect_ratio);
            }`,

            frag_shader: `
            varying vec4 pos;

            uniform float time;
            uniform float aspect_ratio;

            uniform vec3 camera_position;
            uniform vec3 camera_heading_x;
            uniform vec3 camera_heading_y;
            uniform vec3 camera_heading_z;

            varying float frames;

            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
            vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

            float cnoise(vec3 P){
                vec3 Pi0 = floor(P); // Integer part for indexing
                vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
                Pi0 = mod(Pi0, 289.0);
                Pi1 = mod(Pi1, 289.0);
                vec3 Pf0 = fract(P); // Fractional part for interpolation
                vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
                vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                vec4 iy = vec4(Pi0.yy, Pi1.yy);
                vec4 iz0 = Pi0.zzzz;
                vec4 iz1 = Pi1.zzzz;
              
                vec4 ixy = permute(permute(ix) + iy);
                vec4 ixy0 = permute(ixy + iz0);
                vec4 ixy1 = permute(ixy + iz1);
              
                vec4 gx0 = ixy0 / 7.0;
                vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
                gx0 = fract(gx0);
                vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                vec4 sz0 = step(gz0, vec4(0.0));
                gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                gy0 -= sz0 * (step(0.0, gy0) - 0.5);
              
                vec4 gx1 = ixy1 / 7.0;
                vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
                gx1 = fract(gx1);
                vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                vec4 sz1 = step(gz1, vec4(0.0));
                gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                gy1 -= sz1 * (step(0.0, gy1) - 0.5);
              
                vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
                vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
                vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
                vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
                vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
              
                vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                g000 *= norm0.x;
                g010 *= norm0.y;
                g100 *= norm0.z;
                g110 *= norm0.w;
                vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                g001 *= norm1.x;
                g011 *= norm1.y;
                g101 *= norm1.z;
                g111 *= norm1.w;
              
                float n000 = dot(g000, Pf0);
                float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                float n111 = dot(g111, Pf1);
              
                vec3 fade_xyz = fade(Pf0);
                vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
                return 2.2 * n_xyz;
            }

            vec3 getBallPos(float a, float b, float c) {
                return vec3(120.0 * sin(frames / 2000.0 * a), 120.0 * sin(frames / 2000.0 * b), 120.0 * sin(frames / 2000.0 * c));
            }

            float ballWeight(int index, vec3 position, float[6] sizes, vec3[6] positions) {
                float size = sizes[index];
                vec3 offset = position - positions[index];
                return size * size / (offset.x * offset.x + offset.y * offset.y + offset.z * offset.z);
            }

            float equation(vec3 pos, float[6] sizes, vec3[6] positions) {
                float sum = 0.0;
                for(int i = 0; i < 6; i++) {
                    sum += ballWeight(i, pos, sizes, positions);
                }
                return sum /*+ cnoise(pos/3)/40*/;
            }

            vec3 getGradient (vec3 pos, float[6] sizes, vec3[6] positions) {
	
                vec3 gradient = vec3(0.0);
            
                for (int index = 0; index < 6; index++) {
                    vec3 offset = pos - positions[index];
                    float offsetmagsq = dot(offset, offset);
                    float factor = 2.0 * sizes[index] * sizes[index] / (offsetmagsq * offsetmagsq);
                    gradient.x += factor * offset.x;
                    gradient.y += factor * offset.y;
                    gradient.z += factor * offset.z;
                }
            
            
                return normalize(gradient);
            
                /*float normEpsilon = 0.01;
                float dx = equation(vec3(pos.x + normEpsilon, pos.yz)) - equation(vec3(pos.x - normEpsilon, pos.yz));
                float dy = equation(vec3(pos.x, pos.y + normEpsilon, pos.z)) - equation(vec3(pos.x, pos.y - normEpsilon, pos.z));
                float dz = equation(vec3(pos.xy, pos.z + normEpsilon)) - equation(vec3(pos.xy, pos.z - normEpsilon));
            
                return -normalize(vec3(dx, dy, dz));*/
            
            }

            vec3 getColorAtPoint(vec3 pos, float[6] sizes, vec3[6] positions, vec3[6] colors) {
                float differential = 3.0;
            
                float weight1 = pow(ballWeight(0, pos, sizes, positions), differential);
                float weight2 = pow(ballWeight(1, pos, sizes, positions), differential);
                float weight3 = pow(ballWeight(2, pos, sizes, positions), differential);
                float weight4 = pow(ballWeight(3, pos, sizes, positions), differential);
                float weight5 = pow(ballWeight(4, pos, sizes, positions), differential);
                float weight6 = pow(ballWeight(5, pos, sizes, positions), differential);
            
                float sum = weight1  + weight2  + weight3  + weight4  + weight5  + weight6;
            
                //int grid_size = 80;
                //vec3 grid = vec3(int(pos.x) % grid_size, int(pos.y) % grid_size, int(pos.z) % grid_size);
                
                //int grid_sum = (grid.x < grid_size/2 ? 1 : 0) + (grid.y < grid_size/2 ? 1 : 0) + (grid.z < grid_size/2 ? 1 : 0);
            
                //if(grid_sum % 2 == 0) {
                    //sum *= 2;
                //}
                //vec3 gradient = getGradient(pos);
                return (colors[0] * weight1 + colors[1] * weight2 + colors[2] * weight3 + colors[3] * weight4 + colors[4] * weight5 + colors[5] * weight6) / sum ;
            
            }

            vec4 clampColor (float r, float g, float b) {

                vec3 retcol = vec3(min(r, 1.0), min(g, 1.0), min(b, 1.0));
                if(r > 1.0) {
                    retcol.y += (r - 1.0) * 0.4;
                    retcol.z += (r - 1.0) * 0.1;
                }
                if(g > 1.0) {
                    retcol.x += (g - 1.0) * 0.25;
                    retcol.z += (g - 1.0) * 0.25;
                }
                if(b > 1.0) {
                    retcol.x += (b - 1.0) * 0.1;
                    retcol.y += (b - 1.0) * 0.4;
                }
                return vec4(retcol, 1.0);
            }

            float stepSize(float eq) {
                return max(10.0, 5.0/eq);
            }

            void main() {

                vec3 colors[6] = vec3[](vec3(1.0, 0.1, 0.0), vec3(0.5, 0.8, 0.1), vec3(0.0, 0.2, 1.0), vec3(0.8, 0.1, 0.2), vec3(1.0, 1.0, 0.1), vec3(0.22, 0.8, 0.42));
                vec3 positions[6] = vec3[](getBallPos(5.0,3.0,7.0), getBallPos(4.7,-3.0,2.1), getBallPos(1.7,3.8,2.4), getBallPos(-3.2,1.0,-4.0), getBallPos(3.8,-7.2,5.3), getBallPos(8.3,5.2,-3.0));;
                float sizes[6] = float[](30.0, 50.0, 30.0, 50.0, 70.0, 100.0);

                vec3 light_source = vec3(200, 400, 100);

                vec3 ray = camera_position;
                vec3 direction = normalize(camera_heading_x * pos.x * pos.w + camera_heading_y * pos.y + camera_heading_z * pos.z);

                float stepsize;
                float lasteq;

                while (distance(camera_position, ray) < 1000.0) {
                    float eq = equation(ray, sizes, positions);

                    if (eq > 1.0) {

                        ray -= direction * stepsize * (eq-1.0)/(eq - lasteq);

                        vec3 light_angle = normalize(light_source - ray);
                        vec3 view_angle = normalize(camera_position - ray);

                        vec3 gradient = getGradient(ray, sizes, positions);

                        float diffuse = clamp(dot(light_angle, gradient), 0.0, 1.0) + 0.1;
                        float specular = pow(clamp(dot(normalize(light_angle + view_angle), gradient), 0.0, 1.0), 20.0);

                        vec3 ball_color = getColorAtPoint(ray, sizes, positions, colors);

                        gl_FragColor = clampColor(diffuse * ball_color.x + specular, diffuse*ball_color.y + specular, diffuse*ball_color.z + specular);
                        return;
                    }
                    
                    stepsize = stepSize(eq);
                    ray += direction * stepsize;
                    lasteq = eq;

                }

                float light = 0.2 + abs(direction.y / 2.0);
	            gl_FragColor = vec4(light * 0.3, light*0.5, light, 1.0);
            }`
        }
    }
    
    async componentDidMount () {

        //this.setState( {vert_shader: await this.read_file(this.props.vertex), frag_shader: await this.read_file(this.props.fragment)} );
        //console.log("LOADED");
        //console.log(this.state.vert_shader);
        //console.log(this.state.frag_shader);
        this.setState( {camera: this.state.camera.lookAt(0, -40, 0)} );

        this.interval = setInterval( () => { this.setState( {time: (Date.now() - this.state.init_time) / 1000 });  }, 1000/60);
    }

    componentWillUnmount () {
        clearInterval(this.interval);
    }

    render() {
        return (
            <mesh>
                <planeBufferGeometry args={[3, 5]} />
                <shaderMaterial
                attach="material"
                args={[{
                    uniforms: {
                        time: {type: 'f', value: this.state.time},
                        aspect_ratio: {type: 'f', value: this.props.aspect_ratio},

                        camera_position: {type: 'vec3', value: this.state.camera.pos().v3()},

                        camera_heading_x: {type: 'vec3', value: this.state.camera.getHeadingX().v3()},
                        camera_heading_y: {type: 'vec3', value: this.state.camera.getHeadingY().v3()},
                        camera_heading_z: {type: 'vec3', value: this.state.camera.getHeadingZ().v3()}
                    },
                    vertexShader: this.state.vert_shader,
                    fragmentShader: this.state.frag_shader,
                }]}
                />
            </mesh>
        );
        
    }
}

export default HyperRealShader;
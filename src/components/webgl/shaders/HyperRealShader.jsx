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

class MetaballShader extends React.Component {
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

            varying vec4[3] solids;

            varying float frames;

            float FOV = 1.5;
            
            void main() {
                gl_Position = vec4(position, 1.0);
                frames = time * 500.0;
                pos = vec4(position.xy, FOV, aspect_ratio);

                solids = vec4[](vec4(0, 0, -40, 60), vec4(100, 20, 80, 70), vec4(-90, 30, -70, 30));
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

            varying vec4[3] solids;

            float modBetween(float a, float mn, float mx) {
                return mod(a - mn, mx - mn) + mn;
            }
            
            float merge(float a, float b) {
                return min(a, b);
            }
            
            float smin(float a, float b, float k) {
              float h = clamp(0.5 + 0.5 * (a - b)/k, 0.0, 1.0);
              return mix(a, b, h) - k * h * (1.0 - h);
            }
            
            float intersection(float a, float b) {
                return max(a, b);
            }
            
            float removal(float a, float b) {
                return max(a, -b);
            }
            
            float satur(float a) {
                return clamp((a + 1.0)/2.0, 0.0, 1.0);
            }
            
            float bind(vec3 loc, float box_size) {
                return min(box_size - loc.x, min(loc.x + box_size, min(box_size - loc.y, min(loc.y + box_size, min(box_size - loc.z, loc.z + box_size)))));
            }


            float sphereDist(vec3 loc, vec4 sphere) {
                return length(loc - sphere.xyz) - sphere.w;
            }
            
            float cubeDist(vec3 loc, vec4 cube) {
                loc -= cube.xyz;
                float maxOut = max(abs(loc.x), max(abs(loc.y), abs(loc.z)));
                return maxOut - cube.w/2.0;
            }
            
            float torusDist(vec3 loc, float[5] torus) {
                loc -= vec3(torus[0], torus[1], torus[2]);
                float lenHoriz = length(loc.xz);
                return length(vec2(lenHoriz - torus[3], loc.y)) - torus[4];
            }



            float distEstimator(vec3 loc) {
                return merge(merge(merge(torusDist(loc, float[5](0.0, -40.0, 100.0, 50.0, 20.0)), smin(sphereDist(loc, solids[2]), sphereDist(loc, solids[2] + vec4(-30.0,40.0,-30.0,10.0)), 30.0)), cubeDist(loc, solids[1])), abs(loc.x) < 3000.0 && abs(loc.z) < 3000.0 ? loc.y + 400.0 : 10000.0);
            }

            vec3 getColor(vec3 loc) {
                return torusDist(loc, float[5](0.0, -40.0, 100.0, 50.0, 20.0)) < 1.0 ? vec3(1.0, 0.0, 0.0) : cubeDist(loc, solids[1]) < 1.0 ? vec3(0.0, 1.0, 0.02) : loc.y < -200.0 ? vec3(1.0, 1.0, 1.0) : vec3(0.0, 0.0, 1.0);
            }

            vec4 getMaterialProperties(vec3 loc) {
                return loc.y < -200.0 ? vec4(0.4, 0.6, 0.0, 0.4) : vec4(0.8, 0.2, 2.5, 0.7);
            }

            vec3 normAt(vec3 loc) {

                float normEpsilon = 0.001;

                float dx = distEstimator(vec3(loc.x + normEpsilon, loc.yz)) - distEstimator(vec3(loc.x - normEpsilon, loc.yz));
                float dy = distEstimator(vec3(loc.x, loc.y + normEpsilon, loc.z)) - distEstimator(vec3(loc.x, loc.y - normEpsilon, loc.z));
                float dz = distEstimator(vec3(loc.xy, loc.z + normEpsilon)) - distEstimator(vec3(loc.xy, loc.z - normEpsilon));
            
                return normalize(vec3(dx, dy, dz));
            }

            vec2 clearBetween(vec3 a, vec3 b) {
                vec3 c = a;
                float de = distEstimator(a);
                vec3 dir = normalize(b - a);
                
                float lastSteps = 0.0;
                while(de > 0.01 && length(b - c) >= length(b - a)) {
                    lastSteps++;
                    a += dir * de;
                    de = distEstimator(a);
                }
            
                return vec2((de < 0.01) ? (length(a - b) < 1.0 ? 1.0 : 0.0) : 1.0, lastSteps);
            }


            void main() {

                vec3 light_pos = vec3(200.0, 240.0, 280.0);
                float lastSteps = 0.0;

                vec3 ray = camera_position;
                vec3 direction = normalize(camera_heading_x * pos.x * pos.w + camera_heading_y * pos.y + camera_heading_z * pos.z);

                vec3 colorOutput = vec3(0, 0, 0);
	            float continuedReflectiveness = 1.0;
                const float shadow_intensity = 0.0;

                vec3 colorData;
                while (continuedReflectiveness > 0.05) {
                    vec3 original = ray;
                    ray += direction * 10.0;
                    colorData = vec3(0.0, 0.0, 0.0);
                    while(length(ray-original) < 8000.0) {
                        float stepSize = distEstimator(ray);
                        if(stepSize <= 0.01) {
                            vec3 norm = normAt(ray);
                            vec3 light_vec = normalize(ray - light_pos);
                
                            vec2 clearCheck = clearBetween(light_pos, ray);
                            bool clear = clearCheck[0] == 1.0;
                            lastSteps = clearCheck[1];
                
                            float light_dot = satur(dot(norm, -light_vec));
                
                            vec3 specular_reflection = reflect(direction, norm);
                            float specular_dot = pow(satur(dot(specular_reflection, -light_vec)), 32.0);
                
                            direction = normalize(specular_reflection);
                
                            //x: diffuse light, y: ambient light, z: specular light, w: reflectiveness
                            vec4 mat_properties = getMaterialProperties(ray);
                
                            vec3 finalColor = getColor(ray);
                            finalColor *=  light_dot * mat_properties.x * (clear ? clamp((1.0-lastSteps/60.0) * (1.0-shadow_intensity), 0.0, 1.0 - shadow_intensity) + shadow_intensity : shadow_intensity) + mat_properties.y;
                            finalColor += vec3(1.0, 1.0, 1.0) * specular_dot * mat_properties.z * (clear ? 1.0 : 0.0);
                
                            colorData = finalColor;
                            break;
                        }
                        ray += direction * stepSize;
                    }

                    float reflectiveness = getMaterialProperties(ray).w;
                    if(length(colorData) > 0.0 && reflectiveness < 1.0) {
                        colorOutput += reflectiveness * continuedReflectiveness * colorData;
                        continuedReflectiveness *= 1.0 - reflectiveness;
                    }
                    else if(length(colorData) > 0.0) {
                        colorOutput += colorData * continuedReflectiveness;
                        break;
                    }
                    else {
                        break;
                    }
                }

                colorOutput += colorData * continuedReflectiveness;
                gl_FragColor = vec4(colorOutput, 1);
            }`
        }
    }
    
    async componentDidMount () {

        //this.setState( {vert_shader: await this.read_file(this.props.vertex), frag_shader: await this.read_file(this.props.fragment)} );
        //console.log("LOADED");
        //console.log(this.state.vert_shader);
        //console.log(this.state.frag_shader);
        this.setState( {camera: this.state.camera.lookAt(0, -40, 0)} );

        this.interval = setInterval( () => { 
            this.setState( {
                time: (Date.now() - this.state.init_time) / 1000,
                camera: this.state.camera.moveTo(Math.cos(this.state.time) * 500, 100, Math.sin(this.state.time) * 500).lookAt(0, -40, 0)
            });  
        
        
        }, 1000/60);
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

export default MetaballShader;
import React from "react";

class CheckerShader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            init_time: Date.now(),
            time: 0,
            aspect_ratio: props.aspect_ratio,

            vert_shader: `
            varying vec4 pos;

            uniform float time;
            uniform float aspect_ratio;

            varying vec2 boing_pos;
            varying vec2 boing_pos2;
            varying vec2 boing_pos3;

            float FOV = 1.5;
            
            float true_mod(float inp, float modulo) {
                return inp - floor(inp/modulo) * modulo;
            }

            float double_mod(float inp, float modulo) {
                float inp2 = true_mod(inp, modulo * 2.0);
                if (inp2 > modulo) {
                    inp2 = 2.0 * modulo - inp2;
                }
                return inp2;
            }
            
            void main() {

                float frames = time * 10.0;

                boing_pos = vec2(double_mod(frames * 2.0, FOV * 1000.0) - FOV * 500.0, double_mod(frames*0.8, 1000.0) - 500.0);
                boing_pos2 = vec2(double_mod(frames * 1.8 + 300.0, FOV * 1000.0) - FOV * 500.0, double_mod(frames*2.0 + 900.0, 1000.0) - 500.0);
                boing_pos3 = vec2(double_mod(frames * 3.24 + 900.0, FOV * 1000.0) - FOV * 500.0, double_mod(frames*0.76 + 200.0, 1000.0) - 500.0);

                gl_Position = vec4(position, 1.0);
                pos = vec4(position.xy, FOV, aspect_ratio);

            }`,

            frag_shader: `
            varying vec4 pos;

            uniform float time;
            uniform float aspect_ratio;

            varying vec2 boing_pos;
            varying vec2 boing_pos2;
            varying vec2 boing_pos3;

            float true_mod(float inp, float modulo) {
                return inp - floor(inp/modulo) * modulo;
            }

            float double_mod(float inp, float modulo) {
                float inp2 = true_mod(inp, modulo * 2.0);
                if (inp2 > modulo) {
                    inp2 = 2.0 * modulo - inp2;
                }
                return inp2;
            }

            float height_map (vec2 pos) {
                float height_1 = 1000000.0/(dot(vec2(pos.x - boing_pos.x, pos.y - boing_pos.y), vec2(pos.x - boing_pos.x, pos.y - boing_pos.y)) + 10000.0);
                float height_2 = 1000000.0/(dot(vec2(pos.x - boing_pos2.x, pos.y - boing_pos2.y), vec2(pos.x - boing_pos2.x, pos.y - boing_pos2.y)) + 10000.0);
                float height_3 = 1000000.0/(dot(vec2(pos.x - boing_pos3.x, pos.y - boing_pos3.y), vec2(pos.x - boing_pos3.x, pos.y - boing_pos3.y)) + 10000.0);
            
                return height_1 + height_2 + height_3;
            }

            float step_size (vec3 pos) {
                return pos.z > 300.0 ? 50.0 : 20.0;
            }

            void main() {

                vec3 ray = vec3(0.0, 0.0, 500.0);
                vec3 direction = normalize(vec3(pos.x * pos.w, pos.y, -1));

                float grid_size = 200.0;

                float last_step;
                float last_offset;
                float current_height;
                while (ray.z > (current_height = height_map(ray.xy))) {
                    last_offset = ray.z - current_height;
                    last_step = step_size(ray);
                    ray += last_step * direction;
                }

                //Overstep Correction (Approximate, but it's pretty good)
                ray -= last_step * direction * (current_height - ray.z) / (current_height - ray.z + last_offset);

                //Determining what color tile the point lies on.
                float checker = clamp(true_mod(((true_mod(ray.x - time * 30.0, grid_size * 2.0) > grid_size ? 1.0 : 0.0) + (true_mod(ray.y - time * 20.0, grid_size * 2.0) > grid_size ? 1.0 : 0.0)), 2.0), 0.1, 1.0);
                
                //Lighting Things
                vec3 light_source = vec3(-800.0, 800.0, 400.0);
                vec3 lighting_vector = normalize(light_source - ray);

                vec3 surface_dx = vec3(ray.xy, height_map(ray.xy)) - vec3(ray.x + 1.0, ray.y, height_map(vec2(ray.x + 1.0, ray.y)));
                vec3 surface_dy = vec3(ray.xy, height_map(ray.xy)) - vec3(ray.x, ray.y + 1.0, height_map(vec2(ray.x, ray.y + 1.0)));

                vec3 surface_normal = normalize(cross(surface_dx, surface_dy));


                float diffuse_lighting = clamp(dot(surface_normal, lighting_vector), 0.0, 1.0) * 0.95 + 0.05;

                gl_FragColor = vec4(vec3(checker) * diffuse_lighting, 1.0);
            }`
        }
    }

    async read_file (file) {
        var raw = await fetch(require(file));
        var text = await raw.text();
        return text;
    }
    
    async componentDidMount () {

        //this.setState( {vert_shader: await this.read_file(this.props.vertex), frag_shader: await this.read_file(this.props.fragment)} );
        //console.log("LOADED");
        //console.log(this.state.vert_shader);
        //console.log(this.state.frag_shader);

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
                        aspect_ratio: {type: 'f', value: this.props.aspect_ratio}
                    },
                    vertexShader: this.state.vert_shader,
                    fragmentShader: this.state.frag_shader,
                }]}
                />
            </mesh>
        );
        
    }
}

export default CheckerShader;
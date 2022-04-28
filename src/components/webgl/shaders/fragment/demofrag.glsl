varying vec2 pos;
uniform float uTime;

void main() {
    gl_FragColor = vec4((sin(pos.x * 10.0 + uTime) + 1.0)/2.0,
                        (sin(uTime) + 1.0)/2.0, 
                        (sin(pos.y * 10.0 + uTime) + 1.0)/2.0,
                        1.0); 
}
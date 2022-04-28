varying vec2 pos;

uniform float uTime;

void main() {
    gl_Position = vec4(position, 1.0);
    pos = (position.xy + 1.0)/2.0;
}
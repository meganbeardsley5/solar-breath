import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.Camera();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.PlaneGeometry(2, 2);

const uniforms = {
  u_time: { value: 0.0 },
  u_energy: { value: 0.5 },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  fragmentShader: `
    uniform float u_time;
uniform float u_energy;
uniform vec2 u_resolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

vec3 solarPalette(float t) {

  // expanded solar spectrum
  vec3 deep   = vec3(0.18, 0.05, 0.07);  // rose shadow
  vec3 ember  = vec3(0.85, 0.35, 0.12);  // coral core
  vec3 gold   = vec3(1.0, 0.75, 0.3);    // golden flare
  vec3 bloom  = vec3(0.95, 0.65, 0.75);  // soft mauve glow
  vec3 flare  = vec3(1.0, 0.92, 0.75);   // solar white

  vec3 col = mix(deep, ember, smoothstep(0.0, 0.3, t));
  col = mix(col, gold, smoothstep(0.2, 0.6, t));
  col = mix(col, bloom, smoothstep(0.5, 0.85, t));
  col = mix(col, flare, smoothstep(0.75, 1.0, t));

  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv -= 0.5;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.03;

  float n = noise(uv * 2.5 + t);
  float breath = sin(u_time * 0.1) * 0.5 + 0.5;

  float energyInfluence = mix(n, breath, u_energy);

  // slow hue drift for subtle color shifting
  float drift = sin(u_time * 0.02) * 0.5 + 0.5;

  vec3 color = solarPalette(energyInfluence + drift * 0.35);

  gl_FragColor = vec4(color, 1.0);
}
  `
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function animate(time) {
  uniforms.u_time.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

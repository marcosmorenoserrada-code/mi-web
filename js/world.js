// Constructores compartidos: terreno, agua, cielo, vegetación, cabañas y utilería.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- utilidades ---------- */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const wind = { uTime: { value: 0 }, uWind: { value: 1 } };

/* ---------- geografía del complejo ---------- */
export const ISLETS = [[82, -48, 15], [108, 22, 19], [70, 64, 10], [140, -14, 12], [52, -86, 9]];
export function coastX(z) { return 31 + 2.5 * Math.sin(z * 0.07) + 1.5 * Math.sin(z * 0.17 + 1.3) + Math.sin(z * 0.031 + 2); }
export function landD(x, z) {
  let d = coastX(z) - x;
  for (const [ix, iz, r] of ISLETS) d = Math.max(d, r - Math.hypot(x - ix, (z - iz) * 1.3));
  return d;
}
export function terrainH(x, z) {
  const d = landD(x, z);
  if (d < 0) return Math.max(d * 0.14, -5);
  const n = Math.sin(x * 0.13) * Math.cos(z * 0.11) * 0.25 + Math.sin(x * 0.041 + z * 0.05) * 0.35;
  return 1.1 * smooth(0, 9, d) + n * smooth(10, 26, d);
}
const GLSL_COAST = `
float coastX(float z){ return 31.0+2.5*sin(z*0.07)+1.5*sin(z*0.17+1.3)+sin(z*0.031+2.0); }
float landD(vec2 p){
  float d = coastX(p.y)-p.x;
  ${ISLETS.map(([x, z, r]) => `d=max(d,${r.toFixed(1)}-length(vec2(p.x-(${x.toFixed(1)}),(p.y-(${z.toFixed(1)}))*1.3)));`).join('\n  ')}
  return d;
}`;

/* ---------- texturas procedurales ---------- */
export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
export const TEX = {};
export function initTextures() {
  if (TEX.siding) return TEX;
  TEX.siding = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, y + 13, w, 3); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, y, w, 2); }
  }, [1, 1]);
  TEX.plank = canvasTex(256, 256, (g, w, h) => {
    const r = rng(7);
    for (let y = 0; y < h; y += 32) for (let x = -(y % 64); x < w; x += 128) {
      const v = 150 + r() * 50 | 0; g.fillStyle = `rgb(${v},${v * .78 | 0},${v * .55 | 0})`; g.fillRect(x, y, 128, 32);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y, 2, 32); g.fillRect(x, y + 30, 128, 2);
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(80,50,20,${r() * .12})`; g.fillRect(x, y + r() * 30, 128, 1); }
    }
  }, [1, 1]);
  TEX.deck = canvasTex(128, 128, (g, w, h) => {
    const r = rng(3);
    for (let x = 0; x < w; x += 16) { const v = 165 + r() * 40 | 0; g.fillStyle = `rgb(${v},${v * .86 | 0},${v * .72 | 0})`; g.fillRect(x, 0, 16, h); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 14, 0, 2, h); }
  }, [1, 1]);
  TEX.glow = canvasTex(64, 64, (g, w) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(.25, 'rgba(255,200,120,.55)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
  TEX.cloud = canvasTex(256, 128, (g) => {
    const r = rng(11);
    for (let i = 0; i < 26; i++) {
      const x = 40 + r() * 176, y = 60 + (r() - .5) * 40, rad = 18 + r() * 34;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    }
  });
  TEX.road = canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#4a4c4e'; g.fillRect(0, 0, w, h);
    const r = rng(5); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${r() * .06})`; g.fillRect(r() * w, r() * h, 1, 1); }
    g.fillStyle = '#e2c25a'; g.fillRect(30, 0, 4, 120);
    g.fillStyle = '#ddd'; g.fillRect(2, 0, 2, h); g.fillRect(w - 4, 0, 2, h);
  }, [1, 40]);
  TEX.gravel = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#d6c9a8'; g.fillRect(0, 0, w, h);
    const r = rng(9); for (let i = 0; i < 900; i++) { const v = 160 + r() * 80 | 0; g.fillStyle = `rgba(${v},${v * .93 | 0},${v * .8 | 0},.8)`; g.fillRect(r() * w, r() * h, 2, 2); }
  }, [1, 1]);
  return TEX;
}
export function labelTex(text, { bg = '#0f2a33', fg = '#f6efe2', w = 128, h = 128, font = '600 76px Fraunces, Georgia, serif', round = true } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; if (round) { g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 7); g.fill(); g.strokeStyle = fg; g.lineWidth = 4; g.stroke(); } else g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
  });
}

/* ---------- viento en la vegetación ---------- */
export function windify(mat, strength = 0.02) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = wind.uTime; sh.uniforms.uWind = wind.uWind;
    sh.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float wh = max(position.y, 0.0);
      vec3 wp = vec3(0.0);
      #ifdef USE_INSTANCING
        wp = (instanceMatrix * vec4(0.,0.,0.,1.)).xyz;
      #endif
      float ph = wp.x*0.21 + wp.z*0.17;
      float sw = sin(uTime*1.3+ph) + 0.45*sin(uTime*3.3+ph*2.3+position.x);
      transformed.x += sw * wh * wh * ${strength.toFixed(4)} * uWind;
      transformed.z += cos(uTime*1.05+ph) * wh * wh * ${(strength * 0.6).toFixed(4)} * uWind;`);
  };
  mat.customProgramCacheKey = () => 'wind' + strength;
  return mat;
}

/* ---------- geometría con colores por vértice ---------- */
export function paint(geo, color) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  const c = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  const r = rng(n + Math.floor(c.r * 999));
  for (let i = 0; i < n; i += 3) { const k = 0.88 + r() * 0.24; for (let j = 0; j < 3; j++) { a[(i + j) * 3] = c.r * k; a[(i + j) * 3 + 1] = c.g * k; a[(i + j) * 3 + 2] = c.b * k; } }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
const tf = (geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));
  return geo.applyMatrix4(m);
};
function merge(list) { return mergeGeometries(list.map(g => { const x = g.index ? g.toNonIndexed() : g; x.deleteAttribute && ['uv1', 'uv2'].forEach(k => x.attributes[k] && x.deleteAttribute(k)); return x; }), false); }

// Palma sabal (Florida)
export function palmGeo(seed = 1) {
  const r = rng(seed), parts = [], H = 6.5, bend = 0.6 + r() * 0.6;
  const trunk = new THREE.CylinderGeometry(0.17, 0.26, H, 7, 10, true); trunk.translate(0, H / 2, 0);
  const p = trunk.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / H; p.setX(i, p.getX(i) + bend * y * y); const ring = Math.sin(p.getY(i) * 9) * 0.015; p.setX(i, p.getX(i) * (1 + ring)); }
  trunk.computeVertexNormals();
  parts.push(paint(trunk, '#7c6a52'));
  const top = [bend, H, 0];
  parts.push(paint(tf(new THREE.IcosahedronGeometry(0.42, 0), { p: top }), '#5c6b3a'));
  const N = 15;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + r() * 0.3, droop = -0.15 - r() * 0.55;
    const fan = new THREE.CircleGeometry(1.7 + r() * 0.5, 9, -0.8, 1.6); // abanico
    const fp = fan.attributes.position;
    for (let k = 0; k < fp.count; k++) { const x = fp.getX(k), y = fp.getY(k); const d = Math.hypot(x, y); fp.setZ(k, Math.sin(Math.atan2(y, x) * 9) * 0.08 * d - d * d * 0.12); }
    fan.rotateY(Math.PI / 2); // abre a lo largo de +x
    fan.rotateZ(droop); fan.rotateY(a); fan.translate(top[0], top[1], top[2]);
    parts.push(paint(fan, ['#5f7f3c', '#6b8a45', '#53733a', '#7b9150'][i % 4]));
  }
  return merge(parts);
}
// Roble vivo con musgo español
export function oakGeo(seed = 1) {
  const r = rng(seed), parts = [];
  parts.push(paint(tf(new THREE.CylinderGeometry(0.38, 0.6, 3.2, 7), { p: [0, 1.6, 0] }), '#5a4a3b'));
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + r(), len = 3 + r() * 2;
    parts.push(paint(tf(new THREE.CylinderGeometry(0.16, 0.3, len, 5), { p: [Math.cos(a) * len * 0.4, 3.4, Math.sin(a) * len * 0.4], r: [Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0] }), '#5a4a3b'));
  }
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = r() * 3.6, rad = 1.8 + r() * 1.6;
    parts.push(paint(tf(new THREE.IcosahedronGeometry(rad, 1), { p: [Math.cos(a) * d, 4.6 + r() * 1.6, Math.sin(a) * d], s: [1.25, 0.7, 1.25] }), ['#3f5a2e', '#4a6634', '#56713a'][i % 3]));
  }
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2, d = 1.5 + r() * 3.5;
    parts.push(paint(tf(new THREE.ConeGeometry(0.22, 1.3 + r(), 4), { p: [Math.cos(a) * d, 3.6 + r() * 0.8, Math.sin(a) * d], r: [Math.PI, 0, 0] }), '#a3a888'));
  }
  return merge(parts);
}
// Pino de Florida
export function pineGeo(seed = 1) {
  const r = rng(seed), parts = [], H = 10 + r() * 3;
  parts.push(paint(tf(new THREE.CylinderGeometry(0.18, 0.32, H, 6), { p: [0, H / 2, 0] }), '#6b5340'));
  for (let i = 0; i < 5; i++) parts.push(paint(tf(new THREE.DodecahedronGeometry(1.2 + r() * 0.8, 0), { p: [(r() - .5) * 2.4, H - 1.5 + r() * 2, (r() - .5) * 2.4], s: [1.2, 0.7, 1.2] }), ['#35502f', '#3e5c35'][i % 2]));
  return merge(parts);
}
export function cedarGeo(seed = 1) {
  const r = rng(seed), parts = [], H = 5 + r() * 2;
  parts.push(paint(tf(new THREE.CylinderGeometry(0.12, 0.2, 1.4, 5), { p: [0, 0.7, 0] }), '#5e4636'));
  parts.push(paint(tf(new THREE.ConeGeometry(1.5, H, 7), { p: [0, 1 + H / 2, 0] }), '#2f4a33'));
  return merge(parts);
}
export function shrubGeo(seed = 1, color = '#4f6f37') {
  const r = rng(seed), parts = [];
  for (let i = 0; i < 3; i++) parts.push(paint(tf(new THREE.IcosahedronGeometry(0.55 + r() * 0.35, 0), { p: [(r() - .5) * .9, 0.45 + r() * .2, (r() - .5) * .9], s: [1.2, .85, 1.2] }), color));
  return merge(parts);
}
export function palmettoGeo(seed = 1) { // palmito bajo
  const r = rng(seed), parts = [];
  for (let i = 0; i < 9; i++) {
    const fan = new THREE.CircleGeometry(0.8 + r() * .3, 7, -0.7, 1.4); fan.rotateY(Math.PI / 2); fan.rotateZ(0.5 + r() * 0.5); fan.rotateY(i * 0.7 + r()); fan.translate(0, 0.25, 0);
    parts.push(paint(fan, ['#6a8a45', '#5a7a3d'][i % 2]));
  }
  return merge(parts);
}
export function grassGeo() { return paint(tf(new THREE.ConeGeometry(0.05, 0.9, 3), { p: [0, 0.45, 0] }), '#b9b37a'); }
export function flowerGeo() { return paint(tf(new THREE.OctahedronGeometry(0.12, 0), { p: [0, 0.35, 0] }), '#ffffff'); }

/* ---------- materiales ---------- */
export const MAT = {};
export function initMaterials() {
  if (MAT.trim) return MAT;
  initTextures();
  MAT.trim = new THREE.MeshStandardMaterial({ color: '#f7f4ec', roughness: .7 });
  MAT.found = new THREE.MeshStandardMaterial({ color: '#d9d4c7', roughness: .9 });
  MAT.lattice = new THREE.MeshStandardMaterial({ color: '#efe9db', roughness: .9 });
  MAT.deck = new THREE.MeshStandardMaterial({ map: TEX.deck, roughness: .85 });
  MAT.plank = new THREE.MeshStandardMaterial({ map: TEX.plank, roughness: .7 });
  MAT.dockWood = new THREE.MeshStandardMaterial({ color: '#9b8569', roughness: .95 });
  MAT.piling = new THREE.MeshStandardMaterial({ color: '#6f5d49', roughness: 1 });
  MAT.glass = new THREE.MeshStandardMaterial({ color: '#33505c', roughness: .12, metalness: .3, emissive: '#ffc97a', emissiveIntensity: 0 }); MAT.glass.userData.envBoost = 2.2; 
  MAT.bulb = new THREE.MeshStandardMaterial({ color: '#fff2cc', emissive: '#ffd08a', emissiveIntensity: .2 });
  MAT.screen = new THREE.MeshStandardMaterial({ color: '#1e2a2e', transparent: true, opacity: .38, roughness: .9, side: THREE.DoubleSide, depthWrite: false });
  MAT.metal = new THREE.MeshStandardMaterial({ color: '#8c949a', roughness: .4, metalness: .7 });
  MAT.dark = new THREE.MeshStandardMaterial({ color: '#2a3034', roughness: .6 });
  MAT.white = new THREE.MeshStandardMaterial({ color: '#f5f3ee', roughness: .5 });
  MAT.fabric = new THREE.MeshStandardMaterial({ color: '#e9e4d8', roughness: 1 });
  MAT.veg = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true }), 0.0035);
  MAT.palm = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, flatShading: true, side: THREE.DoubleSide }), 0.0016);
  MAT.grass = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), 0.25);
  MAT.flower = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8 }), 0.2);
  MAT.still = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true });
  MAT.gravel = new THREE.MeshStandardMaterial({ map: TEX.gravel, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return MAT;
}
const colMat = {};
export function cmat(c, opts = {}) { const k = c + JSON.stringify(opts); return colMat[k] || (colMat[k] = new THREE.MeshStandardMaterial({ color: c, roughness: .75, ...opts })); }

export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true; parent && parent.add(m); return m;
}
export function cyl(rt, rb, h, mat, x, y, z, parent, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent && parent.add(m); return m;
}

/* ---------- mobiliario exterior ---------- */
export function adirondack(color, parent, x, y, z, ry = 0) {
  const g = new THREE.Group(), m = cmat(color, { roughness: .6 });
  box(.7, .06, .65, m, 0, .38, 0, g); // asiento
  const back = box(.7, .9, .06, m, 0, .78, -.36, g); back.rotation.x = -.35;
  box(.08, .06, .8, m, -.4, .6, 0, g); box(.08, .06, .8, m, .4, .6, 0, g);
  [[-.38, .3], [.38, .3], [-.38, -.3], [.38, -.3]].forEach(([a, b]) => box(.06, .6, .06, m, a, .3, b, g));
  g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g;
}
export function tableUmbrella(parent, x, y, z, color = '#2fb3b0') {
  const g = new THREE.Group();
  cyl(.5, .5, .05, MAT.white, 0, .75, 0, g, 16); cyl(.04, .04, .75, MAT.metal, 0, .37, 0, g);
  cyl(.03, .03, 2.4, MAT.white, 0, 1.2, 0, g);
  const can = new THREE.Mesh(new THREE.ConeGeometry(1.4, .55, 8, 1, true), cmat(color, { side: THREE.DoubleSide, roughness: .9 }));
  can.position.y = 2.25; can.castShadow = true; g.add(can);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; const ch = new THREE.Group(); box(.42, .05, .42, cmat('#36b7b4'), 0, .45, 0, ch); box(.42, .5, .05, cmat('#36b7b4'), 0, .7, -.2, ch); [[-.18, .18], [.18, .18], [-.18, -.18], [.18, -.18]].forEach(([p, q]) => box(.03, .45, .03, MAT.metal, p, .22, q, ch, false)); ch.position.set(Math.cos(a) * .85, 0, Math.sin(a) * .85); ch.rotation.y = -a - Math.PI / 2; g.add(ch); }
  g.position.set(x, y, z); parent.add(g); return g;
}
export function grill(parent, x, y, z, gas = true) {
  const g = new THREE.Group();
  if (gas) { box(.9, .5, .5, MAT.dark, 0, .85, 0, g); box(.9, .25, .5, MAT.metal, 0, 1.2, -.05, g); box(.9, .6, .5, cmat('#3a3f44'), 0, .3, 0, g); }
  else { const k = new THREE.Mesh(new THREE.SphereGeometry(.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.6), MAT.dark); k.position.y = .95; k.castShadow = true; g.add(k); [0, 2.1, 4.2].forEach(a => { const l = box(.03, .8, .03, MAT.metal, Math.cos(a) * .25, .4, Math.sin(a) * .25, g, false); l.rotation.z = Math.cos(a) * .2; }); }
  g.position.set(x, y, z); parent.add(g); return g;
}
export function lampPost(parent, x, y, z, glowList) {
  const g = new THREE.Group();
  cyl(.05, .07, 2.6, MAT.dark, 0, 1.3, 0, g, 6);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), MAT.bulb); head.position.y = 2.7; g.add(head);
  g.position.set(x, y, z); parent.add(g); glowList && glowList.push(new THREE.Vector3(x, y + 2.7, z)); return g;
}
export function bike(parent, x, y, z, ry, color) {
  const g = new THREE.Group(), m = cmat(color, { metalness: .3, roughness: .5 });
  [-.5, .5].forEach(o => { const w = new THREE.Mesh(new THREE.TorusGeometry(.33, .03, 6, 18), MAT.dark); w.position.set(o, .35, 0); g.add(w); });
  const f = box(1, .05, .05, m, 0, .55, 0, g, false); f.rotation.z = .1;
  box(.05, .5, .05, m, -.2, .55, 0, g, false); box(.25, .05, .12, MAT.dark, -.2, .82, 0, g, false); box(.05, .1, .5, MAT.dark, .45, .9, 0, g, false);
  const bas = box(.3, .2, .3, cmat('#c9a46a'), .62, .82, 0, g, false);
  g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g;
}
export function golfCart(parent, x, y, z, ry, color = '#f3f0e6') {
  const g = new THREE.Group(), m = cmat(color, { roughness: .4 });
  box(2.2, .35, 1.1, m, 0, .45, 0, g); box(.7, .5, 1.1, m, .8, .75, 0, g); box(.8, .5, 1, cmat('#2b6f74'), -.2, .85, 0, g);
  box(2.3, .06, 1.2, m, 0, 2, 0, g); [[-.9, .5], [-.9, -.5], [.6, .5], [.6, -.5]].forEach(([a, b]) => box(.05, 1.3, .05, MAT.dark, a, 1.35, b, g, false));
  [[-.7, .58], [-.7, -.58], [.75, .58], [.75, -.58]].forEach(([a, b]) => { const w = cyl(.22, .22, .16, MAT.dark, a, .22, b, g, 12); w.rotation.x = Math.PI / 2; });
  g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g;
}
export function kayak(parent, x, y, z, ry, color) {
  const geo = new THREE.SphereGeometry(.5, 12, 6); geo.scale(3.2, .35, .62);
  const k = new THREE.Mesh(geo, cmat(color, { roughness: .4 })); k.position.set(x, y, z); k.rotation.y = ry; k.castShadow = true; parent.add(k); return k;
}
export function flag(parent, x, y, z) {
  const g = new THREE.Group(); cyl(.05, .06, 7, MAT.white, 0, 3.5, 0, g, 6);
  const geo = new THREE.PlaneGeometry(1.8, 1.1, 12, 4); geo.translate(.9, 0, 0);
  const tex = canvasTex(180, 110, (c) => { c.fillStyle = '#121a1e'; c.fillRect(0, 0, 180, 110); c.fillStyle = '#f2ead8'; c.beginPath(); c.arc(90, 46, 20, 0, 7); c.fill(); c.fillRect(76, 58, 28, 12); c.fillStyle = '#121a1e'; c.beginPath(); c.arc(82, 44, 6, 0, 7); c.arc(98, 44, 6, 0, 7); c.fill(); c.strokeStyle = '#f2ead8'; c.lineWidth = 7; c.beginPath(); c.moveTo(55, 75); c.lineTo(125, 100); c.moveTo(125, 75); c.lineTo(55, 100); c.stroke(); });
  const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: .9 })); f.position.y = 6.3; g.add(f);
  g.position.set(x, y, z); parent.add(g);
  const base = geo.attributes.position.array.slice();
  return t => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const bx = base[i * 3]; p.setZ(i, Math.sin(bx * 2.4 - t * 5) * .12 * bx); } p.needsUpdate = true; };
}
export function sign(parent, x, y, z, ry) {
  const g = new THREE.Group();
  const tex = canvasTex(512, 200, (c) => { c.fillStyle = '#0f2a33'; c.fillRect(0, 0, 512, 200); c.strokeStyle = '#d7a85b'; c.lineWidth = 8; c.strokeRect(12, 12, 488, 176); c.fillStyle = '#f6efe2'; c.textAlign = 'center'; c.font = '600 64px Fraunces, Georgia, serif'; c.fillText('Pirates Cove', 256, 92); c.font = '500 26px "Hanken Grotesk", sans-serif'; c.fillStyle = '#d7a85b'; c.fillText('COASTAL COTTAGES · CEDAR KEY', 256, 146); });
  box(.15, 2.2, .15, MAT.dockWood, -1.6, 1.1, 0, g); box(.15, 2.2, .15, MAT.dockWood, 1.6, 1.1, 0, g);
  const p = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.35, .1), [MAT.dockWood, MAT.dockWood, MAT.dockWood, MAT.dockWood, new THREE.MeshStandardMaterial({ map: tex }), new THREE.MeshStandardMaterial({ map: tex })]);
  p.position.y = 1.8; p.castShadow = true; g.add(p); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g;
}

/* ---------- cielo ---------- */
export function createSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() }, uNight: { value: 0 }, uTime: wind.uTime },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 uZenith,uHorizon,uSunColor,uSunDir; uniform float uNight,uTime; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){ vec3 d = normalize(vD); float y = max(d.y,0.0);
        vec3 col = mix(uHorizon, uZenith, pow(y, 0.55));
        float s = max(dot(d, normalize(uSunDir)), 0.0);
        col += uSunColor * (pow(s, 900.0)*3.0 + pow(s, 12.0)*0.35 + pow(s,3.0)*0.12) * (1.0-uNight*0.7);
        col = mix(col, uHorizon*0.85, smoothstep(0.0,-0.25,d.y));
        vec3 sp = floor(d*380.0); float st = step(0.9965, h(sp)) * smoothstep(0.05,0.4,d.y);
        col += vec3(st) * uNight * (0.6+0.4*sin(uTime*3.0+h(sp)*40.0));
        gl_FragColor = vec4(col,1.0);
        #include <colorspace_fragment>
      }`
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), mat); m.frustumCulled = false; m.renderOrder = -10;
  return m;
}

/* ---------- agua ---------- */
export function createWaterMaterial({ local = false, coast = 0 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, fog: false,
    uniforms: {
      uTime: wind.uTime, uDeep: { value: new THREE.Color('#14586b') }, uShallow: { value: new THREE.Color('#4fb9ad') },
      uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color('#fff') },
      uLight: { value: 1 }, uFog: { value: new THREE.Color() }, uFogD: { value: .002 }, uCoast: { value: coast }
    },
    vertexShader: `uniform float uTime; varying vec3 vW;
      float wave(vec2 p){ return sin(p.x*0.08+uTime*0.9)*0.16 + sin(p.y*0.11+uTime*1.1+p.x*0.03)*0.12 + sin((p.x+p.y)*0.23+uTime*1.7)*0.05; }
      void main(){ vec4 w = modelMatrix*vec4(position,1.); w.y += wave(w.xz); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uTime,uLight,uFogD,uCoast; uniform vec3 uDeep,uShallow,uZenith,uHorizon,uSunDir,uSunColor,uFog; varying vec3 vW;
      ${GLSL_COAST}
      float wave(vec2 p){ return sin(p.x*0.08+uTime*0.9)*0.16 + sin(p.y*0.11+uTime*1.1+p.x*0.03)*0.12 + sin((p.x+p.y)*0.23+uTime*1.7)*0.05; }
      float rip(vec2 p){ return sin(p.x*1.3+uTime*2.1)*sin(p.y*1.1-uTime*1.7)*0.5 + sin(p.x*2.7-p.y*1.9+uTime*3.0)*0.25; }
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      void main(){
        vec2 p = vW.xz;
        float d = ${local ? 'p.y-uCoast' : '-landD(p)'};
        float e = 0.6;
        float hx = wave(p+vec2(e,0.))-wave(p-vec2(e,0.)) + (rip(p+vec2(e,0.))-rip(p-vec2(e,0.)))*0.05;
        float hz = wave(p+vec2(0.,e))-wave(p-vec2(0.,e)) + (rip(p+vec2(0.,e))-rip(p-vec2(0.,e)))*0.05;
        vec3 n = normalize(vec3(-hx, 2.0*e, -hz));
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
        vec3 base = mix(uShallow, uDeep, smoothstep(0.0, 30.0, d));
        vec3 R = reflect(-V, n);
        vec3 refl = mix(uHorizon, uZenith, clamp(R.y*1.6, 0.0, 1.0));
        vec3 col = mix(base, refl, clamp(fres*0.85 + 0.1, 0.0, 1.0));
        vec3 L = normalize(uSunDir);
        float spec = pow(max(dot(reflect(-L, n), V), 0.0), 220.0);
        col += uSunColor * spec * 2.2 * step(0.0, L.y);
        float sparkle = step(0.985, noise(p*2.2 + uTime*0.6)) * pow(max(dot(reflect(-L,n),V),0.0), 8.0);
        col += uSunColor * sparkle * 0.8;
        float fn = noise(p*0.7 + vec2(uTime*0.3, -uTime*0.2));
        float foam = (1.0 - smoothstep(0.0, 2.8, d)) * smoothstep(0.25, 0.9, 0.5 + 0.5*sin(d*3.5 - uTime*1.8 + fn*4.0));
        foam += (1.0 - smoothstep(0.0, 0.7, d));
        col = mix(col, vec3(0.95,0.97,0.96)*(0.35+0.65*uLight), clamp(foam,0.,1.)*0.7);
        float alpha = mix(0.45, 0.95, smoothstep(0.0, 7.0, d));
        alpha = max(alpha, clamp(foam,0.,1.)*0.8);
        float fd = length(cameraPosition - vW);
        float f = 1.0 - exp(-pow(fd*uFogD, 2.0));
        col = mix(col, uFog, f);
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`
  });
}

/* ---------- hora del día ---------- */
const K = [
  { h: 5.5, el: -6, az: 88, sun: '#ff9f7a', si: .25, z: '#2a3b66', hz: '#c98f86', fog: '#7a6f80', hs: '#6d7ba8', hg: '#2a2620', hi: .35, deep: '#173a55', sh: '#3f7d86', exp: .95, lights: .9, night: .5 },
  { h: 7.0, el: 7, az: 95, sun: '#ffb27a', si: 1.5, z: '#6f93c0', hz: '#f6c59c', fog: '#e9c8aa', hs: '#b9cde3', hg: '#6d5a44', hi: .65, deep: '#1d5566', sh: '#5fb3a8', exp: 1.0, lights: .25, night: 0 },
  { h: 12, el: 62, az: 180, sun: '#fff4e2', si: 2.8, z: '#3a84c9', hz: '#c4e3f2', fog: '#d4e7ef', hs: '#cfe6ff', hg: '#6a7a4c', hi: 1.0, deep: '#0f6079', sh: '#3fc2b6', exp: 1.0, lights: 0, night: 0 },
  { h: 17.3, el: 16, az: 252, sun: '#ffc888', si: 2.4, z: '#5a88bb', hz: '#f4d6aa', fog: '#ecd3b3', hs: '#e2cdb4', hg: '#5d5a3e', hi: .8, deep: '#1a5a6b', sh: '#5fb1a5', exp: 1.02, lights: .15, night: 0 },
  { h: 19.2, el: 1.5, az: 272, sun: '#ff8a50', si: 1.3, z: '#3b4f80', hz: '#f49a6c', fog: '#c8917e', hs: '#c79d92', hg: '#3a3434', hi: .55, deep: '#1a3f58', sh: '#4b7d88', exp: 1.0, lights: .85, night: .15 },
  { h: 21.5, el: -22, az: 300, sun: '#a9bcff', si: .45, z: '#040a1b', hz: '#1a2846', fog: '#111b30', hs: '#2b3d68', hg: '#0d1015', hi: .4, deep: '#061424', sh: '#0f3343', exp: 1.0, lights: 1, night: 1 }
];
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
export function sampleTOD(hour) {
  hour = clamp(hour, K[0].h, K[K.length - 1].h);
  let i = 0; while (i < K.length - 2 && hour > K[i + 1].h) i++;
  const a = K[i], b = K[i + 1], t = smooth(0, 1, (hour - a.h) / (b.h - a.h)), o = { hour };
  for (const k of Object.keys(a)) {
    if (typeof a[k] === 'string') o[k] = _c1.set(a[k]).lerp(_c2.set(b[k]), t).clone();
    else o[k] = lerp(a[k], b[k], t);
  }
  const el = THREE.MathUtils.degToRad(o.el), az = THREE.MathUtils.degToRad(o.az);
  o.sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
  o.lightDir = o.el > 2 ? o.sunDir.clone() : new THREE.Vector3(-.4, .8, .45).normalize().lerp(o.sunDir, smooth(-4, 2, o.el)).normalize();
  return o;
}
export function applyTOD(o, { scene, sky, water, sun, hemi, renderer, fogDensity = .0028 }) {
  sky.material.uniforms.uZenith.value.copy(o.z); sky.material.uniforms.uHorizon.value.copy(o.hz);
  sky.material.uniforms.uSunDir.value.copy(o.sunDir); sky.material.uniforms.uSunColor.value.copy(o.sun); sky.material.uniforms.uNight.value = o.night;
  if (water) { const u = water.material.uniforms; u.uDeep.value.copy(o.deep); u.uShallow.value.copy(o.sh); u.uZenith.value.copy(o.z); u.uHorizon.value.copy(o.hz); u.uSunDir.value.copy(o.sunDir); u.uSunColor.value.copy(o.sun); u.uLight.value = clamp(o.si / 2.4, .15, 1); u.uFog.value.copy(o.fog); u.uFogD.value = fogDensity; }
  scene.fog.color.copy(o.fog); scene.fog.density = fogDensity;
  sun.color.copy(o.sun); sun.intensity = o.si; hemi.color.copy(o.hs); hemi.groundColor.copy(o.hg); hemi.intensity = o.hi * 1.6;
  renderer.toneMappingExposure = o.exp;
  MAT.glass.emissiveIntensity = o.lights * 1.6; MAT.bulb.emissiveIntensity = .2 + o.lights * 3;
}

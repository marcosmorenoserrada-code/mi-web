// Cabañas detalladas: texturas procedurales con relieve, carpintería, decoración exterior e interior.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MAT, TEX, initMaterials, cmat, box, cyl, rng, labelTex, adirondack, canvasTex } from './world.js';

/* ---------- utilidades de textura ---------- */
function normalFrom(src, strength = 3) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas'); out.width = w; out.height = h; const g = out.getContext('2d'); const img = g.createImageData(w, h);
  const H = (x, y) => d[((((y + h) % h) * w) + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    img.data[i] = (-dx / l * .5 + .5) * 255; img.data[i + 1] = (dy / l * .5 + .5) * 255; img.data[i + 2] = (1 / l * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(out); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function pair(w, h, draw, strength = 3, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 4; map.repeat.set(...repeat);
  const n = normalFrom(c, strength); n.repeat.set(...repeat);
  return { map, normalMap: n };
}

const CT = {};
function initCT() {
  if (CT.siding) return CT;
  const R = rng(21);
  // tablilla horizontal (8 hileras por textura = 2,6 m de pared)
  CT.siding = pair(256, 256, (g, w, h) => {
    const step = h / 8;
    for (let i = 0; i < 8; i++) {
      const y = i * step, gr = g.createLinearGradient(0, y, 0, y + step);
      gr.addColorStop(0, '#d4d4d4'); gr.addColorStop(.12, '#ffffff'); gr.addColorStop(.85, '#ececec'); gr.addColorStop(1, '#8a8a8a');
      g.fillStyle = gr; g.fillRect(0, y, w, step);
      for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(0,0,0,${R() * .05})`; g.fillRect(0, y + 3 + R() * (step - 6), w, 1); }
      const jx = R() * w; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(jx, y, 2, step);
    }
  }, 2.5);
  // tejado metálico de junta alzada
  CT.roof = pair(256, 256, (g, w, h) => {
    g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${R() * .05})`; g.fillRect(0, R() * h, w, 1 + R() * 3); }
    for (let y = 0; y < h; y += 32) { g.fillStyle = '#ffffff'; g.fillRect(0, y, w, 3); g.fillStyle = '#7a7a7a'; g.fillRect(0, y + 3, w, 2); }
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(90,60,30,${R() * .08})`; g.fillRect(R() * w, 0, 2 + R() * 6, h); }
  }, 2);
  // persiana de lamas
  CT.louver = pair(64, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
    for (let y = 10; y < h - 8; y += 8) { const gr = g.createLinearGradient(0, y, 0, y + 8); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.7, '#d0d0d0'); gr.addColorStop(1, '#808080'); g.fillStyle = gr; g.fillRect(6, y, w - 12, 8); }
    g.fillStyle = '#c8c8c8'; g.fillRect(6, h / 2 - 3, w - 12, 6);
  }, 2);
  // cubierta de madera
  CT.deck = pair(256, 256, (g, w, h) => {
    for (let x = 0; x < w; x += 21) {
      const v = 150 + R() * 50 | 0; g.fillStyle = `rgb(${v},${v * .8 | 0},${v * .62 | 0})`; g.fillRect(x, 0, 21, h);
      for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(70,40,15,${R() * .14})`; g.fillRect(x + R() * 19, 0, 1, h); }
      g.fillStyle = 'rgba(25,15,5,.7)'; g.fillRect(x + 19, 0, 2, h);
      const jy = R() * h; g.fillRect(x, jy, 19, 2);
      g.fillStyle = 'rgba(40,30,20,.6)'; [jy - 10, jy + 10].forEach(yy => { g.beginPath(); g.arc(x + 5, (yy + h) % h, 1.2, 0, 7); g.arc(x + 15, (yy + h) % h, 1.2, 0, 7); g.fill(); });
    }
  }, 2.5);
  // machihembrado (techo del porche "haint blue" y paredes interiores)
  CT.bead = pair(128, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = '#9a9a9a'; g.fillRect(x, 0, 2, h); g.fillStyle = '#e8e8e8'; g.fillRect(x + 2, 0, 2, h); } }, 2);
  CT.shiplap = pair(128, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = '#9c9c9c'; g.fillRect(0, y, w, 2); g.fillStyle = '#f2f2f2'; g.fillRect(0, y + 2, w, 3); } }, 1.5);
  // celosía (con transparencia)
  CT.lattice = canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#f1ece0'; g.lineWidth = 9; g.lineCap = 'square';
    for (let i = -h; i < w + h; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 1; for (let i = -h; i < w + h; i += 32) { g.beginPath(); g.moveTo(i + 4, 0); g.lineTo(i + h + 4, h); g.stroke(); }
  }, [1, 1]);
  // mosquitero fino
  CT.screen = canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(20,28,30,.55)'; for (let i = 0; i < w; i += 4) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } }, [1, 1]);
  // cristal: reflejo de cielo + cortinas detrás (día) / interior cálido (noche)
  CT.glassDay = canvasTex(128, 160, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w * .6, h); gr.addColorStop(0, '#9fc3cf'); gr.addColorStop(.45, '#3d5f6b'); gr.addColorStop(1, '#22343b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(w * .15, 0); g.lineTo(w * .45, 0); g.lineTo(w * .05, h); g.lineTo(0, h); g.lineTo(0, h * .7); g.fill();
    g.fillStyle = 'rgba(244,238,224,.85)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * .2, 0); g.quadraticCurveTo(w * .12, h * .5, w * .22, h); g.lineTo(0, h); g.fill();
    g.beginPath(); g.moveTo(w, 0); g.lineTo(w * .8, 0); g.quadraticCurveTo(w * .88, h * .5, w * .78, h); g.lineTo(w, h); g.fill();
  });
  CT.glassNight = canvasTex(128, 160, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h * .35, 4, w / 2, h / 2, w); gr.addColorStop(0, '#fff1c8'); gr.addColorStop(.6, '#f2b25e'); gr.addColorStop(1, '#8a5524'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,230,190,.9)'; g.fillRect(0, 0, w * .2, h); g.fillRect(w * .8, 0, w * .2, h);
    g.fillStyle = 'rgba(80,45,20,.45)'; g.fillRect(w * .35, h * .62, w * .4, h * .38);
  });
  CT.glassIn = canvasTex(128, 160, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#cfe6ef'); gr.addColorStop(.55, '#a9cfd9'); gr.addColorStop(.6, '#6f9a5c'); gr.addColorStop(1, '#4d7a42'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(60,100,50,.8)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(R() * w, h * .58, 10 + R() * 18, 0, 7); g.fill(); }
  });
  // rejilla del aire acondicionado
  CT.grille = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#d9dcdc'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a4246'; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill(); g.strokeStyle = '#9aa3a6'; g.lineWidth = 1.4; for (let r = 6; r < 26; r += 4) { g.beginPath(); g.arc(32, 32, r, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(6, 32); g.lineTo(58, 32); g.moveTo(32, 6); g.lineTo(32, 58); g.stroke(); });
  // sombra de contacto
  CT.contact = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.6, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  // cuadros costeros
  CT.art = [
    canvasTex(160, 120, (g, w, h) => { const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#f6c88f'); s.addColorStop(.5, '#f19a7a'); s.addColorStop(.52, '#3f8ea0'); s.addColorStop(1, '#215a6b'); g.fillStyle = s; g.fillRect(0, 0, w, h); g.fillStyle = '#ffe3a6'; g.beginPath(); g.arc(w * .65, h * .5, 16, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(10 + i * 18, h * .6 + i * 5); g.lineTo(40 + i * 18, h * .6 + i * 5); g.stroke(); } }),
    canvasTex(120, 160, (g, w, h) => { g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3e6b4b'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, h); g.quadraticCurveTo(w / 2 - 6, h * .5, w / 2 + 4, h * .3); g.stroke(); g.fillStyle = '#4f8a5b'; for (let i = 0; i < 7; i++) { g.save(); g.translate(w / 2 + 4, h * .3); g.rotate(i * .9 - 2.7); g.beginPath(); g.ellipse(26, 0, 28, 6, 0, 0, 7); g.fill(); g.restore(); } }),
    canvasTex(160, 120, (g, w, h) => { g.fillStyle = '#e4eef0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2d4f5c'; g.lineWidth = 3; g.beginPath(); g.moveTo(70, 100); g.lineTo(72, 70); g.moveTo(84, 100); g.lineTo(80, 70); g.stroke(); g.fillStyle = '#f7f7f2'; g.strokeStyle = '#2d4f5c'; g.beginPath(); g.ellipse(78, 60, 22, 12, -.3, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(92, 52); g.quadraticCurveTo(100, 20, 108, 26); g.stroke(); g.fillStyle = '#e0a83a'; g.beginPath(); g.moveTo(108, 24); g.lineTo(124, 28); g.lineTo(108, 30); g.fill(); g.fillStyle = 'rgba(60,140,160,.3)'; g.fillRect(0, 96, w, 24); })
  ];
  CT.rug = canvasTex(128, 96, (g, w, h) => { g.fillStyle = '#e9dcc2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3f8f8a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.strokeStyle = '#e07a5f'; g.lineWidth = 2; g.strokeRect(18, 18, w - 36, h - 36); for (let x = 26; x < w - 26; x += 12) { g.fillStyle = x % 24 ? '#3f8f8a' : '#d9b46a'; g.fillRect(x, h / 2 - 3, 6, 6); } });
  CT.quilt = canvasTex(128, 128, (g, w, h) => { for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? '#f4f1ea' : '#8fbfcc'; g.fillRect(x, y, 16, 16); } g.strokeStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }, [1, 1]);
  CT.tile = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#c9c4b8'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 16; x < w + 16; x += 32) { g.fillStyle = '#f3f6f4'; g.fillRect(x + 1, y + 1, 30, 14); } }, [3, 1]);
  CT.books = canvasTex(128, 32, (g, w, h) => { let x = 0; const cols = ['#2d5f73', '#c96f53', '#e2c27a', '#5d8a64', '#f1ece2', '#8a5a44', '#3c4a5c']; while (x < w) { const bw = 5 + R() * 8; g.fillStyle = cols[R() * cols.length | 0]; g.fillRect(x, 2 + R() * 6, bw - 1, h); x += bw; } });
  return CT;
}

/* ---------- piezas reutilizables ---------- */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function mesh(geo, mat, parent, x = 0, y = 0, z = 0, shadow = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent && parent.add(m); return m; }
function sph(r, mat, parent, x, y, z, ws = 8, hs = 6) { return mesh(new THREE.SphereGeometry(r, ws, hs), mat, parent, x, y, z); }
function rod(a, b, r, mat, parent, seg = 5) { // cilindro entre dos puntos (cadenas, cuerdas, barandas)
  const d = b.clone().sub(a), L = d.length(); const m = mesh(new THREE.CylinderGeometry(r, r, L, seg), mat, parent, 0, 0, 0, false);
  m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
}

function pot(parent, x, y, z, kind = 'palm', s = 1, flowerCol = '#ff7a6b') {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  cyl(.2, .15, .34, cmat('#c3714b', { roughness: .95 }), 0, .17, 0, g, 10); cyl(.215, .215, .05, cmat('#b5653f'), 0, .33, 0, g, 10);
  cyl(.18, .18, .02, cmat('#4a3626', { roughness: 1 }), 0, .335, 0, g, 10);
  const leaf = cmat('#4f7f3c', { roughness: .9, side: THREE.DoubleSide, flatShading: true });
  if (kind === 'palm') {
    cyl(.025, .035, .55, cmat('#8a7350'), 0, .6, 0, g, 5);
    for (let i = 0; i < 7; i++) { const f = mesh(new THREE.PlaneGeometry(.12, .55), leaf, g, 0, .85, 0, false); f.geometry.translate(0, .27, 0); f.rotation.set(-1.0 - (i % 2) * .3, i * .9, 0, 'YXZ'); }
  } else if (kind === 'fern') {
    for (let i = 0; i < 10; i++) { const f = mesh(new THREE.PlaneGeometry(.1, .5), leaf, g, 0, .36, 0, false); f.geometry.translate(0, .25, 0); f.rotation.set(-1.15, i * .63, 0, 'YXZ'); }
  } else {
    sph(.22, cmat('#4c7a38', { flatShading: true }), g, 0, .48, 0, 7, 5).scale.set(1, .7, 1);
    const fm = cmat(flowerCol, { roughness: .6 }); for (let i = 0; i < 9; i++) { const a = i * 2.4; sph(.045, fm, g, Math.cos(a) * .16, .55 + (i % 3) * .04, Math.sin(a) * .16, 5, 4); }
  }
  return g;
}

function rocker(parent, x, y, z, ry, color) {
  const g = new THREE.Group(), m = cmat(color, { roughness: .55 }), cush = cmat('#f1e6cf', { roughness: 1 });
  [-.24, .24].forEach(sx => { const r = mesh(new THREE.TorusGeometry(.9, .025, 4, 12, .9), m, g, sx, .92, .05); r.rotation.set(0, Math.PI / 2, Math.PI * 1.5 - .45); });
  [[-.24, .22], [.24, .22], [-.24, -.2], [.24, -.2]].forEach(([a, b]) => box(.04, .42, .04, m, a, .24, b, g, false));
  box(.52, .05, .48, m, 0, .45, 0, g); box(.46, .07, .42, cush, 0, .5, .01, g, false);
  for (let i = 0; i < 5; i++) { const s = box(.06, .7, .025, m, -.18 + i * .09, .82, -.24, g, false); s.rotation.x = -.18; }
  box(.54, .05, .05, m, 0, 1.17, -.3, g, false);
  [-.27, .27].forEach(sx => { box(.06, .04, .46, m, sx, .68, 0, g, false); box(.03, .22, .03, m, sx, .57, .2, g, false); });
  g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g;
}

function sideTable(parent, x, y, z, withLantern = true, ld) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const w = cmat('#ede3cf', { roughness: .6 });
  cyl(.22, .22, .04, w, 0, .5, 0, g, 14); cyl(.03, .03, .5, w, 0, .25, 0, g, 6); cyl(.15, .15, .02, w, 0, .01, 0, g, 12);
  if (withLantern) { box(.12, .02, .12, MAT.dark, 0, .53, 0, g, false); const gl = box(.1, .14, .1, MAT.bulb, 0, .61, 0, g, false); box(.13, .02, .13, MAT.dark, 0, .69, 0, g, false); mesh(new THREE.TorusGeometry(.04, .006, 4, 10), MAT.dark, g, 0, .73, 0, false); ld && ld.push(V(x, y + .61, z)); }
  // vaso de limonada
  cyl(.03, .025, .1, cmat('#f6e7a1', { transparent: true, opacity: .8, roughness: .1 }), .12, .57, .06, g, 8);
  return g;
}

function hangingFern(parent, x, top, z, len = .5) {
  const g = new THREE.Group(); g.position.set(x, top, z); parent.add(g);
  const ch = cmat('#3b3b38', { metalness: .6, roughness: .4 });
  [0, 2.1, 4.2].forEach(a => rod(V(0, 0, 0), V(Math.cos(a) * .17, -len, Math.sin(a) * .17), .006, ch, g, 3));
  const b = mesh(new THREE.SphereGeometry(.2, 10, 6, 0, 7, Math.PI / 2, Math.PI / 2), cmat('#7a5a3a', { roughness: 1, side: THREE.DoubleSide }), g, 0, -len, 0, false);
  const leaf = cmat('#4e8a3e', { roughness: .9, side: THREE.DoubleSide, flatShading: true });
  for (let i = 0; i < 14; i++) { const f = mesh(new THREE.PlaneGeometry(.09, .55), leaf, g, 0, -len + .02, 0, false); f.geometry.translate(0, -.26, 0); f.rotation.set(-Math.PI + .9 + (i % 3) * .25, i * .45, 0, 'YXZ'); }
  sph(.17, leaf, g, 0, -len + .05, 0, 7, 5).scale.set(1, .5, 1);
  return g;
}

function lifeRing(parent, x, y, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  mesh(new THREE.TorusGeometry(.22, .065, 8, 20), cmat('#f7f4ee', { roughness: .5 }), g, 0, 0, .07, false);
  const red = cmat('#d64b3a', { roughness: .5 }); for (let i = 0; i < 4; i++) { const t = mesh(new THREE.TorusGeometry(.22, .068, 8, 4, Math.PI / 6), red, g, 0, 0, .07, false); t.rotation.z = i * Math.PI / 2 - Math.PI / 12; }
  const rope = cmat('#d9c49a', { roughness: 1 }); mesh(new THREE.TorusGeometry(.26, .008, 3, 24), rope, g, 0, 0, .1, false);
  return g;
}
function buoys(parent, x, y, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const rope = cmat('#d9c49a', { roughness: 1 }); const cols = ['#e2553f', '#f2c14e', '#3f8fb0'];
  cols.forEach((c, i) => { const bx = (i - 1) * .22, by = -.25 - (i % 2) * .15; rod(V(0, .1, .04), V(bx, by + .12, .08), .007, rope, g, 3); const b = mesh(new THREE.CapsuleGeometry(.07, .14, 4, 10), cmat(c, { roughness: .45 }), g, bx, by, .09, false); mesh(new THREE.CylinderGeometry(.071, .071, .04, 10), cmat('#f6f2ea'), b, 0, 0, 0, false); });
  box(.05, .05, .05, MAT.dark, 0, .1, .03, g, false);
  return g;
}
function oars(parent, x, y, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const w = cmat('#b98d5c', { roughness: .7 }), b = cmat('#2f7d8c', { roughness: .6 });
  [-.5, .5].forEach(a => { const o = new THREE.Group(); o.rotation.z = a; g.add(o); cyl(.022, .022, 1.5, w, 0, 0, .04, o, 6); const bl = box(.16, .45, .02, b, 0, -.85, .04, o, false); });
  return g;
}
function wreath(parent, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  mesh(new THREE.TorusGeometry(.17, .05, 6, 16), cmat('#3f6e3a', { roughness: 1, flatShading: true }), g, 0, 0, 0, false);
  const sh = cmat('#f4e4c8'); for (let i = 0; i < 6; i++) { const a = i * 1.05; sph(.03, sh, g, Math.cos(a) * .17, Math.sin(a) * .17, .04, 5, 4); }
  const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .03 : .075, a = i * Math.PI / 5 + Math.PI / 2; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  mesh(new THREE.ExtrudeGeometry(st, { depth: .02, bevelEnabled: false }), cmat('#e8935e'), g, 0, -.14, .03, false);
  return g;
}
function sconce(parent, x, y, z, ld, lx) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  box(.1, .2, .03, MAT.dark, 0, 0, .015, g, false); box(.04, .04, .1, MAT.dark, 0, -.02, .07, g, false);
  box(.14, .03, .14, MAT.dark, 0, .14, .14, g, false); box(.12, .2, .12, MAT.bulb, 0, .03, .14, g, false); box(.14, .02, .14, MAT.dark, 0, -.08, .14, g, false);
  ld && ld.push(lx); return g;
}
function ceilingFan(parent, x, y, z, blades = '#d9c7a3', withLight = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  cyl(.015, .015, .3, MAT.dark, 0, .15, 0, g, 5); cyl(.1, .12, .12, cmat('#3a3530', { metalness: .5, roughness: .4 }), 0, 0, 0, g, 12);
  const rot = new THREE.Group(); g.add(rot);
  for (let i = 0; i < 5; i++) { const b = box(.55, .015, .13, cmat(blades, { roughness: .6 }), 0, -.02, 0, rot, false); b.geometry.translate(.38, 0, 0); b.rotation.y = i * Math.PI * 2 / 5; b.rotation.x = .08; }
  if (withLight) sph(.08, MAT.bulb, g, 0, -.1, 0, 10, 6);
  g.userData.rotor = rot; return g;
}
function gutterGeo(L, axis = 'z') { const gg = new THREE.CylinderGeometry(.07, .07, L, 8, 1, true, axis === 'z' ? -Math.PI / 2 : Math.PI, Math.PI); axis === 'z' ? gg.rotateX(Math.PI / 2) : gg.rotateZ(Math.PI / 2); return gg; }
function catenary(a, b, n, sag) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(V(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * sag, a.z + (b.z - a.z) * t)); } return pts; }

/* ---------- ventana completa ---------- */
function makeWindow(body, opts) {
  const { x, z, ry, y, w = .95, h = 1.15, accent, shutters = true, box: flowerBox = false, interior = false, F, curtain = '#f3ece0', flowers = '#ff7a6b', gmat } = opts;
  const wg = new THREE.Group(); wg.position.set(x, y, z); wg.rotation.y = ry; body.add(wg);
  const T = .07; // cara exterior del muro
  const trim = MAT.trim;
  box(w + .24, .12, .07, trim, 0, h / 2 + .1, T + .035, wg, false);       // dintel
  box(w + .34, .04, .1, trim, 0, h / 2 + .18, T + .05, wg, false);        // cornisa
  box(.1, h + .1, .06, trim, -w / 2 - .06, 0, T + .03, wg, false); box(.1, h + .1, .06, trim, w / 2 + .06, 0, T + .03, wg, false);
  box(w + .3, .05, .16, trim, 0, -h / 2 - .06, T + .08, wg); box(w + .1, .07, .05, trim, 0, -h / 2 - .12, T + .02, wg, false); // alféizar
  mesh(new THREE.PlaneGeometry(w, h), gmat, wg, 0, 0, T + .004, false);
  // parteluces 6 sobre 6
  const mun = MAT.trim;
  box(w, .05, .03, mun, 0, 0, T + .02, wg, false);
  [-1, 1].forEach(s => box(.022, h, .02, mun, s * w / 6, 0, T + .015, wg, false));
  [-1, 1].forEach(s => box(w, .02, .02, mun, 0, s * h / 4, T + .015, wg, false));
  if (shutters) {
    const sm = new THREE.MeshStandardMaterial({ color: accent, map: CT.louver.map, normalMap: CT.louver.normalMap, roughness: .6 });
    [-1, 1].forEach(s => { const sh = box(w * .42, h + .14, .035, sm, s * (w / 2 + .14 + w * .21), 0, T + .02, wg); box(.03, .03, .05, MAT.dark, s * (w / 2 + .13), h * .35, T + .03, wg, false); box(.03, .03, .05, MAT.dark, s * (w / 2 + .13), -h * .35, T + .03, wg, false); });
  }
  if (flowerBox) {
    const fb = cmat(accent, { roughness: .6 }); box(w + .2, .2, .2, fb, 0, -h / 2 - .3, T + .12, wg); box(w + .24, .04, .22, MAT.trim, 0, -h / 2 - .2, T + .12, wg, false);
    [-.35, .35].forEach(s => { const br = box(.04, .16, .14, MAT.trim, s * w, -h / 2 - .48, T + .07, wg, false); });
    const leaf = cmat('#4f7f3c', { flatShading: true, roughness: .9 }); const fl = [cmat(flowers, { roughness: .6 }), cmat('#ffffff', { roughness: .6 }), cmat('#f7c4d8', { roughness: .6 })];
    for (let i = 0; i < 9; i++) { const px = -w / 2 + .05 + i * (w / 8.5); sph(.08, leaf, wg, px, -h / 2 - .17, T + .13, 6, 4).scale.set(1, .7, 1); sph(.04, fl[i % 3], wg, px + .03, -h / 2 - .1, T + .18, 5, 4); }
    for (let i = 0; i < 4; i++) { const tr = mesh(new THREE.PlaneGeometry(.06, .3), cmat('#5c8f45', { side: THREE.DoubleSide }), wg, -w / 2 + .1 + i * w / 3.3, -h / 2 - .4, T + .225, false); }
  }
  if (interior) {
    const Ti = -T - .008;
    const gi = mesh(new THREE.PlaneGeometry(w, h), MAT._glassIn, wg, 0, 0, Ti, false); gi.rotation.y = Math.PI;
    box(w + .2, .1, .04, MAT.trim, 0, h / 2 + .06, Ti - .02, wg, false); box(w + .24, .04, .12, MAT.trim, 0, -h / 2 - .04, Ti - .06, wg, false);
    [-1, 1].forEach(s => box(.07, h + .1, .04, MAT.trim, s * (w / 2 + .04), 0, Ti - .02, wg, false));
    box(w, .04, .02, MAT.trim, 0, 0, Ti - .01, wg, false);
    // cortinas y barra
    cyl(.012, .012, w + .7, MAT.dark, 0, h / 2 + .22, Ti - .1, wg, 5).rotation.z = Math.PI / 2;
    const cm = cmat(curtain, { roughness: 1, side: THREE.DoubleSide });
    [-1, 1].forEach(s => { const cg = new THREE.PlaneGeometry(.32, h + .5, 6, 1); const p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * .025); cg.computeVertexNormals(); const c = mesh(cg, cm, wg, s * (w / 2 + .18), -.06, Ti - .12, false); c.rotation.y = Math.PI; });
  }
  return wg;
}

/* ---------- cabaña ---------- */
// Frente local en +z. Devuelve grupo con referencias en userData.
export function buildCottage(c, dims, { interior = false } = {}) {
  initMaterials(); initCT();
  if (!MAT._glassIn) MAT._glassIn = new THREE.MeshStandardMaterial({ map: CT.glassIn, roughness: .2, emissive: '#ffffff', emissiveMap: CT.glassIn, emissiveIntensity: .35 });
  if (!MAT._glass) { MAT._glass = MAT.glass; MAT.glass.color.set('#ffffff'); MAT.glass.map = CT.glassDay; MAT.glass.emissive.set('#ffffff'); MAT.glass.emissiveMap = CT.glassNight; MAT.glass.metalness = .15; MAT.glass.roughness = .08; MAT.glass.needsUpdate = true; }
  const r = rng(c.n * 13 + 5);
  const [W, D] = dims, F = .75, H = 2.6, t = .14, P = c.porch === 'detached' ? 0 : 2.4;
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const lightPts = [];
  const wallMat = new THREE.MeshStandardMaterial({ color: c.color, map: CT.siding.map, normalMap: CT.siding.normalMap, normalScale: new THREE.Vector2(.9, .9), roughness: .78 });
  const accent = cmat(c.accent, { roughness: .55 });
  const roofTex = CT.roof.map.clone(), roofN = CT.roof.normalMap.clone(); roofTex.needsUpdate = roofN.needsUpdate = true; roofTex.repeat.set(1, Math.round((D + .9) / 1.9)); roofN.repeat.copy(roofTex.repeat);
  const roofMat = new THREE.MeshStandardMaterial({ color: c.roof, map: roofTex, normalMap: roofN, roughness: .38, metalness: .5 }); roofMat.userData.envBoost = 2.2;
  const deckTex = CT.deck.map.clone(), deckN = CT.deck.normalMap.clone(); deckTex.needsUpdate = deckN.needsUpdate = true; deckTex.repeat.set(Math.max(1, Math.round(W / 2.2)), 1); deckN.repeat.copy(deckTex.repeat);
  const deckMat = new THREE.MeshStandardMaterial({ map: deckTex, normalMap: deckN, roughness: .82 });
  const latMat = new THREE.MeshStandardMaterial({ map: CT.lattice, transparent: false, alphaTest: .5, roughness: .9, side: THREE.DoubleSide });
  const latTex = CT.lattice.clone(); latTex.needsUpdate = true; latTex.repeat.set(Math.round(W * 1.6), 1.2); latMat.map = latTex;
  const haint = new THREE.MeshStandardMaterial({ color: '#bfe1df', map: CT.bead.map, normalMap: CT.bead.normalMap, roughness: .8 });
  const brass = cmat('#c9a456', { metalness: .8, roughness: .3 });

  /* --- cimientos: pilotes, celosía, sombra de contacto --- */
  box(W - .2, F - .05, D - .2, cmat('#2a2622', { roughness: 1 }), 0, (F - .05) / 2, 0, body, false);
  [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([a, b]) => box(.3, F, .3, cmat('#b9b2a4', { roughness: 1 }), a * (W / 2 - .15), F / 2, b * (D / 2 - .15), body));
  [[W, 0, D / 2 + .02, 0], [W, 0, -D / 2 - .02, 0], [D, -W / 2 - .02, 0, Math.PI / 2], [D, W / 2 + .02, 0, Math.PI / 2]].forEach(([len, x, z, ry]) => {
    const l = mesh(new THREE.PlaneGeometry(len, F - .12), latMat, body, x, (F - .12) / 2 + .02, z, false); l.rotation.y = ry;
    const fr = box(len + .04, .08, .05, MAT.trim, x, .04, z, body, false); fr.rotation.y = ry;
  });
  const cs = mesh(new THREE.PlaneGeometry(W + 3, D + P + 4), new THREE.MeshBasicMaterial({ map: CT.contact, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }), g, 0, .07, P / 2, false);
  cs.rotation.x = -Math.PI / 2; cs.receiveShadow = false; cs.renderOrder = 1;
  box(W + .34, .14, D + .34, MAT.trim, 0, F - .01, 0, body);                     // viga perimetral
  [[W + .38, .2, 0, D / 2 + .09], [W + .38, .2, 0, -D / 2 - .09], [.2, D + .38, -W / 2 - .09, 0], [.2, D + .38, W / 2 + .09, 0]].forEach(([a, b2, x, z]) => box(a, .05, b2, MAT.trim, x, F + .085, z, body, false));

  /* --- muros con tablilla --- */
  const y0 = F + H / 2;
  box(W, H, t, wallMat, 0, y0, -D / 2 + t / 2, body);
  box(t, H, D, wallMat, -W / 2 + t / 2, y0, 0, body);
  box(t, H, D, wallMat, W / 2 - t / 2, y0, 0, body);
  const dW = .95, dH = 2.1, dx = W * .18;
  const lw = (W / 2 + dx - dW / 2), rw = (W / 2 - dx - dW / 2);
  box(lw, H, t, wallMat, -W / 2 + lw / 2, y0, D / 2 - t / 2, body);
  box(rw, H, t, wallMat, W / 2 - rw / 2, y0, D / 2 - t / 2, body);
  box(dW, H - dH, t, wallMat, dx, F + dH + (H - dH) / 2, D / 2 - t / 2, body);
  // zócalo, esquineros con capitel y friso
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { box(.18, H, .18, MAT.trim, a * W / 2, y0, b * D / 2, body); box(.24, .1, .24, MAT.trim, a * W / 2, F + H - .12, b * D / 2, body, false); });
  box(W + .1, .2, .04, MAT.trim, 0, F + .22, D / 2 + .01, body, false); box(W + .1, .2, .04, MAT.trim, 0, F + .22, -D / 2 - .01, body, false);
  box(.04, .2, D + .1, MAT.trim, -W / 2 - .01, F + .22, 0, body, false); box(.04, .2, D + .1, MAT.trim, W / 2 + .01, F + .22, 0, body, false);
  box(W + .24, .3, .06, MAT.trim, 0, F + H - .08, D / 2 + .02, body, false); box(W + .24, .3, .06, MAT.trim, 0, F + H - .08, -D / 2 - .02, body, false);
  box(.06, .3, D + .24, MAT.trim, -W / 2 - .02, F + H - .08, 0, body, false); box(.06, .3, D + .24, MAT.trim, W / 2 + .02, F + H - .08, 0, body, false);

  /* --- puerta de paneles con ventanilla, aldaba y corona --- */
  const door = new THREE.Group(); door.position.set(dx - dW / 2, F, D / 2 - t / 2); body.add(door);
  const dw = dW - .04;
  box(dw, dH - .02, .05, accent, dw / 2, dH / 2, 0, door);
  const panel = cmat(new THREE.Color(c.accent).offsetHSL(0, 0, .06).getStyle(), { roughness: .5 });
  [[.27, .55], [.73, .55], [.27, 1.05], [.73, 1.05]].forEach(([u, v]) => { box(dw * .34, .38, .02, panel, dw * u, v * dH / 1.5, .035, door, false); box(dw * .38, .42, .01, accent, dw * u, v * dH / 1.5, .028, door, false); });
  box(dw * .72, .5, .012, MAT.glass, dw / 2, dH * .8, .032, door, false);
  box(dw * .76, .04, .03, MAT.trim, dw / 2, dH * .8 + .27, .035, door, false); box(dw * .76, .04, .03, MAT.trim, dw / 2, dH * .8 - .27, .035, door, false); box(.03, .5, .03, MAT.trim, dw / 2, dH * .8, .036, door, false);
  sph(.035, brass, door, dw - .1, dH * .47, .07); box(.05, .16, .02, brass, dw - .1, dH * .47, .035, door, false);
  sph(.035, brass, door, dw - .1, dH * .47, -.04);
  box(dw - .1, .14, .01, brass, dw / 2, .1, .03, door, false);           // placa de patada
  wreath(door, dw / 2, dH * .8, .06);
  // marco, umbral, alfombra de bienvenida
  box(dW + .3, .16, .08, MAT.trim, dx, F + dH + .08, D / 2 + .01, body, false); box(dW + .4, .05, .14, MAT.trim, dx, F + dH + .18, D / 2 + .03, body, false);
  [-1, 1].forEach(s => box(.1, dH, .07, MAT.trim, dx + s * (dW / 2 + .05), F + dH / 2, D / 2 + .01, body, false));
  box(dW + .1, .03, .2, cmat('#b9b2a4'), dx, F + .085, D / 2 + .05, body, false);
  const matTex = canvasTex(128, 64, (q, w, h) => { q.fillStyle = '#8b6b44'; q.fillRect(0, 0, w, h); q.fillStyle = '#5c4329'; q.font = '600 24px Fraunces, Georgia, serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('AHOY', w / 2, h / 2 + 2); q.strokeStyle = '#5c4329'; q.lineWidth = 3; q.strokeRect(5, 5, w - 10, h - 10); });
  const mat = mesh(new THREE.PlaneGeometry(.9, .5), new THREE.MeshStandardMaterial({ map: matTex, roughness: 1 }), body, dx, F + .085, D / 2 + .45, false); mat.rotation.x = -Math.PI / 2;
  // apliques y placa con número
  sconce(body, dx - dW / 2 - .3, F + 1.85, D / 2, lightPts, V(dx - dW / 2 - .3, F + 1.88, D / 2 + .14));
  sconce(body, dx + dW / 2 + .3, F + 1.85, D / 2, lightPts, V(dx + dW / 2 + .3, F + 1.88, D / 2 + .14));
  const np = mesh(new THREE.PlaneGeometry(.26, .26), new THREE.MeshStandardMaterial({ map: labelTex(String(c.n), { bg: '#0f2a33', fg: '#e8c98a', round: false, font: '600 84px Fraunces, Georgia, serif' }), roughness: .5 }), body, dx + dW / 2 + .3, F + 1.45, D / 2 + .012, false);
  const mailbox = box(.18, .24, .1, cmat('#2b3d44', { metalness: .4, roughness: .4 }), dx - dW / 2 - .3, F + 1.35, D / 2 + .06, body, false);

  /* --- ventanas --- */
  const ws = [];
  const win = (x, z, ry, w = .95, h = 1.15, o = {}) => ws.push(makeWindow(body, { x, z, ry, y: F + 1.5, w, h, accent: c.accent, F, interior, gmat: MAT.glass, curtain: o.curtain || '#f3ece0', flowers: c.accent === '#ffffff' ? '#ff7a6b' : '#ffd166', ...o }));
  win(-W * .3, D / 2 - t / 2, 0, .95, 1.15, { box: true });
  if (W > 6) win(W * .38, D / 2 - t / 2, 0, .7, 1.15, { box: true });
  win(-W / 2 + t / 2, -D * .22, -Math.PI / 2); win(W / 2 - t / 2, -D * .22, Math.PI / 2);
  if (D > 7.5) { win(-W / 2 + t / 2, D * .2, -Math.PI / 2); win(W / 2 - t / 2, D * .2, Math.PI / 2); }
  win(W * .2, -D / 2 + t / 2, Math.PI, .7, .8, { shutters: false, y: F + 1.75 });

  /* --- tejado a dos aguas con canalones, imposta, frontones y respiradero --- */
  const roof = new THREE.Group(); roof.position.y = F + H; g.add(roof);
  const run = W / 2 + .45, rise = 1.55, len = Math.hypot(run, rise), ang = Math.atan2(rise, run), ov = D + .9;
  [-1, 1].forEach(s => {
    const rs = box(len + .05, .08, ov, roofMat, s * run / 2, rise / 2 + .02, 0, roof); rs.rotation.z = -s * ang;
    // costillas de junta alzada
    const nr = Math.round(ov / .42); const rib = new THREE.InstancedMesh(new THREE.BoxGeometry(len, .035, .025), roofMat, nr); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -s * ang));
    for (let i = 0; i < nr; i++) { const zz = -ov / 2 + .2 + i * ((ov - .4) / (nr - 1)); const p = V(s * run / 2, rise / 2 + .02, zz).add(V(0, .055, 0).applyQuaternion(q)); m4.compose(p, q, V(1, 1, 1)); rib.setMatrixAt(i, m4); }
    rib.castShadow = true; roof.add(rib);
    // imposta (fascia) + sofito + canalón + bajantes
    const ex = s * (run + .02), ey = -.04;
    box(.04, .2, ov, MAT.trim, ex, ey, 0, roof, false);
    box(.45, .03, ov, MAT.trim, s * (W / 2 + .22), -.1, 0, roof, false);
    const gm = cmat('#f2efe8', { side: THREE.DoubleSide, roughness: .4 });
    mesh(gutterGeo(ov), gm, roof, ex + s * .07, ey - .08, 0, false);
    [-1, 1].forEach(b => { const dz = b * (ov / 2 - .25); box(.07, .3, .07, gm, s * (run + .07), -.25, dz, roof, false); box(run - W / 2 + .05, .07, .07, gm, s * (W / 2 + .1 + (run - W / 2) / 2), -.38, dz, roof, false); box(.07, F + H - .45, .07, gm, s * (W / 2 + .1), -(F + H) / 2 - .2, dz, roof, false); box(.07, .07, .3, gm, s * (W / 2 + .1), -(F + H) + .1, dz + b * .15, roof, false); box(.14, .04, .4, cmat('#cfc8b8'), s * (W / 2 + .1), -(F + H) + .02, dz + b * .4, roof, false); });
  });
  // frontones con tablilla (uv a escala del muro)
  const tri = new THREE.Shape(); tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, rise * (W / 2) / run); tri.closePath();
  const tg = new THREE.ShapeGeometry(tri); const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / W + .5, uv.getY(i) / H);
  wallMat.side = THREE.DoubleSide;
  [-1, 1].forEach(s => mesh(tg, wallMat, roof, 0, 0, s * (D / 2 - .02), true));
  // tablas de borde (rake) y cumbrera
  [-1, 1].forEach(fz => [-1, 1].forEach(s => { const rb = box(len + .1, .2, .05, MAT.trim, s * run / 2, rise / 2 - .03, fz * (ov / 2 + .02), roof, false); rb.rotation.z = -s * ang; }));
  box(.22, .1, ov + .06, roofMat, 0, rise + .05, 0, roof); box(.12, .04, ov + .08, roofMat, 0, rise + .11, 0, roof, false);
  // respiradero de lamas en el frontón trasero y placa en el delantero
  const vent = box(.5, .6, .04, new THREE.MeshStandardMaterial({ color: '#f5f2ea', map: CT.louver.map, normalMap: CT.louver.normalMap }), 0, rise * .42, -D / 2 - .03, roof, false);
  box(.62, .72, .02, MAT.trim, 0, rise * .42, -D / 2 - .015, roof, false);
  const plate = mesh(new THREE.CircleGeometry(.32, 28), new THREE.MeshStandardMaterial({ map: labelTex(String(c.n)), roughness: .6 }), roof, 0, rise * .58, D / 2 + .02, false);
  mesh(new THREE.TorusGeometry(.33, .025, 6, 28), MAT.trim, roof, 0, rise * .58, D / 2 + .03, false);
  // chimenea de ventilación y antena de veleta
  cyl(.06, .06, .5, MAT.metal, W * .22, rise * .55 + .2, -D * .2, roof, 8); cyl(.09, .09, .05, MAT.metal, W * .22, rise * .55 + .46, -D * .2, roof, 8);
  if (c.n % 3 === 0) { cyl(.012, .012, .7, MAT.dark, 0, rise + .45, -D * .3, roof, 4); const fish = new THREE.Shape(); fish.moveTo(-.25, 0); fish.quadraticCurveTo(0, .12, .2, 0); fish.lineTo(.3, .08); fish.lineTo(.3, -.08); fish.lineTo(.2, 0); fish.quadraticCurveTo(0, -.12, -.25, 0); mesh(new THREE.ShapeGeometry(fish), cmat('#3b3b38', { metalness: .6, roughness: .35, side: THREE.DoubleSide }), roof, 0, rise + .78, -D * .3, false).rotation.y = Math.PI / 2; }

  /* --- porche --- */
  const porchGroup = new THREE.Group(); g.add(porchGroup); const porchRoofs = [];
  const rotors = [];
  const buildPorch = (pw, pd, z0, screened, xOff = 0, roofed = true, attached = true) => {
    const pg = new THREE.Group(); pg.position.set(xOff, 0, z0); porchGroup.add(pg);
    // estructura y suelo
    box(pw, .1, pd, deckMat, 0, F + .02, pd / 2, pg);
    box(pw + .06, .2, .06, MAT.trim, 0, F - .07, pd + .01, pg, false);
    [-1, 1].forEach(s => box(.06, .2, pd, MAT.trim, s * (pw / 2 + .01), F - .07, pd / 2, pg, false));
    [[pw, 0, pd + .02, 0], [pd, -pw / 2 - .02, pd / 2, Math.PI / 2], [pd, pw / 2 + .02, pd / 2, Math.PI / 2]].forEach(([l, x, z, ry]) => { const m = mesh(new THREE.PlaneGeometry(l, F - .2), latMat, pg, x, (F - .2) / 2 + .02, z, false); m.rotation.y = ry; });
    [-1, 1].forEach(s => box(.2, F - .2, .2, cmat('#b9b2a4'), s * (pw / 2 - .15), (F - .2) / 2, pd - .15, pg));
    // columnas con base, capitel y ménsulas
    const postX = [-pw / 2 + .09, pw / 2 - .09]; if (pw > 4.5 && !screened) postX.splice(1, 0, -pw / 6, pw / 6);
    const PH = 2.42;
    const posts = postX.map(x => [x, pd - .09]); if (!attached) posts.push([-pw / 2 + .09, .09], [pw / 2 - .09, .09]);
    posts.forEach(([a, b]) => {
      box(.14, PH, .14, MAT.trim, a, F + .07 + PH / 2, b, pg); box(.22, .2, .22, MAT.trim, a, F + .17, b, pg, false); box(.22, .08, .22, MAT.trim, a, F + PH - .02, b, pg, false);
      [-1, 1].forEach(sd => { const br = new THREE.Shape(); br.moveTo(0, 0); br.lineTo(.32, 0); br.quadraticCurveTo(.06, -.06, 0, -.32); br.closePath(); const bm = mesh(new THREE.ExtrudeGeometry(br, { depth: .04, bevelEnabled: false }), MAT.trim, pg, a + sd * .07, F + PH - .06, b - .02, false); bm.scale.x = sd; });
    });
    // viga, techo del porche (azul "haint"), ventilador, guirnalda y helechos
    box(pw + .1, .22, .16, MAT.trim, 0, F + PH + .1, pd - .09, pg);
    if (roofed) {
      const prg = new THREE.Group(); pg.add(prg); porchRoofs.push(prg);
      const back = attached ? 0 : -.3, fz = pd + .35, yb = attached ? F + H + .42 : F + PH + .75, yf = F + PH + .2;
      const sl = Math.atan2(yb - yf, fz - back), L = Math.hypot(fz - back, yb - yf);
      const pr = box(pw + .5, .07, L, roofMat, 0, (yb + yf) / 2 + .1, (back + fz) / 2, prg); pr.rotation.x = sl;
      const nr = Math.round((pw + .4) / .42); const rib = new THREE.InstancedMesh(new THREE.BoxGeometry(.025, .035, L), roofMat, nr); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(sl, 0, 0));
      for (let i = 0; i < nr; i++) { m4.compose(V(-pw / 2 - .05 + i * ((pw + .1) / (nr - 1)), (yb + yf) / 2 + .15, (back + fz) / 2), q, V(1, 1, 1)); rib.setMatrixAt(i, m4); } prg.add(rib);
      const ceil = mesh(new THREE.PlaneGeometry(pw, L), haint, prg, 0, (yb + yf) / 2 + .02, (back + fz) / 2 - .1, false); ceil.rotation.x = Math.PI / 2 + sl;
      box(pw + .54, .16, .04, MAT.trim, 0, yf + .06, fz + .02, prg, false);
      mesh(gutterGeo(pw + .5, 'x'), cmat('#f2efe8', { side: THREE.DoubleSide, roughness: .4 }), prg, 0, yf - .02, fz + .1, false);
      if (!attached) box(pw + .1, .22, .16, MAT.trim, 0, F + PH + .1, .09, pg);
      const fan = ceilingFan(prg, 0, F + PH + .05, pd * .5, '#c8a77a', true); rotors.push(fan.userData.rotor);
      // guirnalda de bombillas en la viga
      const bulbsN = Math.round(pw / .4), pts = catenary(V(-pw / 2 + .1, F + PH - .02, pd - .02), V(pw / 2 - .1, F + PH - .02, pd - .02), bulbsN, .22);
      const wire = cmat('#2a2a28');
      for (let i = 0; i < pts.length - 1; i++) rod(pts[i], pts[i + 1], .006, wire, prg, 3);
      pts.forEach((p, i) => { if (i % 2) return; sph(.035, MAT.bulb, prg, p.x, p.y - .05, p.z, 6, 4); lightPts.push(V(p.x + xOff, p.y - .05, p.z + z0)); });
      if (!screened) { hangingFern(prg, -pw / 2 + .6, F + PH + .05, pd - .35); hangingFern(prg, pw / 2 - .6, F + PH + .05, pd - .35); }
    }
    if (screened) {
      const scr = CT.screen.clone(); scr.needsUpdate = true; scr.repeat.set(pw * 2, 2.3 * 2);
      const sm = new THREE.MeshStandardMaterial({ map: scr, transparent: true, roughness: .9, side: THREE.DoubleSide, depthWrite: false });
      const sides = [[pw, 0, pd - .04, 0], [pd, -pw / 2 + .04, pd / 2, Math.PI / 2], [pd, pw / 2 - .04, pd / 2, Math.PI / 2]];
      sides.forEach(([l, x, z, ry]) => {
        const sg = new THREE.Group(); sg.position.set(x, F, z); sg.rotation.y = ry; pg.add(sg);
        mesh(new THREE.PlaneGeometry(l - .2, PH - .62), sm, sg, 0, .62 + (PH - .62) / 2, 0, false);
        box(l - .1, .5, .05, MAT.trim, 0, .32, 0, sg);                         // panel inferior
        box(l - .1, .06, .07, MAT.trim, 0, .62, 0, sg, false); box(l - .1, .06, .07, MAT.trim, 0, PH, 0, sg, false);
        const n = Math.max(1, Math.round(l / 1.2)); for (let i = 1; i < n; i++) box(.06, PH - .6, .07, MAT.trim, -l / 2 + i * l / n, .62 + (PH - .62) / 2, 0, sg, false);
      });
      // puerta mosquitera
      const sdx = pw * .3;
      const sdg = new THREE.Group(); sdg.position.set(sdx, F + .07, pd - .02); pg.add(sdg);
      [[-.43, 1.02, .07, 2.04], [.43, 1.02, .07, 2.04], [0, 2.02, .9, .07], [0, .05, .9, .1], [0, .95, .9, .1]].forEach(([x, y, w, h]) => box(w, h, .05, accent, x, y, 0, sdg, false));
      sph(.03, brass, sdg, .34, .95, .05);
    } else {
      // barandilla con balaustres
      const runs = attached ? [[pw, 0, pd - .06, 0], [pd - .1, -pw / 2 + .07, pd / 2, Math.PI / 2], [pd - .1, pw / 2 - .07, pd / 2, Math.PI / 2]] : [];
      const stairW = 1.25;
      runs.forEach(([w, x, z, ry], ri) => {
        const segs = ri === 0 ? [[-pw / 2 + .1, -stairW / 2], [stairW / 2, pw / 2 - .1]] : [[-w / 2, w / 2]];
        segs.forEach(([a, b]) => {
          const L = b - a, cx = (a + b) / 2; const rg = new THREE.Group(); rg.position.set(x, F + .07, z); rg.rotation.y = ry; pg.add(rg);
          box(L, .06, .12, MAT.trim, cx, .95, 0, rg, false); box(L, .05, .07, MAT.trim, cx, .12, 0, rg, false);
          const n = Math.floor(L / .13); const bal = new THREE.InstancedMesh(new THREE.BoxGeometry(.04, .8, .04), MAT.trim, n);
          const m4 = new THREE.Matrix4(); for (let i = 0; i < n; i++) { m4.makeTranslation(a + .07 + i * (L - .14) / Math.max(1, n - 1), .53, 0); bal.setMatrixAt(i, m4); } bal.castShadow = true; rg.add(bal);
        });
      });
    }
    // escalones con zancas y pasamanos
    const sx = screened ? pw * .3 : 0, sw = screened ? 1.0 : 1.2;
    for (let i = 0; i < 3; i++) { box(sw, .05, .32, deckMat, sx, F - (i + 1) * .22 + .05, pd + .16 + i * .3, pg); box(sw - .04, .2, .03, MAT.trim, sx, F - (i + 1) * .22 - .05, pd + .02 + i * .3, pg, false); }
    [-1, 1].forEach(s => { const z = box(.05, .25, 1.2, MAT.trim, sx + s * sw / 2, F / 2 - .15, pd + .5, pg, false); z.rotation.x = .64;
      if (!screened) { box(.1, 1, .1, MAT.trim, sx + s * (sw / 2 + .02), .5, pd + 1.05, pg); const hr = box(.05, .05, 1.25, MAT.trim, sx + s * (sw / 2 + .02), F + .55, pd + .5, pg, false); hr.rotation.x = .58; sph(.06, MAT.trim, pg, sx + s * (sw / 2 + .02), 1.02, pd + 1.05); } });
    return pg;
  };

  const porchDecor = (pg, pw, pd, screened, z0 = 0) => {
    const fy = F + .07;
    if (c.porch === 'deck' && pw > 4.5) {
      // columpio de porche colgado con cadenas
      const sw = new THREE.Group(); sw.position.set(-pw / 2 + 1.3, fy, pd * .45); pg.add(sw);
      const sm = cmat('#f4f1ea', { roughness: .6 });
      box(1.3, .05, .5, sm, 0, .48, 0, sw); for (let i = 0; i < 7; i++) box(.08, .5, .03, sm, -.54 + i * .18, .76, -.24, sw, false);
      box(1.36, .05, .06, sm, 0, 1.02, -.24, sw, false); [-.66, .66].forEach(x => box(.05, .3, .45, sm, x, .62, 0, sw, false));
      box(1.2, .08, .42, cmat('#2f8f8a', { roughness: 1 }), 0, .54, .02, sw, false); box(.4, .3, .1, cmat('#f2c46e', { roughness: 1 }), -.35, .7, -.17, sw, false); box(.35, .28, .1, cmat('#ffffff', { roughness: 1 }), .38, .7, -.17, sw, false);
      const ch = cmat('#444', { metalness: .6, roughness: .4 }); [-.62, .62].forEach(x => { rod(V(x, .5, .2), V(x, 2.38, .05), .008, ch, sw, 3); rod(V(x, .5, -.22), V(x, 2.38, .05), .008, ch, sw, 3); });
      rocker(pg, pw / 2 - 1.1, fy, pd * .55, -.35, c.accent); rocker(pg, pw / 2 - 2.0, fy, pd * .55, .2, '#f4f1ea');
      sideTable(pg, pw / 2 - 1.55, fy, pd * .45, true, null);
    } else if (screened) {
      rocker(pg, -pw * .3, fy, pd * .45, .25, '#f4f1ea'); rocker(pg, -pw * .3 + .9, fy, pd * .5, -.2, c.accent);
      sideTable(pg, -pw * .3 + .45, fy, pd * .3, true, null);
      // mesa de bistró
      const bt = new THREE.Group(); bt.position.set(pw * .25, fy, pd * .38); pg.add(bt); cyl(.35, .35, .03, cmat('#2c3a3f', { metalness: .5, roughness: .4 }), 0, .72, 0, bt, 16); cyl(.03, .03, .72, MAT.dark, 0, .36, 0, bt, 6);
      [0, Math.PI].forEach(a => { const ch = new THREE.Group(); ch.position.set(Math.sin(a + 1.57) * .55, 0, Math.cos(a + 1.57) * .55); ch.rotation.y = a + Math.PI / 2; bt.add(ch); const m = cmat('#2c3a3f', { metalness: .5, roughness: .4 }); box(.4, .03, .4, m, 0, .45, 0, ch, false); box(.4, .45, .03, m, 0, .68, -.19, ch, false); [[-.17, .17], [.17, .17], [-.17, -.17], [.17, -.17]].forEach(([p, q]) => box(.025, .45, .025, m, p, .22, q, ch, false)); });
      cyl(.08, .06, .1, cmat('#e8e0cf'), .1, .78, .05, bt, 10); pot(bt, -.12, .735, -.08, 'flower', .35, '#f7a8c8');
    } else {
      adirondack(c.accent, pg, -pw * .28, fy, pd * .5, .15); adirondack('#f5f3ee', pg, -pw * .28 + 1, fy, pd * .52, -.15);
      sideTable(pg, -pw * .28 + .5, fy, pd * .32, true, null);
      rocker(pg, pw * .32, fy, pd * .5, -.3, '#f5f3ee');
    }
    // macetas en las esquinas y junto a la escalera
    const stairX = screened ? pw * .3 : 0;
    pot(pg, -pw / 2 + .35, fy, pd - .35, 'palm', 1.1); pot(pg, pw / 2 - .35, fy, pd - .35, r() < .5 ? 'fern' : 'flower', 1, '#ff7a6b');
    pot(pg, stairX - .9, 0, pd + 1.2, 'flower', .9, '#f2c14e'); pot(pg, stairX + .9, 0, pd + 1.2, 'flower', .9, '#f7a8c8');
    pot(pg, pw / 2 - .35, fy, .45, 'fern', .9);
  };

  if (c.porch === 'detached') {
    // porche mosquitero independiente frente al agua + escalinata de la casa
    const pg = buildPorch(3.4, 3.0, D / 2 + 5.5, true, 0, true, false);
    porchDecor(pg, 3.4, 3.0, true);
    for (let i = 0; i < 3; i++) box(1.2, .06, .32, deckMat, dx, F - (i + 1) * .22 + .05, D / 2 + .16 + i * .3, body);
    const lan = box(1.3, .12, .9, deckMat, dx, F, D / 2 + .45, body);
    // pasarela de tablas hasta el porche
    for (let i = 0; i < 7; i++) box(.9, .05, .45, deckMat, dx * (1 - i / 7), .1, D / 2 + 1.3 + i * .55, body);
    // pérgola pequeña con enredadera sobre la puerta
    [-1, 1].forEach(s => box(.1, 2.6, .1, MAT.trim, dx + s * .75, F + 1.3, D / 2 + .85, body)); for (let i = 0; i < 5; i++) box(1.8, .08, .06, MAT.trim, dx, F + 2.62, D / 2 + .1 + i * .2, body, false);
    const vine = cmat('#4f8a3e', { flatShading: true }); for (let i = 0; i < 9; i++) sph(.16, vine, body, dx - .7 + (i % 5) * .35, F + 2.7, D / 2 + .2 + (i / 5 | 0) * .5, 5, 4).scale.set(1, .5, 1);
    const pink = cmat('#e86a9a'); for (let i = 0; i < 10; i++) sph(.04, pink, body, dx - .75 + r() * 1.5, F + 2.6 + r() * .2, D / 2 + .1 + r() * .9, 4, 3);
  } else {
    const pg = buildPorch(W, P, D / 2, c.porch === 'screen');
    porchDecor(pg, W, P, c.porch === 'screen');
    // salvavidas y boyas en la fachada bajo el porche
    const gl = -W * .3 + 1.02, gr = dx - dW / 2 - .42; if (gr - gl > .66) lifeRing(body, (gl + gr) / 2, F + 1.75, D / 2);
    buoys(pg, -W / 2 + .3, F + 2.25, P - .2);
  }

  /* --- laterales y trasera: equipos y vida cotidiana --- */
  // aire acondicionado sobre losa
  const ac = new THREE.Group(); ac.position.set(W / 2 + .55, 0, -D * .25); body.add(ac);
  box(.95, .08, .7, cmat('#b9b2a4', { roughness: 1 }), 0, .04, 0, ac); box(.75, .7, .55, cmat('#d9dcdc', { roughness: .5 }), 0, .43, 0, ac);
  const gr = mesh(new THREE.PlaneGeometry(.55, .55), new THREE.MeshStandardMaterial({ map: CT.grille, roughness: .6 }), ac, 0, .79, 0, false); gr.rotation.x = -Math.PI / 2;
  box(.05, .05, .4, MAT.dark, -.4, .9, 0, ac, false).rotation.z = .4;
  // manguera enrollada y grifo
  const hose = new THREE.Group(); hose.position.set(-W / 2 - .05, 0, D * .1); body.add(hose); box(.06, .1, .06, brass, -.02, .6, 0, hose, false);
  mesh(new THREE.TorusGeometry(.2, .035, 6, 16), cmat('#3f7f3a', { roughness: .6 }), hose, -.12, .45, 0, false).rotation.y = Math.PI / 2;
  box(.05, .5, .05, MAT.dark, -.12, .25, 0, hose, false);
  // cubos de basura y reciclaje
  [['#2d3539', 0], ['#2c5f8a', .62]].forEach(([col, o]) => { const b = new THREE.Group(); b.position.set(-W / 2 + .6 + o, 0, -D / 2 - .55); body.add(b); box(.55, .95, .6, cmat(col, { roughness: .6 }), 0, .48, 0, b); const lid = box(.6, .06, .66, cmat(col, { roughness: .5 }), 0, .98, -.02, b, false); lid.rotation.x = -.03; box(.4, .04, .04, MAT.dark, 0, .9, -.32, b, false); });
  // ducha exterior con listones (cabañas pares) o bombona de propano
  if (c.n % 2 === 0) {
    const sh = new THREE.Group(); sh.position.set(W * .25, 0, -D / 2 - .85); body.add(sh); const wd = cmat('#b98d5c', { roughness: .85 });
    for (let s = 0; s < 3; s++) { const sg = new THREE.Group(); sg.rotation.y = s * Math.PI / 2 - Math.PI / 2; sg.position.set(s === 1 ? 0 : (s - 1) * .55, 0, s === 1 ? -.55 : 0); sh.add(sg); for (let i = 0; i < 7; i++) box(1.1, .12, .03, wd, 0, .3 + i * .23, 0, sg, false); }
    box(.06, 2.1, .06, wd, -.55, 1.05, -.55, sh); box(.06, 2.1, .06, wd, .55, 1.05, -.55, sh); box(.06, 2.1, .06, wd, -.55, 1.05, .55, sh); box(.06, 2.1, .06, wd, .55, 1.05, .55, sh);
    cyl(.012, .012, 1.2, MAT.metal, 0, 1.4, -.5, sh, 5); cyl(.08, .05, .06, MAT.metal, 0, 2.0, -.4, sh, 10);
    for (let i = 0; i < 4; i++) box(1, .03, .1, wd, 0, .08, -.4 + i * .25, sh, false);
    box(.35, .02, .6, cmat('#2f8f8a', { roughness: 1 }), .35, 1.5, .52, sh, false); // toalla colgada
  } else {
    const pt = mesh(new THREE.CapsuleGeometry(.18, .5, 4, 10), cmat('#eeeeea', { roughness: .4, metalness: .2 }), body, W / 2 + .4, .45, D * .15); cyl(.06, .06, .1, MAT.metal, W / 2 + .4, .82, D * .15, body, 6);
  }
  // macizo de conchas con plantas junto a la fachada
  const bedMat = cmat('#e9e1cf', { roughness: 1 }); const bw = W / 2 - .9, bxc = -W / 2 + bw / 2, bz = D / 2 + .55 + (c.porch === 'detached' ? 0 : P);
  const bed = mesh(new THREE.BoxGeometry(bw, .06, .7), bedMat, body, bxc, .05, bz, false);
  const shr = cmat('#4f7a3a', { flatShading: true, roughness: .95 }), shr2 = cmat('#6b8f45', { flatShading: true, roughness: .95 });
  for (let i = 0; i < Math.round(bw / .55); i++) { const px = -W / 2 + .3 + i * .55; const sp = sph(.22 + r() * .08, i % 2 ? shr : shr2, body, px, .2, bz - .05, 7, 5); sp.scale.y = .8; const fc = cmat(['#ff7a6b', '#ffd166', '#f7a8c8', '#ffffff'][i % 4], { roughness: .6 }); for (let k = 0; k < 4; k++) sph(.035, fc, body, px + (r() - .5) * .3, .32 + r() * .08, bz + .1 + (r() - .5) * .2, 4, 3); }
  // bordillo de piedras
  const stoneM = cmat('#a39a8a', { roughness: 1, flatShading: true });
  for (let i = 0; i < Math.round(bw / .2); i++) mesh(new THREE.DodecahedronGeometry(.09, 0), stoneM, body, -W / 2 + .1 + i * .2, .07, bz + .38, false);
  // camino de losetas hasta el porche
  const stair = c.porch === 'detached' ? null : V(c.porch === 'screen' ? W * .3 : 0, 0, D / 2 + P + 1.2);
  if (stair) for (let i = 0; i < 5; i++) { const st = mesh(new THREE.CylinderGeometry(.32 + r() * .06, .34, .05, 7), cmat('#cbc3b2', { roughness: 1, flatShading: true }), body, stair.x + (r() - .5) * .25, .04, stair.z + .25 + i * .72, false); st.rotation.y = r() * 3; }
  // bicicleta playera apoyada (impares) o tabla de remo (pares)
  if (c.n % 2) {
    const b = new THREE.Group(); b.position.set(W / 2 + .45, 0, D * .32); b.rotation.y = Math.PI / 2; body.add(b); const fm = cmat(c.accent, { metalness: .3, roughness: .45 });
    [-.5, .5].forEach(o => { mesh(new THREE.TorusGeometry(.33, .03, 6, 20), MAT.dark, b, o, .35, 0, false); for (let k = 0; k < 4; k++) { const sp = box(.6, .008, .008, MAT.metal, o, .35, 0, b, false); sp.rotation.z = k * .785; } });
    box(1, .05, .05, fm, 0, .55, 0, b, false).rotation.z = .1; box(.05, .5, .05, fm, -.2, .55, 0, b, false); box(.25, .06, .12, MAT.dark, -.2, .82, 0, b, false); box(.05, .1, .55, MAT.dark, .45, .92, 0, b, false); box(.32, .22, .32, cmat('#c9a46a', { roughness: 1 }), .64, .82, 0, b, false);
  } else {
    const sup = mesh(new THREE.CapsuleGeometry(.32, 2.4, 4, 10), cmat(r() < .5 ? '#f2c14e' : '#2f9fb0', { roughness: .35 }), body, -W / 2 - .2, 1.55, -D * .3, true); sup.scale.set(1, 1, .14); sup.rotation.set(0, Math.PI / 2, .12);
    cyl(.015, .015, 2, cmat('#2a2a28'), -W / 2 - .3, 1.05, -D * .3 + .55, body, 5).rotation.z = .1;
  }
  // red de pesca con flotadores (cabañas frente al agua)
  if (c.view === 'water') {
    const net = new THREE.Group(); net.position.set(-W * .25, F + 1.4, -D / 2 - .02); net.rotation.y = Math.PI; body.add(net);
    const nt = canvasTex(64, 64, (q, w, h) => { q.clearRect(0, 0, w, h); q.strokeStyle = '#e7d9b8'; q.lineWidth = 2; for (let i = -64; i < 128; i += 10) { q.beginPath(); q.moveTo(i, 0); q.lineTo(i + 64, 64); q.moveTo(i + 64, 0); q.lineTo(i, 64); q.stroke(); } });
    const ng = new THREE.PlaneGeometry(1.4, 1, 8, 4); const p = ng.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, -Math.cos(p.getX(i) * 2) * .04 + (p.getY(i) < 0 ? .03 : 0)); ng.computeVertexNormals();
    mesh(ng, new THREE.MeshStandardMaterial({ map: nt, alphaTest: .4, side: THREE.DoubleSide, roughness: 1 }), net, 0, 0, .04, false);
    ['#e2553f', '#f2c14e', '#e2553f', '#f6f2ea'].forEach((col, i) => sph(.06, cmat(col, { roughness: .4 }), net, -.55 + i * .37, -.45 + (i % 2) * .1, .08, 8, 6));
  }

  /* --- interior --- */
  const ud = { porchRoofs, wallMat, roof, door, W, D, F, H, dx, dW, rise, porchDepth: P, lightPts, rotors };
  ud.porchLight = new THREE.Object3D(); ud.porchLight.position.copy(lightPts[0]); body.add(ud.porchLight);
  if (interior) ud.interior = buildInterior(c, g, W, D, F, H, t, dx, dW, dH);
  g.userData = ud;
  return g;
}

/* ---------- interior amueblado y decorado ---------- */
function buildInterior(c, g, W, D, F, H, t, dx, dW, dH) {
  const I = new THREE.Group(); g.add(I); const fy = F + .08; const R = rng(c.n * 7 + 1);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * t, D - 2 * t), MAT.plank); floor.rotation.x = -Math.PI / 2; floor.position.y = fy; floor.receiveShadow = true;
  MAT.plank.map.repeat.set(2, 2); I.add(floor);
  // revestimiento interior machihembrado blanco
  const lin = new THREE.MeshStandardMaterial({ color: '#f6f4ee', map: CT.shiplap.map, normalMap: CT.shiplap.normalMap, roughness: .85 });
  const iw = W / 2 - t, id = D / 2 - t, yc = F + H / 2;
  const liner = (w, h, x, y, z, ry) => { const m = mesh(new THREE.PlaneGeometry(w, h), lin, I, x, y, z, false); m.rotation.y = ry; return m; };
  liner(W - 2 * t, H, 0, yc, -id - .002 + .004, 0);
  liner(D - 2 * t, H, -iw + .004, yc, 0, Math.PI / 2); liner(D - 2 * t, H, iw - .004, yc, 0, -Math.PI / 2);
  const lw = (dx - dW / 2) + iw, rw = iw - (dx + dW / 2);
  liner(lw, H, -iw + lw / 2, yc, id - .004, Math.PI); liner(rw, H, iw - rw / 2, yc, id - .004, Math.PI); liner(dW, H - dH, dx, F + dH + (H - dH) / 2, id - .004, Math.PI);
  // rodapié y moldura de techo
  [[W - 2 * t, 0, -id + .02, 0], [W - 2 * t, 0, id - .02, 0], [D - 2 * t, -iw + .02, 0, Math.PI / 2], [D - 2 * t, iw - .02, 0, Math.PI / 2]].forEach(([l, x, z, ry]) => { box(l, .12, .03, MAT.trim, x, fy + .06, z, I, false).rotation.y = ry; box(l, .08, .05, MAT.trim, x, F + H - .04, z, I, false).rotation.y = ry; });
  const part = new THREE.MeshStandardMaterial({ color: '#eef1ec', map: CT.shiplap.map, normalMap: CT.shiplap.normalMap, roughness: .9 });
  const wall = (x, z, len, rot) => { const m = box(len, H, .1, part, x, F + H / 2, z, I); m.rotation.y = rot; return m; };
  const linen = cmat('#f4f1ea', { roughness: 1 }), wood = cmat('#c9b08a', { roughness: .6 }), teal = cmat('#3f9a92', { roughness: .95 });
  const quilt = new THREE.MeshStandardMaterial({ map: CT.quilt, roughness: 1 });
  const lamps = [];
  const lamp = (p, x, y, z, s = 1) => { const l = new THREE.Group(); l.position.set(x, y, z); l.scale.setScalar(s); p.add(l); cyl(.07, .09, .05, cmat('#c9a456', { metalness: .6, roughness: .35 }), 0, .025, 0, l, 10); mesh(new THREE.SphereGeometry(.09, 10, 8), cmat('#6fb3b8', { roughness: .2, metalness: .1 }), l, 0, .14, 0, false); cyl(.012, .012, .15, MAT.metal, 0, .28, 0, l, 5); cyl(.1, .15, .2, MAT.bulb, 0, .42, 0, l, 12); return l; };
  const bed = (x, z, ry, w) => {
    const b = new THREE.Group(); b.position.set(x, fy, z); b.rotation.y = ry; I.add(b);
    box(w + .1, .25, 2.1, wood, 0, .2, 0, b);
    box(w, .25, 2.0, linen, 0, .45, 0, b);
    box(w + .04, .06, 1.35, quilt, 0, .6, .3, b, false);                          // edredón de patchwork
    box(w + .1, .03, .5, cmat('#2f6f86', { roughness: 1 }), 0, .64, .75, b, false);  // manta a los pies
    box(w * .42, .16, .42, linen, -w * .23, .66, -.72, b); box(w * .42, .16, .42, linen, w * .23, .66, -.72, b);
    box(w * .3, .2, .1, cmat('#e07a5f', { roughness: 1 }), -w * .15, .72, -.48, b, false).rotation.x = -.3; box(w * .3, .2, .1, cmat('#f2c46e', { roughness: 1 }), w * .17, .72, -.48, b, false).rotation.x = -.3;
    // cabecero de listones
    for (let i = 0; i < 7; i++) box((w + .3) / 7 - .02, 1.15, .05, cmat('#f2efe7', { roughness: .7 }), -(w + .3) / 2 + (i + .5) * (w + .3) / 7, .6, -1.06, b);
    box(w + .4, .06, .1, cmat('#f2efe7'), 0, 1.2, -1.06, b, false);
    [-1, 1].forEach(s => { const n = new THREE.Group(); n.position.set(s * (w / 2 + .38), 0, -.8); b.add(n); box(.48, .55, .4, cmat('#e7f0ee', { roughness: .6 }), 0, .28, 0, n); box(.4, .02, .02, cmat('#c9a456', { metalness: .6 }), 0, .4, .21, n, false); lamp(n, 0, .56, 0, .9); lamps.push(n); box(.14, .03, .2, cmat('#7a4b3a'), .1, .57, .08, n, false); });
    // cuadro sobre el cabecero
    const art = mesh(new THREE.PlaneGeometry(w * .7, w * .5), new THREE.MeshStandardMaterial({ map: CT.art[(c.n) % 3], roughness: .7 }), b, 0, 1.75, -1.09, false);
    box(w * .7 + .08, w * .5 + .08, .03, cmat('#f4efe4'), 0, 1.75, -1.11, b, false);
    return b;
  };
  const sofa = (x, z, ry, w = 1.6) => {
    const s = new THREE.Group(); s.position.set(x, fy, z); s.rotation.y = ry; I.add(s);
    box(w, .22, .85, teal, 0, .2, 0, s); [-1, 1].forEach(k => box(w / 2 - .06, .14, .66, cmat('#46a59c', { roughness: 1 }), k * w / 4, .38, .06, s));
    box(w, .5, .2, teal, 0, .55, -.33, s); box(.2, .55, .85, teal, -w / 2, .35, 0, s); box(.2, .55, .85, teal, w / 2, .35, 0, s);
    [-.4, .4].forEach((o, i) => { const p = box(.38, .34, .12, cmat(i ? '#f2c46e' : '#f4f1ea', { roughness: 1 }), o * w / 1.6, .62, -.18, s, false); p.rotation.x = -.25; p.rotation.z = o * .2; });
    box(1.1, .04, .55, cmat('#e07a5f', { roughness: 1 }), w * .1, .66, -.3, s, false).rotation.x = -1.1; // manta
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b]) => cyl(.025, .02, .1, wood, a * (w / 2 - .05), .05, b * .36, s, 5));
    // mesa de centro con libros y estrella de mar
    const ct = new THREE.Group(); ct.position.set(0, 0, 1.05); s.add(ct);
    box(1, .05, .55, wood, 0, .42, 0, ct); box(.9, .03, .45, wood, 0, .12, 0, ct, false); [[-.45, .23], [.45, .23], [-.45, -.23], [.45, -.23]].forEach(([a, b]) => box(.05, .42, .05, wood, a, .21, b, ct, false));
    box(.3, .05, .22, cmat('#2d5f73'), -.2, .47, 0, ct, false); box(.26, .04, .2, cmat('#f1ece2'), -.2, .515, 0, ct, false);
    const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .035 : .09, a = i * Math.PI / 5; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(r, 0); } const sm = mesh(new THREE.ExtrudeGeometry(st, { depth: .015, bevelEnabled: false }), cmat('#e8935e', { roughness: .9 }), ct, .25, .45, 0, false); sm.rotation.x = -Math.PI / 2;
    cyl(.07, .05, .1, cmat('#f4f1ea'), .05, .5, .12, ct, 10); sph(.06, cmat('#4f8a3e', { flatShading: true }), ct, .05, .58, .12, 6, 4);
    return s;
  };
  const kitchen = (x0, x1, z) => {
    const k = new THREE.Group(); k.position.set(0, fy, z); I.add(k); const L = x1 - x0, cx = (x0 + x1) / 2, cl = L - .8, cc = cx - .4;
    const cab = cmat('#4a9b8c', { roughness: .55 });
    box(cl, .86, .6, cab, cc, .45, 0, k); box(cl + .04, .05, .64, cmat('#e6dccb', { roughness: .3 }), cc, .9, .01, k);
    const nd = Math.max(2, Math.round(cl / .5)); for (let i = 0; i < nd; i++) { const px = cc - cl / 2 + (i + .5) * cl / nd; box(cl / nd - .04, .62, .01, cmat('#55a898'), px, .4, .305, k, false); box(.12, .02, .03, cmat('#c9a456', { metalness: .7, roughness: .3 }), px, .66, .32, k, false); }
    box(cl, .1, .02, cmat('#2c3a3f'), cc, .05, .3, k, false);
    // salpicadero de azulejo
    const bs = mesh(new THREE.PlaneGeometry(cl, .55), new THREE.MeshStandardMaterial({ map: CT.tile, roughness: .25 }), k, cc, 1.2, -.29, false);
    // fregadero, grifo, estufa, campana, nevera, microondas, cafetera, frutero, hervidor
    box(.5, .02, .36, MAT.metal, cc + cl * .25, .925, 0, k, false); cyl(.015, .015, .28, MAT.metal, cc + cl * .25, 1.06, -.2, k, 6); const sp = cyl(.012, .012, .2, MAT.metal, cc + cl * .25, 1.19, -.12, k, 6); sp.rotation.x = Math.PI / 2;
    box(.6, .9, .62, MAT.white, cc - .2, .45, .02, k); box(.52, .02, .5, MAT.dark, cc - .2, .93, .02, k); [[-.12, -.1], [.12, -.1], [-.12, .12], [.12, .12]].forEach(([a, b]) => mesh(new THREE.TorusGeometry(.07, .01, 4, 14), MAT.metal, k, cc - .2 + a, .945, .02 + b, false).rotation.x = Math.PI / 2);
    box(.5, .3, .02, MAT.dark, cc - .2, .5, .335, k, false); box(.4, .02, .03, MAT.metal, cc - .2, .72, .34, k, false);
    const ket = sph(.09, cmat('#e07a5f', { roughness: .3, metalness: .2 }), k, cc - .32, 1.02, -.08, 10, 8); ket.scale.y = .9; cyl(.012, .012, .1, MAT.dark, cc - .32, 1.13, -.08, k, 4);
    box(.6, .25, .45, MAT.metal, cc - .2, 1.75, -.08, k);
    box(.75, 1.78, .7, MAT.white, x1 - .4, .89, 0, k); box(.02, .5, .03, MAT.metal, x1 - .7, 1.3, .36, k, false); box(.02, .3, .03, MAT.metal, x1 - .7, .55, .36, k, false); box(.73, .01, .01, cmat('#ccc'), x1 - .4, 1.0, .355, k, false);
    for (let i = 0; i < 3; i++) box(.12, .12, .01, cmat(['#e07a5f', '#f2c46e', '#2f8f8a'][i]), x1 - .55 + i * .14, 1.45 - (i % 2) * .15, .356, k, false); // imanes / notas
    box(cl, .6, .35, cmat('#f4f2ec', { roughness: .5 }), cc, 1.85, -.12, k); for (let i = 0; i < nd; i++) { const px = cc - cl / 2 + (i + .5) * cl / nd; box(cl / nd - .04, .54, .01, MAT.white, px, 1.85, .055, k, false); box(.02, .1, .03, cmat('#c9a456', { metalness: .7 }), px + .12, 1.65, .07, k, false); }
    box(.45, .28, .32, MAT.dark, x0 + .5, 1.08, -.05, k); box(.3, .2, .01, cmat('#11181b', { roughness: .1 }), x0 + .45, 1.08, .115, k, false);
    box(.16, .3, .2, cmat('#2a2f33'), cc + cl * .05, 1.07, -.12, k, false); cyl(.05, .05, .1, cmat('#ddd', { roughness: .1 }), cc + cl * .05, .98, -.02, k, 8);
    const bowl = mesh(new THREE.SphereGeometry(.14, 12, 6, 0, 7, Math.PI / 2, Math.PI / 2), cmat('#f4efe4', { side: THREE.DoubleSide }), k, cc + cl * .42, 1.06, .02, false); bowl.rotation.x = Math.PI;
    ['#f2a43a', '#e5d34a', '#9bc34a', '#e2553f'].forEach((col, i) => sph(.045, cmat(col, { roughness: .5 }), k, cc + cl * .42 + Math.cos(i * 1.6) * .06, .98, .02 + Math.sin(i * 1.6) * .06, 8, 6));
    box(.35, .02, .25, cmat('#b98d5c'), cc + cl * .1, .935, .05, k, false);
    // estante abierto con vajilla
    box(.7, .03, .22, wood, cc + cl * .25, 1.62, -.18, k, false); for (let i = 0; i < 4; i++) cyl(.04, .035, .09, cmat(['#f4f1ea', '#7fb3c4', '#f4f1ea', '#e07a5f'][i]), cc + cl * .25 - .24 + i * .16, 1.68, -.18, k, 8);
    return k;
  };
  const table = (x, z, n = 2) => {
    const tb = new THREE.Group(); tb.position.set(x, fy, z); I.add(tb);
    cyl(.45, .45, .04, wood, 0, .75, 0, tb, 20); cyl(.05, .07, .7, wood, 0, .37, 0, tb, 8); cyl(.25, .28, .04, wood, 0, .02, 0, tb, 12);
    for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; const ch = new THREE.Group(); ch.position.set(Math.cos(a) * .68, 0, Math.sin(a) * .68); ch.rotation.y = -a - Math.PI / 2; tb.add(ch); const cm = cmat('#f4f1ea', { roughness: .6 }); box(.42, .04, .42, cm, 0, .46, 0, ch); box(.38, .06, .36, cmat('#7fb3c4', { roughness: 1 }), 0, .5, 0, ch, false); for (let k = 0; k < 4; k++) box(.04, .45, .03, cm, -.15 + k * .1, .72, -.2, ch, false); box(.42, .05, .04, cm, 0, .96, -.2, ch, false); [[-.18, .18], [.18, .18], [-.18, -.18], [.18, -.18]].forEach(([p, q]) => box(.035, .46, .035, cm, p, .23, q, ch, false)); }
    const run = box(.3, .005, .8, cmat('#2f6f86', { roughness: 1 }), 0, .775, 0, tb, false);
    pot(tb, 0, .77, 0, 'flower', .45, '#f7a8c8'); cyl(.025, .025, .14, cmat('#f6efe2'), .2, .84, .12, tb, 8);
    return tb;
  };
  const bath = (x0, z0, w, d, tub) => {
    wall(x0 + w / 2, z0 + d, w, 0); wall(x0 + w, z0 + d / 2, d, Math.PI / 2);
    const bf = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: CT.tile, roughness: .3 })); bf.rotation.x = -Math.PI / 2; bf.position.set(x0 + w / 2, fy + .005, z0 + d / 2); I.add(bf);
    if (tub) { box(w - .2, .55, .75, MAT.white, x0 + w / 2, fy + .28, z0 + .45, I); box(w - .4, .02, .55, cmat('#bfe0e6', { roughness: .1 }), x0 + w / 2, fy + .5, z0 + .45, I, false); const cr = mesh(new THREE.PlaneGeometry(.7, 1.6, 6, 1), cmat('#f4f1ea', { side: THREE.DoubleSide, roughness: 1 }), I, x0 + w - .5, fy + 1.4, z0 + .85, false); }
    else { box(.9, .08, .9, MAT.white, x0 + .55, fy + .04, z0 + .55, I); const gl = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.9), MAT.screen); gl.position.set(x0 + 1.0, fy + 1, z0 + .55); gl.rotation.y = Math.PI / 2; I.add(gl); cyl(.06, .04, .04, MAT.metal, x0 + .55, fy + 1.95, z0 + .12, I, 10); }
    box(.4, .4, .55, MAT.white, x0 + w - .35, fy + .2, z0 + d - .45, I); box(.38, .35, .2, MAT.white, x0 + w - .35, fy + .55, z0 + d - .72, I);
    box(.55, .8, .4, cmat('#cfe3e6', { roughness: .6 }), x0 + .4, fy + .4, z0 + d - .3, I); box(.6, .04, .44, cmat('#f4f1ea', { roughness: .3 }), x0 + .4, fy + .82, z0 + d - .3, I, false);
    const mir = mesh(new THREE.CircleGeometry(.28, 24), cmat('#cfe6ec', { metalness: .9, roughness: .05 }), I, x0 + .4, fy + 1.45, z0 + d - .06, false); mir.rotation.y = Math.PI; mesh(new THREE.TorusGeometry(.29, .025, 6, 24), cmat('#c9a456', { metalness: .7, roughness: .3 }), I, x0 + .4, fy + 1.45, z0 + d - .065, false);
    box(.3, .45, .04, cmat('#2f8f8a', { roughness: 1 }), x0 + w - .08, fy + 1.0, z0 + d * .5, I, false).rotation.y = Math.PI / 2; box(.6, .01, .4, cmat('#f4f1ea', { roughness: 1 }), x0 + w / 2, fy + .01, z0 + d - .8, I, false);
  };
  const shelf = (x, z, ry) => { const s = new THREE.Group(); s.position.set(x, fy, z); s.rotation.y = ry; I.add(s); const m = cmat('#f2efe7', { roughness: .6 }); [-.4, .4].forEach(a => box(.03, 1.6, .3, m, a, .8, 0, s)); for (let i = 0; i < 4; i++) box(.8, .03, .3, m, 0, .05 + i * .5, 0, s, false); const bm = new THREE.MeshStandardMaterial({ map: CT.books, roughness: .8 }); [.27, .77].forEach(y => box(.72, .22, .2, bm, 0, y + .06, 0, s, false)); pot(s, .2, 1.32, 0, 'fern', .5); sph(.08, cmat('#f4e4c8', { roughness: .6 }), s, -.2, 1.38, 0, 8, 6).scale.set(1, .6, 1); return s; };
  const fanG = ceilingFan(I, 0, F + H - .35, 0, '#e8e2d4', true); const fan2 = ceilingFan(I, 0, F + H - .35, 0, '#e8e2d4', true); fan2.visible = false;
  const stops = {};
  const tv = (x, z, ry) => { const s = new THREE.Group(); s.position.set(x, fy, z); s.rotation.y = ry; I.add(s); box(1.1, .55, .42, wood, 0, .28, 0, s); [-.27, .27].forEach(o => box(.5, .45, .01, cmat('#d8c3a0'), o, .28, .215, s, false)); box(1.05, .6, .04, MAT.dark, 0, 1.05, -.12, s); box(1, .55, .01, cmat('#18262b', { roughness: .1, metalness: .3 }), 0, 1.05, -.095, s, false); pot(s, .42, .55, .05, 'palm', .55); box(.22, .05, .16, cmat('#e07a5f'), -.35, .58, .05, s, false); return s; };
  if (c.layout === 'studio') {
    bath(-iw, -id, 1.9, 2.1, c.bath !== 'Ducha');
    kitchen(-iw + 1.9, iw, -id + .35);
    bed(-iw + 1.15, .25, Math.PI / 2, 1.55);
    sofa(iw - .5, id - 1.4, -Math.PI / 2, c.guests > 2 ? 1.7 : 1.4);
    table(.6, -.6, 2);
    tv(iw - .3, .2, -Math.PI / 2);
    shelf(.4, id - .2, Math.PI);
    stops.living = [iw - 1.3, id - 1.2]; stops.kitchen = [.6, -.4]; stops.bed = [-iw + 1.4, 1.6];
    fanG.position.x = -.6;
  } else if (c.layout === 'suite') {
    const bx = -iw + 3.0; wall(bx, -id + 2.2 + (D - 2.2) / 2 - t, D - 2.2 - .9, Math.PI / 2);
    bath(-iw, -id, 2.0, 2.2, false); wall(-iw + 2.6, -id + 2.2, 0.8, 0);
    bed(-iw + 1.5, .9, 0, 1.95);
    kitchen(bx + .2, iw, -id + .35); table(bx + 1.5, -.3, 4); sofa(iw - .5, id - 1.4, -Math.PI / 2, 1.8);
    shelf(bx + .7, id - .2, Math.PI);
    stops.living = [iw - 1.6, id - 1.0]; stops.kitchen = [bx + 1.5, .3]; stops.bed = [-iw + 1.5, id - .5];
    fanG.position.x = bx + 1.4; fan2.visible = true; fan2.position.set(-iw + 1.5, F + H - .35, .7);
  } else {
    const mz = -.4;
    wall(0, mz, W - 2 * t, 0); wall(-.6, (-id + mz) / 2, -mz + id, Math.PI / 2);
    bath(-.6, -id, 1.4, 1.8, c.bath !== 'Ducha');
    bed(-iw + 1.2, -id + 1.2, Math.PI / 2, 1.55);
    bed(iw - 1.25, -id + 1.25, -Math.PI / 2, c.n === 1 ? 1.95 : 1.55);
    kitchen(-iw + .1, -.6, mz + .45);
    table(-iw + 1.3, mz + 1.9, 4); sofa(iw - .5, id - 1.3, -Math.PI / 2, 1.8);
    if (c.n === 6) bed(iw - 1.3, mz + 1.6, -Math.PI / 2, 1.55);
    shelf(-.2, id - .2, Math.PI);
    stops.living = [iw - 1.8, id - .9]; stops.kitchen = [-iw + 1.4, mz + 1.4]; stops.bed = [-iw + 2.2, mz - .3];
    fanG.position.set(.8, F + H - .35, id / 2);
  }
  // alfombra, decoración náutica en pared, planta de pie
  const rug = mesh(new THREE.PlaneGeometry(1.8, 1.25), new THREE.MeshStandardMaterial({ map: CT.rug, roughness: 1 }), I, stops.living[0] - .2, fy + .01, stops.living[1] - .3, false); rug.rotation.x = -Math.PI / 2;
  const anchorWall = new THREE.Group(); anchorWall.position.set(iw - .02, F + 1.75, stops.living[1] - .3); anchorWall.rotation.y = -Math.PI / 2; I.add(anchorWall);
  const art = mesh(new THREE.PlaneGeometry(1.1, .8), new THREE.MeshStandardMaterial({ map: CT.art[(c.n + 1) % 3], roughness: .7 }), anchorWall, 0, 0, .03, false); box(1.18, .88, .03, cmat('#b98d5c'), 0, 0, .012, anchorWall, false);
  lifeRing(I, -iw + .02, F + 1.8, stops.bed[1] + (c.layout === 'studio' ? -1.6 : .9), Math.PI / 2).scale.setScalar(.8);
  oars(I, dx + dW / 2 + .5 < iw - .3 ? dx + dW / 2 + .6 : dx - dW / 2 - .6, F + 1.7, id - .03, Math.PI);
  pot(I, iw - .35, fy, id - .35, 'palm', 1.25);
  const hook = new THREE.Group(); hook.position.set(dx - dW / 2 - .35, F + 1.6, id - .03); hook.rotation.y = Math.PI; I.add(hook); box(.5, .06, .04, wood, 0, 0, 0, hook, false); box(.25, .5, .05, cmat('#e07a5f', { roughness: 1 }), -.1, -.25, .05, hook, false);
  const light = new THREE.PointLight('#ffd9a8', 0, 9, 1.6); light.position.set(0, F + H - .5, 0); I.add(light);
  return { group: I, fans: [fanG.userData.rotor, fan2.userData.rotor], fanGroups: [fanG, fan2], light, stops, fy };
}

/* ---------- fusión estática para el mapa general (menos llamadas de dibujo) ---------- */
export function bakeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), m = new THREE.Matrix4();
  const groups = new Map(), remove = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.keep) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    m.multiplyMatrices(inv, o.matrixWorld); geo.applyMatrix4(m);
    if (m.determinant() < 0) for (const k of ['position', 'normal', 'uv']) { const a = geo.attributes[k], n = a.itemSize; for (let i = 0; i < a.count; i += 3) for (let j = 0; j < n; j++) { const t = a.array[(i + 1) * n + j]; a.array[(i + 1) * n + j] = a.array[(i + 2) * n + j]; a.array[(i + 2) * n + j] = t; } }
    const key = o.material.uuid + (o.castShadow ? 's' : 'n');
    if (!groups.has(key)) groups.set(key, { mat: o.material, cast: o.castShadow, list: [], order: o.renderOrder });
    groups.get(key).list.push(geo); remove.push(o);
  });
  remove.forEach(o => o.parent.remove(o));
  groups.forEach(({ mat, cast, list, order }) => { const geo = mergeGeometries(list, false); if (!geo) return; const mm = new THREE.Mesh(geo, mat); mm.castShadow = cast; mm.receiveShadow = true; mm.renderOrder = order; root.add(mm); });
}

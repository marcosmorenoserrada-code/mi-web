// Visor individual de cada cabaña: exterior, interior sin techo y recorrido guiado.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  rng, clamp, ease, wind, initMaterials, MAT, TEX, cmat, createSky, createWaterMaterial, sampleTOD, applyTOD,
  palmGeo, oakGeo, shrubGeo, palmettoGeo, grassGeo, flowerGeo, adirondack, grill, tableUmbrella, lampPost, bike
} from './world.js';
import { DIMS } from './data.js';
import { buildCottage } from './cottage.js';
import { createPost, createSkyEnv } from './post.js';

export function createViewer(canvas, { quality = 'high', reduced = false } = {}) {
  const LOW = quality === 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.25 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  initMaterials();
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#e9d3b5', .006);
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.minDistance = 7; controls.maxDistance = 34; controls.maxPolarAngle = 1.45; controls.enablePan = false;
  controls.autoRotate = !reduced; controls.autoRotateSpeed = .45;
  const sky = createSky(); scene.add(sky);
  const hemi = new THREE.HemisphereLight('#fff', '#556', 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff', 2.5); sun.castShadow = true; sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 200 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target);
  const post = createPost(renderer, scene, camera, { low: LOW, ao: !LOW, bloom: .22 }); const skyEnv = createSkyEnv(renderer, scene, sky);

  const pushA = a => { anim = anim.filter(b => !(b.obj === a.obj && b.key === a.key)); anim.push(a); };
  let root = null, water = null, cot = null, mode = 'out', hour = 12, tod = sampleTOD(12), tour = null, anim = [], current = null;
  const coastFor = c => c.view === 'water' ? 13 : c.view === 'partial' ? 30 : 400;

  function setHour(h) { hour = h; tod = sampleTOD(h); applyTOD(tod, { scene, sky, water: water, sun, hemi, renderer, fogDensity: .006 }); hemi.intensity *= .6; skyEnv.update(tod, true); post.set(tod); sun.position.copy(tod.lightDir).multiplyScalar(60); if (cot) cot.userData.interior.light.intensity = Math.max(tod.lights, mode === 'walk' ? .7 : 0) * 14 + (mode === 'in' ? 4 : 0); glowMat.opacity = tod.lights; glowSmall.opacity = tod.lights; }
  const glowSmall = new THREE.PointsMaterial({ map: TEX.glow, size: .55, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffd59a', opacity: 0 });
  const glowMat = new THREE.PointsMaterial({ map: TEX.glow, size: 1.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffd59a', opacity: 0 });

  function build(c) {
    if (root) { scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    current = c; root = new THREE.Group(); scene.add(root);
    const coast = coastFor(c), r = rng(c.n * 13);
    // terreno local
    const tg = new THREE.PlaneGeometry(220, 220, 110, 110); tg.rotateX(-Math.PI / 2);
    const p = tg.attributes.position, col = new Float32Array(p.count * 3), cg = new THREE.Color('#79994d'), cs = new THREE.Color('#e2d1a6'), cw = new THREE.Color('#b29f78'), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = coast - z; let y = d > 0 ? Math.min(d * .15, .9) * 1 : Math.max(d * .12, -3); y += Math.sin(x * .2) * Math.cos(z * .17) * .06; p.setY(i, y - .9 + .9);
      if (d < 0) tmp.copy(cw); else if (d < 4) tmp.copy(cs); else tmp.copy(cs).lerp(cg, clamp((d - 4) / 3, 0, 1)).multiplyScalar(.92 + Math.sin(x * .7 + z * .4) * .06);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
    tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.computeVertexNormals();
    const ground = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); ground.receiveShadow = true; root.add(ground);
    const gy = Math.min(Math.max(coast, 0) * .15, .9);
    if (coast < 200) { water = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 120, 120), createWaterMaterial({ local: true, coast })); water.rotation.x = -Math.PI / 2; water.position.y = .05; root.add(water); } else water = null;
    // cabaña
    cot = buildCottage(c, DIMS[c.layout], { interior: true }); cot.position.y = gy - .05; root.add(cot);
    cot.traverse(o => { if (o.isMesh) { o.receiveShadow = true; } });
    const [W, D] = DIMS[c.layout];
    // camino de grava hasta la entrada
    const path = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 14), MAT.gravel); path.rotation.x = -Math.PI / 2; path.position.set(-W * .1, gy + .03, D / 2 + 9); root.add(path);
    // vegetación cercana
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
    const inst = (geo, mat, list, colors) => { const m = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((it, i) => { v.set(it[0], it[1], it[2]); q.setFromEuler(new THREE.Euler(it[5] || 0, it[3], 0)); s.setScalar(it[4]); m4.compose(v, q, s); m.setMatrixAt(i, m4); if (colors) m.setColorAt(i, new THREE.Color(colors[i % colors.length])); }); m.castShadow = true; m.receiveShadow = true; root.add(m); return m; };
    const okSpot = (x, z) => !(Math.abs(x) < W / 2 + 2.2 && z > -D / 2 - 2.5 && z < D / 2 + (c.porch === 'detached' ? 10 : 5)) && !(Math.abs(x + W * .1) < 1.6 && z > 0 && z < 18) && (coast - z) > 2;
    const pick = (n, fn) => { const out = []; let k = 0; while (out.length < n && k++ < n * 40) { const it = fn(); if (okSpot(it[0], it[2])) out.push(it); } return out; };
    const yAt = (z) => { const d = coast - z; return d > 0 ? Math.min(d * .15, .9) : 0; };
    inst(palmGeo(c.n), MAT.palm, [[W / 2 + 3, yAt(D / 2 + 3), D / 2 + 3, 1, 1], [-W / 2 - 3.5, yAt(-1), -1, 2, .9], ...pick(5, () => { const x = (r() - .5) * 46, z = (r() - .5) * 46; return [x, yAt(z), z, r() * 6, .8 + r() * .4]; })]);
    inst(oakGeo(c.n + 3), MAT.veg, pick(3, () => { const a = r() * 6.28, d = 16 + r() * 14; const x = Math.cos(a) * d, z = Math.sin(a) * d - 8; return [x, yAt(z) - .2, z, r() * 6, .8 + r() * .3]; }));
    const sh = []; for (let i = 0; i < 8; i++) { const sd = i % 2 ? 1 : -1; const z = -D / 2 + .8 + (i >> 1) * (D / 4); sh.push([sd * (W / 2 + 1), yAt(z), z, r() * 6, .55 + r() * .3]); }
    pick(26, () => { const x = (r() - .5) * 50, z = (r() - .5) * 50; return [x, yAt(z), z, r() * 6, .6 + r() * .7]; }).forEach(x => sh.push(x));
    inst(shrubGeo(c.n, '#55753a'), MAT.veg, sh, ['#ffffff', '#d8e6b8']);
    inst(palmettoGeo(c.n), MAT.palm, pick(18, () => { const x = (r() - .5) * 40, z = (r() - .5) * 40; return [x, yAt(z), z, r() * 6, .8 + r() * .5]; }));
    inst(grassGeo(), MAT.grass, pick(LOW ? 300 : 900, () => { const x = (r() - .5) * 70, z = coast - 1 - r() * 6; return [x, yAt(z) - .05, z, r() * 6, .8 + r() * .8]; }), ['#ffffff', '#dad7a8']);
    const fl = []; for (let i = 0; i < 90; i++) { const sd = r() < .5 ? -1 : 1; const z = -D / 2 + r() * D; fl.push([sd * (W / 2 + .5 + r() * 1.4), yAt(z), z, r() * 6, .8 + r() * .5]); }
    pick(120, () => { const x = (r() - .5) * 36, z = (r() - .5) * 36; return [x, yAt(z), z, r() * 6, .8 + r() * .5]; }).forEach(x => fl.push(x));
    inst(flowerGeo(), MAT.flower, fl, ['#ff7a6b', '#ffd166', '#f7a8c8', '#ffffff', '#c58bff']);
    // utilería exterior
    grill(root, W / 2 + 2.2, gy, D / 2 + 1, c.n % 2 === 0);
    if (c.view !== 'water') tableUmbrella(root, -W / 2 - 4, gy, D / 2 + 5, '#2fb3b0');
    else { adirondack('#2fb3b0', root, -2, yAt(coast - 3), coast - 3, Math.PI); adirondack('#f1dd8f', root, -.8, yAt(coast - 3), coast - 3, Math.PI + .2); }
    bike(root, -W / 2 - 1.2, gy, D / 2 + 2.4, .3, c.accent);
    const glowPts = []; lampPost(root, -W / 2 - 2.6, gy, D / 2 + 7, glowPts);
    const gp = [...glowPts.flatMap(v => [v.x, v.y, v.z])]; cot.updateMatrixWorld(true); const sp = []; cot.userData.lightPts.forEach(p => { const w = cot.localToWorld(p.clone()); sp.push(w.x, w.y, w.z); }); const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); root.add(new THREE.Points(sg, glowSmall));
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); root.add(new THREE.Points(gg, glowMat));
    cot.traverse(o => { if (o.isMesh && o.castShadow === undefined) o.castShadow = true; });
    setMode('out', true); setHour(hour);
  }

  // ---- animación de tejado / puerta ----
  function tweenTo(obj, key, to, dur = 900) { pushA({ obj, key, from: obj[key], to, s: performance.now(), d: reduced ? 1 : dur }); }
  function roofOff(v) {
    const roof = cot.userData.roof, u = cot.userData, y0 = u.F + u.H, now = performance.now(), d = reduced ? 1 : 1200;
    if (!v) roof.visible = true;
    u.porchRoofs.forEach(pr => pushA({ obj: pr.position, key: 'y', from: pr.position.y, to: v ? 9 : 0, s: now, d, end: () => { pr.visible = !v; } })); if (!v) u.porchRoofs.forEach(pr => pr.visible = true);
    pushA({ obj: roof.position, key: 'y', from: roof.position.y, to: v ? y0 + 2.6 : y0, s: now, d });
    pushA({ obj: roof.position, key: 'x', from: roof.position.x, to: v ? -(u.W + 7) : 0, s: now, d, end: () => { roof.visible = !v; } });
  }
  function doorOpen(v) { tweenTo(cot.userData.door.rotation, 'y', v ? -1.75 : 0, 1000); }

  let fly = null;
  function flyTo(pos, target, dur = 1.6, done) { fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, s: performance.now(), d: (reduced ? .01 : dur) * 1000, done }; }
  const local = (x, y, z) => cot.localToWorld(new THREE.Vector3(x, y, z));

  function tourStops() {
    const u = cot.userData, st = u.interior.stops, eye = u.F + 1.6, D = u.D, W = u.W;
    const pz = current.porch === 'detached' ? D / 2 + 7 : D / 2 + 1.3;
    return [
      { key: 'Exterior', text: 'Fachada, jardín y acceso a la cabaña', pos: local(W * .6, 3.2, D / 2 + 10), look: local(0, 2, 0) },
      { key: 'Entrada', text: 'Porche de entrada y puerta principal', pos: local(u.dx + 1.4, eye + .3, D / 2 + 5.2), look: local(u.dx, eye - .5, D / 2 - 1) },
      { key: 'Sala', text: 'Sala de estar con ventilador de techo', pos: local(st.living[0] - .2, eye, st.living[1] + .3), look: local(st.living[0] - 3, eye - .5, st.living[1] - 2.5) },
      { key: 'Cocina', text: 'Cocina equipada: estufa, horno, refrigerador y cafetera', pos: local(st.kitchen[0], eye, st.kitchen[1] + 1.6), look: local(st.kitchen[0], eye - .6, -D / 2) },
      { key: 'Dormitorio', text: 'Dormitorio con ropa de cama y lámparas de lectura', pos: local(st.bed[0] + .9, eye, st.bed[1] + .6), look: local(st.bed[0] - .6, eye - 1, st.bed[1] - 1.6) },
      { key: current.porch === 'deck' ? 'Terraza' : 'Porche', text: current.view === 'water' ? 'Porche frente al agua para ver el amanecer' : 'Terraza para las tardes al aire libre', pos: local(-W * .1, eye, pz - .2), look: local(-W * .1, eye - .4, pz + 12) }
    ];
  }

  function setMode(m, instant) {
    mode = m; tour && clearInterval(tour.timer); tour = null; listeners.tour(null);
    const u = cot.userData, fans = u.interior.fans;
    if (m === 'out') {
      controls.enabled = true; controls.autoRotate = !reduced; controls.minDistance = 7; controls.maxDistance = 34; controls.maxPolarAngle = 1.45;
      roofOff(false); doorOpen(false);
      const pos = local(u.W * 1.7, 6.5, u.D / 2 + 13), tg = local(0, 2, 1);
      instant ? (camera.position.copy(pos), controls.target.copy(tg)) : flyTo(pos, tg);
    } else if (m === 'in') {
      controls.enabled = true; controls.autoRotate = false; controls.minDistance = 4; controls.maxDistance = 22; controls.maxPolarAngle = 1.2;
      roofOff(true); doorOpen(true);
      flyTo(local(u.W * .45, 12.5, u.D * 1.25), local(0, u.F, .6));
    } else if (m === 'walk') {
      controls.enabled = false; controls.autoRotate = false; roofOff(false); doorOpen(true);
      const stops = tourStops(); tour = { stops, i: -1 };
      const go = i => { tour.i = (i + stops.length) % stops.length; const s = stops[tour.i]; flyTo(s.pos, s.look, 2.4); listeners.tour({ i: tour.i, n: stops.length, ...s }); };
      tour.go = go; go(0);
      tour.timer = setInterval(() => !tour.paused && go(tour.i + 1), 6500);
    }
    setHour(hour);
  }

  const listeners = { tour: () => {} };
  const clock = new THREE.Clock(); let running = false, raf = 0;
  const look = new THREE.Vector2(); canvas.addEventListener('pointermove', e => { const b = canvas.getBoundingClientRect(); look.set((e.clientX - b.left) / b.width - .5, (e.clientY - b.top) / b.height - .5); });
  canvas.addEventListener('pointerdown', () => { controls.autoRotate = false; });
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); post.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(canvas);
  const tmpT = new THREE.Vector3();
  function frame() {
    raf = requestAnimationFrame(frame); if (!running) return;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime; wind.uTime.value = reduced ? t * .3 : t + 1000;
    const now = performance.now();
    anim = anim.filter(a => { const k = clamp((now - a.s) / a.d, 0, 1); a.obj[a.key] = a.from + (a.to - a.from) * ease(k); if (k >= 1) { a.end && a.end(); return false; } return true; });
    if (fly) { const k = clamp((now - fly.s) / fly.d, 0, 1), e = ease(k); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); if (k >= 1) { const d = fly.done; fly = null; d && d(); } }
    if (cot) { cot.userData.interior.fans.forEach(f => f.rotation.y += dt * (reduced ? 1 : 5)); cot.userData.rotors.forEach(f => f.rotation.y += dt * (reduced ? .6 : 2.5)); }
    if (mode === 'walk') { tmpT.copy(controls.target); camera.lookAt(tmpT.x + look.x * 2.5, tmpT.y - look.y * 1.2, tmpT.z); }
    else controls.update();
    post.render();
  }
  return {
    load(c) { build(c); resize(); },
    setMode, setHour, getMode: () => mode,
    tourNext() { tour && tour.go(tour.i + 1); }, tourPrev() { tour && tour.go(tour.i - 1); }, tourGo(i) { tour && tour.go(i); }, tourPause(v) { if (tour) tour.paused = v; },
    on(ev, fn) { listeners[ev] = fn; },
    start() { running = true; clock.getDelta(); resize(); if (!raf) frame(); },
    stop() { running = false; tour && clearInterval(tour.timer); }
  };
}

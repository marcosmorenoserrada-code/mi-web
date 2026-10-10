// Escena principal: Pirates Cove como destino completo.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  rng, clamp, smooth, ease, wind, landD, terrainH, coastX, ISLETS, initMaterials, MAT, TEX, cmat,
  palmGeo, oakGeo, pineGeo, cedarGeo, shrubGeo, palmettoGeo, grassGeo, flowerGeo,
  createSky, createWaterMaterial, sampleTOD, applyTOD,
  adirondack, tableUmbrella, grill, lampPost, bike, golfCart, kayak, flag, sign
} from './world.js';
import { COTTAGES, DIMS } from './data.js';
import { buildCottage, bakeStatic } from './cottage.js';
import { createPost, createSkyEnv, groundDetail, worldUV } from './post.js';

export function createScene(canvas, { quality = 'high', reduced = false, onProgress = () => {} } = {}) {
  const LOW = quality === 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !LOW; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#e9d3b5', .0028);
  const camera = new THREE.PerspectiveCamera(40, 1, .5, 4000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .06; controls.minDistance = 14; controls.maxDistance = 230;
  controls.maxPolarAngle = 1.36; controls.target.set(4, 1, 2); controls.enablePan = true; controls.screenSpacePanning = false;
  controls.rotateSpeed = .5; controls.zoomSpeed = .8;

  initMaterials();
  const sky = createSky(); scene.add(sky);
  const hemi = new THREE.HemisphereLight('#cfe6ff', '#6a7a4c', 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff', 2.5); sun.castShadow = !LOW;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -62; sc.right = 62; sc.top = 62; sc.bottom = -62; sc.near = 1; sc.far = 400;
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; scene.add(sun, sun.target);
  onProgress(.15, 'Modelando el terreno y la costa');

  /* ---- terreno ---- */
  const R = 420, N = LOW ? 150 : 230;
  const tg = new THREE.PlaneGeometry(2, 2, N, N); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position, cols = new Float32Array(tp.count * 3);
  const cGrass = new THREE.Color('#6f8f4a'), cGrass2 = new THREE.Color('#87a157'), cLawn = new THREE.Color('#82a858'), cSand = new THREE.Color('#e2d1a6'), cWet = new THREE.Color('#b9a57c'), cMud = new THREE.Color('#5e6a4a'), tmp = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const u = tp.getX(i), v = tp.getZ(i);
    const x = Math.sign(u) * Math.pow(Math.abs(u), 1.7) * R + 10, z = Math.sign(v) * Math.pow(Math.abs(v), 1.7) * R;
    const y = terrainH(x, z); tp.setXYZ(i, x, y, z);
    const d = landD(x, z), n = Math.sin(x * .3) * Math.cos(z * .27) * .5 + .5;
    if (d < 0) tmp.copy(cWet).lerp(cMud, smooth(0, -8, d));
    else if (d < 3.5) tmp.copy(cSand);
    else if (d < 6.5) tmp.copy(cSand).lerp(cGrass, smooth(3.5, 6.5, d));
    else { tmp.copy(cGrass).lerp(cGrass2, n * .6); const r = Math.hypot(x - 1, z - 2); if (r < 17) tmp.lerp(cLawn, smooth(17, 11, r)); }
    const isl = ISLETS.some(([ix, iz, rr]) => Math.hypot(x - ix, (z - iz) * 1.3) < rr + 2);
    if (isl && d > 0) tmp.copy(cMud).lerp(cGrass, .3);
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals(); worldUV(tg, .22);
  const gd = groundDetail(); const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97, map: gd.map, normalMap: gd.normalMap, normalScale: new THREE.Vector2(.7, .7) }); terrainMat.color.setScalar(1.25);
  const terrain = new THREE.Mesh(tg, terrainMat);
  terrain.receiveShadow = true; scene.add(terrain);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, LOW ? 120 : 200, LOW ? 120 : 200), createWaterMaterial());
  water.rotation.x = -Math.PI / 2; water.position.y = .02; scene.add(water);

  /* ---- carretera, caminos, estacionamiento ---- */
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 640), new THREE.MeshStandardMaterial({ map: TEX.road, roughness: .9 }));
  road.rotation.x = -Math.PI / 2; road.position.set(-47, terrainH(-47, 0) + .06, 0); road.receiveShadow = true; scene.add(road);
  const ribbon = (pts, w) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const S = Math.max(8, Math.floor(curve.getLength() / 1.2)), pos = [], uv = [], idx = [];
    for (let i = 0; i <= S; i++) {
      const p = curve.getPoint(i / S), tn = curve.getTangent(i / S), nx = -tn.z, nz = tn.x;
      for (const s of [-1, 1]) { const x = p.x + nx * w / 2 * s, z = p.z + nz * w / 2 * s; pos.push(x, terrainH(x, z) + .05, z); uv.push(s < 0 ? 0 : 1, i * .4); }
      if (i < S) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, MAT.gravel); m.receiveShadow = true; scene.add(m); return curve;
  };
  // eje principal: carretera → patio → muelle
  ribbon([[-44, -6], [-32, -5], [-20, -9], [-6, -6], [6, -3], [18, -3], [27, -3.5]], 2.4);
  ribbon([[0, -5], [-8, 6], [-6, 16], [0, 21]], 1.8);
  COTTAGES.forEach(c => { const [x, z] = c.pos, [fx, fz] = c.face, a = Math.atan2(fx - x, fz - z); const fd = DIMS[c.layout][1] / 2 + (c.porch === 'detached' ? 1 : 3.2); const ex = x + Math.sin(a) * fd, ez = z + Math.cos(a) * fd; ribbon([[ex, ez], [(ex + 2) * .7, (ez - 2) * .7], [2, -4]], 1.3); });
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(14, 22), MAT.gravel); lot.rotation.x = -Math.PI / 2; lot.position.set(-35, terrainH(-35, -18) + .05, -20); lot.receiveShadow = true; scene.add(lot);
  onProgress(.3, 'Construyendo las nueve cabañas');

  /* ---- cabañas ---- */
  const cottages = [], hitBoxes = [];
  COTTAGES.forEach(c => {
    const dims = DIMS[c.layout]; const g = buildCottage(c, dims);
    const [x, z] = c.pos, [fx, fz] = c.face; const a = Math.atan2(fx - x, fz - z);
    g.position.set(x, terrainH(x, z) - .05, z); g.rotation.y = a;
    scene.add(g); bakeStatic(g);
    g.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow && !LOW; o.receiveShadow = true; } });
    const hb = new THREE.Mesh(new THREE.BoxGeometry(dims[0] + 1, 5, dims[1] + 4), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.set(0, 2.5, 1); hb.userData.idx = cottages.length; g.add(hb); hitBoxes.push(hb);
    const front = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    cottages.push({ c, g, a, front, center: new THREE.Vector3(x, g.position.y + 2, z), top: new THREE.Vector3(x, g.position.y + 6.4, z) });
  });

  /* ---- muelle ---- */
  const dock = new THREE.Group(); scene.add(dock);
  const dz = -3.5, dx0 = coastX(dz) - 4, dx1 = 66;
  const dl = dx1 - dx0;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(dl, .16, 2.4), MAT.dockWood); deck.position.set((dx0 + dx1) / 2, 1.25, dz); deck.castShadow = deck.receiveShadow = true; dock.add(deck);
  const tee = new THREE.Mesh(new THREE.BoxGeometry(5, .16, 11), MAT.dockWood); tee.position.set(dx1 + 2.5, 1.25, dz); tee.castShadow = tee.receiveShadow = true; dock.add(tee);
  const pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .16, 4.4, 7), MAT.piling, 80); let pn = 0; const m4 = new THREE.Matrix4();
  for (let x = dx0 + 2; x <= dx1; x += 3) for (const s of [-1.15, 1.15]) { m4.makeTranslation(x, -.6, dz + s); pil.setMatrixAt(pn++, m4); }
  for (const [px, pz] of [[dx1 + .2, dz - 5.3], [dx1 + .2, dz + 5.3], [dx1 + 4.8, dz - 5.3], [dx1 + 4.8, dz + 5.3], [dx1 + 4.8, dz]]) { m4.makeTranslation(px, -.4, pz); pil.setMatrixAt(pn++, m4); }
  pil.count = pn; pil.castShadow = true; dock.add(pil);
  const rail = (x0, x1, z) => { const r = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .08, .1), MAT.dockWood); r.position.set((x0 + x1) / 2, 2.15, z); dock.add(r); };
  rail(dx0 + 3, dx1, dz - 1.15); rail(dx0 + 3, dx1, dz + 1.15);
  adirondack('#2fb3b0', dock, dx1 + 3, 1.33, dz - 3, -Math.PI / 2 - .3); adirondack('#f2b49b', dock, dx1 + 3, 1.33, dz + 3, -Math.PI / 2 + .3); adirondack('#f1dd8f', dock, dx1 + 3.6, 1.33, dz, -Math.PI / 2);
  const glowPts = [];
  [dx0 + 10, dx0 + 22, dx1 - 1].forEach(x => lampPost(dock, x, 1.3, dz + 1.3, glowPts));
  const flagFn = flag(scene, 26, terrainH(26, 4), 4);

  /* ---- patio central y utilería ---- */
  const Y = (x, z) => terrainH(x, z);
  tableUmbrella(scene, -2, Y(-2, 4), 4, '#2fb3b0'); tableUmbrella(scene, 5, Y(5, 9), 9, '#36a3c9'); tableUmbrella(scene, 8, Y(8, -10), -10, '#2fb3b0');
  const chairCols = ['#2fb3b0', '#f1dd8f', '#f2b49b', '#c6b8de', '#9cc7dc', '#a9c792'];
  [[2, -12, .4], [3.5, -12.5, -.2], [-8, 8, 2.2], [-9, 9.5, 2.5], [12, 14, -2], [13.5, 13, -2.3]].forEach(([x, z, r], i) => adirondack(chairCols[i % 6], scene, x, Y(x, z), z, r));
  // fogata
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1, .4, 14, 1, true), cmat('#8a7f72', { side: THREE.DoubleSide })); pit.position.set(10, Y(10, 0) + .2, 0); scene.add(pit);
  const fire = new THREE.PointLight('#ff9a4a', 0, 14, 1.8); fire.position.set(10, Y(10, 0) + 1, 0); scene.add(fire);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.4, 1, 7), new THREE.MeshBasicMaterial({ color: '#ffae4a', transparent: true, opacity: .0 })); flame.position.set(10, Y(10, 0) + .7, 0); scene.add(flame);
  [[6, 1.6, 2.6], [12.6, -1.2, -1.2], [8.4, -2.2, 0.4]].forEach(([x, z, r]) => adirondack('#f5f3ee', scene, x, Y(x, z), z, r + Math.PI));
  grill(scene, -10, Y(-10, -11), -11, true); grill(scene, 11, Y(11, 21), 21, false); grill(scene, 9, Y(9, -18), -18, false);
  for (let i = 0; i < 4; i++) bike(scene, -30 + i * .9, Y(-30, -7), -8.5, Math.PI / 2, ['#2fb3b0', '#f2b49b', '#f1dd8f', '#9cc7dc'][i]);
  golfCart(scene, -36, Y(-36, -26), -26, Math.PI / 2); golfCart(scene, -33, Y(-33, -26), -26, Math.PI / 2, '#e7f2f1'); golfCart(scene, -38, Y(-38, -12), -12, .2, '#f1dd8f');
  // remolque de bote
  const trailer = new THREE.Group(); scene.add(trailer); trailer.position.set(-36, Y(-36, -16), -16);
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), cmat('#f4f2ec')); hull.scale.set(3, 1, 1.1); hull.rotation.x = Math.PI; hull.position.y = 1.5; trailer.add(hull);
  sign(scene, -42, Y(-42, -12), -12, Math.PI / 2);
  for (let i = 0; i < 3; i++) kayak(scene, 27 + i * .2, Y(27, 12 + i * 1.2) + .3, 12 + i * 1.2, .2, ['#f2b49b', '#f1dd8f', '#2fb3b0'][i]);
  [[-4, -10], [8, 17], [-10, 18], [14, -16], [-22, -12], [-28, 2]].forEach(([x, z]) => lampPost(scene, x, Y(x, z), z, glowPts));
  onProgress(.5, 'Plantando palmeras, robles y vegetación nativa');

  /* ---- vegetación (instanciada) ---- */
  const avoid = [];
  cottages.forEach(({ c }) => { const d = DIMS[c.layout]; avoid.push([c.pos[0], c.pos[1], Math.max(d[0], d[1]) * .75 + 2.5]); });
  avoid.push([2, 2, 9], [10, 0, 3], [-35, -20, 13], [-47, 0, 0]);
  const free = (x, z, pad = 0) => !avoid.some(([ax, az, r]) => Math.hypot(x - ax, z - az) < r + pad) && Math.abs(x + 47) > 6 && !(Math.abs(z - dz) < 3 && x > -46 && x < 32) && !(Math.abs(z + 5.5) < 2.4 && x < 30);
  const r = rng(42);
  const inst = (geo, mat, list, { shadow = true, colorize } = {}) => {
    const m = new THREE.InstancedMesh(geo, mat, list.length), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    list.forEach((it, i) => { p.set(it[0], it[1], it[2]); e.set(it[5] || 0, it[3], it[6] || 0); q.setFromEuler(e); s.setScalar(it[4]); m4.compose(p, q, s); m.setMatrixAt(i, m4); if (colorize) { m.setColorAt(i, col.set(colorize(i))); } });
    m.castShadow = shadow && !LOW; m.receiveShadow = true; scene.add(m); return m;
  };
  const scatter = (count, test, fn, tries = 30) => { const out = []; for (let i = 0; i < count; i++) for (let k = 0; k < tries; k++) { const it = fn(); if (test(it)) { out.push(it); break; } } return out; };
  // palmas: alrededor del patio, junto a la costa y en grupos
  const palms = [];
  const palmSpots = [[-4, -1], [6, 6], [-2, 12], [12, -6], [24, -16], [25, -6], [26, 10], [24, 22], [10, 30], [-12, 24], [-22, 6], [-24, -14], [-8, -22], [6, -24], [27, -29], [22, 30], [-30, 12], [-40, -3], [-40, -24], [28, 16]];
  palmSpots.forEach(([x, z], i) => palms.push([x + (r() - .5), Y(x, z) - .1, z + (r() - .5), r() * 6.28, .85 + r() * .35]));
  scatter(LOW ? 30 : 60, ([x, , z]) => landD(x, z) > 2 && landD(x, z) < 26 && free(x, z, 1), () => { const z = (r() - .5) * 200, x = coastX(z) - 3 - r() * 22; return [x, Y(x, z) - .1, z, r() * 6.28, .8 + r() * .4]; }).forEach(p => palms.push(p));
  const palmGeos = [palmGeo(1), palmGeo(2), palmGeo(3)];
  palmGeos.forEach((geo, k) => inst(geo, MAT.palm, palms.filter((_, i) => i % 3 === k)));
  // robles vivos con musgo
  const oaks = [[-6, 3, 1.15], [9, 12, 1.0], [-11, -9, 1.05], [14, -12, .9], [-28, 18, 1.2], [-26, -30, 1.1], [0, -30, 1], [-14, 32, 1.1]].map(([x, z, s]) => [x, Y(x, z) - .2, z, r() * 6.28, s]);
  scatter(LOW ? 40 : 90, ([x, , z]) => free(x, z, 4) && landD(x, z) > 12, () => { const x = -40 - r() * 150 + (r() < .3 ? 60 : 0), z = (r() - .5) * 360; return [x, Y(x, z) - .2, z, r() * 6.28, .8 + r() * .5]; }).forEach(o => oaks.push(o));
  const oakG = [oakGeo(5), oakGeo(9)]; oakG.forEach((geo, k) => inst(geo, MAT.veg, oaks.filter((_, i) => i % 2 === k)));
  // pinos y cedros (bosque continental)
  const pines = scatter(LOW ? 120 : 260, ([x, , z]) => (x < -52 || Math.abs(z) > 48) && landD(x, z) > 8 && Math.abs(x + 47) > 7 && free(x, z), () => { const x = 30 - r() * 380, z = (r() - .5) * 600; return [x, Y(x, z), z, r() * 6.28, .8 + r() * .5]; });
  [pineGeo(3), pineGeo(8)].forEach((geo, k) => inst(geo, MAT.veg, pines.filter((_, i) => i % 2 === k), { shadow: false }));
  const cedars = scatter(LOW ? 40 : 90, ([x, , z]) => landD(x, z) > 6 && free(x, z, 1) && (x < -30 || Math.abs(z) > 34), () => { const x = 28 - r() * 140, z = (r() - .5) * 220; return [x, Y(x, z), z, r() * 6.28, .7 + r() * .5]; });
  inst(cedarGeo(4), MAT.veg, cedars);
  // arbustos, palmitos y flores
  const shrubs = scatter(LOW ? 140 : 300, ([x, , z]) => landD(x, z) > 3 && free(x, z, -.5), () => { const a = r() * 6.28, d = 6 + r() * 60; const x = Math.cos(a) * d + 2, z = Math.sin(a) * d; return [x, Y(x, z) - .1, z, r() * 6.28, .7 + r() * .8]; });
  // arbustos junto a las fachadas de cada cabaña
  cottages.forEach(({ c, a }) => { const [W, D] = DIMS[c.layout]; for (let i = 0; i < 6; i++) { const lx = (i % 2 ? 1 : -1) * (W / 2 + .9), lz = -D / 2 + 1 + (i >> 1) * (D / 3); const x = c.pos[0] + Math.cos(a) * lx + Math.sin(a) * lz, z = c.pos[1] - Math.sin(a) * lx + Math.cos(a) * lz; shrubs.push([x, Y(x, z) - .1, z, r() * 6, .6 + r() * .4]); } });
  inst(shrubGeo(2, '#4f6f37'), MAT.veg, shrubs.filter((_, i) => i % 2 === 0), { colorize: () => ['#ffffff', '#d6e8b8', '#c9dcae'][Math.floor(r() * 3)] });
  inst(shrubGeo(6, '#5e7d3e'), MAT.veg, shrubs.filter((_, i) => i % 2 === 1), { colorize: () => ['#ffffff', '#e8f0c8'][Math.floor(r() * 2)] });
  const palmettos = scatter(LOW ? 80 : 180, ([x, , z]) => landD(x, z) > 2.5 && free(x, z), () => { const z = (r() - .5) * 240, x = coastX(z) - 2 - r() * 70; return [x, Y(x, z), z, r() * 6.28, .8 + r() * .7]; });
  inst(palmettoGeo(3), MAT.palm, palmettos);
  // pastos de duna junto a la orilla
  const grass = scatter(LOW ? 900 : 2400, ([x, , z]) => { const d = landD(x, z); return d > .4 && d < 7 && free(x, z); }, () => { const z = (r() - .5) * 220, x = coastX(z) - r() * 7; return [x, Y(x, z) - .05, z, r() * 6.28, .7 + r() * .8, (r() - .5) * .4, (r() - .5) * .4]; });
  ISLETS.forEach(([ix, iz, rr]) => { for (let i = 0; i < 120; i++) { const a = r() * 6.28, d = rr * (.75 + r() * .3); const x = ix + Math.cos(a) * d, z = iz + Math.sin(a) * d / 1.3; grass.push([x, Y(x, z), z, r() * 6, 1 + r(), (r() - .5) * .5, 0]); } });
  inst(grassGeo(), MAT.grass, grass, { shadow: false, colorize: () => ['#ffffff', '#d9d8b0', '#c3d39a'][Math.floor(r() * 3)] });
  const flowers = scatter(LOW ? 300 : 800, ([x, , z]) => landD(x, z) > 5 && free(x, z, -1.5), () => { const a = r() * 6.28, d = 4 + r() * 34; const x = Math.cos(a) * d + 2, z = Math.sin(a) * d; return [x, Y(x, z), z, r() * 6, .8 + r() * .6]; });
  inst(flowerGeo(), MAT.flower, flowers, { shadow: false, colorize: () => ['#ff7a6b', '#ffd166', '#f7a8c8', '#ffffff', '#c58bff', '#ff9f43'][Math.floor(r() * 6)] });
  // manglares en los cayos
  const mang = []; ISLETS.forEach(([ix, iz, rr]) => { for (let i = 0; i < rr * 5; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * rr * .95; const x = ix + Math.cos(a) * d, z = iz + Math.sin(a) * d / 1.3; mang.push([x, Y(x, z) - .4, z, r() * 6, 1.6 + r() * 1.6]); } });
  inst(shrubGeo(12, '#2f4a2c'), MAT.veg, mang, { shadow: false });
  onProgress(.68, 'Animando el agua, las aves y el cielo');

  /* ---- luces de guirnalda bajo los robles ---- */
  const strPts = [];
  const strands = [[[-6, 3], [9, 12]], [[-6, 3], [-11, -9]], [[-11, -9], [14, -12]], [[9, 12], [14, -12]], [[-6, 3], [14, -12]]];
  strands.forEach(([[x0, z0], [x1, z1]]) => { for (let i = 0; i <= 26; i++) { const t = i / 26; const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; strPts.push(x, Y(x, z) + 4.6 - Math.sin(t * Math.PI) * 1.4, z); } });
  glowPts.forEach(v => strPts.push(v.x, v.y, v.z));
  cottages.forEach(({ g }) => { g.updateMatrixWorld(true); g.userData.lightPts.forEach(p => { const v = g.localToWorld(p.clone()); strPts.push(v.x, v.y, v.z); }); });
  const strGeo = new THREE.BufferGeometry(); strGeo.setAttribute('position', new THREE.Float32BufferAttribute(strPts, 3));
  const strMat = new THREE.PointsMaterial({ map: TEX.glow, size: 1.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffd59a', opacity: 0 });
  scene.add(new THREE.Points(strGeo, strMat));
  const yard = []; if (!LOW) [[2, 2], [-12, -4], [10, 14], [8, -14]].forEach(([x, z]) => { const l = new THREE.PointLight('#ffc98a', 0, 22, 1.6); l.position.set(x, Y(x, z) + 4, z); scene.add(l); yard.push(l); });

  /* ---- nubes ---- */
  const clouds = [];
  for (let i = 0; i < (LOW ? 10 : 18); i++) {
    const m = new THREE.SpriteMaterial({ map: TEX.cloud, transparent: true, depthWrite: false, fog: false, opacity: .85 });
    const s = new THREE.Sprite(m); const sc2 = 90 + r() * 120; s.scale.set(sc2, sc2 * .45, 1);
    s.position.set(-500 + r() * 1000, 120 + r() * 120, -500 + r() * 1000); s.userData.v = 1.2 + r() * 2; scene.add(s); clouds.push(s);
  }
  /* ---- aves ---- */
  const birds = [];
  const birdGeo = new THREE.BufferGeometry(); birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .3, 0, 0, -.3, -1.1, .1, 0, 0, 0, .3, 0, 0, -.3, 1.1, .1, 0], 3)); birdGeo.computeVertexNormals();
  const birdMat = new THREE.MeshBasicMaterial({ color: '#f4f1ea', side: THREE.DoubleSide });
  const flocks = LOW ? 2 : 4;
  for (let f = 0; f < flocks; f++) {
    const cx = 30 + r() * 80, cz = -60 + r() * 120, rad = 30 + r() * 50, h = 18 + r() * 25, sp = (.08 + r() * .06) * (r() < .5 ? -1 : 1);
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(birdGeo.clone(), birdMat); b.scale.setScalar(.9 + r() * .4); scene.add(b); birds.push({ b, cx, cz, rad: rad + (r() - .5) * 8, h: h + (r() - .5) * 4, sp, ph: r() * 6.28, off: i * .06, flap: 6 + r() * 3 }); }
  }
  // pelícanos rasantes
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(birdGeo.clone(), cmat('#8d8b84', { side: THREE.DoubleSide })); b.scale.set(1.8, 1.4, 1.8); scene.add(b); birds.push({ b, cx: 70, cz: 0, rad: 60 + i * 4, h: 3 + i * .5, sp: .05, ph: i * .3, off: 0, flap: 2.2, glide: true }); }

  /* ---- embarcaciones ---- */
  const boats = [];
  const mkBoat = (sail, color) => {
    const g = new THREE.Group();
    const hg = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hg.scale(4, 1.1, 1.4);
    const h = new THREE.Mesh(hg, cmat('#f6f4ee')); h.rotation.x = 0; h.position.y = .6; g.add(h);
    const deckM = new THREE.Mesh(new THREE.CircleGeometry(1, 16), MAT.deck); deckM.scale.set(4, 1.4, 1); deckM.rotation.x = -Math.PI / 2; deckM.position.y = .62; g.add(deckM);
    box2(g, 1.6, .9, 1.4, cmat(color), -.4, 1.1, 0);
    if (sail) { const mast = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 9, 6), MAT.white); mast.position.set(.4, 5.1, 0); g.add(mast); const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 8); sh.lineTo(-3.4, 0); sh.closePath(); const sm = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: '#fbf7ee', side: THREE.DoubleSide, roughness: .9 })); sm.position.set(.35, 1.2, 0); g.add(sm); g.userData.sail = sm; }
    g.traverse(o => o.isMesh && (o.castShadow = true)); scene.add(g); return g;
  };
  function box2(p, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); p.add(b); return b; }
  boats.push({ g: mkBoat(true, '#e9e3d6'), cx: 150, cz: 30, rx: 70, rz: 50, sp: .012, ph: 0 });
  boats.push({ g: mkBoat(false, '#2f6f8f'), cx: 120, cz: -60, rx: 90, rz: 40, sp: -.02, ph: 2 });
  boats.push({ g: mkBoat(false, '#b4573a'), cx: 200, cz: 90, rx: 60, rz: 70, sp: .015, ph: 4 });
  const moored = mkBoat(false, '#2fb3b0'); moored.position.set(dx1 - 4, 0, dz + 3.6); moored.scale.setScalar(.7);

  /* ---- partículas: polen / bruma y luciérnagas ---- */
  const PN = LOW ? 250 : 600, pp = new Float32Array(PN * 3), pv = [];
  for (let i = 0; i < PN; i++) { pp[i * 3] = (r() - .5) * 120; pp[i * 3 + 1] = 1 + r() * 14; pp[i * 3 + 2] = (r() - .5) * 120; pv.push(r() * 6.28); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pollen = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#fff3d6', size: .18, transparent: true, opacity: .55, depthWrite: false }));
  scene.add(pollen);
  const FN = 140, fp = new Float32Array(FN * 3), fbase = [];
  for (let i = 0; i < FN; i++) { const a = r() * 6.28, d = 5 + r() * 38; const x = Math.cos(a) * d + 2, z = Math.sin(a) * d; fbase.push([x, Y(x, z) + .5 + r() * 2.5, z, r() * 6.28]); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const flyMat = new THREE.PointsMaterial({ map: TEX.glow, color: '#d9ff7a', size: .9, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(fg, flyMat));

  /* ---- selección / resaltado ---- */
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffd28a', transparent: true, opacity: .0, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.25, 64), ringMat); ring.rotation.x = -Math.PI / 2; scene.add(ring);
  const ring2 = ring.clone(); ring2.material = ringMat.clone(); scene.add(ring2);
  let selected = -1, hovered = -1, filterSet = null;

  /* ---- hora del día ---- */
  const post = createPost(renderer, scene, camera, { low: LOW, bloom: .26 }); const skyEnv = createSkyEnv(renderer, scene, sky);
  let hour = 17.3, hourTarget = 17.3, tod = sampleTOD(hour);
  const applyHour = () => {
    tod = sampleTOD(hour); applyTOD(tod, { scene, sky, water, sun, hemi, renderer }); hemi.intensity *= .62; skyEnv.update(tod); post.set(tod);
    sun.position.copy(controls.target).addScaledVector(tod.lightDir, 160); sun.target.position.copy(controls.target);
    strMat.opacity = tod.lights * .95; flyMat.opacity = tod.night * .9; yard.forEach(l => l.intensity = tod.lights * 60);
    fire.intensity = tod.lights * 40; flame.material.opacity = tod.lights * .85;
    pollen.material.opacity = .5 * (1 - tod.night);
    clouds.forEach(c => c.material.color.copy(tod.hz).lerp(new THREE.Color('#ffffff'), .55 - tod.night * .4));
    birdMat.color.set(tod.night > .5 ? '#3a4152' : '#f4f1ea');
  };
  applyHour();

  /* ---- cámara cinematográfica ---- */
  const HOME = { pos: new THREE.Vector3(72, 46, 78), target: new THREE.Vector3(4, 1, 2) };
  let fly = null;
  function flyTo(pos, target, dur = 2.2, done) {
    fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), s: performance.now(), d: (reduced ? .01 : dur) * 1000, done };
    controls.enabled = false;
  }
  camera.position.set(260, 60, 210); controls.target.set(60, 2, 10);
  let intro = true;
  const startIntro = () => flyTo(HOME.pos, HOME.target, 7, () => { intro = false; });
  function cottageView(i) {
    const k = cottages[i], dist = 19 + DIMS[k.c.layout][0];
    const side = new THREE.Vector3(k.front.z, 0, -k.front.x);
    const pos = k.center.clone().addScaledVector(k.front, dist).addScaledVector(side, 6).add(new THREE.Vector3(0, 11, 0));
    return { pos, target: k.center.clone().addScaledVector(k.front, 1.5) };
  }
  function focus(i, dur = 2.4, done) { selected = i; const v = cottageView(i); flyTo(v.pos, v.target, dur, done); }
  function home() { selected = -1; flyTo(HOME.pos, HOME.target, 2.4); }

  /* ---- interacción ---- */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let downAt = null;
  const listeners = { hover: () => {}, select: () => {}, interact: () => {} };
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; if (fly && !intro) { fly = null; controls.enabled = true; } if (intro) { fly = null; intro = false; controls.enabled = true; } listeners.interact(); });
  const pick = e => { const b = canvas.getBoundingClientRect(); mouse.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(mouse, camera); const h = ray.intersectObjects(hitBoxes, false)[0]; return h ? h.object.userData.idx : -1; };
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const i = pick(e); if (i !== hovered) { hovered = i; canvas.style.cursor = i >= 0 ? 'pointer' : 'grab'; listeners.hover(i, e); } else if (i >= 0) listeners.hover(i, e); });
  canvas.addEventListener('pointerleave', () => { hovered = -1; listeners.hover(-1); });
  canvas.addEventListener('pointerup', e => { if (!downAt) return; const m = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]); downAt = null; if (m < 6) { const i = pick(e); if (i >= 0) listeners.select(i); } });

  /* ---- bucle ---- */
  const clock = new THREE.Clock(); let running = true, visible = true, raf = 0, last = 0;
  const pinsOut = new Array(cottages.length).fill(null).map(() => ({ x: 0, y: 0, vis: false }));
  const v3 = new THREE.Vector3();
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); post && post.setSize(w, h); camera.aspect = w / h; camera.fov = w < 700 ? 52 : 40; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(canvas); resize();
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!running || !visible) return;
    const rdt = clock.getDelta(), dt = Math.min(rdt, .05), t = clock.elapsedTime;
    wind.uTime.value = reduced ? t * .3 : t;
    if (Math.abs(hourTarget - hour) > .001) { hour += (hourTarget - hour) * Math.min(1, rdt * 2.5); if (Math.abs(hourTarget - hour) < .01) hour = hourTarget; applyHour(); }
    else if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) { sun.position.copy(controls.target).addScaledVector(tod.lightDir, 160); sun.target.position.copy(controls.target); }
    if (fly) {
      const k = clamp((performance.now() - fly.s) / fly.d, 0, 1), e = ease(k);
      camera.position.lerpVectors(fly.p0, fly.p1, e); camera.position.y += Math.sin(k * Math.PI) * (fly.p0.distanceTo(fly.p1) * .08);
      controls.target.lerpVectors(fly.t0, fly.t1, e);
      if (k >= 1) { const d = fly.done; fly = null; controls.enabled = true; d && d(); }
    }
    controls.update();
    // aves
    if (!reduced) birds.forEach(o => { const a = t * o.sp + o.ph + o.off; o.b.position.set(o.cx + Math.cos(a) * o.rad, o.h + Math.sin(t * .7 + o.ph) * 1.5, o.cz + Math.sin(a) * o.rad); o.b.rotation.y = -a + (o.sp > 0 ? 0 : Math.PI); const f = o.glide ? Math.sin(t * o.flap) * .15 : Math.sin(t * o.flap + o.ph) * .55; const p = o.b.geometry.attributes.position; p.setY(2, .1 + f * 1.1); p.setY(5, .1 + f * 1.1); p.needsUpdate = true; });
    // barcos
    boats.forEach(o => { const a = t * o.sp + o.ph; const x = o.cx + Math.cos(a) * o.rx, z = o.cz + Math.sin(a) * o.rz; o.g.position.set(x, Math.sin(t * 1.2 + o.ph) * .15 - .1, z); o.g.rotation.y = -Math.atan2(Math.cos(a) * o.rz * Math.sign(o.sp), -Math.sin(a) * o.rx * Math.sign(o.sp)); o.g.rotation.z = Math.sin(t * .9 + o.ph) * .04; });
    moored.position.y = Math.sin(t * 1.1) * .12 - .15; moored.rotation.z = Math.sin(t * .8) * .03;
    clouds.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 600) c.position.x = -600; });
    // polen
    if (!reduced) { const a = pg.attributes.position; for (let i = 0; i < PN; i++) { a.array[i * 3] += Math.sin(t * .3 + pv[i]) * .01 + .01; a.array[i * 3 + 1] += Math.cos(t * .5 + pv[i]) * .006; if (a.array[i * 3] > 60) a.array[i * 3] = -60; } a.needsUpdate = true; }
    if (tod.night > .05) { const a = fg.attributes.position; for (let i = 0; i < FN; i++) { const [x, y, z, ph] = fbase[i]; a.array[i * 3] = x + Math.sin(t * .4 + ph) * 1.5; a.array[i * 3 + 1] = y + Math.sin(t * .9 + ph * 2) * .5; a.array[i * 3 + 2] = z + Math.cos(t * .35 + ph) * 1.5; } a.needsUpdate = true; flyMat.size = .7 + Math.sin(t * 4) * .2; }
    flagFn(t);
    flame.scale.set(1 + Math.sin(t * 13) * .1, 1 + Math.sin(t * 9) * .2, 1); fire.intensity = tod.lights * (36 + Math.sin(t * 17) * 6);
    // resaltado
    cottages.forEach((k, i) => {
      const on = i === hovered || i === selected, dim = filterSet && !filterSet.has(k.c.n);
      const em = k.g.userData.wallMat.emissive; const target = on ? .22 + Math.sin(t * 3) * .06 : 0;
      k.g.userData.wallMat.emissiveIntensity += (target - k.g.userData.wallMat.emissiveIntensity) * .15; em.set(k.c.color);
      if (dim) { k.g.userData.wallMat.color.set(k.c.color).lerp(new THREE.Color('#9aa39c'), .55); } else k.g.userData.wallMat.color.set(k.c.color);
      v3.copy(k.top); v3.project(camera);
      const o = pinsOut[i]; o.vis = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1; o.x = (v3.x * .5 + .5) * canvas.clientWidth; o.y = (-v3.y * .5 + .5) * canvas.clientHeight; o.dim = !!dim; o.d = camera.position.distanceTo(k.center);
    });
    const si = selected >= 0 ? selected : hovered;
    if (si >= 0) { const k = cottages[si]; const s = DIMS[k.c.layout][1] * .9; ring.position.set(k.center.x, k.center.y - 1.6, k.center.z); ring.scale.setScalar(s + Math.sin(t * 2.4) * .3); ringMat.opacity += (.75 - ringMat.opacity) * .1; const ph = (t * .6) % 1; ring2.position.copy(ring.position); ring2.scale.setScalar(s * (1 + ph * .9)); ring2.material.opacity = (1 - ph) * .5; }
    else { ringMat.opacity *= .9; ring2.material.opacity *= .9; }
    post.render();
    api.onFrame(pinsOut, t);
  }

  const api = {
    renderer, camera, controls, cottages,
    start() { startIntro(); frame(); },
    skipIntro() { if (intro) { fly = null; intro = false; camera.position.copy(HOME.pos); controls.target.copy(HOME.target); controls.enabled = true; } },
    setHour(h, instant) { hourTarget = h; if (instant || reduced) { hour = h; applyHour(); } },
    getHour: () => hour,
    focus, home, flyTo,
    setFilter(set) { filterSet = set; },
    select(i) { selected = i; },
    on(ev, fn) { listeners[ev] = fn; },
    onFrame: () => {},
    pause(v) { running = !v; if (!v) clock.getDelta(); },
    setVisible(v) { visible = v; if (v) clock.getDelta(); },
    setWind(v) { wind.uWind.value = v; },
    snapshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/jpeg', .8); }
  };
  onProgress(.9, 'Últimos detalles de iluminación');
  return api;
}

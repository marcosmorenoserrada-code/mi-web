// Posprocesado cinematográfico, iluminación por entorno (IBL) y texturas de suelo.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uNight: { value: 0 }, uVig: { value: .32 }, uGrain: { value: .035 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uNight,uVig,uGrain; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv = vUv; vec2 c = uv - .5;
      // aberración cromática muy leve en los bordes
      float ca = dot(c,c) * .0035;
      vec3 col = vec3(texture2D(tDiffuse, uv + c*ca).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - c*ca).b);
      float l = dot(col, vec3(.2126,.7152,.0722));
      // gradación: sombras frías, luces cálidas, contraste suave y saturación
      vec3 shadowT = mix(vec3(.96,1.0,1.06), vec3(.9,.97,1.12), uNight);
      vec3 highT = mix(vec3(1.05,1.0,.93), vec3(1.06,.98,.9), uNight);
      col *= mix(shadowT, highT, smoothstep(.15,.85,l));
      col = mix(vec3(l), col, 1.1);
      col = mix(col, col*col*(3.-2.*col), .22);
      // viñeta y grano
      float v = smoothstep(.85, .2, length(c*vec2(1.15,1.)));
      col *= mix(1. - uVig, 1., v);
      col += (h(uv*uRes + fract(uTime)*91.7) - .5) * uGrain;
      gl_FragColor = vec4(clamp(col,0.,1.), 1.);
    }`
};

export function createPost(renderer, scene, camera, { low = false, ao = false, bloom = .32 } = {}) {
  if (low) return { render: () => renderer.render(scene, camera), setSize() {}, set() {}, low: true };
  const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(sz.x, sz.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (ao) {
    try {
      gtao = new GTAOPass(scene, camera, sz.x, sz.y);
      gtao.output = GTAOPass.OUTPUT.Default;
      gtao.updateGtaoMaterial({ radius: .45, distanceExponent: 1.6, thickness: 1.2, scale: 1.15, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      gtao.blendIntensity = .85;
      composer.addPass(gtao);
    } catch (e) { gtao = null; }
  }
  const bp = new UnrealBloomPass(new THREE.Vector2(sz.x / 2, sz.y / 2), bloom, .5, 1.6); composer.addPass(bp);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader); composer.addPass(grade);
  const clock = new THREE.Clock();
  return {
    composer, gtao,
    render() { grade.uniforms.uTime.value = clock.getElapsedTime(); composer.render(); },
    setSize(w, h) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); grade.uniforms.uRes.value.set(w, h); },
    // night: 0..1 → más bloom en farolas/bombillas por la noche
    set({ night = 0, lights = 0 }) { bp.strength = bloom + lights * .55; bp.threshold = 1.6 - lights * .75; bp.radius = .55 + lights * .15; grade.uniforms.uNight.value = night; grade.uniforms.uVig.value = .3 + night * .12; }
  };
}

// Iluminación ambiental basada en el propio cielo (reflejos en tejados metálicos, cristales y agua de cubierta)
export function createSkyEnv(renderer, scene, sky, k = .38) {
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const envMat = sky.material.clone(); const skyClone = new THREE.Mesh(sky.geometry, envMat); env.add(skyClone);
  const groundMat = new THREE.MeshBasicMaterial({ color: '#4c5a36', side: THREE.DoubleSide });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 24), groundMat); ground.rotation.x = -Math.PI / 2; ground.position.y = -8; env.add(ground);
  let rt = null, last = -99;
  return {
    update(tod, force) {
      if (!force && Math.abs(tod.hour - last) < .3) return; last = tod.hour;
      const su = sky.material.uniforms, eu = envMat.uniforms; ['uZenith', 'uHorizon', 'uSunColor'].forEach(k => eu[k].value.copy(su[k].value)); eu.uSunDir.value.copy(su.uSunDir.value); eu.uNight.value = su.uNight.value; eu.uSunColor.value.multiplyScalar(.12);
      groundMat.color.copy(tod.hg).multiplyScalar(.8 * Math.max(.15, tod.hi));
      const nrt = pm.fromScene(env, .035, .1, 3000);
      scene.environment = nrt.texture; rt && rt.dispose(); rt = nrt; envIntensity(scene, k);
    }
  };
}
// Intensidad del entorno aplicada a todos los materiales estándar
export function envIntensity(scene, v) { scene.traverse(o => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { if ('envMapIntensity' in m) m.envMapIntensity = v * (m.userData.envBoost || 1); }); } }); }

// Textura de detalle para césped/arena (multiplicativa, con relieve)
let grassDetail = null;
export function groundDetail() {
  if (grassDetail) return grassDetail;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, S, S);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) { const x = r() * S, y = r() * S, rad = 10 + r() * 40, v = 200 + r() * 55 | 0; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${v},${v},${v},.5)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(ox, oy); g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); g.restore(); } }
  for (let i = 0; i < 4200; i++) { const x = r() * S, y = r() * S, l = 2 + r() * 5, a = -1.2 - r() * .7, v = r() < .5 ? 255 : 150 + r() * 60 | 0; g.strokeStyle = `rgba(${v},${v},${v},${.25 + r() * .35})`; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l * .3, y + Math.sin(a) * l); g.stroke(); }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  // normal
  const d = g.getImageData(0, 0, S, S).data, o = document.createElement('canvas'); o.width = o.height = S; const og = o.getContext('2d'), im = og.createImageData(S, S);
  const H = (x, y) => d[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * 2.2, dy = (H(x, y + 1) - H(x, y - 1)) * 2.2, l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4; im.data[i] = (-dx / l * .5 + .5) * 255; im.data[i + 1] = (dy / l * .5 + .5) * 255; im.data[i + 2] = (1 / l * .5 + .5) * 255; im.data[i + 3] = 255; }
  og.putImageData(im, 0, 0); const n = new THREE.CanvasTexture(o); n.wrapS = n.wrapT = THREE.RepeatWrapping;
  grassDetail = { map, normalMap: n };
  return grassDetail;
}
export function worldUV(geo, scale = .25) { const p = geo.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) * scale; uv[i * 2 + 1] = p.getZ(i) * scale; } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }

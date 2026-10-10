import { COTTAGES, DIMS, VIEW, BOOK_URL, PHONE, PET_FEE, ROOM_AMENITIES, PROPERTY_AMENITIES, PHOTOS, REVIEWS, TOURS } from './data.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 760;
const qParam = new URLSearchParams(location.search).get('q');
const quality = qParam === 'high' || qParam === 'low' ? qParam : (mobile || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4) ? 'low' : 'high';
const byN = n => COTTAGES.findIndex(c => c.n === n);
document.body.classList.add('loading');

/* ================= ICONOS ================= */
const S = (p, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${p}</svg>`;
const I = {
  guests: S('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c2.3.2 4.2 1.8 4.8 4.8"/>'),
  bed: S('<path d="M3 18V7M3 14h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5"/><circle cx="7" cy="11" r="1.8"/>'),
  bath: S('<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/>'),
  view: S('<path d="M2 15c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.4 5-1" class="a-wave"/><path d="M2 19c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.4 5-1"/><circle cx="16" cy="7" r="2.6" class="a-sun"/>'),
  porch: S('<path d="M3 10 12 4l9 6M5 9v11M19 9v11M5 14h14M5 20h14M9 14v6M15 14v6"/>'),
  size: S('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h7v10M11 14h9"/>'),
  check: S('<path d="m5 12 4.5 4.5L19 7"/>'),
  pin: S('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  heart: S('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  phone: S('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
  cal: S('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  wifi: S('<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>', 'a-sig'),
  ac: S('<rect x="3" y="5" width="18" height="8" rx="2"/><path d="M7 16c0 1.5-1 2-1 3.5M12 16c0 1.5-1 2-1 3.5M17 16c0 1.5-1 2-1 3.5" class="a-steam"/>'),
  fan: S('<g class="a-spin"><path d="M12 12c0-4 1-7 3-7s2 3-3 7zM12 12c4 0 7 1 7 3s-3 2-7-3zM12 12c0 4-1 7-3 7s-2-3 3-7zM12 12c-4 0-7-1-7-3s3-2 7 3z"/></g><circle cx="12" cy="12" r="1.2"/>'),
  kitchen: S('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M8 6h.01M12 6h.01M8 13v4"/>'),
  coffee: S('<path d="M4 10h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" class="a-steam"/>'),
  micro: S('<rect x="3" y="5" width="18" height="13" rx="2"/><rect x="6" y="8" width="9" height="7" rx="1"/><path d="M18 9v1M18 12v1"/>'),
  linen: S('<path d="M4 6h16v4H4zM6 10v9M18 10v9M6 15h12"/>'),
  dish: S('<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3"/><path d="M3 4v6M21 4v16M3 10h0"/>'),
  dock: S('<path d="M2 12h20M5 12v8M10 12v8M15 12v8M20 12v8M14 12V6l5-2"/><path d="M19 4v5" class="a-bob"/>'),
  sun: S('<path d="M3 18h18M6 21h12"/><path d="M7 18a5 5 0 0 1 10 0" class="a-sun"/><path d="M12 7V5M5.5 11.5 4 10M18.5 11.5 20 10"/>'),
  paw: S('<g class="a-paw"><circle cx="7" cy="9" r="1.7"/><circle cx="11" cy="6" r="1.7" class="p2"/><circle cx="15" cy="7" r="1.7"/><circle cx="18" cy="11" r="1.7" class="p2"/><path d="M9 16c0-3 2-5 4-5s4 2 4 5-2 3-4 3-4 0-4-3z"/></g>'),
  cart: S('<path d="M4 6h14v3H4zM5 9v7h13V9M18 12h2l1 4h-3"/><circle cx="8" cy="18" r="2" class="a-roll"/><circle cx="16" cy="18" r="2" class="a-roll"/>'),
  grill: S('<path d="M4 10h16a8 8 0 0 1-16 0zM8 18l-2 4M16 18l2 4M12 18v4"/><path d="M12 7c-1-1.5 1-2.5 0-4M8.5 7c-.6-1 .6-1.6 0-2.6M15.5 7c-.6-1 .6-1.6 0-2.6" class="a-flame"/>'),
  boat: S('<path d="M3 16h18l-3 4H6zM12 3v13M12 4l6 9h-6"/><path d="M2 21c2-1 4 1 6 0s4 1 6 0 4 1 6 0" class="a-wave"/>'),
  book: S('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7"/>'),
  leaf: S('<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7"/>'),
  play: S('<path d="M7 5l12 7-12 7z" fill="currentColor"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>')
};

/* ================= ILUSTRACIONES ================= */
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function facade(c, { night = false } = {}) {
  const id = 'f' + c.n + (night ? 'n' : '') + Math.random().toString(36).slice(2, 6);
  const sky1 = night ? '#0d1a33' : '#f6d9ad', sky2 = night ? '#22355e' : '#a9d3e0';
  const water = c.view !== 'court';
  const W = c.layout === 'two' ? 220 : c.layout === 'suite' ? 200 : 176, x0 = 200 - W / 2, wall = c.color, win = night ? '#ffcd7a' : '#365a66';
  const screen = c.porch !== 'deck';
  return `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ilustración de la cabaña ${c.n}">
  <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky2}"/><stop offset="1" stop-color="${sky1}"/></linearGradient>
  <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb062"/><stop offset="1" stop-color="#6b8c46"/></linearGradient>
  <pattern id="${id}p" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${wall}"/><path d="M0 7.4h8" stroke="rgba(0,0,0,.09)"/></pattern></defs>
  <rect width="400" height="250" fill="url(#${id}s)"/>
  ${night ? '<g fill="#fff" opacity=".8"><circle cx="40" cy="30" r="1"/><circle cx="120" cy="18" r="1.2"/><circle cx="300" cy="40" r="1"/><circle cx="350" cy="16" r="1.3"/><circle cx="250" cy="22" r=".9"/></g><circle cx="330" cy="46" r="12" fill="#f4eed8"/>' : '<circle cx="330" cy="70" r="20" fill="#ffe2a8" opacity=".9"/>'}
  ${water ? `<rect y="150" width="400" height="40" fill="${night ? '#16324a' : '#4fb4ad'}"/><path d="M0 160c20-4 40 4 60 0s40 4 60 0 40 4 60 0 40 4 60 0 40 4 60 0 40 4 60 0" stroke="rgba(255,255,255,.5)" fill="none" class="wave-a"/>` : `<path d="M0 160 Q60 120 120 150 T240 140 T400 150 V190 H0z" fill="#5a7a45"/>`}
  <path d="M0 170 Q100 158 200 166 T400 168 V250 H0z" fill="url(#${id}g)"/>
  <g transform="translate(${x0 - 46} 92)"><path d="M14 92 C12 60 16 30 10 0" stroke="#7c6a52" stroke-width="5" fill="none"/>${[0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => `<path d="M10 0 q${Math.cos(a / 57.3) * 22} ${Math.sin(a / 57.3) * 10 - 6} ${Math.cos(a / 57.3) * 36} ${Math.sin(a / 57.3) * 16 + 4}" stroke="#5f7f3c" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}</g>
  <g transform="translate(${x0} 0)">
    <rect x="-4" y="180" width="${W + 8}" height="16" fill="#efe9db"/>
    <path d="M0 110 L${W / 2} 62 L${W} 110 Z" fill="${shade(wall, -.08)}"/>
    <path d="M-12 112 L${W / 2} 58 L${W + 12} 112" fill="none" stroke="${c.roof}" stroke-width="9" stroke-linejoin="round"/>
    <rect x="0" y="108" width="${W}" height="74" fill="url(#${id}p)"/>
    <circle cx="${W / 2}" cy="92" r="11" fill="#0f2a33"/><text x="${W / 2}" y="96.5" text-anchor="middle" font-family="Fraunces,serif" font-size="13" fill="#f6efe2">${c.n}</text>
    <rect x="${W * .12}" y="124" width="30" height="34" fill="${win}" stroke="#fff" stroke-width="4"/><rect x="${W * .12 - 12}" y="122" width="9" height="38" fill="${c.accent}"/><rect x="${W * .12 + 33}" y="122" width="9" height="38" fill="${c.accent}"/>
    <rect x="${W * .58}" y="122" width="26" height="60" fill="${c.accent}" stroke="#fff" stroke-width="3"/><circle cx="${W * .58 + 21}" cy="154" r="2" fill="#fff"/>
    ${W > 190 ? `<rect x="${W * .8}" y="124" width="24" height="30" fill="${win}" stroke="#fff" stroke-width="4"/>` : ''}
    <path d="M-10 132 L${W + 10} 132" stroke="${c.roof}" stroke-width="6"/>
    ${[0, W * .5 - 2, W - 4].map(px => `<rect x="${px}" y="132" width="4" height="52" fill="#fff"/>`).join('')}
    ${screen ? `<rect x="2" y="134" width="${W - 4}" height="48" fill="rgba(20,40,46,.32)"/>` : `<path d="M0 166 H${W}" stroke="#fff" stroke-width="3"/>${Array.from({ length: Math.floor(W / 9) }, (_, i) => `<rect x="${i * 9 + 3}" y="166" width="2" height="16" fill="#fff"/>`).join('')}`}
    <rect x="-6" y="182" width="${W + 12}" height="6" fill="#c9ad86"/>
    ${night ? `<circle cx="${W * .58 - 8}" cy="128" r="10" fill="#ffd28a" opacity=".35"/><circle cx="${W * .58 - 8}" cy="128" r="3" fill="#fff3d0"/>` : ''}
  </g>
  <g transform="translate(${x0 + W + 18} 160)"><ellipse cx="14" cy="22" rx="22" ry="14" fill="#4f6f37"/><ellipse cx="34" cy="26" rx="14" ry="10" fill="#5e7d3e"/><circle cx="6" cy="18" r="2.4" fill="#ff7a6b"/><circle cx="26" cy="16" r="2.4" fill="#ffd166"/><circle cx="36" cy="22" r="2.4" fill="#f7a8c8"/></g>
  <g transform="translate(${x0 - 30} 172)"><ellipse cx="10" cy="12" rx="16" ry="10" fill="#55753a"/><circle cx="4" cy="8" r="2.2" fill="#fff"/><circle cx="14" cy="6" r="2.2" fill="#ffd166"/></g>
  </svg>`;
}
function planSVG(sel = -1, { small = false } = {}) {
  const s = 4.5, X = x => ((x + 56) * s).toFixed(1), Z = z => ((z + 50) * s).toFixed(1);
  const coast = []; for (let z = -52; z <= 54; z += 2) { const x = 31 + 2.5 * Math.sin(z * .07) + 1.5 * Math.sin(z * .17 + 1.3) + Math.sin(z * .031 + 2); coast.push(`${X(x)},${Z(z)}`); }
  const land = `${X(-60)},${Z(-52)} ${coast.join(' ')} ${X(-60)},${Z(54)}`;
  const beach = coast.map(p => p).join(' ');
  const cot = COTTAGES.map((c, i) => {
    const [W, D] = DIMS[c.layout], [x, z] = c.pos, [fx, fz] = c.face, a = Math.atan2(fx - x, fz - z) * 180 / Math.PI;
    const P = c.porch === 'detached' ? 0 : 2.4;
    return `<g class="plan-c${i === sel ? ' on' : ''}" data-i="${i}" transform="translate(${X(x)} ${Z(z)}) rotate(${(-a).toFixed(1)})" tabindex="${small ? -1 : 0}" role="button" aria-label="Cabaña ${c.n}">
      <rect class="body" x="${-W / 2 * s}" y="${-D / 2 * s}" width="${W * s}" height="${D * s}" rx="3" fill="${c.color}" stroke="${i === sel ? '#102229' : '#fff'}" stroke-width="${i === sel ? 3 : 1.5}"/>
      ${P ? `<rect x="${-W / 2 * s}" y="${D / 2 * s}" width="${W * s}" height="${P * s}" fill="#c9ad86" opacity=".9"/>` : `<rect x="${-1.6 * s}" y="${(D / 2 + 4) * s}" width="${3.2 * s}" height="${3 * s}" fill="#c9ad86"/>`}
      <g transform="rotate(${a.toFixed(1)})"><circle r="9" fill="#102229"/><text y="4" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Hanken Grotesk,sans-serif">${c.n}</text></g></g>`;
  }).join('');
  const trees = [[-6, 3], [9, 12], [-11, -9], [14, -12], [-28, 18], [-26, -30], [0, -30], [-14, 32]].map(([x, z]) => `<circle cx="${X(x)}" cy="${Z(z)}" r="${small ? 14 : 18}" fill="#4d6f38" opacity=".55"/>`).join('');
  const palms = [[-4, -1], [6, 6], [-2, 12], [12, -6], [24, -16], [25, -6], [26, 10], [24, 22], [10, 30], [-12, 24], [-22, 6], [-24, -14], [-8, -22], [6, -24], [27, -29]].map(([x, z]) => `<g transform="translate(${X(x)} ${Z(z)})" opacity=".85">${[0, 72, 144, 216, 288].map(r => `<path d="M0 0l7 -3" transform="rotate(${r})" stroke="#3f6a30" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>`).join('');
  const isl = [[82, -48, 15], [108, 22, 19], [70, 64, 10]].map(([x, z, r]) => `<ellipse cx="${X(x)}" cy="${Z(z)}" rx="${r * s}" ry="${r / 1.3 * s}" fill="#4a6a3c"/>`).join('');
  return `<defs><pattern id="wv" width="40" height="16" patternUnits="userSpaceOnUse"><path d="M0 8c5-4 10 4 20 0s15 4 20 0" stroke="rgba(255,255,255,.35)" fill="none"/></pattern></defs>
  <rect width="640" height="460" fill="#5fb3b0"/><rect width="640" height="460" fill="url(#wv)" class="wave-a"/>
  ${isl}
  <polygon points="${land}" fill="#e3d3a8"/>
  <polygon points="${land}" fill="#8fb06a" transform="translate(-14 0)"/>
  <circle cx="${X(1)}" cy="${Z(2)}" r="${16 * s}" fill="#a5c779"/>
  <rect x="${X(-50.5)}" y="0" width="${7 * s}" height="460" fill="#55585a"/><path d="M${X(-47)} 0V460" stroke="#e2c25a" stroke-width="2" stroke-dasharray="14 12"/>
  <text x="${X(-47)}" y="${Z(40)}" transform="rotate(-90 ${X(-47)} ${Z(40)})" font-size="11" fill="#fff" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="Hanken Grotesk,sans-serif">SR 24</text>
  <rect x="${X(-42)}" y="${Z(-31)}" width="${14 * s}" height="${22 * s}" rx="6" fill="#dccfae"/><text x="${X(-35)}" y="${Z(-19)}" font-size="10" text-anchor="middle" fill="#5f6f71" font-weight="700" font-family="Hanken Grotesk,sans-serif">P</text>
  <path d="M${X(-44)} ${Z(-6)} C${X(-30)} ${Z(-5)} ${X(-10)} ${Z(-8)} ${X(6)} ${Z(-3)} S${X(24)} ${Z(-3)} ${X(28)} ${Z(-3.5)}" stroke="#dccfae" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"/>
  <path d="M${X(0)} ${Z(-5)} C${X(-8)} ${Z(6)} ${X(-6)} ${Z(16)} ${X(0)} ${Z(21)}" stroke="#dccfae" stroke-width="${1.8 * s}" fill="none" stroke-linecap="round"/>
  ${trees}
  <rect x="${X(27)}" y="${Z(-4.7)}" width="${(66 - 27) * s}" height="${2.4 * s}" fill="#9b8569"/><rect x="${X(66)}" y="${Z(-9)}" width="${5 * s}" height="${11 * s}" fill="#9b8569"/>
  ${small ? '' : `<text x="${X(56)}" y="${Z(-12)}" font-size="11" fill="#fff" font-weight="700" font-family="Hanken Grotesk,sans-serif" letter-spacing="1.5">MUELLE</text><text x="${X(50)}" y="${Z(40)}" font-size="12" fill="#fff" font-family="Fraunces,serif" font-style="italic">Bahía de Cedar Key</text><text x="${X(1)}" y="${Z(2) - 4}" font-size="10" fill="#36552a" font-weight="700" text-anchor="middle" font-family="Hanken Grotesk,sans-serif" letter-spacing="1.5">PATIO</text>`}
  ${palms}${cot}
  <g transform="translate(600 40)"><circle r="16" fill="rgba(255,255,255,.85)"/><path d="M0 -11 4 2H-4z" fill="#d9603f"/><text y="11" text-anchor="middle" font-size="8" font-weight="700" fill="#102229" font-family="Hanken Grotesk,sans-serif">N</text></g>`;
}
function floorSVG(c) {
  const [W, D] = DIMS[c.layout], s = 34, w = W * s, d = D * s, P = c.porch === 'detached' ? 0 : 2.4 * s, ox = 20, oy = 16;
  const R = (x, y, ww, hh, label, fill = '#fff') => `<rect x="${ox + x * s}" y="${oy + y * s}" width="${ww * s}" height="${hh * s}" fill="${fill}" stroke="#102229" stroke-width="1.5"/><text x="${ox + (x + ww / 2) * s}" y="${oy + (y + hh / 2) * s + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#2b3d42" font-family="Hanken Grotesk,sans-serif">${label}</text>`;
  let rooms = '';
  if (c.layout === 'studio') rooms = R(0, 0, 1.9, 2.1, 'Baño', '#e6f1f2') + R(1.9, 0, W - 1.9, 2.1, 'Cocina', '#f3ead8') + R(0, 2.1, W, D - 2.1, 'Dormitorio · sala', '#fff');
  else if (c.layout === 'suite') rooms = R(0, 0, 2, 2.2, 'Baño', '#e6f1f2') + R(0, 2.2, 3, D - 2.2, 'Dormitorio king', '#f6efe6') + R(3, 0, W - 3, D, 'Cocina · sala · comedor', '#fff') + R(2, 0, 1, 2.2, '', '#fff');
  else rooms = R(0, 0, W / 2 - .6, D / 2 - .4, 'Dormitorio', '#f6efe6') + R(W / 2 - .6, 0, 1.4, 1.8, 'Baño', '#e6f1f2') + R(W / 2 + .8, 0, W / 2 - .8, D / 2 - .4, 'Dormitorio', '#f6efe6') + R(0, D / 2 - .4, W, D / 2 + .4, c.n === 6 ? 'Sala · cocina · cama queen' : 'Sala · cocina · comedor', '#fff');
  const porch = P ? `<rect x="${ox}" y="${oy + d}" width="${w}" height="${P}" fill="#e8d7b9" stroke="#102229" stroke-width="1.5" stroke-dasharray="${c.porch === 'screen' ? '4 3' : '0'}"/><text x="${ox + w / 2}" y="${oy + d + P / 2 + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#2b3d42" font-family="Hanken Grotesk,sans-serif">${c.porch === 'screen' ? 'Porche con mosquitero' : 'Terraza'}</text>`
    : `<rect x="${ox + w / 2 - 50}" y="${oy + d + 40}" width="100" height="60" fill="#e8d7b9" stroke="#102229" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${ox + w / 2}" y="${oy + d + 74}" text-anchor="middle" font-size="10" font-weight="600" fill="#2b3d42" font-family="Hanken Grotesk,sans-serif">Porche independiente</text>`;
  const H = d + (P || 110) + 40;
  return `<svg viewBox="0 0 ${w + 40} ${H}" role="img" aria-label="Plano de distribución ilustrativo">${rooms}${porch}<path d="M${ox + w * .68 - 14} ${oy + d} h28" stroke="#d9603f" stroke-width="4"/><text x="${ox + w * .68}" y="${oy + d - 6}" text-anchor="middle" font-size="9" fill="#d9603f" font-weight="700" font-family="Hanken Grotesk,sans-serif">ENTRADA</text></svg>`;
}

/* ================= UTILIDADES ================= */
const money = v => '$' + v.toLocaleString('es-US');
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); };
const porchLabel = c => c.porch === 'screen' ? 'Porche con mosquitero' : c.porch === 'detached' ? 'Porche independiente' : 'Terraza abierta';
const fitFor = c => c.guests >= 4 ? 'Familias o grupos' : c.guests === 3 ? 'Pareja con un niño' : 'Parejas';
const iso = d => d.toISOString().slice(0, 10);
function bookUrl(ci, co) { return ci && co ? `${BOOK_URL}&checkin=${ci}&checkout=${co}` : BOOK_URL; }

/* ================= ESTADO ================= */
const state = { mapFilter: 'all', compare: new Set(), hero: null, viewer: null, ficha: -1, tour: null, hour: 17.3, webgl: true };
function matchMap(c, f) { return f === 'all' || (f === 'water' && c.view === 'water') || (f === 'screen' && c.porch !== 'deck') || c.tags.includes(f); }

/* ================= NAV ================= */
const nav = $('#nav');
function onScroll() {
  nav.classList.toggle('solid', scrollY > innerHeight * .7);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
$('#menuBtn').addEventListener('click', e => { const o = $('#navLinks').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
$$('#navLinks a').forEach(a => a.addEventListener('click', () => { $('#navLinks').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', false); }));
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('#navLinks a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
['explorar', 'cabanas', 'plano', 'experiencias', 'galeria', 'reservar'].forEach(id => spy.observe(document.getElementById(id)));

/* ================= REVELADO Y CONTADORES ================= */
const rio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; e.target.classList.add('in'); rio.unobserve(e.target);
  $$('[data-count]', e.target).forEach(el => { const to = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', t0 = performance.now();
    const f = now => { const k = Math.min((now - t0) / 1400, 1), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = pre + v.toFixed(dec).replace('.', ','); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
}), { threshold: .2 });
function reveal(sel) { $$(sel).forEach((el, i) => { if (el.classList.contains('rv')) return; el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 80 + 'ms'; rio.observe(el); }); }

/* ================= TARJETAS / LISTA ================= */
const specRow = c => `<div class="specs"><span>${I.guests}${c.guests} huésp.</span><span>${I.bed}${c.bedsLabel}</span><span>${I.bath}${c.bath}</span><span>${I.view}${VIEW[c.view].short}</span></div>`;
function renderCards() {
  const q = $('#q').value.trim().toLowerCase(), g = +$('#fGuests').value, v = $('#fView').value, p = $('#fPorch').value, max = +$('#fPrice').value, sort = $('#fSort').value;
  $('#fPriceOut').textContent = money(max);
  let list = COTTAGES.filter(c => c.guests >= g && (!v || c.view === v) && (!p || (p === 'screen' ? c.porch !== 'deck' : c.porch === 'deck')) && c.price <= max &&
    (!q || [String(c.n), 'cabaña ' + c.n, c.tagline, c.desc, ...c.rooms, VIEW[c.view].label, porchLabel(c)].join(' ').toLowerCase().includes(q)));
  list.sort((a, b) => sort === 'pa' ? a.price - b.price : sort === 'pd' ? b.price - a.price : sort === 'g' ? b.guests - a.guests : a.n - b.n);
  $('#resultCount').textContent = list.length === COTTAGES.length ? `Mostrando las ${list.length} cabañas` : `${list.length} de ${COTTAGES.length} cabañas coinciden`;
  $('#cards').innerHTML = list.length ? list.map((c, k) => `<article class="card" style="animation-delay:${k * 60}ms">
    <div class="card-media" data-open="${c.n}" role="button" tabindex="0" aria-label="Abrir ficha de la cabaña ${c.n}">${facade(c)}
      <div class="card-badges">${c.view === 'water' ? `<span class="badge water">${I.view}Vista al agua</span>` : `<span class="badge">${VIEW[c.view].label}</span>`}${c.porch !== 'deck' ? '<span class="badge">Mosquitero</span>' : ''}</div>
      <label class="cmp-check" onclick="event.stopPropagation()"><input type="checkbox" data-cmp="${c.n}" ${state.compare.has(c.n) ? 'checked' : ''}>Comparar</label></div>
    <div class="card-body"><div class="card-title"><h3>Cabaña ${c.n}</h3><span class="price">${money(c.price)}<small>/noche</small></span></div>
      <p class="card-tag">${c.tagline}</p>${specRow(c)}
      <div class="card-actions"><button class="btn btn-dark btn-sm" data-open="${c.n}">Ver ficha completa</button><button class="btn btn-outline btn-sm" data-map="${c.n}">${I.pin}Ver en el mapa</button></div></div></article>`).join('')
    : `<div class="empty"><h3>Ninguna cabaña coincide</h3><p>Pruebe con menos filtros o un precio máximo mayor.</p><button class="btn btn-outline btn-sm" id="resetF" style="margin-top:14px">Restablecer filtros</button></div>`;
  const rf = $('#resetF'); rf && rf.addEventListener('click', () => { $('#q').value = ''; $('#fGuests').value = 1; $('#fView').value = ''; $('#fPorch').value = ''; $('#fPrice').value = 169; renderCards(); });
}
['#q', '#fGuests', '#fView', '#fPorch', '#fPrice', '#fSort'].forEach(s => $(s).addEventListener('input', renderCards));
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) { openFicha(byN(+o.dataset.open), o); return; }
  const m = e.target.closest('[data-map]'); if (m) { const i = byN(+m.dataset.map); document.getElementById('explorar').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); setTimeout(() => selectOnMap(i), reduced ? 0 : 650); }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card-media,[data-open]')) { e.preventDefault(); openFicha(byN(+e.target.dataset.open), e.target); } });
document.addEventListener('change', e => { if (e.target.matches('[data-cmp]')) toggleCompare(+e.target.dataset.cmp, e.target.checked); });

/* ================= COMPARAR ================= */
function toggleCompare(n, on) {
  if (on && state.compare.size >= 3 && !state.compare.has(n)) { toast('Puede comparar hasta 3 cabañas'); $$(`[data-cmp="${n}"]`).forEach(x => x.checked = false); return; }
  on ? state.compare.add(n) : state.compare.delete(n);
  $$(`[data-cmp="${n}"]`).forEach(x => x.checked = on);
  renderTray(); if (on) toast(`Cabaña ${n} añadida a la comparación`);
}
function renderTray() {
  const t = $('#tray'); t.hidden = state.compare.size === 0;
  $('#trayItems').innerHTML = [...state.compare].map(n => { const c = COTTAGES[byN(n)]; return `<span><i style="background:${c.color}">${n}</i>${money(c.price)}</span>`; }).join('');
  $('#cmpOpen').disabled = state.compare.size < 2; $('#cmpOpen').textContent = state.compare.size < 2 ? 'Elija otra' : `Comparar ${state.compare.size}`;
  const fb = $('#fCmp'); if (fb && state.ficha >= 0) fb.textContent = state.compare.has(COTTAGES[state.ficha].n) ? 'En comparación' : 'Comparar';
}
$('#cmpClear').addEventListener('click', () => { [...state.compare].forEach(n => toggleCompare(n, false)); });
$('#cmpOpen').addEventListener('click', () => {
  const cs = [...state.compare].map(n => COTTAGES[byN(n)]); const minP = Math.min(...cs.map(c => c.price)), maxG = Math.max(...cs.map(c => c.guests));
  const row = (h, f) => `<tr><th>${h}</th>${cs.map(c => `<td>${f(c)}</td>`).join('')}</tr>`;
  $('#cmpTable').innerHTML = `<table><thead><tr><th></th>${cs.map(c => `<td><div style="border-radius:12px;overflow:hidden;margin-bottom:10px">${facade(c)}</div><b>Cabaña ${c.n}</b><span class="muted">${c.tagline}</span></td>`).join('')}</tr></thead><tbody>
    ${row('Precio desde', c => `<span class="${c.price === minP ? 'best' : ''}">${money(c.price)} / noche</span>`)}
    ${row('Huéspedes', c => `<span class="${c.guests === maxG ? 'best' : ''}">Hasta ${c.guests}</span>`)}
    ${row('Dormitorios', c => c.bedsLabel)}${row('Camas', c => c.beddings.join(' + '))}${row('Baño', c => c.bath)}
    ${row('Vista', c => VIEW[c.view].label)}${row('Exterior', porchLabel)}${row('Ideal para', fitFor)}
    ${row('', c => `<div style="display:grid;gap:6px"><button class="btn btn-dark btn-sm" data-open="${c.n}">Ver ficha</button><a class="btn btn-primary btn-sm" href="${BOOK_URL}" target="_blank" rel="noopener">Reservar</a></div>`)}
  </tbody></table>`;
  $('#cmpModal').hidden = false;
});
$('#cmpClose').addEventListener('click', () => $('#cmpModal').hidden = true);
$('#cmpModal').addEventListener('click', e => { if (e.target.id === 'cmpModal') e.currentTarget.hidden = true; if (e.target.closest('[data-open]')) e.currentTarget.hidden = true; });

/* ================= PLANO ================= */
let planSel = -1;
function renderPlan() {
  $('#planSvg').innerHTML = planSVG(planSel);
  $$('.plan-c', $('#planSvg')).forEach(g => { const i = +g.dataset.i; const act = () => { planSel = i; renderPlan(); planDetail(i); }; g.addEventListener('click', act); g.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), act())); });
}
function planDetail(i) {
  const c = COTTAGES[i];
  $('#planDetail').innerHTML = `<div class="fp-anim"><h3>Cabaña ${c.n}</h3><p class="muted">${c.tagline}</p>${specRow(c)}<div class="row"><button class="btn btn-dark btn-sm" data-open="${c.n}">Ver ficha</button><button class="btn btn-outline btn-sm" data-map="${c.n}">${I.pin}Ver en 3D</button><span class="price" style="margin-left:auto;font-size:1.3rem">${money(c.price)}<small>/noche</small></span></div></div>`;
}

/* ================= SERVICIOS / RESEÑAS / GALERÍA ================= */
$('#amenGrid').innerHTML = PROPERTY_AMENITIES.map(([k, t, s]) => `<div class="amen"><div class="ai">${I[k]}</div><b>${t}</b><span>${s}</span></div>`).join('');
$('#pillList').innerHTML = [...ROOM_AMENITIES.map(a => a[1]), 'Papel higiénico y pañuelos', 'Jabón de manos y para platos', 'Todas a nivel del suelo'].map(t => `<li>${I.check}${t}</li>`).join('');

let ri = 0, rt;
$('#revDots').innerHTML = REVIEWS.map((_, i) => `<button aria-label="Reseña ${i + 1}"></button>`).join('');
$$('#revDots button').forEach((b, i) => b.addEventListener('click', () => showRev(i)));
function showRev(i) {
  ri = i; const q = $('#revQ'); q.style.opacity = 0; q.style.transform = 'translateY(10px)';
  setTimeout(() => { q.textContent = '“' + REVIEWS[ri][0] + '”'; $('#revA').innerHTML = `${REVIEWS[ri][1]}<small>${REVIEWS[ri][2]}</small>`; q.style.opacity = 1; q.style.transform = 'none'; }, reduced ? 0 : 350);
  $$('#revDots button').forEach((b, j) => b.classList.toggle('on', j === ri));
  clearTimeout(rt); rt = setTimeout(() => showRev((ri + 1) % REVIEWS.length), 8000);
}
showRev(0);

let gi = 0, gt, gPaused = false;
$('#cineStage').innerHTML = PHOTOS.map(([src, alt], i) => `<img src="${src}" alt="${alt}" ${i > 1 ? 'loading="lazy"' : ''} class="${i === 6 || i === 7 ? 'portrait' : ''}">`).join('');
$('#thumbs').innerHTML = PHOTOS.map(([src, alt], i) => `<button aria-label="${alt}"><img src="${src}" alt="" loading="lazy"></button>`).join('');
$$('#thumbs button').forEach((b, i) => b.addEventListener('click', () => showPhoto(i)));
function showPhoto(i) {
  gi = (i + PHOTOS.length) % PHOTOS.length;
  $$('#cineStage img').forEach((im, j) => im.classList.toggle('on', j === gi));
  $$('#thumbs button').forEach((b, j) => b.classList.toggle('on', j === gi));
  $('#cineCap').textContent = PHOTOS[gi][1]; $('#cineIdx').textContent = String(gi + 1).padStart(2, '0') + ' / ' + String(PHOTOS.length).padStart(2, '0');
  const bar = $('#cineBar'); bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth;
  if (!gPaused && !reduced) { bar.style.transition = 'width 6s linear'; bar.style.width = '100%'; }
  clearTimeout(gt); if (!gPaused && !reduced) gt = setTimeout(() => showPhoto(gi + 1), 6000);
}
$('#cinePrev').addEventListener('click', e => { e.stopPropagation(); showPhoto(gi - 1); });
$('#cineNext').addEventListener('click', e => { e.stopPropagation(); showPhoto(gi + 1); });
$('#cine').addEventListener('mouseenter', () => { gPaused = true; clearTimeout(gt); $('#cineBar').style.transition = 'none'; });
$('#cine').addEventListener('mouseleave', () => { gPaused = false; showPhoto(gi); });
$('#cine').addEventListener('click', () => openLB(gi));
let sx = 0; $('#cine').addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true }); $('#cine').addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) showPhoto(gi + (d < 0 ? 1 : -1)); });
showPhoto(0);
let li = 0;
function openLB(i) { li = (i + PHOTOS.length) % PHOTOS.length; $('#lbImg').src = PHOTOS[li][0]; $('#lbImg').alt = PHOTOS[li][1]; $('#lbCap').textContent = PHOTOS[li][1]; $('#lb').hidden = false; }
$('#lbX').addEventListener('click', () => $('#lb').hidden = true);
$('#lbP').addEventListener('click', () => openLB(li - 1)); $('#lbN').addEventListener('click', () => openLB(li + 1));
$('#lb').addEventListener('click', e => { if (e.target.id === 'lb') $('#lb').hidden = true; });

/* ================= RESERVA ================= */
function bookForm(el, idx = 0, compact = false) {
  const today = new Date(), d1 = new Date(today.getTime() + 14 * 864e5), d2 = new Date(today.getTime() + 17 * 864e5);
  el.innerHTML = `${compact ? '' : '<h3>Estimar y reservar</h3>'}
    <div class="bk-grid">
      ${compact ? '' : `<label class="bk-f full"><span>Cabaña</span><select name="c">${COTTAGES.map((c, i) => `<option value="${i}" ${i === idx ? 'selected' : ''}>Cabaña ${c.n} · ${c.guests} huésp. · desde ${money(c.price)}</option>`).join('')}</select></label>`}
      <label class="bk-f"><span>Entrada</span><input type="date" name="ci" value="${iso(d1)}" min="${iso(today)}"></label>
      <label class="bk-f"><span>Salida</span><input type="date" name="co" value="${iso(d2)}" min="${iso(today)}"></label>
      <div class="bk-f"><span>Huéspedes</span><div class="stepper"><button type="button" data-st="g" data-d="-1" aria-label="Menos huéspedes">−</button><output name="g">2</output><button type="button" data-st="g" data-d="1" aria-label="Más huéspedes">+</button></div></div>
      <div class="bk-f"><span>Mascotas</span><div class="stepper"><button type="button" data-st="p" data-d="-1" aria-label="Menos mascotas">−</button><output name="p">0</output><button type="button" data-st="p" data-d="1" aria-label="Más mascotas">+</button></div></div>
    </div>
    <p class="bk-err" aria-live="polite"></p>
    <div class="bk-sum"></div>
    <a class="btn btn-primary btn-lg bk-go" href="${BOOK_URL}" target="_blank" rel="noopener">${I.cal}Consultar disponibilidad y reservar</a>
    <p class="bk-note">Estimación con la tarifa “desde”, antes de impuestos. El precio final depende de la temporada y se confirma en el sistema de reservas. ¿Prefiere hablar con nosotros? <a href="tel:${PHONE}">(352) 543-5141</a></p>`;
  const st = { g: 2, p: 0, i: idx };
  const upd = () => {
    const c = COTTAGES[st.i]; st.g = Math.min(Math.max(st.g, 1), c.guests); st.p = Math.min(Math.max(st.p, 0), 3);
    $('output[name=g]', el).textContent = st.g; $('output[name=p]', el).textContent = st.p;
    const ci = $('[name=ci]', el).value, co = $('[name=co]', el).value; const n = Math.round((new Date(co) - new Date(ci)) / 864e5);
    const err = $('.bk-err', el); const go = $('.bk-go', el);
    if (!ci || !co || isNaN(n) || n < 1) { err.textContent = 'La fecha de salida debe ser posterior a la de entrada.'; $('.bk-sum', el).innerHTML = ''; go.href = BOOK_URL; return; }
    err.textContent = '';
    const base = c.price * n, pets = st.p * PET_FEE * n;
    $('.bk-sum', el).innerHTML = `<div><span>${money(c.price)} × ${n} ${n === 1 ? 'noche' : 'noches'}</span><span>${money(base)}</span></div>${st.p ? `<div><span>Mascotas (${st.p} × $${PET_FEE} × ${n})</span><span>${money(pets)}</span></div>` : ''}<div class="tot"><span>Estimado</span><span>${money(base + pets)} <small>+ impuestos</small></span></div><div class="muted" style="font-size:.82rem"><span>Cabaña ${c.n} · hasta ${c.guests} huéspedes</span></div>`;
    go.href = bookUrl(ci, co);
  };
  el.addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (!b) return; st[b.dataset.st] += +b.dataset.d; const c = COTTAGES[st.i]; if (b.dataset.st === 'g' && st.g > c.guests) toast(`La cabaña ${c.n} admite hasta ${c.guests} huéspedes`); upd(); });
  el.addEventListener('input', e => { if (e.target.name === 'c') st.i = +e.target.value; if (e.target.name === 'ci') { const co = $('[name=co]', el); if (co.value <= e.target.value) { const d = new Date(e.target.value); d.setDate(d.getDate() + 2); co.value = iso(d); } } upd(); });
  el.addEventListener('submit', e => e.preventDefault());
  upd();
  return { set(i) { st.i = i; const s = $('[name=c]', el); if (s) s.value = i; upd(); } };
}
const mainBook = bookForm($('#bookForm'), 3);

/* ================= FICHA ================= */
const ficha = $('#ficha');
function fichaHTML(i) {
  const c = COTTAGES[i], prev = COTTAGES[(i + 8) % 9], next = COTTAGES[(i + 1) % 9];
  const tags = [c.view === 'water' ? `<span class="badge water">${I.view}Vista al agua</span>` : `<span class="badge">${VIEW[c.view].label}</span>`, `<span class="badge">${I.paw}Pet friendly</span>`, `<span class="badge">${porchLabel(c)}</span>`, c.guests >= 4 ? '<span class="badge">Ideal para familias</span>' : '<span class="badge">Ideal para parejas</span>', '<span class="badge">Acceso al muelle</span>'];
  const photos = c.layout === 'studio' || c.layout === 'suite' ? [3, 6, 7, 0, 5, 4] : [0, 5, 7, 6, 3, 2];
  return `<div class="fp-head fp-anim">
      <p class="fp-kicker">Cabaña ${c.n} de 9 <span class="rate"><i></i>4,9 · 255 reseñas del complejo</span></p>
      <h2 id="fTitle">Cabaña ${c.n}</h2><p class="tagline">${c.tagline}</p>
      <div class="fp-tags">${tags.join('')}</div>
      <div class="fp-price"><div><span class="price">${money(c.price)}<small>/ noche + impuestos</small></span><div class="muted" style="font-size:.82rem">Tarifa desde · varía por temporada</div></div><a class="btn btn-primary" href="${BOOK_URL}" target="_blank" rel="noopener">Reservar</a></div>
      <div class="fp-ctas"><a class="btn btn-outline btn-sm" href="#f-reserva">${I.cal}Disponibilidad</a><button class="btn btn-outline btn-sm" id="fGal">Ver galería</button><button class="btn btn-outline btn-sm" id="fCmp">${state.compare.has(c.n) ? 'En comparación' : 'Comparar'}</button><a class="btn btn-outline btn-sm" href="tel:${PHONE}">${I.phone}Llamar</a></div>
    </div>
    <nav class="fp-nav" aria-label="Secciones de la ficha"><a href="#f-resumen" class="on">Resumen</a><a href="#f-interior">Interior</a><a href="#f-galeria">Galería</a><a href="#f-amen">Amenidades</a><a href="#f-ubic">Ubicación</a><a href="#f-reserva">Reserva</a></nav>
    <section class="fp-sec" id="f-resumen"><h3>Resumen</h3>
      <div class="fp-specs"><div>${I.guests}<b>Hasta ${c.guests}</b><span>huéspedes</span></div><div>${I.bed}<b>${c.bedsLabel}</b><span>${c.beddings.join(' + ')}</span></div><div>${I.bath}<b>${c.baths} baño</b><span>${c.bath}</span></div><div>${I.view}<b>${VIEW[c.view].short}</b><span>${VIEW[c.view].label}</span></div><div>${I.porch}<b>${c.porch === 'deck' ? 'Terraza' : 'Porche'}</b><span>${porchLabel(c)}</span></div><div>${I.heart}<b>${fitFor(c)}</b><span>ideal para</span></div></div>
      <p class="fp-desc">${c.desc}</p></section>
    <section class="fp-sec" id="f-interior"><h3>Interior y distribución</h3><ul class="rooms">${c.rooms.map(r => `<li>${I.check}<span>${r}</span></li>`).join('')}</ul>
      <div class="floor">${floorSVG(c)}<p>Plano esquemático. Use “Interior” en el visor 3D para ver la cabaña sin techo, o “Recorrido” para entrar: entrada → sala → cocina → dormitorio → ${c.porch === 'deck' ? 'terraza' : 'porche'}.</p></div>
      <div class="row" style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-dark btn-sm" data-vm="in">Ver interior en 3D</button><button class="btn btn-outline btn-sm" data-vm="walk">${I.play}Iniciar recorrido</button></div></section>
    <section class="fp-sec" id="f-galeria"><h3>Galería</h3><div class="f-gal">${photos.map(p => `<button data-lb="${p}"><img src="${PHOTOS[p][0]}" alt="${PHOTOS[p][1]}" loading="lazy"></button>`).join('')}</div><p class="f-note">Fotografías del complejo y de cabañas representativas; la decoración puede variar.</p></section>
    <section class="fp-sec" id="f-amen"><h3>Amenidades</h3><div class="amen-list">${ROOM_AMENITIES.map(([k, t]) => `<div>${I[k]}<span>${t}</span></div>`).join('')}${PROPERTY_AMENITIES.slice(0, 6).map(([k, t]) => `<div>${I[k]}<span>${t}</span></div>`).join('')}</div></section>
    <section class="fp-sec loc" id="f-ubic"><h3>Ubicación en Pirates Cove</h3><svg viewBox="0 0 640 460">${planSVG(i, { small: true })}</svg>
      <div class="dist"><div><b>${c.view === 'water' ? 'Primera línea' : c.view === 'partial' ? 'Vista parcial' : 'Junto al patio'}</b>frente a la bahía</div><div><b>A pocos pasos</b>del muelle de pesca</div><div><b>En el lugar</b>estacionamiento y remolques</div><div><b>Compartido</b>patio, parrillas y jardín</div></div>
      <p class="f-note">12633 SR 24, Cedar Key, FL 32625 · <a class="link" href="https://www.google.com/maps/search/?api=1&query=Pirates+Cove+Coastal+Cottages+Cedar+Key" target="_blank" rel="noopener">Abrir en Google Maps</a></p></section>
    <section class="fp-sec" id="f-reserva"><h3>Reserva</h3><form class="book-card" id="fBook" style="box-shadow:none" novalidate></form></section>
    <div class="f-pn"><button data-goto="${(i + 8) % 9}"><small>Anterior</small><b>Cabaña ${prev.n}</b></button><button data-goto="${(i + 1) % 9}"><small>Siguiente</small><b>Cabaña ${next.n}</b></button></div>`;
}
let fichaSpy = null;
async function openFicha(i, origin) {
  if (i < 0) return;
  stopMapTour();
  const first = ficha.hidden;
  if (first && origin && origin.getBoundingClientRect) { const r = origin.getBoundingClientRect(); ficha.style.setProperty('--ox', (r.left + r.width / 2) + 'px'); ficha.style.setProperty('--oy', (r.top + r.height / 2) + 'px'); }
  state.ficha = i; const c = COTTAGES[i];
  ficha.hidden = false; ficha.classList.remove('closing'); document.body.style.overflow = 'hidden';
  $('#fIdx').textContent = `${i + 1} / 9`;
  const panel = $('#fPanel'); panel.innerHTML = fichaHTML(i); panel.scrollTop = 0;
  bookForm($('#fBook'), i, true);
  $('#fGal').addEventListener('click', () => $('#f-galeria').scrollIntoView({ behavior: 'smooth' }));
  $('#fCmp').addEventListener('click', () => toggleCompare(c.n, !state.compare.has(c.n)));
  $$('[data-lb]', panel).forEach(b => b.addEventListener('click', () => openLB(+b.dataset.lb)));
  $$('[data-goto]', panel).forEach(b => b.addEventListener('click', () => openFicha(+b.dataset.goto)));
  $$('[data-vm]', panel).forEach(b => b.addEventListener('click', () => setViewerMode(b.dataset.vm)));
  $$('.fp-nav a', panel).forEach(a => a.addEventListener('click', e => { e.preventDefault(); $(a.getAttribute('href'), panel).scrollIntoView({ behavior: 'smooth' }); }));
  fichaSpy && fichaSpy.disconnect();
  fichaSpy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('.fp-nav a', panel).forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { root: panel, rootMargin: '-30% 0px -60% 0px' });
  $$('.fp-sec', panel).forEach(s => fichaSpy.observe(s));
  if (history.state?.ficha === undefined) history.pushState({ ficha: i }, '', '#cabana-' + c.n); else history.replaceState({ ficha: i }, '', '#cabana-' + c.n);
  if (state.hero) { state.hero.pause(true); state.hero.select(i); }
  $$('.f-modes button').forEach(b => b.classList.toggle('on', b.dataset.m === 'out')); $('#fTour').hidden = true; $('#fHint').hidden = false;
  if (state.webgl) {
    try {
      if (!state.viewer) { const { createViewer } = await import('./viewer.js'); state.viewer = createViewer($('#viewer'), { quality, reduced }); state.viewer.on('tour', onViewerTour); }
      const h = +($('.f-time button.on')?.dataset.h || 12);
      state.viewer.setHour(h); state.viewer.load(c); state.viewer.start();
    } catch (err) { console.error(err); showViewerFallback(c); }
  } else showViewerFallback(c);
  setTimeout(() => $('#fClose').focus({ preventScroll: true }), 50);
}
function showViewerFallback(c) { const f = $('#viewerFallback'); f.hidden = false; f.innerHTML = facade(c); $('#viewer').hidden = true; $$('.f-modes,.f-time').forEach(x => x.hidden = true); $('#fHint').hidden = true; }
function closeFicha(fromPop) {
  if (ficha.hidden) return;
  ficha.classList.add('closing'); state.viewer && state.viewer.stop();
  setTimeout(() => { ficha.hidden = true; ficha.classList.remove('closing'); document.body.style.overflow = ''; }, reduced ? 0 : 420);
  if (state.hero) { state.hero.pause(false); state.hero.setHour(state.hour, true); state.hero.select(-1); }
  if (!fromPop && history.state && history.state.ficha !== undefined) history.back();
  state.ficha = -1;
}
$('#fClose').addEventListener('click', () => closeFicha()); $('#fBack').addEventListener('click', () => closeFicha());
$('#fPrev').addEventListener('click', () => openFicha((state.ficha + 8) % 9)); $('#fNext').addEventListener('click', () => openFicha((state.ficha + 1) % 9));
addEventListener('popstate', () => { const m = location.hash.match(/^#cabana-(\d)$/); if (m) openFicha(byN(+m[1])); else closeFicha(true); });
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#lb').hidden) $('#lb').hidden = true; else if (!$('#cmpModal').hidden) $('#cmpModal').hidden = true; else if (!ficha.hidden) closeFicha(); else if (state.tour) stopMapTour(); }
  if (!ficha.hidden && !e.target.matches('input,select,textarea')) { if (e.key === 'ArrowRight') openFicha((state.ficha + 1) % 9); if (e.key === 'ArrowLeft') openFicha((state.ficha + 8) % 9); }
  if (!$('#lb').hidden) { if (e.key === 'ArrowRight') openLB(li + 1); if (e.key === 'ArrowLeft') openLB(li - 1); }
});
function setViewerMode(m) {
  if (!state.viewer) return; state.viewer.setMode(m);
  $$('.f-modes button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $('#fHint').textContent = m === 'in' ? 'Vista sin techo · arrastre para girar · rueda para acercar' : 'Arrastre para girar · la vista gira sola cuando no la toca';
  $('#fHint').hidden = m === 'walk';
  if (innerWidth < 980) $('#viewer').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
$$('.f-modes button').forEach(b => b.addEventListener('click', () => setViewerMode(b.dataset.m)));
$$('.f-time button').forEach(b => b.addEventListener('click', () => { $$('.f-time button').forEach(x => x.classList.toggle('on', x === b)); state.viewer && state.viewer.setHour(+b.dataset.h); }));
function onViewerTour(s) {
  const box = $('#fTour'); if (!s) { box.hidden = true; return; }
  box.hidden = false; box.classList.remove('paused');
  $('#ftTitle').textContent = s.key; $('#ftText').textContent = s.text;
  const stops = ['Exterior', 'Entrada', 'Sala', 'Cocina', 'Dormitorio', COTTAGES[state.ficha].porch === 'deck' ? 'Terraza' : 'Porche'];
  $('#ftSteps').innerHTML = stops.map((t, j) => `<button class="${j < s.i ? 'done' : j === s.i ? 'on' : ''}" data-step="${j}"><i></i>${t}</button>`).join('');
  $$('#ftSteps button').forEach(b => b.addEventListener('click', () => state.viewer.tourGo(+b.dataset.step)));
}
$('#ftNext').addEventListener('click', () => state.viewer.tourNext()); $('#ftPrev').addEventListener('click', () => state.viewer.tourPrev());
$('#ftPlay').addEventListener('click', e => { const box = $('#fTour'); const p = !box.classList.contains('paused'); box.classList.toggle('paused', p); state.viewer.tourPause(p); e.currentTarget.innerHTML = p ? '<svg viewBox="0 0 20 20"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 20 20"><path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor"/></svg>'; e.currentTarget.setAttribute('aria-label', p ? 'Reanudar recorrido' : 'Pausar recorrido'); });

/* ================= MAPA 3D ================= */
const hero = $('#explorar');
function engage() { hero.classList.add('engaged'); }
function railHTML() {
  $('#railTrack').innerHTML = COTTAGES.map((c, i) => `<button class="rcard" data-ri="${i}"><span class="sw" style="background:${c.color}">${c.n}</span><span><b>Cabaña ${c.n} · ${money(c.price)}</b><small>${c.guests} huésp. · ${VIEW[c.view].short}</small></span></button>`).join('');
  $$('.rcard').forEach(b => { b.addEventListener('click', () => selectOnMap(+b.dataset.ri)); b.addEventListener('mouseenter', () => state.hero && hoverPin(+b.dataset.ri, true)); b.addEventListener('mouseleave', () => hoverPin(-1)); });
}
function hoverPin(i) { $$('.pin').forEach((p, j) => p.classList.toggle('on', j === i || j === state.sel)); }
function quickHTML(i) {
  const c = COTTAGES[i];
  return `<div class="q-media">${facade(c, { night: state.hour > 19.6 || state.hour < 6.2 })}</div><div class="q-in fp-anim"><h3>Cabaña ${c.n}</h3><p class="q-tag">${c.tagline}</p>
  <div class="q-specs"><span>${I.guests}${c.guests} huésp.</span><span>${I.bed}${c.bedsLabel}</span><span>${I.view}${VIEW[c.view].short}</span></div>
  <div class="q-row"><span class="price">${money(c.price)}<small>/noche</small></span><div style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" data-qn="-1" aria-label="Cabaña anterior">‹</button><button class="btn btn-outline btn-sm" data-qn="1" aria-label="Cabaña siguiente">›</button><button class="btn btn-dark btn-sm" data-open="${c.n}">Ver ficha completa</button></div></div></div>`;
}
function selectOnMap(i, { fromTour = false } = {}) {
  if (!fromTour) stopMapTour();
  state.sel = i; engage();
  $$('.rcard').forEach((b, j) => b.classList.toggle('on', j === i)); hoverPin(i);
  const rc = $$('.rcard')[i]; rc && rc.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  if (state.hero) state.hero.focus(i);
  if (!fromTour) { $('#quick').hidden = false; $('#quickBody').innerHTML = quickHTML(i); $$('#quickBody [data-qn]').forEach(b => b.addEventListener('click', () => selectOnMap((i + +b.dataset.qn + 9) % 9))); }
  planSel = i; renderPlan(); planDetail(i);
}
$('#qClose').addEventListener('click', () => { $('#quick').hidden = true; state.sel = -1; hoverPin(-1); $$('.rcard').forEach(b => b.classList.remove('on')); state.hero && state.hero.home(); });
$$('#mapFilter button').forEach(b => b.addEventListener('click', () => {
  $$('#mapFilter button').forEach(x => x.classList.toggle('on', x === b)); state.mapFilter = b.dataset.f; engage();
  const set = state.mapFilter === 'all' ? null : new Set(COTTAGES.filter(c => matchMap(c, state.mapFilter)).map(c => c.n));
  state.hero && state.hero.setFilter(set);
  $$('.rcard').forEach((r, j) => r.classList.toggle('dim', !!set && !set.has(COTTAGES[j].n)));
  $$('.pin').forEach((p, j) => p.dataset.dim = set && !set.has(COTTAGES[j].n) ? 1 : '');
  if (set) toast(`${set.size} cabañas: ${b.textContent.toLowerCase()}`);
}));
$('#exToggle').addEventListener('click', e => { const c = $('#explorer').classList.toggle('collapsed'); e.currentTarget.setAttribute('aria-expanded', !c); });
if (mobile) $('#explorer').classList.add('collapsed');

// hora
const fmtH = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return `${String(H + (M === 60 ? 1 : 0)).padStart(2, '0')}:${String(M === 60 ? 0 : M).padStart(2, '0')}`; };
function setHour(h, instant) { state.hour = h; $('#hour').value = h; $('#hourOut').textContent = fmtH(h); state.hero && state.hero.setHour(h, instant); }
$('#hour').addEventListener('input', e => { stopCycle(); setHour(+e.target.value); engage(); });
$$('.tod-marks button').forEach(b => b.addEventListener('click', () => { stopCycle(); setHour(+b.dataset.h); engage(); }));
let cyc = 0;
function stopCycle() { if (!cyc) return; cancelAnimationFrame(cyc); cyc = 0; $('#cycleBtn').setAttribute('aria-pressed', false); }
$('#cycleBtn').addEventListener('click', e => {
  if (cyc) return stopCycle(); e.currentTarget.setAttribute('aria-pressed', true); engage();
  let last = performance.now();
  const step = now => { const dt = (now - last) / 1000; last = now; let h = state.hour + dt * .55; if (h > 21.5) h = 5.5; state.hour = h; $('#hour').value = h; $('#hourOut').textContent = fmtH(h); state.hero && state.hero.setHour(h, true); cyc = requestAnimationFrame(step); };
  cyc = requestAnimationFrame(step);
});
$('#homeBtn').addEventListener('click', () => { stopMapTour(); $('#quick').hidden = true; state.sel = -1; hoverPin(-1); state.hero && state.hero.home(); });
let audioMod = null;
$('#soundBtn').addEventListener('click', async e => {
  const b = e.currentTarget, on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
  audioMod = audioMod || await import('./audio.js'); on ? audioMod.startAudio() : audioMod.stopAudio();
});

// recorridos guiados del mapa
function runMapTour(key) {
  stopMapTour(); engage();
  const t = key === 'all' ? { title: 'Recorrido por Pirates Cove', ids: COTTAGES.map(c => c.n) } : TOURS[key];
  $$('#tourList button').forEach(b => b.classList.toggle('on', b.dataset.t === key));
  $('#quick').hidden = true;
  const tour = state.tour = { ...t, k: -1, timer: 0 };
  const cap = $('#tourCap'); cap.hidden = false; $('#tcKicker').textContent = t.title;
  const go = k => {
    tour.k = (k + t.ids.length) % t.ids.length; const i = byN(t.ids[tour.k]), c = COTTAGES[i];
    selectOnMap(i, { fromTour: true });
    $('#tcTitle').textContent = `Cabaña ${c.n} · ${money(c.price)}`; $('#tcText').textContent = c.tagline + ' · ' + c.guests + ' huéspedes · ' + VIEW[c.view].label.toLowerCase();
    const bar = $('#tcBar'); bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = 'width 6.5s linear'; bar.style.width = '100%';
    clearTimeout(tour.timer); tour.timer = setTimeout(() => go(tour.k + 1), 6500);
  };
  tour.go = go; go(0);
}
function stopMapTour() { if (!state.tour) return; clearTimeout(state.tour.timer); state.tour = null; $('#tourCap').hidden = true; $$('#tourList button').forEach(b => b.classList.remove('on')); }
$$('#tourList button').forEach(b => b.addEventListener('click', () => runMapTour(b.dataset.t)));
$('#startTour').addEventListener('click', () => runMapTour('all'));
$('#tcStop').addEventListener('click', stopMapTour);
$('#tcNext').addEventListener('click', () => state.tour && state.tour.go(state.tour.k + 1));
$('#tcPrev').addEventListener('click', () => state.tour && state.tour.go(state.tour.k - 1));
$('#tcOpen').addEventListener('click', () => { if (state.tour) openFicha(byN(state.tour.ids[state.tour.k]), $('#tcOpen')); });

// pines HTML
function buildPins() {
  $('#pins').innerHTML = COTTAGES.map((c, i) => `<button class="pin" data-pi="${i}" style="--pc:${c.color}" tabindex="-1"><b>${c.n}<em>${money(c.price)}</em></b></button>`).join('');
  $$('.pin').forEach(p => { p.addEventListener('click', () => selectOnMap(+p.dataset.pi)); p.addEventListener('mouseenter', () => showTip(+p.dataset.pi, p)); p.addEventListener('mouseleave', () => showTip(-1)); });
}
function showTip(i, el, ev) {
  const tip = $('#tip'); if (i < 0) { tip.classList.remove('show'); return; }
  const c = COTTAGES[i]; tip.innerHTML = `<b>Cabaña ${c.n}</b>${c.tagline}<br><span style="color:#f3dcae">${money(c.price)}/noche · ${c.guests} huésp.</span>`;
  const r = hero.getBoundingClientRect(); let x, y;
  if (ev) { x = ev.clientX - r.left + 16; y = ev.clientY - r.top + 16; } else { const b = el.getBoundingClientRect(); x = b.left - r.left + b.width / 2 + 16; y = b.top - r.top - 10; }
  tip.style.left = Math.min(x, r.width - 250) + 'px'; tip.style.top = y + 'px'; tip.classList.add('show');
}

/* ================= ARRANQUE ================= */
function hideLoader() { $('#loader').classList.add('done'); document.body.classList.remove('loading'); }
function setLoad(p, msg) { $('#ldBar').style.width = Math.round(p * 100) + '%'; if (msg) $('#ldSub').textContent = msg; }
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
function fallbackHero(msg) {
  state.webgl = false; $('#world').hidden = true; $('#heroFallback').hidden = false; $('#pins').hidden = true; $('#explorer').hidden = true;
  $('#hint').textContent = msg || 'Vista 3D no disponible en este navegador · explore la lista y el plano'; hideLoader();
}

railHTML(); buildPins(); renderCards(); renderPlan(); renderTray();
reveal('.sec-head, .exp, .amen, .kpi, .plan-map, .plan-copy, .book-card, .contact > div, .rev-score, .cine, .thumbs');
$$('.band').forEach(b => rio.observe(b));

async function boot() {
  if (!webglOK()) return fallbackHero();
  setLoad(.06, 'Descargando el motor 3D');
  let mod;
  try { mod = await Promise.race([import('./scene.js'), new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 25000))]); }
  catch (e) { console.error(e); return fallbackHero('No se pudo cargar la vista 3D · explore la lista y el plano'); }
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));
  try {
    const h = state.hero = mod.createScene($('#world'), { quality, reduced, onProgress: setLoad });
    h.setHour(state.hour, true);
    h.on('select', i => selectOnMap(i));
    h.on('hover', (i, ev) => { if (i >= 0 && ev) showTip(i, null, ev); else showTip(-1); $$('.pin').forEach((p, j) => p.classList.toggle('on', j === i || j === state.sel)); });
    h.on('interact', () => { engage(); stopMapTour(); });
    const pins = $$('.pin');
    h.onFrame = (pp) => { for (let i = 0; i < pp.length; i++) { const p = pins[i], o = pp[i]; if (!o.vis) { p.style.opacity = 0; p.style.pointerEvents = 'none'; continue; } const sc = Math.max(.7, Math.min(1.1, 60 / o.d)); p.style.transform = `translate(${o.x}px,${o.y}px) translate(-50%,-100%) scale(${sc.toFixed(3)})`; p.style.opacity = p.dataset.dim ? .35 : 1; p.style.pointerEvents = 'auto'; } };
    new IntersectionObserver(([e]) => h.setVisible(e.isIntersecting)).observe(hero);
    setLoad(1, 'Bienvenido a Pirates Cove');
    h.start();
    setTimeout(hideLoader, 350);
    const m = location.hash.match(/^#cabana-(\d)$/); if (m) setTimeout(() => openFicha(byN(+m[1])), 600);
  } catch (e) { console.error(e); fallbackHero('No se pudo iniciar la vista 3D · explore la lista y el plano'); }
}
boot();
setTimeout(() => { if (!$('#loader').classList.contains('done')) hideLoader(); }, 30000);

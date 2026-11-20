// 마우스 커서 이미지 변환기. 실행: node make-cursor.js [원본.png]   (원본을 생략하면 guide/assets/home/cursor-source.png)
// 흰 배경 위의 어두운 모양을 투명 배경으로 바꾸고, 모양 영역만 잘라 커서 크기로 줄여
// guide/assets/home/cursor.png(1x)와 cursor@2x.png(2x)로 저장한다. 클릭 지점(핫스팟)은 모양의 가장 위쪽 끝으로 잡아 알려 준다.
// 알려 준 핫스팟 값은 guide/assets/home/home.css의 cursor 줄 숫자와 맞춘다.
const fs = require('fs'), zlib = require('zlib');
const path = require('path');
const root = path.join(__dirname, '..');
const SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'guide/assets/home/cursor-source.png');
const OUT = path.join(root, 'guide/assets/home') + path.sep;

function decode(buf) {
  let p = 8, w, h, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c), pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; v += pr; }
      px[y * stride + x] = v & 255;
    }
  }
  return { w, h, px };
}
function crc32(b) { let c, crc = ~0; for (let i = 0; i < b.length; i++) { c = (crc ^ b[i]) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function encode(w, h, px) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t, 'ascii'), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const { w, h, px } = decode(fs.readFileSync(SRC));
for (let i = 0; i < w * h; i++) { const lum = (px[i*4]*0.3 + px[i*4+1]*0.59 + px[i*4+2]*0.11); const a = Math.max(0, Math.min(255, Math.round((255 - lum) * 1.15))); px[i*4]=16; px[i*4+1]=16; px[i*4+2]=16; px[i*4+3]=Math.round(a * (px[i*4+3]/255)); }
let x0 = w, y0 = h, x1 = -1, y1 = -1, tipX = 0, tipY = h;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  if (px[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
}
// 가장 위쪽 줄에서 불투명한 칸의 가운데를 끝점으로 본다
let sum = 0, cnt = 0;
for (let x = 0; x < w; x++) if (px[(y0 * w + x) * 4 + 3] > 40) { sum += x; cnt++; }
tipX = sum / cnt; tipY = y0;
console.log('원본', w + 'x' + h, '모양 영역', x0, y0, x1, y1, '끝점', tipX.toFixed(1), tipY);
let dark = 0, n = 0;
for (let i = 0; i < w * h; i++) if (px[i * 4 + 3] > 200) { dark += px[i * 4]; n++; }
console.log('불투명 픽셀 평균 밝기(0=검정)', (dark / n).toFixed(0));

// 모양 영역만 잘라 높이 H로 줄인다(면적 평균). 여백 1칸을 둔다
function scale(H) {
  const cw = x1 - x0 + 1, chh = y1 - y0 + 1, s = H / chh, W = Math.ceil(cw * s), pad = 1;
  const outW = W + pad * 2, outH = H + pad * 2, out = Buffer.alloc(outW * outH * 4);
  for (let oy = 0; oy < H; oy++) for (let ox = 0; ox < W; ox++) {
    const sx0 = x0 + ox / s, sx1 = x0 + (ox + 1) / s, sy0 = y0 + oy / s, sy1 = y0 + (oy + 1) / s;
    let r = 0, g = 0, b = 0, a = 0, wsum = 0;
    for (let yy = Math.floor(sy0); yy < Math.ceil(sy1); yy++) for (let xx = Math.floor(sx0); xx < Math.ceil(sx1); xx++) {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const wt = (Math.min(xx + 1, sx1) - Math.max(xx, sx0)) * (Math.min(yy + 1, sy1) - Math.max(yy, sy0));
      const al = px[(yy * w + xx) * 4 + 3] / 255;
      r += px[(yy * w + xx) * 4] * al * wt; g += px[(yy * w + xx) * 4 + 1] * al * wt; b += px[(yy * w + xx) * 4 + 2] * al * wt; a += al * wt; wsum += wt;
    }
    const o = ((oy + pad) * outW + ox + pad) * 4;
    if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; out[o + 3] = Math.min(255, (a / wsum) * 255); }
  }
  return { w: outW, h: outH, px: out, hx: Math.round((tipX - x0) * s + pad), hy: Math.round((tipY - y0) * s + pad) };
}
for (const [name, H] of [['cursor.png', 36], ['cursor@2x.png', 72]]) {
  const r = scale(H);
  fs.writeFileSync(OUT + name, encode(r.w, r.h, r.px));
  console.log(name, r.w + 'x' + r.h, '핫스팟', r.hx, r.hy);
}

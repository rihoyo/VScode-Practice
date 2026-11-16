// 가이드 검사 스크립트. 실행: tools 폴더에서 npm run check
//  1) 지도 데이터(map-data.js) 구조 검사
//  2) 가이드 스크립트 문법 검사
//  3) 페이지 사이 링크와 앵커(#id)가 실제로 있는지 검사
//  4) 설명문이 "~다." 문체인지, 폰트가 고딕만 쓰이는지 검사
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const guide = path.join(root, 'guide');
const { ST, NODES, EDGES } = require(path.join(guide, 'map-data.js'));
const errors = [];

// ── 1) 지도 데이터 ──
for (const [id, n] of Object.entries(NODES)) {
  for (const k of ['name', 'glyph', 'c', 'desc']) if (!n[k]) errors.push(`노드 ${id}: ${k}가 비었다`);
}
const ids = new Set();
for (const e of EDGES) {
  if (ids.has(e.id)) errors.push(`연결 ${e.id}: id가 중복이다`);
  ids.add(e.id);
  for (const end of [e.a, e.b]) if (!NODES[end]) errors.push(`연결 ${e.id}: 없는 노드 ${end}`);
  if (!ST[e.status]) errors.push(`연결 ${e.id}: status는 ${Object.keys(ST).join('/')} 중 하나여야 한다`);
  for (const k of ['label', 'lead', 'what', 'why', 'how', 'ok']) if (!e[k]) errors.push(`연결 ${e.id}: ${k}가 비었다`);
  if (!Array.isArray(e.steps) || !e.steps.length) errors.push(`연결 ${e.id}: steps가 필요하다`);
  (e.steps || []).forEach((s, i) => {
    if (s.d !== 1 && s.d !== -1) errors.push(`연결 ${e.id} 단계 ${i + 1}: d는 1 또는 -1이다`);
    if (!s.pkt || !s.t) errors.push(`연결 ${e.id} 단계 ${i + 1}: pkt와 t가 필요하다`);
  });
}
const linked = new Set(EDGES.flatMap((e) => [e.a, e.b]));
for (const [id, n] of Object.entries(NODES)) if (!n.ghost && !linked.has(id)) errors.push(`노드 ${id}: 연결이 하나도 없다`);

// ── 2) 문법 ──
for (const f of ['guide.js', 'map-data.js', 'guide-map.js']) {
  const r = spawnSync(process.execPath, ['--check', path.join(guide, f)], { encoding: 'utf8' });
  if (r.status !== 0) errors.push(`${f} 문법 오류:\n${r.stderr}`);
}

// ── 3) 링크와 앵커 ──
const pages = fs.readdirSync(guide).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(pages.map((f) => [f, fs.readFileSync(path.join(guide, f), 'utf8')]));
const anchors = Object.fromEntries(pages.map((f) => [f, new Set([...html[f].matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))]));
const checkHref = (from, href) => {
  const m = href.match(/^([\w-]+\.html)?#?([\w-]*)$/);
  if (!m || (!m[1] && !href.startsWith('#'))) return;
  const page = m[1] || from;
  if (!html[page]) return errors.push(`${from}: 없는 페이지 ${href}`);
  if (m[2] && !anchors[page].has(m[2])) errors.push(`${from}: 없는 앵커 ${href}`);
};
for (const f of pages) for (const m of html[f].matchAll(/href="([^"]+)"/g)) checkHref(f, m[1]);
for (const e of EDGES) if (e.link) checkHref('map-data.js', e.link);
for (const n of Object.values(NODES)) if (n.link) checkHref('map-data.js', n.link);

// ── 4) 문체와 폰트 ──
// 설명문은 "~다." 로 끝낸다. 반말 어미(야/어/해/줘/와/봐/써/돼/워/둬 + 마침표)가 보이면 알려준다.
const banned = /(야|어|해|줘|와|봐|써|돼|워|둬)\.(?=\s|$|<)/g;
const lintText = (file, text) => {
  for (const m of text.matchAll(banned)) {
    const s = Math.max(0, m.index - 24);
    errors.push(`${file}: 반말 어미 "…${text.slice(s, m.index + 2).replace(/\s+/g, ' ')}" → ~다. 로 고친다`);
  }
};
for (const f of pages) {
  const text = html[f]
    .replace(/<(script|style|code|kbd)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, '');
  lintText(f, text);
}
for (const f of ['map-data.js', 'guide-map.js']) {
  const src = fs.readFileSync(path.join(guide, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  lintText(f, src);
}
for (const f of fs.readdirSync(guide).filter((x) => x.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(guide, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\bserif\b/i.test(css.replace(/sans-serif/gi, '')) || /Batang|Myeongjo|바탕|명조/i.test(css))
    errors.push(`${f}: 바탕·명조(serif) 계열 폰트가 보인다. 고딕만 쓴다`);
}

if (errors.length) {
  console.error(`검사 실패 (${errors.length}건)\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`검사 통과 · 노드 ${Object.keys(NODES).length}개, 연결 ${EDGES.length}개, 페이지 ${pages.length}개`);

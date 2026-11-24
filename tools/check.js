// 가이드 검사 스크립트. 실행: tools 폴더에서 npm run check
//  1) 지도 데이터(map-data.js) 구조 검사
//  2) 가이드 스크립트 문법 검사
//  3) 페이지 사이 링크와 앵커(#id)가 실제로 있는지 검사
//  4) 키워드 색인과 용어 사전(glossary)이 올바르고 최신인지, 공용 파일 연결이 맞는지, 키워드 색인(search-index.js)이 최신인지, 메인 페이지 이동 메뉴의 목록이 실제 파일과 맞는지 검사
//  5) 설명문이 "~다." 문체인지, 폰트가 고딕만 쓰이는지 검사
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const guide = path.join(root, 'guide');
const { ST, NODES, EDGES } = require(path.join(guide, 'data', 'map-data.js'));
const errors = [];
// 폴더 안의 특정 확장자 파일을 모두 찾는다(guide 기준 상대 경로)
const walk = (dir, ext, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  if (d.name === 'vendor' || d.name === 'node_modules') return [];
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p, ext, base) : d.name.endsWith(ext) ? [path.relative(base, p).replace(/\\/g, '/')] : [];
});

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
for (const f of [...walk(path.join(guide, 'assets'), '.js', guide), ...walk(path.join(guide, 'data'), '.js', guide)]) {
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
for (const e of EDGES) if (e.link) checkHref('data/map-data.js', e.link);
for (const n of Object.values(NODES)) if (n.link) checkHref('data/map-data.js', n.link);

// ── 3-1) 키워드 색인과 페이지 전환 메뉴 ──
const indexFile = path.join(guide, 'data', 'generated', 'search-index.js');
if (!fs.existsSync(indexFile) || fs.readFileSync(indexFile, 'utf8') !== require('./build-index.js').generate())
  errors.push('data/generated/search-index.js가 최신이 아니다. tools 폴더에서 npm run build 를 실행한다');
const nav = fs.readFileSync(path.join(guide, 'data', 'sites.js'), 'utf8');
const menuPages = [...nav.matchAll(/href: '([^']+)'/g)].map((m) => m[1]);
for (const p of menuPages) if (!html[p]) errors.push('data/sites.js: 메뉴에 있는 페이지 ' + p + '가 없다');
for (const f of pages) if (!menuPages.includes(f)) errors.push(f + ': data/sites.js에 등록되지 않았다');
for (const f of pages) {
  if (!/class="sitenav"/.test(html[f])) errors.push(f + ': 메인 페이지 이동 드롭다운 자리(<div class="sitenav">)가 없다');
  for (const m of html[f].matchAll(/<a[^>]*href="#([^"]+)"[^>]*data-tags="([^"]*)"/g)) {
    if (!anchors[f].has(m[1])) errors.push(f + ': 목차 앵커 #' + m[1] + '가 없다');
  }
}

// ── 3-1-1) 주석: 본문의 번호(sup.fn)와 맨 끝 주석 목록(.notes li)이 서로 짝이 맞는지 ──
for (const f of pages) {
  const used = new Set([...html[f].matchAll(/<sup class="fn" data-fn="([^"]+)"/g)].map((m) => m[1]));
  const notes = html[f].match(/<section class="notes"[\s\S]*?<\/section>/);
  const defined = new Set(notes ? [...notes[0].matchAll(/<li data-fn="([^"]+)"/g)].map((m) => m[1]) : []);
  for (const k of used) if (!defined.has(k)) errors.push(f + ': 주석 "' + k + '"의 내용(<li data-fn>)이 없다');
  for (const k of defined) if (!used.has(k)) errors.push(f + ': 주석 "' + k + '"가 본문에서 쓰이지 않는다');
}

// ── 3-2) 모든 페이지가 공용 묶음을 같은 순서로 불러오는지, 용어 사전이 올바르고 최신인지 ──
const SHARED = ['assets/shared/transition.js', 'assets/shared/site-ui.css', 'assets/shared/glossary.css', 'data/generated/search-index.js', 'data/generated/glossary-data.js', 'data/sites.js', 'assets/shared/site-nav.js', 'assets/shared/glossary.js'];
for (const f of pages) {
  let at = -1;
  for (const s of SHARED) {
    const i = html[f].indexOf('"' + s + '"');
    if (i < 0) errors.push(f + ': 공용 파일 ' + s + '를 불러오지 않는다');
    else if (i < at) errors.push(f + ': 공용 파일 ' + s + '의 순서가 어긋났다(위 목록 순서로 불러온다)');
    else at = i;
  }
  for (const m of html[f].matchAll(/(?:href|src)="((?:assets|data|vendor)\/[^"]+)"/g)) if (!fs.existsSync(path.join(guide, m[1]))) errors.push(f + ': 없는 파일 ' + m[1]);
}
const gl = require('./build-glossary.js');
const glr = gl.load();
errors.push(...glr.errors.map((e) => '용어 사전 · ' + e));
if (!glr.errors.length && (!fs.existsSync(gl.out) || fs.readFileSync(gl.out, 'utf8') !== gl.generate()))
  errors.push('data/generated/glossary-data.js가 최신이 아니다. tools 폴더에서 npm run build 를 실행한다');

// ── 3-3) 리눅스 따라하기 실습: 데이터 형식과, 모든 단계가 시뮬레이터에서 계열마다 실제로 성공하는지 ──
{
  const lab = require(path.join(guide, 'data', 'linux-lab.js'));
  const Sh = require(path.join(guide, 'assets', 'linux', 'lab-shell.js'));
  const val = (v, d) => (typeof v === 'string' ? v : v && v[d]);
  { // 연출 계획: 글자를 이으면 셸 출력과 같아야 하고, 오래 걸리는 명령도 12초를 넘기지 않아야 한다
    const T = require(path.join(guide, 'assets', 'linux', 'lab-theatre.js'));
    for (const [d, c] of [['deb', 'sudo apt update'], ['deb', 'sudo apt install tree'], ['rh', 'sudo dnf install tree'], ['deb', 'ping -c 3 8.8.8.8'], ['deb', 'apt update']]) {
      const sh = Sh.create({ distro: d, files: lab.files }), r = sh.run(c), ev = T.plan(d, c, r);
      if (!ev.length) { errors.push('lab-theatre: ' + c + ' 연출 계획이 비었다'); continue; }
      if (T.flatten(ev) !== r.out) errors.push('lab-theatre: ' + c + ' 연출 글자가 셸 출력과 다르다');
      if (T.total(ev) > 12000) errors.push('lab-theatre: ' + c + ' 연출이 12초를 넘는다');
    }
    if (T.plan('deb', 'ls', { out: 'a', code: 0 }).length) errors.push('lab-theatre: 일반 명령은 즉시 출력해야 한다');
  }
  if (!Array.isArray(lab.lessons) || !lab.lessons.length) errors.push('data/linux-lab.js: lessons가 비었다');
  for (const d of ['deb', 'rh']) {
    const sh = Sh.create({ distro: d, files: lab.files });
    (lab.lessons || []).forEach((les, li) => {
      if (!les.id || !les.title || !Array.isArray(les.steps) || !les.steps.length) errors.push(`linux-lab 실습 ${li + 1}: id, title, steps가 필요하다`);
      (les.steps || []).forEach((st, si) => {
        const at = `linux-lab[${d}] ${les.title || li + 1} ${si + 1}단계`;
        const cmd = val(st.cmd, d), say = val(st.say, d), ok = val(st.ok, d);
        if (!cmd || !say || !ok) { errors.push(at + ': cmd, say, ok가 필요하다(계열별이면 deb와 rh 둘 다)'); return; }
        for (const [k, t] of [['say', say], ['ok', ok]]) if (!/다\.$/.test(t)) errors.push(at + ': ' + k + '는 "~다."로 끝낸다');
        const r = sh.run(cmd);
        if (st.fails ? r.code === 0 : r.code !== 0) errors.push(at + ': 명령 "' + cmd + '"가 시뮬레이터에서 ' + (st.fails ? '실패해야 하는데 성공했다' : '실패했다 → ' + Sh.plain(r.out).split('\n')[0]));
      });
    });
  }
}

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
// 루트 index.html(첫 화면): 불러오는 파일과 링크가 실제로 있는지, 설명문이 "~다."인지
{
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const m of idx.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|#)/.test(m[1])) continue;
    const [file, hash] = m[1].split('#');
    if (!fs.existsSync(path.join(root, file))) errors.push('루트 index.html: 없는 파일 ' + m[1]);
    else if (hash && file.endsWith('.html')) { const t = fs.readFileSync(path.join(root, file), 'utf8'); if (!t.includes('id="' + hash + '"')) errors.push('루트 index.html: 없는 앵커 ' + m[1]); }
  }
  lintText('index.html', idx.replace(/<(script|style|code)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ''));
}
for (const f of ['data/map-data.js', 'data/linux-lab.js', 'assets/vscode/guide-map.js', 'assets/home/home-ui.js']) {
  const src = fs.readFileSync(path.join(guide, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  lintText(f, src);
}
for (const f of walk(path.join(guide, 'assets'), '.css', guide)) {
  const css = fs.readFileSync(path.join(guide, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\bserif\b/i.test(css.replace(/sans-serif/gi, '')) || /Batang|Myeongjo|바탕|명조/i.test(css))
    errors.push(`${f}: 바탕·명조(serif) 계열 폰트가 보인다. 고딕만 쓴다`);
}

// ── 6) 에이전트 목록(projects/README.md)의 폴더와 규칙 파일이 실제로 있는지 ──
const registry = path.join(root, 'projects', 'README.md');
if (fs.existsSync(registry)) {
  for (const line of fs.readFileSync(registry, 'utf8').split('\n')) {
    if (!line.startsWith('|') || /^\|\s*(-|이름)/.test(line)) continue;
    const cols = line.split('|');
    for (const i of [2, 4]) {
      for (const m of (cols[i] || '').matchAll(/`([^`]+)`/g)) {
        if (!fs.existsSync(path.join(root, m[1]))) errors.push(`projects/README.md: ${cols[1].trim()} 에이전트의 경로 ${m[1]}가 없다`);
      }
    }
  }
} else {
  errors.push('projects/README.md가 없다');
}

if (errors.length) {
  console.error(`검사 실패 (${errors.length}건)\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`검사 통과 · 노드 ${Object.keys(NODES).length}개, 연결 ${EDGES.length}개, 페이지 ${pages.length}개`);

// 용어 사전 검증과 생성기. 실행: npm run build (또는 node build-glossary.js)
// 원본: guide/data/glossary/*.json (사람이 고치는 파일)
// 결과: guide/data/generated/glossary-data.js (자동 생성, 직접 고치지 않는다)
// 홈페이지는 서버 없이 열려 JSON을 읽어 올 수 없어서, 검증을 통과한 사전을 스크립트 파일로 미리 만들어 둔다.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'guide', 'data', 'glossary');
const out = path.join(__dirname, '..', 'guide', 'data', 'generated', 'glossary-data.js');
const FIELDS = ['match', 'name', 'say', 'full', 'literal', 'desc']; // 이 순서로 출력한다
const REQUIRED = ['name', 'say', 'desc'];
const ACRONYM = /^[A-Za-z0-9+/.-]{2,10}$/; // 영문 줄임말 모양이면 풀네임과 직역이 있어야 한다

// 사전을 읽고 문제 목록을 함께 돌려준다. 문제가 있어도 가능한 만큼 끝까지 검사한다.
function load() {
  const errors = [], list = [], seen = new Map();
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  if (!files.length) errors.push('용어 사전 파일(guide/data/glossary/*.json)이 없다');
  for (const f of files) {
    let arr;
    try { arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
    catch (e) { errors.push(`${f}: JSON 문법 오류 · ${e.message}`); continue; }
    if (!Array.isArray(arr)) { errors.push(`${f}: 맨 바깥은 배열이어야 한다`); continue; }
    arr.forEach((e, i) => {
      const at = `${f} ${i + 1}번째(${e && e.name ? e.name : '이름 없음'})`;
      if (!e || typeof e !== 'object') { errors.push(`${at}: 객체가 아니다`); return; }
      for (const k of Object.keys(e)) if (!FIELDS.includes(k)) errors.push(`${at}: 알 수 없는 칸 "${k}" (쓸 수 있는 칸: ${FIELDS.join(', ')})`);
      if (!Array.isArray(e.match) || !e.match.length || e.match.some((m) => typeof m !== 'string' || !m.trim()))
        errors.push(`${at}: match는 찾을 글자를 담은 배열이어야 한다`);
      for (const k of REQUIRED) if (typeof e[k] !== 'string' || !e[k].trim()) errors.push(`${at}: ${k} 칸이 비었다`);
      for (const k of ['full', 'literal']) if (k in e && (typeof e[k] !== 'string' || !e[k].trim())) errors.push(`${at}: ${k}는 값이 없으면 칸 자체를 지운다`);
      if (typeof e.desc === 'string' && !/다\.$/.test(e.desc.trim())) errors.push(`${at}: desc는 "~다."로 끝낸다`);
      if (typeof e.name === 'string' && ACRONYM.test(e.name) && /[A-Z]{2}/.test(e.name) && !(e.full && e.literal))
        errors.push(`${at}: 줄임말에는 full(풀네임)과 literal(직역)이 필요하다`);
      (e.match || []).forEach((m) => {
        if (typeof m !== 'string') return;
        const key = m.toLowerCase();
        if (seen.has(key)) errors.push(`${at}: "${m}"가 ${seen.get(key)}와 겹친다`);
        else seen.set(key, at);
      });
      list.push(e);
    });
  }
  return { list, errors };
}

function generate() {
  const { list, errors } = load();
  if (errors.length) throw new Error('용어 사전 오류 ' + errors.length + '건\n- ' + errors.join('\n- '));
  const rows = list.map((e) => '  ' + JSON.stringify(Object.fromEntries(FIELDS.filter((k) => k in e).map((k) => [k, e[k]]))));
  return '/* 자동 생성 파일: tools 폴더에서 npm run build 로 만든다. 직접 고치지 않는다. 원본은 guide/data/glossary/*.json */\n'
    + 'window.GLOSSARY_DATA = [\n' + rows.join(',\n') + '\n];\n';
}

module.exports = { load, generate, out };
if (require.main === module) {
  try {
    const text = generate();
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, text);
    console.log(`용어 사전 생성 · ${(text.match(/\{"match"/g) || []).length}개 → guide/data/generated/glossary-data.js`);
  } catch (e) { console.error(e.message); process.exit(1); }
}

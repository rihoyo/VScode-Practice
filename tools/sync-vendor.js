// npm으로 받은 라이브러리를 guide/vendor에 복사해.
// 가이드는 서버 없이 브라우저에서 바로 열어야 해서, 완성 파일을 저장소에 같이 올려둬.
// d3: 지도 물리 엔진. gpt-tokenizer: AI 페이지의 토큰 계산기(o200k, cl100k).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const mods = path.join(__dirname, 'node_modules');
const outDir = path.join(root, 'guide', 'vendor');
const files = [
  ['d3', 'dist/d3.min.js', 'd3.min.js'],
  ['gpt-tokenizer', 'dist/o200k_base.js', 'tokenizer-o200k.js'],
  ['gpt-tokenizer', 'dist/cl100k_base.js', 'tokenizer-cl100k.js'],
];

fs.mkdirSync(outDir, { recursive: true });
for (const [pkg, from, to] of files) {
  const src = path.join(mods, pkg, from);
  if (!fs.existsSync(src)) {
    console.error(`${pkg}가 없다. tools 폴더에서 먼저 npm install을 실행한다.`);
    process.exit(1);
  }
  // 소스맵 주석은 없는 파일을 찾지 않게 지운다
  const code = fs.readFileSync(src, 'utf8').replace(/\n\/\/# sourceMappingURL=.*$/, '\n');
  fs.writeFileSync(path.join(outDir, to), code);
  const version = require(path.join(mods, pkg, 'package.json')).version;
  console.log(`${pkg} ${version} → guide/vendor/${to} 복사 완료`);
}

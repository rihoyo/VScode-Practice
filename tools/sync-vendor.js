// npm으로 받은 d3를 guide/vendor에 복사해.
// 가이드는 서버 없이 브라우저에서 바로 열어야 해서, 완성 파일을 저장소에 같이 올려둬.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(__dirname, 'node_modules', 'd3', 'dist', 'd3.min.js');
const outDir = path.join(root, 'guide', 'vendor');

if (!fs.existsSync(src)) {
  console.error('d3가 없다. tools 폴더에서 먼저 npm install을 실행한다.');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(src, path.join(outDir, 'd3.min.js'));
const version = require(path.join(__dirname, 'node_modules', 'd3', 'package.json')).version;
console.log(`d3 ${version} → guide/vendor/d3.min.js 복사 완료`);

// 키워드 검색 색인 생성기. 실행: npm run build (또는 node build-index.js)
// 각 페이지의 목차 링크(제목, data-tags)와 해당 섹션 본문에서 guide/search-index.js를 만든다.
// 홈페이지는 서버 없이 열리므로 다른 페이지를 읽어 올 수 없어서 색인을 파일로 미리 만들어 둔다.
const fs = require('fs');
const path = require('path');

const guide = path.join(__dirname, '..', 'guide');
const ORDER = ['vscode-guide', 'git', 'github', 'vscode', 'linux', 'network', 'keywords'];
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const plain = (h) => decode(h.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function generate() {
  const files = fs.readdirSync(guide).filter((f) => f.endsWith('.html'))
    .sort((a, b) => {
      const i = ORDER.indexOf(a.slice(0, -5)), j = ORDER.indexOf(b.slice(0, -5));
      return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || a.localeCompare(b);
    });
  const out = [];
  for (const f of files) {
    const html = fs.readFileSync(path.join(guide, f), 'utf8');
    const toc = html.match(/<(aside|nav)\b[^>]*(?:class="toc"|data-toc)[^>]*>([\s\S]*?)<\/\1>/);
    if (!toc) continue;
    const mainEnd = html.indexOf('</main>');
    const links = [...toc[2].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
      id: (m[1].match(/href="#([^"]+)"/) || [])[1],
      tags: ((m[1].match(/data-tags="([^"]*)"/) || [])[1] || '').split(/\s+/).filter(Boolean),
      title: plain(m[2]),
    })).filter((l) => l.id);
    const pos = links.map((l) => {
      const m = new RegExp('<[a-z0-9]+\\b[^>]*\\bid="' + l.id + '"').exec(html);
      return m ? m.index : -1;
    });
    links.forEach((l, i) => {
      if (pos[i] < 0) return;
      const next = pos.filter((p) => p > pos[i]).sort((a, b) => a - b)[0];
      const end = next !== undefined ? next : mainEnd > pos[i] ? mainEnd : html.length;
      // 섹션 제목(h2/h3)은 title과 중복이므로 본문 검색에서는 뺀다
      const body = plain(html.slice(pos[i], end).replace(/<h[23][\s\S]*?<\/h[23]>/, ' '));
      out.push({ p: f, id: l.id, t: l.title, g: l.tags, x: body.slice(0, 420) });
    });
  }
  return '/* 자동 생성 파일: tools 폴더에서 npm run build 로 만든다. 직접 고치지 않는다. */\n'
    + 'window.SEARCH_INDEX = ' + JSON.stringify(out, null, 0).replace(/\},\{/g, '},\n{') + ';\n';
}

module.exports = { generate };
if (require.main === module) {
  const text = generate();
  fs.writeFileSync(path.join(guide, 'search-index.js'), text);
  console.log(`색인 생성 · 항목 ${(text.match(/\{"p":/g) || []).length}개 → guide/search-index.js`);
}

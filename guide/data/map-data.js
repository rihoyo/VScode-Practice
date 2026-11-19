/* 기술 연결 지도 데이터 (브라우저와 Node 검사 스크립트가 함께 읽는다)
 * 새 기술을 배우면 NODES와 EDGES에 한 덩어리씩 추가하고, tools 폴더에서 `npm run check`를 실행한다.
 *  NODES  : 기술 하나. x,y는 처음 놓일 위치(이후 물리 엔진이 정리한다), c는 색, desc는 설명.
 *  EDGES  : 두 기술의 연결. dist는 두 노드 사이 기본 거리, steps.d는 1이면 a→b, -1이면 b→a.
 *  status : done(실습 완료) / doing(진행 중) / plan(예정). 마스터가 직접 확인한 것만 done으로 바꾼다.
 *  문체   : 설명문(desc, lead, t, what, why, ok)은 "~다." 로 끝낸다. how와 pkt는 짧은 구절로 쓴다.
 */
const MAP_DATA = {
  ST: {
    done: { t: '실습 완료', c: '#4ade80' },
    doing: { t: '진행 중', c: '#fbbf24' },
    plan: { t: '예정', c: '#7c8da1' },
  },

  NODES: {
    vscode: { name: 'VS Code', glyph: '</>', x: 0, y: 0, c: '#38bdf8', link: 'vscode.html',
      desc: '코드 편집기다. 파일을 열고 고치는 작업대이면서, Git과 AI를 한 화면에 모으는 허브 역할을 한다.' },
    git: { name: 'Git', glyph: 'git', x: 300, y: -70, c: '#fb7a55', link: 'git.html',
      desc: 'PC 안에서 파일의 변경 기록(커밋)을 쌓는 버전 관리 도구다.' },
    github: { name: 'GitHub', glyph: 'gh', x: 600, y: -90, c: '#c4a7ff', link: 'github.html',
      desc: 'Git 기록을 올려두는 온라인 저장소다. 백업과 PC 사이 동기화를 맡는다.' },
    pages: { name: 'GitHub Pages', glyph: 'www', x: 600, y: 100, c: '#a3e635', link: 'github.html#publish',
      desc: '저장소의 HTML 파일을 누구나 열 수 있는 웹 주소로 공개하는 GitHub의 기능이다.' },
    claude: { name: 'Claude', glyph: '✱', x: -260, y: 150, c: '#ffb27a', link: 'vscode.html#claude-code',
      desc: 'Anthropic의 AI 코딩 도우미(Claude Code)다. VS Code 확장이나 터미널(claude 명령)로 쓴다.' },
    codex: { name: 'Codex', glyph: 'cx', x: 120, y: 260, c: '#5eead4', link: 'vscode.html#next',
      desc: 'OpenAI의 AI 코딩 도우미다. 같은 저장소를 함께 보면서 작업한다.' },
    agents: { name: 'AGENTS.md', glyph: '.md', x: -60, y: 400, c: '#fbbf24',
      desc: '두 AI가 공통으로 읽는 규칙 파일이다. 저장소 안의 평범한 파일이라 커밋하면 GitHub로도 공유된다.' },
    nodejs: { name: 'Node.js', glyph: 'JS', x: -330, y: 300, c: '#86efac', link: 'vscode.html#claude-cli',
      desc: 'JavaScript 실행기다. npm으로 도구를 설치하고, 이 지도의 d3 물리 엔진도 npm으로 받았다.' },
    npm: { name: 'npm', glyph: 'npm', x: -430, y: 120, c: '#f87171',
      desc: 'Node.js에 딸린 패키지 설치 도구다. npm install 한 줄로 다른 사람이 만든 도구를 받아온다.' },
    d3: { name: 'd3', glyph: 'd3', x: -420, y: -60, c: '#fdba74',
      desc: '움직이는 그래프를 그리는 라이브러리다. 이 지도에서 노드가 밀고 당기며 움직이는 물리 계산을 맡는다.' },
    next: { name: '다음 배울 것', glyph: '?', x: 360, y: 200, c: '#7c8da1', ghost: true,
      desc: '새 기술을 배우면 이 지도에 노드와 연결이 늘어난다. 예: 워크트리, Figma MCP.' },
  },

  EDGES: [
    { id: 'vscode-git', a: 'vscode', b: 'git', status: 'done', label: '소스 제어', dist: 300,
      lead: 'VS Code가 Git을 직접 처리하는 것이 아니다. 버튼 뒤에서 PC에 설치된 Git을 불러서 쓴다.',
      steps: [
        { d: 1, pkt: '파일 저장', t: 'Ctrl+S로 저장하면 Git이 바뀐 줄을 알아챈다.' },
        { d: -1, pkt: '변경 목록', t: 'Git이 바뀐 파일 목록을 소스 제어 패널에 돌려준다.' },
        { d: 1, pkt: '+ 선택', t: '파일 옆 +를 눌러 이번 커밋에 넣을 파일을 고른다.' },
        { d: 1, pkt: '커밋', t: '메시지를 적고 커밋을 누르면 Git이 PC에 기록을 남긴다.' },
      ],
      what: '바뀐 파일 목록, 커밋 메시지, 커밋(변경 기록)이 오간다.',
      why: 'Git 명령어를 외우지 않고 클릭으로 버전을 기록하기 위해서다. PC에 Git이 설치돼 있어야 이 연결이 작동한다.',
      how: '왼쪽 소스 제어 → 변경 사항의 + → 메시지 입력 → 커밋',
      ok: '변경 사항 목록이 비고, 커밋 기록이 생긴다.',
      link: 'vscode.html#push' },

    { id: 'git-github', a: 'git', b: 'github', status: 'done', label: 'Push · Pull', dist: 290,
      lead: 'Git이 PC에 쌓은 기록을 GitHub와 주고받는 길이다.',
      steps: [
        { d: -1, pkt: 'Clone', t: 'GitHub의 파일과 기록을 PC로 처음 복제한다.' },
        { d: 1, pkt: 'Push', t: '커밋을 GitHub에 올린다. 백업과 공유가 한 번에 된다.' },
        { d: -1, pkt: 'Pull', t: '다른 PC나 AI가 올린 새 커밋을 받아온다.' },
      ],
      what: '커밋(변경 기록)과 저장소 전체 이력이 오간다.',
      why: 'PC가 고장 나도 기록이 남고, 집과 회사 PC가 같은 상태를 유지하기 위해서다.',
      how: 'Ctrl+Shift+P → Git: Clone / Git: Push / Git: Pull. 작업 전에는 Pull, 마칠 때는 Commit과 Push',
      ok: 'GitHub 저장소 페이지를 새로고침하면 방금 커밋이 보인다.',
      link: 'github.html#transfer' },

    { id: 'github-pages', a: 'github', b: 'pages', status: 'doing', label: '공개', dist: 230,
      lead: 'GitHub 저장소의 파일을 그대로 웹 주소로 내보내는 연결이다. 별도 서버를 만들지 않아도 된다.',
      steps: [
        { d: 1, pkt: '저장소 공개', t: 'Settings에서 저장소를 Public으로 바꾼다. 무료 계정의 Pages는 공개 저장소에서 쓰는 것으로 알려져 있다.' },
        { d: 1, pkt: 'Pages 설정', t: 'Source를 main 브랜치의 / (root)로 정하고 Save를 누른다.' },
        { d: 1, pkt: '배포', t: 'GitHub가 저장소의 index.html을 웹 주소로 올린다. Actions 탭에서 진행 상황이 보인다.' },
        { d: -1, pkt: '주소 접속', t: '계정이름.github.io/저장소이름/ 주소로 누구나 홈페이지를 열 수 있다.' },
      ],
      what: '저장소의 HTML, CSS, JS 파일이 웹 주소로 공개된다.',
      why: '집, 회사, 다른 사람의 기기에서도 로그인 없이 홈페이지를 열기 위해서다.',
      how: 'Settings → General에서 Make public → Settings → Pages에서 main, / (root) 선택 → Save',
      ok: '시크릿 창에서 주소를 열면 「나의 개발 스텝」이 보이고 지도가 움직인다.',
      link: 'github.html#publish' },

    { id: 'vscode-claude', a: 'vscode', b: 'claude', status: 'doing', label: '확장', dist: 250,
      lead: 'VS Code 안에 Claude 채팅창을 붙이는 연결이다. 생각은 클라우드에서, 파일 작업은 PC에서 한다.',
      steps: [
        { d: 1, pkt: '요청·코드', t: '채팅에 요청을 쓰면 선택한 코드와 읽은 파일 내용이 Anthropic 서버로 전달된다.' },
        { d: -1, pkt: '수정 제안', t: '서버의 Claude가 만든 답과 수정안이 돌아온다. 변경 비교(diff)로 보여 준다.' },
        { d: 1, pkt: '승인', t: '허용을 누르면 변경이 PC의 실제 파일에 적용된다.' },
      ],
      what: '요청, 선택한 코드, 수정 제안(diff)이 오간다.',
      why: '복사·붙여넣기 없이 편집기 안에서 AI에게 일을 맡기고, 바뀌는 내용을 눈으로 확인하기 위해서다.',
      how: 'Ctrl+Shift+X → Claude Code(게시자 Anthropic) 설치 → 편집기 오른쪽 위 ✱ → 로그인',
      ok: '채팅창이 열리고 요청하면 답이 온다.',
      link: 'vscode.html#claude-code' },

    { id: 'vscode-codex', a: 'vscode', b: 'codex', status: 'done', label: '확장', dist: 240,
      lead: 'Claude와 같은 방식으로 Codex 채팅창을 VS Code에 붙인다. 같은 저장소를 다른 AI의 눈으로도 볼 수 있다.',
      steps: [
        { d: 1, pkt: '요청·코드', t: '채팅에 요청을 쓰면 선택한 코드와 파일 내용이 전달된다.' },
        { d: -1, pkt: '수정 제안', t: 'Codex가 만든 답과 수정안이 돌아온다.' },
        { d: 1, pkt: '승인', t: '허용하면 PC의 파일에 적용된다.' },
      ],
      what: '요청, 선택한 코드, 수정 제안이 오간다.',
      why: '작업을 나눠 맡기고 서로의 결과를 비교하기 위해서다. 단 같은 폴더를 동시에 고치면 꼬일 수 있다.',
      how: 'Ctrl+Shift+X → @id:openai.chatgpt 검색 → OpenAI 게시 확장 설치 → 로그인',
      ok: 'Codex 채팅이 열리고 README.md를 읽는다.',
      link: 'vscode.html#next' },

    { id: 'claude-agents', a: 'claude', b: 'agents', status: 'done', label: '공통 규칙', dist: 230,
      lead: 'Claude는 CLAUDE.md를 먼저 읽는다. 그 안의 @AGENTS.md 한 줄이 공통 규칙을 통째로 불러온다.',
      steps: [
        { d: 1, pkt: 'CLAUDE.md 열기', t: '작업을 시작하면 Claude가 저장소의 CLAUDE.md를 읽는다.' },
        { d: 1, pkt: '@AGENTS.md', t: '파일 안의 @AGENTS.md 줄이 규칙 파일을 가져온다.' },
        { d: -1, pkt: '규칙 적용', t: '말투와 작업 방식이 Claude의 지침이 된다.' },
      ],
      what: '말투, 작업 순서 같은 공통 규칙 텍스트가 오간다.',
      why: '규칙을 한 곳에만 써서 AI마다 따로 고치지 않기 위해서다.',
      how: 'CLAUDE.md 첫 줄에 @AGENTS.md를 적는다.',
      ok: '새 대화에서도 Claude가 AGENTS.md의 규칙대로 말하고 일한다.' },

    { id: 'codex-agents', a: 'codex', b: 'agents', status: 'done', label: '공통 규칙', dist: 190,
      lead: 'Codex는 저장소의 AGENTS.md를 직접 찾아 읽는다. 따로 연결할 설정은 없다.',
      steps: [
        { d: 1, pkt: 'AGENTS.md 열기', t: 'Codex가 저장소 루트의 AGENTS.md를 찾아 읽는다.' },
        { d: -1, pkt: '규칙 적용', t: '규칙이 Codex의 작업 지침이 된다.' },
      ],
      what: '공통 규칙 텍스트가 오간다.',
      why: '두 AI가 같은 규칙으로 일하게 하기 위해서다.',
      how: 'AGENTS.md에 규칙을 쓰면 끝난다.',
      ok: 'Codex가 규칙대로 말하고 일한다.' },

    { id: 'agents-git', a: 'agents', b: 'git', status: 'done', label: '규칙 공유', dist: 380,
      lead: '규칙 파일도 평범한 파일이다. 커밋하면 코드와 똑같이 기록되고 GitHub로 퍼진다.',
      steps: [
        { d: 1, pkt: '규칙 수정', t: 'AGENTS.md를 고치면 Git이 변경을 감지한다.' },
        { d: 1, pkt: '커밋·Push', t: '커밋하고 푸시하면 GitHub를 거쳐 다른 PC에도 전달된다.' },
        { d: -1, pkt: '최신 규칙', t: '다른 PC에서 Pull하면 같은 규칙이 반영된다.' },
      ],
      what: 'AGENTS.md의 변경 내용이 오간다.',
      why: '집과 회사, Claude와 Codex가 항상 같은 규칙을 보게 하기 위해서다.',
      how: '규칙을 고친 뒤 소스 제어에서 커밋하고 Push',
      ok: 'GitHub에서 AGENTS.md를 열면 고친 내용이 보인다.' },

    { id: 'nodejs-npm', a: 'nodejs', b: 'npm', status: 'done', label: '번들', dist: 190,
      lead: 'npm은 Node.js를 설치하면 함께 깔린다. Node.js가 실행기라면 npm은 그 위의 앱스토어 같은 도구다.',
      steps: [
        { d: 1, pkt: 'Node.js 설치', t: 'nodejs.org에서 LTS 버전을 설치한다.' },
        { d: 1, pkt: 'npm 함께 설치', t: '설치 파일 안에 npm이 들어 있어서 따로 받을 필요가 없다.' },
        { d: -1, pkt: 'npm -v', t: '터미널에서 npm -v를 입력하면 버전 숫자가 보인다.' },
      ],
      what: '설치 프로그램과 버전 정보가 오간다.',
      why: 'JavaScript 도구를 명령 한 줄로 받으려면 둘 다 필요하기 때문이다.',
      how: '터미널에서 node -v와 npm -v를 각각 실행',
      ok: '두 명령 모두 버전 숫자가 나온다.' },

    { id: 'npm-d3', a: 'npm', b: 'd3', status: 'doing', label: 'npm install', dist: 230,
      lead: 'npm으로 d3를 받아서, 이 지도의 노드를 밀고 당기는 물리 계산에 쓴다.',
      steps: [
        { d: 1, pkt: 'npm install', t: 'tools 폴더에서 npm install을 실행하면 node_modules에 d3가 내려온다.' },
        { d: 1, pkt: 'npm run build', t: 'build가 완성 파일을 guide/vendor로 복사한다. 서버 없이 열리게 하기 위해서다.' },
        { d: -1, pkt: '지도 실행', t: '개요 페이지가 d3를 읽으면 노드가 움직이기 시작한다.' },
      ],
      what: 'd3 패키지(d3.min.js)가 오간다.',
      why: '물리 엔진을 직접 만들지 않고 검증된 도구를 가져다 쓰기 위해서다.',
      how: 'cd tools → npm install → npm run build → 브라우저에서 개요 페이지 새로고침',
      ok: '지도의 노드가 떠다니고, 드래그하면 따라오며 밀려난다.' },

    { id: 'nodejs-claude', a: 'nodejs', b: 'claude', status: 'plan', label: 'npm 설치', dist: 300,
      lead: 'npm 방식으로 Claude CLI를 설치할 때만 필요하다. 네이티브 설치를 쓰면 Node.js 없이도 된다.',
      steps: [
        { d: 1, pkt: 'npm install', t: '터미널에서 npm install -g @anthropic-ai/claude-code를 실행한다.' },
        { d: 1, pkt: '명령 등록', t: '설치가 끝나면 터미널이 claude 명령을 알게 된다.' },
        { d: 1, pkt: '로그인', t: '처음 claude를 실행하면 로그인 안내가 나온다.' },
      ],
      what: '설치 패키지(@anthropic-ai/claude-code)가 오간다.',
      why: 'Claude를 VS Code 확장이 아닌 터미널에서도 쓰고 싶을 때를 위해서다.',
      how: 'node -v 확인 → npm install -g @anthropic-ai/claude-code → claude --version',
      ok: 'claude --version이 버전 숫자를 보여 준다.',
      link: 'vscode.html#claude-cli' },
  ],
};

if (typeof module !== 'undefined') module.exports = MAP_DATA;

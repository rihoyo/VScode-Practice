/* AI 페이지 · 7장 "어디서 도느냐"와 "여러 환경용 md 설계"
 * #where: 컴퓨터 네 대(내 PC, GitHub, 클라우드 작업 컴퓨터, 모델 서버) 사이로 기억과 결과가 흐르는 순서를 재생한다.
 * #reach: 기억이 놓인 곳 × 환경 표. #hub: 원본 하나에서 환경마다 이어 붙이는 구조 그림.
 * 내용은 BOXES, ENVS(단계), REACH만 고치면 된다. */
(() => {
  const where = document.getElementById('where');
  if (!where) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 컴퓨터와 그 안의 것들. k는 단계에서 불을 켤 때 쓰는 이름
  const BOXES = [
    { id: 'pc', name: '내 PC', sub: '내가 앉아 있는 컴퓨터', items: [
      ['screen', '화면 · 터미널, VS Code, 브라우저'],
      ['repo', '저장소 폴더의 md'],
      ['home', '~/.claude · ~/.codex'],
      ['auto', '자동 메모리 · 지난 대화'],
    ] },
    { id: 'gh', name: 'GitHub', sub: '원격 저장소', items: [
      ['pushed', 'Push된 저장소와 md'],
      ['branch', '브랜치 · 풀 리퀘스트'],
    ] },
    { id: 'vm', name: '클라우드 작업 컴퓨터', sub: '회사가 빌려주는 VM·컨테이너', items: [
      ['clone', '새로 클론한 저장소와 md'],
      ['run', '명령 실행 · 파일 수정'],
    ] },
    { id: 'llm', name: '모델 서버', sub: 'Anthropic · OpenAI', items: [
      ['think', '모델 · 생각하고 다음 행동을 정함'],
      ['chatmem', '프로젝트 지침·파일 · 계정 메모리'],
    ] },
  ];

  // 단계: [출발, 도착, 설명, 켜는 것들]. 출발과 도착이 같으면 그 컴퓨터 안에서 일어나는 일이다
  const ENVS = {
    local: {
      name: '로컬', tools: '터미널 · VS Code 확장 · 데스크톱 앱 Code(로컬 세션)',
      steps: [
        ['pc', 'pc', '시작하면 내 PC의 저장소 md, ~/.claude·~/.codex, 자동 메모리를 읽는다. Push하지 않은 수정도 그대로 읽힌다.', ['repo', 'home', 'auto']],
        ['pc', 'llm', '읽은 글과 내 요청을 모델 서버로 보낸다.', ['think']],
        ['llm', 'pc', '모델이 "이 파일을 열어라, 이 명령을 돌려라" 같은 도구 호출을 돌려준다.', ['think']],
        ['pc', 'pc', '도구는 내 PC에서 돈다. 파일을 고치고 명령을 실행하고, 결과를 다시 모델에 보낸다. 끝날 때까지 2~4를 되풀이한다.', ['repo', 'screen']],
        ['pc', 'gh', '결과는 내 PC 파일에 바로 남는다. 다른 곳과 나누려면 내가 커밋하고 Push한다.', ['pushed']],
      ],
      out: '내 PC의 파일이 바로 바뀐다',
    },
    cloud: {
      name: '클라우드 코딩', tools: 'claude.ai/code · 데스크톱 앱 Code(클라우드 세션) · Codex 웹',
      steps: [
        ['pc', 'gh', '규칙 md를 고쳤다면 먼저 Push한다. 클라우드는 내 PC 폴더를 볼 수 없다.', ['repo', 'pushed']],
        ['pc', 'vm', '브라우저에서 작업을 보낸다. 내 PC는 화면 역할만 한다.', ['screen']],
        ['gh', 'vm', '저장소를 새로 클론하고 그 안의 md를 읽는다. 내 PC의 ~/.claude, 자동 메모리, CLAUDE.local.md는 없다.', ['clone']],
        ['vm', 'llm', '생각은 모델 서버가 하고, 명령 실행과 파일 수정은 클라우드 작업 컴퓨터가 한다.', ['think', 'run']],
        ['vm', 'gh', '바뀐 내용을 브랜치에 Push하거나 풀 리퀘스트를 연다.', ['branch']],
        ['gh', 'pc', '내 PC에 반영하려면 Pull한다. 그전까지 내 PC 파일은 그대로다.', ['repo']],
      ],
      out: 'GitHub 브랜치에 남고, 내 PC는 Pull해야 바뀐다',
    },
    chat: {
      name: '일반 채팅', tools: 'claude.ai 채팅 · ChatGPT 채팅',
      steps: [
        ['pc', 'llm', '브라우저에서 질문을 보낸다.', ['screen']],
        ['llm', 'llm', '모델 서버가 그 프로젝트의 지침과 파일, 계정 메모리를 함께 넣는다. 저장소의 md는 스스로 읽지 않는다.', ['chatmem', 'think']],
        ['llm', 'pc', '답변 글이 돌아온다.', ['screen']],
        ['pc', 'pc', '파일은 바뀌지 않는다. 필요하면 내가 복사해서 저장한다.', []],
      ],
      out: '답변 글만 온다. 파일은 내가 옮긴다',
    },
  };

  where.innerHTML = `
<div class="wh-bar">${Object.entries(ENVS).map(([k, e]) => `<button type="button" data-env="${k}"><b>${e.name}</b><small>${e.tools}</small></button>`).join('')}</div>
<div class="wh-map">${BOXES.map((b) => `<div class="wh-box" data-box="${b.id}"><div class="wh-bh"><b>${b.name}</b><small>${b.sub}</small></div><ul>${b.items.map(([k, t]) => `<li data-k="${k}">${t}</li>`).join('')}</ul></div>`).join('')}<i class="wh-dot"></i></div>
<div class="wh-foot"><ol class="wh-steps"></ol><div class="wh-out"><span>결과</span><b></b><button type="button" class="wh-again">↻ 다시 재생</button></div></div>`;
  const $ = (q) => where.querySelector(q);
  const map = $('.wh-map'), dot = $('.wh-dot');
  let env = null, token = 0;

  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  function center(id) {
    const m = map.getBoundingClientRect(), r = map.querySelector(`[data-box="${id}"] .wh-bh`).getBoundingClientRect();
    return [r.left - m.left + r.width / 2, r.top - m.top + r.height / 2];
  }
  async function move(a, b) {
    const [x1, y1] = center(a), [x2, y2] = center(b);
    dot.style.opacity = 1;
    if (reduce) { dot.style.transform = `translate(${x2}px,${y2}px)`; return; }
    const same = a === b;
    const frames = same
      ? [{ transform: `translate(${x1}px,${y1}px) scale(1)` }, { transform: `translate(${x1}px,${y1}px) scale(2.4)`, opacity: .4 }, { transform: `translate(${x1}px,${y1}px) scale(1)` }]
      : [{ transform: `translate(${x1}px,${y1}px)` }, { transform: `translate(${(x1 + x2) / 2}px,${Math.min(y1, y2) - 34}px)`, offset: .5 }, { transform: `translate(${x2}px,${y2}px)` }];
    const anim = dot.animate(frames, { duration: same ? 560 : 640, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
    // 숨은 탭에서는 완료 신호가 늦을 수 있어 시간 제한을 둔다
    await Promise.race([anim.finished, new Promise((r) => setTimeout(r, 800))]);
  }

  async function play(k) {
    const my = ++token;
    env = k;
    const e = ENVS[k];
    where.dataset.env = k;
    where.querySelectorAll('[data-env]').forEach((b) => b.classList.toggle('on', b.dataset.env === k));
    // 이 환경에서 쓰는 컴퓨터와 항목만 남기고 흐리게
    const usedBox = new Set(e.steps.flatMap((s) => [s[0], s[1]]));
    const usedK = new Set(e.steps.flatMap((s) => s[3]));
    where.querySelectorAll('.wh-box').forEach((b) => b.classList.toggle('off', !usedBox.has(b.dataset.box)));
    where.querySelectorAll('.wh-box li').forEach((li) => { li.classList.remove('lit'); li.classList.toggle('off', !usedK.has(li.dataset.k)); });
    const list = $('.wh-steps');
    list.innerHTML = e.steps.map((s, i) => `<li><span>${i + 1}</span>${s[2]}</li>`).join('');
    $('.wh-out b').textContent = e.out;
    where.classList.remove('done');
    for (let i = 0; i < e.steps.length; i++) {
      if (my !== token) return;
      const [a, b, , lit] = e.steps[i];
      list.children[i].classList.add('now');
      where.querySelectorAll('.wh-box').forEach((x) => x.classList.toggle('hot', x.dataset.box === a || x.dataset.box === b));
      await move(a, b);
      if (my !== token) return;
      lit.forEach((key) => where.querySelectorAll(`li[data-k="${key}"]`).forEach((li) => li.classList.add('lit')));
      await wait(700);
      list.children[i].classList.replace('now', 'past');
    }
    if (my !== token) return;
    where.querySelectorAll('.wh-box').forEach((x) => x.classList.remove('hot'));
    dot.style.opacity = 0;
    where.classList.add('done');
  }

  where.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-env]');
    if (b) play(b.dataset.env);
    else if (ev.target.closest('.wh-again') && env) play(env);
  });
  // 처음에는 첫 환경의 그림만 보여 주고, 재생은 누를 때 한다
  (() => {
    const e = ENVS.local;
    where.dataset.env = 'local';
    where.querySelector('[data-env="local"]').classList.add('on');
    $('.wh-steps').innerHTML = e.steps.map((s, i) => `<li><span>${i + 1}</span>${s[2]}</li>`).join('');
    $('.wh-out b').textContent = e.out;
    env = 'local';
  })();

  // ── 닿는 범위 표 ──
  // 칸: [기호, 설명]. o 읽음 · h 조건부 · x 닿지 않음
  const COLS = ['로컬', '클라우드 코딩', '일반 채팅'];
  const REACH = [
    ['저장소의 CLAUDE.md · AGENTS.md', ['o', '디스크 그대로'], ['o', 'Push된 것만'], ['x', '직접 올려야 한다']],
    ['하위 폴더의 md', ['o', '그 폴더에서 일할 때'], ['h', '클론에 있다. 읽는 시점은 확인 전'], ['x', '']],
    ['CLAUDE.local.md', ['o', '이 PC에서만'], ['x', 'Git에 올리지 않아 클론에 없다'], ['x', '']],
    ['~/.claude · ~/.codex 개인 규칙', ['o', '이 PC의 나'], ['h', 'Claude는 설정 스크립트로 넣을 수 있다'], ['x', '']],
    ['자동 메모리 · Codex 메모리', ['o', 'Codex는 켰을 때만'], ['x', '다른 컴퓨터와 공유되지 않는다'], ['x', '']],
    ['채팅 프로젝트 지침·파일', ['x', ''], ['x', ''], ['o', '그 프로젝트 안에서만']],
    ['채팅 계정 메모리 · 맞춤 지침', ['x', ''], ['x', ''], ['o', '끌 수 있다. 프로젝트별로 나뉜다']],
    ['채팅에 직접 넣은 글', ['o', '그 채팅만'], ['o', '그 채팅만'], ['o', '그 채팅만']],
  ];
  const SYM = { o: '●', h: '◐', x: '✕' };
  const reach = document.getElementById('reach');
  if (reach) {
    reach.innerHTML = `<table><thead><tr><th>기억이 놓인 곳</th>${COLS.map((c, i) => `<th data-c="${i}">${c}</th>`).join('')}</tr></thead><tbody>${
      REACH.map(([name, ...cells]) => `<tr><th>${name}</th>${cells.map(([s, t], i) => `<td class="r-${s}" data-c="${i}"><b>${SYM[s]}</b>${t ? `<small>${t}</small>` : ''}</td>`).join('')}</tr>`).join('')
    }</tbody></table><p class="reach-key"><span class="r-o">● 읽는다</span><span class="r-h">◐ 조건이 있다</span><span class="r-x">✕ 닿지 않는다</span></p>`;
    reach.addEventListener('mouseover', (ev) => {
      const tr = ev.target.closest('tbody tr');
      reach.querySelectorAll('tbody tr').forEach((r) => r.classList.toggle('focus', r === tr));
      reach.classList.toggle('focusing', !!tr);
    });
    reach.addEventListener('mouseleave', () => { reach.classList.remove('focusing'); reach.querySelectorAll('tr.focus').forEach((r) => r.classList.remove('focus')); });
  }

  // ── 원본 하나 → 환경마다 잇는 구조 ──
  const hub = document.getElementById('hub');
  if (hub) {
    hub.innerHTML = `
<div class="hb-src"><small>원본 · 저장소</small><b>AGENTS.md</b><em>모두가 같이 쓰는 규칙</em></div>
<div class="hb-lanes">
  <div class="hb-lane"><i class="hb-wire"></i><span class="hb-how">그대로 읽음<br><code>CLAUDE.md</code> = <code>@AGENTS.md</code></span><div class="hb-env"><b>로컬</b><small>Claude Code · Codex</small></div><div class="hb-me"><small>개인 층</small><code>~/.claude/CLAUDE.md</code><code>CLAUDE.local.md</code><code>~/.codex/AGENTS.md</code></div></div>
  <div class="hb-lane"><i class="hb-wire"></i><span class="hb-how">Push → 클론<br>Push한 버전만</span><div class="hb-env"><b>클라우드 코딩</b><small>claude.ai/code · Codex 웹</small></div><div class="hb-me"><small>개인 층</small><code>내 환경의 설정 스크립트</code><span>공유 환경에는 넣지 않는다</span></div></div>
  <div class="hb-lane dash"><i class="hb-wire"></i><span class="hb-how">손으로 올림<br>원본이 바뀌면 다시</span><div class="hb-env"><b>일반 채팅</b><small>claude.ai · ChatGPT 프로젝트</small></div><div class="hb-me"><small>개인 층</small><code>계정 메모리</code><code>맞춤 지침</code></div></div>
</div>`;
  }
})();

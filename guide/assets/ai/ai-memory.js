/* AI 페이지 · 6장 기억 시뮬레이터
 * 도구(Claude Code 로컬·클라우드 / Codex 로컬·Cloud)와 상황을 고르고 "새 채팅 시작"을 누르면,
 * 디스크의 파일이 차례대로 빛나며 컨텍스트 창으로 날아 들어간다. 못 읽는 파일은 이유를 단다.
 * 내용은 SOURCES(어디에 무엇이 있나)와 rule()(그 상황에서 읽히나)만 고치면 된다. */
(() => {
  const root = document.getElementById('mem-sim');
  if (!root) return;

  // 범위 층: 바깥일수록 넓다
  const LAYERS = {
    claude: [
      ['org', '회사 관리 정책', '모든 사용자'],
      ['user', 'PC 사용자 폴더 · C:\\Users\\사용자\\.claude', '이 PC의 나'],
      ['repo', '저장소 폴더 · Git 루트', '저장소를 받은 모두'],
      ['sub', '하위 폴더 · guide/', '그 폴더에서 일할 때'],
    ],
    ccloud: [
      ['user', '내 PC · C:\\Users\\사용자\\.claude', '클라우드로 가지 않음'],
      ['repo', '클라우드 VM · GitHub에서 새로 클론', 'Push된 내용만'],
      ['sub', '하위 폴더 · guide/', '그 폴더에서 일할 때'],
    ],
    codex: [
      ['user', 'PC 사용자 폴더 · C:\\Users\\사용자\\.codex', '이 PC의 나'],
      ['repo', '저장소 폴더 · Git 루트', '저장소를 받은 모두'],
      ['sub', '하위 폴더 · guide/', '그 폴더에서 일할 때'],
    ],
    cloud: [
      ['user', '내 PC · C:\\Users\\사용자\\.codex', '클라우드로 가지 않음'],
      ['repo', '클라우드 컨테이너 · 선택한 브랜치', 'Push된 내용만'],
      ['sub', '하위 폴더 · guide/', '그 폴더에서 일할 때'],
    ],
  };

  // when: start(시작 때) · opt(있을 때만, 시작 때) · demand(그 폴더 파일을 열 때) · cwd(시작 폴더일 때) · off(켜야 씀) · resume(재개할 때) · never
  const SOURCES = {
    claude: [
      { id: 'policy', layer: 'org', name: 'CLAUDE.md', path: 'C:\\Program Files\\ClaudeCode\\', when: 'opt', what: '회사가 배포한 규칙이다. 사용자가 끌 수 없다.' },
      { id: 'user', layer: 'user', name: 'CLAUDE.md · rules/', path: '~/.claude/', when: 'start', what: '내 모든 프로젝트에 적용하는 개인 규칙이다.' },
      { id: 'proj', layer: 'repo', name: 'CLAUDE.md → @AGENTS.md', path: '저장소 루트', when: 'start', what: '팀이 공유하는 규칙이다. 시작 폴더와 그 위 폴더를 모두 읽고, @경로로 다른 파일을 끌어온다(최대 4단계).' },
      { id: 'local', layer: 'repo', name: 'CLAUDE.local.md', path: '저장소 루트', when: 'opt', what: '이 프로젝트에서 나만 쓰는 규칙이다. .gitignore에 넣는다.' },
      { id: 'mem', layer: 'user', name: 'memory/MEMORY.md', path: '~/.claude/projects/<저장소>/', when: 'start', what: '자동 메모리 목차다. 앞 200줄(25KB)까지 읽고, 주제 파일은 필요할 때 연다. 저장소 단위라 하위 폴더와 worktree가 같이 쓴다.' },
      { id: 'sub', layer: 'sub', name: 'guide/CLAUDE.md', path: 'guide/', when: 'demand', what: '시작 때는 읽지 않는다. 그 폴더의 파일을 읽거나 고치는 순간 읽는다.' },
      { id: 'log', layer: 'chat', name: '<세션>.jsonl', path: '~/.claude/projects/<저장소>/', when: 'resume', what: '대화 전체 기록이다. --continue나 --resume으로 이어 갈 때만 다시 쓴다.' },
    ],
    ccloud: [
      { id: 'pc', layer: 'user', name: 'CLAUDE.md · memory/ · 설정', path: '~/.claude/', when: 'never', what: '내 PC에만 있는 개인 규칙, 자동 메모리, 개인 설정이다. 클라우드 VM은 저장소를 새로 클론해서 시작하므로 이 파일이 없다. 내 환경의 설정 스크립트로 ~/.claude/CLAUDE.md를 만들어 넣을 수는 있다.' },
      { id: 'proj', layer: 'repo', name: 'CLAUDE.md → @AGENTS.md', path: '클론한 저장소 루트', when: 'start', what: 'GitHub 저장소를 새로 클론한 것이라 그 안의 CLAUDE.md와 .claude/rules/를 읽는다. 내 PC에서 고치고 Push하지 않은 내용은 없다.' },
      { id: 'local', layer: 'repo', name: 'CLAUDE.local.md', path: '저장소 루트', when: 'never', miss: '.gitignore로 빠진 파일이라 클론에 없다(확인 전)', what: '내 PC의 저장소 폴더에만 있는 개인 규칙이다. Git에 올리지 않으므로 클론에 들어 있지 않다.' },
      { id: 'sub', layer: 'sub', name: 'guide/CLAUDE.md', path: 'guide/', when: 'demand', what: '클론에 들어 있으므로 로컬처럼 그 폴더 파일을 열 때 읽는 것으로 보인다(확인 전).' },
      { id: 'log', layer: 'chat', name: '그 클라우드 세션', path: 'claude.ai/code', when: 'resume', what: '이어 가는 클라우드 세션의 대화다. claude --teleport로 터미널에 가져오면 그때부터는 따로 갈라진 로컬 복사본이 된다.' },
    ],
    codex: [
      { id: 'user', layer: 'user', name: 'AGENTS.md', path: '~/.codex/', when: 'start', what: '내 모든 프로젝트 규칙이다. AGENTS.override.md가 있으면 그것 하나만 쓴다.' },
      { id: 'mems', layer: 'user', name: 'memories_v2/', path: '~/.codex/', when: 'off', what: '지난 채팅에서 고른 요약이다. 기본은 꺼져 있고, 규칙이 아니라 회상용이다.' },
      { id: 'proj', layer: 'repo', name: 'AGENTS.md', path: '저장소 루트', when: 'start', what: 'Git 루트부터 시작 폴더까지 내려오며 폴더마다 하나씩 읽는다. 합계 32KiB까지다.' },
      { id: 'sub', layer: 'sub', name: 'guide/AGENTS.md', path: 'guide/', when: 'cwd', what: '시작 폴더가 guide/일 때 시작과 함께 읽는다. 시작 폴더보다 아래는 찾지 않는다.' },
      { id: 'log', layer: 'chat', name: 'sessions/', path: '~/.codex/', when: 'resume', what: '대화 기록이다. 채팅을 재개하면 이어 쓰고, 새 채팅은 이어받지 않는다.' },
    ],
    cloud: [
      { id: 'pc', layer: 'user', name: 'AGENTS.md · memories', path: '~/.codex/', when: 'never', what: '내 PC에만 있는 파일이다. 클라우드 컨테이너는 이 파일을 보지 못한다.' },
      { id: 'proj', layer: 'repo', name: 'AGENTS.md', path: '브랜치의 루트', when: 'start', what: '선택한 브랜치에 Push된 버전을 읽는다. 내 PC에서 고치고 Push하지 않은 내용은 없다.' },
      { id: 'sub', layer: 'sub', name: 'guide/AGENTS.md', path: 'guide/', when: 'cwd', what: '시작 폴더가 guide/일 때 함께 읽는다.' },
      { id: 'log', layer: 'chat', name: '그 Cloud 채팅', path: '클라우드', when: 'resume', what: '이어 가는 Cloud 채팅의 대화다. 새 채팅은 이어받지 않는다.' },
    ],
  };

  const SCENES = [
    ['new', '같은 폴더에서 새 채팅'],
    ['sub', 'guide/에서 작업'],
    ['moved', '저장소 폴더를 옮긴 뒤'],
    ['other', '다른 PC·다른 사용자'],
    ['resume', '지난 채팅 이어 가기'],
  ];

  const SUMMARY = {
    claude: {
      new: '규칙 파일과 자동 메모리 목차가 들어온다. 지난 대화는 들어오지 않는다.',
      sub: '시작 때는 루트 규칙만 읽고, guide/ 파일을 여는 순간 guide/CLAUDE.md가 뒤따라 들어온다.',
      moved: '저장소 안 파일은 같이 옮겨져 그대로 읽힌다. 자동 메모리는 저장소 경로로 찾기 때문에 빈 메모리로 시작하는 것으로 보인다(확인 전, 주석 참고).',
      other: '저장소 파일만 같다. 개인 규칙, 자동 메모리, 지난 대화는 그 사람 PC에 따로 쌓인다.',
      resume: '새 채팅과 같은 파일에 더해, 이어 가는 채팅의 기록이 다시 들어온다.',
    },
    ccloud: {
      new: '클론한 저장소의 CLAUDE.md만 들어온다. 내 PC의 ~/.claude(개인 규칙, 자동 메모리, 개인 설정)는 오지 않는다.',
      sub: '루트 CLAUDE.md를 먼저 읽고, guide/ 파일을 열면 guide/CLAUDE.md가 뒤따르는 것으로 보인다(확인 전).',
      moved: '클라우드는 내 PC 경로가 아니라 GitHub 저장소로 찾는다. 결과는 새 채팅과 같다.',
      other: '같은 저장소와 브랜치면 같은 CLAUDE.md를 읽는다. 사람마다 다른 값은 채팅에 직접 넘기거나 각자 환경의 설정 스크립트로 넣는다.',
      resume: '이어 가는 클라우드 세션의 대화가 다시 들어온다. --resume은 클라우드 세션을 보여 주지 않고, 터미널로 가져올 때는 --teleport를 쓴다.',
    },
    codex: {
      new: '전역 지침과 저장소 지침이 들어온다. 메모리는 켜 둔 경우에만 참고한다.',
      sub: '루트 AGENTS.md를 읽고 guide/AGENTS.md를 뒤에 읽는다. 가까운 쪽이 충돌 시 이긴다.',
      moved: '저장소 안 지침은 같이 옮겨진다. 시작 폴더를 새 경로로 다시 열면 된다.',
      other: '저장소 지침만 같다. ~/.codex의 지침과 기록은 그 사람 PC에 따로 있다.',
      resume: '재개한 채팅의 기록을 이어서 쓴다.',
    },
    cloud: {
      new: '선택한 브랜치의 AGENTS.md만 들어온다. 내 PC의 ~/.codex는 오지 않는다.',
      sub: '브랜치의 루트 AGENTS.md 다음에 guide/AGENTS.md를 읽는다.',
      moved: '클라우드는 내 PC 경로가 아니라 저장소와 브랜치로 찾는다. 결과는 새 채팅과 같다.',
      other: '같은 저장소와 브랜치를 고르면 같은 지침을 읽는다. 사람마다 다른 값은 채팅을 시작할 때 직접 넘긴다.',
      resume: '이어 가는 Cloud 채팅의 대화가 다시 들어온다.',
    },
  };

  // 이 상황에서 그 파일이 읽히나: load(시작 때) · later(나중에) · skip(이 상황에선 안 읽음) · miss(찾지 못함)
  function rule(tool, s, scene) {
    const userSide = s.layer === 'user' || s.layer === 'org';
    const cloud = tool === 'cloud' || tool === 'ccloud';
    if (s.when === 'never') return ['miss', s.miss || '내 PC 파일이라 클라우드에 없다'];
    if (scene === 'other' && !cloud && (userSide || s.id === 'log')) return ['miss', '다른 PC·사용자에게는 이 파일이 없다'];
    if (scene === 'moved' && s.id === 'mem') return ['miss', '저장소 경로가 바뀌어 다른 메모리 폴더를 찾는다'];
    if (s.when === 'off') return ['skip', '켰을 때만 참고한다(기본 꺼짐)'];
    if (s.when === 'resume') return scene === 'resume' ? ['load', '이어 가는 채팅의 기록이다'] : ['skip', '새 채팅은 지난 대화를 이어받지 않는다'];
    if (s.when === 'demand') return scene === 'sub' ? ['later', 'guide/ 파일을 연 순간 읽는다'] : ['skip', '그 폴더 파일을 열기 전에는 읽지 않는다'];
    if (s.when === 'cwd') return scene === 'sub' ? ['load', '시작 폴더라 함께 읽는다'] : ['skip', '시작 폴더보다 아래는 읽지 않는다'];
    if (s.when === 'opt') return ['load', '파일이 있을 때만 읽는다'];
    return ['load', ''];
  }

  const LAYER_LABEL = { chat: '지난 채팅 기록 · 범위: 그 채팅 하나' };
  let tool = 'claude', scene = 'new', running = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.innerHTML = `
<div class="ms-bar">
  <div class="ms-tools" role="tablist" aria-label="도구"></div>
  <div class="ms-scenes" role="group" aria-label="상황"></div>
  <button type="button" class="ms-run">▶ 새 채팅 시작</button>
</div>
<div class="ms-body">
  <div class="ms-disk"><b class="ms-cap">디스크에 남아 있는 것</b><div class="ms-layers"></div><div class="ms-chat"></div></div>
  <div class="ms-flow" aria-hidden="true"><span></span></div>
  <div class="ms-ctx"><b class="ms-cap">새 채팅의 컨텍스트 창</b><div class="ms-model">모델은 이 창 안의 글만 안다</div><ol class="ms-slots"></ol></div>
</div>
<ol class="ms-log" aria-live="polite"></ol>`;
  const $ = (q) => root.querySelector(q);

  $('.ms-tools').innerHTML = [['claude', 'Claude Code 로컬'], ['ccloud', 'Claude Code 클라우드'], ['codex', 'Codex 로컬'], ['cloud', 'Codex Cloud']]
    .map(([k, t]) => `<button type="button" role="tab" data-tool="${k}" class="t-${k}">${t}</button>`).join('');
  $('.ms-scenes').innerHTML = SCENES.map(([k, t]) => `<button type="button" data-scene="${k}">${t}</button>`).join('');

  function card(s) {
    return `<div class="ms-file" data-id="${s.id}" tabindex="0"><code>${s.name}</code><small>${s.path}</small><i class="ms-why"></i><span class="ms-tip">${s.what}</span></div>`;
  }

  function draw() {
    running++;
    root.dataset.tool = tool;
    root.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tool === tool)));
    root.querySelectorAll('[data-scene]').forEach((b) => b.classList.toggle('on', b.dataset.scene === scene));
    const src = SOURCES[tool];
    // 층을 바깥에서 안으로 겹쳐 그린다
    let html = '';
    LAYERS[tool].forEach(([k, title, who]) => {
      html += `<div class="ms-layer l-${k}"><div class="ms-lh"><span>${title}</span><em>${who}</em></div><div class="ms-files">${src.filter((s) => s.layer === k).map(card).join('')}</div>`;
    });
    html += '</div>'.repeat(LAYERS[tool].length);
    $('.ms-layers').innerHTML = html;
    $('.ms-chat').innerHTML = `<div class="ms-layer l-chat"><div class="ms-lh"><span>${LAYER_LABEL.chat}</span><em>재개할 때만</em></div><div class="ms-files">${src.filter((s) => s.layer === 'chat').map(card).join('')}</div></div>`;
    $('.ms-slots').innerHTML = '<li class="ms-sys">시스템 지시 · 도구 설명</li>';
    $('.ms-log').innerHTML = '<li class="ms-hint">위에서 도구와 상황을 고르고 <b>▶ 새 채팅 시작</b>을 누른다. 파일에 마우스를 올리면 무엇인지 나온다.</li>';
    root.classList.remove('done');
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  async function fly(el, slot) {
    if (reduce) return;
    const a = el.getBoundingClientRect(), b = slot.getBoundingClientRect();
    const g = el.cloneNode(true);
    g.className = 'ms-file ms-ghost';
    g.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
    document.body.appendChild(g);
    const dx = b.left - a.left, dy = b.top - a.top;
    // 탭이 숨겨지면 애니메이션 완료 신호가 늦게 올 수 있어 0.7초 뒤에는 그냥 넘어간다
    const anim = g.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px,${dy * 0.55 - 26}px) scale(.92)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px,${dy}px) scale(${b.width / a.width},${b.height / a.height})`, opacity: 0.2 },
    ], { duration: 520, easing: 'cubic-bezier(.5,0,.2,1)' });
    await Promise.race([anim.finished, new Promise((r) => setTimeout(r, 700))]);
    g.remove();
  }

  async function run() {
    draw();
    const my = running;
    const src = SOURCES[tool];
    const slots = $('.ms-slots'), log = $('.ms-log');
    log.innerHTML = '';
    let n = 0;
    const plan = src.map((s) => [s, ...rule(tool, s, scene)]);
    // 못 읽는 파일은 먼저 흐리게 표시해 둔다
    plan.forEach(([s, st, why]) => {
      const el = root.querySelector(`.ms-file[data-id="${s.id}"]`);
      if (st === 'skip' || st === 'miss') { el.classList.add(st); el.querySelector('.ms-why').textContent = why; }
    });
    const step = async (s, why, late) => {
      if (my !== running) return;
      const el = root.querySelector(`.ms-file[data-id="${s.id}"]`);
      el.classList.add('hot');
      const li = document.createElement('li');
      li.className = 'ms-slot' + (late ? ' late' : '');
      li.innerHTML = `<span>${++n}</span><code>${s.name}</code>${late ? '<em>나중에</em>' : ''}`;
      li.style.visibility = 'hidden';
      slots.appendChild(li);
      await fly(el, li);
      if (my !== running) return;
      li.style.visibility = '';
      el.classList.remove('hot'); el.classList.add('read');
      if (why) el.querySelector('.ms-why').textContent = why;
      const row = document.createElement('li');
      row.innerHTML = `<b>${n}.</b> <code>${s.name}</code> · ${s.what}${why ? ' <span>(' + why + ')</span>' : ''}`;
      log.appendChild(row);
      await wait(160);
    };
    for (const [s, st, why] of plan) if (st === 'load') await step(s, why);
    const late = plan.filter(([, st]) => st === 'later');
    if (late.length && my === running) {
      const gap = document.createElement('li');
      gap.className = 'ms-gap';
      gap.textContent = '… 작업 중 guide/index 파일을 연다';
      slots.appendChild(gap);
      await wait(500);
      for (const [s, , why] of late) await step(s, why, true);
    }
    if (my !== running) return;
    plan.filter(([, st]) => st === 'skip' || st === 'miss').forEach(([s, st, why]) => {
      const row = document.createElement('li');
      row.className = 'ms-' + st;
      row.innerHTML = `<b>${st === 'miss' ? '없음' : '안 읽음'}</b> <code>${s.name}</code> · ${why}`;
      log.appendChild(row);
    });
    const sum = document.createElement('li');
    sum.className = 'ms-sum';
    sum.innerHTML = '<b>정리</b> ' + SUMMARY[tool][scene];
    log.appendChild(sum);
    root.classList.add('done');
  }

  root.addEventListener('click', (e) => {
    // root에도 data-tool이 붙어 있으므로 버튼으로 한정한다
    const t = e.target.closest('button[data-tool]'), sc = e.target.closest('button[data-scene]');
    if (t) { tool = t.dataset.tool; draw(); }
    else if (sc) { scene = sc.dataset.scene; draw(); }
    else if (e.target.closest('.ms-run')) run();
  });
  draw();
})();

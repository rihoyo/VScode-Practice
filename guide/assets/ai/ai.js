/* AI 페이지 · 화면 구성과 실습 시뮬레이션
 * 데이터(요금제, 업데이트)는 data/ai-data.js, 실습 여섯 개는 아래 LABS에 있다. 모든 실습은 이 페이지 안의 시뮬레이션이고
 * 저장하지 않는다(새로고침하면 처음으로 돌아간다). 숫자와 규칙은 개념을 보이려고 단순화한 값이다. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.AI_DATA;
  if (!D) return;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const exp3 = (a, b, c) => `<div class="exp"><div><b>일어난 일</b>${a}</div><div><b>달라진 점</b>${b}</div><div><b>왜 그런가</b>${c}</div></div>`;

  /* ── 머리·업데이트·출처 ── */
  const sn = D.snap;
  $('#snap').innerHTML = `<div class="cl"><b>${sn.claude.name} ${sn.claude.ver}</b><span>${sn.claude.date} 릴리스</span></div><div class="cx"><b>${sn.codex.name} ${sn.codex.ver}</b><span>${sn.codex.date} 릴리스</span></div>`;
  const upd = (tool, name, color, span) => `<div style="--tc:var(${color})"><h4>${name}<small>${span}</small></h4><ol>${D.updates[tool].map((u) => `<li><b>${esc(u[0])}</b><time>${esc(u[1])}</time><p>${esc(u[2])}</p><p class="sowhat">${esc(u[3])}</p></li>`).join('')}</ol></div>`;
  $('#upd').innerHTML = upd('claude', 'Claude Code', '--cl', '2.1.323 → 2.1.331') + upd('codex', 'Codex CLI·앱', '--cx', '0.167 → 0.172');
  $('#src').innerHTML = D.sources.map((s) => `<li><a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join('');

  /* ── 플랜 ── */
  const P = { tool: 'claude', sel: 1 };
  const cell = (v, sel) => { const s = sel ? ' sel' : ''; return v === 'o' ? `<td class="y${s}">✔</td>` : v === 'x' ? `<td class="n${s}">—</td>` : v === '?' ? `<td class="q${s}" title="공식 페이지에서 확인하지 못했다">?</td>` : `<td class="${s.trim()}">${esc(v)}</td>`; };
  const has = (v) => v !== 'x' && v !== '?';
  function renderPlans() {
    const T = D.plans[P.tool], tc = P.tool === 'claude' ? 'var(--cl)' : 'var(--cx)', cols = T.cols, i = Math.min(P.sel, cols.length - 1), cur = cols[i];
    const open = T.rows.filter((r) => has(r[1][i])).map((r) => `${r[0]}${r[1][i] === 'o' ? '' : ': ' + r[1][i]}`);
    const added = T.rows.filter((r) => i > 0 && has(r[1][i]) && !has(r[1][i - 1])).map((r) => `${r[0]}${r[1][i] === 'o' ? '' : ': ' + r[1][i]}`);
    const shut = T.rows.filter((r) => r[1][i] === 'x').map((r) => r[0]);
    $('#plans').style.setProperty('--tc', tc);
    $('#plans').innerHTML = `<div class="sw"><button class="btn cl ${P.tool === 'claude' ? 'on' : ''}" data-tool="claude">Claude Code</button><button class="btn cx ${P.tool === 'codex' ? 'on' : ''}" data-tool="codex">Codex</button></div>
      <div class="pc">${cols.map((c, k) => `<button class="pcard ${k === i ? 'on' : ''}" data-sel="${k}"><b>${esc(c.name)}</b><span class="pr">${esc(c.price)}</span><small>${esc(c.sub)}</small></button>`).join('')}</div>
      <div class="unlock"><div><h4>${esc(cur.name)}에서 열리는 것</h4><ul>${open.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>없다</li>'}</ul></div>
      <div><h4>${i > 0 ? esc(cols[i - 1].name) + '보다 더해지는 것' : '아직 막힌 것'}</h4><ul>${(i > 0 ? added : shut).map((x) => `<li>${esc(x)}</li>`).join('') || '<li>이전 단계와 차이가 없다(또는 확인하지 못했다)</li>'}</ul>${i > 0 && shut.length ? `<h4 style="margin-top:.7rem">여기서도 막힌 것</h4><ul>${shut.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></div>
      <div class="mxp"><table><thead><tr><th>기능</th>${cols.map((c, k) => `<th class="${k === i ? 'sel' : ''}">${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${T.rows.map((r) => `<tr><td>${esc(r[0])}</td>${r[1].map((v, k) => cell(v, k === i)).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="pick"><h4>나는 어떤 플랜일까</h4>${T.pick.map((p, k) => `<button class="btn" data-pick="${k}">${esc(p[0])}</button>`).join('')}<p id="pickout">위에서 상황을 고르면 맞는 플랜을 골라 준다.</p></div>
      <p class="note" style="margin-top:.8rem">${esc(T.note)}</p>`;
  }
  $('#plans').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tool]'), s = e.target.closest('[data-sel]'), k = e.target.closest('[data-pick]');
    if (t) { P.tool = t.dataset.tool; P.sel = P.tool === 'claude' ? 1 : 2; renderPlans(); }
    else if (s) { P.sel = +s.dataset.sel; renderPlans(); }
    else if (k) { const T = D.plans[P.tool], p = T.pick[+k.dataset.pick], idx = T.cols.findIndex((c) => c.id === p[1]); P.sel = Math.max(0, idx); renderPlans(); const o = $('#pickout'); o.innerHTML = `<b>${esc(T.cols[P.sel].name)}</b> · ${esc(p[2])}`; $$('[data-pick]')[+k.dataset.pick].classList.add('on'); }
  });
  renderPlans();

  /* ── 실습 공통 ── */
  const UI = (name) => $(`[data-ui="${name}"]`);
  const LABS = {};

  /* 실습 1: 지시문 */
  LABS.rules = (root) => {
    const R = [
      ['수정한 뒤에는 npm run check를 실행한다.', 'check'],
      ['설명문은 "~다."로 끝낸다.', 'style'],
      ['guide/ 밖의 파일은 고치지 않는다.', 'scope'],
      ['커밋은 하지 않는다.', 'commit'],
    ], on = new Set();
    root.innerHTML = `<div class="lg"><div class="ctl"><h4>지시문 파일(CLAUDE.md / AGENTS.md)</h4>${R.map((r, i) => `<label class="chk"><input type="checkbox" data-r="${r[1]}"><span>${esc(r[0])}</span></label>`).join('')}<h4 style="margin-top:.8rem">고정된 요청</h4><div class="tx" style="min-height:0">3d-test.html의 제목을 바꾸고 마무리해 줘.</div></div><div class="out"><h4>에이전트가 한 일</h4><div class="tx" data-o="tx"></div></div></div><div data-o="exp"></div>`;
    const draw = () => {
      const n = on.size, L = [];
      L.push(['u', '> 3d-test.html의 제목을 바꾸고 마무리해 줘.'], ['r', '· 3d-test.html 읽는 중'], ['a', '· <title>을 "3D 학습 길"로 수정']);
      L.push(on.has('scope') ? ['s', '· guide/ 밖 파일은 규칙에 따라 건드리지 않음'] : ['w', '· ../index.html의 링크 문구도 같이 고침  (범위 밖 변경)']);
      L.push(on.has('check') ? ['t', '$ npm run check'] : ['w', '· 검증 없이 완료를 보고함  (깨졌는지 아무도 모름)']);
      if (on.has('check')) L.push(['s', '검사 통과 · 페이지 9개']);
      L.push(on.has('commit') ? ['s', '· 커밋하지 않고 변경 파일만 보고'] : ['w', '$ git commit -m "update title"  (연습 중인 커밋을 대신 해 버림)']);
      L.push(['a', on.has('style') ? '제목을 "3D 학습 길"로 바꿨다.' + (on.has('check') ? ' 검사는 통과했다.' : '') : '제목 바꿨어요~ 다 됐습니다!' + (on.has('check') ? ' 검사도 통과했어요!' : '')]);
      $('[data-o=tx]', root).innerHTML = L.map((l) => `<div class="${l[0]}">${esc(l[1])}</div>`).join('');
      const out = on.has('scope') ? 0 : 1, risks = [!on.has('check') && '검증 없음', !on.has('scope') && '범위 밖 파일 변경', !on.has('commit') && '무단 커밋'].filter(Boolean);
      $('[data-o=exp]', root).innerHTML = exp3(
        n ? `규칙 ${n}개가 켜진 채로 같은 요청을 처리했다. 에이전트는 시작할 때 이 규칙을 읽고 그 틀 안에서 행동했다.` : '규칙이 하나도 없다. 에이전트는 가장 그럴듯한 행동을 스스로 추측했다.',
        `검증 ${on.has('check') ? '실행함' : '건너뜀'} · 범위 밖 변경 ${out}개 · 커밋 ${on.has('commit') ? '안 함' : '함'} · 문체 ${on.has('style') ? '~다.' : '제각각'}`,
        risks.length ? `꺼진 규칙 때문에 <b>${risks.join(', ')}</b>이(가) 생길 수 있다. 사람이 매번 말하지 않으려면 지시문 파일에 한 줄로 적어 둔다.` : '네 규칙이 모두 켜져 결과가 예측 가능하다. 지시문은 사람이 바뀌어도 같은 방식으로 일하게 만든다.');
    };
    root.addEventListener('change', (e) => { const c = e.target.closest('[data-r]'); if (!c) return; c.checked ? on.add(c.dataset.r) : on.delete(c.dataset.r); draw(); });
    draw();
  };

  /* 실습 2: 컨텍스트 */
  LABS.context = (root) => {
    let win = 200, S = { base: 18, instr: 3, files: 0, logs: 0, chat: 0, sum: 0 }, last = null;
    const CAT = [['base', '고정(시스템·도구)', '#6d7a8c'], ['instr', '지시문 파일', '#9db5ff'], ['files', '읽은 파일', '#46c9a3'], ['logs', '명령 출력', '#f0b34a'], ['chat', '대화', '#e9855f'], ['sum', '압축 요약', '#c39bff']];
    const A = {
      instr: ['지시문 파일을 한 번 더 읽었다.', 3, '지시문은 세션마다 읽히는 고정 비용이다. 길수록 매번 이 값이 커지므로 짧게 쓰고 자세한 내용은 파일 경로로 가리킨다.'],
      files: ['파일 5개를 통째로 읽었다.', 25, '읽은 파일은 계속 컨텍스트에 남는다. 필요한 줄 범위만 읽게 하면 줄일 수 있다.'],
      logs: ['테스트 로그 전체가 들어왔다.', 40, '출력 전체를 붙이면 가장 크게 찬다. 실패한 줄만 보게 하거나 출력을 잘라 준다.'],
      chat: ['대화를 10턴 이어 갔다.', 20, '대화는 턴마다 쌓인다. 같은 일을 이어 가는 중이라면 /compact가 맞는다.'],
    };
    root.innerHTML = `<div class="ctl" style="margin-bottom:.8rem"><button class="btn ${win === 200 ? 'on' : ''}" data-w="200">창 200K</button><button class="btn" data-w="1000">창 1M</button> <span style="color:var(--mute);font-size:.82rem">창 크기는 모델과 플랜마다 다르다</span></div>
      <div data-o="bar"></div><div class="legend" data-o="leg"></div>
      <div><button class="btn" data-a="instr">지시문 읽기 +3K</button><button class="btn" data-a="files">파일 5개 읽기 +25K</button><button class="btn" data-a="logs">테스트 로그 통째로 +40K</button><button class="btn" data-a="chat">대화 10턴 +20K</button><button class="btn cl" data-a="compact">/compact</button><button class="btn cx" data-a="clear">/clear (Codex는 /new)</button></div>
      <div data-o="exp"></div>`;
    const total = () => Object.values(S).reduce((a, b) => a + b, 0);
    const draw = () => {
      const used = total(), pct = Math.min(100, Math.round(used / win * 100)), cls = used / win >= 0.8 ? 'bad' : used / win >= 0.6 ? 'warn' : '';
      $('[data-o=bar]', root).innerHTML = `<div class="bar ${cls}">${CAT.map((c) => `<i style="width:${Math.min(100, S[c[0]] / win * 100)}%;background:${c[2]}"></i>`).join('')}<em>${used}K / ${win >= 1000 ? '1M' : win + 'K'} (${Math.round(used / win * 100)}%)</em></div><div style="font-size:.88rem;color:${cls === 'bad' ? 'var(--bad)' : cls === 'warn' ? 'var(--warn)' : 'var(--ok)'}">${used > win ? '넘쳤다: 오래된 내용이 밀려나고 자동 압축이 일어난다.' : cls === 'bad' ? '80%를 넘었다. 앞에서 정한 지시를 놓치기 쉽다.' : cls === 'warn' ? '슬슬 정리할 때다.' : '여유가 있다.'}</div>`;
      $('[data-o=leg]', root).innerHTML = CAT.map((c) => `<span style="--c:${c[2]}">${c[1]} ${S[c[0]]}K</span>`).join('');
      $('[data-o=exp]', root).innerHTML = last ? exp3(last[0], last[1], last[2]) : exp3('아직 아무것도 하지 않았다. 고정 부분과 지시문만 차 있다.', '위 버튼을 눌러 컨텍스트가 차는 것을 본다.', '컨텍스트는 대화, 파일, 출력이 모두 쌓이는 한 칸짜리 작업대다.');
    };
    root.addEventListener('click', (e) => {
      const w = e.target.closest('[data-w]'), a = e.target.closest('[data-a]');
      if (w) { win = +w.dataset.w; $$('[data-w]', root).forEach((b) => b.classList.toggle('on', b === w)); draw(); return; }
      if (!a) return;
      const before = total(), k = a.dataset.a;
      if (A[k]) { S[k === 'instr' ? 'instr' : k] += A[k][1]; last = [A[k][0], `${before}K → ${total()}K (+${A[k][1]}K)`, A[k][2]]; }
      else if (k === 'compact') { const old = S.files + S.logs + S.chat + S.sum; S.sum = Math.round(old * 0.12); S.files = S.logs = S.chat = 0; last = ['지금까지의 대화를 요약으로 바꿨다. 읽은 파일, 출력, 대화가 하나의 짧은 요약이 됐다.', `${before}K → ${total()}K (${total() - before}K)`, '자리를 비워 같은 일을 계속하게 한다. 요약에서 세부가 빠질 수 있으니 일이 바뀌었다면 /clear가 낫다.']; }
      else { S = { base: 18, instr: 3, files: 0, logs: 0, chat: 0, sum: 0 }; last = ['대화를 전부 비우고 새로 시작했다. 지시문 파일만 다시 읽혔다.', `${before}K → ${total()}K`, '일이 바뀌면 이전 대화는 오히려 방해다. 새로 시작하면 빠르고 싸고 정확하다.']; }
      draw();
    });
    draw();
  };

  /* 실습 3: 권한 */
  LABS.perm = (root) => {
    const ACT = ['프로젝트 파일 읽기', '프로젝트 파일 수정', '테스트 실행(npm run check)', '패키지 설치(인터넷)', '프로젝트 밖 폴더 삭제(rm -rf ~/old)', 'git push(인터넷)'];
    const M = {
      claude: [
        ['기본(매번 확인)', 'o a a a a a', '읽기만 그냥 하고, 고치거나 실행하는 것은 매번 묻는다. 가장 안전하지만 눌러야 할 일이 많다.'],
        ['편집 자동 수락', 'o o a a a a', '프로젝트 파일 수정은 묻지 않는다. 명령 실행은 여전히 묻는다. 글과 코드를 많이 고치는 날에 맞는다.'],
        ['plan(계획만)', 'o n n n n n', '읽기와 계획만 한다. 고치거나 실행하는 것은 막힌다. 낯선 코드를 탐색할 때 안전하다.'],
        ['auto(분류기)', 'o o o a n a', '안전해 보이는 행동은 자동으로 하고 위험한 행동은 묻거나 막는다. 11-17 이후 모드를 정하지 않은 세션의 시작 모드다.'],
        ['우회(모두 허용) ⚠', 'o o o o o o', '아무것도 묻지 않는다. 폴더 밖 삭제와 푸시도 그냥 지나가므로 격리된 환경이 아니면 쓰지 않는다.'],
      ],
      codex: [
        ['읽기 전용 + 필요 시 승인', 'o a a a a a', '샌드박스가 읽기만 허락한다. 쓰려면 승인을 받아 샌드박스 밖으로 나간다.'],
        ['작업 폴더 쓰기 + 필요 시 승인', 'o o o a a a', '작업 폴더 안의 수정과 테스트는 그냥 하고, 인터넷과 폴더 밖은 묻는다. 일상 작업의 기본 균형이다.'],
        ['작업 폴더 쓰기 + 묻지 않음', 'o o o n n n', '묻지 않고 샌드박스 안에서만 한다. 밖으로 나가는 시도는 막힌다. 자동 실행(exec)에 맞는다.'],
        ['전체 접근 + 묻지 않음 ⚠', 'o o o o o o', '샌드박스도 승인도 없다. 폴더 밖 삭제와 푸시도 그냥 지나간다. 격리된 환경이 아니면 쓰지 않는다.'],
      ],
    };
    let tool = 'claude', sel = 1, prev = null;
    const lab = { o: '자동', a: '확인', n: '막힘' }, cls = { o: 'ok', a: 'ask', n: 'no' };
    const draw = () => {
      const ms = M[tool], cur = ms[Math.min(sel, ms.length - 1)], c = cur[1].split(' '), p = prev ? M[prev[0]][prev[1]][1].split(' ') : null;
      const cnt = (x) => c.filter((v) => v === x).length;
      const diff = p && prev[0] === tool ? [] : [];
      root.innerHTML = `<div class="ctl"><button class="btn cl ${tool === 'claude' ? 'on' : ''}" data-t="claude">Claude Code</button><button class="btn cx ${tool === 'codex' ? 'on' : ''}" data-t="codex">Codex</button></div>
        <div class="mxp"><table class="mx"><thead><tr><th>행동</th>${ms.map((m, i) => `<th><button class="btn ${i === sel ? 'on' : ''} ${tool === 'claude' ? 'cl' : 'cx'}" data-m="${i}">${esc(m[0])}</button></th>`).join('')}</tr></thead>
        <tbody>${ACT.map((a, r) => `<tr><th>${esc(a)}</th>${ms.map((m, i) => { const v = m[1].split(' ')[r]; return `<td class="${cls[v]}" style="${i === sel ? 'background:rgba(157,181,255,.1)' : ''}">${lab[v]}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
        ${exp3(`<b>${esc(cur[0])}</b>를 고르면 여섯 행동 중 ${cnt('o')}개는 자동, ${cnt('a')}개는 확인, ${cnt('n')}개는 막힌다.`,
          prev && prev[0] === tool && prev[1] !== sel ? `직전 모드와 달라진 행동: ${ACT.filter((a, i) => p[i] !== c[i]).map(esc).join(', ') || '없음'}` : '다른 모드를 눌러 달라지는 칸을 비교해 본다.', esc(cur[2]))}`;
    };
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]'), m = e.target.closest('[data-m]');
      if (t) { prev = null; tool = t.dataset.t; sel = tool === 'claude' ? 1 : 1; draw(); }
      else if (m) { prev = [tool, sel]; sel = +m.dataset.m; draw(); }
    });
    draw();
  };

  /* 실습 4: 훅 */
  LABS.hook = (root) => {
    let hook = false, timer = [];
    root.innerHTML = `<div class="ctl"><label class="chk" style="max-width:26rem"><input type="checkbox" data-h><span>PostToolUse 훅으로 파일을 고칠 때마다 <code>npm run check</code>를 자동 실행한다</span></label><button class="btn on" data-play>▶ 재생</button></div><div class="tx" data-o="tx" style="margin-top:.6rem"></div><div data-o="exp"></div>`;
    const SC = {
      no: [['u', '> 로그인 버튼 색을 파란색으로 바꿔 줘'], ['a', '· style.css 수정:  colour: #1d6fb8;   ← 속성 이름 오타'], ['s', '✔ 색을 파란색으로 바꿨다.'], ['e', '[사람이 확인] 화면을 열어 보니 색이 그대로다. 오타가 남아 있다.']],
      yes: [['u', '> 로그인 버튼 색을 파란색으로 바꿔 줘'], ['a', '· style.css 수정:  colour: #1d6fb8;   ← 속성 이름 오타'], ['t', '$ npm run check   (PostToolUse 훅이 자동으로 실행)'], ['e', '✖ style.css:12 알 수 없는 속성 "colour"'], ['r', '· 실패 결과가 에이전트에게 곧바로 돌아옴'], ['a', '· colour → color 로 수정'], ['t', '$ npm run check   (훅이 다시 자동 실행)'], ['s', '검사 통과'], ['s', '✔ 색을 바꿨고 검사까지 통과했다.']],
    };
    const exp = () => $('[data-o=exp]', root).innerHTML = exp3(
      hook ? '파일을 고치자마자 훅이 검사를 돌렸고, 실패가 에이전트에게 돌아가서 스스로 오타를 고쳤다.' : '오타가 난 수정이 그대로 "완료"로 보고됐다. 아무도 검사를 돌리지 않았다.',
      hook ? '오타가 사람 눈에 닿기 전에 잡혔다. 사람이 한 일은 없다.' : '문제는 사람이 직접 화면을 열어 본 뒤에야 드러났다.',
      '지시문의 "검사를 돌려라"는 부탁이라 어길 수 있다. 훅은 코드가 대신 실행하므로 빼먹지 않는다. Codex는 훅 대신 지시문, 승인 검토자, CI 단계에서 같은 검사를 거는 식으로 풀어 간다.');
    const play = () => {
      timer.forEach(clearTimeout); timer = []; const box = $('[data-o=tx]', root); box.innerHTML = '';
      SC[hook ? 'yes' : 'no'].forEach((l, i) => timer.push(setTimeout(() => { box.insertAdjacentHTML('beforeend', `<div class="${l[0]}">${esc(l[1])}</div>`); }, i * (matchMedia('(prefers-reduced-motion:reduce)').matches ? 0 : 520))));
      exp();
    };
    root.addEventListener('change', (e) => { if (e.target.closest('[data-h]')) { hook = e.target.checked; play(); } });
    root.addEventListener('click', (e) => { if (e.target.closest('[data-play]')) play(); });
    play();
  };

  /* 실습 5: 서브에이전트 */
  LABS.sub = (root) => {
    root.innerHTML = `<div class="ctl"><h4>읽을 파일 수: <b data-o="n">30</b>개 (파일당 약 3K 토큰으로 가정)</h4><input type="range" min="5" max="80" value="30" data-r></div><div data-o="bars"></div><div data-o="exp"></div>`;
    const draw = () => {
      const n = +$('[data-r]', root).value, base = 20, read = n * 3, direct = base + read + 1, viaSub = base + 2, win = 200;
      $('[data-o=n]', root).textContent = n;
      const bar = (label, parts, total) => `<div style="margin-top:.7rem;font-size:.84rem;color:var(--mute)">${label}</div><div class="bar ${total / win >= 0.8 ? 'bad' : total / win >= 0.6 ? 'warn' : ''}">${parts.map((p) => `<i style="width:${Math.min(100, p[0] / win * 100)}%;background:${p[1]}"></i>`).join('')}<em>${total}K / 200K</em></div>`;
      $('[data-o=bars]', root).innerHTML = bar('직접 탐색: 내 컨텍스트에 파일 내용이 전부 쌓인다', [[base, '#6d7a8c'], [read, '#46c9a3'], [1, '#e9855f']], direct) + bar('서브에이전트에게 맡김: 내 컨텍스트에는 요약만 온다', [[base, '#6d7a8c'], [2, '#c39bff']], viaSub) + `<div class="legend" style="margin-top:.5rem"><span style="--c:#6d7a8c">기존 작업 ${base}K</span><span style="--c:#46c9a3">읽은 파일 ${read}K</span><span style="--c:#c39bff">서브에이전트 요약 2K</span></div>`;
      $('[data-o=exp]', root).innerHTML = exp3(`인증 코드를 찾으려고 파일 ${n}개를 읽었다. 직접 읽으면 약 ${read}K가 내 컨텍스트에 남고, 서브에이전트가 읽으면 그 안에서만 쓰이고 요약 2K만 돌아온다.`, `내 컨텍스트: ${direct}K → ${viaSub}K (${direct - viaSub}K 절약).`, `탐색은 많이 읽고 조금만 남기는 일이다. 많이 읽은 내용을 내 작업대에 쌓으면 본 작업에 쓸 자리가 줄고, 80%를 넘으면 지시를 놓치기 쉽다. 서브에이전트는 서로 병렬로도 돌 수 있다.`);
    };
    root.addEventListener('input', draw); draw();
  };

  /* 실습 6: 자동 실행 */
  LABS.exec = (root) => {
    const TASK = { review: ['이번 브랜치의 변경을 리뷰해서 버그만 보고해 줘', '리뷰 결과를 받아 CI가 PR에 붙인다'], fix: ['npm run check가 실패하는 원인을 찾아 고쳐 줘', '실패하는 검사를 자동으로 고쳐 본다'], docs: ['README에서 오래된 명령을 찾아 목록만 만들어 줘', '문서와 코드가 어긋난 곳을 주기적으로 점검한다'] };
    let tool = 'claude', task = 'review', json = true, write = false;
    const draw = () => {
      const t = TASK[task][0];
      let cmd, parts;
      if (tool === 'claude') {
        const allow = write ? '"Read" "Edit" "Bash(npm run check)"' : '"Read" "Grep" "Glob"';
        cmd = `<span class="p">claude</span> <span class="f">-p</span> "${esc(t)}" <span class="f">--output-format</span> <span class="v">${json ? 'json' : 'text'}</span> <span class="f">--allowedTools</span> ${esc(allow)} <span class="f">--max-turns</span> <span class="v">8</span>`;
        parts = [['-p', '대화 없이 한 번만 실행하고 끝낸다(비대화형).'], ['--output-format ' + (json ? 'json' : 'text'), json ? '결과를 JSON으로 받아 다른 프로그램이 읽는다.' : '사람이 읽는 글로 받는다.'], ['--allowedTools', write ? '읽기, 수정, 지정한 검사 명령만 허락한다. 그 밖의 명령은 막힌다.' : '읽기와 검색만 허락한다. 파일은 바뀌지 않는다.'], ['--max-turns 8', '무한히 돌지 않게 단계 수에 상한을 둔다.']];
      } else {
        cmd = `<span class="p">codex exec</span> <span class="f">--sandbox</span> <span class="v">${write ? 'workspace-write' : 'read-only'}</span>${json ? ' <span class="f">--json</span>' : ''} "${esc(t)}"`;
        parts = [['codex exec', '대화 없이 한 번만 실행하고 끝낸다(비대화형).'], ['--sandbox ' + (write ? 'workspace-write' : 'read-only'), write ? '작업 폴더 안에서만 쓸 수 있다. 폴더 밖과 인터넷은 막힌다.' : '읽기만 된다. 파일은 바뀌지 않는다.'], ...(json ? [['--json', '진행을 한 줄에 이벤트 하나씩(JSONL)으로 내보내 다른 프로그램이 읽는다.']] : [])];
      }
      const ci = tool === 'claude' ? `- name: AI 점검\n  run: claude -p "${t}" --output-format json > result.json\n  env:\n    ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}` : `- name: AI 점검\n  run: codex exec --sandbox ${write ? 'workspace-write' : 'read-only'} "${t}"\n  env:\n    OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}`;
      root.innerHTML = `<div class="lg"><div class="ctl"><h4>도구</h4><button class="btn cl ${tool === 'claude' ? 'on' : ''}" data-t="claude">Claude Code</button><button class="btn cx ${tool === 'codex' ? 'on' : ''}" data-t="codex">Codex</button>
        <h4 style="margin-top:.8rem">작업</h4>${Object.entries(TASK).map(([k, v]) => `<button class="btn ${task === k ? 'on' : ''}" data-k="${k}">${esc(v[0].slice(0, 16))}…</button>`).join('')}
        <h4 style="margin-top:.8rem">출력과 권한</h4><label class="chk"><input type="checkbox" data-j ${json ? 'checked' : ''}><span>결과를 기계가 읽는 형식(JSON)으로 받는다</span></label><label class="chk"><input type="checkbox" data-w ${write ? 'checked' : ''}><span>파일 수정을 허락한다(끄면 읽기 전용)</span></label></div>
        <div class="out"><h4>만들어진 명령</h4><code class="cmd">${cmd}</code><ul class="parts">${parts.map((p) => `<li><code>${esc(p[0])}</code><span>${esc(p[1])}</span></li>`).join('')}</ul><h4>CI에서 쓰는 모양(GitHub Actions)</h4><code class="cmd">${esc(ci)}</code></div></div>
        ${exp3(`${esc(TASK[task][1])}. 사람이 앞에 없으니 <b>${write ? '필요한 수정과 검사만' : '읽기만'}</b> 허락한 상태로 한 번 돌고 끝난다.`, `권한을 ${write ? '작업 폴더 쓰기까지 넓혔다. 수정은 되지만 허락한 범위를 넘지 못한다.' : '읽기 전용으로 좁혔다. 보고서만 나오고 파일은 그대로다.'} 출력은 ${json ? '기계가 읽는 형식이라 다음 단계가 파싱할 수 있다.' : '사람이 읽는 글이다.'}`, '자동 실행에서는 아무도 승인 버튼을 눌러 주지 않는다. 그래서 권한을 처음부터 최소로 정하고, 키는 비밀값으로만 넣는다. 환경 변수 이름은 버전에 따라 달라질 수 있어 도구 문서를 확인한다.')}`;
    };
    root.addEventListener('click', (e) => { const t = e.target.closest('[data-t]'), k = e.target.closest('[data-k]'); if (t) { tool = t.dataset.t; draw(); } else if (k) { task = k.dataset.k; draw(); } });
    root.addEventListener('change', (e) => { if (e.target.closest('[data-j]')) { json = e.target.checked; draw(); } else if (e.target.closest('[data-w]')) { write = e.target.checked; draw(); } });
    draw();
  };

  $$('[data-ui]').forEach((el) => { const f = LABS[el.dataset.ui]; if (f) f(el); });
  if (window.GLOSSARY && window.GLOSSARY.annotate) window.GLOSSARY.annotate(document.querySelector('main'));
})();

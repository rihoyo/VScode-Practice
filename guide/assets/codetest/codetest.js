/* 코드 테스트 · 작업 중인 cmd 화면 연출
 * 1) run  : 연출 다섯 가지 중 하나가 돈다(단축키 1 수치 계산 · 2 LLM 연구 · 3 데이터 분석 에이전트 · 4 네트워크 진단 · 5 네트워크 보안).
 *           내용은 codetest-scenes.js. 한 구간(약 90~150초) 동안 같은 설정으로 돌다가 변주가 생기면 설정과 연출 비중을 새로 뽑아 다음 구간을 돈다.
 *           한 줄씩 나오다가, 이따금 로딩(점이 도는 줄, 진행 막대)을 하고, 이따금 빠르게 텍스트가 지나간다.
 * 2) edit : 클릭하거나 1~5 말고 아무 키나 누르면 수정 모드. 키를 칠 때마다 파이썬 코드가 써진다(의미는 없다).
 *           Backspace는 지우고, Enter를 누르면 저장하고 다시 1)로 돌아간다.
 * 개발 중 콘솔: __ct.shift()(바로 변주), __ct.go(3)(연출 바꾸기).
 * 전부 DOM 줄 추가와 글자 갱신만 하고 서버와 라이브러리가 없다. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const scr = $('#screen'), ed = $('#editor'), edBody = $('#ed-body'), ttl = $('#ttl'), kbd = $('#kbd'), term = $('#term');
  if (!scr || !window.CT_SCENES) return;
  const R = Math.random, ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = (a) => a[(R() * a.length) | 0], rf = (a, b) => a + R() * (b - a);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const C = (c, t) => `<span class="${c}">${esc(t)}</span>`;
  const fx = (x, d = 4) => Number(x).toFixed(d);
  const sci = (x, d = 2) => Number(x).toExponential(d).replace(/e([+-])(\d)$/, 'e$10$2');
  const pad = (n, w, ch = '0') => String(n).padStart(w, ch);
  const stamp = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)},${pad(d.getMilliseconds(), 3)}`; };
  let mode = 'run', tok = 0;
  const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const frame = () => new Promise((ok) => requestAnimationFrame(ok));

  /* ── 화면 줄 ── */
  const add = (html, cls) => {
    const d = document.createElement('div'); d.className = 'l' + (cls ? ' ' + cls : ''); d.innerHTML = html === '' ? '&nbsp;' : html; scr.append(d);
    while (scr.childElementCount > 160) scr.firstElementChild.remove(); // 화면 아래에 붙어 있어서 오래된 줄은 위에서 사라진다
    return d;
  };
  const PROMPT = 'C:\\Users\\dev\\project>';
  const prompt = (cmd) => add(C('d', PROMPT) + C('w', cmd));
  const stickBottom = () => { scr.scrollTop = scr.scrollHeight; };

  /* ── 연출과 구간(변주) ── */
  const SC = window.CT_SCENES({ R, ri, rf, pick, C, esc, fx, sci, pad, stamp });
  let S, st, P, phaseEnd = 0;
  const phaseLen = () => rf(90, 150) * 1000; // 한 구간 길이. 끝나면 변주가 생긴다
  function useScene(k) { S = SC[k]; S.key = String(k); st = S.init(); P = S.phase(st); phaseEnd = performance.now() + phaseLen(); ttl.textContent = 'C:\\WINDOWS\\system32\\cmd.exe - ' + S.first; }
  const wsum = () => P.w.reduce((s, w) => s + w[1], 0);
  const pickGen = () => { let r = R() * wsum(); for (const [k, w] of P.w) { if ((r -= w) < 0) return k; } return P.w[0][0]; };
  const sp = (ms) => ms / P.speed;

  /* ── 로딩 연출: 점이 도는 줄과 진행 막대 ── */
  const SP = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
  async function spin(t) {
    const label = pick(S.spin), ms = sp(ri(800, 2300)), line = add(''), t0 = performance.now(); let i = 0;
    while (t === tok && performance.now() - t0 < ms) { line.innerHTML = C('c', SP[i++ % SP.length]) + ' ' + esc(label) + C('d', '...'); stickBottom(); await sleep(80); }
    if (t !== tok) return;
    line.innerHTML = C('g', '✔') + ' ' + esc(label) + C('d', ' ... done ') + C('d', `(${fx(rf(1, 90), 1)} MB in ${fx(ms / 1000, 2)}s)`);
  }
  const BL = ' ▏▎▍▌▋▊▉█';
  async function bar(t) {
    const label = S.bar(st, P), total = ri(80, 600), dur = sp(ri(1400, 3400)), line = add(''), t0 = performance.now(), rate = rf(8, 60); let p = 0;
    while (t === tok && p < 1) {
      const u = Math.min(1, (performance.now() - t0) / dur); p = Math.min(1, u + Math.sin(u * 9) * 0.015 * (1 - u));
      const w = 24, full = Math.floor(p * w), part = BL[Math.floor((p * w - full) * 8)];
      const cur = Math.round(p * total), eta = Math.max(0, Math.round((1 - p) * dur / 1000));
      line.innerHTML = C('w', label + ': ') + C('w', String(Math.round(p * 100)).padStart(3) + '%') + C('d', '|') + C('g', '█'.repeat(full) + (full < w ? part : '')) + ' '.repeat(Math.max(0, w - full - 1)) + C('d', `| ${cur}/${total} [00:${pad(Math.round(u * dur / 1000), 2)}<00:${pad(eta, 2)}, ${fx(rate * (0.8 + 0.4 * Math.sin(u * 7)), 1)}it/s]`);
      stickBottom(); await sleep(60);
    }
    if (t !== tok) return;
    line.innerHTML = C('w', label + ': 100%') + C('d', '|') + C('g', '█'.repeat(24)) + C('d', `| ${total}/${total} [00:${pad(Math.round(dur / 1000), 2)}<00:00, ${fx(rate, 1)}it/s]`);
  }

  /* ── 실행 연출 루프: 한 줄씩 → 가끔 로딩 → 가끔 빠르게 지나감 → 구간이 끝나면 변주 ── */
  async function emit(lines, t) {
    for (const l of lines) {
      if (t !== tok) return;
      if (l.s) { // 글자를 흘려 쓰는 줄(생각, 생성 문장)
        const line = add(l.pre || ''), words = l.s.split(/(\s+)/); let out = l.pre || '';
        for (const w of words) { if (t !== tok) return; out += esc(w); line.innerHTML = out + '<span class="cur"></span>'; stickBottom(); if (w.trim()) await sleep(sp(ri(25, 90))); }
        line.innerHTML = out; await sleep(sp(ri(120, 300))); continue;
      }
      add(l.h, l.c); stickBottom(); await sleep(sp(l.d));
    }
  }
  async function burst(t) { // 빠르게 텍스트가 지나간다
    const n = ri(40, 130); let i = 0;
    while (i < n && t === tok) { const k = ri(3, 7); for (let j = 0; j < k; j++, i++) add(S.burst(st, P)); stickBottom(); await frame(); }
  }
  async function vary(t) { // 변주: 설정을 새로 뽑고, 무엇이 바뀌었는지 찍는다
    const old = P; P = S.phase(st); phaseEnd = performance.now() + phaseLen();
    add(''); await emit(S.shift(st, P, old), t); add('');
  }
  async function runLoop(t) {
    prompt(S.first); await sleep(ri(250, 500));
    let sinceCmd = 0;
    while (t === tok) {
      if (performance.now() > phaseEnd) { await vary(t); continue; }
      if (sinceCmd > ri(7, 12)) { sinceCmd = 0; add(''); prompt(pick(S.cmds)); await sleep(ri(200, 600)); continue; }
      sinceCmd++;
      const r = R(), m = P.mix;
      if (r < m.emit) await emit(S.gens[pickGen()](st, P), t);
      else if (r < m.emit + m.spin) await spin(t);
      else if (r < m.emit + m.spin + m.bar) await bar(t);
      else if (r < m.emit + m.spin + m.bar + m.burst) await burst(t);
      else await sleep(sp(ri(300, 900))); // 잠깐 생각하는 듯 멈춤
      if (t === tok) await sleep(sp(ri(40, 220)));
    }
  }
  function go(k) { // 단축키 1~5: 화면을 비우고 다른 연출을 시작한다
    if (!SC[k]) return;
    tok++; useScene(k); scr.replaceChildren(); add('C:\\Users\\dev\\project>cls', 'd'); runLoop(tok);
  }
  window.__ct = { shift: () => { phaseEnd = 0; }, go };
  useScene(1);

  /* ── 수정 모드: 키를 한 번 칠 때마다 지금 연출에 맞는 코드가 한 글자씩 써진다 ──
   * 코드는 codetest-code.js(연출마다 10개). 들어올 때마다 하나를 무작위로 고르고(직전 것 제외), 다 쓰면 같은 연출의 다른 조각을 잇는다.
   * 줄을 바꾸는 키는 다음 줄의 들여쓰기까지 함께 넣는다(편집기의 자동 들여쓰기처럼). */
  const CODE = window.CT_CODE || {};
  let corp = '', buf = '', lastPick = {}, file = 'main.py';
  const pickCode = () => {
    const list = CODE[S.key] || CODE[1] || [{ f: 'main.py', c: 'print("hello")' + '\n' }];
    let i = ri(0, list.length - 1);
    if (list.length > 1 && i === lastPick[S.key]) i = (i + 1) % list.length;
    lastPick[S.key] = i;
    return list[i];
  };
  const grow = () => { if (corp.length - buf.length < 2) { const n = pickCode(); corp += (corp ? '\n\n' : '') + n.c; } };
  const KW = 'def|class|return|if|elif|else|for|while|in|import|from|as|try|except|with|yield|lambda|not|and|or|is|None|True|False|pass|break|continue|raise|finally';
  const BI = 'print|len|range|sum|max|min|abs|round|zip|enumerate|open|float|int|str|list|dict|set';
  const TOKRE = new RegExp(`(#.*$)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|\\b(def|class)(\\s+)([A-Za-z_]\\w*)|\\b(${KW})\\b|\\b(\\d+(?:\\.\\d+)?(?:e-?\\d+)?)\\b|(@\\w+)|\\b(${BI})\\b`, 'g');
  const tokenize = (text) => {
    let out = '', last = 0, m; TOKRE.lastIndex = 0;
    while ((m = TOKRE.exec(text))) {
      out += esc(text.slice(last, m.index)); last = m.index + m[0].length;
      if (m[1]) out += C('cm', m[1]); else if (m[2]) out += C('s', m[2]); else if (m[3]) out += C('k', m[3]) + m[4] + C('f', m[5]);
      else if (m[6]) out += C('k', m[6]); else if (m[7]) out += C('nu', m[7]); else if (m[8]) out += C('dc', m[8]); else out += C('bi', m[9]);
    }
    return out + esc(text.slice(last));
  };
  const hl = (line, inDoc) => { // 줄 하나를 색칠하고, 줄이 끝날 때 여러 줄 문자열 안인지 돌려준다
    let out = '';
    if (inDoc) { const j = line.indexOf('"""'); if (j < 0) return { h: C('s', line), doc: true }; out += C('s', line.slice(0, j + 3)); line = line.slice(j + 3); }
    for (;;) {
      const k = line.indexOf('"""'); if (k < 0) break;
      out += tokenize(line.slice(0, k)); const e = line.indexOf('"""', k + 3);
      if (e >= 0) { out += C('s', line.slice(k, e + 3)); line = line.slice(e + 3); } else return { h: out + C('s', line.slice(k)), doc: true };
    }
    return { h: out + tokenize(line), doc: false };
  };
  const rend = []; // { el, text, doc }
  function renderEditor() {
    edBody.querySelectorAll('.cur').forEach((c) => c.remove()); // 이전 줄에 남은 커서를 먼저 지운다
    const lines = buf.split('\n'); let i = 0;
    while (i < rend.length && i < lines.length - 1 && rend[i].text === lines[i]) i++;
    while (rend.length > i) rend.pop().el.remove();
    for (; i < lines.length; i++) {
      const prev = i ? rend[i - 1].doc : false, r = hl(lines[i], prev), el = document.createElement('div');
      el.className = 'el'; el.innerHTML = `<span class="n">${i + 1}</span><span class="t">${r.h}</span>`;
      edBody.append(el); rend.push({ el, text: lines[i], doc: r.doc });
    }
    const last = rend[rend.length - 1]; last.el.querySelector('.t').insertAdjacentHTML('beforeend', '<span class="cur"></span>');
    while (edBody.childElementCount > 200) edBody.firstElementChild.remove(); // DOM이 커지지 않게 위쪽 줄을 덜어 낸다(번호는 유지)
    edBody.scrollTop = edBody.scrollHeight;
  }
  const typeChunk = () => { // 키 한 번 = 글자 하나. 줄바꿈이면 이어지는 들여쓰기까지
    grow(); let k = 1;
    if (corp[buf.length] === '\n') while (corp[buf.length + k] === ' ') k++;
    buf += corp.slice(buf.length, buf.length + k); renderEditor();
  };
  const eraseOne = () => { if (buf.length) { buf = buf.slice(0, -1); renderEditor(); } }; // 지운 자리는 같은 글자로 다시 써진다

  /* ── 모드 전환 ── */
  function enterEdit() {
    if (mode === 'edit') return; mode = 'edit'; tok++;
    term.classList.add('edit'); scr.hidden = true; ed.hidden = false; const n = pickCode(); corp = n.c; buf = ''; file = n.f; // 들어올 때마다 새 파일
    ttl.textContent = 'C:\\WINDOWS\\system32\\cmd.exe - vim ' + file;
    rend.length = 0; edBody.replaceChildren(); renderEditor(); kbd.focus({ preventScroll: true });
  }
  async function leaveEdit() {
    if (mode !== 'edit') return; mode = 'wait';
    await sleep(260);
    mode = 'run'; tok++; term.classList.remove('edit'); scr.hidden = false; ed.hidden = true; ttl.textContent = 'C:\\WINDOWS\\system32\\cmd.exe - ' + S.first;
    add(''); runLoop(tok);
  }
  const FREE = /^(Shift|Control|Alt|Meta|CapsLock|NumLock|ScrollLock|Dead|Process|F\d+)$/;
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea:not(#kbd),select,[contenteditable="true"]')) return; // 위쪽 검색칸에 쓰는 글은 건드리지 않는다
    if (e.ctrlKey || e.metaKey || e.altKey || FREE.test(e.key) || e.key === 'Unidentified') return;
    if (mode === 'run' && /^[1-5]$/.test(e.key)) { e.preventDefault(); go(e.key); return; } // 연출 바꾸기
    if (mode === 'run') { e.preventDefault(); enterEdit(); typeChunk(); return; }
    if (mode !== 'edit') return;
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); leaveEdit(); }
    else if (e.key === 'Backspace') { e.preventDefault(); eraseOne(); }
    else { e.preventDefault(); typeChunk(); }
  });
  kbd.addEventListener('input', () => { if (mode === 'edit') typeChunk(); kbd.value = ''; }); // 화면 키보드(터치)용
  term.addEventListener('click', () => { if (mode === 'run') enterEdit(); else if (mode === 'edit') kbd.focus({ preventScroll: true }); });

  runLoop(tok);
})();

/* 리눅스 따라하기 실습 화면
 * 왼쪽: 지금 단계의 설명과 입력할 명령. 오른쪽: 연습용 터미널. 단계의 명령을 그대로 입력하면 다음 단계로 넘어간다.
 * 엔진은 lab-shell.js, 실습 내용은 data/linux-lab.js. 아무것도 저장하지 않는다(새로고침하면 처음으로 돌아간다). */
(() => {
  const box = document.getElementById('lab');
  if (!box || !window.LabShell || !window.LINUX_LAB) return;
  const LAB = window.LINUX_LAB, root = document.documentElement;
  const distroNow = () => (root.dataset.mode === 'rh' ? 'rh' : 'deb');
  const pick = (v) => (typeof v === 'string' ? v : v[distroNow()]);
  const norm = (s) => s.trim().replace(/\s+/g, ' ');
  const DIR_RE = /\u0001([^\u0002]*)\u0002/g;

  box.innerHTML = `
    <div class="lab-side">
      <div class="lab-tabs" role="tablist" aria-label="실습 목록"></div>
      <div class="lab-card" aria-live="polite"></div>
      <ol class="lab-steps"></ol>
    </div>
    <div class="lab-term">
      <div class="lab-bar"><i></i><i></i><i></i><span class="lab-title">연습용 터미널</span><em>저장되지 않음 · 새로고침하면 초기화</em><button type="button" class="lab-reset">처음부터</button></div>
      <div class="lab-out" role="log" aria-label="터미널 출력"></div>
      <label class="lab-in"><span class="lab-ps"></span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="명령어 입력"></label>
    </div>`;
  const $ = (s) => box.querySelector(s);
  const tabs = $('.lab-tabs'), card = $('.lab-card'), list = $('.lab-steps'), out = $('.lab-out'), ps = $('.lab-ps'), input = $('.lab-in input');

  let sh, li = 0, si = 0, done = new Set(), hint = '', entered = [], hpos = 0;

  /* ── 터미널 출력 ── */
  function line(text, cls) {
    const d = document.createElement('div');
    d.className = 'l' + (cls ? ' ' + cls : '');
    let last = 0, m;
    DIR_RE.lastIndex = 0;
    while ((m = DIR_RE.exec(text))) {
      if (m.index > last) d.append(text.slice(last, m.index));
      const s = document.createElement('span'); s.className = 'dir'; s.textContent = m[1]; d.append(s);
      last = m.index + m[0].length;
    }
    if (last < text.length) d.append(text.slice(last));
    if (!text) d.innerHTML = '&nbsp;';
    out.append(d);
  }
  const lines = (text, cls) => { if (text === '') return; text.split('\n').forEach((t) => line(t, cls)); };
  const bottom = () => { out.scrollTop = out.scrollHeight; };

  /* ── 안내 화면 ── */
  const lesson = () => LAB.lessons[li];
  const key = (l, s) => l + ':' + s;
  function render() {
    tabs.replaceChildren(...LAB.lessons.map((l, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === li));
      const all = l.steps.every((_, s) => done.has(key(i, s)));
      b.className = (i === li ? 'on ' : '') + (all ? 'ok' : '');
      b.textContent = (all ? '✓ ' : (i + 1) + '. ') + l.title;
      b.addEventListener('click', () => { li = i; si = Math.max(0, l.steps.findIndex((_, s) => !done.has(key(i, s)))); hint = ''; render(); });
      return b;
    }));
    const L = lesson(), finished = L.steps.every((_, s) => done.has(key(li, s)));
    card.replaceChildren();
    const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
    if (finished) {
      card.append(el('p', 'lab-count', `실습 ${li + 1} · 완료`), el('p', 'lab-say', `“${L.title}” 실습을 마쳤다. 시뮬레이터에서 확인한 것이고, 실제 환경에서 직접 해 본 뒤에 완료로 기록한다.`));
      if (li < LAB.lessons.length - 1) {
        const n = el('button', 'lab-next', '다음 실습 ▶'); n.type = 'button';
        n.addEventListener('click', () => { li++; si = 0; hint = ''; render(); input.focus(); });
        card.append(n);
      }
    } else {
      const st = L.steps[si], cmd = pick(st.cmd);
      card.append(el('p', 'lab-count', `실습 ${li + 1} · ${si + 1} / ${L.steps.length} 단계`), el('p', 'lab-say', pick(st.say)));
      const row = el('div', 'lab-cmdrow'), c = el('button', 'lab-cmd'); c.type = 'button'; c.title = '누르면 입력칸에 채운다';
      c.append(el('span', 'ps', '$ '), document.createTextNode(cmd));
      c.addEventListener('click', () => { input.value = cmd; input.focus(); });
      row.append(c, el('span', 'lab-key', '입력하고 Enter'));
      card.append(row);
      if (hint) card.append(el('p', 'lab-hint', hint));
    }
    list.replaceChildren(...L.steps.map((st, s) => {
      const li2 = document.createElement('li');
      li2.className = done.has(key(li, s)) ? 'done' : s === si && !finished ? 'now' : '';
      li2.textContent = pick(st.cmd);
      return li2;
    }));
    if (window.GLOSSARY) window.GLOSSARY.annotate(card);
  }

  /* ── 셸 시작과 초기화 ── */
  function start(note) {
    sh = window.LabShell.create({ distro: distroNow(), files: LAB.files });
    out.replaceChildren(); entered = []; hpos = 0; done = new Set(); li = 0; si = 0; hint = '';
    line(distroNow() === 'rh' ? 'Rocky Linux 9.3 (Blue Onyx) — 연습용 시뮬레이션' : 'Ubuntu 22.04.4 LTS — 연습용 시뮬레이션', 'dim');
    line('실제 컴퓨터와 무관하다. 파일을 지우거나 바꿔도 새로고침하면 처음으로 돌아온다. help 로 명령어 목록을 본다.', 'dim');
    if (note) line('# ' + note, 'dim');
    ps.textContent = sh.prompt(); input.value = '';
    render();
  }

  /* ── 입력 ── */
  function submit() {
    const text = input.value, s = lesson().steps[si];
    line(sh.prompt() + text, 'cmdline');
    input.value = '';
    if (text.trim()) { entered.push(text); hpos = entered.length; }
    const r = sh.run(text);
    if (r.clear) out.replaceChildren(); else lines(r.out, r.code ? 'bad' : '');
    ps.textContent = sh.prompt();
    const finished = lesson().steps.every((_, i) => done.has(key(li, i)));
    if (text.trim() && !finished && s) {
      const want = pick(s.cmd), hit = norm(text) === norm(want) && (s.fails ? r.code !== 0 : r.code === 0);
      if (hit) {
        done.add(key(li, si)); hint = '';
        line('# ✔ ' + pick(s.ok), 'note');
        si++;
        if (si >= lesson().steps.length) line(`[ OK ] 실습 “${lesson().title}” 완료 — 시뮬레이터에서 확인했다`, 'okline');
      } else if (norm(text) !== '') {
        hint = norm(text) === norm(want) ? '' : `자유롭게 더 해 봐도 된다. 단계를 이어 가려면 ${want} 를 입력한다.`;
      }
      render();
    }
    bottom();
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hpos > 0) input.value = entered[--hpos]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hpos = Math.min(entered.length, hpos + 1); input.value = entered[hpos] || ''; }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.replaceChildren(); }
    else if (e.key === 'c' && e.ctrlKey) { e.preventDefault(); line(sh.prompt() + input.value + '^C'); input.value = ''; bottom(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const { head, word, cands } = sh.complete(input.value);
      if (!cands.length) return;
      if (cands.length === 1) { input.value = head + cands[0] + (cands[0].endsWith('/') ? '' : ' '); return; }
      let p = cands[0]; for (const c of cands) while (!c.startsWith(p)) p = p.slice(0, -1);
      if (p.length > word.length) input.value = head + p;
      else { line(sh.prompt() + input.value, 'cmdline'); line(cands.join('  ')); bottom(); }
    }
  });
  $('.lab-term').addEventListener('click', (e) => { if (!e.target.closest('button') && !getSelection().toString()) input.focus(); });
  $('.lab-reset').addEventListener('click', () => { start('처음 상태로 되돌렸다'); input.focus(); });
  document.addEventListener('distro', () => start('계열을 바꿔서 실습 공간을 처음 상태로 되돌렸다'));

  start();
})();

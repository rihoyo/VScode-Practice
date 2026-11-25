/* 키워드 페이지: 전체 페이지의 태그·제목·본문 검색, 최근·추천 키워드, 전체보기.
 * 데이터는 search-index.js(npm run build로 생성), 페이지 목록은 site-nav.js에 있다. */
(() => {
  const IDX = window.SEARCH_INDEX || [];
  const PAGES = window.SITE_PAGES || [];
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lc = (s) => String(s).toLowerCase();
  const pageOf = (f) => PAGES.find((p) => p.href === f) || { name: f, c: '#888' };
  const input = $('#kw-q');
  if (!input) return;

  // 태그 통계: 태그 → 항목 수, 페이지별 항목 수
  const stat = new Map();
  IDX.forEach((e) => e.g.forEach((t) => {
    const k = lc(t);
    if (!stat.has(k)) stat.set(k, { name: t, n: 0, by: {} });
    const s = stat.get(k);
    s.n++; s.by[e.p] = (s.by[e.p] || 0) + 1;
  }));
  const byName = (a, b) => a.name.localeCompare(b.name, 'ko');

  function chip(name, n, extra = '') {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'kw'; b.dataset.kw = '#' + name;
    b.setAttribute('aria-pressed', String(lc(input.value.trim()) === lc('#' + name)));
    b.innerHTML = `#${esc(name)}${n != null ? `<em>${n}${extra}</em>` : ''}`;
    return b;
  }

  // ── 검색 ──
  function search(q) {
    const raw = q.trim();
    if (!raw) return [];
    if (raw.startsWith('#')) {
      const t = lc(raw.slice(1));
      return IDX.filter((e) => e.g.some((x) => lc(x) === t)).map((e) => ({ e, s: 10 }));
    }
    const words = lc(raw).split(/\s+/);
    return IDX.map((e) => {
      const title = lc(e.t), tags = e.g.map(lc), text = lc(e.x);
      let s = 0;
      for (const w of words) {
        let m = 0;
        if (tags.includes(w)) m += 6; else if (tags.some((x) => x.includes(w))) m += 3;
        if (title.includes(w)) m += 4;
        if (text.includes(w)) m += 1;
        if (!m) return null;
        s += m;
      }
      return { e, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s);
  }

  function snippet(e, raw) {
    const w = lc(raw.replace(/^#/, '')).split(/\s+/)[0];
    const i = w ? lc(e.x).indexOf(w) : -1;
    const from = Math.max(0, i - 40);
    let out = esc(e.x.slice(from, from + 130));
    if (i >= 0) out = out.replace(new RegExp(esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), (m) => `<mark>${m}</mark>`);
    return (from ? '… ' : '') + out + (from + 130 < e.x.length ? ' …' : '');
  }

  function renderResult(q) {
    const box = $('#kw-result');
    const raw = q.trim();
    if (!raw) { box.innerHTML = ''; return; }
    const rs = search(raw);
    if (!rs.length) { box.innerHTML = `<p class="kw-empty">"${esc(raw)}"에 맞는 항목이 없다. 아래 키워드 전체보기에서 골라 본다.</p>`; return; }
    const ul = document.createElement('ul');
    ul.className = 'kw-res';
    rs.forEach(({ e }) => {
      const p = pageOf(e.p);
      const li = document.createElement('li');
      li.style.setProperty('--pc', p.c);
      li.innerHTML = `<span class="pg">${esc(p.name)}</span><br><a href="${e.p}#${e.id}">${esc(e.t)}</a><p>${snippet(e, raw)}</p>`;
      const tg = document.createElement('div');
      e.g.forEach((t) => tg.appendChild(chip(t)));
      li.appendChild(tg);
      ul.appendChild(li);
    });
    box.innerHTML = `<p class="kw-empty">${rs.length}개 항목을 찾았다.</p>`;
    box.appendChild(ul);
  }

  function suggest() {
    const w = lc(input.value.trim().replace(/^#/, ''));
    const box = $('#kw-sug');
    box.replaceChildren();
    if (!w) return;
    [...stat.values()].filter((s) => lc(s.name).includes(w)).sort((a, b) => b.n - a.n || byName(a, b)).slice(0, 8)
      .forEach((s) => box.appendChild(chip(s.name, s.n)));
  }

  function run(q, remember) {
    input.value = q;
    renderResult(q);
    suggest();
    if (remember && q.trim()) { KW.add(q); renderRecent(); }
    try { history.replaceState(null, '', q.trim() ? '?q=' + encodeURIComponent(q.trim()) : location.pathname); } catch { /* file:// 에서 막히면 무시 */ }
    document.querySelectorAll('.kw[data-kw]').forEach((b) => b.setAttribute('aria-pressed', String(lc(q.trim()) === lc(b.dataset.kw))));
  }

  // ── 최근 · 추천 · 전체보기 ──
  function renderRecent() {
    const box = $('#kw-recent-list');
    const list = KW.recent();
    box.replaceChildren();
    if (!list.length) { box.innerHTML = '<p class="kw-empty">아직 찾아본 키워드가 없다. 검색하거나 태그를 누르면 여기에 쌓인다. 이 기록은 이 브라우저에만 저장된다.</p>'; return; }
    list.forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'kw'; b.dataset.kw = k; b.textContent = k;
      box.appendChild(b);
    });
  }
  $('#kw-clear').addEventListener('click', () => { KW.clear(); renderRecent(); });

  function renderHot() {
    const box = $('#kw-hot-list');
    [...stat.values()].sort((a, b) => b.n - a.n || byName(a, b)).slice(0, 12).forEach((s) => box.appendChild(chip(s.name, s.n)));
    if (!stat.size) box.innerHTML = '<p class="kw-empty">태그가 아직 없다. tools 폴더에서 npm run build를 실행한다.</p>';
  }

  let mode = 'page', only = 'all';
  function renderAll() {
    const tabs = $('#kw-pages');
    tabs.replaceChildren();
    const used = PAGES.filter((p) => IDX.some((e) => e.p === p.href));
    [{ href: 'all', name: '전체' }, ...used].forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'kw-tab'; b.textContent = p.name; b.dataset.page = p.href;
      b.setAttribute('aria-pressed', String(only === p.href));
      tabs.appendChild(b);
    });
    const box = $('#kw-all-list');
    box.replaceChildren();
    if (mode === 'alpha') {
      const list = [...stat.values()].map((s) => ({ ...s, n: only === 'all' ? s.n : s.by[only] || 0 })).filter((s) => s.n).sort(byName);
      const wrap = document.createElement('div');
      wrap.className = 'kw-chips';
      list.forEach((s) => wrap.appendChild(chip(s.name, s.n)));
      box.appendChild(wrap);
      return;
    }
    used.filter((p) => only === 'all' || p.href === only).forEach((p) => {
      const tags = [...stat.values()].filter((s) => s.by[p.href]).map((s) => ({ name: s.name, n: s.by[p.href] })).sort((a, b) => b.n - a.n || byName(a, b));
      if (!tags.length) return;
      const g = document.createElement('div');
      g.className = 'kw-group';
      g.style.setProperty('--pc', p.c);
      g.innerHTML = `<h3><i></i>${esc(p.name)} <small>태그 ${tags.length}개</small></h3>`;
      const wrap = document.createElement('div');
      wrap.className = 'kw-chips';
      tags.forEach((s) => wrap.appendChild(chip(s.name, s.n)));
      g.appendChild(wrap);
      box.appendChild(g);
    });
  }
  $('#kw-mode').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b) return;
    mode = b.dataset.mode;
    document.querySelectorAll('#kw-mode .kw-tab').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderAll();
  });
  $('#kw-pages').addEventListener('click', (e) => {
    const b = e.target.closest('[data-page]');
    if (b) { only = b.dataset.page; renderAll(); }
  });

  // 칩 클릭은 한곳에서 처리
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.kw[data-kw]');
    if (!b) return;
    run(b.dataset.kw, true);
    $('#kw-find').scrollIntoView({ block: 'start' });
  });
  $('#kw-form').addEventListener('submit', (e) => { e.preventDefault(); run(input.value, true); });
  input.addEventListener('input', () => { renderResult(input.value); suggest(); });

  renderRecent(); renderHot(); renderAll();
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) run(q0, false);
})();

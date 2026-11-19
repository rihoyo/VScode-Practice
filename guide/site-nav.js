/* 사이트 공용 메뉴
 *  - 드롭다운: 서로 다른 메인 페이지(VS Code 공부 · 리눅스 · 네트워크)로 이동한다.
 *  - 탭: 선택한 메인 페이지 안의 메뉴(예: 개요 · Git · GitHub · VS Code).
 *  - 고정 메뉴바: 스크롤하면 위에 나타나 드롭다운, 탭, 키워드 검색을 보여 준다.
 * 새 메인 페이지는 SITES에, 메인 페이지 안의 새 페이지는 해당 사이트의 pages에 한 줄을 추가한다. */
(() => {
  const SITES = [
    { id: 'vscode', name: 'VS Code 공부', d: '개요 · Git · GitHub · VS Code 실습 기록', c: '#4ade80', pages: [
      { href: 'vscode-guide.html', name: '개요' },
      { href: 'git.html', name: 'Git' },
      { href: 'github.html', name: 'GitHub' },
      { href: 'vscode.html', name: 'VS Code' },
    ] },
    { id: 'linux', name: '리눅스', d: 'OS 이해하기 · 터미널로 보는 노트', c: '#e95420', pages: [
      { href: 'linux.html', name: '리눅스 홈' },
    ] },
    { id: 'network', name: '네트워크', d: '구조 설계와 자격 시험 · 도면으로 보는 노트', c: '#1d6fb8', pages: [
      { href: 'network.html', name: '네트워크 홈' },
    ] },
  ];
  const KEYWORDS = { href: 'keywords.html', name: '키워드' };
  window.SITES = SITES;
  window.SITE_PAGES = SITES.flatMap((s) => s.pages.map((p) => ({ ...p, c: s.c, site: s.name }))); // 키워드 페이지가 쓴다

  // ── 최근 찾아본 키워드 (이 브라우저에만 저장) ──
  const KEY = 'dev-steps.recent';
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
  window.KW = {
    recent: read,
    add(k) {
      k = String(k || '').trim();
      if (!k) return;
      try { localStorage.setItem(KEY, JSON.stringify([k, ...read().filter((x) => x !== k)].slice(0, 10))); } catch { /* 저장이 막힌 브라우저 */ }
    },
    clear() { try { localStorage.removeItem(KEY); } catch { /* 무시 */ } },
  };

  const file = location.pathname.split('/').pop() || SITES[0].pages[0].href;
  const site = SITES.find((s) => s.pages.some((p) => p.href === file)) || null;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // ── 메인 페이지 이동 드롭다운 ──
  const menus = [];
  const closeAll = () => menus.forEach((m) => m._close());
  let seq = 0;
  function dropdown() {
    const id = 'pm-list-' + ++seq;
    const box = el('div', 'pm');
    box.style.setProperty('--pc', site ? site.c : 'var(--accent)');
    const label = site ? site.name : '메인 페이지';
    const btn = el('button', 'pm-btn', `<i class="pm-dot"></i><span class="pm-cur">${label}</span><span class="pm-caret" aria-hidden="true">▼</span>`);
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.setAttribute('aria-label', `메인 페이지 이동, 현재 ${label}`);
    const list = el('div', 'pm-list');
    list.id = id; list.hidden = true;
    list.appendChild(el('p', 'pm-g', '메인 페이지 이동'));
    SITES.forEach((s) => {
      const a = el('a', 'pm-it', `<i></i><b>${s.name}</b><span>${s.d}</span>`);
      a.href = s.pages[0].href;
      a.style.setProperty('--pc', s.c);
      if (s === site) a.setAttribute('aria-current', 'true');
      list.appendChild(a);
    });
    const set = (on) => { list.hidden = !on; btn.setAttribute('aria-expanded', String(on)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); const on = list.hidden; closeAll(); set(on); });
    box._close = () => set(false);
    box.append(btn, list);
    menus.push(box);
    return box;
  }
  document.addEventListener('click', (e) => { if (!e.target.closest('.pm')) closeAll(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = menus.find((m) => !m.querySelector('.pm-list').hidden);
    if (open) { open.querySelector('.pm-btn').focus(); closeAll(); }
  });

  // ── 사이트 안 메뉴(탭) ──
  function tabs(into) {
    if (!site || site.pages.length < 2) return false;
    site.pages.forEach((p) => {
      const a = el('a', null, p.name);
      a.href = p.href;
      if (p.href === file) a.setAttribute('aria-current', 'page');
      into.appendChild(a);
    });
    return true;
  }

  // 머리말: 오른쪽 위 드롭다운, 아래쪽 탭
  const slot = document.querySelector('.sitenav');
  if (slot) slot.replaceChildren(dropdown());
  const headTabs = document.querySelector('header .tabs');
  if (headTabs) tabs(headTabs);

  // ── 고정 메뉴바 ──
  const bar = el('div', 'topbar');
  bar.setAttribute('role', 'navigation');
  bar.setAttribute('aria-label', '고정 메뉴');
  bar.appendChild(dropdown());
  const barTabs = el('nav', 'tabs');
  barTabs.setAttribute('aria-label', site ? site.name + ' 메뉴' : '메뉴');
  let where = null;
  if (tabs(barTabs)) { bar.append(el('i', 'tb-sep'), barTabs, el('span', 'tb-fill')); }
  else { where = el('div', 'tb-where', site ? `<b>${site.name}</b>` : '키워드'); bar.appendChild(where); }
  const form = el('form', 'tb-search', '<input type="search" placeholder="키워드 검색" aria-label="키워드 검색"><button type="submit" aria-label="키워드 페이지에서 검색">⌕</button>');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = form.querySelector('input').value.trim();
    if (q) window.KW.add(q);
    location.href = KEYWORDS.href + (q ? '?q=' + encodeURIComponent(q) : '');
  });
  const kw = el('a', 'tb-kw', '전체 키워드');
  kw.href = KEYWORDS.href;
  if (file === KEYWORDS.href) kw.setAttribute('aria-current', 'page');
  bar.append(form, kw);
  document.body.prepend(bar);

  // ── 목차가 있는 페이지: 읽는 위치 표시 ──
  const links = [...document.querySelectorAll('[data-toc] a[href^="#"]')];
  if (links.length) {
    const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.hash === '#' + en.target.id));
    }), { rootMargin: '-15% 0px -70% 0px' });
    links.forEach((a) => { const t = document.getElementById(a.hash.slice(1)); if (t) spy.observe(t); });
  }
  if (where) {
    new MutationObserver((ms) => ms.forEach((m) => {
      const a = m.target;
      if (a.matches && a.matches('[data-toc] a.active')) where.innerHTML = `<b>${site ? site.name : '키워드'}</b> · ${a.textContent.trim()}`;
    })).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }
})();

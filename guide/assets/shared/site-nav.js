/* 사이트 공용 메뉴
 *  - 드롭다운: 서로 다른 메인 페이지(VS Code 공부 · 리눅스 · 네트워크)로 이동한다.
 *  - 탭: 선택한 메인 페이지 안의 메뉴(예: 개요 · Git · GitHub · VS Code).
 *  - 고정 메뉴바: 스크롤하면 위에 나타나 드롭다운, 탭, 키워드 검색(직접 입력은 여기에만)을 보여 준다.
 * 사이트와 페이지 목록은 data/sites.js에서 관리한다. */
(() => {
  const { sites: SITES, keywords: KEYWORDS } = window.SITE_CONFIG; // 목록은 data/sites.js에서 관리한다
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
    const home = el('a', 'pm-it', '<i></i><b>메인</b><span>첫 화면으로 돌아가 메인 페이지를 고른다</span>');
    home.href = '../index.html'; home.style.setProperty('--pc', 'var(--ink)');
    list.appendChild(home);
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
    if (open) { (open.querySelector('.pm-btn') || open.querySelector('input')).focus(); closeAll(); }
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

  // ── 키워드 검색 패널 (머리말 버튼과 고정 메뉴바 검색칸이 같이 쓴다) ──
  // 비어 있으면 이 페이지의 태그와 전체 태그를 보여 주고, 입력하기 시작하면 관련 키워드와 섹션을 바로 보여 준다.
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lower = (s) => String(s).toLowerCase();
  const pageName = (href) => { const p = window.SITE_PAGES.find((x) => x.href === href); return p ? p.name : href; };
  const mark = (s, q) => { const i = lower(s).indexOf(q); return i < 0 ? esc(s) : esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length)); };
  const chip = (t, c, q) => {
    const a = el("a", "tg-chip", (q ? "#" + mark(t, q) : "#" + esc(t)) + "<small>" + c + "</small>");
    a.href = KEYWORDS.href + "?q=" + encodeURIComponent("#" + t);
    a.addEventListener("click", () => window.KW.add("#" + t));
    return a;
  };
  function fillResults(box, raw) {
    const q = lower(raw.trim().replace(/^#/, "")), idx = window.SEARCH_INDEX || [];
    box.replaceChildren();
    const add = (title, node) => { box.appendChild(el("p", "pm-g", title)); box.appendChild(node); };
    const row = (map, qq) => {
      const r = el("div", "tg-row");
      [...map].sort((x, y) => (qq ? (lower(x[0]).startsWith(qq) ? 0 : 1) - (lower(y[0]).startsWith(qq) ? 0 : 1) : 0) || y[1] - x[1] || x[0].localeCompare(y[0], "ko"))
        .slice(0, qq ? 14 : 200).forEach(([t, c]) => r.appendChild(chip(t, c, qq)));
      return r;
    };
    const count = (list) => { const m = new Map(); list.forEach((e) => (e.g || []).forEach((t) => m.set(t, (m.get(t) || 0) + 1))); return m; };
    if (!q) {
      const here = count(idx.filter((e) => e.p === file));
      if (here.size && file !== KEYWORDS.href) add("이 페이지의 태그", row(here));
      const all = count(idx);
      if (all.size) add("전체 태그", row(all)); else box.appendChild(el("p", "tg-none", "아직 태그가 없다."));
      return;
    }
    const tm = new Map();
    idx.forEach((e) => (e.g || []).forEach((t) => { if (lower(t).includes(q)) tm.set(t, (tm.get(t) || 0) + 1); }));
    const hits = idx.map((e) => {
      const s = (lower(e.t).includes(q) ? 3 : 0) + ((e.g || []).some((t) => lower(t).includes(q)) ? 2 : 0) + (lower(e.x || "").includes(q) ? 1 : 0);
      return { e, s };
    }).filter((h) => h.s > 0).sort((x, y) => y.s - x.s).slice(0, 6);
    if (tm.size) add("관련 키워드", row(tm, q));
    if (hits.length) {
      const list = el("div", "sg-list");
      hits.forEach(({ e }) => {
        const a = el("a", "sg-it", "<b>" + mark(e.t, q) + "</b><span>" + esc(pageName(e.p)) + "</span>");
        a.href = e.p + "#" + e.id;
        a.addEventListener("click", () => window.KW.add(raw.trim()));
        list.appendChild(a);
      });
      add("관련 섹션", list);
    }
    if (!tm.size && !hits.length) box.appendChild(el("p", "tg-none", "‘" + raw.trim() + "’와 맞는 키워드가 없다. Enter로 전체 페이지에서 찾아본다."));
    const all = el("a", "sg-all", "‘" + esc(raw.trim()) + "’ 전체 결과 보기 →");
    all.href = KEYWORDS.href + "?q=" + encodeURIComponent(raw.trim());
    all.addEventListener("click", () => window.KW.add(raw.trim()));
    box.appendChild(all);
  }
  // 입력칸에서 방향키로 결과 항목을 오가고, Enter는 선택 항목이나 전체 결과로 간다.
  function wire(input, box) {
    const go = () => { const v = input.value.trim(); if (v) window.KW.add(v); location.href = KEYWORDS.href + (v ? "?q=" + encodeURIComponent(v) : ""); };
    const items = () => [...box.querySelectorAll("a.tg-chip, a.sg-it, a.sg-all")];
    let t = 0;
    input.addEventListener("input", () => { cancelAnimationFrame(t); t = requestAnimationFrame(() => fillResults(box, input.value)); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const l = items(); if (!l.length) return; e.preventDefault();
        const i = l.indexOf(document.activeElement);
        l[(i + (e.key === "ArrowDown" ? 1 : -1) + l.length) % l.length].focus();
      } else if (e.key === "Enter") { e.preventDefault(); go(); }
    });
    box.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const l = items(), i = l.indexOf(document.activeElement); if (i < 0) return; e.preventDefault();
      if (e.key === "ArrowUp" && i === 0) input.focus(); else l[(i + (e.key === "ArrowDown" ? 1 : -1) + l.length) % l.length].focus();
    });
    fillResults(box, input.value);
    return go;
  }
  function kwMenu() {
    const id = "pm-list-" + ++seq;
    const box = el("div", "pm tg");
    const btn = el("button", "pm-btn", `<span class="pm-cur">⌕ 키워드 검색</span><span class="pm-caret" aria-hidden="true">▼</span>`);
    btn.type = "button"; btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", id);
    const list = el("div", "pm-list tg-pop"); list.id = id; list.hidden = true;
    const form = el("form", "kq", `<input type="search" placeholder="키워드를 입력한다" aria-label="키워드 검색" autocomplete="off"><button type="submit" aria-label="전체 결과 보기">⌕</button>`);
    const res = el("div", "kq-res");
    list.append(form, res);
    const input = form.querySelector("input"), go = wire(input, res);
    form.addEventListener("submit", (e) => { e.preventDefault(); go(); });
    const set = (on) => { list.hidden = !on; btn.setAttribute("aria-expanded", String(on)); if (on) { input.focus(); input.select(); } };
    btn.addEventListener("click", (e) => { e.stopPropagation(); const on = list.hidden; closeAll(); set(on); });
    box._close = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    box.append(btn, list); menus.push(box);
    return box;
  }
  // 리눅스 페이지에서만: 계열 전환 스위치. 동작은 linux.js가 연결한다.
  function distroSwitch() {
    if (!document.body.classList.contains("linux")) return null;
    const w = el("div", "dsw", '<button type="button" role="radio" data-mode="mix"><i class="dp-mix"></i>혼합</button><button type="button" role="radio" data-mode="deb"><i class="dp-deb"></i>Debian</button><button type="button" role="radio" data-mode="rh"><i class="dp-rh"></i>Red Hat</button>');
    w.setAttribute("role", "radiogroup"); w.setAttribute("aria-label", "리눅스 계열 보기");
    return w;
  }
  function headTools() {
    const w = el("div", "hd-tools");
    const kwl = el("a", "tb-kw", "전체 키워드"); kwl.href = KEYWORDS.href;
    if (file === KEYWORDS.href) kwl.setAttribute("aria-current", "page");
    const ds = distroSwitch();
    w.append(...(ds ? [ds] : []), kwMenu(), kwl);
    return w;
  }
  // 머리말: 왼쪽 위 메인 페이지 이동 드롭다운, 오른쪽 위 키워드 검색(패널)과 전체 키워드, 아래쪽 탭
  const slot = document.querySelector(".sitenav");
  if (slot) slot.replaceChildren(dropdown(), headTools());
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
  const form = el('form', 'tb-search pm', '<input type="search" placeholder="키워드 검색" aria-label="키워드 검색" autocomplete="off"><button type="submit" aria-label="전체 결과 보기">⌕</button>');
  const sug = el('div', 'pm-list tg-pop kq-res'); sug.hidden = true;
  form.appendChild(sug);
  const barInput = form.querySelector('input'), barGo = wire(barInput, sug);
  form.addEventListener('submit', (e) => { e.preventDefault(); barGo(); });
  const openSug = () => { closeAll(); sug.hidden = false; };
  barInput.addEventListener('focus', openSug);
  barInput.addEventListener('click', openSug);
  form._close = () => { sug.hidden = true; };
  menus.push(form);
  const kw = el('a', 'tb-kw', '전체 키워드');
  kw.href = KEYWORDS.href;
  if (file === KEYWORDS.href) kw.setAttribute('aria-current', 'page');
  const bsw = distroSwitch();
  bar.append(...(bsw ? [bsw] : []), form, kw);
  document.body.prepend(bar);

  // 스크롤하면 고정 메뉴바를 보인다(모든 페이지 공통). 머리말이 화면 밖으로 나가거나, 긴 머리말이면 화면 절반쯤 내려갔을 때.
  const head = document.querySelector("header");
  const upd = () => {
    const past = document.body.dataset.bar === "always" || (head ? head.getBoundingClientRect().bottom <= 0 || scrollY > innerHeight * 0.6 : scrollY > 200);
    document.body.classList.toggle("scrolled", past);
    if (past) closeAll();
  };
  addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();

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

/* 공용 마우스 포인터(모양·테마 색·동작 연출)를 모든 페이지에 불러온다 */
(() => {
  const cs = document.currentScript, base = cs ? cs.src.replace(/site-nav.js.*$/, "") : "assets/shared/";
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = base + "cursor.css"; document.head.append(l);
  const j = document.createElement("script"); j.src = base + "cursor.js"; document.head.append(j);
})();

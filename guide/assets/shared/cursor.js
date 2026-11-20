/* 커스텀 마우스 포인터 · 모든 페이지 공용 (site-nav.js가 불러오고, 메인 페이지는 직접 불러온다)
 * - 화살표는 포인터에 정확히 붙고, 마름모 고리도 같은 자리에 붙는다.
 * - 테마 색: 페이지의 --accent(메인 페이지는 먹색+붉은색)를 읽고, 리눅스 계열 전환이나 테마 변경을 지켜봐서 따라 바꾼다.
 * - 동작: 링크·버튼 위(고리 확장), 용어 위(?), 지도 위(잡기), 누름(수축)+파문, 드래그(범위 지정 상자로 변신), 로딩(알고리즘이 떠오름).
 * - 로딩 연출은 페이지가 열리는 동안, 다른 페이지로 이동하는 동안 자동으로 켜지고, 코드에서는 Cursor.busy(true|false, '이유')로 켠다.
 * - 마우스가 없는 기기(터치)에서는 아무것도 하지 않아 원래 동작을 그대로 둔다. */
(() => {
  'use strict';
  if (window.Cursor || !matchMedia('(pointer:fine) and (hover:hover)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const body = document.body, root = document.documentElement, isHome = body.classList.contains('home');

  /* ── 요소 만들기 ── */
  const el = document.createElement('div');
  el.id = 'cur'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="cur-pt"><div class="cur-ring"><i></i></div><div class="cur-arrow"></div>'
    + '<div class="cur-lab"><span class="cur-bars"><b></b><b></b><b></b><b></b><b></b><b></b></span><span class="cur-txt"></span></div></div>';
  const box = document.createElement('div');
  box.className = 'cur-box'; box.innerHTML = '<i></i><i></i><i></i><i></i>';
  body.append(el, box);
  const pt = el.querySelector('.cur-pt'), txt = el.querySelector('.cur-txt'), bars = [...el.querySelectorAll('.cur-bars b')];

  /* ── 테마 색 ── */
  function theme() {
    let fill, edge, rg;
    if (isHome) { fill = '#101010'; edge = '#f1efe9'; rg = '#e11d48'; }
    else {
      const cs = getComputedStyle(body), v = (n) => cs.getPropertyValue(n).trim();
      fill = v('--accent') || '#4ade80'; edge = v('--bg') || '#080c11'; rg = fill;
    }
    el.style.setProperty('--cur', fill); el.style.setProperty('--cur-edge', edge); el.style.setProperty('--cur-ring', rg);
    box.style.setProperty('--cur-ring', rg); box.style.setProperty('--cur-edge', edge);
  }
  const retheme = () => { theme(); setTimeout(theme, 120); setTimeout(theme, 520); }; // 전환 연출이 끝난 뒤의 색까지 읽는다
  theme();
  new MutationObserver(retheme).observe(root, { attributes: true, attributeFilter: ['data-mode', 'data-theme', 'class'] });
  new MutationObserver(retheme).observe(body, { attributes: true, attributeFilter: ['class'] });

  /* ── 위치: 포인터 이벤트마다 즉시 옮긴다(보간·지연 없음) ── */
  let x = -100, y = -100, shown = false;
  const place = () => { pt.style.transform = `translate3d(${x}px,${y}px,0)`; if (drag) drawBox(); };

  function show() { if (shown) return; shown = true; root.classList.add('has-cur'); el.classList.add('on'); }
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY; show(); place();
    if (down && !drag && Math.hypot(x - sx, y - sy) > 5) startDrag();
  }, { passive: true });
  document.addEventListener('pointerleave', () => el.classList.add('is-out'));
  document.addEventListener('pointerenter', () => el.classList.remove('is-out'));
  document.documentElement.addEventListener('mouseleave', () => el.classList.add('is-out'));
  document.documentElement.addEventListener('mouseenter', () => el.classList.remove('is-out'));

  /* ── 대상에 따른 모양 ── */
  const SEL = {
    text: 'input:not([type=button i]):not([type=checkbox i]):not([type=radio i]):not([type=range i]),textarea,[contenteditable="true"]',
    link: 'a[href],button,summary,label,select,[role=button],.card,.enter',
    help: '.gl', grab: '.map-canvas',
  };
  let cur = '';
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = e.target.closest ? e.target : e.target.parentElement;
    const s = !t ? '' : t.closest(SEL.text) ? 'text' : t.closest(SEL.link) ? 'link' : t.closest(SEL.help) ? 'help' : t.closest(SEL.grab) ? 'grab' : '';
    if (s === cur) return;
    if (cur) el.classList.remove('s-' + cur);
    cur = s; if (s) el.classList.add('s-' + s);
  }, true);

  /* ── 누름 · 파문 · 드래그 변신 ── */
  let down = false, drag = false, sx = 0, sy = 0, dragOK = false;
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; sx = e.clientX; sy = e.clientY; x = sx; y = sy; el.classList.add('is-down');
    const t = e.target.closest ? e.target : e.target.parentElement;
    dragOK = !isHome && !!t && !t.closest(SEL.text + ',' + SEL.link + ',' + SEL.grab + ',.gl'); // 글자·버튼·지도 위에서는 범위 상자를 쓰지 않는다
    if (!reduce) {
      const r = document.createElement('div'); r.className = 'cur-rip'; r.style.left = sx + 'px'; r.style.top = sy + 'px';
      r.style.setProperty('--cur-ring', el.style.getPropertyValue('--cur-ring'));
      body.append(r); r.addEventListener('animationend', () => r.remove());
    }
    place();
  }, true);
  function startDrag() {
    if (!dragOK) return;
    drag = true; el.classList.add('is-drag'); txt.textContent = '';
    box.classList.remove('end'); box.classList.add('on'); drawBox();
  }
  function drawBox() {
    const l = Math.min(sx, x), t = Math.min(sy, y), w = Math.abs(x - sx), h = Math.abs(y - sy);
    box.style.left = l + 'px'; box.style.top = t + 'px'; box.style.width = w + 'px'; box.style.height = h + 'px';
    txt.textContent = `${Math.round(w)}×${Math.round(h)}`;
  }
  function release() {
    if (!down) return;
    down = false; el.classList.remove('is-down');
    if (drag) { // 상자가 포인터 위치로 오므라들며 사라진다
      drag = false; el.classList.remove('is-drag');
      box.classList.remove('on'); box.classList.add('end');
      box.style.left = x + 'px'; box.style.top = y + 'px'; box.style.width = '0px'; box.style.height = '0px';
      txt.textContent = busyOn ? txt.textContent : '';
    }
  }
  addEventListener('pointerup', release, true);
  addEventListener('pointercancel', release, true);
  addEventListener('blur', release);

  /* ── 로딩: 알고리즘이 떠오른다 ── */
  const ALGO = ['quicksort(a)', 'bfs(root)', 'dijkstra(g, s)', 'binary_search(k)', 'hash(key) % n', 'merge(l, r)', 'a_star(s, goal)', 'topo_sort(dag)', 'trie.insert(w)', 'dfs(node)'];
  const GL = '01<>/\\[]{}#$%&*+=?';
  let busyOn = false, why = new Set(), timers = [], ai = 0, arr = [3, 6, 2, 5, 1, 4], bi = 0;
  function scramble(to) {
    let n = 0; const tm = setInterval(() => {
      n++; txt.textContent = [...to].map((c, i) => i < n * 0.9 ? c : GL[(Math.random() * GL.length) | 0]).join('');
      if (n > to.length / 0.9 + 1) clearInterval(tm);
    }, 38); timers.push(tm);
  }
  function paintBars() { arr.forEach((v, i) => { bars[i].style.height = (2 + v * 1.7) + 'px'; bars[i].style.opacity = i === bi || i === bi + 1 ? 1 : 0.55; }); }
  function sortStep() { // 막대가 거품 정렬로 한 칸씩 정렬되고, 정렬이 끝나면 다시 섞인다
    if (arr[bi] > arr[bi + 1]) [arr[bi], arr[bi + 1]] = [arr[bi + 1], arr[bi]];
    bi++; if (bi >= arr.length - 1) { bi = 0; if (arr.every((v, i) => !i || arr[i - 1] <= v)) arr = arr.map(() => 1 + ((Math.random() * 6) | 0)); }
    paintBars();
  }
  function busy(on, reason = 'ui') {
    on ? why.add(reason) : why.delete(reason);
    const want = why.size > 0;
    if (want === busyOn) return;
    busyOn = want; el.classList.toggle('is-busy', want);
    timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); timers = [];
    if (!want) { if (!drag) txt.textContent = ''; return; }
    scramble(ALGO[ai % ALGO.length]); paintBars();
    timers.push(setInterval(sortStep, reduce ? 400 : 110));
    timers.push(setInterval(() => { ai++; scramble(ALGO[ai % ALGO.length]); }, 1600));
  }

  if (document.readyState !== 'complete') { busy(true, 'load'); addEventListener('load', () => setTimeout(() => busy(false, 'load'), 500)); }
  document.addEventListener('click', (e) => { // 다른 페이지로 이동하는 동안 이어서 보여 준다
    setTimeout(() => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.protocol === 'javascript:' || (u.pathname === location.pathname && u.search === location.search && u.hash !== location.hash)) return;
      if (u.href === location.href || (u.origin === location.origin && u.pathname === location.pathname && u.hash)) return;
      busy(true, 'nav');
    }, 0);
  });
  addEventListener('pageshow', () => busy(false, 'nav'));
  if (isHome) new MutationObserver(() => busy(body.classList.contains('is-collapse'), 'home')).observe(body, { attributes: true, attributeFilter: ['class'] });

  window.Cursor = { busy, retheme };
})();

const header = document.querySelector('header');

function updateMenu() {
  // 고정 메뉴바 표시는 site-nav.js가 맡는다
}

function revealTarget() {
  const target = document.getElementById(location.hash.slice(1));
  if (target instanceof HTMLDetailsElement && !target.open) {
    target.open = true;
    target.scrollIntoView();
  }
}

// 클릭 파문 효과: 메뉴, 버튼, 접기 제목을 누른 자리에서 퍼져나가
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('header nav a, .quick a, .toc a, .btn, .chip, summary, .step');
  if (!el) return;
  const r = el.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 2;
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  el.appendChild(s);
  setTimeout(() => s.remove(), 650);
});

// 현재 읽는 위치를 오른쪽 목차에 표시
const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    tocLinks.forEach((a) => a.classList.toggle('active', a.hash === '#' + en.target.id));
  });
}, { rootMargin: '-15% 0px -70% 0px' });
tocLinks.forEach((a) => {
  const t = document.getElementById(a.hash.slice(1));
  if (t) spy.observe(t);
});

window.addEventListener('scroll', updateMenu, { passive: true });
window.addEventListener('resize', updateMenu);
window.addEventListener('hashchange', revealTarget);
revealTarget();
updateMenu();

// ── 목차: 접기·펼치기, 키워드 검색, 태그 필터 ──
(() => {
  const toc = document.querySelector('.toc nav');
  if (!toc) return;
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ');
  const items = links.map((a) => {
    const t = document.getElementById(a.hash.slice(1));
    const tags = (a.dataset.tags || '').split(/\s+/).filter(Boolean);
    return { a, tags, text: norm(a.textContent + ' ' + tags.join(' ') + ' ' + (t ? t.textContent : '')) };
  });

  // 소제목(.sub)을 앞의 큰 제목 아래로 묶어 접기 그룹으로 만든다
  const groups = [];
  items.forEach((it) => {
    if (!it.a.classList.contains('sub') || !groups.length) groups.push({ head: it, subs: [] });
    else groups[groups.length - 1].subs.push(it);
  });
  // 목차의 부 구분(span.part)은 바로 뒤 그룹 앞에 라벨로 다시 놓는다
  const partOf = new Map();
  let pendingPart = null;
  [...toc.children].forEach((el) => {
    if (el.classList.contains('part')) pendingPart = el;
    else if (pendingPart && el.matches('a[href^="#"]')) { partOf.set(el, pendingPart); pendingPart = null; }
  });
  const frag = document.createDocumentFragment();
  groups.forEach((g) => {
    if (partOf.has(g.head.a)) frag.appendChild(partOf.get(g.head.a));
    const box = document.createElement('div');
    box.className = 'toc-group';
    const row = document.createElement('div');
    row.className = 'toc-row';
    let btn = null;
    if (g.subs.length) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toc-tg';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', g.head.a.textContent + ' 하위 항목 펼치기');
      row.appendChild(btn);
    }
    row.appendChild(g.head.a);
    box.appendChild(row);
    const sub = document.createElement('div');
    sub.className = 'toc-sub';
    g.subs.forEach((s) => sub.appendChild(s.a));
    if (g.subs.length) box.appendChild(sub);
    g.box = box; g.btn = btn; g.sub = sub;
    if (btn) btn.addEventListener('click', () => setOpen(g, btn.getAttribute('aria-expanded') !== 'true'));
    frag.appendChild(box);
  });
  function setOpen(g, on) {
    if (!g.btn) return;
    g.btn.setAttribute('aria-expanded', String(on));
    g.box.classList.toggle('open', on);
  }

  // 검색 칸과 태그 칩
  const all = [...new Set(items.flatMap((i) => i.tags))].sort();
  const tools = document.createElement('div');
  tools.className = 'toc-tools';
  const q = { value: '' }; // 직접 입력 검색은 고정 메뉴바에만 둔다. 여기서는 태그 토글만 쓴다
  const info = document.createElement('p');
  info.className = 'toc-info'; info.hidden = true;
  const tagBox = document.createElement('div');
  tagBox.className = 'toc-tags';
  let active = null;
  all.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tag'; b.textContent = '#' + t; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { active = active === t ? null : t; if (active && window.KW) KW.add('#' + t); apply(); });
    tagBox.appendChild(b);
  });
  if (all.length) {
    const tg = document.createElement('button');
    tg.type = 'button'; tg.className = 'toc-tagtg'; tg.setAttribute('aria-expanded', 'false');
    tg.textContent = '태그 ' + all.length + '개';
    tagBox.hidden = true;
    tg.addEventListener('click', () => { const on = tagBox.hidden; tagBox.hidden = !on; tg.setAttribute('aria-expanded', String(on)); });
    tools.append(tg, tagBox);
  }
  toc.before(tools, info);
  toc.replaceChildren(frag);

  function apply() {
    const words = norm(q.value.trim()).split(' ').filter(Boolean);
    const filtering = words.length > 0 || active;
    let n = 0;
    tagBox.querySelectorAll('.tag').forEach((b) => b.setAttribute('aria-pressed', String('#' + active === b.textContent)));
    groups.forEach((g) => {
      const hit = (it) => (!active || it.tags.includes(active)) && words.every((w) => it.text.includes(w));
      const subHit = g.subs.filter(hit);
      const headHit = hit(g.head);
      const show = headHit || subHit.length > 0;
      g.box.hidden = !show;
      [g.head, ...g.subs].forEach((it) => { it.a.hidden = filtering && !(it === g.head ? show : hit(it)); });
      if (filtering && show) { n += (headHit ? 1 : 0) + subHit.length; setOpen(g, subHit.length > 0); }
    });
    info.hidden = !filtering;
    info.textContent = n ? `${n}개 항목을 찾았다.` : '찾는 항목이 없다.';
  }

  // 지금 읽는 위치의 그룹은 자동으로 펼친다
  const head = new Map();
  groups.forEach((g) => [g.head, ...g.subs].forEach((it) => head.set(it.a, g)));
  new MutationObserver((ms) => ms.forEach((m) => {
    const a = m.target;
    if (a.classList.contains('active') && !q.value && !active) groups.forEach((g) => setOpen(g, g === head.get(a)));
  })).observe(toc, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();

/* 리눅스 계열 전환: 혼합 · Debian · Red Hat
 * 어느 쪽으로 가든 같은 연출이다. 두 계열의 글자가 뒤섞여 흔들리다가 왼쪽부터 제자리로 확정되고,
 * 계열 카드와 패널이 흐릿하게 모여들며 재배치된다. 전체 0.34초 안에 끝난다.
 * 모드는 <html data-mode>에 저장되고, 색과 보이는 내용은 linux.css가 이 값을 보고 바꾼다. */
(() => {
  const root = document.documentElement, KEY = 'dev-steps.distro';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = root.dataset.mode || 'mix', job = null;

  const btns = () => [...document.querySelectorAll('.dsw button')];
  const mark = (m) => btns().forEach((b) => {
    const on = b.dataset.mode === m;
    b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
  });
  const apply = (m) => {
    root.dataset.mode = m; cur = m; mark(m);
    try { localStorage.setItem(KEY, m); } catch { /* 저장이 막힌 브라우저 */ }
    document.dispatchEvent(new CustomEvent('distro', { detail: m }));
  };
  mark(cur);

  // 화면에 보이는 글자 조각을 모은다
  function collect() {
    const out = [];
    document.querySelectorAll('.hero-l, main, .tmux').forEach((r) => {
      const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const p = n.parentElement;
          if (!p || p.closest('script,style,canvas,svg') || !p.offsetParent) return NodeFilter.FILTER_REJECT;
          const b = p.getBoundingClientRect();
          return b.bottom < -150 || b.top > innerHeight + 150 ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        },
      });
      while (w.nextNode()) out.push(w.currentNode);
    });
    return out.map((n) => {
      const b = n.parentElement.getBoundingClientRect();
      return { n, orig: n.nodeValue, y: Math.min(1, Math.max(0, (b.top + 150) / (innerHeight + 300))) };
    });
  }
  // 글자가 왼쪽부터 원래 글자로 확정되고, 나머지는 pool의 글자로 흔들린다
  function scramble(list, t, t0, span, dur, pool) {
    for (const o of list) {
      const p = (t - (t0 + o.y * span)) / dur;
      let s;
      if (p >= 1) s = o.orig;
      else {
        const k = Math.max(0, Math.floor(p * o.orig.length));
        s = '';
        for (let i = 0; i < o.orig.length; i++) {
          const c = o.orig[i];
          s += i < k || /\s/.test(c) ? c : pool[(Math.random() * pool.length) | 0];
        }
      }
      if (o.n.nodeValue !== s) o.n.nodeValue = s;
    }
  }
  const restore = (list) => list.forEach((o) => { if (o.n.nodeValue !== o.orig) o.n.nodeValue = o.orig; });

  function runFuse(target) {
    const t0 = performance.now(), anims = []; let raf = 0;
    apply(target);
    const list = collect();
    const pool = 'DebianUbuntuaptdpkgRedHatRHELdnfrpm';
    document.querySelectorAll('.fam-c').forEach((c, i) => {
      anims.push(c.animate(
        [{ transform: 'translateX(' + (i ? -42 : 42) + '%) scale(.96)', opacity: 0.15, filter: 'blur(6px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
        { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
    });
    document.querySelectorAll('.pn, .idx a, table th, table td, .term').forEach((e) => {
      const b = e.getBoundingClientRect();
      if (!e.offsetParent || b.bottom < 0 || b.top > innerHeight + 100) return;
      anims.push(e.animate([{ filter: 'blur(4px)', opacity: 0.45 }, { filter: 'blur(0)', opacity: 1 }], { duration: 260, easing: 'ease-out', fill: 'backwards' }));
    });
    const state = { end() { root.classList.remove('switching'); cancelAnimationFrame(raf); anims.forEach((a) => a.cancel()); restore(list); job = null; } };
    (function tick(now) {
      const t = now - t0;
      scramble(list, t, 0, 140, 200, pool);
      if (t >= 340) { state.end(); return; }
      raf = requestAnimationFrame(tick);
    })(t0);
    return state;
  }

  function go(m) {
    if (job) { job.end(); }
    if (m === cur) return;
    if (reduce) { apply(m); return; }
    root.classList.add('switching');
    job = runFuse(m);
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('.dsw button'); if (b) go(b.dataset.mode); });
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest && e.target.closest('.dsw button');
    if (!b || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    const list = [...b.parentElement.querySelectorAll('button')], i = list.indexOf(b);
    const nx = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
    nx.focus(); go(nx.dataset.mode);
  });
})();

/* 메인 페이지의 글과 버튼
 * 메인 페이지 선택 버튼은 data/sites.js의 목록으로 만든다. 새 메인 페이지를 등록하면 여기에 버튼이 자동으로 생긴다.
 * window.__decode(): 글자가 무작위 문자에서 제자리로 확정되는 등장 효과(home.js가 메인 화면을 보일 때 부른다). */
(() => {
  const cfg = window.SITE_CONFIG;
  const list = document.getElementById('sites');
  if (cfg && list) {
    list.style.setProperty('--n', String(cfg.sites.length)); // 카드가 몇 개든 한 줄에 나란히(좁은 화면에서는 한 열)
    cfg.sites.forEach((s, i) => {
      const a = document.createElement('a');
      a.className = 'card'; a.href = 'guide/' + s.pages[0].href; a.style.setProperty('--pc', s.c);
      a.innerHTML = '<span class="no"></span><b></b><span class="d"></span><span class="go">들어가기 →</span>';
      a.querySelector('.no').textContent = String(i + 1).padStart(2, '0');
      a.querySelector('b').textContent = s.name;
      a.querySelector('.d').textContent = s.d;
      list.append(a);
    });
    const kw = document.getElementById('kw');
    if (kw) kw.href = 'guide/' + cfg.keywords.href;
  }

  const POOL = '01{}[]<>/\\|#$%&*+=-:;.,~^?!_()@abcdefghijklmnopqrstuvwxyz';
  let token = 0;
  window.__decode = () => {
    const my = ++token, nodes = [];
    const w = document.createTreeWalker(document.querySelector('.main'), NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (/\S/.test(n.nodeValue) && !n.parentElement.closest('noscript') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    while (w.nextNode()) nodes.push(w.currentNode);
    const list2 = nodes.map((n, i) => ({ n, orig: n.nodeValue, start: i * 55 }));
    const t0 = performance.now();
    (function tick(now) {
      if (my !== token) return;
      const t = now - t0; let alive = false;
      for (const o of list2) {
        const p = (t - o.start) / 420;
        if (p >= 1) { if (o.n.nodeValue !== o.orig) o.n.nodeValue = o.orig; continue; }
        alive = true;
        const k = Math.max(0, Math.floor(p * o.orig.length));
        let s = '';
        for (let i = 0; i < o.orig.length; i++) s += i < k || /\s/.test(o.orig[i]) ? o.orig[i] : POOL[(Math.random() * POOL.length) | 0];
        o.n.nodeValue = s;
      }
      if (alive) requestAnimationFrame(tick);
    })(t0);
    // 혹시 애니메이션이 멈춰도 글은 반드시 원래대로 돌려 놓는다
    setTimeout(() => { if (my === token) list2.forEach((o) => { o.n.nodeValue = o.orig; }); }, 1500);
  };
})();

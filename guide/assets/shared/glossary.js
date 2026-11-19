/* 용어 설명창 엔진
 * 사전 데이터는 data/glossary/*.json이 원본이고, tools의 npm run build가 data/generated/glossary-data.js로 만든다.
 * 이 파일은 그 데이터를 읽어 페이지 글에서 용어를 찾아 점선 밑줄을 긋고, 마우스를 올리면(키보드는 포커스, 터치는 탭) 설명창을 띄운다.
 * 설명창: 발음, 풀네임(줄임말일 때), 직역, 한 줄 뜻. 같은 용어는 섹션마다 처음 한 번만 표시한다.
 * 용어 추가·수정은 이 파일이 아니라 JSON에서 한다. */
(() => {
  const TERMS = (window.GLOSSARY_DATA || []).map((e) => ({ k: e.match, n: e.name, say: e.say || '', full: e.full || '', lit: e.literal || '', d: e.desc || '' }));
  /* ── 엔진 ── */
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const map = new Map();
  TERMS.forEach((e, i) => e.k.forEach((k) => map.set(k.toLowerCase(), i)));
  const alts = [...map.keys()].sort((a, b) => b.length - a.length).map(esc).join('|');
  const RE = new RegExp('(?<![A-Za-z0-9_])(' + alts + ')(?![A-Za-z0-9_])', 'gi');
  const SKIP = 'script,style,pre,kbd,textarea,input,button,select,svg,canvas,nav,h1,summary,.gl,.topbar,.pm,.dsw,.tmux,.eyebrow,.vl,.cn,.kq,[data-toc],.idx,.mini,.rail,.pn-h,.tabs';

  function annotate(root) {
    const seen = new Set(), nodes = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) { return /\S/.test(n.nodeValue) && n.parentElement && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; },
    });
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => {
      const p = n.parentElement;
      const sec = p.closest('section,details,.ch,.pn,article');
      const scope = (sec && (sec.id || sec.tagName)) + '|' + ((p.closest('[data-m]') || {}).dataset ? p.closest('[data-m]').dataset.m : '');
      const text = n.nodeValue; let last = 0, out = null; RE.lastIndex = 0;
      let m;
      while ((m = RE.exec(text))) {
        const idx = map.get(m[1].toLowerCase()), key = idx + '@' + scope;
        if (seen.has(key)) continue;
        seen.add(key);
        out = out || document.createDocumentFragment();
        if (m.index > last) out.append(text.slice(last, m.index));
        const s = document.createElement('span');
        s.className = 'gl'; s.tabIndex = 0; s.dataset.g = idx; s.textContent = m[1];
        out.append(s); last = m.index + m[1].length;
      }
      if (out) { if (last < text.length) out.append(text.slice(last)); n.replaceWith(out); }
    });
  }

  /* ── 설명창 ── */
  const tip = document.createElement('div');
  tip.className = 'gl-tip'; tip.id = 'gl-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  let cur = null;
  const row = (dt, dd) => (dd ? '<dt>' + dt + '</dt><dd>' + dd + '</dd>' : '');
  const safe = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function show(el) {
    const e = TERMS[el.dataset.g]; if (!e) return;
    cur = el;
    const showFull = e.full && e.full.toLowerCase() !== e.n.toLowerCase();
    tip.innerHTML = '<div class="gl-h"><b>' + safe(e.n) + '</b></div><dl>'
      + row('발음', safe(e.say)) + (showFull ? row('풀네임', safe(e.full)) : '') + row('직역', safe(e.lit)) + '</dl><p>' + safe(e.d) + '</p>';
    tip.hidden = false;
    el.setAttribute('aria-describedby', tip.id);
    const r = el.getClientRects()[0] || el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = Math.min(Math.max(8, r.left), innerWidth - tw - 8), y = r.bottom + 8;
    if (y + th > innerHeight - 8 && r.top - th - 8 > 8) y = r.top - th - 8;
    tip.style.left = x + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  function hide() { if (cur) cur.removeAttribute('aria-describedby'); cur = null; tip.hidden = true; }

  function init() {
    document.body.append(tip);
    annotate(document.body);
    const at = (e) => e.target.closest && e.target.closest('.gl');
    document.addEventListener('pointerover', (e) => { if (e.pointerType === 'touch') return; const g = at(e); if (g && g !== cur) show(g); });
    document.addEventListener('pointerout', (e) => { const g = at(e); if (g && !(e.relatedTarget && g.contains(e.relatedTarget))) hide(); });
    document.addEventListener('focusin', (e) => { const g = at(e); if (g) show(g); });
    document.addEventListener('focusout', (e) => { if (at(e)) hide(); });
    document.addEventListener('pointerdown', (e) => {
      const g = at(e);
      if (e.pointerType === 'touch' && g) { if (g === cur) hide(); else show(g); } else if (!g) hide();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    addEventListener('scroll', hide, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.GLOSSARY = { count: TERMS.length, annotate };
})();

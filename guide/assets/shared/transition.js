/* 메인 페이지 사이 이동 연출 · 코드 디졸브 (모든 페이지 공용)
 * 반드시 <head>에서 동기(defer 없이)로 불러온다. 새 페이지의 첫 화면이 그려지기 전에 덮개를 올려야 깜빡임이 없다.
 *
 * 다른 메인 페이지(메인 · VS Code 공부 · 리눅스 · 네트워크 · 키워드)로 가는 링크를 누르면
 *   1) 화면 전체에 코드 글자가 한꺼번에 나타나 난수로 계속 뒤바뀌고, 그 뒤로 도착 페이지의 색이 서서히 번져(디졸브) 화면을 채운다.
 *   2) 새 페이지는 같은 코드 장막으로 시작해서, 글자가 무작위로 하나씩 꺼지고 장막이 투명해지며 페이지가 드러난다.
 * 잘린 조각이 움직이지 않고 한 장의 코드 장막이 번졌다 걷히는 방식이다.
 * 부드러움: 장막의 색 번짐(투명도)은 WAAPI로 브라우저 합성 스레드가 돌려서 새 페이지가 로딩 중이어도 멈추지 않고,
 * 글자 뒤바뀜은 초당 약 24번만 그린다(글자 그림은 미리 만든 판에서 찍어 가볍다).
 * 같은 사이트 안의 탭 이동, 새 탭, 해시 이동, 모션 줄이기 설정에서는 쓰지 않는다. 시간은 OUT·IN, 색은 THEMES에서 고친다. */
(() => {
  'use strict';
  if (window.__trLoaded) return; window.__trLoaded = true;
  const OUT = 310, IN = 380, KEY = 'dev-steps.tr', TICK = 42;
  const THEMES = {
    home: { bg: '#f1efe9', fg: '#101010', cmd: '$ cd ~' },
    vscode: { bg: '#080c11', fg: '#4ade80', cmd: '$ code .' },
    keywords: { bg: '#080c11', fg: '#fbbf24', cmd: '$ grep -r keyword' },
    linux: { bg: '#080b09', fg: '#5ee08f', cmd: '$ cd ~/linux' },
    network: { bg: '#e8eef4', fg: '#1d6fb8', cmd: '$ ping network' },
  };
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const keyOf = (u) => {
    const p = new URL(u, location.href).pathname.toLowerCase();
    if (/\/linux\.html$/.test(p)) return 'linux';
    if (/\/network\.html$/.test(p)) return 'network';
    if (/\/keywords\.html$/.test(p)) return 'keywords';
    if (/\/guide\//.test(p)) return 'vscode';
    return 'home';
  };
  const me = keyOf(location.href);
  const GL = '01{}[]<>/\\;=+-*&|#$%@abcdefxyz()?!:';
  const MONO = '"Cascadia Mono","Cascadia Code",Consolas,"D2Coding","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",monospace';
  const smooth = (u) => u * u * (3 - 2 * u);

  /* 장막: 색 번짐 층(div) + 코드 글자 층(canvas) + 명령 문구 */
  function build(th) {
    const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 1.5);
    const cw = W < 700 ? 14 : 18, ch = W < 700 ? 20 : 26, cols = Math.ceil(W / cw), rows = Math.ceil(H / ch), n = cols * rows;
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147482990;pointer-events:none;contain:strict';
    const bg = document.createElement('div');
    bg.style.cssText = `position:absolute;inset:0;background:${th.bg};opacity:0;will-change:opacity`;
    const cv = document.createElement('canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    const label = document.createElement('div');
    label.textContent = th.cmd;
    label.style.cssText = `position:absolute;left:${Math.max(20, W * 0.06)}px;bottom:${Math.max(36, H * 0.12)}px;font:700 ${W < 700 ? 18 : 30}px/1.2 ${MONO};color:${th.fg};opacity:0;text-shadow:0 0 16px ${th.bg},0 0 4px ${th.bg}`;
    wrap.append(bg, cv, label); root.append(wrap);

    /* 글자 판: 글자마다 한 번만 그려 두고 칸마다 찍는다 */
    const atlas = document.createElement('canvas'); atlas.width = cw * GL.length * dpr; atlas.height = ch * dpr;
    const A = atlas.getContext('2d'); A.scale(dpr, dpr);
    A.font = `700 ${ch - 8}px ${MONO}`; A.textAlign = 'center'; A.textBaseline = 'middle'; A.fillStyle = th.fg;
    [...GL].forEach((c, i) => A.fillText(c, i * cw + cw / 2, ch / 2));
    const g = cv.getContext('2d'), thr = new Float32Array(n), gl = new Uint8Array(n), al = new Float32Array(n);
    for (let i = 0; i < n; i++) { thr[i] = Math.random(); gl[i] = Math.random() * GL.length; al[i] = 0.25 + Math.random() * 0.6; }

    /* dens: 0~1. 칸마다 정해진 문턱(thr)보다 작으면 켜진다. 켜진 칸은 매번 글자가 난수로 바뀐다 */
    function draw(dens) {
      g.clearRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < n; i++) {
        if (thr[i] >= dens) continue;
        gl[i] = (Math.random() * GL.length) | 0;
        if (Math.random() < 0.18) al[i] = 0.25 + Math.random() * 0.6;
        g.globalAlpha = al[i];
        g.drawImage(atlas, gl[i] * cw * dpr, 0, cw * dpr, ch * dpr, (i % cols) * cw * dpr, ((i / cols) | 0) * ch * dpr, cw * dpr, ch * dpr);
      }
      g.globalAlpha = 1;
    }
    return { wrap, bg, label, draw };
  }

  /* cover=true: 글자가 나타나고 색이 번져 덮는다 / false: 글자가 꺼지고 색이 걷혀 드러난다. hold면 끝난 뒤에도 글자가 계속 바뀐다 */
  function play(o, ms, cover, hold) {
    return new Promise((done) => {
      const t0 = performance.now(); let last = 0, fin = false;
      o.bg.animate(cover ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
        { duration: ms * 0.85, delay: cover ? ms * 0.12 : ms * 0.1, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'both' });
      o.label.animate(cover ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], { duration: ms * 0.45, delay: cover ? ms * 0.4 : 0, fill: 'both' });
      const dens = (u) => (cover ? Math.min(1, smooth(Math.min(1, u * 1.5)) * 1.05) : 1 - smooth(Math.min(1, Math.max(0, (u - 0.08) / 0.92))));
      const frame = (now) => {
        const u = Math.min(1, (now - t0) / ms);
        if (now - last >= TICK) { last = now; o.draw(dens(u)); }
        if (u < 1 || (hold && fin)) requestAnimationFrame(frame);
        if (u >= 1 && !fin) { fin = true; if (hold) requestAnimationFrame(frame); done(); }
      };
      requestAnimationFrame(frame);
    });
  }

  /* 들어오는 연출: 이전 페이지가 표시를 남겼으면 첫 화면이 그려지기 전부터 장막으로 덮어 둔다 */
  let flag = null;
  try { flag = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch { /* 저장이 막힌 브라우저 */ }
  if (flag && Date.now() - flag.t < 5000 && !reduce) {
    const th = THEMES[me] || THEMES.vscode, o = build(th);
    o.bg.style.opacity = '1'; o.label.style.opacity = '1'; o.draw(1);
    let started = false;
    const start = () => { if (started) return; started = true; requestAnimationFrame(() => requestAnimationFrame(() => play(o, IN, false).then(() => o.wrap.remove()))); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
    setTimeout(start, 3000); // 어떤 이유로든 장막이 남지 않게 한다
  }
  addEventListener('pageshow', (e) => { if (e.persisted) document.querySelectorAll('div[style*="2147482990"]').forEach((d) => d.remove()); });

  /* 나가는 연출 */
  let going = false;
  document.addEventListener('click', (e) => {
    if (going || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduce) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href);
    if (u.protocol !== location.protocol || (u.hash && u.pathname === location.pathname)) return;
    const to = keyOf(u.href);
    if (to === me) return;
    e.preventDefault(); going = true;
    const th = THEMES[to] || THEMES.vscode, o = build(th);
    let gone = false;
    const go = () => { if (gone) return; gone = true; try { sessionStorage.setItem(KEY, JSON.stringify({ to, t: Date.now() })); } catch { /* 저장이 막힌 브라우저 */ } location.href = u.href; };
    play(o, OUT, true, true).then(() => requestAnimationFrame(go));
    setTimeout(go, OUT + 600); // 어떤 이유로든 연출이 멈춰도 이동은 한다
  }, true);
})();

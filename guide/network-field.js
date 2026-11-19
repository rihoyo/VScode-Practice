/* 네트워크 페이지 배경: 화면 전체에 깔리는 실시간 관계 그래프.
 * 노드는 리사주 곡선(서로 다른 주파수의 sin·cos)으로 떠다니고, 가까운 노드끼리 선으로 이어진다.
 * 허브는 파문을 내보내고, 선 위로 패킷이 흐르며, 숫자 격자는 사인파로 밝아진다. 마우스는 노드를 끌어당긴다.
 * 모션 줄이기 설정이면 한 장면만 그리고 멈춘다. */
(() => {
  const cv = document.getElementById('field');
  if (!cv) return;
  const g = cv.getContext('2d');
  const MONO = '"Cascadia Mono",Consolas,"D2Coding","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",monospace';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAGS = ['10.0.0.0/24', '192.168.1.1', '2^(32−n)', 'AS65001', '0xC0A80001', 'TTL=64', 'VPC 10.1.0.0/16', 'RTT 12ms', '172.16.0.0/12', 'L3 · 라우팅', 'VLAN 20', 'BGP'];
  const hudN = document.getElementById('h-n'), hudE = document.getElementById('h-e'), hudK = document.getElementById('h-k');
  let w = 0, h = 0, dpr = 1, nodes = [], tags = [], mx = -999, my = -999, fade = 1, hudAt = -1, edgeCount = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.max(34, Math.min(104, (w * h) / 15000)));
    nodes = Array.from({ length: n }, (_, i) => ({
      hx: rnd(-.04, 1.04) * w, hy: rnd(-.04, 1.04) * h,
      A: rnd(24, 90), B: rnd(24, 90), a: rnd(.12, .42), b: rnd(.1, .4), p: rnd(0, 6.28), q: rnd(0, 6.28),
      hub: i % 11 === 0, px: 0, py: 0, x: 0, y: 0,
    }));
    tags = TAGS.map((s, i) => ({ s, hx: rnd(.05, .95) * w, hy: rnd(.08, .92) * h, A: rnd(20, 50), a: rnd(.08, .2), p: rnd(0, 6.28), i }));
  }

  function frame(t) {
    g.clearRect(0, 0, w, h);
    const f = fade, LINK = Math.min(165, Math.max(110, w / 9));
    // 숫자 격자: 사인파가 지나가며 밝아진다
    const cw = 30, ch = 34;
    g.font = `11px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let cy = 0; cy * ch < h + ch; cy++) {
      for (let cx = 0; cx * cw < w + cw; cx++) {
        const x = cx * cw + cw / 2, y = cy * ch + ch / 2;
        const wave = Math.max(0, Math.sin(cx * .31 + cy * .19 - t * 1.05)) ** 4;
        const dx = x - mx, dy = y - my, near = Math.max(0, 1 - Math.hypot(dx, dy) / 200);
        const al = (0.05 + wave * 0.34 + near * 0.4) * f;
        if (al < 0.03) continue;
        const k = Math.floor(t * 0.6 + ((cx * 73856093) ^ (cy * 19349663)) % 7);
        const hv = (((cx * 31 + cy * 17 + k * 13) % 16) + 16) % 16;
        g.fillStyle = `rgba(${near > .2 || wave > .5 ? '29,111,184' : '110,135,165'},${Math.min(al, .75)})`;
        g.fillText(wave > .25 ? hv.toString(16).toUpperCase() : (hv & 1 ? '1' : '0'), x, y);
      }
    }
    // 노드 위치: 리사주 곡선 + 마우스 인력
    for (const n of nodes) {
      let x = n.hx + n.A * Math.sin(n.a * t + n.p), y = n.hy + n.B * Math.cos(n.b * t + n.q);
      const dx = mx - x, dy = my - y, d = Math.hypot(dx, dy), R = 230;
      const tx = d < R ? dx * (1 - d / R) ** 2 * .42 : 0, ty = d < R ? dy * (1 - d / R) ** 2 * .42 : 0;
      n.px += (tx - n.px) * .08; n.py += (ty - n.py) * .08;
      n.x = x + n.px; n.y = y + n.py;
    }
    // 선과 패킷
    let edges = 0; const deg = new Array(nodes.length).fill(0);
    g.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], L = (a.hub || b.hub) ? LINK * 1.55 : LINK;
        const dx = a.x - b.x, dy = a.y - b.y; if (Math.abs(dx) > L || Math.abs(dy) > L) continue;
        const d = Math.hypot(dx, dy); if (d > L) continue;
        const s = 1 - d / L; edges++; deg[i]++; deg[j]++;
        g.strokeStyle = `rgba(29,111,184,${(s ** 1.4 * .55 * f + .03).toFixed(3)})`;
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        if ((i * 7 + j * 13) % 8 === 0 && s > .25) {
          const u = (t * .35 + (i * 0.137 + j * 0.071)) % 1;
          g.fillStyle = `rgba(8,160,196,${.9 * f})`;
          g.beginPath(); g.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 2.2, 0, 6.283); g.fill();
        }
      }
      // 마우스 노드와의 연결
      const md = Math.hypot(a.x - mx, a.y - my);
      if (md < 200) { g.strokeStyle = `rgba(8,160,196,${(1 - md / 200) * .8})`; g.beginPath(); g.moveTo(mx, my); g.lineTo(a.x, a.y); g.stroke(); }
    }
    edgeCount = edges;
    // 노드와 허브 파문
    nodes.forEach((n, i) => {
      if (n.hub) {
        for (let k = 0; k < 2; k++) {
          const u = ((t * .22 + k * .5 + i * .13) % 1);
          g.strokeStyle = `rgba(8,160,196,${(1 - u) * .38 * f})`;
          g.beginPath(); g.arc(n.x, n.y, 6 + u * 70, 0, 6.283); g.stroke();
        }
        g.fillStyle = '#1d6fb8'; g.beginPath(); g.arc(n.x, n.y, 4.6, 0, 6.283); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.lineWidth = 1;
      } else {
        g.fillStyle = `rgba(70,140,205,${.55 + .35 * f})`; g.beginPath(); g.arc(n.x, n.y, 2.1 + Math.min(deg[i], 5) * .18, 0, 6.283); g.fill();
      }
    });
    // 떠다니는 주소 표기
    g.font = `11px ${MONO}`; g.textAlign = 'left';
    for (const s of tags) {
      const x = s.hx + s.A * Math.sin(s.a * t + s.p), y = s.hy + s.A * .8 * Math.cos(s.a * 1.3 * t + s.p);
      g.fillStyle = `rgba(20,33,46,${.5 * f})`; g.fillRect(x - 5, y - 1, 3, 3);
      g.fillText(s.s, x, y + .5);
    }
    // 실시간 지표
    if (hudN && t - hudAt > .5) {
      hudAt = t; hudN.textContent = nodes.length; hudE.textContent = edges;
      hudK.textContent = (2 * edges / nodes.length).toFixed(2);
    }
  }

  function onScroll() { fade = Math.max(.38, 1 - scrollY / (innerHeight * .9)); }
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener('pointerleave', () => { mx = my = -999; });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { build(); if (reduce) frame(0); });
  build(); onScroll();
  if (reduce) { frame(2); return; }
  const t0 = performance.now();
  (function loop(now) { if (!document.hidden) frame((now - t0) / 1000); requestAnimationFrame(loop); })(t0);
})();

/* 기술 연결 지도 · d3 물리 엔진으로 움직이는 마인드맵
 * 데이터는 map-data.js, d3는 vendor/d3.min.js(npm run build로 복사)에 있어.
 */
(() => {
  const { ST, NODES, EDGES } = MAP_DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s) => document.querySelector(s);
  const canvas = $('#map-canvas');
  if (!canvas) return;
  let P = $('#panel');

  if (!window.d3) {
    P.innerHTML = '<p class="hint"><b>$ d3 not found</b>guide/vendor/d3.min.js가 없다. tools 폴더에서 npm install 다음 npm run build를 실행한다.</p>';
    return;
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NH = 46;          // 노드 높이
  const BASE = 0.05;      // 평소에도 살짝 움직이게 하는 엔진 열기
  let paused = reduce;    // 움직임 줄이기 설정이면 멈춘 채 시작

  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const chamfer = (w, h, c) => `M${-w / 2 + c},${-h / 2}H${w / 2}V${h / 2 - c}L${w / 2 - c},${h / 2}H${-w / 2}V${-h / 2 + c}Z`;

  const nodes = Object.entries(NODES).map(([id, n]) => ({ id, ...n }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const links = EDGES.map((e) => ({ e, source: e.a, target: e.b }));

  const svg = d3.select('#map-svg');
  const world = svg.append('g');
  const gEdges = world.append('g');
  const gNodes = world.append('g');
  const gFx = world.append('g').attr('pointer-events', 'none');

  // ── 연결선 ──
  const edgeG = gEdges.selectAll('g').data(links).join('g')
    .attr('class', 'edge-g').attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', (l) => `${byId[l.e.a].name}와 ${byId[l.e.b].name}의 연결: ${l.e.label}`)
    .style('--ec', (l) => ST[l.e.status].c);
  edgeG.append('line').attr('class', 'hit');
  edgeG.append('line').attr('class', 'edge');
  const dotG = edgeG.append('g').attr('class', 'dotg');
  const dotIn = dotG.append('g').attr('transform', 'rotate(45)');
  dotIn.append('rect').attr('class', 'ring').attr('x', -6).attr('y', -6).attr('width', 12).attr('height', 12);
  dotIn.append('rect').attr('class', 'dot').attr('x', -5).attr('y', -5).attr('width', 10).attr('height', 10);
  edgeG.append('text').attr('class', 'elabel').text((l) => l.e.label);

  // ── 기술 노드 (각진 카드) ──
  const nodeG = gNodes.selectAll('g').data(nodes, (d) => d.id).join('g')
    .attr('class', (d) => 'node' + (d.ghost ? ' ghost' : ''))
    .attr('tabindex', 0).attr('role', 'button').attr('aria-label', (d) => d.name)
    .style('--c', (d) => d.c);
  nodeG.each(function (d) {
    const inner = d3.select(this).append('g').attr('class', 'node-in');
    const body = inner.append('path').attr('class', 'body');
    const box = inner.append('rect').attr('class', 'gbox');
    const gl = inner.append('text').attr('class', 'glyph').text(d.glyph);
    const lb = inner.append('text').attr('class', 'nlabel').text(d.name);
    const tl = lb.node().getComputedTextLength() || d.name.length * 14;
    d.h = NH;
    d.w = Math.round(NH + 14 + tl + 18);
    body.attr('d', chamfer(d.w, d.h, 9));
    box.attr('x', -d.w / 2).attr('y', -d.h / 2).attr('width', d.h).attr('height', d.h);
    gl.attr('x', -d.w / 2 + d.h / 2).attr('y', 1);
    lb.attr('x', -d.w / 2 + d.h + 12).attr('y', 1);
  });

  const edgeEl = {}, nodeEl = {}, chipEl = {};
  edgeG.each(function (l) { edgeEl[l.e.id] = this; });
  nodeG.each(function (d) { nodeEl[d.id] = this; });

  // 사각형 테두리와 중심선이 만나는 점
  function anchor(n, t, gap = 5) {
    let dx = t.x - n.x, dy = t.y - n.y;
    if (!dx && !dy) dx = 1;
    const k = 1 / Math.max(Math.abs(dx) / (n.w / 2), Math.abs(dy) / (n.h / 2));
    const len = Math.hypot(dx, dy);
    return { x: n.x + dx * k + (dx / len) * gap, y: n.y + dy * k + (dy / len) * gap };
  }

  function render() {
    nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`);
    edgeG.each(function (l) {
      const a = l.source, b = l.target;
      const p = anchor(a, b), q = anchor(b, a);
      const g = d3.select(this);
      g.selectAll('line').attr('x1', p.x).attr('y1', p.y).attr('x2', q.x).attr('y2', q.y);
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      g.select('.dotg').attr('transform', `translate(${mx},${my})`);
      g.select('.elabel').attr('x', mx).attr('y', my + 26);
    });
  }

  // ── 물리 엔진 ──
  const drift = () => {
    const t = performance.now() / 1000;
    nodes.forEach((n, i) => {
      if (n.fx != null) return;
      n.vx += Math.sin(t * 0.6 + i * 1.7) * 0.06;
      n.vy += Math.cos(t * 0.5 + i * 2.3) * 0.06;
    });
  };
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d) => d.id).distance((l) => (l.e.dist || 220) * 0.78).strength(0.7))
    .force('charge', d3.forceManyBody().strength((d) => (d.ghost ? -150 : -750)).distanceMax(1000))
    .force('collide', d3.forceCollide((d) => d.w / 2 + 26).iterations(2))
    .force('x', d3.forceX(0).strength((d) => (d.ghost ? 0.12 : 0.028)))
    .force('y', d3.forceY(0).strength((d) => (d.ghost ? 0.12 : 0.045)))
    .force('drift', drift)
    .alphaTarget(BASE)
    .on('tick', render);
  sim.stop();
  sim.tick(320);
  render();
  if (!paused) sim.restart();

  // ── 확대·이동 ──
  // 휠 제스처가 지도 위에서 시작됐을 때만 확대·축소하고, 지도 밖에서 시작한 휠은 페이지 스크롤로 넘겨
  let wheelOwner = 'page', wheelAt = 0;
  document.addEventListener('wheel', (e) => {
    if (e.timeStamp - wheelAt > 220) wheelOwner = canvas.contains(e.target) ? 'map' : 'page';
    wheelAt = e.timeStamp;
  }, { capture: true, passive: true });

  const zoom = d3.zoom().scaleExtent([0.25, 2.5])
    .filter((e) => (e.type === 'wheel' ? e.ctrlKey || wheelOwner === 'map' : !e.ctrlKey && !e.button))
    .on('zoom', (e) => {
    world.attr('transform', e.transform);
    canvas.style.setProperty('--gx', e.transform.x + 'px');
    canvas.style.setProperty('--gy', e.transform.y + 'px');
    canvas.style.setProperty('--gs', 32 * e.transform.k + 'px');
  });
  svg.call(zoom).on('dblclick.zoom', null);
  svg.on('pointerdown.hint', () => canvas.classList.add('used'));

  function fit(list, maxK = 1.2, animate = true) {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    // 패널을 뺀 나머지 영역의 중앙에 맞춰: 넓은 화면은 오른쪽 패널, 좁은 화면은 아래 패널
    const open = P && !P.hidden;
    const sheet = matchMedia('(max-width: 900px)').matches;
    const inset = open && !sheet ? P.offsetWidth + 24 : 0;
    const Hv = Math.max(120, H - (open && sheet ? P.offsetHeight : 0));
    const x0 = d3.min(list, (n) => n.x - n.w / 2), x1 = d3.max(list, (n) => n.x + n.w / 2);
    const y0 = d3.min(list, (n) => n.y - n.h / 2), y1 = d3.max(list, (n) => n.y + n.h / 2);
    const pad = 70;
    const k = Math.max(0.3, Math.min(maxK, (W - inset) / (x1 - x0 + 2 * pad), Hv / (y1 - y0 + 2 * pad)));
    const tx = (W - inset) / 2 - ((x0 + x1) / 2) * k, ty = Hv / 2 -((y0 + y1) / 2) * k;
    const T = d3.zoomIdentity.translate(tx, ty).scale(k);
    if (animate && !reduce) svg.transition().duration(750).ease(d3.easeCubicInOut).call(zoom.transform, T);
    else svg.call(zoom.transform, T);
  }

  // ── 노드 드래그: 놓으면 스프링처럼 제자리로 돌아와 ──
  nodeG.call(d3.drag()
    .on('start', (e, d) => { canvas.classList.add('used'); if (!paused && !e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; if (paused) { d.x = e.x; d.y = e.y; render(); } })
    .on('end', (e, d) => { if (!paused && !e.active) sim.alphaTarget(BASE); d.fx = null; d.fy = null; }));

  // ── 선택과 강조 ──
  let token = 0, cur = null;

  function bind(el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn(); } });
  }
  EDGES.forEach((e) => bind(edgeEl[e.id], () => select('edge', e.id, true)));
  nodes.forEach((n) => {
    bind(nodeEl[n.id], () => select('node', n.id, true));
    nodeEl[n.id].addEventListener('pointerenter', () => EDGES.forEach((e) => edgeEl[e.id].classList.toggle('hl', e.a === n.id || e.b === n.id)));
    nodeEl[n.id].addEventListener('pointerleave', () => EDGES.forEach((e) => edgeEl[e.id].classList.remove('hl')));
  });

  EDGES.forEach((e) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', 'false');
    b.style.setProperty('--ec', ST[e.status].c);
    b.textContent = `${byId[e.a].name} ⇄ ${byId[e.b].name}`;
    b.addEventListener('click', () => select('edge', e.id, true));
    $('#map-chips').appendChild(b); chipEl[e.id] = b;
  });

  function mark(kind, id) {
    const on = new Set(), onN = new Set([id]);
    if (kind === 'edge') { const e = EDGES.find((x) => x.id === id); on.add(id); onN.add(e.a); onN.add(e.b); }
    else EDGES.forEach((e) => { if (e.a === id || e.b === id) { on.add(e.id); onN.add(e.a); onN.add(e.b); } });
    EDGES.forEach((e) => {
      edgeEl[e.id].classList.toggle('on', on.has(e.id));
      edgeEl[e.id].classList.toggle('dim', !on.has(e.id));
      chipEl[e.id].setAttribute('aria-pressed', String(kind === 'edge' && e.id === id));
    });
    nodes.forEach((n) => {
      nodeEl[n.id].classList.toggle('on', onN.has(n.id));
      nodeEl[n.id].classList.toggle('dim', !onN.has(n.id));
    });
    return onN;
  }

  function select(kind, id, user) {
    token++; clearFx();
    cur = { kind, id };
    const onN = mark(kind, id);
    if (kind === 'edge') { renderEdge(EDGES.find((x) => x.id === id)); play(0); }
    else renderNode(id);
    if (user) fit([...onN].map((k) => byId[k]), kind === 'edge' ? 1.35 : 1.1);
  }

  // ── 패널 ──
  function fresh() { const n = P.cloneNode(false); n.hidden = false; P.replaceWith(n); return n; }
  function closeBtn() {
    P.querySelector('.p-close').addEventListener('click', () => { P.hidden = true; });
  }

  function renderEdge(e) {
    const sc = ST[e.status];
    P = fresh();
    P.id = 'panel';
    P.style.setProperty('--sc', sc.c);
    P.innerHTML = `
      <div class="p-top"><span class="badge st-${e.status}" style="--sc:${sc.c}">${sc.t}</span>
        <span class="p-btns"><button type="button" class="btn" id="replay">↻ 다시 보기</button><button type="button" class="btn p-close" aria-label="패널 닫기">✕</button></span></div>
      <h3 class="p-title"><span style="color:${byId[e.a].c}">${byId[e.a].name}</span><i>⇄</i><span style="color:${byId[e.b].c}">${byId[e.b].name}</span></h3>
      <p class="p-lead">${e.lead}</p>
      <ol class="steps">${e.steps.map((s, i) => {
        const from = byId[s.d > 0 ? e.a : e.b].name, to = byId[s.d > 0 ? e.b : e.a].name;
        return `<li><button type="button" class="step" data-i="${i}"><span class="si">${i + 1}</span><b>${s.pkt} <span class="dir">· ${from} → ${to}</span></b><span class="sd">${s.t}</span></button></li>`;
      }).join('')}</ol>
      <dl class="facts">
        <div><dt>오가는 것</dt><dd>${e.what}</dd></div>
        <div><dt>왜 필요해</dt><dd>${e.why}</dd></div>
        <div><dt>어떻게 다뤄</dt><dd>${e.how}</dd></div>
        <div><dt>성공 신호</dt><dd>${e.ok}</dd></div>
      </dl>
      ${e.link ? `<a class="btn p-go" href="${e.link}">관련 실습 보기 →</a>` : ''}`;
    closeBtn();
    P.querySelector('#replay').addEventListener('click', () => { token++; clearFx(); play(0); });
    P.querySelectorAll('.step').forEach((b) => b.addEventListener('click', () => { token++; clearFx(); play(+b.dataset.i, SLOW); }));
  }

  function renderNode(id) {
    const n = byId[id];
    const rel = EDGES.filter((e) => e.a === id || e.b === id);
    P = fresh();
    P.id = 'panel';
    P.style.setProperty('--sc', n.c);
    P.innerHTML = `
      <div class="p-top"><span class="badge" style="--sc:${n.c}">기술</span>
        <span class="p-btns"><button type="button" class="btn p-close" aria-label="패널 닫기">✕</button></span></div>
      <h3 class="p-title"><span style="color:${n.c}">${n.name}</span></h3>
      <p class="p-lead">${n.desc}</p>
      ${rel.length ? `<dl class="facts"><div><dt>연결된 기술 ${rel.length}개</dt><dd>눌러서 오가는 내용을 본다.</dd></div></dl><div class="chips" id="rel"></div>` : ''}
      ${n.link ? `<a class="btn p-go" href="${n.link}">관련 실습 보기 →</a>` : ''}`;
    closeBtn();
    const box = P.querySelector('#rel');
    rel.forEach((e) => {
      const o = e.a === id ? e.b : e.a;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.style.setProperty('--ec', ST[e.status].c);
      b.textContent = `${byId[o].name} · ${e.label}`;
      b.addEventListener('click', () => select('edge', e.id, true));
      box.appendChild(b);
    });
  }

  function setStep(i) {
    P.querySelectorAll('.step').forEach((b, k) => { b.classList.toggle('active', k === i); b.classList.remove('paused'); });
  }
  function clearFx() { gFx.selectAll('*').remove(); }

  // 선택하면 평소 속도로 자동 재생하고, 단계 버튼을 직접 누르면 SLOW배 느리게 보여줘
  const SLOW = 3;
  async function play(from, speed = 1) {
    const my = ++token;
    clearFx();
    const e = EDGES.find((x) => x.id === cur.id);
    if (reduce) { setStep(from); return; }
    for (let i = from; i < e.steps.length; i++) {
      setStep(i);
      P.style.setProperty('--dur', `${2.15 * speed}s`);
      await travel(e, e.steps[i], my, speed);
      if (my !== token) return;
      await sleep(900 * speed);
      if (my !== token) return;
    }
    P.querySelectorAll('.step.active').forEach((b) => b.classList.add('paused'));
  }

  // 각진 점이 연결선을 따라 이동 (노드가 움직여도 따라가)
  function travel(e, s, my, speed = 1) {
    return new Promise((res) => {
      const A = byId[e.a], B = byId[e.b];
      const color = ST[e.status].c;
      const g = mk('g', { class: 'pkt' }, gFx.node());
      g.style.setProperty('--pc', color);
      const offs = [30, 20, 10];
      const tails = offs.map((_, k) => mk('rect', { x: -(4 - k), y: -(4 - k), width: 2 * (4 - k), height: 2 * (4 - k), class: 'tail', transform: 'rotate(45)' }, g));
      mk('rect', { x: -12, y: -12, width: 24, height: 24, class: 'glow', transform: 'rotate(45)' }, g);
      mk('rect', { x: -6, y: -6, width: 12, height: 12, transform: 'rotate(45)' }, g);
      const lab = mk('text', { y: -20 }, g);
      lab.textContent = s.pkt;
      const dur = 1250 * speed, t0 = performance.now();
      const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
      function frame(now) {
        if (my !== token) { g.remove(); return res(); }
        const p0 = anchor(A, B), p1 = anchor(B, A);
        const from = s.d > 0 ? p0 : p1, to = s.d > 0 ? p1 : p0;
        const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
        const p = Math.min(1, (now - t0) / dur), q = ease(p);
        const at = (u) => ({ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u });
        const pt = at(q);
        g.setAttribute('transform', `translate(${pt.x},${pt.y})`);
        tails.forEach((c, k) => {
          const back = at(Math.max(0, q - offs[k] / len));
          c.setAttribute('transform', `translate(${back.x - pt.x},${back.y - pt.y}) rotate(45)`);
        });
        if (p < 1) requestAnimationFrame(frame);
        else {
          const dest = s.d > 0 ? B : A;
          const ring = mk('rect', { x: dest.x - dest.w / 2, y: dest.y - dest.h / 2, width: dest.w, height: dest.h, class: 'burst' }, gFx.node());
          ring.style.setProperty('--c', dest.c);
          setTimeout(() => ring.remove(), 800);
          g.remove(); res();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  // ── 도구 막대 ──
  $('#t-fit').addEventListener('click', () => fit(nodes, 1));
  $('#t-panel').addEventListener('click', () => { P.hidden = !P.hidden; if (!P.hidden) fit(nodes.filter((n) => nodeEl[n.id].classList.contains('on')), 1.2); });
  const playBtn = $('#t-play');
  function syncPlay() {
    playBtn.textContent = paused ? '▶ 움직임 켜기' : '⏸ 움직임 멈추기';
    playBtn.setAttribute('aria-pressed', String(paused));
  }
  playBtn.addEventListener('click', () => {
    paused = !paused;
    if (paused) sim.stop(); else sim.alphaTarget(BASE).restart();
    syncPlay();
  });
  syncPlay();
  $('#t-full').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (canvas.requestFullscreen) canvas.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => setTimeout(() => fit(nodes, 1), 150));

  select('edge', 'vscode-git', false);
  fit(nodes, 1, false);
})();

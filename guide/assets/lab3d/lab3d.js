/* 3D 테스트 · 긴 길 위로 카메라가 날아가는 스크롤 (레퍼런스 영상의 구성을 라이브러리 없이 CSS 3D로 따라 한다)
 * 구성: 1) 평면 첫 장면(세로 큰 글자 + 정보 + d3 관계 그래프)  2) 스크롤하면 장면이 눕고 입체 글자가 바닥에서 선다
 *       3) 카메라가 길을 따라 나아가며 구간(색)이 바뀌고, 카드와 설명 글이 바닥 위에 놓인다  4) 왼쪽 목차가 현재 구간을 가리킨다.
 * 움직임은 transform만 바꾼다. 스크롤 값은 부드럽게 따라가도록 보간한다. 내용은 아래 SECTIONS를 고친다. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const poster = $('#poster'), world = $('#world'), space = $('#space'), hud = $('#hud'), stage = $('#stage');
  if (!poster) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HERO = 1100, SEC = 1500, END = 900;

  /* ── 구간 내용(레퍼런스의 구간 구성: 제목 · 카드 3장 · 설명 글 · 아래 3열) ── */
  const code = (h) => `<pre class="code">${h}</pre>`;
  const win = (t, body) => `<div class="win"><div class="bar"><i></i><i></i><i></i><b>${t}</b></div><div class="body">${body}</div></div>`;
  const sk = (w) => `<s style="width:${w}%"></s>`;
  const SECTIONS = [
    { name: 'Git', c: '#2430e8', sub: '변경 내용을 기록하고 되돌리는 도구', href: 'git.html',
      s1: ['dark', code(`<i># 변경 내용을 기록한다</i>\n$ git add .\n$ git commit -m "<u>첫 커밋</u>"\n[main 3f9c2a1] <u>첫 커밋</u>\n 2 files changed\n$ git log --oneline\n<b>3f9c2a1</b> 첫 커밋`)],
      s2: ['', win('COMMITS', `<div class="row"><em>3f9c2a1</em><span>첫 커밋</span><span class="tag">main</span></div>${sk(86)}<div class="row"><em>a81d0be</em><span>문서 추가</span></div>${sk(62)}<span class="btn">PUSH</span>`)],
      s3: ['', `<div class="grid3"><s></s><s></s><s></s><s></s><s></s><s></s><s></s><s></s><s></s></div>`],
      caps: [['커밋은 저장 시점이다', '변경 내용에 이름을 붙여 기록한다'], ['브랜치로 작업을 나눈다', '원본을 건드리지 않고 시도한다'], ['푸시로 GitHub에 올린다', '기록이 온라인에 보관된다']],
      cols: [['커밋', '변경을 묶어 한 번의 기록으로 남긴다.'], ['브랜치', '갈래를 나눠 안전하게 실험한다.'], ['푸시와 풀', '원격 저장소와 기록을 주고받는다.']] },
    { name: 'GitHub', c: '#6a2bd8', sub: '기록을 온라인에 두고 함께 쓰는 곳', href: 'github.html',
      s1: ['', win('REPOSITORY', `<div class="row"><b style="font-size:20px">VScode-Practice</b><span class="tag">PUBLIC</span></div>${sk(90)}${sk(74)}<div class="row"><span class="btn">CLONE</span><span class="tag">main</span><span class="tag">Pages</span></div><div class="grid3"><s></s><s></s><s></s></div>`)],
      s2: ['dark', code(`$ git remote -v\norigin  <a>https://github.com/…</a>\n$ git push origin <u>main</u>\n<b>Writing objects: 100%</b>`)],
      s3: ['', win('PAGES', `<s class="h" style="width:60%"></s>${sk(95)}${sk(80)}${sk(70)}<span class="btn">PUBLISH</span>`)],
      caps: [['저장소는 프로젝트의 집이다', '파일과 기록이 함께 들어 있다'], ['Pages로 공개한다', '정적 홈페이지를 주소로 연다'], ['소유권도 넘길 수 있다', '조직이나 다른 계정으로 이전']],
      cols: [['Clone', '저장소를 내 컴퓨터로 복제한다.'], ['Pages', '홈페이지를 공개 주소로 올린다.'], ['소유권 이전', '저장소의 주인을 바꾸는 방법이다.']] },
    { name: 'VS Code', c: '#d4287f', sub: '코드를 쓰고 Git을 한 화면에서 다루는 편집기', href: 'vscode.html',
      s1: ['dark', code(`<i>// index.html</i>\n&lt;<a>div</a> class="<u>hero</u>"&gt;\n  &lt;<a>h1</a>&gt;나의 개발 스텝&lt;/<a>h1</a>&gt;\n&lt;/<a>div</a>&gt;\n\n<i>Ctrl + Shift + P</i>  명령 팔레트\n<i>Ctrl + R</i>         최근 폴더 열기`)],
      s2: ['', win('EXTENSIONS', `<div class="row"><em>Claude</em><span class="tag">설치됨</span></div>${sk(80)}<div class="row"><em>Codex</em><span class="tag">설치됨</span></div>${sk(66)}<span class="btn">INSTALL</span>`)],
      s3: ['', win('SOURCE', `<div class="row"><em>M</em><span>index.html</span></div><div class="row"><em>A</em><span>3d-test.html</span></div>${sk(70)}<span class="btn">COMMIT</span>`)],
      caps: [['명령 팔레트로 모든 기능을 부른다', 'Ctrl + Shift + P'], ['최근 폴더를 바로 연다', 'Ctrl + R'], ['소스 제어에서 커밋한다', '변경 파일을 한눈에 본다']],
      cols: [['단축키', '자주 쓰는 조합을 표로 모았다.'], ['확장 프로그램', 'AI 도구를 편집기에 붙인다.'], ['소스 제어', '커밋과 푸시를 버튼으로 한다.']] },
    { name: 'Linux', c: '#1f33e6', sub: '터미널로 OS를 이해하는 노트', href: 'linux.html',
      s1: ['dark', code(`<b>user@host</b>:~$ sudo apt update\nHit:1 http://archive.ubuntu.com jammy InRelease\nGet:2 …-updates InRelease <u>[119 kB]</u>\nReading package lists… <b>Done</b>\n<b>user@host</b>:~$ sudo apt install tree\n<b>user@host</b>:~$ ls -l /etc`)],
      s2: ['', win('DISTRO', `<div class="row"><em>DEB</em><span>Debian · Ubuntu</span><span class="tag">apt</span></div><div class="row"><em>RH</em><span>Red Hat · Rocky</span><span class="tag">dnf</span></div>${sk(70)}<span class="btn">따라하기</span>`)],
      s3: ['dark', code(`<i>$ ping -c 3</i>\n64 bytes\n64 bytes\n64 bytes\n<b>0% loss</b>`)],
      caps: [['Debian 계열과 Red Hat 계열', '패키지 관리자가 다르다'], ['실제 서버처럼 보이는 실습', '새로고침하면 처음으로 돌아간다'], ['명령어는 외우지 않는다', '따라 치며 손에 익힌다']],
      cols: [['파일과 권한', '디렉터리 구조와 chmod를 본다.'], ['패키지 관리', 'apt와 dnf로 설치하고 지운다.'], ['서비스와 네트워크', 'systemctl, ip, ss를 쓴다.']] },
    { name: 'Network', c: '#1f9a48', sub: '구조 설계와 자격 시험을 위한 도면 노트', href: 'network.html',
      s1: ['', win('SUBNET', `<div class="row"><em>CIDR</em><b>10.0.0.0/24</b></div><div class="row"><em>MASK</em><span>255.255.255.0</span></div><div class="row"><em>HOSTS</em><span>254</span></div>${sk(88)}${sk(72)}<div class="grid3"><s></s><s></s><s></s><s></s><s></s><s></s></div>`)],
      s2: ['', win('TOPOLOGY', `<div class="grid3"><s></s><s></s><s></s></div><div class="row"><span class="tag">ON-PREM</span><span class="tag">CLOUD</span><span class="tag">HYBRID</span></div>`)],
      s3: ['dark', code(`<i>VLAN 20</i>\n<i>AS65001</i>\n<b>TTL=64</b>\n<u>DMZ</u>`)],
      caps: [['서브넷으로 네트워크를 나눈다', 'CIDR 표기와 계산기'], ['온프레미스와 클라우드', '하이브리드로 잇는다'], ['도면으로 이해한다', '구조를 그림으로 본다']],
      cols: [['IP와 서브넷', '주소를 나누고 계산한다.'], ['클라우드', 'VPC, VPN, DMZ의 역할을 본다.'], ['자격 시험', '확인한 단계만 완료로 표시한다.']] },
    { name: 'Keywords', c: '#d9830f', sub: '모든 페이지의 태그를 한곳에서 찾는다', href: 'keywords.html',
      s1: ['', win('TAGS', `<div class="row"><span class="tag">Git</span><span class="tag">Clone</span><span class="tag">Push</span><span class="tag">Pages</span></div><div class="row"><span class="tag">apt</span><span class="tag">공개</span><span class="tag">단축키</span><span class="tag">서브넷</span></div>${sk(90)}${sk(60)}<span class="btn">SEARCH</span>`)],
      s2: ['', win('SEARCH', `<div class="row"><em>#</em><b>소유권 이전</b></div>${sk(82)}${sk(64)}${sk(40)}`)],
      s3: ['', `<div class="grid3"><s></s><s></s><s></s><s></s><s></s><s></s></div>`],
      caps: [['태그로 이어 찾는다', '관련 섹션을 바로 연다'], ['입력하면 바로 제안한다', '키워드와 섹션을 함께 보여 준다'], ['전체 태그도 한눈에', '페이지별로 모아 본다']],
      cols: [['검색', '키워드를 입력해 섹션으로 간다.'], ['태그', '페이지 태그를 눌러 거른다.'], ['전체 키워드', '모든 태그를 한 페이지에서 본다.']] },
  ];
  const N = SECTIONS.length, TOTAL = HERO + N * SEC + END;

  /* ── 장면 만들기 ── */
  poster.style.top = -TOTAL + 'px'; poster.style.height = TOTAL + 'px';
  const hero = document.createElement('section');
  hero.className = 'hero';
  hero.innerHTML = `<div class="vword"><span>Dev Steps</span></div>
    <div class="info"><span class="pill">3D TEST</span><p class="big">개발의 첫걸음을 길 위에서 따라간다</p>
    <ul>${SECTIONS.map((s, i) => `<li>${s.name}<i>0${i + 1}</i></li>`).join('')}</ul>
    <p>스크롤하면 장면이 눕고 카메라가 길을 따라 나아간다. 구간마다 색이 바뀌고 카드가 바닥 위에 놓인다.</p><div class="cam"></div>
    <p>이 페이지는 레퍼런스 영상의 3D 스크롤 구성을 CSS 3D로 따라 한 테스트다.</p><span class="pill">SCROLL ↓</span></div>
    <div class="vis"><canvas id="graph"></canvas></div>`;
  poster.append(hero);
  SECTIONS.forEach((s, i) => {
    const el = document.createElement('section');
    el.className = 'sec'; el.id = 's' + i; el.style.setProperty('--c', s.c);
    const slab = (cls, d) => `<div class="slab ${cls} ${d[0]}">${d[1]}</div>`;
    el.innerHTML = `<div class="sh"><div class="k">0${i + 1} / 0${N}</div><h2>${s.name}</h2><p class="sub">${s.sub}</p></div>
      ${slab('s1', s.s1)}${slab('s2', s.s2)}${slab('s3', s.s3)}
      ${s.caps.map((c, k) => `<div class="cap c${k + 1}">${c[0]}<small>${c[1]}</small></div>`).join('')}
      <div class="cols">${s.cols.map((c) => `<div><h3>${c[0]}</h3><p>${c[1]}</p><a href="${s.href}">자세히 보기</a></div>`).join('')}</div>`;
    poster.append(el);
  });
  const end = document.createElement('section');
  end.className = 'endtile';
  end.innerHTML = `<div class="et"><p class="k">THE END · 07 / 07</p><h2>Dev Steps</h2><p class="sub">여기까지가 3D 테스트의 끝이다. 길을 다 지나면 장면이 다시 평면으로 선다.</p>
    <div class="eg">${SECTIONS.map((x, i) => `<a href="${x.href}" style="--c:${x.c}"><i>0${i + 1}</i><b>${x.name}</b><span>${x.sub}</span><em>→</em></a>`).join('')}</div>
    <a class="back" href="../index.html">메인으로 돌아간다</a></div>`;
  poster.append(end);
  // 바닥에 서 있는 입체 글자: 같은 글자를 뒤로 겹쳐 쌓아 두께를 만든다
  const w3 = document.createElement('div');
  w3.className = 'word3d'; w3.style.cssText = `left:70px;top:${TOTAL - HERO - 168}px;width:1000px;height:170px`;
  for (let i = 15; i >= 0; i--) { const s = document.createElement('span'); s.textContent = 'Dev Steps'; s.style.fontSize = '190px'; s.style.transform = `translateZ(${-i * 2.6}px)`; if (i === 0) s.className = 'f'; w3.append(s); }
  poster.append(w3);
  const hexMix = (h, a) => { const n = parseInt(h.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * a)); return 'rgb(' + c.join(',') + ')'; };
  const words = SECTIONS.map((sc, i) => { // 구간 시작선에 서서 카메라를 마주 본다
    const el = document.createElement('div');
    el.className = 'word3d sw'; el.style.cssText = `left:50px;top:${TOTAL - HERO - (i + 1) * SEC + 26}px;width:760px;height:134px`;
    for (let k = 11; k >= 0; k--) { const sp = document.createElement('span'); sp.textContent = sc.name; sp.style.fontSize = '150px'; sp.style.transform = `translateZ(${-k * 2.4}px)`; sp.style.color = k === 0 ? '#fff' : hexMix(sc.c, 0.55 - k * 0.025); el.append(sp); }
    poster.append(el); return el;
  });

  hud.innerHTML = SECTIONS.map((s, i) => `<li data-i="${i}"><u></u><span>${s.name}</span><i>0${i + 1}</i></li>`).join('');
  const lis = [...hud.children];

  /* ── 배경 선: 고리(회전·시차 이동·점선 흐름)와 중심에서 퍼지는 속도선 ── */
  const wire = $('#wire'), NSV = 'http://www.w3.org/2000/svg';
  wire.setAttribute('viewBox', '0 0 1440 900'); wire.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  const RINGS = [[-140, 380, 520, 0.8, '', 1], [-80, 400, 380, 0.6, '6 10', 2], [-30, 420, 250, 0.5, '2 8', -1], [1520, 520, 640, 0.8, '', -1], [1590, 520, 480, 0.6, '10 14', 2], [1640, 500, 330, 0.5, '1 7', 1],
    [-260, 980, 760, 0.45, '', 1], [1700, 120, 460, 0.45, '4 12', -2], [720, -260, 520, 0.35, '', 1], [720, 1180, 600, 0.35, '8 16', -1], [260, 140, 160, 0.5, '2 6', 3], [1180, 760, 210, 0.5, '2 6', -3]];
  const ringEls = RINGS.map(([cx, cy, r, o, dash, sp]) => {
    const gEl = document.createElementNS(NSV, 'g'), c = document.createElementNS(NSV, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r); c.style.opacity = o; if (dash) c.setAttribute('stroke-dasharray', dash);
    gEl.append(c); wire.append(gEl); return { g: gEl, c, sp, cx, cy, dash };
  });
  const SPEEDN = 34, speedEls = Array.from({ length: SPEEDN }, () => { const l = document.createElementNS(NSV, 'line'); wire.append(l); return l; });
  const arcs = [['M0 760 Q 300 560 520 640', 1], ['M1280 340 Q 1100 440 1020 600', -1], ['M0 200 Q 200 300 330 520', 1]].map(([d, sp]) => { const p = document.createElementNS(NSV, 'path'); p.setAttribute('d', d); p.setAttribute('stroke-dasharray', '12 10'); p.style.opacity = 0.55; wire.append(p); return { p, sp }; });
  function wireUpdate(t, p, vel, mx, my) {
    ringEls.forEach((e, i) => {
      const rot = t * 6 * e.sp + p * 360 * e.sp, ty = -(p * 900 * (0.15 + (i % 4) * 0.12)) % 900 + (i % 2 ? 0 : 0), sc = 1 + Math.sin(t * 0.4 + i) * 0.015 + vel * 3;
      e.g.style.transform = `translate(${mx * (8 + i * 2)}px,${ty * 0.25 + my * (6 + i)}px) rotate(${rot}deg) scale(${sc})`;
      e.g.style.transformOrigin = e.cx + 'px ' + e.cy + 'px';
      if (e.dash) e.c.setAttribute('stroke-dashoffset', String(-(p * 2600 * e.sp + t * 12 * e.sp)));
    });
    arcs.forEach((a) => a.p.setAttribute('stroke-dashoffset', String(-(p * 2000 + t * 14) * a.sp)));
    for (let i = 0; i < SPEEDN; i++) { // 중심(소실점)에서 바깥으로 퍼지는 선. 스크롤이 빠를수록 길고 진해진다
      const ang = (i / SPEEDN) * 6.2832 + i * 0.37, u = ((i * 0.6180339 + p * 9 + t * 0.04) % 1 + 1) % 1, R0 = 140 + u * 760, len = 18 + u * (40 + vel * 4000), o = Math.min(0.7, (1 - u) * (0.1 + vel * 40));
      const l = speedEls[i], cx = 720, cy = 330, ca = Math.cos(ang), sa = Math.sin(ang);
      l.setAttribute('x1', cx + ca * R0); l.setAttribute('y1', cy + sa * R0 * 0.8); l.setAttribute('x2', cx + ca * (R0 + len)); l.setAttribute('y2', cy + sa * (R0 + len) * 0.8); l.style.opacity = o.toFixed(3);
    }
  }

  /* ── 관계 그래프(첫 장면 오른쪽 검은 판): d3-force로 계속 살아 움직인다 ── */
  const cv = $('#graph'), g = cv.getContext('2d');
  const GW = 630, GH = 1100, dpr = 1.5;
  cv.width = GW * dpr; cv.height = GH * dpr; g.scale(dpr, dpr);
  const HUBC = ['#35d0ff', '#3df09a', '#b08aff', '#ff6fb0', '#ffb340', '#ffffff'];
  const nodes = [], links = [];
  SECTIONS.forEach((s, i) => nodes.push({ id: 'h' + i, hub: true, label: s.name, col: HUBC[i], r: 5 }));
  for (let i = 0; i < 72; i++) { const h = i % N; nodes.push({ id: 'n' + i, hub: false, h, sz: 5 + ((i * 7) % 9), icon: i % 4 === 0 }); links.push({ source: 'h' + h, target: 'n' + i, col: HUBC[h] }); if (i % 6 === 0) links.push({ source: 'n' + i, target: 'h' + ((h + 2) % N), col: HUBC[(h + 2) % N] }); }
  for (let i = 0; i < N; i++) links.push({ source: 'h' + i, target: 'h' + ((i + 1) % N), col: '#ffffff', hh: true });
  let sim = null;
  if (window.d3) {
    sim = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id((d) => d.id).distance((l) => (l.hh ? 150 : 56 + (l.target.sz || 6) * 4)).strength(0.5))
      .force('charge', d3.forceManyBody().strength((d) => (d.hub ? -520 : -34))).force('center', d3.forceCenter(GW / 2, GH / 2)).force('x', d3.forceX(GW / 2).strength(0.03)).force('y', d3.forceY(GH / 2).strength(0.02)).alphaTarget(0.035);
  }
  let gmx = -999, gmy = -999;
  if (sim) sim.force('mouse', () => { // 첫 장면에서 포인터 가까운 노드가 밀려난다
    if (gmx < -900) return;
    for (const n of nodes) { const dx = n.x - gmx, dy = n.y - gmy, d = Math.hypot(dx, dy) || 1; if (d < 130) { const f = (1 - d / 130) * 2.6; n.vx += dx / d * f; n.vy += dy / d * f; } }
  });
  let gLast = 0;
  function drawGraph(now) {
    if (now - gLast < 33) return; gLast = now;
    g.clearRect(0, 0, GW, GH);
    for (const l of links) { const a = l.source, b = l.target; if (!a || a.x === undefined) continue; g.strokeStyle = l.col; g.globalAlpha = l.hh ? 0.7 : 0.45; g.lineWidth = l.hh ? 1.2 : 0.8; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    g.globalAlpha = 1;
    for (const n of nodes) {
      if (n.x === undefined) continue;
      if (n.hub) { g.fillStyle = n.col; g.fillRect(n.x - 6, n.y - 6, 12, 12); g.font = '600 13px "Pretendard Variable","Malgun Gothic",sans-serif'; const tw = g.measureText(n.label).width; g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(n.x + 12, n.y - 11, tw + 14, 22); g.strokeStyle = n.col; g.lineWidth = 1; g.strokeRect(n.x + 12.5, n.y - 10.5, tw + 13, 21); g.fillStyle = '#fff'; g.fillText(n.label, n.x + 19, n.y + 4.5); }
      else { g.fillStyle = '#fff'; g.fillRect(n.x - n.sz / 2, n.y - n.sz / 2, n.sz, n.sz); if (n.icon) { g.fillStyle = HUBC[n.h]; g.fillRect(n.x - n.sz / 4, n.y - n.sz / 4, n.sz / 2, n.sz / 2); } }
    }
  }

  /* ── 카메라: 스크롤 → 기울기, 이동, 크기. 구간을 누르면 그 구간을 정면으로 마주 보는 "집중 보기"로 날아간다 ── */
  const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const lerp = (a, b, u) => a + (b - a) * u;
  let vw = innerWidth, vh = innerHeight, cur = 0, prev = 0, tgt = 0, last = 0, active = -2, vel = 0;
  let fi = -2, fLast = -1, f = 0, fScroll = 0, mx = 0, my = 0, tmx = 0, tmy = 0; // fi: 집중 중인 구간(-1은 첫 장면, -2는 없음)
  const leader = $('#leader'), pos = $('#hud-pos'), hint = $('#hud-hint'), back = document.createElement('button');
  back.className = 'hud-back'; back.type = 'button'; back.innerHTML = '← 길로 돌아가기 <i>Esc</i>'; stage.append(back);
  addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; });
  const MAXCAM = HERO + N * SEC - 520, P_TILT = 0.1, P_E = 0.87; // P_E 이후: 길 끝의 마지막 페이지가 평면으로 선다
  const roadView = (p) => {
    const t = smooth(p / P_TILT), kHero = Math.min(vw / 1100, vh / 1100) * 0.97, kRoad = Math.max(0.3, Math.min(vw * 0.6 / 1100, 0.8));
    const u = smooth((p - P_E) / (1 - P_E)), kEnd = Math.min(vw / 1100, vh / 900) * 0.97;
    const cam0 = Math.min(1, Math.max(0, (p - P_TILT) / (P_E - P_TILT))) * MAXCAM, k0 = lerp(kHero, kRoad, t), py0 = lerp(vh / 2 + 550 * kHero, vh * 0.93, t);
    return { tilt: 50 * t * (1 - u), cam: lerp(cam0, HERO + N * SEC, u), k: lerp(k0, kEnd, u), py: lerp(py0, vh / 2 + 450 * kEnd, u), t, u };
  };
  const frontView = (i) => { const h = i < 0 ? HERO : SEC, k = Math.min(vw / 1100, vh / h) * (i < 0 ? 0.97 : 0.94); return { tilt: 0, cam: i < 0 ? 0 : HERO + i * SEC, k, py: vh / 2 + h / 2 * k }; };
  function view(p) {
    const a = roadView(p), ef = smooth(f), b = frontView(fLast);
    const tilt = lerp(a.tilt, b.tilt, ef), cam = lerp(a.cam, b.cam, ef), k = lerp(a.k, b.k, ef), py = lerp(a.py, b.py, ef);
    const ry = mx * (3.2 - ef * 1.6), rx = -my * (2 - ef);
    world.style.transform = `translate3d(0,${py}px,0) scale(${k}) rotateX(${tilt + rx}deg) rotateY(${ry}deg)`;
    poster.style.transform = `translate3d(0,${cam}px,0)`;
    const vis = 1 - ef;
    const eu = 1 - smooth(a.u * 2);
    $('#fog').style.opacity = String(smooth(p / P_TILT) * vis * (1 - a.u));
    w3.style.opacity = String(smooth((p - 0.01) / 0.07) * vis * eu);
    words.forEach((w) => { w.style.opacity = String(vis * eu); });
    stage.style.setProperty('--ff', ef.toFixed(3));
    $('.vword span', hero).style.opacity = String(Math.max(1 - smooth(p / 0.05), ef * (fLast === -1 ? 1 : 0)));
    return { cam: a.cam, t: a.t, u: a.u };
  }
  /* ── 목차의 선: 레일 → 현재 표시(부드럽게 미끄러짐) → 글자 밑 줄기 → 카드로 뻗는 가지가 한 덩어리의 선으로 이어진다 ── */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); leader.append(e); return e; };
  const rail = mk('path', 'rl'), prog = mk('path', 'rp'), stem = mk('path', 'st');
  const dots = lis.map(() => mk('rect', 'rd'));
  const BR = [['.s1', '', 'c', 0.5], ['.s2', '5 5', 's', 0.65], ['.s3', '1 5', 'r', 0.8], ['.c1', '', 't', 0.35], ['.c2', '2 3', 't', 0.45]].map(([sel, dash, end, bow]) => {
    const p = mk('path', 'lv'), e = mk(end === 's' ? 'rect' : 'circle', 'le ' + end); if (dash) p.setAttribute('stroke-dasharray', dash);
    return { sel, p, e, end, bow, dash, len: 1 };
  });
  const mkr = mk('path', 'mk'), halo = mk('circle', 'halo');
  mkr.setAttribute('d', 'M0,-6 L6,0 L0,6 L-6,0 Z'); halo.setAttribute('r', 9);
  let mY = null, grow = 0, lastShown = -2;
  function hudUpdate(cam, t, u, dt) {
    const focus = cam + 520, idx = focus < HERO ? -1 : Math.min(N - 1, Math.floor((focus - HERO) / SEC)), shown = fi >= 0 ? fi : idx;
    if (shown !== active) { active = shown; lis.forEach((li, i) => li.classList.toggle('on', i === shown)); pos.textContent = String(Math.max(0, shown + 1)).padStart(2, '0') + ' / 0' + N; }
    hint.style.opacity = t < 0.05 && fi === -2 ? '1' : '0';
    back.classList.toggle('on', fi > -2);
    const rects = lis.map((li) => li.getBoundingClientRect()), hr = hud.getBoundingClientRect();
    if (!rects[0].height) return;
    const rx = hr.left + 6, ys = rects.map((r) => r.top + r.height / 2), top = ys[0] - 8, bot = ys[N - 1] + 8;
    const ty = shown >= 0 ? ys[shown] : ys[0];
    mY = mY === null ? ty : mY + (ty - mY) * (reduce ? 1 : 1 - Math.exp(-dt * 11)); // 표시가 항목 사이를 미끄러지듯 따라간다
    if (shown !== lastShown) { lastShown = shown; grow = 0; }
    const fo = 1 - smooth(f); // 집중 보기로 넘어가는 속도(f)에 맞춰 선이 같이 흐려졌다가, 돌아오면 다시 짙어지며 자라난다
    if (f > 0.9) grow = 0; else grow = Math.min(1, grow + dt / 0.8);
    const vis = shown >= 0 && t > 0.8 && u < 0.2 && fo > 0.004;
    rail.setAttribute('d', `M${rx},${top} L${rx},${bot}`);
    prog.setAttribute('d', `M${rx},${top} L${rx},${Math.max(top, mY)}`);
    dots.forEach((d, i) => { d.setAttribute('x', rx - 2.5); d.setAttribute('y', ys[i] - 2.5); d.setAttribute('width', 5); d.setAttribute('height', 5); d.classList.toggle('fill', ys[i] <= mY + 1); });
    mkr.setAttribute('transform', `translate(${rx},${mY})`); halo.setAttribute('cx', rx); halo.setAttribute('cy', mY);
    const sx = (rects[Math.max(0, shown)].right + 14), live = vis && grow > 0;
    stem.style.display = live ? '' : 'none'; stem.style.opacity = String(fo);
    const gs = Math.min(1, grow * 1.6);
    stem.setAttribute('d', `M${rx + 6},${mY} L${rx + 6 + (sx - rx - 6) * gs},${mY}`);
    BR.forEach((b, k) => {
      const el = vis ? $('#s' + shown + ' ' + b.sel) : null, r = el ? el.getBoundingClientRect() : null;
      if (!r || r.width < 8 || r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh) { b.p.style.display = b.e.style.display = 'none'; return; }
      const cap = b.end === 't', tx = cap ? r.left - 6 : r.left, tyy = Math.min(vh - 20, Math.max(60, r.top + (cap ? 12 : r.height * (0.22 + k * 0.1))));
      const dx = tx - sx, c1 = sx + dx * b.bow, g = Math.min(1, Math.max(0, (grow - 0.2 - k * 0.08) / 0.55)), e = g * g * (3 - 2 * g);
      b.p.style.display = b.e.style.display = ''; b.p.style.opacity = String(Math.min(1, e * 1.4) * fo);
      b.p.setAttribute('d', `M${sx},${mY} C${c1},${mY} ${sx + dx * 0.5},${tyy} ${tx},${tyy}`);
      if (!b.dash) { if (!b.len || b.len === 1) b.len = b.p.getTotalLength(); b.p.setAttribute('stroke-dasharray', b.len + ' ' + b.len); b.p.setAttribute('stroke-dashoffset', String(b.len * (1 - e))); b.len = b.p.getTotalLength(); }
      b.e.style.opacity = String(e * fo); if (b.end === 's') { b.e.setAttribute('x', tx - 3); b.e.setAttribute('y', tyy - 3); b.e.setAttribute('width', 6); b.e.setAttribute('height', 6); }
      else { b.e.setAttribute('cx', tx); b.e.setAttribute('cy', tyy); b.e.setAttribute('r', b.end === 'r' ? 5 : b.end === 't' ? 1.6 : 2.6); }
    });
    hud.style.opacity = String(1 - Math.min(1, u * 2)); leader.style.opacity = String(1 - Math.min(1, u * 3));
  }

  /* 집중 보기: 구간을 누르면 정면으로 마주 본다. Esc, 다른 곳 클릭, 스크롤, ←/→ 로 이어서 움직인다 */
  const secScroll = (i) => { const cam = Math.min(MAXCAM, Math.max(0, HERO + i * SEC - 100)), p = P_TILT + cam / MAXCAM * (P_E - P_TILT); return p * Math.max(1, space.offsetHeight - vh); };
  function focusOn(i) { if (i < -1 || i >= N) return; fi = i; fLast = i; fScroll = scrollY; if (i >= 0) scrollTo(0, secScroll(i)); }
  function focusOff() { if (fi === -2) return; fi = -2; }
  poster.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const sec = e.target.closest('.sec'), isHero = e.target.closest('.hero');
    if (fi > -2 && ((sec && +sec.id.slice(1) === fi) || (isHero && fi === -1))) return;
    if (sec) focusOn(+sec.id.slice(1)); else if (isHero) focusOn(-1);
  });
  stage.addEventListener('click', (e) => { if (fi > -2 && !e.target.closest('#poster,#hud,.hud-back,.top')) focusOff(); });
  back.addEventListener('click', focusOff);
  hud.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) focusOn(+li.dataset.i); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') focusOff();
    else if (fi > -2 && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) focusOn(Math.min(N - 1, fi + 1));
    else if (fi > -2 && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) focusOn(Math.max(-1, fi - 1));
  });
  addEventListener('wheel', () => { if (fi > -2) focusOff(); }, { passive: true });
  addEventListener('pointermove', (e) => {
    tmx = (e.clientX / vw - 0.5) * 2; tmy = (e.clientY / vh - 0.5) * 2;
    const r = cv.getBoundingClientRect();
    if (cur < 0.03 && f < 0.1 && r.width > 40) { gmx = (e.clientX - r.left) / r.width * GW; gmy = (e.clientY - r.top) / r.height * GH; } else gmx = gmy = -999;
  }, { passive: true });
  document.addEventListener('mouseleave', () => { tmx = tmy = 0; gmx = gmy = -999; });
  hud.addEventListener('pointermove', (e) => { const li = e.target.closest('li'); lis.forEach((x) => x.classList.toggle('hot', x === li)); });
  hud.addEventListener('pointerleave', () => lis.forEach((x) => x.classList.remove('hot')));

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const max = Math.max(1, space.offsetHeight - vh); tgt = window.__lab3dHold ? cur : Math.min(1, Math.max(0, scrollY / max)); // 개발용 미리보기에서는 스크롤 값 대신 고정 진행도를 쓴다
    if (fi > -2 && Math.abs(scrollY - fScroll) > 40 && fLast >= 0 && Math.abs(scrollY - secScroll(fLast)) > 40) focusOff(); // 스크롤하면 길로 돌아간다
    cur += (tgt - cur) * (reduce ? 1 : 1 - Math.exp(-dt * 7)); // 스크롤을 부드럽게 따라간다
    if (Math.abs(tgt - cur) < 0.00002) cur = tgt;
    vel += (Math.abs(cur - prev) / dt * 0.0004 - vel) * Math.min(1, dt * 6); prev = cur;
    f += ((fi > -2 ? 1 : 0) - f) * (reduce ? 1 : 1 - Math.exp(-dt * 4.2));
    if (Math.abs((fi > -2 ? 1 : 0) - f) < 0.001) f = fi > -2 ? 1 : 0;
    mx += (tmx - mx) * Math.min(1, dt * 4); my += (tmy - my) * Math.min(1, dt * 4);
    const { cam, t, u } = view(cur);
    hudUpdate(cam, t, u, dt);
    wireUpdate(now / 1000, cur, vel, mx, my);
    if (cur < 0.5 && f < 0.98) { if (sim) sim.alphaTarget(0.035); drawGraph(now); } else if (sim) sim.alphaTarget(0);
    requestAnimationFrame(frame);
  }
  window.__lab3dSet = (p, focus) => { window.__lab3dHold = true; cur = tgt = p; if (focus !== undefined) { focusOn(focus); f = 1; } view(p); };
  requestAnimationFrame(frame);
})();

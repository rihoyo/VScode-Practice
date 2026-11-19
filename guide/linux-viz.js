/* 리눅스 헤더 뷰포트: ls -l / 결과를 와이어프레임 문서로 그리고 스캔 줄이 훑으며 설명 상자를 띄운다.
 * 칸 위에 마우스를 올리면 그 칸이 선택된다. 모션 줄이기 설정이면 한 장면만 그린다. */
(() => {
  const cv = document.getElementById('viz');
  if (!cv) return;
  const g = cv.getContext('2d');
  const MONO = '"Cascadia Mono",Consolas,"D2Coding","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",monospace';
  const ROWS = [
    ['drwxr-xr-x', 'bin', '기본 명령어', 'ls, cp 같은 기본 명령어 실행 파일이 있다.'],
    ['drwxr-xr-x', 'dev', '장치 파일', '디스크와 터미널 같은 장치를 파일처럼 다룬다.'],
    ['drwxr-xr-x', 'etc', '설정 파일', '시스템과 서비스 설정이 모여 있다. 대부분 텍스트다.'],
    ['drwxr-xr-x', 'home', '사용자 폴더', '사용자별 개인 폴더. 내 파일은 보통 여기에 둔다.'],
    ['drwxr-xr-x', 'proc', '커널 정보', '실행 중인 프로세스와 커널 상태를 파일로 보여 준다.'],
    ['drwx------', 'root', '관리자 홈', '관리자 계정의 개인 폴더. 일반 사용자는 못 연다.'],
    ['drwxr-xr-x', 'usr', '프로그램', '설치된 프로그램과 라이브러리가 들어간다.'],
    ['drwxr-xr-x', 'var', '변하는 데이터', '로그와 캐시처럼 계속 바뀌는 데이터가 쌓인다.'],
    ['drwxrwxrwt', 'tmp', '임시 파일', '누구나 쓰는 임시 공간. 재부팅하면 비워진다.'],
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, sel = 2, selAt = 0, yv = 0, hoverUntil = 0, visible = true, t0 = performance.now();
  const G = '94,224,143';

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const geo = () => {
    const narrow = w < 460;
    const sw = Math.max(170, w * (narrow ? 0.54 : 0.5)), sx = w * (narrow ? 0.06 : 0.1);
    const sy = h * 0.2, sh = h * 0.6;
    return { sx, sy, sw, sh, rh: sh / ROWS.length, cx: sx + sw + w * 0.06, cw: Math.max(110, w - (sx + sw + w * 0.06) - w * 0.05) };
  };
  function wrap(text, max) {
    const out = []; let line = '';
    for (const ch of text) {
      if (g.measureText(line + ch).width > max) { out.push(line); line = ch; } else line += ch;
    }
    if (line) out.push(line);
    return out;
  }

  function draw(now) {
    const L = geo(), t = (now - t0) / 1000;
    g.clearRect(0, 0, w, h);
    // 겹친 문서 윤곽
    for (let i = 2; i >= 1; i--) {
      g.strokeStyle = `rgba(${G},${0.12 / i})`; g.lineWidth = 1;
      g.strokeRect(L.sx + i * 7 + .5, L.sy - i * 7 + .5, L.sw, L.sh);
    }
    g.fillStyle = 'rgba(12,17,14,.92)'; g.fillRect(L.sx, L.sy, L.sw, L.sh);
    g.strokeStyle = `rgba(${G},.45)`; g.strokeRect(L.sx + .5, L.sy + .5, L.sw, L.sh);
    // 선택 줄 부드럽게 이동
    const target = L.sy + sel * L.rh;
    yv += (target - yv) * (reduce ? 1 : 0.16);
    g.fillStyle = `rgba(${G},.13)`; g.fillRect(L.sx, yv, L.sw, L.rh);
    // 줄 내용
    g.textBaseline = 'middle';
    const fs = Math.max(10, Math.min(12.5, L.sw / 22));
    ROWS.forEach((r, i) => {
      const y = L.sy + i * L.rh + L.rh / 2, on = i === sel;
      g.font = `${fs}px ${MONO}`;
      g.fillStyle = on ? `rgba(${G},.9)` : 'rgba(126,148,134,.7)';
      g.fillText(r[0], L.sx + 10, y);
      g.fillStyle = on ? '#f2fbf5' : 'rgba(212,228,218,.75)';
      g.fillText('/' + r[1], L.sx + 10 + fs * 7.6, y);
      g.fillStyle = 'rgba(75,94,83,.9)';
      g.textAlign = 'right'; g.fillText(r[1] === 'tmp' ? '1777' : String(4096), L.sx + L.sw - 10, y); g.textAlign = 'left';
      g.strokeStyle = 'rgba(94,224,143,.08)'; g.beginPath(); g.moveTo(L.sx, L.sy + (i + 1) * L.rh + .5); g.lineTo(L.sx + L.sw, L.sy + (i + 1) * L.rh + .5); g.stroke();
    });
    // 스캔 줄
    const sc = L.sy + ((t * 0.35) % 1) * L.sh;
    const gr = g.createLinearGradient(0, sc - 18, 0, sc + 2);
    gr.addColorStop(0, `rgba(${G},0)`); gr.addColorStop(1, `rgba(${G},.22)`);
    g.fillStyle = gr; g.fillRect(L.sx, sc - 18, L.sw, 20);
    g.fillStyle = `rgba(${G},.9)`; g.fillRect(L.sx, sc, L.sw, 1);
    // 눈금
    g.fillStyle = 'rgba(94,224,143,.35)';
    for (let i = 0; i <= ROWS.length; i++) g.fillRect(L.sx - 6, L.sy + i * L.rh, 6, 1);
    // 설명 상자와 연결선
    const r = ROWS[sel], by = Math.max(L.sy - 6, Math.min(yv + L.rh / 2 - 34, L.sy + L.sh - 74));
    g.strokeStyle = `rgba(${G},.7)`; g.beginPath();
    g.moveTo(L.sx + L.sw, yv + L.rh / 2); g.lineTo(L.sx + L.sw + w * 0.03, yv + L.rh / 2); g.lineTo(L.cx, by + 34); g.stroke();
    g.fillStyle = `rgba(${G},1)`; g.fillRect(L.sx + L.sw - 2, yv + L.rh / 2 - 2, 5, 5);
    const n = Math.floor(((now - selAt) / 1000) * 46);
    g.font = `11px ${MONO}`;
    const lines = wrap(r[3].slice(0, n), L.cw - 20);
    const bh = 40 + Math.max(1, wrap(r[3], L.cw - 20).length) * 16;
    g.fillStyle = 'rgba(8,11,9,.95)'; g.fillRect(L.cx, by, L.cw, bh);
    g.strokeStyle = `rgba(${G},.7)`; g.strokeRect(L.cx + .5, by + .5, L.cw, bh);
    g.fillStyle = '#f2fbf5'; g.font = `700 12px ${MONO}`; g.fillText('/' + r[1] + '  ' + r[2], L.cx + 10, by + 16);
    g.font = `11px ${MONO}`; g.fillStyle = 'rgba(126,148,134,1)';
    lines.forEach((ln, i) => g.fillText(ln, L.cx + 10, by + 38 + i * 16));
    if (!reduce && Math.floor(t * 2) % 2 === 0) { g.fillStyle = `rgba(${G},1)`; g.fillRect(L.sx + 10, L.sy + L.sh + 12, 7, 12); }
    g.fillStyle = 'rgba(126,148,134,.9)'; g.font = `11px ${MONO}`; g.fillText('$ ls -l /', L.sx + 22, L.sy + L.sh + 18);
  }

  function pick(i) { if (i !== sel) { sel = i; selAt = performance.now(); } }
  cv.addEventListener('pointermove', (e) => {
    const L = geo(), b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    if (x >= L.sx && x <= L.sx + L.sw && y >= L.sy && y < L.sy + L.sh) { pick(Math.floor((y - L.sy) / L.rh)); hoverUntil = performance.now() + 3500; }
  });

  let last = 0;
  function loop(now) {
    if (visible) {
      if (now > hoverUntil && now - selAt > 2600) pick((sel + 1) % ROWS.length);
      draw(now);
    }
    last = now; requestAnimationFrame(loop);
  }
  size(); selAt = performance.now() - 5000; yv = geo().sy + sel * geo().rh;
  addEventListener('resize', () => { size(); if (reduce) draw(performance.now()); });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(cv);
  if (reduce) draw(performance.now()); else requestAnimationFrame(loop);
})();

/* 메인 페이지(첫 화면) 연출
 * 1) idle     : 코드가 쏟아지고, 마우스 자리에 ASCII 아트 블랙홀(그림자, 광자 고리, 휘어진 빛, 강착 원반)이 뜬다.
 *               블랙홀 모양을 이루는 글자는 안정적으로 유지되고, 포인트 글자 몇 개만 원반 면을 따라 천천히 빨려 든다.
 * 2) collapse : 클릭하거나 드래그하면 화면 가득한 코드가 그 지점으로 소용돌이치며 흘러든다(약 2.6초). 처음엔 천천히, 갈수록 기하급수로 빨라진다.
 *               글자는 핵에서 사라지면 바깥에서 다시 들어와 화면이 비지 않고, 점점 빠르게 뒤바뀌며 블랙홀은 커진다.
 * 3) emerge   : 끝나기 직전부터 제목과 선택 카드가 클릭 지점에서 변형되며 튀어나온다. 화면이 끊기지 않고 겹쳐서 이어진다.
 * 4) main     : 제목과 메인 페이지 선택 카드. 뒤에는 흐려진 코드 비와 작은 블랙홀이 남는다.
 * 같은 탭에서 한 번 본 뒤에는 바로 4)로 간다(?intro=1을 붙이면 다시 본다). 모션 줄이기 설정이면 연출 없이 4)다. */
(() => {
  const cv = document.getElementById('field');
  if (!cv) return;
  const g = cv.getContext('2d');
  const body = document.body, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PAPER = '#f1efe9', INK = '16,16,16', RED = '225,29,72';
  const MONO = '"Cascadia Mono","Cascadia Code",Consolas,"D2Coding","Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",monospace';
  const TOK = ['git commit -m', 'git push origin main', 'git pull', 'git clone', 'apt install', 'dnf install', 'sudo', 'chmod 644', 'systemctl status', 'ip addr',
    'ping -c 2', 'ss -tln', 'grep -r', 'ssh user@host', '10.0.0.0/24', '192.168.0.1', '172.16.0.0/12', '255.255.255.0', 'VLAN 20', 'AS65001', 'TTL=64',
    '0xC0A80001', 'CIDR', 'BGP', 'VPC', 'VPN', 'DMZ', 'DNS', 'TCP/IP', 'OSI', 'const x = () =>', 'function', 'return', 'import', 'export', '</div>', '{ }', '[ ]',
    '=>', '!==', '0101', '1110', 'npm run check', 'node -e', '<html lang="ko">', 'display:grid', '--accent', '#e95420', 'for (let i', 'if (err)', 'cd ~', 'ls -l',
    'cat /etc/os-release', '$ _', '// TODO', 'main', 'branch', 'commit', 'kernel', 'subnet', 'packet'];
  const POOL = '01{}[]<>/\\|#$%&*+=-:;.,~^?!_()@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const ART = ' .,:;-=+*#%@'; // 밝기 0~11. 블랙홀 아트는 이 문자들로만 그려서 모양이 안정적이다
  const COLLAPSE = 2600, EMERGE = 1100, MAIN_AT = 0.88; // 빨려드는 시간, 이어지는 시간, 제목이 나오기 시작하는 진행도

  /* ── 상태 ── */
  let W = 0, H = 0, dpr = 1, cw = 10, ch = 18, cols = 0, rows = 0;
  let base = null, rowStr = [], colStream = [], rainV = [], rainL = [], rainP = [];
  // 바탕 글자 칸 하나하나의 물리 상태. st: 0 제자리, 1 끌려가는 중, 2 삼켜짐(비어 있음), 3 다시 생겨나는 중
  let st = null, px = null, py = null, vx = null, vy = null, tm = null, thr = null, act = [];
  const P = { x: -999, y: -999 }, T = { x: -999, y: -999 };
  let seen = false, inside = true, lastMove = 0, last = 0, t0 = 0;
  let mode = 'idle', rt0 = 0, emergeAt = 0, domShown = false, bigRb = 60, ZERO = 0;
  let freezeU = -1; // 개발용 미리보기: emerge 진행도 고정
  let freeze = -1; // 개발용 미리보기: 0 이상이면 collapse 진행도를 이 값에 고정한다
  let Rb = 78, artA = 1, dim = 1; // 지금 값(천천히 목표로 따라간다)
  let raf = 0;
  const alphaStyle = Array.from({ length: 48 }, (_, i) => `rgba(${INK},${((i + 1) / 48).toFixed(3)})`);
  const redStyle = Array.from({ length: 48 }, (_, i) => `rgba(${RED},${((i + 1) / 48).toFixed(3)})`);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const pc = () => POOL[(Math.random() * POOL.length) | 0];
  const TARGET = { idle: { Rb: 78, art: 1, dim: 1 }, main: { Rb: 34, art: 0.6, dim: 0.3 } };

  /* ── 격자 ── */
  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    [cw, ch] = W < 700 ? [8, 14] : [10, 18];
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    rowStr = Array.from({ length: rows }, () => {
      let s = '';
      while (s.length < cols) s += TOK[(Math.random() * TOK.length) | 0] + (Math.random() < 0.5 ? ' ' : '  ');
      return s.slice(0, cols);
    });
    colStream = Array.from({ length: cols }, () => Array.from({ length: 48 }, pc).join(''));
    rainV = Array.from({ length: cols }, () => rnd(5, 17));
    rainL = Array.from({ length: cols }, () => Math.round(rnd(7, 24)));
    rainP = Array.from({ length: cols }, () => rnd(0, 200));
    base = document.createElement('canvas'); base.width = W * dpr; base.height = H * dpr;
    const b = base.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.font = `${ch - 5}px ${MONO}`; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillStyle = `rgba(${INK},.13)`;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = rowStr[r][c]; if (k !== ' ') b.fillText(k, c * cw + cw / 2, r * ch + ch / 2); }
    const n = cols * rows;
    st = new Uint8Array(n); px = new Float32Array(n); py = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n); tm = new Float32Array(n);
    thr = Float32Array.from({ length: n }, () => Math.random() ** 0.7 * 0.9); // 블랙홀이 다가올 때 칸마다 떠나는 시점이 다르다
    act = [];
  }
  const cell = (c, r) => rowStr[r][c] || ' ';
  const put = (k, x, y, a, red) => {
    g.fillStyle = (red ? redStyle : alphaStyle)[clamp(Math.round(a * 48) - 1, 0, 47)] /* 48단계: 밝기 단계가 거칠면 클릭 순간 바탕 글자 밝기가 계단처럼 변한다 */;
    g.fillText(k, x, y);
  };

  /* ── 블랙홀 아트: 위치에서 밝기를 계산한다(그림자, 광자 고리, 위아래로 휘어진 빛, 좌우로 뻗은 원반) ── */
  function field(dx, dy, R, t) {
    const d = Math.hypot(dx, dy), r = d / R;
    if (r < 0.97 || r > 3.6) return 0;
    let b = 0.3 * Math.exp(-(((r - 1.2) / 0.6) ** 2)); // 부드러운 바깥 빛
    const ring = Math.exp(-(((r - 1.07) / 0.095) ** 2)); // 광자 고리: 그림자 바로 바깥의 가는 고리
    if (ring > b) b = ring;
    if (r < 2.1) { // 원반 뒤쪽이 휘어져 그림자 위아래를 감싸는 빛
      const s = Math.abs(dy) / (d || 1), halo = 0.85 * Math.exp(-(((r - 1.36) / 0.3) ** 2)) * (0.22 + 0.78 * s ** 0.8);
      if (halo > b) b = halo;
    }
    const ax = Math.abs(dx) / R;
    if (ax > 0.95 && ax < 3.4) { // 좌우로 뻗은 얇은 강착 원반. 바깥으로 갈수록 얇고 어둡다
      const thick = 0.1 + 0.06 * (ax - 0.95), yy = dy / R / thick;
      if (yy < 3 && yy > -3) {
        const dop = dx < 0 ? 1.12 : 0.82; // 다가오는 쪽(왼쪽)이 더 밝다
        const disk = 0.98 * Math.exp(-(yy * yy)) * Math.exp(-((ax - 0.95) / 1.5)) * dop * (0.9 + 0.1 * Math.sin(ax * 5 - t * 1.1));
        if (disk > b) b = disk;
      }
    }
    return b > 1 ? 1 : b;
  }
  function drawArt(cx, cy, R, alpha, chaos, t) {
    const sw = 6, sh = 10, ext = 3.6 * R;
    g.font = `${sh - 1}px ${MONO}`;
    const gx0 = Math.max(0, Math.floor((cx - ext) / sw)), gx1 = Math.min(Math.ceil(W / sw), Math.ceil((cx + ext) / sw));
    const gy0 = Math.max(0, Math.floor((cy - ext) / sh)), gy1 = Math.min(Math.ceil(H / sh), Math.ceil((cy + ext) / sh));
    for (let gy = gy0; gy < gy1; gy++) for (let gx = gx0; gx < gx1; gx++) {
      const x = gx * sw + sw / 2, y = gy * sh + sh / 2;
      const b = field(x - cx, y - cy, R, t);
      if (b < 0.07) continue;
      const j = ((((gx * 73856093) ^ (gy * 19349663)) >>> 0) % 1000) / 1000 - 0.5; // 칸마다 고정된 약간의 흔들림(깜빡이지 않는다)
      let k = ART[clamp(Math.floor(b * 11 + j * 1.3), 1, 11)];
      if (chaos > 0 && Math.random() < chaos) k = pc();
      put(k, x, y, clamp(b * 1.3 + 0.28, 0.32, 1) * alpha, b > 0.85 && j > 0.34);
    }
  }
  /* 블랙홀 둘레의 바탕 글자를 부드럽게 비워 아트가 또렷이 보이게 한다 */
  function clearAround(cx, cy, R) {
    g.save(); g.translate(cx, cy); g.scale(1, 0.62);
    const rr = 2.9 * R, gr = g.createRadialGradient(0, 0, rr * 0.7, 0, 0, rr);
    gr.addColorStop(0, PAPER); gr.addColorStop(1, 'rgba(241,239,233,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rr, 0, 6.2832); g.fill(); g.restore();
  }
  const inClear = (x, y, R) => { const dx = (x - P.x) / (2.7 * R), dy = (y - P.y) / (1.7 * R); return dx * dx + dy * dy < 1; };

  /* ── 바탕 글자 흡수: 세계에 고정된 글자 칸이 블랙홀이 다가오면 하나씩 떨어져 나와 끌려간다 ──
   * 포인터가 지나간 길을 따라 가까운 칸부터 서서히 끌려가고, 삼켜지면 그 자리가 비었다가 몇 초 뒤 다시 생겨난다.
   * 포인터가 멀어지면 끌려가던 글자는 제자리로 돌아간다. */
  function physics(dt, R, dimF) {
    const Ra = 4.2 * R;
    const c0 = Math.max(0, Math.floor((P.x - Ra) / cw)), c1 = Math.min(cols - 1, Math.floor((P.x + Ra) / cw));
    const r0 = Math.max(0, Math.floor((P.y - Ra) / ch)), r1 = Math.min(rows - 1, Math.floor((P.y + Ra) / ch));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { // 가까워진 칸이 제자리를 떠난다
      const i = r * cols + c;
      if (st[i] !== 0 || rowStr[r][c] === ' ') continue;
      const hx = c * cw + cw / 2, hy = r * ch + ch / 2, d = Math.hypot(hx - P.x, hy - P.y);
      if (d < Ra && 1 - d / Ra >= thr[i]) { st[i] = 1; px[i] = hx; py[i] = hy; vx[i] = vy[i] = 0; act.push(i); }
    }
    // 1) 움직임 갱신
    for (let k = act.length - 1; k >= 0; k--) {
      const i = act[k], r = (i / cols) | 0, c = i - r * cols, hx = c * cw + cw / 2, hy = r * ch + ch / 2;
      if (st[i] === 1) {
        const dx = P.x - px[i], dy = P.y - py[i], d = Math.hypot(dx, dy) || 1, near = d < Ra * 1.2;
        if (d < R) { st[i] = 2; tm[i] = rnd(2.5, 6); continue; } // 사건의 지평선을 넘으면 삼켜진다
        let ax, ay;
        if (near) { const a2 = 260 * (R / Math.max(d, R)) ** 1.1, nx = dx / d, ny = dy / d; ax = nx * a2 - ny * a2 * 0.55; ay = ny * a2 + nx * a2 * 0.55; } // 중력 + 소용돌이
        else { ax = (hx - px[i]) * 9; ay = (hy - py[i]) * 9; } // 포인터가 멀어지면 제자리로
        vx[i] += ax * dt; vy[i] += ay * dt;
        const damp = Math.exp(-(near ? 0.9 : 4) * dt); vx[i] *= damp; vy[i] *= damp;
        px[i] += vx[i] * dt; py[i] += vy[i] * dt;
        if (!near && Math.hypot(hx - px[i], hy - py[i]) < 1.2 && Math.hypot(vx[i], vy[i]) < 8) { st[i] = 0; act[k] = act[act.length - 1]; act.pop(); }
      } else if (st[i] === 2) { tm[i] -= dt; if (tm[i] <= 0) { st[i] = 3; tm[i] = 0.9; } }
      else { tm[i] -= dt; if (tm[i] <= 0) { st[i] = 0; act[k] = act[act.length - 1]; act.pop(); } }
    }
    // 2) 원래 자리의 글자를 지우고, 움직이는 글자를 그린다
    g.fillStyle = PAPER;
    for (const i of act) { const r = (i / cols) | 0, c = i - r * cols; g.fillRect(c * cw, r * ch, cw, ch); }
    g.font = `${ch - 5}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const i of act) {
      const r = (i / cols) | 0, c = i - r * cols, base0 = 0.13 * dimF;
      if (st[i] === 3) { put(rowStr[r][c], c * cw + cw / 2, r * ch + ch / 2, base0 * (1 - tm[i] / 0.9), false); continue; }
      if (st[i] !== 1) continue;
      const d = Math.hypot(P.x - px[i], P.y - py[i]), prox = clamp(1 - d / Ra, 0, 1), sp = Math.hypot(vx[i], vy[i]);
      const a3 = (0.13 + prox * 0.7) * Math.max(dimF, 0.4), k2 = prox > 0.65 && Math.random() < 0.3 ? pc() : rowStr[r][c];
      put(k2, px[i], py[i], a3, prox > 0.5 && (i % 11 === 0)); // 가까워질수록 짙어지고, 이따금 붉은 글자가 섞인다
      if (sp > 90) { put(k2, px[i] - vx[i] * 0.018, py[i] - vy[i] * 0.018, a3 * 0.5, false); put(k2, px[i] - vx[i] * 0.036, py[i] - vy[i] * 0.036, a3 * 0.25, false); } // 빨려 들며 늘어나는 잔상
    }
  }

  /* ── 한 프레임 ── */
  const E = (p, a) => (Math.exp(a * p) - 1) / (Math.exp(a) - 1); // 처음엔 느리고 갈수록 기하급수로 빨라지는 곡선
  function frame(now) {
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    g.clearRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // 포인터를 따라간다. 포인터가 화면에 있으면 가만히 있어도 그 자리에 머물고, 브라우저 밖으로 나갔거나 창을 보고 있지 않거나 아직 들어온 적이 없으면 저절로 떠다닌다
    if (mode === 'idle' || mode === 'main') {
      if (!seen || !inside) { T.x = W * (0.5 + 0.28 * Math.sin(t * 0.55)); T.y = H * (0.5 + 0.22 * Math.sin(t * 0.83 + 1)); }
    }
    P.x += (T.x - P.x) * 0.16; P.y += (T.y - P.y) * 0.16;

    if (mode === 'collapse') { drawCollapse(now, t, dt); return; }
    let chaos = 0, tgt = TARGET[mode === 'emerge' ? 'main' : mode];
    if (mode === 'emerge') {
      const u = ease((freezeU >= 0 ? freezeU * EMERGE : now - emergeAt) / EMERGE);
      Rb = lerp(bigRb, TARGET.main.Rb, u); artA = lerp(1, TARGET.main.art, u); dim = lerp(0, TARGET.main.dim, u); chaos = (1 - u) * 0.9;
      if (u >= 1 && freezeU < 0) mode = 'main';
    } else { Rb += (tgt.Rb - Rb) * 0.08; artA += (tgt.art - artA) * 0.08; dim += (tgt.dim - dim) * 0.08; }

    g.globalAlpha = 1; g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    g.globalAlpha = dim; g.drawImage(base, 0, 0, W, H); g.globalAlpha = 1;
    if (artA > 0.05) clearAround(P.x, P.y, Rb);
    physics(dt, Rb, Math.max(dim, 0.3));
    g.font = `${ch - 5}px ${MONO}`;
    const Ra = 4.2 * Rb;
    for (let c = 0; c < cols; c++) { // 쏟아지는 코드
      const L = rainL[c], pos = (t * rainV[c] + rainP[c]) % (rows + L + 8), head = Math.floor(pos), x = c * cw + cw / 2;
      for (let r = Math.max(0, head - L); r <= Math.min(rows - 1, head); r++) {
        let y = r * ch + ch / 2, xx = x;
        if (artA > 0.05) { // 떨어지는 글자는 블랙홀 쪽으로 살짝 휘어진다
          const ex = P.x - xx, ey = P.y - y, d2 = ex * ex + ey * ey;
          if (d2 < Ra * Ra) { const dd = Math.sqrt(d2), fq = (1 - dd / Ra) ** 2 * 0.45; if (dd < Rb) continue; xx += ex * fq; y += ey * fq; }
          if (inClear(xx, y, Rb)) continue;
        }
        const d = pos - r, a = (d < 1 ? 1 : 0.14 + 0.8 * (1 - d / L) ** 1.6) * dim;
        if (a > 0.03) put(d < 1 ? pc() : colStream[c][(r + c * 3) % 48], xx, y, a, d < 1);
      }
    }
    if (artA > 0.05) drawArt(P.x, P.y, Rb, artA, chaos, t);
  }

  /* ── 클릭 후: 화면 가득한 코드가 완전한 원형 소용돌이로 클릭 지점에 빨려 든다 ──
   * 원칙 1) 어느 순간에도 빈 종이 면이 없다. 2) 모양은 모서리 없는 원형 나선이다. 3) 클릭한 프레임에서 화면이 튀지 않는다.
   * 글자를 "모으지" 않고 "흐르게" 한다. 글자는 클릭 지점을 중심으로 한 큰 원판(반지름 Rf) 안에 면적 균일(r² 균일)하게 깔려 있고,
   * 모두 같은 양씩 r² 가 줄어들며(중심에 가까울수록 눈에는 빠르게) 핵으로 흘러들고, 핵에서 사라지면 원판 바깥 가장자리에서 다시 들어온다.
   * 원판은 화면보다 넓어서 화면 밖 부분에도 보이지 않는 글자(유령 글자)를 미리 깔아 두었다가 흘러 들어올 때 화면을 채운다.
   * 시작 위치는 지금 화면의 글자 칸 그대로고, 밝기와 밀도는 천천히 올려서 클릭 순간에 컷 전환처럼 바뀌지 않는다. */
  let flowOK = false, qn = null, th0 = null, Q0 = null, gone = null, ph = [], nCell = 0, Rc2 = 1, Rf2 = 1, span = 1;
  function initFlow() {
    const n = cols * rows, far = Math.max(Math.hypot(P.x, P.y), Math.hypot(W - P.x, P.y), Math.hypot(P.x, H - P.y), Math.hypot(W - P.x, H - P.y));
    Rc2 = (bigRbStart * 0.9) ** 2; Rf2 = (far * 1.03) ** 2; span = Rf2 - Rc2; nCell = n;
    const np = Math.min(Math.max(0, Math.round((Math.PI * Rf2 - W * H) / (cw * ch) * 0.9)), Math.max(0, 42000 - n)), N = n + np;
    qn = new Float32Array(N); th0 = new Float32Array(N); Q0 = new Float32Array(N); gone = new Uint8Array(n); ph = new Array(np);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, s2 = st[i], x = s2 === 1 ? px[i] : c * cw + cw / 2, y = s2 === 1 ? py[i] : r * ch + ch / 2, dx = x - P.x, dy = y - P.y, d2 = dx * dx + dy * dy;
      th0[i] = Math.atan2(dy, dx); qn[i] = (((d2 - Rc2) / span) % 1 + 1) % 1; Q0[i] = qn[i] + 0.03; gone[i] = s2 === 2 || s2 === 3 ? 1 : 0; // 이미 삼켜져 비어 있던 칸은 서서히 나타난다
    }
    for (let k = 0; k < np; k++) { // 화면 밖의 원판 부분을 채우는 유령 글자
      let x, y, tries = 0;
      do { const rr = Math.sqrt(Rc2 + Math.random() * span), th = Math.random() * 6.2832; x = P.x + Math.cos(th) * rr; y = P.y + Math.sin(th) * rr; } while (x > -20 && x < W + 20 && y > -20 && y < H + 20 && ++tries < 6);
      const dx = x - P.x, dy = y - P.y, i = n + k;
      th0[i] = Math.atan2(dy, dx); qn[i] = (((dx * dx + dy * dy - Rc2) / span) % 1 + 1) % 1; Q0[i] = qn[i] + 0.03; ph[k] = pc();
    }
    flowOK = true;
  }
  function drawCollapse(now, t, dt) {
    const tau = freeze >= 0 ? freeze : clamp((now - rt0) / COLLAPSE, 0, 1);
    const growth = E(tau, 4.2); // 블랙홀도 갈수록 빠르게 커진다
    Rb = lerp(bigRbStart, Math.min(W, H) * 0.27, growth); bigRb = Rb;
    const chaos = ease((tau - 0.55) / 0.45);
    if (!flowOK) initFlow();
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    g.font = `${ch - 5}px ${MONO}`;
    const S = 3.4 * E(tau, 5.2), dS = 3.4 * (E(tau, 5.2) - E(Math.max(0, tau - 0.035), 5.2)); // 지금까지 흘러든 바퀴 수
    const m = E(tau, 3), k0 = ease(tau / 0.3), Om = 2.4 * E(tau, 3.5), kt = 1.5 * m, scr = 0.9 * m, endF = 1 - ease((tau - 0.82) / 0.18), core = Rb * 0.9;
    const pos = (i, SS) => { // 흐름의 한 시점에서 글자 i의 위치(완전한 원형)
      const u = qn[i] - SS, q = u - Math.floor(u), th = th0[i] + Om + kt * 0.5 * Math.log(Q0[i] / (q + 0.03)), rr = Math.sqrt(Rc2 + q * span);
      return { w: Math.floor(u), r: rr, x: P.x + Math.cos(th) * rr, y: P.y + Math.sin(th) * rr };
    };
    const dens = 0.5 * k0; // 빈 칸(공백)에도 글자를 채워 어느 곳도 비지 않게 한다. 천천히 채워서 컷이 느껴지지 않는다
    const on = (o) => o.x > -12 && o.x < W + 12 && o.y > -12 && o.y < H + 12;
    for (let c = 0; c < cols; c++) {
      const L = rainL[c], rp = (t * rainV[c] + rainP[c]) % (rows + L + 8);
      for (let r = 0; r < rows; r++) {
        const i = r * cols + c, d = rp - r, lit = d >= 0 && d < L, ch0 = cell(c, r);
        if (ch0 === ' ' && !lit && (i * 2654435761 >>> 0) / 4294967296 > dens) continue;
        const o = pos(i, S);
        if (!on(o)) continue;
        const fade = clamp((o.r - core) / (Rb * 0.5), 0, 1) * endF * (gone[i] ? k0 : 1);
        if (fade <= 0.02) continue;
        const a0 = lit ? (d < 1 ? 1 : 0.14 + 0.8 * (1 - d / L) ** 1.6) : 0.13 + 0.4 * k0 + 0.15 * m, a = a0 * fade;
        const k = ch0 === ' ' && !lit ? pc() : Math.random() < scr ? pc() : lit ? colStream[c][(r + c * 3) % 48] : ch0;
        if (lit && ch0 !== ' ') put(ch0, o.x, o.y, 0.13 * fade, false); // 평소 화면처럼 쏟아지는 코드 밑에도 바탕 글자가 깔려 있다
        put(k, o.x, o.y, a, lit && d < 1);
        if (m > 0.12 && i % 3 === 0) { // 빠르게 흘러 들며 중심 쪽으로 늘어나는 잔상(같은 바퀴 안에서만)
          const o2 = pos(i, S - dS);
          if (o2.w === o.w) put(k, o2.x, o2.y, a * 0.5, false);
        }
      }
    }
    for (let k = 0; k < ph.length; k++) { // 화면 밖에서 흘러 들어오는 유령 글자: 화면 안에 들어온 것만 그린다
      const i = nCell + k, o = pos(i, S);
      if (!on(o)) continue;
      const fade = clamp((o.r - core) / (Rb * 0.5), 0, 1) * endF;
      if (fade <= 0.02) continue;
      put(Math.random() < scr ? pc() : ph[k], o.x, o.y, (0.13 + 0.4 * k0 + 0.15 * m) * fade, false);
    }
    clearAround(P.x, P.y, Rb * lerp(1, 0.45, k0)); // 블랙홀 둘레를 비우는 폭도 천천히 줄여 이어 간다
    drawArt(P.x, P.y, Rb, 1, chaos, t);
    if (freeze < 0 && !domShown && tau >= MAIN_AT) { domShown = true; showMain(true); }
    if (freeze < 0 && tau >= 1) { mode = 'emerge'; emergeAt = now; stageClass('main'); st.fill(0); act = []; }
  }
  let bigRbStart = 78;

  /* ── 상태 전환 ── */
  const loop = () => { frame(performance.now()); raf = requestAnimationFrame(loop); };
  const stageClass = (m) => { body.classList.remove('is-idle', 'is-collapse', 'is-resolve', 'is-main'); body.classList.add('is-' + m); };
  function go() {
    if (mode !== 'idle') return;
    if (!seen) { T.x = P.x = W / 2; T.y = P.y = H / 2; } // 클릭해도 블랙홀 위치를 포인터로 순간 이동시키지 않는다(따라가던 속도 그대로 이어 간다)
    mode = 'collapse'; rt0 = performance.now(); domShown = false; flowOK = false; bigRbStart = Rb; stageClass('collapse');
  }
  function showMain(animated) {
    body.classList.remove('is-idle', 'is-collapse', 'is-resolve'); body.classList.add('is-main');
    try { sessionStorage.setItem('dev-steps.intro', '1'); } catch { /* 저장이 막힌 브라우저 */ }
    const m = document.querySelector('.main');
    if (animated && m.animate && !reduce) { // 클릭 지점에서 변형되며 튀어나온다
      m.style.transformOrigin = `${P.x}px ${P.y}px`;
      m.animate([
        { transform: 'scale(0.04)', opacity: 0, filter: 'blur(14px)' },
        { transform: 'scale(0.5)', opacity: 0.55, filter: 'blur(5px)', offset: 0.45 },
        { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' },
      ], { duration: 1100, easing: 'cubic-bezier(.16,.84,.3,1)' });
    }
    if (animated && window.__decode) window.__decode();
  }
  function restart() {
    mode = 'idle'; stageClass('idle'); seen = false; lastMove = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  /* 개발용: 클릭 후 연출을 원하는 진행도(0~1)에서 멈춰 보여 준다. 예) __homePreview(0.5) */
  window.__homePreview = (tau) => {
    if (!seen) { T.x = P.x = W / 2; T.y = P.y = H / 2; }
    if (tau >= 1) { // 1.0~2.0은 이어지는(emerge) 구간: 제목과 카드가 튀어나오는 도중을 멈춰 보여 준다
      const u = clamp(tau - 1, 0, 1);
      freeze = -1; freezeU = u; mode = 'emerge'; domShown = true; bigRb = TARGET.idle.Rb * 1.1 + Math.min(W, H) * 0.27 * 0.6; emergeAt = performance.now();
      showMain(true);
      document.querySelector('.main').getAnimations().forEach((a) => { a.pause(); a.currentTime = u * 1100; });
    } else { freeze = tau; freezeU = -1; mode = 'collapse'; flowOK = false; stageClass('collapse'); domShown = true; bigRbStart = TARGET.idle.Rb; }
    if (!raf) raf = requestAnimationFrame(loop);
  };

  /* ── 입력 ── */
  const move = (e) => { inside = true; T.x = e.clientX; T.y = e.clientY; if (!seen) { P.x = T.x; P.y = T.y; } seen = true; lastMove = performance.now(); };
  addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { inside = false; }); // 포인터가 브라우저 밖으로 나가면 블랙홀이 저절로 떠다닌다
  addEventListener('blur', () => { inside = false; }); // 창을 보고 있지 않을 때도
  addEventListener('pointerdown', (e) => {
    if (mode !== 'idle' || e.target.closest('button,a')) return;
    move(e); go();
  });
  addEventListener('keydown', (e) => { if (mode === 'idle' && (e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); go(); } });
  addEventListener('resize', () => { build(); if (mode === 'main' && reduce) frame(performance.now()); });
  document.addEventListener('click', (e) => {
    if (e.target.closest('.enter')) go();
    else if (e.target.closest('.skip')) { if (mode === 'idle') { mode = 'main'; showMain(true); } }
    else if (e.target.closest('.replay')) restart();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && !(reduce && mode === 'main')) raf = requestAnimationFrame(loop); });

  /* ── 시작 ── */
  build();
  t0 = performance.now(); lastMove = t0; last = t0;
  const revisit = (() => { try { return sessionStorage.getItem('dev-steps.intro') === '1' && !/[?&]intro=1/.test(location.search); } catch { return false; } })();
  if (reduce || revisit) {
    mode = 'main'; Rb = TARGET.main.Rb; artA = TARGET.main.art; dim = TARGET.main.dim; stageClass('main');
    if (reduce) frame(t0); else raf = requestAnimationFrame(loop);
    if (window.__decode && revisit && !reduce) window.__decode();
  } else { stageClass('idle'); raf = requestAnimationFrame(loop); }
})();

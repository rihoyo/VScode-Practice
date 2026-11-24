/* 코드 테스트 · 작업 중인 cmd 화면 연출
 * 1) run  : 파이썬 프로그램이 도는 것처럼 계산 결과가 쏟아진다. 내용은 매번 무작위지만 수식은 실제로 계산한 값이라 읽어도 멀쩡하다.
 *           한 줄씩 나오다가, 이따금 로딩(점이 도는 줄, 진행 막대)을 하고, 이따금 빠르게 텍스트가 지나간다.
 * 2) edit : 클릭하거나 아무 키나 누르면 수정 모드. 키를 칠 때마다 파이썬 코드가 자연스럽게 써진다(의미는 없다).
 *           Backspace는 지우고, Enter를 누르면 저장하고 다시 1)로 돌아가 실행 연출을 한다.
 * 전부 DOM 줄 추가와 글자 갱신만 하고 서버와 라이브러리가 없다. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const scr = $('#screen'), ed = $('#editor'), edBody = $('#ed-body'), ttl = $('#ttl'), kbd = $('#kbd'), term = $('#term');
  if (!scr) return;
  const R = Math.random, ri = (a, b) => a + ((R() * (b - a + 1)) | 0), pick = (a) => a[(R() * a.length) | 0], rf = (a, b) => a + R() * (b - a);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const C = (c, t) => `<span class="${c}">${esc(t)}</span>`;
  const fx = (x, d = 4) => Number(x).toFixed(d);
  const sci = (x, d = 2) => Number(x).toExponential(d).replace(/e([+-])(\d)$/, 'e$10$2');
  const pad = (n, w, ch = '0') => String(n).padStart(w, ch);
  let mode = 'run', tok = 0;
  const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const frame = () => new Promise((ok) => requestAnimationFrame(ok));

  /* ── 화면 줄 ── */
  let stick = false;
  const add = (html, cls) => {
    const d = document.createElement('div'); d.className = 'l' + (cls ? ' ' + cls : ''); d.innerHTML = html === '' ? '&nbsp;' : html; scr.append(d);
    while (scr.childElementCount > 160) scr.firstElementChild.remove(); // 화면 아래에 붙어 있어서 오래된 줄은 위에서 사라진다
    return d;
  };
  const PROMPT = 'C:\\Users\\dev\\project>';
  const prompt = (cmd) => add(C('d', PROMPT) + C('w', cmd));

  /* ── 계산 연출 재료: 값은 모두 실제로 계산한다 ── */
  const fibs = (n) => { let a = 0n, b = 1n; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const SIEVE = (() => { const N = 1000000, s = new Uint8Array(N + 1); for (let i = 2; i * i <= N; i++) if (!s[i]) for (let j = i * i; j <= N; j += i) s[j] = 1; return s; })();
  const piN = (x) => { let c = 0; for (let i = 2; i <= x; i++) if (!SIEVE[i]) c++; return c; };
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const stamp = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)},${pad(d.getMilliseconds(), 3)}`; };

  /* 생성기: [{ h: html, d: 다음 줄까지 ms }] 를 돌려준다 */
  const GEN = {
    loss() {
      const e0 = ri(1, 30), n = ri(6, 14), l0 = rf(0.9, 2.1), k = rf(0.1, 0.2), out = [];
      for (let i = 0; i < n; i++) {
        const ep = e0 + i, loss = l0 * Math.exp(-k * ep) + 0.018 + R() * 0.012, acc = 1 - 0.6 * Math.exp(-k * 0.9 * ep) - R() * 0.01, lr = 3e-4 * Math.pow(0.5, Math.floor(ep / 10));
        out.push({ h: C('d', 'Epoch ') + C('w', `${pad(ep, 2)}/40`) + C('d', '  step ') + `${ep * 320}` + C('d', '  loss=') + C('c', fx(loss, 5)) + C('d', '  acc=') + C('g', fx(acc, 4)) + C('d', '  lr=') + sci(lr, 1), d: ri(25, 110) });
      }
      return out;
    },
    fib() {
      const n0 = ri(20, 80), out = [];
      for (let i = 0; i < ri(5, 9); i++) { const n = n0 + i * ri(1, 3); out.push({ h: C('d', 'fib(') + C('w', n) + C('d', ') = ') + C('c', String(fibs(n))) + C('d', '   ratio = ') + fx(Number(fibs(n + 1)) / Number(fibs(n)), 10), d: ri(30, 90) }); }
      return out;
    },
    prime() {
      const out = [C('y', '>>> ') + 'from sieve import pi_count'], ks = [3, 4, 5, 6];
      for (const k of ks.slice(0, ri(2, 4))) { const x = 10 ** k, c = piN(x); out.push(C('y', '>>> ') + `pi_count(10**${k})`, C('c', String(c)) + C('d', `   # x / ln x = ${fx(x / Math.log(x), 1)}`)); }
      return out.map((h) => ({ h, d: ri(60, 160) }));
    },
    newton() {
      const a = ri(2, 99), out = [{ h: C('d', 'newton_sqrt(') + C('w', a) + C('d', ')'), d: 80 }]; let x = a;
      for (let i = 1; i <= 7; i++) { x = 0.5 * (x + a / x); out.push({ h: C('d', `  iter ${i}  x = `) + C('c', x.toFixed(12)) + C('d', '  err = ') + sci(Math.abs(x - Math.sqrt(a)) + 1e-17, 1), d: ri(40, 100) }); }
      return out;
    },
    pi() {
      const out = [{ h: C('d', 'monte_carlo_pi(seed=') + C('w', ri(1, 9999)) + C('d', ')'), d: 80 }]; let inside = 0, n = 0;
      for (let k = 10; k <= ri(15, 19); k++) { const N = 2 ** k; for (; n < N; n++) { const x = R(), y = R(); if (x * x + y * y <= 1) inside++; } const est = 4 * inside / N; out.push({ h: C('d', `  N = ${String(N).padStart(7)}  `) + 'pi ~ ' + C('c', est.toFixed(6)) + C('d', '  |err| = ') + sci(Math.abs(est - Math.PI), 2), d: ri(30, 90) }); }
      return out;
    },
    grad() {
      let x = rf(-6, 6), y = rf(-6, 6); const lr = pick([0.05, 0.1, 0.15]), out = [{ h: C('d', 'minimize f(x, y) = (x - 3)**2 + 2*(y + 1)**2  lr=') + lr, d: 80 }];
      for (let i = 0; i <= 9; i++) { const gx = 2 * (x - 3), gy = 4 * (y + 1), f = (x - 3) ** 2 + 2 * (y + 1) ** 2; out.push({ h: C('d', `  step ${pad(i, 2)}  `) + 'x=' + C('c', fx(x, 5).padStart(9)) + ' y=' + C('c', fx(y, 5).padStart(9)) + C('d', '  f=') + C('g', fx(f, 6)) + C('d', '  |grad|=') + fx(Math.hypot(gx, gy), 4), d: ri(35, 95) }); x -= lr * gx; y -= lr * gy; }
      return out;
    },
    mat() {
      const m = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ri(-5, 9))), d = det3(m), tr = m[0][0] + m[1][1] + m[2][2];
      const rows = m.map((r) => '[' + r.map((v) => String(v).padStart(2)).join(', ') + ']');
      return [{ h: C('y', '>>> ') + 'A = np.array(...)', d: 90 }, ...rows.map((r, i) => ({ h: C('d', i ? '           ' : 'A       =  ') + C('c', r), d: 50 })),
        { h: C('d', 'det(A)  = ') + C('c', fx(d, 1)) + C('d', '    trace(A) = ') + C('c', tr), d: 90 }, { h: C('d', 'rank(A) = ') + C('c', d !== 0 ? '3' : '2'), d: 70 }];
    },
    stats() {
      const a = Array.from({ length: 8 }, () => rf(-3, 9)), mean = a.reduce((s, v) => s + v, 0) / 8, sd = Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / 8), s = [...a].sort((p, q) => p - q), med = (s[3] + s[4]) / 2;
      return [{ h: C('d', 'samples = [') + a.map((v) => fx(v, 3)).join(', ') + C('d', ']'), d: 90 }, { h: C('d', 'mean   = ') + C('c', fx(mean, 6)), d: 50 }, { h: C('d', 'std    = ') + C('c', fx(sd, 6)), d: 50 }, { h: C('d', 'median = ') + C('c', fx(med, 6)), d: 70 }];
    },
    simpson() {
      const out = [{ h: C('d', 'integrate sin(x) over [0, pi] with simpson(n)'), d: 70 }];
      for (const n of [4, 8, 16, 32, 64]) { const h = Math.PI / n; let s = Math.sin(0) + Math.sin(Math.PI); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * Math.sin(i * h); const v = s * h / 3; out.push({ h: C('d', `  n = ${String(n).padStart(3)}  `) + 'I = ' + C('c', v.toFixed(10)) + C('d', '  err = ') + sci(Math.abs(v - 2), 2), d: ri(40, 100) }); }
      return out;
    },
    softmax() {
      const z = Array.from({ length: 4 }, () => rf(-2, 4)), m = Math.max(...z), e = z.map((v) => Math.exp(v - m)), s = e.reduce((p, q) => p + q, 0), p = e.map((v) => v / s);
      return [{ h: C('d', 'logits  = [') + z.map((v) => fx(v, 3)).join(', ') + C('d', ']'), d: 80 }, { h: C('d', 'softmax = [') + C('c', p.map((v) => fx(v, 4)).join(', ')) + C('d', ']'), d: 60 }, { h: C('d', 'sum     = ') + C('g', fx(p.reduce((a, b) => a + b, 0), 4)), d: 70 }];
    },
    gcd() {
      const out = []; for (let i = 0; i < ri(4, 7); i++) { const a = ri(100, 99999), b = ri(100, 99999), g = gcd(a, b); out.push({ h: C('d', 'gcd(') + `${a}, ${b}` + C('d', ') = ') + C('c', g) + C('d', '   lcm = ') + (a / g * b), d: ri(40, 100) }); } return out;
    },
    collatz() {
      const out = []; for (let i = 0; i < ri(4, 7); i++) { let n = ri(7, 99999), steps = 0, mx = n; const n0 = n; while (n !== 1) { n = n % 2 ? 3 * n + 1 : n / 2; steps++; if (n > mx) mx = n; } out.push({ h: C('d', 'collatz(') + C('w', n0) + C('d', ')  steps=') + C('c', steps) + C('d', '  peak=') + mx, d: ri(40, 100) }); } return out;
    },
    sort() {
      const out = [{ h: C('d', 'benchmark sorted() on random ints'), d: 70 }]; let t = rf(0.002, 0.004);
      for (const n of [1e3, 1e4, 1e5, 1e6].slice(0, ri(3, 4))) { t *= rf(9, 13); out.push({ h: C('d', `  n = ${String(n).padStart(8)}  `) + C('c', fx(t, 4) + 's') + C('d', `  (${(n / t / 1e6).toFixed(2)} M items/s)`), d: ri(60, 140) }); }
      return out;
    },
    pytest() {
      const files = ['test_core', 'test_math', 'test_io', 'test_cache', 'test_cli'], out = []; let done = 0;
      const total = ri(30, 60);
      for (const f of files.slice(0, ri(3, 5))) { const n = ri(5, 14); done += n; out.push({ h: C('w', `tests/${f}.py `) + C('g', '.'.repeat(n)) + C('d', `${' '.repeat(Math.max(1, 28 - n))}[${String(Math.min(100, Math.round(done / total * 100))).padStart(3)}%]`), d: ri(120, 320) }); }
      out.push({ h: C('g', `${done} passed`) + C('d', ` in ${fx(rf(0.2, 1.8), 2)}s`), d: 100 }); return out;
    },
    log() {
      const out = []; for (let i = 0; i < ri(6, 14); i++) out.push({ h: C('d', stamp()) + ' ' + C('g', 'INFO ') + ` worker-${ri(1, 8)}  batch=${pick([128, 256, 512])}  loss=${fx(rf(0.02, 0.4), 4)}  ` + C('g', 'ok'), d: ri(20, 80) }); return out;
    },
  };
  const WEIGHT = [['loss', 5], ['fib', 3], ['prime', 2], ['newton', 3], ['pi', 3], ['grad', 3], ['mat', 3], ['stats', 2], ['simpson', 3], ['softmax', 2], ['gcd', 2], ['collatz', 2], ['sort', 2], ['pytest', 2], ['log', 3]];
  const wsum = WEIGHT.reduce((s, w) => s + w[1], 0);
  const pickGen = () => { let r = R() * wsum; for (const [k, w] of WEIGHT) { if ((r -= w) < 0) return k; } return 'loss'; };
  const CMDS = ['python main.py', 'python train.py --epochs 40 --lr 3e-4', 'python solve.py --n 1000000', 'python -m pytest -q', 'python simulate.py --seed 42', 'python benchmark.py', 'python analyze.py data/run_07.csv'];

  /* ── 로딩 연출: 점이 도는 줄과 진행 막대 ── */
  const SP = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
  const LABELS = ['Loading dataset', 'Compiling kernels', 'Resolving dependencies', 'Warming up cache', 'Building index', 'Fitting model', 'Allocating buffers'];
  async function spin(t) {
    const label = pick(LABELS), ms = ri(800, 2300), line = add(''), t0 = performance.now(); let i = 0;
    while (t === tok && performance.now() - t0 < ms) { line.innerHTML = C('c', SP[i++ % SP.length]) + ' ' + esc(label) + C('d', '...'); stickBottom(); await sleep(80); }
    if (t !== tok) return;
    line.innerHTML = C('g', '✔') + ' ' + esc(label) + C('d', ' ... done ') + C('d', `(${fx(rf(1, 90), 1)} MB in ${fx(ms / 1000, 2)}s)`);
  }
  const BL = ' ▏▎▍▌▋▊▉█';
  async function bar(t) {
    const label = pick(['Epoch 3/40', 'Training', 'Downloading', 'Indexing', 'Simulating', 'Checking']), total = ri(80, 600), dur = ri(1400, 3400), line = add(''), t0 = performance.now(); let p = 0;
    const rate = rf(8, 60);
    while (t === tok && p < 1) {
      const u = Math.min(1, (performance.now() - t0) / dur); p = Math.min(1, u + Math.sin(u * 9) * 0.015 * (1 - u));
      const w = 24, full = Math.floor(p * w), part = BL[Math.floor((p * w - full) * 8)];
      const cur = Math.round(p * total), eta = Math.max(0, Math.round((1 - p) * dur / 1000));
      line.innerHTML = C('w', label + ': ') + C('w', String(Math.round(p * 100)).padStart(3) + '%') + C('d', '|') + C('g', '█'.repeat(full) + (full < w ? part : '')) + ' '.repeat(Math.max(0, w - full - 1)) + C('d', `| ${cur}/${total} [00:${pad(Math.round(u * dur / 1000), 2)}<00:${pad(eta, 2)}, ${fx(rate * (0.8 + 0.4 * Math.sin(u * 7)), 1)}it/s]`);
      stickBottom(); await sleep(60);
    }
    if (t !== tok) return;
    line.innerHTML = C('w', label + ': 100%') + C('d', '|') + C('g', '█'.repeat(24)) + C('d', `| ${total}/${total} [00:${pad(Math.round(dur / 1000), 2)}<00:00, ${fx(rate, 1)}it/s]`);
  }
  const stickBottom = () => { scr.scrollTop = scr.scrollHeight; };

  /* ── 실행 연출 루프: 한 줄씩 → 가끔 로딩 → 가끔 빠르게 지나감 ── */
  async function emit(lines, t) { for (const l of lines) { if (t !== tok) return; add(l.h); stickBottom(); await sleep(l.d); } }
  async function burst(t) { // 빠르게 텍스트가 지나간다
    const n = ri(40, 130); let i = 0;
    while (i < n && t === tok) { const k = ri(3, 7); for (let j = 0; j < k; j++, i++) { add(R() < 0.7 ? C('d', stamp()) + ' ' + C('g', 'INFO ') + ` worker-${ri(1, 8)}  chunk 0x${ri(4096, 65535).toString(16)}  ` + C('d', `sha256:${R().toString(16).slice(2, 14)}`) + '  ' + C('g', 'ok') : C('d', '  ') + C('c', `[${pad(ri(0, 999), 3)}]`) + ` processed ${ri(100, 9999)} rows in ${fx(rf(0.001, 0.08), 4)}s`); } stickBottom(); await frame(); }
  }
  async function runLoop(t) {
    prompt('python main.py'); await sleep(ri(250, 500));
    let sinceCmd = 0;
    while (t === tok) {
      const r = R();
      if (sinceCmd > ri(7, 12)) { sinceCmd = 0; add(''); prompt(pick(CMDS)); await sleep(ri(200, 600)); continue; }
      sinceCmd++;
      if (r < 0.52) await emit(GEN[pickGen()](), t);
      else if (r < 0.66) await spin(t);
      else if (r < 0.8) await bar(t);
      else if (r < 0.92) await burst(t);
      else await sleep(ri(300, 900)); // 잠깐 생각하는 듯 멈춤
      if (t === tok) await sleep(ri(40, 220));
    }
  }

  /* ── 수정 모드: 키를 치면 파이썬 코드가 써진다 ── */
  const NAMES = ['data', 'items', 'values', 'result', 'matrix', 'buffer', 'config', 'state', 'nodes', 'weights', 'scores', 'queue', 'cache', 'tokens', 'samples'];
  const FUNCS = ['compute', 'update', 'merge', 'solve', 'estimate', 'normalize', 'transform', 'evaluate', 'reduce', 'resolve', 'simulate', 'process'];
  const CLASSES = ['Solver', 'Pipeline', 'Tracker', 'Model', 'Scheduler', 'Buffer', 'Reducer'];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const T = [
    () => { const f = pick(FUNCS), a = pick(NAMES), b = pick(['alpha', 'decay', 'scale', 'rate']); return `def ${f}(${a}, ${b}=0.5):\n    """${cap(f)} the ${a} using a stable update."""\n    total = 0.0\n    for i, x in enumerate(${a}):\n        total += x * ${b} ** i\n    return total / max(len(${a}), 1)\n`; },
    () => { const c = pick(CLASSES), na = pick(NAMES), f = pick(FUNCS); return `class ${c}:\n    def __init__(self, size=${ri(8, 256)}):\n        self.size = size\n        self.${na} = [0] * size\n\n    def ${f}(self, key):\n        self.${na}[key % self.size] += 1\n        return sum(self.${na})\n`; },
    () => { const a = pick(NAMES), b = pick(NAMES); return `${a} = [x ** 2 for x in range(${ri(10, 99)}) if x % ${ri(2, 7)} == 0]\n${b} = {k: v for k, v in zip("abcde", ${a})}\nprint(f"{len(${a})} items, max={max(${a})}")\n`; },
    () => { const a = pick(NAMES); return `x = np.linspace(0, ${ri(2, 20)}, ${ri(50, 400)})\ny = np.sin(x) * np.exp(-x / ${ri(2, 9)})\n${a} = np.trapz(y, x)\nprint(f"area = {${a}:.6f}")\n`; },
    () => { const a = pick(NAMES); return `try:\n    with open("${pick(NAMES)}.json") as fh:\n        ${a} = json.load(fh)\nexcept FileNotFoundError:\n    ${a} = {}\n`; },
    () => `x = ${ri(2, 9)}.0\nwhile abs(x * x - ${ri(10, 99)}) > 1e-9:\n    x = 0.5 * (x + ${ri(10, 99)} / x)\nprint(round(x, 6))\n`,
    () => { const f = pick(FUNCS); return `@lru_cache(maxsize=None)\ndef ${f}(n):\n    if n < 2:\n        return n\n    return ${f}(n - 1) + ${f}(n - 2)\n`; },
    () => { const f = pick(FUNCS); return `def ${f}(limit):\n    a, b = 0, 1\n    while a < limit:\n        yield a\n        a, b = b, a + b\n`; },
    () => `def timed(fn):\n    def wrapper(*args, **kwargs):\n        t0 = time.perf_counter()\n        out = fn(*args, **kwargs)\n        print(f"{fn.__name__}: {time.perf_counter() - t0:.4f}s")\n        return out\n    return wrapper\n`,
    () => { const c = pick(CLASSES), na = pick(NAMES); return `@dataclass\nclass ${c}:\n    name: str\n    ${na}: list = field(default_factory=list)\n    score: float = 0.0\n`; },
    () => { const na = pick(NAMES), f = pick(FUNCS); return `if __name__ == "__main__":\n    ${na} = ${f}(range(${ri(10, 500)}))\n    print(${na})\n`; },
    () => { const a = pick(NAMES), b = pick(NAMES); return `for i, ${a} in enumerate(${b}):\n    if ${a} % ${ri(2, 9)} == 0:\n        continue\n    print(f"{i:03d} -> {${a}:.3f}")\n`; },
  ];
  const HEADER = 'import json\nimport time\nimport numpy as np\nfrom dataclasses import dataclass, field\nfrom functools import lru_cache\n\n\n';
  let corp = HEADER, buf = HEADER, edCount = 0;
  const grow = () => { while (corp.length - buf.length < 500) { const i = ri(0, T.length - 1), s = T[i](); corp += s + (/^(def|class|@)/.test(s) ? '\n\n' : '\n'); } };
  const KW = 'def|class|return|if|elif|else|for|while|in|import|from|as|try|except|with|yield|lambda|not|and|or|is|None|True|False|pass|break|continue|raise|finally';
  const BI = 'print|len|range|sum|max|min|abs|round|zip|enumerate|open|float|int|str|list|dict|set';
  const TOKRE = new RegExp(`(#.*$)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|\\b(def|class)(\\s+)([A-Za-z_]\\w*)|\\b(${KW})\\b|\\b(\\d+(?:\\.\\d+)?(?:e-?\\d+)?)\\b|(@\\w+)|\\b(${BI})\\b`, 'g');
  const tokenize = (text) => {
    let out = '', last = 0, m; TOKRE.lastIndex = 0;
    while ((m = TOKRE.exec(text))) {
      out += esc(text.slice(last, m.index)); last = m.index + m[0].length;
      if (m[1]) out += C('cm', m[1]); else if (m[2]) out += C('s', m[2]); else if (m[3]) out += C('k', m[3]) + m[4] + C('f', m[5]);
      else if (m[6]) out += C('k', m[6]); else if (m[7]) out += C('nu', m[7]); else if (m[8]) out += C('dc', m[8]); else out += C('bi', m[9]);
    }
    return out + esc(text.slice(last));
  };
  const hl = (line, inDoc) => { // 줄 하나를 색칠하고, 줄이 끝날 때 여러 줄 문자열 안인지 돌려준다
    let out = '';
    if (inDoc) { const j = line.indexOf('"""'); if (j < 0) return { h: C('s', line), doc: true }; out += C('s', line.slice(0, j + 3)); line = line.slice(j + 3); }
    for (;;) {
      const k = line.indexOf('"""'); if (k < 0) break;
      out += tokenize(line.slice(0, k)); const e = line.indexOf('"""', k + 3);
      if (e >= 0) { out += C('s', line.slice(k, e + 3)); line = line.slice(e + 3); } else return { h: out + C('s', line.slice(k)), doc: true };
    }
    return { h: out + tokenize(line), doc: false };
  };
  const rend = []; // { el, text, doc }
  function renderEditor() {
    edBody.querySelectorAll('.cur').forEach((c) => c.remove()); // 이전 줄에 남은 커서를 먼저 지운다
    const lines = buf.split('\n'); let i = 0;
    while (i < rend.length && i < lines.length - 1 && rend[i].text === lines[i]) i++;
    while (rend.length > i) rend.pop().el.remove();
    for (; i < lines.length; i++) {
      const prev = i ? rend[i - 1].doc : false, r = hl(lines[i], prev), el = document.createElement('div');
      el.className = 'el'; el.innerHTML = `<span class="n">${i + 1}</span><span class="t">${r.h}</span>`;
      edBody.append(el); rend.push({ el, text: lines[i], doc: r.doc });
    }
    const last = rend[rend.length - 1]; last.el.querySelector('.t').insertAdjacentHTML('beforeend', '<span class="cur"></span>');
    while (edBody.childElementCount > 200) edBody.firstElementChild.remove(); // DOM이 커지지 않게 위쪽 줄을 덜어 낸다(번호는 유지)
    edBody.scrollTop = edBody.scrollHeight;
  }
  const typeChunk = (n) => { grow(); const k = n || ri(2, 5), chunk = corp.slice(buf.length, buf.length + k); buf += chunk; renderEditor(); };
  const eraseOne = () => { if (buf.length > HEADER.length) { buf = buf.slice(0, -1); corp = corp.slice(0, buf.length) + ''; renderEditor(); } };

  /* ── 모드 전환 ── */
  function enterEdit() {
    if (mode === 'edit') return; mode = 'edit'; tok++;
    term.classList.add('edit'); scr.hidden = true; ed.hidden = false; ttl.textContent = 'C:\\WINDOWS\\system32\\cmd.exe - vim main.py';
    if (edCount++ === 0) { rend.length = 0; edBody.replaceChildren(); }
    grow(); renderEditor(); kbd.focus({ preventScroll: true });
  }
  async function leaveEdit() {
    if (mode !== 'edit') return; mode = 'wait';
    await sleep(260);
    mode = 'run'; tok++; term.classList.remove('edit'); scr.hidden = false; ed.hidden = true; ttl.textContent = 'C:\\WINDOWS\\system32\\cmd.exe - python main.py';
    add(''); runLoop(tok);
  }
  const FREE = /^(Shift|Control|Alt|Meta|CapsLock|NumLock|ScrollLock|Dead|Process|F\d+)$/;
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea:not(#kbd),select,[contenteditable="true"]')) return; // 위쪽 검색칸에 쓰는 글은 건드리지 않는다
    if (e.ctrlKey || e.metaKey || e.altKey || FREE.test(e.key) || e.key === 'Unidentified') return;
    if (mode === 'run') { e.preventDefault(); enterEdit(); typeChunk(); return; }
    if (mode !== 'edit') return;
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); leaveEdit(); }
    else if (e.key === 'Backspace') { e.preventDefault(); eraseOne(); }
    else { e.preventDefault(); typeChunk(); }
  });
  kbd.addEventListener('input', () => { if (mode === 'edit') typeChunk(); kbd.value = ''; }); // 화면 키보드(터치)용
  term.addEventListener('click', () => { if (mode === 'run') enterEdit(); else if (mode === 'edit') kbd.focus({ preventScroll: true }); });

  runLoop(tok);
})();

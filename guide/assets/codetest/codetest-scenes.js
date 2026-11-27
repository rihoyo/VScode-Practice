/* 코드 테스트 · 연출 다섯 가지(단축키 1~5). 아무 의미 없이 "연산 중인 척"만 한다.
 * 시나리오마다: first(첫 명령) · cmds(중간에 치는 명령) · init()(이어지는 상태) · phase(st)(한 구간의 설정) ·
 *   shift(st, P, old)(변주가 생길 때 찍는 줄) · gens(줄 생성기) · spin(로딩 문구) · bar(진행 막대 문구) · burst()(빠르게 지나가는 줄)
 * 생성기는 [{ h: html, d: ms, c: 줄 class }] 또는 { s: 글자를 흘려 쓸 문장, pre: 앞 html } 를 돌려준다.
 * 숫자는 가능한 한 실제로 계산한다(평균·표준편차·상관·t값·엔트로피·RTT 통계). 주소는 문서용 대역(192.0.2.0/24 등)과 사설 대역만 쓴다. */
window.CT_SCENES = (H) => {
  const { R, ri, rf, pick, C, esc, fx, sci, pad, stamp } = H;
  const L = (h, d, c) => ({ h, d: d == null ? ri(30, 110) : d, c });
  const hex = (n) => { let s = ''; for (let i = 0; i < n; i++) s += '0123456789abcdef'[ri(0, 15)]; return s; };
  const gauss = () => Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R());
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); };
  const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const pnorm2 = (z) => 1 - erf(Math.abs(z) / Math.SQRT2); // 양쪽 p값(정규 근사)
  const ipD = () => pick(['192.0.2.', '198.51.100.', '203.0.113.']) + ri(1, 254);
  const ipP = (a = ri(0, 63)) => `10.${a}.${ri(0, 255)}.${ri(1, 254)}`;
  const clock = () => stamp().slice(11, 23);
  const row = (cells, w) => cells.map((c, i) => (i ? String(c).padStart(w[i]) : String(c).padEnd(w[i]))).join('  ');
  const bars = (vals, w = 28) => { const mx = Math.max(...vals) || 1; return vals.map((v) => '█'.repeat(Math.max(1, Math.round(v / mx * w)))); };
  const spark = (vals) => { const b = '▁▂▃▄▅▆▇█', lo = Math.min(...vals), hi = Math.max(...vals); return vals.map((v) => b[Math.min(7, Math.floor((v - lo) / (hi - lo + 1e-9) * 8))]).join(''); };
  // 매번 다른 모양의 추세 데이터: 형태·주기·위상·잡음·이상점을 무작위로 섞는다
  const trend = (n = ri(18, 32)) => {
    const f = rf(0.15, 0.9), ph = rf(0, 6.3), a = rf(0.3, 1.5), sl = rf(-0.12, 0.12), nz = rf(0.05, 0.9);
    const at = ri(3, n - 4), jump = rf(-2, 2) || 1;
    let w = 0;
    const shape = pick([
      (i) => Math.sin(i * f + ph) * a,                                    // 계절성
      (i) => i * sl * 3,                                                  // 선형 증감
      (i) => Math.sin(i * f + ph) * a + i * sl,                           // 계절성+추세
      (i) => (i >= at ? jump : 0),                                        // 계단
      (i) => (w += rf(-0.5, 0.5)),                                        // 랜덤 워크
      (i) => Math.exp(-((i - at) ** 2) / rf(2, 12)) * a * 3,              // 봉우리
      (i) => Math.log1p(i) * (sl >= 0 ? 1 : -1),                          // 포화
      (i) => Math.sin(i * f + ph) * a * (1 + i / n),                      // 진폭 증가
    ]);
    const v = Array.from({ length: n }, (_, i) => shape(i) + (R() - 0.5) * nz);
    if (R() < 0.35) v[ri(0, n - 1)] += pick([-1, 1]) * rf(1.5, 3); // 가끔 이상점
    return v;
  };
  // 한 구간의 생성기 비중과 연출 비율을 매번 새로 뽑는다
  const weights = (keys) => { const k = [...keys].sort(() => R() - 0.5).slice(0, ri(Math.ceil(keys.length * 0.55), keys.length)); return k.map((x) => [x, ri(1, 5)]); };
  const mix = () => ({ emit: rf(0.42, 0.62), spin: rf(0.07, 0.16), bar: rf(0.07, 0.16), burst: rf(0.05, 0.13) });
  const banner = (t, cls = 'v') => L(C(cls === 'al' ? 'r' : 'y', `━━ ${t} ━━`), 260, cls);

  /* ── 1. 수치 계산·학습 ── */
  const fibs = (n) => { let a = 0n, b = 1n; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const SIEVE = (() => { const N = 1000000, s = new Uint8Array(N + 1); for (let i = 2; i * i <= N; i++) if (!s[i]) for (let j = i * i; j <= N; j += i) s[j] = 1; return s; })();
  const piN = (x) => { let c = 0; for (let i = 2; i <= x; i++) if (!SIEVE[i]) c++; return c; };
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const EP = 1500;
  const s1 = {
    name: '수치 계산', first: 'python main.py',
    cmds: [`python train.py --epochs ${EP} --lr 3e-4`, 'python solve.py --n 1000000', 'python -m pytest -q', 'python simulate.py --seed 42', 'python benchmark.py', 'python analyze.py data/run_07.csv'],
    init: () => ({ ep: ri(1, 40), run: 1, best: 9 }),
    phase: () => ({ l0: rf(1.2, 2.4), k: rf(2.5, 6) / EP, floor: rf(0.01, 0.05), lr: pick([3e-4, 5e-4, 1e-3, 2e-4]), batch: pick([64, 128, 256, 512]), opt: pick(['AdamW', 'SGD+momentum', 'Lion', 'Adafactor']), speed: rf(0.7, 1.5),
      w: weights(['loss', 'loss', 'fib', 'prime', 'newton', 'pi', 'grad', 'mat', 'stats', 'simpson', 'softmax', 'gcd', 'collatz', 'sort', 'pytest', 'log']), mix: mix() }),
    shift: (st, P) => [banner(`scheduler: stage change @ epoch ${st.ep}`), L(C('d', '  optimizer   -> ') + C('w', P.opt) + C('d', '   lr -> ') + C('c', sci(P.lr, 1)) + C('d', '   batch -> ') + C('c', P.batch)),
      L(C('d', `  checkpoint  -> ckpt/epoch_${pad(st.ep, 4)}.pt  sha256:${hex(12)}`) + '  ' + C('g', 'saved'), 200)],
    gens: {
      loss(st, P) {
        const out = [];
        for (let i = 0, n = ri(6, 14); i < n; i++) {
          st.ep += ri(1, 3);
          if (st.ep > EP) {
            out.push(L(C('g', `Epoch ${EP}/${EP} done.`) + C('d', '  best val_loss=') + C('c', fx(st.best, 5)) + C('d', '  -> saved best.pt'), 240), L('', 120), L(C('w', `Starting run #${++st.run}`) + C('d', `  seed=${ri(1, 99999)}`), 300));
            st.ep = 1; st.best = 9; break;
          }
          const ep = st.ep, loss = P.l0 * Math.exp(-P.k * ep) + P.floor + R() * 0.012, acc = 1 - 0.6 * Math.exp(-P.k * 0.9 * ep) - R() * 0.01, lr = P.lr * 0.5 * (1 + Math.cos(Math.PI * ep / EP));
          if (loss < st.best) st.best = loss;
          out.push(L(C('d', 'Epoch ') + C('w', `${pad(ep, 4)}/${EP}`) + C('d', '  step ') + `${ep * P.batch * 5}` + C('d', '  loss=') + C('c', fx(loss, 5)) + C('d', '  acc=') + C('g', fx(acc, 4)) + C('d', '  lr=') + sci(lr + 1e-9, 2), ri(25, 110)));
        }
        return out;
      },
      fib() { const n0 = ri(20, 80), out = []; for (let i = 0, n = ri(5, 9); i < n; i++) { const k = n0 + i * ri(1, 3); out.push(L(C('d', 'fib(') + C('w', k) + C('d', ') = ') + C('c', String(fibs(k))) + C('d', '   ratio = ') + fx(Number(fibs(k + 1)) / Number(fibs(k)), 10))); } return out; },
      prime() { const out = [L(C('y', '>>> ') + 'from sieve import pi_count', 90)]; for (const k of [3, 4, 5, 6].slice(0, ri(2, 4))) { const x = 10 ** k; out.push(L(C('y', '>>> ') + `pi_count(10**${k})`, 120), L(C('c', String(piN(x))) + C('d', `   # x / ln x = ${fx(x / Math.log(x), 1)}`), 120)); } return out; },
      newton() { const a = ri(2, 99), out = [L(C('d', 'newton_sqrt(') + C('w', a) + C('d', ')'), 80)]; let x = a; for (let i = 1; i <= 7; i++) { x = 0.5 * (x + a / x); out.push(L(C('d', `  iter ${i}  x = `) + C('c', x.toFixed(12)) + C('d', '  err = ') + sci(Math.abs(x - Math.sqrt(a)) + 1e-17, 1))); } return out; },
      pi() { const out = [L(C('d', 'monte_carlo_pi(seed=') + C('w', ri(1, 9999)) + C('d', ')'), 80)]; let inside = 0, n = 0; for (let k = 10, e = ri(15, 19); k <= e; k++) { const N = 2 ** k; for (; n < N; n++) { const x = R(), y = R(); if (x * x + y * y <= 1) inside++; } const est = 4 * inside / N; out.push(L(C('d', `  N = ${String(N).padStart(7)}  `) + 'pi ~ ' + C('c', est.toFixed(6)) + C('d', '  |err| = ') + sci(Math.abs(est - Math.PI), 2))); } return out; },
      grad() { let x = rf(-6, 6), y = rf(-6, 6); const lr = pick([0.05, 0.1, 0.15]), out = [L(C('d', 'minimize f(x, y) = (x - 3)**2 + 2*(y + 1)**2  lr=') + lr, 80)]; for (let i = 0; i <= 9; i++) { const gx = 2 * (x - 3), gy = 4 * (y + 1), f = (x - 3) ** 2 + 2 * (y + 1) ** 2; out.push(L(C('d', `  step ${pad(i, 2)}  `) + 'x=' + C('c', fx(x, 5).padStart(9)) + ' y=' + C('c', fx(y, 5).padStart(9)) + C('d', '  f=') + C('g', fx(f, 6)) + C('d', '  |grad|=') + fx(Math.hypot(gx, gy), 4))); x -= lr * gx; y -= lr * gy; } return out; },
      mat() { const m = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ri(-5, 9))), d = det3(m); return [L(C('y', '>>> ') + 'A = np.array(...)', 90), ...m.map((r, i) => L(C('d', i ? '           ' : 'A       =  ') + C('c', '[' + r.map((v) => String(v).padStart(2)).join(', ') + ']'), 50)), L(C('d', 'det(A)  = ') + C('c', fx(d, 1)) + C('d', '    trace(A) = ') + C('c', m[0][0] + m[1][1] + m[2][2]), 90), L(C('d', 'rank(A) = ') + C('c', d !== 0 ? '3' : '2'), 70)]; },
      stats() { const a = Array.from({ length: 8 }, () => rf(-3, 9)), s = [...a].sort((p, q) => p - q); return [L(C('d', 'samples = [') + a.map((v) => fx(v, 3)).join(', ') + C('d', ']'), 90), L(C('d', 'mean   = ') + C('c', fx(mean(a), 6)), 50), L(C('d', 'std    = ') + C('c', fx(sd(a), 6)), 50), L(C('d', 'median = ') + C('c', fx((s[3] + s[4]) / 2, 6)), 70)]; },
      simpson() { const out = [L(C('d', 'integrate sin(x) over [0, pi] with simpson(n)'), 70)]; for (const n of [4, 8, 16, 32, 64]) { const h = Math.PI / n; let s = 0; for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * Math.sin(i * h); const v = s * h / 3; out.push(L(C('d', `  n = ${String(n).padStart(3)}  `) + 'I = ' + C('c', v.toFixed(10)) + C('d', '  err = ') + sci(Math.abs(v - 2), 2))); } return out; },
      softmax() { const z = Array.from({ length: 4 }, () => rf(-2, 4)), m = Math.max(...z), e = z.map((v) => Math.exp(v - m)), s = e.reduce((p, q) => p + q, 0), p = e.map((v) => v / s); return [L(C('d', 'logits  = [') + z.map((v) => fx(v, 3)).join(', ') + C('d', ']'), 80), L(C('d', 'softmax = [') + C('c', p.map((v) => fx(v, 4)).join(', ')) + C('d', ']'), 60), L(C('d', 'sum     = ') + C('g', fx(1, 4)), 70)]; },
      gcd() { const out = []; for (let i = 0, n = ri(4, 7); i < n; i++) { const a = ri(100, 99999), b = ri(100, 99999), g = gcd(a, b); out.push(L(C('d', 'gcd(') + `${a}, ${b}` + C('d', ') = ') + C('c', g) + C('d', '   lcm = ') + (a / g * b))); } return out; },
      collatz() { const out = []; for (let i = 0, k = ri(4, 7); i < k; i++) { let n = ri(7, 99999), steps = 0, mx = n; const n0 = n; while (n !== 1) { n = n % 2 ? 3 * n + 1 : n / 2; steps++; if (n > mx) mx = n; } out.push(L(C('d', 'collatz(') + C('w', n0) + C('d', ')  steps=') + C('c', steps) + C('d', '  peak=') + mx)); } return out; },
      sort() { const out = [L(C('d', 'benchmark sorted() on random ints'), 70)]; let t = rf(0.002, 0.004); for (const n of [1e3, 1e4, 1e5, 1e6].slice(0, ri(3, 4))) { t *= rf(9, 13); out.push(L(C('d', `  n = ${String(n).padStart(8)}  `) + C('c', fx(t, 4) + 's') + C('d', `  (${(n / t / 1e6).toFixed(2)} M items/s)`), ri(60, 140))); } return out; },
      pytest() { const out = []; let done = 0; const total = ri(30, 60); for (const f of ['test_core', 'test_math', 'test_io', 'test_cache', 'test_cli'].slice(0, ri(3, 5))) { const n = ri(5, 14); done += n; out.push(L(C('w', `tests/${f}.py `) + C('g', '.'.repeat(n)) + C('d', `${' '.repeat(Math.max(1, 28 - n))}[${String(Math.min(100, Math.round(done / total * 100))).padStart(3)}%]`), ri(120, 320))); } out.push(L(C('g', `${done} passed`) + C('d', ` in ${fx(rf(0.2, 1.8), 2)}s`), 100)); return out; },
      log(st, P) { const out = []; for (let i = 0, n = ri(6, 14); i < n; i++) out.push(L(C('d', stamp()) + ' ' + C('g', 'INFO ') + ` worker-${ri(1, 8)}  batch=${P.batch}  loss=${fx(rf(0.02, 0.4), 4)}  ` + C('g', 'ok'), ri(20, 80))); return out; },
    },
    spin: ['Loading dataset', 'Compiling kernels', 'Resolving dependencies', 'Warming up cache', 'Building index', 'Fitting model', 'Allocating buffers'],
    bar: (st) => pick([`Epoch ${st.ep}/${EP}`, 'Training', 'Downloading', 'Indexing', 'Simulating', 'Checking']),
    burst: () => (R() < 0.7 ? C('d', stamp()) + ' ' + C('g', 'INFO ') + ` worker-${ri(1, 8)}  chunk 0x${ri(4096, 65535).toString(16)}  ` + C('d', `sha256:${hex(12)}`) + '  ' + C('g', 'ok') : C('d', '  ') + C('c', `[${pad(ri(0, 999), 3)}]`) + ` processed ${ri(100, 9999)} rows in ${fx(rf(0.001, 0.08), 4)}s`),
  };

  /* ── 2. LLM 연구 ── */
  const BENCH = ['reasoning-mc', 'math-word', 'code-pass@1', 'reading-comp', 'commonsense', 'long-ctx-recall', 'multilingual'];
  const SAY = ['The model learns to copy earlier spans once the induction heads form,', 'which suggests the gain comes from better retrieval rather than memorization.', 'Scaling the context window shifts loss mostly on the tail tokens,',
    'and the reward model prefers concise answers when the prompt is ambiguous.', 'Attention entropy drops sharply after warmup in the middle layers,', 'so we keep the data mixture fixed and vary only the learning rate schedule.',
    'Given a list of numbers, the function returns the running maximum.', 'Translation quality improves when code and math tokens are upsampled.'];
  const s2 = {
    name: 'LLM 연구', first: 'python -m research.train --config configs/llm.yaml',
    cmds: ['python -m research.eval --suite core', 'python -m research.probe --layers 8-24', 'python -m research.sample --n 4 --temperature 0.7', 'python -m research.ablate --grid ablations/rope.yaml', 'python -m research.rlhf --stage ppo'],
    init: () => ({ step: ri(2000, 20000), exp: 'exp-' + hex(4), prev: {}, ppo: 0 }),
    phase: () => {
      const size = pick([['1.3B', 1.3e9], ['2.7B', 2.7e9], ['7B', 7e9], ['13B', 1.3e10], ['34B', 3.4e10], ['70B', 7e10]]);
      return { size: size[0], N: size[1], ctx: pick([4096, 8192, 32768, 131072]), E: rf(1.55, 1.95), B: rf(2, 3.4), a: rf(0.25, 0.45), lr: pick([1.5e-4, 2e-4, 3e-4, 6e-4]), gpus: pick([64, 128, 256, 512, 1024]), mixName: pick(['web-heavy', 'code-up', 'math-up', 'balanced', 'multilingual']),
        base: Object.fromEntries(BENCH.map((b) => [b, rf(18, 55)])), speed: rf(0.7, 1.4), w: weights(['train', 'train', 'train', 'evalb', 'probe', 'sample', 'scaling', 'ablation', 'rlhf', 'tok']), mix: mix() };
    },
    shift: (st, P, o) => {
      const ev = pick(['spike', 'ctx', 'mix', 'size', 'restart']);
      if (ev === 'spike') return [banner(`loss spike at step ${st.step} (+${fx(rf(0.4, 1.6), 2)})`, 'al'), L(C('d', `  rolling back to ckpt step ${st.step - ri(200, 900)}  ·  skipping ${ri(2, 12)} bad shards`), 300), L(C('d', '  lr -> ') + C('c', sci(P.lr, 1)) + C('d', '  grad clip -> 1.0'), 200)];
      if (ev === 'ctx') return [banner(`extending context ${o.ctx} -> ${P.ctx}`), L(C('d', `  rope base -> ${pick([10000, 500000, 1000000])}  ·  long-doc upsample x${ri(2, 6)}`), 250)];
      if (ev === 'mix') return [banner(`data mixture -> ${P.mixName}`), L(C('d', `  web ${ri(30, 60)}%  code ${ri(10, 30)}%  math ${ri(5, 20)}%  books ${ri(3, 12)}%`), 250)];
      if (ev === 'size') return [banner(`new run: ${P.size} params on ${P.gpus} GPUs`), L(C('d', `  ${st.exp} -> `) + C('w', (st.exp = 'exp-' + hex(4))) + C('d', `  ctx=${P.ctx}  lr=${sci(P.lr, 1)}`), 300)];
      return [banner(`lr warm restart @ step ${st.step}`), L(C('d', `  cosine cycle ${ri(2, 6)}  peak lr ${sci(P.lr, 1)}  warmup ${ri(200, 2000)} steps`), 250)];
    },
    gens: {
      train(st, P) {
        const out = [];
        for (let i = 0, n = ri(5, 12); i < n; i++) {
          st.step += ri(10, 60);
          const loss = P.E + P.B * Math.pow(st.step / 1000 + 1, -P.a) + gauss() * 0.01, tps = (3.2e13 * P.gpus / (6 * P.N)) * rf(0.9, 1.1);
          out.push(L(C('d', 'step ') + C('w', pad(st.step, 7)) + C('d', ' | loss ') + C('c', fx(loss, 4)) + C('d', ' | ppl ') + fx(Math.exp(loss), 2) + C('d', ' | lr ') + sci(P.lr * rf(0.6, 1), 2) + C('d', ' | gnorm ') + fx(rf(0.3, 1.3), 2) + C('d', ' | tok/s ') + C('g', (tps / 1000).toFixed(1) + 'k') + C('d', ' | mfu ') + fx(rf(35, 52), 1) + '%', ri(40, 120)));
        }
        return out;
      },
      evalb(st, P) {
        const out = [L(C('w', `== eval ${st.exp} @ step ${st.step} · ${P.size} ==`), 200)];
        for (const b of BENCH.slice(0, ri(4, BENCH.length))) {
          const sc = Math.min(96, P.base[b] + 9 * Math.log10(st.step / 1000 + 1) + gauss()), d = st.prev[b] == null ? 0 : sc - st.prev[b]; st.prev[b] = sc;
          out.push(L(C('d', '  ' + b.padEnd(18)) + C('c', fx(sc, 2).padStart(6)) + C('d', '   Δ ') + (d >= 0 ? C('g', '+' + fx(d, 2)) : C('r', fx(d, 2))), ri(90, 220)));
        }
        return out;
      },
      probe() { const out = [L(C('y', '>>> ') + 'probe.attention_heads(layers=range(8, 24))', 120)]; for (let i = 0, n = ri(4, 8); i < n; i++) out.push(L(C('d', `  layer ${pad(ri(8, 23), 2)} head ${pad(ri(0, 31), 2)}  `) + 'entropy=' + C('c', fx(rf(0.4, 3.2), 3)) + C('d', '  induction=') + fx(R(), 3) + C('d', '  prev_tok=') + fx(R(), 3))); return out; },
      sample() { return [L(C('y', '>>> ') + `generate(prompt=<${ri(12, 400)} tok>, temperature=${pick([0.2, 0.7, 1.0])}, top_p=${pick([0.9, 0.95])})`, 150), { s: pick(SAY) + ' ' + pick(SAY), pre: C('g', '  ▸ ') }, L(C('d', `  [${ri(30, 90)} tok · ${fx(rf(20, 140), 1)} tok/s · logprob ${fx(-rf(0.2, 1.5), 3)}]`), 200)]; },
      scaling(st, P) { const out = [L(C('d', `fit L(N) = E + A / N^alpha   E=${fx(P.E, 3)}  alpha=${fx(P.a, 3)}`), 120)]; for (const n of [1.25e8, 3.5e8, 1.3e9, 7e9, 3.4e10, 7e10]) { const l = P.E + 410 / Math.pow(n, P.a); out.push(L(C('d', `  N=${sci(n, 1).padStart(8)}  `) + 'L=' + C('c', fx(l, 4)) + C('d', '  ' + '▇'.repeat(Math.max(1, Math.round((l - P.E) * 9)))))); } return out; },
      ablation(st) { const base = rf(2.1, 2.6), out = [L(C('w', 'ablation           val_loss      Δ'), 120)]; for (const v of ['baseline', '-rope_scaling', '-qk_norm', '+swiglu', '+muP init', 'no_dropout'].slice(0, ri(4, 6))) { const l = v === 'baseline' ? base : base + gauss() * 0.03; out.push(L(C('d', '  ' + v.padEnd(16)) + C('c', fx(l, 4).padStart(9)) + '   ' + (l <= base ? C('g', fx(l - base, 4)) : C('r', '+' + fx(l - base, 4))))); } return out; },
      rlhf(st) { const out = []; for (let i = 0, n = ri(4, 8); i < n; i++) { st.ppo++; out.push(L(C('d', `ppo iter ${pad(st.ppo, 4)}  `) + 'reward=' + C('g', fx(0.2 + 0.5 * (1 - Math.exp(-st.ppo / 80)) + gauss() * 0.02, 4)) + C('d', '  kl=') + fx(rf(0.01, 0.06), 4) + C('d', '  entropy=') + fx(rf(1.2, 2.4), 3) + C('d', '  clipfrac=') + fx(rf(0.05, 0.2), 3))); } return out; },
      tok() { return [L(C('y', '>>> ') + 'tokenizer.stats(shard="val-00042")', 100), L(C('d', '  vocab=') + C('c', pick([32000, 65536, 128000, 200000])) + C('d', '  bytes/token=') + fx(rf(3.4, 4.6), 3) + C('d', '  unk=') + fx(rf(0, 0.002), 5), 120)]; },
    },
    spin: ['Sharding checkpoint', 'Building data mixture', 'Compiling attention kernels', 'Prefetching shards', 'Gathering eval results', 'All-reduce warmup', 'Merging LoRA adapters'],
    bar: () => pick([`Eval ${pick(BENCH)}`, `Tokenizing shard ${pad(ri(0, 999), 4)}`, 'Saving checkpoint', 'Generating samples']),
    burst: (st) => C('d', `[rank ${pad(ri(0, 511), 3)}] `) + `step ${st.step} micro ${ri(1, 8)}/8  fwd ${fx(rf(20, 90), 1)}ms  bwd ${fx(rf(40, 180), 1)}ms  ` + C('d', `nccl ${fx(rf(1, 12), 2)}ms`),
  };

  /* ── 3. 에이전트 데이터 분석 ── */
  const DATA = [
    { f: 'sales_2026q3.parquet', cat: 'region', cats: ['north', 'south', 'east', 'west', 'central'], nums: ['revenue', 'units', 'discount', 'margin'] },
    { f: 'sensor_fleet.csv', cat: 'device', cats: ['pump-a', 'pump-b', 'fan-c', 'valve-d', 'motor-e'], nums: ['temp', 'vibration', 'rpm', 'error_rate'] },
    { f: 'churn_events.db', cat: 'plan', cats: ['free', 'basic', 'pro', 'team', 'enterprise'], nums: ['tenure', 'tickets', 'spend', 'logins'] },
    { f: 'web_sessions.jsonl', cat: 'channel', cats: ['search', 'social', 'email', 'direct', 'referral'], nums: ['sessions', 'bounce', 'duration', 'conv'] },
  ];
  const THINK = [(d, a, b, c) => `Distribution of ${a} looks right-skewed; checking whether ${c} drives the tail.`, (d, a, b) => `${a} and ${b} move together in the last 6 weeks — need to rule out a shared seasonal driver.`,
    (d, a, b, c) => `Segment ${c} is under-sampled. I'll bootstrap before trusting that gap.`, (d, a) => `Nulls in ${a} cluster on weekends, likely an ingestion issue rather than real behavior.`,
    (d, a, b) => `Hypothesis: higher ${b} predicts lower ${a}. Running a test before writing it up.`, (d) => `Joining ${d.f} with the calendar table to control for holidays.`];
  const synth = (n, mu, s) => Array.from({ length: n }, () => mu + s * gauss());
  const s3 = {
    name: '데이터 분석 에이전트', first: 'agent run --task "explain metric drop" --data ./data',
    cmds: ['agent tool sql.query', 'agent tool py.exec analysis.py', 'agent plan --revise', 'agent report --section findings'],
    init: () => ({ plan: 0, rep: 1, call: 0 }),
    phase: (st) => ({ d: pick(DATA), rows: ri(80, 4000) * 1000, speed: rf(0.7, 1.3), w: weights(['think', 'think', 'sql', 'describe', 'corr', 'ttest', 'outlier', 'hist', 'plan', 'report']), mix: mix(), steps: ['load & profile', 'clean nulls', 'segment', 'test hypotheses', 'model drivers', 'write findings'] }),
    shift: (st, P, o) => {
      const ev = pick(['reject', 'source', 'drift', 'pivot']);
      if (ev === 'reject') return [banner(`hypothesis H${ri(1, 6)} rejected (p=${fx(rf(0.12, 0.8), 3)}) — re-planning`), ...P.steps.slice(0, 3).map((s, i) => L(C('d', `  ${i + 1}. `) + s, 120))];
      if (ev === 'source') return [banner(`new data source: ${P.d.f}`), L(C('d', `  joined on id · ${P.rows.toLocaleString()} rows · ${ri(4, 30)} columns · ${fx(rf(0.1, 3), 2)} GB`), 260)];
      if (ev === 'drift') return [banner(`schema drift in ${o.d.f}: column renamed, type changed`, 'al'), L(C('d', `  ${pick(o.d.nums)}: float64 -> string  ·  coercing ${ri(10, 900)} values`), 260)];
      return [banner(`pivot: segment analysis by ${P.d.cat}`), L(C('d', `  focus metric -> ${pick(P.d.nums)}`), 200)];
    },
    gens: {
      think(st, P) { const d = P.d, [a, b] = [...d.nums].sort(() => R() - 0.5); return [{ s: pick(THINK)(d, a, b, pick(d.cats)), pre: C('m', '[agent] ') + C('d', '◆ ') }]; },
      sql(st, P) {
        const d = P.d, n = pick(d.nums), w = [10, 12, 9], out = [L(C('b', `→ tool#${++st.call} sql.query`) + C('d', `("SELECT ${d.cat}, AVG(${n}), COUNT(*) FROM t GROUP BY ${d.cat}")`), 220), L(C('w', '  ' + row([d.cat, 'avg_' + n, 'count'], w)), 60)];
        for (const c of d.cats) out.push(L('  ' + row([c, fx(rf(10, 900), 2), ri(1000, 90000)], w), 50));
        out.push(L(C('d', `  (${d.cats.length} rows, ${fx(rf(0.05, 1.4), 3)}s)`), 120)); return out;
      },
      describe(st, P) {
        const cols = P.d.nums.slice(0, 3), data = cols.map(() => synth(400, rf(10, 500), rf(2, 80))), w = [7, 11, 11, 11];
        const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
        const out = [L(C('y', '>>> ') + 'df[[' + cols.map((c) => `"${c}"`).join(', ') + ']].describe()', 120), L(C('w', '  ' + row(['', ...cols], w)), 50)];
        for (const [k, f] of [['count', (a) => a.length], ['mean', mean], ['std', sd], ['min', (a) => Math.min(...a)], ['50%', (a) => q(a, 0.5)], ['max', (a) => Math.max(...a)]]) out.push(L('  ' + row([k, ...data.map((a) => fx(f(a), 2))], w), 40));
        return out;
      },
      corr(st, P) {
        const n = 300, z = [synth(n, 0, 1), synth(n, 0, 1)], m = P.d.nums.map(() => [rf(-1, 1), rf(-1, 1), rf(0.2, 0.8)]);
        const cols = m.map(([a, b, e]) => z[0].map((v, i) => a * v + b * z[1][i] + e * gauss()));
        const cor = (x, y) => { const mx = mean(x), my = mean(y); let s = 0, sx = 0, sy = 0; for (let i = 0; i < x.length; i++) { s += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; } return s / Math.sqrt(sx * sy); };
        const w = [11, 10, 10, 10, 10], out = [L(C('y', '>>> ') + 'df.corr()', 100), L(C('w', '  ' + row(['', ...P.d.nums], w)), 50)];
        P.d.nums.forEach((c, i) => out.push(L('  ' + C('w', c.padEnd(11)) + '  ' + P.d.nums.map((_, j) => { const r = cor(cols[i], cols[j]), t = fx(r, 3).padStart(10); return Math.abs(r) > 0.6 && i !== j ? C('g', t) : t; }).join('  '), 50)));
        return out;
      },
      ttest(st, P) {
        const [g1, g2] = [...P.d.cats].sort(() => R() - 0.5), n = pick(P.d.nums), a = synth(ri(80, 400), 100, 15), b = synth(ri(80, 400), 100 + rf(-6, 6), rf(12, 20));
        const se = Math.sqrt(sd(a) ** 2 / a.length + sd(b) ** 2 / b.length), t = (mean(a) - mean(b)) / se, p = pnorm2(t), dd = (mean(a) - mean(b)) / Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / 2);
        return [L(C('b', `→ tool#${++st.call} stats.welch_t`) + C('d', `(${n} | ${P.d.cat}=${g1} vs ${g2})`), 200), L(C('d', '  t = ') + C('c', fx(t, 3)) + C('d', '   p = ') + C('c', fx(p, 4)) + C('d', "   cohen's d = ") + fx(dd, 3) + '   ' + (p < 0.05 ? C('g', 'significant') : C('y', 'not significant')), 220)];
      },
      outlier(st, P) { const n = pick(P.d.nums), out = [L(C('y', '>>> ') + `zscore_outliers(df["${n}"], z=3.0)`, 100)]; for (let i = 0, k = ri(2, 5); i < k; i++) out.push(L(C('d', `  row ${ri(1000, 999999)}  `) + `${n}=${fx(rf(900, 9000), 2)}` + C('r', `  z=${fx(rf(3.1, 7.5), 2)}`))); out.push(L(C('d', `  ${ri(2, 40)} outliers flagged of ${P.rows.toLocaleString()}`), 100)); return out; },
      hist(st, P) { const n = pick(P.d.nums), v = Array.from({ length: 9 }, (_, i) => Math.round(1000 * Math.exp(-((i - rf(2, 5)) ** 2) / rf(2, 8)) + ri(0, 60))), b = bars(v); return [L(C('y', '>>> ') + `hist(df["${n}"], bins=9)`, 100), ...v.map((c, i) => L(C('d', `  bin ${i}  `) + C('c', b[i]) + C('d', ' ' + c), 40))]; },
      plan(st, P) { st.plan = (st.plan + 1) % (P.steps.length + 1); return P.steps.map((s, i) => L(C('d', '  ') + (i < st.plan ? C('g', '[x] ') : i === st.plan ? C('y', '[>] ') : C('d', '[ ] ')) + s, 60)); },
      report(st) { return [L(C('b', `→ tool#${++st.call} fs.write`) + C('d', `("report.md", section ${st.rep++})`) + C('d', `  +${ri(80, 600)} words  ·  ${ri(1, 4)} charts`), 220), L(C('d', '  trend ') + C('c', spark(trend())), 120)]; },
    },
    spin: ['Loading parquet partitions', 'Profiling columns', 'Inferring schema', 'Sampling 1M rows', 'Rendering chart', 'Thinking'],
    bar: () => pick(['Scanning rows', 'Bootstrapping CI (n=2000)', 'Fitting gradient boosting', 'Cross-validating (k=5)']),
    burst: (st, P) => C('d', '[pandas] ') + `chunk ${pad(ri(0, 9999), 4)}  rows 50000  nulls ${ri(0, 40)}  ` + C('d', `${P.d.f}`) + '  ' + C('g', 'ok'),
  };

  /* ── 4. 네트워크 진단 ── */
  const SITES = ['SEL', 'TYO', 'SIN', 'FRA', 'IAD', 'SJC'];
  const hops = () => { const n = ri(7, 12), out = [['gw.lan', '10.0.0.1', 0.6]]; let rtt = 0.6; for (let i = 1; i < n; i++) { rtt += i < 3 ? rf(0.3, 2) : rf(1, 18); const pub = i >= 3; out.push([pub ? pick(['isp-pe', 'ix-rtr', 'core', 'agg', 'edge']) + ri(1, 9) + '.example.net' : pick(['core-sw', 'dist-sw', 'fw']) + '-' + pad(ri(1, 9), 2) + '.lan', pub ? ipD() : ipP(), rtt]); } return out; };
  const s4 = {
    name: '네트워크 진단', first: 'netdiag run --profile full --target api.example.net',
    cmds: ['mtr -rwc 50 api.example.net', 'netdiag bgp --rr all', 'iperf3 -c 10.40.0.20 -t 10', 'netdiag mtu --probe', 'tcpdump -ni eth0 port 443 -c 40', 'netdiag matrix --sites all'],
    init: () => ({ seq: 1 }),
    phase: () => ({ target: pick(['api.example.net', 'edge-01.example.org', 'db-replica.example.com', 'cdn.example.net']), ip: ipD(), path: hops(), lossAt: R() < 0.5 ? ri(3, 7) : -1, mtu: pick([1500, 1492, 1400, 9000]), proto: pick(['ICMP', 'UDP/33434', 'TCP/443']), gbps: pick([1, 10, 25]), speed: rf(0.7, 1.4),
      w: weights(['ping', 'trace', 'mtr', 'dig', 'bgp', 'iperf', 'ifstat', 'tcpdump', 'matrix', 'lldp']), mix: mix() }),
    shift: (st, P, o) => {
      const ev = pick(['reroute', 'loss', 'proto', 'mtu']);
      if (ev === 'reroute') return [banner(`path change: ${o.path.length} -> ${P.path.length} hops (via AS${ri(64512, 65534)})`), L(C('d', `  hop ${ri(3, 6)} now ${P.path[3][0]} (${P.path[3][1]})`), 240)];
      if (ev === 'loss') return [banner(`loss spike on ${P.path[Math.max(0, P.lossAt)][0]} — isolating segment`, 'al'), L(C('d', `  shifting traffic to backup uplink · LAG member ${ri(1, 4)} down`), 260)];
      if (ev === 'proto') return [banner(`probe protocol ${o.proto} -> ${P.proto}`), L(C('d', '  ICMP rate-limited on upstream, using ' + P.proto), 220)];
      return [banner(`MTU black hole suspected: ${o.mtu} -> ${P.mtu}`), L(C('d', `  DF probes ${P.mtu + 28} bytes: frag needed · clamping MSS to ${P.mtu - 40}`), 260)];
    },
    gens: {
      ping(st, P) { const base = P.path[P.path.length - 1][2], t = Array.from({ length: ri(4, 8) }, () => base + Math.abs(gauss()) * rf(0.5, 4)), out = [L(C('w', `PING ${P.target} (${P.ip}) 56(84) bytes of data.`), 120)]; t.forEach((v, i) => out.push(L(`64 bytes from ${P.ip}: icmp_seq=${i + 1} ttl=${ri(50, 60)} time=` + C('c', fx(v, 1)) + ' ms', ri(160, 320)))); const m = mean(t); out.push(L(C('d', `--- ${P.target} ping statistics --- ${t.length} transmitted, ${t.length} received, 0% loss`), 80), L(C('d', 'rtt min/avg/max/mdev = ') + C('g', `${fx(Math.min(...t), 3)}/${fx(m, 3)}/${fx(Math.max(...t), 3)}/${fx(sd(t), 3)}`) + ' ms', 120)); return out; },
      trace(st, P) { const out = [L(C('w', `traceroute to ${P.target} (${P.ip}), 30 hops max, ${P.proto}`), 120)]; P.path.forEach(([n, ip, r], i) => out.push(L(C('d', String(i + 1).padStart(2) + '  ') + (i === P.lossAt && R() < 0.5 ? C('r', '* * *') : `${n} (${ip})  ` + [0, 1, 2].map(() => C('c', fx(r + rf(-0.3, 1.5), 3)) + ' ms').join('  ')), ri(120, 260)))); return out; },
      mtr(st, P) { const w = [28, 6, 5, 7, 7, 7, 6], out = [L(C('w', '  ' + row(['HOST', 'Loss%', 'Snt', 'Avg', 'Best', 'Wrst', 'StDev'], w)), 80)]; P.path.forEach(([n, , r], i) => { const s = Array.from({ length: 20 }, () => r + Math.abs(gauss()) * 1.5), loss = i === P.lossAt ? rf(4, 30) : R() < 0.1 ? rf(0, 2) : 0; const line = '  ' + row([`${i + 1}. ${n}`.slice(0, 28), fx(loss, 1) + '%', 50, fx(mean(s), 1), fx(Math.min(...s), 1), fx(Math.max(...s), 1), fx(sd(s), 1)], w); out.push(L(loss > 3 ? C('r', line) : line, 50)); }); return out; },
      dig(st, P) { return [L(C('w', `; <<>> DiG <<>> ${P.target} A`), 80), L(C('d', ';; ANSWER SECTION:'), 60), ...Array.from({ length: ri(1, 3) }, () => L(`${P.target}.  ${ri(30, 300)}  IN  A  ` + C('c', ipD()), 60)), L(C('d', `;; Query time: ${ri(2, 80)} msec  SERVER: 10.0.0.53#53`), 100)]; },
      bgp() { const out = [L(C('w', '   Network            Next Hop         Metric LocPrf Path'), 80)]; for (let i = 0, n = ri(4, 8); i < n; i++) out.push(L(C('g', R() < 0.8 ? '*> ' : '*  ') + `${ipD().replace(/\.\d+$/, '.0')}/24`.padEnd(19) + ipD().padEnd(17) + String(ri(0, 200)).padStart(6) + String(pick([100, 200, 80])).padStart(7) + C('d', ` ${ri(64512, 65534)} ${ri(64512, 65534)} i`), 50)); return out; },
      iperf(st, P) { const out = [L(C('w', `Connecting to host 10.40.0.20, port 5201 · ${P.gbps}G link`), 120)]; let tot = 0; for (let i = 0; i < 6; i++) { const v = P.gbps * 1000 * rf(0.86, 0.96); tot += v; out.push(L(C('d', `[  5] ${fx(i, 2)}-${fx(i + 1, 2)} sec  `) + `${fx(v / 8, 0)} MBytes  ` + C('c', `${fx(v, 0)} Mbits/sec`) + C('d', `  retr ${R() < 0.8 ? 0 : ri(1, 40)}`), ri(200, 360))); } out.push(L(C('g', `[  5] 0.00-6.00 sec  sender  ${fx(tot / 6, 0)} Mbits/sec`), 120)); return out; },
      ifstat() { const w = [10, 14, 14, 8, 8], out = [L(C('w', '  ' + row(['iface', 'rx_bytes', 'tx_bytes', 'rx_err', 'drops'], w)), 60)]; for (const f of ['eth0', 'eth1', 'bond0', 'vlan120', 'wg0'].slice(0, ri(3, 5))) { const e = R() < 0.15 ? ri(1, 900) : 0; out.push(L('  ' + row([f, ri(1e8, 9e11), ri(1e8, 9e11), e, R() < 0.2 ? ri(1, 99) : 0], w), 50, e ? 'al' : '')); } return out; },
      tcpdump(st, P) { const out = []; for (let i = 0, n = ri(6, 14); i < n; i++) { const f = pick(['[S]', '[S.]', '[.]', '[P.]', '[F.]']); out.push(L(C('d', clock() + ' ') + `IP 10.0.0.${ri(2, 250)}.${ri(32768, 60999)} > ${P.ip}.443: Flags ` + C('c', f) + C('d', `, seq ${ri(1e6, 4e9)}, win ${pick([64240, 65535, 502])}, length ${f === '[P.]' ? ri(40, 1448) : 0}`), ri(20, 70))); } return out; },
      matrix() { const n = SITES.length, out = [L(C('w', '  rtt ms ' + SITES.map((s) => s.padStart(6)).join('')), 80)]; for (let i = 0; i < n; i++) out.push(L('  ' + C('w', SITES[i].padEnd(7)) + SITES.map((_, j) => { if (i === j) return C('d', '     -'); const v = 8 + Math.abs(i - j) * rf(25, 60); return (v < 60 ? C('g', fx(v, 0).padStart(6)) : v < 150 ? C('y', fx(v, 0).padStart(6)) : C('r', fx(v, 0).padStart(6))); }).join(''), 60)); return out; },
      lldp(st, P) { return P.path.slice(0, 3).map(([n, ip]) => L(C('d', 'lldp neighbor  ') + C('w', n.padEnd(18)) + C('d', ` port Gi1/0/${ri(1, 48)}  mgmt ${ip}  cap `) + pick(['Bridge,Router', 'Router', 'Bridge']), 80)); },
    },
    spin: ['Resolving targets', 'Collecting SNMP counters', 'Probing path MTU', 'Querying route reflectors', 'Correlating flow records', 'Waiting for probe replies'],
    bar: () => pick(['Sweeping 10.40.0.0/22 (inventory)', 'Collecting NetFlow', 'Polling 312 interfaces', 'Running path tests']),
    burst: (st, P) => C('d', clock() + ' ') + C('b', 'snmp ') + `${pick(['core-sw', 'dist-sw', 'edge'])}-${pad(ri(1, 9), 2)} ifHCInOctets.${ri(1, 48)} = ${ri(1e9, 9e12)}  ` + C('d', `util ${fx(rf(3, 85), 1)}%`),
  };

  /* ── 5. 네트워크 보안(방어 관제) ── */
  const LEVEL = ['GREEN', 'AMBER', 'RED'];
  const s5 = {
    name: '네트워크 보안', first: 'secops monitor --segments all --live',
    cmds: ['secops ids tail', 'secops fw stats --top 20', 'secops tls audit --inventory', 'secops fim verify /etc /usr/bin', 'secops intel sync', 'secops case list --open'],
    init: () => ({ lv: 0, case: ri(1000, 9000), blocked: 0 }),
    phase: (st) => ({ seg: pick(['DMZ', 'corp-lan', 'prod-vpc', 'guest-wifi', 'ot-network']), rules: ri(380, 520), speed: rf(0.7, 1.4), w: weights(['ids', 'ids', 'fw', 'fw', 'auth', 'tls', 'fim', 'entropy', 'vuln', 'intel', 'rules', 'timeline']), mix: mix() }),
    shift: (st, P) => {
      const ev = pick(['level', 'level', 'quarantine', 'rules', 'case']);
      if (ev === 'level') { const old = st.lv; st.lv = Math.max(0, Math.min(2, st.lv + (R() < 0.6 ? 1 : -1))); return [banner(`threat level ${LEVEL[old]} -> ${LEVEL[st.lv]} (${ri(2, 6)} correlated sensors)`, st.lv > old ? 'al' : 'v'), L(C('d', `  segment ${P.seg} · sampling ${st.lv ? 'full' : '1:64'}`), 240)]; }
      if (ev === 'quarantine') return [banner(`host ${ipP(20)} moved to quarantine VLAN 999`, 'al'), L(C('d', `  reason: beaconing every ${ri(30, 300)}s · EDR isolation requested`), 260)];
      if (ev === 'rules') return [banner(`ruleset updated v${P.rules}`), L(C('d', `  +${ri(20, 400)} rules · -${ri(1, 60)} retired · reload in ${fx(rf(0.5, 2.5), 2)}s`), 240)];
      return [banner(`case #${++st.case} opened · ${pick(['suspicious login pattern', 'data egress anomaly', 'port sweep from external', 'malware hash match'])}`, 'al'), L(C('d', `  owner: soc-tier${ri(1, 2)}  sla ${ri(15, 60)}m`), 220)];
    },
    gens: {
      ids(st, P) { const sig = ['SCAN-SWEEP', 'BRUTE-SSH', 'DNS-TUNNEL', 'TLS-ANOMALY', 'SMB-ENUM', 'HTTP-INJECT']; const out = []; for (let i = 0, n = ri(3, 8); i < n; i++) { const pr = ri(1, 3); out.push(L(C('d', clock() + ' ') + (pr === 1 ? C('r', 'ALERT p1 ') : pr === 2 ? C('y', 'ALERT p2 ') : C('d', 'ALERT p3 ')) + `sig=${pick(sig)} src=${ipD()} dst=${ipP(20)} seg=${P.seg} hits=${ri(1, 900)}`, ri(40, 140), pr === 1 ? 'al' : '')); } return out; },
      fw() { const out = []; for (let i = 0, n = ri(6, 14); i < n; i++) { const drop = R() < 0.55; out.push(L(C('d', clock() + ' ') + (drop ? C('r', 'DROP  ') : C('g', 'ACCEPT')) + ` in=eth0 src=${ipD()} dst=${ipP(20)} proto=${pick(['TCP', 'UDP'])} dpt=${pick([22, 23, 80, 443, 445, 3389, 8080, 53])}`, ri(20, 70))); } return out; },
      auth(st) { const out = []; for (let i = 0, n = ri(2, 5); i < n; i++) { const f = ri(3, 80), ip = ipD(); out.push(f > 20 ? L(C('y', 'auth-guard ') + `${ip} failed=${f} in 60s -> ` + C('r', 'blocked') + C('d', ` (ttl 3600s, total ${++st.blocked})`), 160) : L(C('d', 'auth-guard ') + `${ip} failed=${f} in 60s -> watch`, 100)); } return out; },
      tls() { const w = [24, 6, 8, 24, 6], out = [L(C('w', '  ' + row(['host', 'days', 'proto', 'cipher', 'grade'], w)), 60)]; for (let i = 0, n = ri(3, 6); i < n; i++) { const d = ri(-3, 400), g = d < 14 ? 'C' : pick(['A+', 'A', 'A', 'B']); const line = '  ' + row([pick(['www', 'api', 'vpn', 'mail', 'sso', 'cdn']) + '.example.com', d, pick(['TLS1.3', 'TLS1.2']), pick(['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305', 'ECDHE-RSA-AES128-GCM']), g], w); out.push(L(d < 14 ? C('r', line) : line, 50)); } return out; },
      fim() { const out = []; for (const f of ['/usr/bin/sshd', '/etc/passwd', '/etc/sudoers', '/usr/sbin/nginx', '/etc/ssh/sshd_config', '/usr/lib/libssl.so.3'].slice(0, ri(3, 6))) { const ch = R() < 0.12; out.push(L(C('d', `sha256 ${hex(16)}…  `) + f.padEnd(24) + (ch ? C('y', 'CHANGED') + C('d', ' -> verified: package update') : C('g', 'OK')), 60)); } return out; },
      entropy(st, P) { const ports = Array.from({ length: 400 }, () => (R() < rf(0.2, 0.9) ? pick([443, 80, 53]) : ri(1, 65535))), cnt = {}; ports.forEach((p) => (cnt[p] = (cnt[p] || 0) + 1)); const H = -Object.values(cnt).reduce((s, c) => s + (c / 400) * Math.log2(c / 400), 0), score = Math.min(1, H / 8.6); return [L(C('y', '>>> ') + `flow.port_entropy(segment="${P.seg}", window="5m")`, 100), L(C('d', '  H = ') + C('c', fx(H, 3) + ' bits') + C('d', '  anomaly = ') + (score > 0.7 ? C('r', fx(score, 3)) : C('g', fx(score, 3))) + C('d', `  unique ports ${Object.keys(cnt).length}`), 200)]; },
      vuln() { const out = [L(C('w', 'asset scan (own inventory)   crit  high  med  low'), 80)]; for (let i = 0, n = ri(3, 5); i < n; i++) { const c = R() < 0.2 ? ri(1, 3) : 0; out.push(L('  ' + `${pick(['web', 'db', 'cache', 'build', 'vpn'])}-${pad(ri(1, 30), 2)}`.padEnd(27) + (c ? C('r', String(c).padStart(5)) : String(c).padStart(5)) + String(ri(0, 6)).padStart(6) + String(ri(0, 20)).padStart(5) + String(ri(0, 40)).padStart(5), 50)); } out.push(L(C('d', `  advisories ADV-2026-${ri(1000, 9999)} … patch window tonight 02:00`), 100)); return out; },
      intel() { const ip = ri(200, 1600), dm = ri(80, 600), h = ri(20, 200); return [L(C('b', 'threat-intel sync ') + `+${(ip + dm + h).toLocaleString()} indicators` + C('d', ` (ip ${ip}, domain ${dm}, hash ${h})  feeds ${ri(3, 9)}/9 ok`), 200)]; },
      rules(st, P) { return [L(C('d', 'compiling ') + `ruleset v${P.rules}: ${ri(30000, 45000).toLocaleString()} rules in ${fx(rf(0.8, 3), 2)}s ` + C('g', 'ok'), 200)]; },
      timeline(st) { const t0 = new Date(); return Array.from({ length: ri(3, 5) }, (_, i) => L(C('d', `  case #${st.case}  `) + C('w', `T+${pad(i * ri(1, 9), 2)}m `) + pick(['first alert correlated', 'user contacted', 'credentials rotated', 'IOC added to blocklist', 'endpoint scanned: clean', 'scope confirmed: 1 host']), 90)); },
    },
    spin: ['Correlating events', 'Enriching IOCs', 'Pulling sensor logs', 'Verifying signatures', 'Rebuilding baselines', 'Hashing file inventory'],
    bar: () => pick(['FIM baseline verify', 'Log ingestion', 'TLS inventory scan', 'Replaying pcap for rules']),
    burst: (st, P) => C('d', clock() + ' ') + C('b', 'flow ') + `${ipP(20)}:${ri(1024, 65535)} -> ${ipD()}:${pick([443, 53, 80])}  ${ri(64, 90000)}B  ` + C('d', `seg=${P.seg} lvl=${LEVEL[st.lv]}`),
  };

  return { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5 };
};

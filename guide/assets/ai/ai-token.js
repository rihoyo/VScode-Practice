/* 3장 토큰 계산기
 * vendor/tokenizer-*.js(gpt-tokenizer)는 2MB씩이라 칸을 처음 쓸 때 그 규칙 하나만 불러온다.
 * 한 글자가 여러 토큰에 걸치면(한국어, 이모지) 낱개로 풀면 깨지므로, 온전한 글자가 될 때까지 묶어서 한 조각으로 보여 준다. */
(() => {
  const root = document.getElementById('tok');
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const input = $('#tok-in'), out = $('#tok-out'), msg = $('#tok-msg');
  const FILE = { o200k: 'vendor/tokenizer-o200k.js', cl100k: 'vendor/tokenizer-cl100k.js' };
  const GLOBAL = { o200k: 'GPTTokenizer_o200k_base', cl100k: 'GPTTokenizer_cl100k_base' };
  const EX = {
    ko: '깃허브 저장소를 클론한 뒤 VS Code에서 열고, 바뀐 파일을 커밋해서 푸시한다.',
    en: 'Clone the GitHub repository, open it in VS Code, then commit and push your changes.',
    code: 'function add(a, b) {\n  return a + b; // 두 수를 더한다\n}\nconsole.log(add(2, 3));',
  };
  const MAX = 2000; // 화면에 그리는 조각 수 한도. 숫자 계산은 전부 한다
  const loading = {};
  let enc = 'o200k', view = 'text', timer = 0;

  function load(name) {
    if (window[GLOBAL[name]]) return Promise.resolve(window[GLOBAL[name]]);
    if (!loading[name]) loading[name] = new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = FILE[name];
      s.onload = () => (window[GLOBAL[name]] ? ok(window[GLOBAL[name]]) : fail(new Error('no global')));
      s.onerror = () => { loading[name] = null; fail(new Error('load')); };
      document.head.appendChild(s);
    });
    return loading[name];
  }

  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const show = (t) => esc(t).replace(/ /g, '<i class="sp">·</i>').replace(/\t/g, '<i class="sp">→</i>').replace(/\n/g, '<i class="sp">↵</i><br>');

  // 토큰 번호 배열을 "온전한 글자" 단위 조각으로 묶는다
  function pieces(T, ids) {
    const list = [];
    let buf = [];
    for (const id of ids) {
      buf.push(id);
      const t = T.decode(buf);
      if (!t.includes('�') || buf.length >= 4) { list.push({ t, ids: buf }); buf = []; }
    }
    if (buf.length) list.push({ t: T.decode(buf), ids: buf });
    return list;
  }

  async function run() {
    const text = input.value;
    $('#tok-c').textContent = [...text].length.toLocaleString();
    if (!text) {
      $('#tok-n').textContent = '0'; $('#tok-r').textContent = '-';
      out.innerHTML = ''; msg.textContent = '칸에 글을 넣으면 계산을 시작한다.';
      return;
    }
    let T;
    try {
      if (!window[GLOBAL[enc]]) msg.textContent = '토큰 규칙을 불러오는 중이다(약 2MB, 처음 한 번).';
      T = await load(enc);
    } catch (e) {
      msg.textContent = 'guide/vendor의 토큰 파일을 찾지 못했다. tools 폴더에서 npm run build를 실행한다.';
      return;
    }
    if (input.value !== text) return; // 불러오는 사이 글이 바뀌었으면 새 계산에 맡긴다
    const ids = T.encode(text);
    const chars = [...text].length;
    $('#tok-n').textContent = ids.length.toLocaleString();
    $('#tok-r').textContent = (ids.length / chars).toFixed(2);
    const ps = pieces(T, ids.slice(0, MAX));
    const cut = ids.length > MAX ? `<p class="tok-cut">앞의 ${MAX.toLocaleString()}토큰만 그렸다. 숫자는 전체 기준이다.</p>` : '';
    if (view === 'ids') {
      out.innerHTML = '<code class="tok-ids">' + ids.slice(0, MAX).join(', ') + '</code>' + cut;
    } else {
      out.innerHTML = ps.map((p, i) => `<span class="c${i % 5}" title="토큰 번호 ${p.ids.join(', ')}">${show(p.t)}${p.ids.length > 1 ? `<sup>${p.ids.length}</sup>` : ''}</span>`).join('') + cut;
    }
    msg.textContent = (enc === 'o200k' ? 'GPT-4o 이후' : 'GPT-4·3.5') + ' 규칙으로 셌다. 조각에 마우스를 올리면 토큰 번호가 보인다.';
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(run, 150); };

  const pick = (sel, btn) => root.querySelectorAll(sel).forEach((b) => b.classList.toggle('on', b === btn));
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.enc) { enc = b.dataset.enc; pick('[data-enc]', b); run(); }
    else if (b.dataset.view) { view = b.dataset.view; pick('[data-view]', b); run(); }
    else if (b.dataset.ex) { input.value = EX[b.dataset.ex] || ''; input.focus(); run(); }
  });
  input.addEventListener('input', later);
  input.addEventListener('focus', () => load(enc).catch(() => {}), { once: true });
})();

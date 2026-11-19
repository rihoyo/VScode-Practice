/* 네트워크 페이지: CIDR 서브넷 계산기. 주소/접두사 길이를 넣으면 계산 결과와 32비트 구조를 보여 준다. */
(() => {
  const form = document.querySelector('#calc');
  if (!form) return;
  const input = form.querySelector('#cidr'), err = form.querySelector('#calc-err');
  const bits = form.querySelector('#bits'), res = form.querySelector('#calc-res');
  const ip4 = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

  function parse(text) {
    const m = text.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);
    if (!m) return null;
    const o = m.slice(1, 5).map(Number), n = Number(m[5]);
    if (o.some((x) => x > 255) || n > 32) return null;
    return { ip: ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0, n };
  }

  function run() {
    const p = parse(input.value);
    err.hidden = !!p;
    if (!p) { err.textContent = '형식이 맞지 않는다. 예: 10.0.0.0/24'; bits.replaceChildren(); res.replaceChildren(); return; }
    const { ip, n } = p;
    const mask = n === 0 ? 0 : (0xFFFFFFFF << (32 - n)) >>> 0;
    const net = (ip & mask) >>> 0, bc = (net | ~mask) >>> 0;
    const total = 2 ** (32 - n);
    const hosts = n === 32 ? 1 : n === 31 ? 2 : total - 2;
    const first = n >= 31 ? net : net + 1, last = n >= 31 ? bc : bc - 1;
    const note = n === 32 ? '장비 1대를 가리키는 주소다' : n === 31 ? '두 장비를 직접 잇는 구간에 쓴다' : '네트워크 주소와 브로드캐스트 주소를 뺀 개수다';
    bits.replaceChildren(...[0, 1, 2, 3].map((o) => {
      const g = document.createElement('span');
      g.className = 'oct';
      for (let b = 0; b < 8; b++) {
        const pos = o * 8 + b, c = document.createElement('i');
        c.textContent = (net >>> (31 - pos)) & 1;
        if (pos < n) c.className = 'n';
        g.appendChild(c);
      }
      return g;
    }));
    const rows = [
      ['네트워크 주소', ip4(net)],
      ['서브넷 마스크', ip4(mask)],
      ['브로드캐스트', ip4(bc)],
      ['사용 범위', `${ip4(first)} ~ ${ip4(last)}`],
      ['전체 주소', `2^(32−${n}) = ${total.toLocaleString('ko-KR')}`],
      ['장비에 쓰는 주소', `${hosts.toLocaleString('ko-KR')}개 · ${note}`],
    ];
    res.replaceChildren(...rows.map(([k, v]) => {
      const d = document.createElement('div');
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = k; dd.textContent = v;
      d.append(dt, dd);
      return d;
    }));
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  input.addEventListener('input', run);
  run();
})();

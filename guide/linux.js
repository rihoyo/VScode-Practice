/* 리눅스 페이지: 권한 계산 칸을 누르면 chmod 숫자와 ls -l 문자가 바뀐다 */
(() => {
  const box = document.querySelector('#perm');
  if (!box) return;
  const boxes = [...box.querySelectorAll('input[type=checkbox]')];
  const num = box.querySelector('#perm-num'), str = box.querySelector('#perm-str');
  const val = [4, 2, 1], ch = ['r', 'w', 'x'];
  function update() {
    let n = '', s = '-';
    for (let g = 0; g < 3; g++) {
      let sum = 0;
      ch.forEach((c, i) => {
        const on = boxes[g * 3 + i].checked;
        if (on) sum += val[i];
        s += on ? c : '-';
      });
      n += sum;
    }
    num.textContent = n;
    str.textContent = s;
  }
  boxes.forEach((b) => b.addEventListener('change', update));
  update();
})();

/* 왼쪽 번호 레일: 지금 보는 섹션을 강조한다 */
(() => {
  const links = [...document.querySelectorAll('.mini a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.hash === '#' + e.target.id)); });
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('main .pn').forEach((s) => io.observe(s));
})();

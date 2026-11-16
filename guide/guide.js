const header = document.querySelector('header');

function updateMenu() {
  document.body.classList.toggle('scrolled', header.getBoundingClientRect().bottom <= 0);
}

function revealTarget() {
  const target = document.getElementById(location.hash.slice(1));
  if (target instanceof HTMLDetailsElement && !target.open) {
    target.open = true;
    target.scrollIntoView();
  }
}

// 클릭 파문 효과: 메뉴, 버튼, 접기 제목을 누른 자리에서 퍼져나가
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('header nav a, .quick a, .toc a, .btn, .chip, summary, .step');
  if (!el) return;
  const r = el.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 2;
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  el.appendChild(s);
  setTimeout(() => s.remove(), 650);
});

// 현재 읽는 위치를 오른쪽 목차에 표시
const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    tocLinks.forEach((a) => a.classList.toggle('active', a.hash === '#' + en.target.id));
  });
}, { rootMargin: '-15% 0px -70% 0px' });
tocLinks.forEach((a) => {
  const t = document.getElementById(a.hash.slice(1));
  if (t) spy.observe(t);
});

window.addEventListener('scroll', updateMenu, { passive: true });
window.addEventListener('resize', updateMenu);
window.addEventListener('hashchange', revealTarget);
revealTarget();
updateMenu();

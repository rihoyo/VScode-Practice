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

window.addEventListener('scroll', updateMenu, { passive: true });
window.addEventListener('resize', updateMenu);
window.addEventListener('hashchange', revealTarget);
revealTarget();
updateMenu();

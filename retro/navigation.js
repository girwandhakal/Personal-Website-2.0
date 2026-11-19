const navigation = document.querySelector('.site-nav');
const menu = document.querySelector('.menu-toggle');
if (menu) {
  function closeMenu(restoreFocus = false) {
    menu.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menu.focus();
  }
  menu.hidden = false;
  menu.addEventListener('click', () => {
    menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') === 'false'));
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
}

navigation.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;

  const destination = new URL(link.href);
  const current = new URL(window.location.href);
  const pagePath = (pathname) => pathname.replace(/\/index\.html$/, '/');
  if (destination.origin === current.origin &&
      pagePath(destination.pathname) === pagePath(current.pathname) &&
      destination.search === current.search && !destination.hash) {
    event.preventDefault();
  }
});

const menu = document.querySelector('.mobile-menu');
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});

document.addEventListener('click', event => {
  if (menu?.open && !menu.contains(event.target)) menu.open = false;
});

function handleNavigation(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('.site-nav a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;

  const destination = new URL(link.href);
  const current = new URL(window.location.href);
  const pagePath = (pathname) => pathname.replace(/\/index\.html$/, '/');
  if (destination.origin === current.origin &&
      pagePath(destination.pathname) === pagePath(current.pathname) &&
      destination.search === current.search && !destination.hash) {
    event.preventDefault();
    if (menu?.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  }
}

document.querySelectorAll('.site-nav').forEach(nav => nav.addEventListener('click', handleNavigation));

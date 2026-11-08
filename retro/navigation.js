const navigation = document.querySelector('.site-nav');
if (navigation.scrollWidth > navigation.clientWidth) {
  navigation.querySelector('[aria-current="page"]')?.scrollIntoView({
    block: 'nearest', inline: 'center', behavior: 'instant'
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

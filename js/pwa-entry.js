/* Keep existing installed shortcuts working after the launch page changes. */
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone || new URLSearchParams(location.search).get('source') === 'pwa') {
  location.replace(new URL('dashboard.html', location.href).href);
}

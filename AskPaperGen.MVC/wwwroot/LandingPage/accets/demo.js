
  /* ── Mobile nav toggle ── */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  navToggle.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const icon = navToggle.querySelector('i');
    icon.className = mobileNav.classList.contains('open') ? 'bi bi-x-lg' : 'bi bi-list';
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      navToggle.querySelector('i').className = 'bi bi-list';
    });
  });

  /* ── Navbar shadow on scroll ── */
  const navbar = document.getElementById('apgNavbar');
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 2px 16px rgba(15,23,42,.08)'
      : 'none';
  });

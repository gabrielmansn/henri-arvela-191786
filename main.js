/* =============================================
   HENRI ARVELA – main.js
   ============================================= */

'use strict';

/* =============================================
   NAVIGAATIO – scroll-tila & hamburger
   ============================================= */
(function initNav() {
  const header     = document.querySelector('.site-header');
  const hamburger  = document.querySelector('.hamburger');
  const navLinks   = document.querySelector('#nav-menu');
  const navItems   = navLinks ? navLinks.querySelectorAll('a') : [];

  // Scroll → lisää .scrolled
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger-toggle
  function toggleMenu(force) {
    if (!hamburger || !navLinks) return;
    const isOpen = typeof force === 'boolean' ? force : !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => toggleMenu());
  }

  // Sulje valikko linkkiä klikatessa
  navItems.forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Sulje valikko Esc-näppäimellä
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleMenu(false);
  });

  // Sulje valikko klikkaamalla ulkopuolelta
  document.addEventListener('click', e => {
    if (!header) return;
    if (!header.contains(e.target)) toggleMenu(false);
  });
})();

/* =============================================
   SCROLL-ANIMAATIOT – IntersectionObserver
   ============================================= */
(function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');
  if (!elements.length) return;

  // Reduced motion -tarkistus
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  elements.forEach(el => observer.observe(el));
})();

/* =============================================
   AKTIIVINEN NAVIGAATIOLINKKI – scrollspy
   ============================================= */
(function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${id}`;
          link.setAttribute('aria-current', isActive ? 'true' : 'false');
          link.style.color = isActive
            ? 'var(--clr-gold-light)'
            : '';
        });
      });
    },
    {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    }
  );

  sections.forEach(section => observer.observe(section));
})();

/* =============================================
   YHTEYDENOTTOLOMAKE
   ============================================= */
(function initContactForm() {
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');
  const statusEl   = document.getElementById('form-status');

  if (!form) return;

  const btnText    = submitBtn ? submitBtn.querySelector('.btn-text')    : null;
  const btnLoading = submitBtn ? submitBtn.querySelector('.btn-loading') : null;

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    if (btnText)    btnText.hidden    = isLoading;
    if (btnLoading) btnLoading.hidden = !isLoading;
  }

  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className   = `form-status ${type}`;
    statusEl.hidden      = false;

    // Piilota automaattisesti 6 sekunnin kuluttua onnistumisesta
    if (type === 'success') {
      setTimeout(() => {
        statusEl.hidden = true;
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }, 6000);
    }
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.textContent = '';
    statusEl.className = 'form-status';
  }

  // Kenttäkohtainen validointi
  function validateField(field) {
    field.style.borderColor = '';
    field.style.boxShadow   = '';

    if (field.required && !field.value.trim()) {
      markInvalid(field);
      return false;
    }
    if (field.type === 'email' && field.value.trim()) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(field.value.trim())) {
        markInvalid(field);
        return false;
      }
    }
    markValid(field);
    return true;
  }

  function markInvalid(field) {
    field.style.borderColor = 'rgba(239, 68, 68, 0.7)';
    field.style.boxShadow   = '0 0 0 3px rgba(239, 68, 68, 0.12)';
  }

  function markValid(field) {
    field.style.borderColor = 'rgba(34, 197, 94, 0.5)';
    field.style.boxShadow   = '0 0 0 3px rgba(34, 197, 94, 0.08)';
  }

  // Live-validointi blur-tapahtumassa
  const inputs = form.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      // Nollaa virhetila heti kun käyttäjä alkaa kirjoittaa
      if (input.style.borderColor.includes('239')) {
        input.style.borderColor = '';
        input.style.boxShadow   = '';
      }
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearStatus();

    // Validoi kaikki kentät
    let isValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) isValid = false;
    });

    if (!isValid) {
      showStatus('Tarkista puuttuvat tai virheelliset kentät.', 'error');
      // Vie fokus ensimmäiseen virheelliseen kenttään
      const firstInvalid = form.querySelector('[style*="239"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setLoading(true);

    try {
      const data     = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        showStatus('Viesti lähetetty! Vastaan saman päivän aikana.', 'success');
        form.reset();
        inputs.forEach(input => {
          input.style.borderColor = '';
          input.style.boxShadow   = '';
        });
      } else {
        const json = await response.json().catch(() => ({}));
        const msg  = (json.errors && json.errors[0]?.message)
          ? json.errors[0].message
          : 'Lähetys epäonnistui. Yritä uudelleen tai ota yhteyttä suoraan sähköpostitse.';
        showStatus(msg, 'error');
      }
    } catch {
      showStatus(
        'Yhteysvirhe. Tarkista verkkoyhteys tai lähetä sähköposti suoraan osoitteeseen henriarvela@icloud.com',
        'error'
      );
    } finally {
      setLoading(false);
    }
  });
})();

/* =============================================
   FOOTER – kuluva vuosi
   ============================================= */
(function initFooterYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* =============================================
   SMOOTH SCROLL – ankkurilinkit
   ============================================= */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height'),
        10
      ) || 80;

      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({ top, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
})();

/* =============================================
   HERO-PARALLAX – hienovarainen syvyysvaikutelma
   ============================================= */
(function initParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    const heroH   = document.querySelector('.hero')?.offsetHeight || window.innerHeight;
    if (scrollY > heroH) return;

    const offset = scrollY * 0.25;
    heroBg.style.transform = `translateY(${offset}px)`;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
})();

/* =============================================
   NUMERO-ANIMAATIO – trust-bar lukujen kasvu
   ============================================= */
(function initCountUp() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const trustNumbers = document.querySelectorAll('.trust-number');
  if (!trustNumbers.length) return;

  function animateValue(el, start, end, duration, suffix, prefix) {
    let startTime = null;
    const step = timestamp => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.floor(eased * (end - start) + start);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el   = entry.target;
      const text = el.textContent.trim();

      // Vain numeeriset arvot animoidaan
      const match = text.match(/^(\D*)(\d+)(\D*)$/);
      if (!match) return;

      const prefix = match[1] || '';
      const num    = parseInt(match[2], 10);
      const suffix = match[3] || '';

      animateValue(el, 0, num, 1400, suffix, prefix);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  trustNumbers.forEach(el => observer.observe(el));
})();
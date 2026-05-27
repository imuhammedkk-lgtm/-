/* ============================================================
   ShineXpress v2.0 — script.js
   Features: Preloader · Scroll-Reveal · Price Counters
             Voice Feedback · Web Audio SFX · Navbar
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Preloader ─────────────────────────────────────────── */
  const preloader = document.getElementById('preloader');
  document.body.classList.add('preloader-active');

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (preloader) {
        preloader.classList.add('fade-out');
        document.body.classList.remove('preloader-active');
        // Trigger hero entrance
        document.querySelectorAll('.hero .animate').forEach((el, i) => {
          setTimeout(() => el.classList.add('is-visible'), 200 + i * 160);
        });
      }
    }, 4600);
  });

  /* ── Navbar ────────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ── Smooth Scroll ─────────────────────────────────────── */
  document.querySelectorAll('.nav-links a, a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 76, behavior: 'smooth' });
    });
  });

  /* ── Scroll-Reveal Observer ────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      // stagger children if present
      el.querySelectorAll('.animate').forEach((child, i) => {
        setTimeout(() => child.classList.add('is-visible'), i * 90);
      });
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('section, .animate').forEach(el => {
    revealObserver.observe(el);
  });

  /* ── Price Counter Animation ───────────────────────────── */
  function animateCounter(el, target, duration = 1400) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      el.textContent = '₹' + Math.floor(start).toLocaleString('en-IN');
    }, 16);
  }

  const priceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const counters = entry.target.querySelectorAll('.price-counter');
      counters.forEach(counter => {
        const val = parseInt(counter.dataset.target, 10);
        if (!isNaN(val)) animateCounter(counter, val);
      });
      priceObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.service-card, .stat-item').forEach(el => {
    priceObserver.observe(el);
  });

  /* Stat counters (hero numbers) */
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        let start = 0;
        const step = target / 60;
        const t = setInterval(() => {
          start = Math.min(start + step, target);
          el.textContent = Math.floor(start) + (el.dataset.suffix || '');
          if (start >= target) clearInterval(t);
        }, 16);
      });
      statObserver.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.hero-stats').forEach(el => statObserver.observe(el));

  /* ── Web Audio SFX ─────────────────────────────────────── */
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { /* unsupported */ }
    }
    return audioCtx;
  }

  /**
   * Synthesised "steam spray" burst — white noise shaped with
   * a bandpass filter and an exponential gain envelope.
   */
  function playSteamSFX() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();

    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass to get a "hiss / spray" texture around 1.5kHz
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1500;
    bpf.Q.value = 0.7;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.06);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

    source.connect(bpf);
    bpf.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 0.35);
  }

  /* ── Voice Feedback (Web Speech API) ──────────────────── */
  function createToast() {
    const t = document.createElement('div');
    t.className = 'sx-toast';
    t.innerHTML = '<i class="fas fa-volume-up"></i><span></span>';
    document.body.appendChild(t);
    return t;
  }
  const toast = createToast();
  let toastTimer = null;

  function showToast(msg) {
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function speakService(name) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(`You selected ${name}`);
    utter.rate = 0.95; utter.pitch = 1.05; utter.volume = 0.9;
    // Prefer a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService) || voices[0];
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  }

  /* voices load async in some browsers */
  window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined
    ? (window.speechSynthesis.onvoiceschanged = () => {})
    : null;

  /* ── Book-Now Button Handler ───────────────────────────── */
  window.selectPackage = function(val, label) {
    const pkgSelect = document.getElementById('package');
    if (pkgSelect) pkgSelect.value = val;
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });

    // SFX + voice
    playSteamSFX();
    const displayName = label || val.replace(/\s*\(.*\)/, '');
    showToast(displayName + ' selected');
    speakService(displayName);
  };

  /* ── Booking Form Submission ───────────────────────────── */
  const washForm = document.getElementById('washForm');
  if (washForm) {
    washForm.addEventListener('submit', e => {
      e.preventDefault();
      playSteamSFX();

      const name    = document.getElementById('custName').value;
      const pkg     = document.getElementById('package').value;
      const date    = document.getElementById('date').value;
      const address = document.getElementById('address').value;

      const msg =
        `*ShineXpress Booking* 🚗✨\n\n` +
        `*Package:* ${pkg}\n` +
        `*Customer:* ${name}\n` +
        `*Date:* ${date}\n` +
        `*Address:* ${address}\n\n` +
        `_Sent via ShineXpress Website_`;

      window.open(
        `https://wa.me/918848900790?text=${encodeURIComponent(msg)}`,
        '_blank'
      );
      washForm.reset();
    });
  }

  /* ── Service card Book-Now audio hook ─────────────────── */
  // Attach playSteamSFX to all .btn-primary inside cards via delegation
  document.addEventListener('click', e => {
    const btn = e.target.closest('.service-card .btn, .addon-card .btn');
    if (btn && !btn.hasAttribute('data-sfx-hooked')) {
      // Already handled by selectPackage for service buttons
      // This catches any plain btn inside cards without onclick
      if (!btn.getAttribute('onclick')) playSteamSFX();
    }
  });

});

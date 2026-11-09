/* RexEngine — Landing page interactions */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Simplified platform glyphs (same marks as the dashboard demo) */
  const GLYPH = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"/><circle cx="12" cy="12" r="3.9"/><circle cx="17.1" cy="6.9" r="1.15" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.6 21v-7.6h2.6l.4-3.1h-3V8.4c0-.9.3-1.5 1.5-1.5h1.6V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.9v3.1h2.6V21z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="9.3" width="3.2" height="10.7" rx=".4"/><circle cx="5.6" cy="5.6" r="1.9"/><path d="M9.6 9.3h3.1v1.5c.5-.9 1.7-1.8 3.4-1.8 3.3 0 3.9 2.1 3.9 4.9V20h-3.2v-5.4c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V20H9.6z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3.5h3l-6.6 7.5 7.8 9.5h-6.1l-4.8-6-5.4 6h-3l7.1-8L2.2 3.5h6.2l4.3 5.5zm-1 15.2h1.7L7.6 5.2H5.8z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M9.5 7.5v9l7.5-4.5z" fill="currentColor"/></svg>',
  };
  document.querySelectorAll('[data-glyph]').forEach(el => {
    el.innerHTML = GLYPH[el.dataset.glyph] || '';
    el.setAttribute('aria-hidden', 'true');
  });

  /* Icons */
  const icons = () => window.lucide && window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  if (window.lucide) icons(); else window.addEventListener('load', icons, { once: true });

  /* Mini bar charts */
  document.querySelectorAll('.spark[data-bars]').forEach(el => {
    const vals = el.dataset.bars.split(',').map(Number);
    const max = Math.max(...vals);
    el.innerHTML = vals.map((v, k) => `<i style="height:${Math.max(10, (v / max) * 100)}%;--k:${k};opacity:${0.45 + 0.55 * (k / (vals.length - 1))}"></i>`).join('');
  });

  /* Count-up numbers, timed to each card's intro delay */
  const fmt = n => n.toLocaleString('en-US');
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = Number(el.dataset.count);
    if (reduce) { el.textContent = fmt(target); return; }
    const host = el.closest('[style*="--d"]');
    const delay = host ? parseFloat(getComputedStyle(host).getPropertyValue('--d')) * 1000 : 1000;
    el.textContent = '0';
    setTimeout(() => {
      const dur = 1300, t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay + 150);
  });

  /* Scroll reveal (blur → sharp) */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* Mobile nav */
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  const setNav = open => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setNav(!links.classList.contains('open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setNav(false); });

  /* AI content demo — sample output per platform */
  const SAMPLES = {
    instagram: { f: 'Carousel caption', t: 'Golden hour on the water 🌅\nThis 4-bed Bayview home has floor-to-ceiling glass, an infinity pool and a private dock. Swipe for the view from every room →\n\nDM "BAYVIEW" for a private tour.', h: '#WaterfrontLiving #LuxuryHomes #FloridaRealEstate #DreamHome #JustListed' },
    facebook: { f: 'Listing post', t: 'Just listed: 4821 Bayview Drive. 4 bedrooms, 3.5 baths and 3,120 sq ft of light-filled living, with a private boat dock steps from open water.\n\nOpen house this Saturday, 11 AM to 2 PM. Message us to save your spot.', h: '#JustListed #OpenHouse' },
    linkedin: { f: 'Investor post', t: 'Waterfront inventory in Bayview remains tight. 4821 Bayview Drive offers 3,120 sq ft, deep-water dock access and full home automation: a strong fit for buyers focused on long-term appreciation.\n\nFull spec sheet and floor plan available on request.', h: '#RealEstateInvesting #CommercialRealEstate' },
    x: { f: 'Thread · 1/3', t: 'Just listed in Bayview 🏡 4 bd · 3.5 ba · private dock · infinity pool. $2.45M.\n\nHere\'s what makes it different 🧵', h: '#JustListed #RealEstate' },
    youtube: { f: 'Shorts script · 30s', t: '[0–3s] Drone push-in over the dock: "This is what $2.45M buys on the water."\n[3–15s] Walk-through: great room → kitchen → primary suite.\n[15–30s] Pool at sunset. CTA: "Link in description for a private tour."', h: '#Shorts #HomeTour #LuxuryRealEstate' },
  };
  const tabs = document.querySelectorAll('.ai-tabs button');
  const out = { f: document.getElementById('ai-format'), t: document.getElementById('ai-text'), h: document.getElementById('ai-tags') };
  let typer;
  const show = p => {
    const s = SAMPLES[p];
    tabs.forEach(b => b.setAttribute('aria-selected', String(b.dataset.p === p)));
    out.f.textContent = s.f;
    clearInterval(typer);
    if (reduce) { out.t.textContent = s.t; out.h.textContent = s.h; return; }
    out.t.textContent = ''; out.h.textContent = '';
    out.t.classList.add('typing');
    let i = 0;
    typer = setInterval(() => {
      i += 3;
      out.t.textContent = s.t.slice(0, i);
      if (i >= s.t.length) { clearInterval(typer); out.t.classList.remove('typing'); out.h.textContent = s.h; }
    }, 18);
  };
  tabs.forEach(b => b.addEventListener('click', () => show(b.dataset.p)));
  document.querySelector('.ai-tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const arr = [...tabs], cur = arr.findIndex(b => b.getAttribute('aria-selected') === 'true');
    const next = arr[(cur + (e.key === 'ArrowRight' ? 1 : -1) + arr.length) % arr.length];
    next.focus(); show(next.dataset.p);
  });

  // Start typing when the AI card scrolls into view
  const aiCard = document.querySelector('.mock-ai');
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(([en]) => { if (en.isIntersecting) { show('instagram'); io2.disconnect(); } }, { threshold: 0.4 });
    io2.observe(aiCard);
  } else show('instagram');

  /* Pause SVG orbit motion for reduced-motion users */
  if (reduce) document.querySelectorAll('svg.orbits').forEach(s => s.pauseAnimations && s.pauseAnimations());
})();

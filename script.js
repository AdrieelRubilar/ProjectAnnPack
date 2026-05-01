/* ============================================================
   AniPack — script.js v1.1 (interactividad completa)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     0.  BACKGROUND PARTICLES (Canvas)
     ───────────────────────────────────────────── */
  const particleCanvas = document.getElementById('particle-canvas');
  if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 55;

    function resizeCanvas() {
      particleCanvas.width  = window.innerWidth;
      particleCanvas.height = document.body.scrollHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x  = Math.random() * particleCanvas.width;
        this.y  = Math.random() * particleCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -Math.random() * 0.4 - 0.1;
        this.r  = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.45 + 0.1;
        this.color = ['#ff3d6e','#ffd84d','#6c63ff','#00e5c8','#b794f4','#63b3ed'][Math.floor(Math.random()*6)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.0008;
        if (this.alpha <= 0 || this.y < -10) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function animParticles() {
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animParticles);
    }
    animParticles();
  }


  /* ─────────────────────────────────────────────
     1.  ENVELOPE OPENING SYSTEM
     ───────────────────────────────────────────── */
  const envelopeBtn  = document.getElementById('envelope-btn');
  const envelopeWrap = document.querySelector('.envelope-wrap');
  const spillCards   = document.querySelectorAll('.spill-card');
  const resetBtn     = document.getElementById('envelope-reset');
  let   envelopeOpen = false;

  // Confetti burst tied to envelope area
  function createConfettiBurst(container) {
    const rect = container.getBoundingClientRect();
    const count = 60;
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'confetti-particle';
      const hue = [0, 45, 260, 170, 330, 50][Math.floor(Math.random()*6)];
      c.style.setProperty('--hue', hue);
      c.style.setProperty('--x', (Math.random() - 0.5) * 500 + 'px');
      c.style.setProperty('--y', (Math.random() * -400 - 80) + 'px');
      c.style.setProperty('--r', Math.random() * 1080 + 'deg');
      c.style.setProperty('--d', (Math.random() * 0.4 + 0.6) + 's');
      c.style.left = '50%';
      c.style.top  = '40%';
      container.appendChild(c);
      c.addEventListener('animationend', () => c.remove());
    }
  }

  if (envelopeBtn) {
    envelopeBtn.addEventListener('click', () => {
      if (envelopeOpen) return;
      envelopeOpen = true;

      // Phase 1: Shake
      envelopeWrap.classList.add('env-shake');

      setTimeout(() => {
        // Phase 2: Glow
        envelopeWrap.classList.remove('env-shake');
        envelopeWrap.classList.add('env-glow');

        setTimeout(() => {
          // Phase 3: Open
          envelopeWrap.classList.add('env-opened');
          envelopeWrap.classList.remove('env-glow');

          // Phase 4: Confetti
          createConfettiBurst(envelopeWrap);

          // Phase 5: Reveal cards with stagger
          spillCards.forEach((card, i) => {
            setTimeout(() => {
              card.classList.add('spill-visible');
              // Flip each inner card
              const inner = card.querySelector('.card-flip-inner');
              if (inner) {
                setTimeout(() => inner.classList.add('flipped'), 300);
              }
            }, i * 180 + 200);
          });

          // Show reset button
          if (resetBtn) {
            setTimeout(() => resetBtn.classList.add('show'), spillCards.length * 180 + 800);
          }
        }, 500);
      }, 600);
    });
  }

  // Reset envelope
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      envelopeOpen = false;
      envelopeWrap.classList.remove('env-opened', 'env-shake', 'env-glow');
      spillCards.forEach(card => {
        card.classList.remove('spill-visible');
        const inner = card.querySelector('.card-flip-inner');
        if (inner) inner.classList.remove('flipped');
      });
      resetBtn.classList.remove('show');
    });
  }


  /* ─────────────────────────────────────────────
     2.  3D TILT + HOLOGRAPHIC EFFECT ON CARDS
     ───────────────────────────────────────────── */
  document.querySelectorAll('.img-card').forEach(card => {
    const shine = document.createElement('div');
    shine.className = 'holo-shine';
    card.querySelector('.img-card-top')?.appendChild(shine);

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top)  / rect.height;
      const rotY = (x - 0.5) * 24;
      const rotX = (0.5 - y) * 24;
      card.style.transform = `perspective(600px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(1.05)`;
      shine.style.background = `radial-gradient(circle at ${x*100}% ${y*100}%, rgba(255,255,255,0.28) 0%, transparent 60%)`;
      shine.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
      shine.style.opacity = '0';
      setTimeout(() => card.style.transition = '', 500);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });


  /* ─────────────────────────────────────────────
     3.  SCROLL ANIMATIONS (IntersectionObserver)
     ───────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObs.observe(el));
  }

  // Rarity bars animation
  const rarityFills = document.querySelectorAll('.rarity-fill');
  if (rarityFills.length) {
    rarityFills.forEach(bar => {
      const target = bar.style.width;
      bar.style.width = '0';
      bar.dataset.target = target;
    });
    const barObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          setTimeout(() => { bar.style.width = bar.dataset.target; }, 200);
          barObs.unobserve(bar);
        }
      });
    }, { threshold: 0.5 });
    rarityFills.forEach(bar => barObs.observe(bar));
  }


  /* ─────────────────────────────────────────────
     4.  ANIMATED COUNTERS
     ───────────────────────────────────────────── */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    const suffix = raw.replace(/[\d,.]/g, '');       // e.g. "+"
    const numeric = parseFloat(raw.replace(/[^\d.]/g, ''));
    if (isNaN(numeric)) return;
    const isK = raw.includes('K');
    const target = numeric;
    const duration = 1800;
    const start = performance.now();

    el.classList.add('counter-animating');

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);  // easeOutCubic
      let current = Math.floor(eased * target);
      if (target % 1 !== 0) current = (eased * target).toFixed(1);

      let display = '';
      if (isK) {
        display = current.toLocaleString() + 'K' + suffix;
      } else if (target >= 1000) {
        display = Number(current).toLocaleString() + suffix;
      } else {
        display = current + suffix;
      }
      el.textContent = display;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const statNums = document.querySelectorAll('.stat-num');
  if (statNums.length) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.8 });
    statNums.forEach(el => counterObs.observe(el));
  }


  /* ─────────────────────────────────────────────
     5.  MOBILE HAMBURGER MENU
     ───────────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');
  const navOverlay = document.getElementById('nav-overlay');

  function closeMenu() {
    hamburger?.classList.remove('active');
    navLinks?.classList.remove('open');
    navOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        hamburger.classList.add('active');
        navLinks.classList.add('open');
        navOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  }
  navOverlay?.addEventListener('click', closeMenu);

  // Close menu on link click
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));


  /* ─────────────────────────────────────────────
     6.  SECRET CARD REVEAL
     ───────────────────────────────────────────── */
  const secretCard  = document.querySelector('.secret-card');
  const secretModal = document.getElementById('secret-modal');
  const secretClose = document.getElementById('secret-close');

  if (secretCard) {
    secretCard.style.cursor = 'pointer';
    secretCard.addEventListener('click', () => {
      secretCard.classList.add('secret-revealed');
      // show modal after card animation
      setTimeout(() => {
        secretModal?.classList.add('open');
        // confetti in modal
        const modalBody = secretModal?.querySelector('.modal-body');
        if (modalBody) createConfettiBurst(modalBody);
      }, 700);
    });
  }
  secretClose?.addEventListener('click', () => {
    secretModal?.classList.remove('open');
  });
  secretModal?.addEventListener('click', (e) => {
    if (e.target === secretModal) secretModal.classList.remove('open');
  });


  /* ─────────────────────────────────────────────
     7.  SMOOTH SCROLL for anchor links
     ───────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ─────────────────────────────────────────────
     8.  NAV SCROLL EFFECT
     ───────────────────────────────────────────── */
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav?.classList.add('nav-scrolled');
    } else {
      nav?.classList.remove('nav-scrolled');
    }
  });


  /* ─────────────────────────────────────────────
     9.  FLOATING CARDS PARALLAX (Hero)
     ───────────────────────────────────────────── */
  const floatingCards = document.querySelector('.floating-cards');
  if (floatingCards) {
    document.querySelector('.hero')?.addEventListener('mousemove', e => {
      const rect = floatingCards.getBoundingClientRect();
      const cx = (e.clientX - rect.left - rect.width/2) / rect.width;
      const cy = (e.clientY - rect.top  - rect.height/2) / rect.height;
      floatingCards.querySelectorAll('.fcard').forEach((card, i) => {
        const depth = (i + 1) * 6;
        card.style.transform = `translateY(${Math.sin(Date.now()/1000 + i) * 8}px) rotate(var(--rot,0deg)) translate(${cx*depth}px, ${cy*depth}px)`;
      });
    });
  }

  /* ─────────────────────────────────────────────
     10. GACHA SIMULATOR LOGIC
     ───────────────────────────────────────────── */
  const gachaBtn = document.getElementById('gacha-btn');
  const gachaCard = document.getElementById('gacha-card');
  const gachaInner = document.getElementById('gacha-card-inner');
  const gachaFront = document.getElementById('gacha-card-front');
  const gachaHint = document.getElementById('gacha-hint');
  const gachaImg = document.getElementById('gacha-img');
  const gachaName = document.getElementById('gacha-name');
  const gachaSeries = document.getElementById('gacha-series');
  const gachaBadge = document.getElementById('gacha-badge');
  const gachaCountNum = document.getElementById('gacha-count');
  const gachaHistoryList = document.getElementById('gacha-history-list');

  let pullsCount = 0;
  let isPulling = false;

  const charPool = [
    { name: 'Son Goku SSB', series: 'Dragon Ball Super', img: 'img/goku.png', rarity: 'legendary', label: '★ Legendario', color: '#f6ad55' },
    { name: 'Sailor Moon', series: 'Bishoujo Senshi', img: 'img/sailor moon.png', rarity: 'mythic', label: '⬡ Mítico', color: '#00e5c8' },
    { name: 'Tanjiro K.', series: 'Demon Slayer', img: 'img/tanjiro.png', rarity: 'epic', label: '◆ Épico', color: '#b794f4' },
    { name: 'Naruto U.', series: 'Naruto Shippuden', img: 'img/naruto.png', rarity: 'rare', label: '● Raro', color: '#63b3ed' },
    { name: 'Itachi Uchiha', series: 'Naruto', img: 'img/itachi.png', rarity: 'legendary', label: '★ Legendario', color: '#f6ad55' },
    { name: 'Eren Yeager', series: 'Attack on Titan', img: 'img/eren.png', rarity: 'mythic', label: '⬡ Mítico', color: '#00e5c8' },
    { name: 'Monkey D. Luffy', series: 'One Piece', img: 'img/luffy.png', rarity: 'rare', label: '● Raro', color: '#63b3ed' }
  ];

  if (gachaBtn) {
    gachaBtn.addEventListener('click', () => {
      if (isPulling) return;
      isPulling = true;
      gachaBtn.disabled = true;
      gachaHint.textContent = '¡Invocando!...';

      // 1. Pick a character
      // For the demo, we just pick randomly from the array to guarantee showing the cool images
      const char = charPool[Math.floor(Math.random() * charPool.length)];

      // 2. Reset Card State
      gachaInner.classList.remove('gacha-flipped');
      gachaCard.className = 'gacha-card'; // Removes shake, glow, etc.

      // 3. Start Shake Animation
      setTimeout(() => {
        gachaCard.classList.add('gacha-shaking');
        
        // 4. Glow builds up right before flip
        setTimeout(() => {
          gachaCard.classList.add(`glow-${char.rarity}`);
        }, 400); // 400ms into the shake

        // 5. Flip and Reveal
        setTimeout(() => {
          gachaCard.classList.remove('gacha-shaking');

          // Update card DOM
          gachaFront.className = `gacha-card-front rarity-${char.rarity}`;
          gachaImg.src = char.img;
          gachaName.textContent = char.name;
          gachaSeries.textContent = char.series;
          gachaBadge.textContent = char.label;
          gachaBadge.style.color = char.color;
          gachaBadge.style.backgroundColor = `${char.color}22`; // 22 is hex for ~13% opacity
          gachaBadge.style.border = `1px solid ${char.color}88`;

          gachaInner.classList.add('gacha-flipped');

          // Confetti for Rare and above
          if (['epic', 'legendary', 'mythic'].includes(char.rarity)) {
            const particleContainer = document.getElementById('gacha-particles');
            if (particleContainer) {
              createConfettiBurst(particleContainer);
            }
          }

          // Update History & Counter
          pullsCount++;
          gachaCountNum.textContent = pullsCount;
          addToHistory(char);

          // Finish pull cycle
          setTimeout(() => {
            isPulling = false;
            gachaBtn.disabled = false;
            gachaHint.textContent = 'Toca invocar ↓';
          }, 600);

        }, 700); // Wait for shake to end

      }, 100);
    });
  }

  /**
   * Agrega un personaje al historial de invocaciones.
   * SEGURIDAD: Usa createElement y textContent en lugar de innerHTML
   * para prevenir vulnerabilidades XSS.
   * @param {Object} char - Datos del personaje invocado
   */
  function addToHistory(char) {
    // Remove empty message if it exists
    const emptyMsg = gachaHistoryList.querySelector('.gacha-history-empty');
    if (emptyMsg) emptyMsg.remove();

    // Construir elemento de historial de forma segura (sin innerHTML)
    const item = document.createElement('div');
    item.className = 'gacha-history-item';

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'gacha-history-thumb';
    const thumbImg = document.createElement('img');
    thumbImg.src = char.img;
    thumbImg.alt = char.name;
    thumbImg.addEventListener('error', () => {
      thumbImg.style.display = 'none';
      thumb.style.background = '#333';
    });
    thumb.appendChild(thumbImg);
    item.appendChild(thumb);

    // Meta info
    const meta = document.createElement('div');
    meta.className = 'gacha-history-meta';
    const metaName = document.createElement('strong');
    metaName.textContent = char.name;
    const metaSeries = document.createElement('span');
    metaSeries.textContent = char.series;
    meta.appendChild(metaName);
    meta.appendChild(metaSeries);
    item.appendChild(meta);

    // Rarity badge
    const rarityBadge = document.createElement('div');
    rarityBadge.className = 'gacha-history-rarity';
    rarityBadge.textContent = char.rarity;
    rarityBadge.style.color = char.color;
    rarityBadge.style.backgroundColor = char.color + '22';
    rarityBadge.style.border = '1px solid ' + char.color + '55';
    item.appendChild(rarityBadge);

    gachaHistoryList.prepend(item);

    // Keep only last 10 entries to avoid endless scrolling
    if (gachaHistoryList.children.length > 10) {
      gachaHistoryList.removeChild(gachaHistoryList.lastChild);
    }
  }

});

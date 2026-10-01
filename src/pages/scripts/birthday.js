/* birthday-fx.js — Tela de carregamento de aniversário + corações flutuantes (GSAP)
   Requer GSAP carregado antes. Pode ser incluído no <head>. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

  /* ---------- CSS injetado ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #hearts-bg{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
    #hearts-bg svg{position:absolute;bottom:0;left:0;will-change:transform}
    body > .max-w-4xl{position:relative;z-index:1}
    #bday-loader{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:1.25rem;overflow:hidden;
      background:linear-gradient(135deg,#0d0614 0%,#1c0c24 50%,#0d0614 100%);color:#fce7f3;
      font-family:'Plus Jakarta Sans',sans-serif}
    #bday-loader .balloon{position:absolute;bottom:-90px;width:46px;height:58px;border-radius:50% 50% 48% 48%;opacity:.85}
    #bday-loader .balloon::after{content:'';position:absolute;left:50%;top:100%;width:1px;height:38px;background:rgba(252,231,243,.4)}
    #bday-loader h2{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:700;color:#fecdd3;text-align:center;padding:0 1rem}
    #bday-msg{font-size:.8rem;letter-spacing:.08em;color:rgba(253,164,175,.8);min-height:1.2em}
    #bday-bar{width:min(240px,70vw);height:6px;border-radius:99px;background:rgba(244,63,94,.15);overflow:hidden}
    #bday-bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#fb7185,#f472b6,#fbbf24)}
    body.bday-loading{overflow:hidden}
  `;
  document.head.appendChild(style);

  /* ---------- Loader ---------- */
  const loader = document.createElement('div');
  loader.id = 'bday-loader';
  loader.innerHTML = `
    <svg id="bday-cake" width="140" height="150" viewBox="0 0 140 150" aria-hidden="true">
      <ellipse cx="70" cy="136" rx="62" ry="8" fill="#3b1c3f"/>
      <rect x="20" y="92" width="100" height="40" rx="8" fill="#f43f5e"/>
      <path d="M20 100 q10 12 20 0 t20 0 t20 0 t20 0 t20 0 v-8 h-100z" fill="#fff1f2"/>
      <rect x="34" y="60" width="72" height="34" rx="8" fill="#ec4899"/>
      <path d="M34 68 q9 11 18 0 t18 0 t18 0 t18 0 v-8 h-72z" fill="#fff1f2"/>
      <rect x="66" y="36" width="8" height="26" rx="2" fill="#fde68a"/>
      <g id="bday-flame" style="transform-origin:70px 34px">
        <path d="M70 12 C62 22 62 32 70 34 C78 32 78 22 70 12z" fill="#fbbf24"/>
        <path d="M70 20 C66 26 66 31 70 33 C74 31 74 26 70 20z" fill="#fff7ed"/>
      </g>
    </svg>
    <h2>Preparando sua surpresa...</h2>
    <div id="bday-msg">Acendendo as velinhas 🕯️</div>
    <div id="bday-bar"><i></i></div>
  `;
  (document.body || document.documentElement).appendChild(loader);
  (function lockScroll() {
    if (document.body) document.body.classList.add('bday-loading');
    else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('bday-loading'));
  })();

  const colors = ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24', '#fb7185'];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.left = (6 + i * 12.5) + '%';
    b.style.background = colors[i % colors.length];
    loader.prepend(b);
  }

  const messages = [
    'Acendendo as velinhas 🕯️',
    'Enchendo os balões 🎈',
    'Cortando o bolo 🍰',
    'Juntando os recados de carinho 💌',
    'Quase lá... ❤️'
  ];

  const loaderDone = new Promise((resolve) => {
    const bar = loader.querySelector('#bday-bar i');
    const msg = loader.querySelector('#bday-msg');
    const dur = reduce ? 0.8 : 2.8;

    const tl = gsap.timeline({ onComplete: resolve });
    tl.fromTo('#bday-cake', { y: -40, opacity: 0, scale: .7 },
      { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'bounce.out' }, 0);
    tl.to(bar, { width: '100%', duration: dur, ease: 'power1.inOut' }, 0);
    tl.to({}, {
      duration: dur,
      onUpdate() {
        const i = Math.min(messages.length - 1, Math.floor(this.progress() * messages.length));
        if (msg.textContent !== messages[i]) msg.textContent = messages[i];
      }
    }, 0);

    if (!reduce) {
      gsap.to('#bday-flame', { scaleY: 1.18, scaleX: .9, rotation: 4, duration: .18,
        repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('#bday-cake', { y: -6, duration: .9, repeat: -1, yoyo: true,
        ease: 'sine.inOut', delay: .9 });
      loader.querySelectorAll('.balloon').forEach((b, i) => {
        gsap.to(b, { y: -(window.innerHeight + 200), x: gsap.utils.random(-30, 30),
          duration: gsap.utils.random(3, 5), delay: i * .25, repeat: -1, ease: 'none' });
      });
    }
  });

  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve);
  });
  const failSafe = new Promise((r) => setTimeout(r, 7000));

  Promise.race([Promise.all([loaderDone, pageLoaded]), failSafe]).then(() => {
    gsap.to(loader, {
      opacity: 0, duration: .7, ease: 'power2.inOut',
      onComplete() {
        loader.remove();
        document.body.classList.remove('bday-loading');
        if (window.confetti && !reduce) {
          confetti({ particleCount: 120, spread: 80, origin: { y: .6 },
            colors: ['#f43f5e', '#ec4899', '#fbbf24', '#a855f7'] });
        }
      }
    });
  });

  /* ---------- Corações flutuantes ---------- */
  function initHearts() {
    if (reduce) return;
    const box = document.createElement('div');
    box.id = 'hearts-bg';
    document.body.prepend(box);

    const count = window.innerWidth < 640 ? 16 : 30;
    const ns = 'http://www.w3.org/2000/svg';

    for (let i = 0; i < count; i++) {
      const size = gsap.utils.random(12, 34);
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', HEART_PATH);
      p.setAttribute('fill', gsap.utils.random(['#f43f5e', '#fb7185', '#ec4899', '#f472b6', '#c084fc']));
      svg.appendChild(p);
      box.appendChild(svg);

      const startX = gsap.utils.random(0, window.innerWidth);
      const opacity = gsap.utils.random(.12, .45);
      gsap.set(svg, { x: startX, y: size + 20, opacity: 0, rotation: gsap.utils.random(-25, 25) });

      const dur = gsap.utils.random(9, 18);
      const rise = gsap.timeline({ repeat: -1, delay: gsap.utils.random(0, 12) });
      rise.to(svg, { opacity, duration: 1.2, ease: 'power1.out' })
          .to(svg, { y: -(window.innerHeight + size + 40), duration: dur, ease: 'none' }, 0)
          .to(svg, { opacity: 0, duration: 1.5, ease: 'power1.in' }, dur - 1.5)
          .set(svg, { x: () => gsap.utils.random(0, window.innerWidth) });

      gsap.to(svg, { xPercent: gsap.utils.random(-140, 140), rotation: '+=' + gsap.utils.random(-30, 30),
        duration: gsap.utils.random(2.5, 5), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to(svg, { scale: gsap.utils.random(1.15, 1.4), duration: gsap.utils.random(.7, 1.3),
        repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHearts);
  else initHearts();
})();
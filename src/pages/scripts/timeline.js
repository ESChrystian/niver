/* timeline.js — Presente 3D + linha do tempo em "telas" (estilo Spotify Wrapped), com GSAP.
   Segue o padrão dos outros scripts: injeta o próprio CSS/HTML. Carregue DEPOIS do GSAP.
   Teste sem esperar o dia 03/10: abra a página com  ?teste=1  no final do endereço. */
(function () {
  'use strict';
  if (!window.gsap) { console.warn('timeline.js: GSAP não encontrado'); return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TARGET = new Date(2026, 9, 3, 0, 0, 0).getTime();
  // const TARGET = Date.now() - 1000;
  const PREVIEW = /[?&#](teste|preview)/.test(location.search + location.hash);

  /* ====== CONTEÚDO (edite à vontade) ======
     photo: foto que aparece como polaroid (deixe '' para um slide só de texto)
     pos: parte da foto que fica visível (object-position) | ar: proporção largura/altura da moldura
     note: frase "escrita à mão" embaixo da polaroid
     bg: cor ou gradiente | ink: cor do texto | ac: cor de destaque
     decor: elementos animados de aniversário (balloons, confetti, hearts, stars, candles) */
  const SLIDES = [
    {
      year: '2026', caption: 'Hoje, 03 de outubro', title: 'Hoje o dia é todo seu',
      text: 'Preparei uma viagem pelos nossos momentos juntos. Toque na tela para começar.',
      bg: '#1c0c24', ink: '#fff1f2', ac: '#fb7185', decor: ['candles', 'stars'], photo: ''
    },
    {
      year: '2022', caption: 'Nossa primeira foto', title: 'Tudo começou com uma careta',
      text: 'Um filtro engraçado, dois sorrisos escondidos e nenhuma ideia de que aquela foto era o começo da melhor história da minha vida.',
      bg: '#f43f5e', ink: '#fff1f2', ac: '#fde68a', decor: ['balloons'],
      photo: 'images/Primeirafotojuntos,data2022.jpeg', pos: '50% 62%', ar: 0.75, note: 'a careta mais linda'
    },
    {
      year: '2022', caption: 'Nosso primeiro Natal', title: 'Combinando de vermelho',
      text: 'Sorrisos largos e o primeiro Natal ao seu lado. Desde ali, ficou impossível imaginar qualquer outro sem você.',
      bg: '#6d28d9', ink: '#faf5ff', ac: '#f9a8d4', decor: ['confetti'],
      photo: 'images/PrimeiroNataljuntos2022.jpeg', pos: '50% 35%', ar: 0.9, note: 'primeiro Natal ♥'
    },
    {
      year: '2025', caption: 'Nossas aventuras', title: 'O mundo fica melhor com você',
      text: 'De rosto colado, com uma vista linda atrás de nós. Cada passeio ao seu lado vira uma lembrança que eu guardo com carinho.',
      bg: '#fbbf24', ink: '#2a0a1a', ac: '#be123c', decor: ['stars'],
      photo: 'images/Nossaaventurasjuntos2025.jpeg', pos: '50% 50%', ar: 1.25, note: 'sempre juntos por aí'
    },
    {
      year: '2026', caption: 'O pedido', title: 'O sim mais bonito',
      text: 'Mãos dadas, um anel brilhando e uma sobremesa que ficou na memória. O dia em que prometemos construir a vida juntos.',
      bg: '#134e4a', ink: '#f0fdfa', ac: '#fda4af', decor: ['hearts'],
      photo: 'images/Pedidodecasamento2026.jpeg', pos: '50% 52%', ar: 0.8, note: 'o nosso sim ♥'
    },
    {
      year: '21', caption: 'Vinte e um anos de você', title: 'Feliz aniversário, meu amor',
      text: 'Que venham muitos outros, e que eu esteja ao seu lado em todos. Com todo o meu amor.',
      bg: 'linear-gradient(160deg,#be123c,#f43f5e 55%,#fb923c)', ink: '#ffffff', ac: '#fde68a',
      decor: ['balloons', 'confetti'], photo: '', last: true
    }
  ];

  /* ---------- CSS ---------- */
  const css = document.createElement('style');
  css.textContent = `
  #tl-root,#tl-gift{position:fixed;inset:0;z-index:10000;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;color:#fce7f3;user-select:none;-webkit-tap-highlight-color:transparent}
  #tl-gift{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;background:radial-gradient(ellipse at 50% 55%,#3a1146,#1c0c24 45%,#0d0614)}
  #tl-gift h2{font:italic 700 clamp(1.8rem,6vw,3rem)/1.05 'Playfair Display',serif;color:#fecdd3;text-align:center;padding:0 1.25rem}
  #tl-gift .sub{font-size:.85rem;color:rgba(253,164,175,.9);animation:tlp 1.6s ease-in-out infinite}
  @keyframes tlp{50%{opacity:.35}}
  .tl-wrap{transform:scale(1.25);margin:3rem 0 2.5rem}
  @media(min-width:700px){.tl-wrap{transform:scale(1.7);margin:5rem 0 4rem}}
  .tl-scene{position:relative;perspective:900px;width:150px;height:140px;cursor:pointer;outline-offset:30px}
  .tl-glow{position:absolute;left:50%;top:25%;width:320px;height:320px;margin:-160px;border-radius:50%;background:radial-gradient(circle,rgba(253,230,138,.95),rgba(244,63,94,.35) 45%,transparent 70%);opacity:0;pointer-events:none}
  .tl-shadow{position:absolute;left:0;bottom:-12px;width:150px;height:26px;background:radial-gradient(rgba(0,0,0,.6),transparent 70%)}
  .tl-g{position:absolute;left:0;top:0;width:150px;height:140px}
  .tl-g,.tl-g *{transform-style:preserve-3d}
  .tl-g .f{position:absolute;left:0;top:0;--c:#f43f5e;
    background:linear-gradient(rgba(0,0,0,var(--s,0)),rgba(0,0,0,var(--s,0))),
      linear-gradient(90deg,transparent calc(50% - 13px),#fde68a calc(50% - 13px),#fde68a calc(50% + 13px),transparent calc(50% + 13px)),var(--c)}
  .bx{position:absolute;left:0;top:36px;width:150px;height:104px}
  .bx .f{width:150px;height:104px}
  .bx .a{transform:translateZ(75px)} .bx .b{transform:rotateY(180deg) translateZ(75px);--s:.4}
  .bx .c{transform:rotateY(90deg) translateZ(75px);--s:.2} .bx .d{transform:rotateY(-90deg) translateZ(75px);--s:.3}
  .bx .bt{height:150px;top:-23px;transform:rotateX(-90deg) translateZ(52px);--s:.5}
  .bx .tp{height:150px;top:-23px;transform:rotateX(90deg) translateZ(51px);background:radial-gradient(circle,#fff,#fde68a 35%,#f59e0b)}
  .ld{position:absolute;left:-8px;top:0;width:166px;height:36px}
  .ld .f{width:166px;height:36px;--c:#e11d48}
  .ld .a{transform:translateZ(83px)} .ld .b{transform:rotateY(180deg) translateZ(83px);--s:.4}
  .ld .c{transform:rotateY(90deg) translateZ(83px);--s:.2} .ld .d{transform:rotateY(-90deg) translateZ(83px);--s:.3}
  .ld .lt,.ld .lb{height:166px;top:-65px}
  .ld .lt{transform:rotateX(90deg) translateZ(18px);
    background:linear-gradient(90deg,transparent calc(50% - 13px),#fde68a calc(50% - 13px),#fde68a calc(50% + 13px),transparent calc(50% + 13px)),
      linear-gradient(0deg,transparent calc(50% - 13px),#fde68a calc(50% - 13px),#fde68a calc(50% + 13px),transparent calc(50% + 13px)),#e11d48}
  .ld .lb{transform:rotateX(-90deg) translateZ(18px);--s:.6}
  .bow{position:absolute;left:83px;top:0;width:0;height:0}
  .bow .p{position:absolute;left:0;top:0;width:0;height:0} .bow .p2{transform:rotateY(90deg)}
  .lp{position:absolute;top:-30px;width:46px;height:32px;box-sizing:border-box;border:9px solid #fde68a;border-radius:50%}
  .lp.l1{left:-46px;transform-origin:100% 100%;transform:rotate(-18deg)}
  .lp.l2{left:0;transform-origin:0 100%;transform:rotate(18deg)}
  .kn{position:absolute;left:-9px;top:-12px;width:18px;height:18px;border-radius:50%;background:#f59e0b}
  #tl-root{background:#0d0614;--ink:#fff}
  .tl-slide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.1rem;padding:4.3rem 1.25rem 3.4rem;background:var(--bg);color:var(--ink);overflow:hidden;text-align:center}
  .tl-slide.has-cds{padding-top:12rem}
  .tl-decor{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1}
  .tl-fw{position:relative;z-index:2;flex:0 0 auto}
  .tl-halo{position:absolute;inset:-14%;border-radius:50%;background:radial-gradient(circle,var(--ac),transparent 68%);opacity:.38;filter:blur(18px);z-index:-1}
  .tl-frame{position:relative;margin:0;width:min(80vw,340px,calc(33vh*var(--arn)));background:#fdfaf3;padding:10px 10px 42px;border-radius:3px;box-shadow:0 18px 34px -10px rgba(0,0,0,.65),0 3px 6px rgba(0,0,0,.3)}
  .tl-frame img{display:block;width:100%;object-fit:cover;border-radius:2px;filter:contrast(1.04) saturate(1.08);-webkit-user-drag:none;pointer-events:none}
  .tl-tape{position:absolute;top:-12px;left:50%;width:74px;height:23px;margin-left:-37px;transform:rotate(-3deg);background:rgba(253,230,138,.72);box-shadow:0 1px 2px rgba(0,0,0,.25)}
  .tl-frame figcaption{position:absolute;left:0;right:0;bottom:8px;text-align:center;font:700 1.4rem/1 'Caveat',cursive;color:#4a3238}
  .tl-copy{position:relative;z-index:2;width:100%;max-width:32rem}
  .tl-cap{display:flex;align-items:center;justify-content:center;gap:.6rem;font-size:.9rem;font-weight:600;letter-spacing:.04em;margin-bottom:.35rem}
  .tl-year{font:italic 700 clamp(3rem,14vw,6.5rem)/.9 'Playfair Display',serif;letter-spacing:-.03em;text-shadow:.04em .04em 0 var(--ac)}
  .solo .tl-year{font-size:clamp(6rem,32vw,13rem);line-height:.82}
  .tl-year .d{display:inline-block;padding:.05em .03em .14em}
  .tl-year i{display:inline-block;font-style:inherit}
  .tl-title{font:700 clamp(1.55rem,6.2vw,2.8rem)/1.08 'Playfair Display',serif;margin:.7rem 0 .6rem}
  .solo .tl-title{font-size:clamp(1.9rem,7.2vw,3.3rem);margin:1.1rem 0 .9rem}
  .tl-text{font-size:clamp(.9rem,3.5vw,1.1rem);line-height:1.55;max-width:28rem;margin:0 auto;opacity:.93}
  @media(min-width:800px){
    .tl-slide{flex-direction:row;gap:6vw;padding:5rem 7vw 4rem;text-align:left}
    .tl-slide.rev{flex-direction:row-reverse}
    .tl-slide.solo{flex-direction:column;text-align:center;gap:1rem}
    .tl-slide.has-cds{padding-top:12rem}
    .tl-frame{width:min(34vw,400px,calc(58vh*var(--arn)))}
    .tl-copy{max-width:30rem}
    .tl-cap{justify-content:flex-start}
    .solo .tl-cap{justify-content:center}
    .tl-text{margin:0}
    .solo .tl-text{margin:0 auto}
    .tl-year{font-size:clamp(4rem,8vw,8rem)}
    .tl-title{font-size:clamp(2rem,3.8vw,3.4rem)}
  }
  .tl-cap::before{content:'';width:2rem;height:2px;background:var(--ac)}
  .tl-title .w{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .04em .14em;margin-bottom:-.14em}
  .tl-hint{position:absolute;bottom:1.5rem;left:0;right:0;text-align:center;font-size:.8rem;opacity:.7;z-index:2}
  .tl-cta{margin-top:1.6rem;border:0;border-radius:999px;padding:.95rem 1.7rem;background:var(--ink);color:#be123c;font:600 .95rem 'Plus Jakarta Sans',sans-serif;cursor:pointer}
  .tl-bars{position:absolute;top:max(.9rem,env(safe-area-inset-top));left:1rem;right:1rem;display:flex;gap:4px;z-index:5}
  .tl-bars b{flex:1;height:3px;border-radius:3px;background:color-mix(in srgb,var(--ink) 28%,transparent);overflow:hidden}
  .tl-bars i{display:block;height:100%;background:var(--ink);transform-origin:0 50%;transform:scaleX(0)}
  .tl-x{position:absolute;top:1.7rem;right:.8rem;z-index:6;background:none;border:0;color:var(--ink);font:500 .85rem 'Plus Jakarta Sans',sans-serif;padding:.5rem;cursor:pointer}
  #tl-root button:focus-visible,.tl-scene:focus-visible{outline:2px solid #fde68a}
  .tl-balloon{position:absolute;bottom:-150px;border-radius:50% 50% 48% 48%;opacity:.92;color:var(--ink)}
  .tl-balloon::after{content:'';position:absolute;left:50%;top:100%;width:1px;height:70px;background:currentColor;opacity:.5}
  .tl-cf{position:absolute;top:0;border-radius:2px}
  .tl-sv{position:absolute;bottom:-60px;opacity:.6;line-height:0}
  .tl-cds{position:absolute;left:50%;top:4.2rem;transform:translateX(-50%);display:flex;align-items:flex-end;gap:14px}
  .tl-cd{display:flex;flex-direction:column;align-items:center}
  .tl-c{width:12px;border-radius:3px 3px 0 0;background:repeating-linear-gradient(135deg,#fff 0 6px,var(--ac) 6px 12px)}
  .tl-fl{width:14px;height:22px;margin-bottom:3px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(#fff,#fde68a 40%,#f59e0b);box-shadow:0 0 18px 6px rgba(253,224,71,.45)}
  #tl-replay{position:fixed;right:1rem;bottom:1rem;z-index:60;border:1px solid rgba(244,63,94,.4);background:rgba(28,12,36,.85);backdrop-filter:blur(10px);color:#fecdd3;border-radius:999px;padding:.7rem 1.1rem;font:600 .8rem 'Plus Jakarta Sans',sans-serif;cursor:pointer}`;
  document.head.appendChild(css);

  /* ---------- Utilitários ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const R = gsap.utils.random;
  const H = () => innerHeight;
  const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  const STAR = 'M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z';
  const icon = (d, sz, fill) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}"><path d="${d}" fill="${fill}"/></svg>`;
  const fire = (o) => window.confetti && !reduce && confetti(Object.assign({ zIndex: 10002, colors: ['#f43f5e', '#ec4899', '#fbbf24', '#a855f7'] }, o));

  /* ---------- Decoração de aniversário (cada tipo tem sua animação) ---------- */
  const DECOR = {
    balloons(b, s) {
      const cols = [s.ac, s.ink, '#fbbf24', '#a855f7', '#fb7185'];
      for (let i = 0; i < 9; i++) {
        const e = document.createElement('div'), w = R(40, 62);
        e.className = 'tl-balloon';
        Object.assign(e.style, { left: R(2, 90) + '%', width: w + 'px', height: w * 1.25 + 'px', background: cols[i % 5] });
        b.appendChild(e);
        gsap.to(e, { y: -(H() + 300), duration: R(6, 10), delay: i * .3, repeat: -1, ease: 'none' });
        gsap.to(e, { x: R(-30, 30), duration: R(1.5, 2.5), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
    },
    confetti(b, s) {
      const cols = [s.ac, s.ink, '#fbbf24', '#fff', '#f472b6'];
      for (let i = 0; i < 36; i++) {
        const e = document.createElement('i'), r0 = R(0, 360);
        e.className = 'tl-cf';
        Object.assign(e.style, { left: R(0, 100) + '%', background: cols[i % 5], width: R(6, 10) + 'px', height: R(10, 18) + 'px' });
        b.appendChild(e);
        gsap.fromTo(e, { y: -30, rotation: r0 }, { y: H() + 40, rotation: r0 + R(360, 900), duration: R(3, 6), delay: R(0, 3.5), repeat: -1, ease: 'none' });
        gsap.to(e, { x: R(-60, 60), duration: R(1, 2), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
    },
    hearts(b, s) {
      for (let i = 0; i < 14; i++) {
        const e = document.createElement('div');
        e.className = 'tl-sv';
        e.style.left = R(0, 92) + '%';
        e.innerHTML = icon(HEART, R(18, 46), i % 2 ? s.ac : s.ink);
        b.appendChild(e);
        gsap.to(e, { y: -(H() + 120), duration: R(6, 11), delay: R(0, 5), repeat: -1, ease: 'none' });
        gsap.to(e, { x: R(-35, 35), duration: R(1.5, 3), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
    },
    stars(b, s) {
      for (let i = 0; i < 14; i++) {
        const e = document.createElement('div');
        e.className = 'tl-sv';
        Object.assign(e.style, { left: R(0, 92) + '%', top: R(4, 55) + '%', bottom: 'auto', opacity: .8 });
        e.innerHTML = icon(STAR, R(14, 34), i % 2 ? s.ac : s.ink);
        b.appendChild(e);
        gsap.fromTo(e, { scale: 0, rotation: 0 }, { scale: 1, rotation: 90, duration: R(1, 2), delay: R(0, 2), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
    },
    candles(b) {
      const w = document.createElement('div');
      w.className = 'tl-cds';
      w.innerHTML = [0, 1, 2, 3, 4].map((i) => `<div class="tl-cd"><div class="tl-fl"></div><div class="tl-c" style="height:${50 + ((i * 37) % 5) * 12}px"></div></div>`).join('');
      b.appendChild(w);
      gsap.from('.tl-c', { scaleY: 0, transformOrigin: '50% 100%', duration: .8, stagger: .12, delay: .6, ease: 'back.out(1.5)' });
      gsap.from('.tl-fl', { opacity: 0, y: 12, duration: .4, stagger: .12, delay: 1.3 });
      gsap.to('.tl-fl', { scaleY: 1.2, scaleX: .88, rotation: 3, duration: .18, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: .05 });
    }
  };

  /* Entradas diferentes para o ano gigante (uma por tela) */
  const YEAR_IN = [
    { yPercent: 120, rotation: 8, ease: 'back.out(1.7)', stagger: .1 },
    { y: -320, opacity: 0, ease: 'bounce.out', stagger: .12, duration: 1.1 },
    { scale: 3, opacity: 0, ease: 'expo.out', stagger: .08 },
    { rotationX: -110, transformOrigin: '50% 100%', opacity: 0, ease: 'back.out(1.4)', stagger: .1 },
    { x: () => R(-220, 220), rotation: () => R(-40, 40), opacity: 0, ease: 'power4.out', stagger: .06 }
  ];

  /* ---------- Linha do tempo ---------- */
  let root = null, idx = -1, curCtx = null, startedAt = 0;

  function buildSlide(i) {
    const s = SLIDES[i], el = document.createElement('section'), has = !!s.photo;
    el.className = 'tl-slide' + (has ? (i % 2 ? ' rev' : '') : ' solo') + (s.decor.includes('candles') ? ' has-cds' : '');
    el.style.cssText = `--bg:${s.bg};--ink:${s.ink};--ac:${s.ac};background:${s.bg}`;
    const digits = [...s.year].map((c) => `<span class="d"${i % 5 === 0 ? ' style="overflow:hidden"' : ''}><i>${c === ' ' ? '&nbsp;' : c}</i></span>`).join('');
    const words = s.title.split(' ').map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
    const ar = s.ar || 0.75;
    const frame = has ? `
      <div class="tl-fw">
        <div class="tl-halo"></div>
        <figure class="tl-frame" style="--arn:${ar}">
          <span class="tl-tape"></span>
          <img src="${encodeURI(s.photo)}" alt="${s.caption}" draggable="false" style="aspect-ratio:${ar};object-position:${s.pos || 'center'}">
          <figcaption>${s.note || ''}</figcaption>
        </figure>
      </div>` : '';
    el.innerHTML = `
      <div class="tl-decor"></div>
      ${frame}
      <div class="tl-copy">
        <p class="tl-cap">${s.caption}</p>
        <div class="tl-year" aria-label="${s.year}">${digits}</div>
        <h2 class="tl-title">${words}</h2>
        <p class="tl-text">${s.text}</p>
        ${s.last ? '<button class="tl-cta" type="button">Ver recados e fotos</button>' : ''}
      </div>
      ${s.last ? '' : '<div class="tl-hint">toque para continuar</div>'}`;
    return el;
  }

  /* Entrada animada da polaroid (uma por foto) + inclinação final de cada uma */
  const TILT = [-4, 3, -3, 4];
  const FRAME_IN = [
    () => ({ y: -H() * .7, rotation: -28, scale: .7, opacity: 0, ease: 'bounce.out', duration: 1.3 }),
    () => ({ x: 170, rotation: 28, scale: .8, opacity: 0, ease: 'back.out(1.6)', duration: 1.1 }),
    () => ({ scale: 0, rotation: -60, opacity: 0, ease: 'elastic.out(1,.6)', duration: 1.4 }),
    () => ({ rotationY: 90, transformPerspective: 800, y: 60, opacity: 0, ease: 'power3.out', duration: 1.1 })
  ];

  function enter(el, s, i, delay) {
    return gsap.context(() => {
      const tl = gsap.timeline({ delay, defaults: { ease: 'power4.out' } });
      if (reduce) tl.timeScale(20);
      const frame = el.querySelector('.tl-frame');
      if (frame) {
        const k = (i - 1) % FRAME_IN.length, r = TILT[k % TILT.length];
        const { ease, duration, ...from } = FRAME_IN[k]();
        tl.fromTo(frame, from, { x: 0, y: 0, scale: 1, opacity: 1, rotation: r, rotationY: 0, ease, duration }, 0)
          .from('.tl-halo', { opacity: 0, scale: .6, duration: 1.2 }, .2)
          .from('.tl-tape', { scaleX: 0, duration: .5, ease: 'back.out(2)' }, .9)
          .from('.tl-frame figcaption', { opacity: 0, y: 8, duration: .6 }, 1.1);
        if (!reduce) {
          gsap.to('.tl-fw', { y: -9, duration: 2.6, delay: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
          gsap.to('.tl-halo', { scale: 1.12, opacity: .55, duration: 2.2, delay: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
      }
      tl.from('.tl-cap', { x: -24, opacity: 0, duration: .6 }, .35)
        .from('.tl-year i', Object.assign({ duration: 1 }, YEAR_IN[i % YEAR_IN.length]), .45)
        .from('.tl-title .w > span', { yPercent: 120, duration: .9, stagger: .07 }, .9)
        .from('.tl-text', { opacity: 0, y: 16, filter: 'blur(8px)', duration: .9 }, 1.3);
      if (el.querySelector('.tl-cta')) tl.from('.tl-cta', { opacity: 0, scale: .8, duration: .7, ease: 'back.out(2)' }, 1.7);
      if (el.querySelector('.tl-hint')) tl.from('.tl-hint', { opacity: 0, duration: .6 }, 2);
      if (!reduce) {
        const box = el.querySelector('.tl-decor');
        s.decor.forEach((k) => DECOR[k](box, s));
        if (s.last) gsap.delayedCall(.9, () => fire({ particleCount: 140, spread: 100, origin: { y: .7 } }));
      }
    }, el);
  }

  function updateBars() {
    root.querySelectorAll('.tl-bars i').forEach((b, k) => {
      if (k < idx) gsap.set(b, { scaleX: 1 });
      else if (k === idx) gsap.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: .6, ease: 'power2.out' });
      else gsap.set(b, { scaleX: 0 });
    });
  }

  function go(n, origin, done) {
    if (n < 0 || n >= SLIDES.length) return;
    const old = $('.tl-slide', root), oldCtx = curCtx, prev = idx;
    idx = n; startedAt = Date.now();
    const el = buildSlide(n);
    root.appendChild(el);
    root.style.setProperty('--ink', SLIDES[n].ink);
    updateBars();
    const at = origin || (n >= prev ? '50% 100%' : '50% 0%');
    gsap.fromTo(el, { clipPath: `circle(0% at ${at})` }, {
      clipPath: `circle(150% at ${at})`, duration: reduce ? .01 : .9, ease: 'power3.inOut',
      onComplete() {
        el.style.clipPath = 'none';
        if (oldCtx) oldCtx.revert();
        if (old) old.remove();
        if (done) done();
      }
    });
    curCtx = enter(el, SLIDES[n], n, .4);
  }

  function openStory(origin, done) {
    root = document.createElement('div');
    root.id = 'tl-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Nossa linha do tempo');
    root.innerHTML = `<div class="tl-bars">${SLIDES.map(() => '<b><i></i></b>').join('')}</div><button class="tl-x" type="button">Pular</button>`;
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    idx = -1;
    const rep = $('#tl-replay'); if (rep) rep.remove();

    root.addEventListener('click', (e) => {
      if (e.target.closest('.tl-x')) return closeStory(false);
      if (e.target.closest('.tl-cta')) return closeStory(true);
      if (Date.now() - startedAt < 650) return;
      const at = `${e.clientX}px ${e.clientY}px`;
      if (e.clientX / innerWidth < .3) go(idx - 1, at);
      else go(idx + 1, at);
    });
    go(0, origin || '50% 50%', done);
  }

  function closeStory(celebrate) {
    if (!root) return;
    const r = root; root = null;
    if (celebrate) fire({ particleCount: 160, spread: 110, origin: { y: .6 } });
    gsap.to(r, {
      opacity: 0, duration: .6, onComplete() {
        if (curCtx) curCtx.revert();
        r.remove();
        document.body.style.overflow = '';
        showReplay();
      }
    });
  }

  function showReplay() {
    if ($('#tl-replay')) return;
    const b = document.createElement('button');
    b.id = 'tl-replay'; b.type = 'button'; b.textContent = '🎁 Rever nossa história';
    b.onclick = () => openStory('50% 100%');
    document.body.appendChild(b);
    gsap.from(b, { y: 30, opacity: 0, duration: .6, ease: 'back.out(2)' });
  }

  document.addEventListener('keydown', (e) => {
    if (!root) return;
    if (e.key === 'Escape') closeStory(false);
    else if (e.target.tagName === 'BUTTON') return;
    else if (['ArrowRight', ' ', 'Enter'].includes(e.key) && Date.now() - startedAt > 650) { e.preventDefault(); go(idx + 1); }
    else if (e.key === 'ArrowLeft' && Date.now() - startedAt > 650) go(idx - 1);
  });

  /* ---------- Presente 3D ---------- */
  function showGift() {
    if ($('#tl-gift') || root) return;
    document.body.style.overflow = 'hidden';
    const g = document.createElement('div');
    g.id = 'tl-gift';
    g.innerHTML = `
      <h2>Seu presente chegou</h2>
      <div class="tl-wrap"><div class="tl-scene" role="button" tabindex="0" aria-label="Abrir o presente">
        <div class="tl-glow"></div><div class="tl-shadow"></div>
        <div class="tl-g">
          <div class="bx"><div class="f a"></div><div class="f b"></div><div class="f c"></div><div class="f d"></div><div class="f bt"></div><div class="f tp"></div></div>
          <div class="ld"><div class="f a"></div><div class="f b"></div><div class="f c"></div><div class="f d"></div><div class="f lt"></div><div class="f lb"></div>
            <div class="bow"><div class="p"><div class="lp l1"></div><div class="lp l2"></div><div class="kn"></div></div><div class="p p2"><div class="lp l1"></div><div class="lp l2"></div></div></div>
          </div>
        </div>
      </div></div>
      <p class="sub">Toque no presente para abrir</p>`;
    document.body.appendChild(g);

    const gift = $('.tl-g', g), lid = $('.ld', g), glow = $('.tl-glow', g), scene = $('.tl-scene', g), sub = $('.sub', g);
    gsap.set(gift, { rotationX: -24, rotationY: -35 });
    gsap.from('#tl-gift h2', { y: 30, opacity: 0, duration: 1, ease: 'power3.out' });
    gsap.from('.tl-wrap', { y: 80, opacity: 0, duration: 1.1, ease: 'bounce.out', delay: .2 });
    gsap.from(sub, { opacity: 0, duration: .8, delay: 1 });
    const idle = reduce ? null : gsap.to(gift, { rotationY: 35, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    const float = reduce ? null : gsap.to(gift, { y: -10, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      if (idle) idle.kill();
      if (float) float.kill();
      const tl = gsap.timeline();
      if (reduce) tl.timeScale(10);
      tl.to([sub, '#tl-gift h2'], { opacity: 0, duration: .4 }, 0)
        .to(gift, { rotationY: 0, rotationX: -16, y: -45, duration: .7, ease: 'power3.out' }, 0)           // sobe
        .to(gift, { rotationZ: 3, duration: .06, repeat: 7, yoyo: true, ease: 'none' })                      // treme
        .to(gift, { rotationZ: 0, duration: .1 })
        .to(lid, { y: -200, x: 90, rotationZ: 30, rotationX: 18, duration: .9, ease: 'back.out(1.3)' })      // abre
        .to(glow, { opacity: 1, scale: 1.5, duration: .8, ease: 'power2.out' }, '<')
        .call(() => fire({ particleCount: 150, spread: 100, origin: { x: .5, y: .5 } }), null, '<.15')
        .to(gift, { scale: 1.12, duration: .5, ease: 'power2.out' }, '<')
        .call(() => openStory('50% 50%', () => g.remove()), null, '+=.7');
    };
    scene.addEventListener('click', open);
    scene.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  }

  /* ---------- Gatilho: quando o contador zera ---------- */
  function afterLoader(cb) {
    const t = setInterval(() => { if (!$('#bday-loader')) { clearInterval(t); cb(); } }, 250);
  }
  function arm() {
    if (PREVIEW || Date.now() >= TARGET) return afterLoader(() => setTimeout(showGift, 800));
    const t = setInterval(() => {
      if (Date.now() >= TARGET) { clearInterval(t); setTimeout(showGift, 2500); }   // deixa o banner e o confete do contador aparecerem antes
    }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
})();
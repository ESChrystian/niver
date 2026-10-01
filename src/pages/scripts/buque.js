/* bouquet-3d.js — Seção final com o buquê de rosas 3D de um lado e um texto do outro.
   Inserida antes do rodapé. O buquê reage ao scroll. Carrega o Three.js sozinho (cdnjs r128). */
(function () {
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (x) => 1 - Math.pow(1 - x, 3);

  /* ====== TEXTO DA SEÇÃO (edite à vontade) ====== */
  const TEXT = {
    badge: 'Para você',
    title: 'Um buquê que nunca murcha',
    paragraphs: [
      'Cada rosa deste buquê guarda um motivo para eu agradecer por ter você na minha vida: o seu sorriso, o seu abraço, o seu jeito de deixar tudo mais leve.',
      'Flores murcham, mas o que sentimos um pelo outro só cresce a cada dia. Que este novo ano venha cheio de cor, perfume e de muitos momentos ao seu lado.'
    ],
    signature: '— Com todo o meu amor ❤️'
  };

  function loadThree(cb) {
    if (window.THREE) return cb();
    const s = document.createElement('script');
    s.src = THREE_URL;
    s.onload = cb;
    s.onerror = () => console.warn('Não foi possível carregar o Three.js');
    document.head.appendChild(s);
  }
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function init() {
    /* ---------- Seção: buquê à esquerda, texto à direita ---------- */
    const style = document.createElement('style');
    style.textContent = `
      #bouquet-wrap{height:clamp(320px,55vh,500px);width:100%;touch-action:pan-y}
      #bouquet-wrap canvas{display:block;width:100%;height:100%}`;
    document.head.appendChild(style);

    const footer = document.querySelector('footer');
    const host = footer ? footer.parentElement : document.body;
    const section = document.createElement('section');
    section.id = 'bouquet-section';
    section.className = 'glass-card rounded-3xl p-5 sm:p-8 md:p-10 overflow-hidden shadow-2xl grid md:grid-cols-2 gap-6 md:gap-10 items-center';
    section.innerHTML = `
      <div id="bouquet-wrap" aria-hidden="true"></div>
      <div class="space-y-4 text-center md:text-left">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wider uppercase">
          <i class="fas fa-heart text-rose-400"></i> ${TEXT.badge}
        </div>
        <h3 class="font-playfair text-2xl sm:text-4xl font-bold text-rose-200">${TEXT.title}</h3>
        ${TEXT.paragraphs.map((p) => `<p class="font-playfair italic text-rose-100 text-sm sm:text-lg leading-relaxed">${p}</p>`).join('')}
        <div class="text-rose-300 text-sm font-medium font-playfair md:text-right">${TEXT.signature}</div>
      </div>`;
    host.insertBefore(section, footer || null);
    const wrap = section.querySelector('#bouquet-wrap');

    /* ---------- Renderer / cena ---------- */
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { wrap.style.display = 'none'; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.6, 11);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffe4ec, 0x3b1c3f, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 5, 4); scene.add(key);
    const pink = new THREE.PointLight(0xf472b6, 0.9, 30); pink.position.set(-4, 2, 3); scene.add(pink);
    const rim = new THREE.DirectionalLight(0xc084fc, 0.5); rim.position.set(-3, 2, -5); scene.add(rim);

    /* ---------- Rosa ---------- */
    const petalGeo = new THREE.SphereGeometry(1, 12, 8, Math.PI / 2 - 0.7, 1.4, 0, 1.3);
    petalGeo.rotateZ(Math.PI);
    petalGeo.translate(0, 1, 0);

    // [pétalas, escala, inclinação, raio]
    const LAYERS = [[4, .34, .06, .03], [5, .46, .18, .06], [5, .60, .38, .11], [6, .74, .62, .17], [6, .88, .90, .25]];
    const REDS = ['#7f1230', '#9f1239', '#be123c', '#e11d48', '#f43f5e'];
    const PINKS = ['#9d174d', '#be185d', '#db2777', '#ec4899', '#f9a8d4'];
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: .6, side: THREE.DoubleSide });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: .7 });

    function makeRose(palette) {
      const g = new THREE.Group();
      LAYERS.forEach(([n, s, tilt, r], i) => {
        const mat = new THREE.MeshStandardMaterial({ color: palette[i], roughness: .5, side: THREE.DoubleSide });
        for (let j = 0; j < n; j++) {
          const pivot = new THREE.Group();
          pivot.rotation.y = (j * Math.PI * 2) / n + i * 0.9;
          const m = new THREE.Mesh(petalGeo, mat);
          m.scale.setScalar(s);
          m.position.z = r;
          m.rotation.x = tilt;
          pivot.add(m);
          g.add(pivot);
        }
      });
      const bud = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 10),
        new THREE.MeshStandardMaterial({ color: palette[0], roughness: .5 }));
      bud.scale.y = 1.4; bud.position.y = .12; g.add(bud);
      const calyx = new THREE.Mesh(new THREE.ConeGeometry(.2, .22, 8), leafMat);
      calyx.rotation.x = Math.PI; calyx.position.y = -.02; g.add(calyx);
      return g;
    }

    /* ---------- Buquê ---------- */
    const pose = new THREE.Group();     // leve inclinação + entrada
    scene.add(pose);
    const bouquet = new THREE.Group();  // gira no próprio eixo com o scroll
    pose.add(bouquet);

    const P0 = new THREE.Vector3(0, -2.1, 0);
    const UP = new THREE.Vector3(0, 1, 0);
    const dirOf = (tilt, az) => new THREE.Vector3(Math.sin(tilt) * Math.cos(az), Math.cos(tilt), Math.sin(tilt) * Math.sin(az));

    const stemGeo = new THREE.CylinderGeometry(.045, .055, 1, 6);
    stemGeo.translate(0, .5, 0);
    const roses = [];
    const ROSE_SCALE = 0.68;

    const specs = [{ tilt: 0, az: 0, dist: 3.5, pal: REDS }];
    for (let k = 0; k < 6; k++) {
      specs.push({ tilt: .5, az: (k * Math.PI) / 3, dist: 3.35 + (k % 2) * .15, pal: k % 2 ? PINKS : REDS });
    }
    specs.forEach((sp, idx) => {
      const dir = dirOf(sp.tilt, sp.az);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.copy(P0);
      stem.quaternion.setFromUnitVectors(UP, dir);
      stem.scale.y = sp.dist;
      bouquet.add(stem);

      const holder = new THREE.Group();
      holder.position.copy(P0).addScaledVector(dir, sp.dist);
      holder.quaternion.setFromUnitVectors(UP, dir);
      const model = makeRose(sp.pal);
      holder.add(model);
      holder.userData = { model, idx };
      holder.scale.setScalar(ROSE_SCALE * 0.15);
      bouquet.add(holder);
      roses.push(holder);
    });

    const leafGeo = new THREE.SphereGeometry(1, 12, 8);
    leafGeo.translate(0, 1, 0);
    for (let k = 0; k < 8; k++) {
      const az = (k * Math.PI) / 4 + .2;
      const dir = dirOf(.8 + (k % 2) * .25, az);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(az) * 1.4, P0.y + 2.25, Math.sin(az) * 1.4);
      leaf.quaternion.setFromUnitVectors(UP, dir);
      leaf.scale.set(.34, .75 - (k % 2) * .12, .05);
      bouquet.add(leaf);
    }

    const fillMat = new THREE.MeshStandardMaterial({ color: 0xfff1f2, emissive: 0xfbcfe8, emissiveIntensity: .35, roughness: .6 });
    const fillGeo = new THREE.SphereGeometry(.07, 8, 6);
    for (let k = 0; k < 26; k++) {
      const dir = dirOf(.25 + Math.random() * .65, Math.random() * Math.PI * 2);
      const m = new THREE.Mesh(fillGeo, fillMat);
      m.position.copy(P0).addScaledVector(dir, 2.7 + Math.random() * .7);
      bouquet.add(m);
    }

    const coneGeo = new THREE.ConeGeometry(1.7, 2.3, 28, 1, true);
    coneGeo.rotateX(Math.PI);
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ color: 0xfecdd3, roughness: .75, side: THREE.DoubleSide }));
    cone.position.set(0, P0.y + 1.15, 0);
    bouquet.add(cone);

    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: .35, metalness: .4 });
    const ribbonGeo = new THREE.TorusGeometry(.71, .06, 8, 36);
    ribbonGeo.rotateX(Math.PI / 2);
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.y = P0.y + .95;
    bouquet.add(ribbon);
    const loopGeo = new THREE.SphereGeometry(1, 12, 8);
    [-1, 1].forEach((sgn) => {
      const loop = new THREE.Mesh(loopGeo, ribbonMat);
      loop.scale.set(.24, .13, .05);
      loop.position.set(sgn * .2, P0.y + .95, .74);
      loop.rotation.z = sgn * -.5;
      bouquet.add(loop);
    });
    const knot = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), ribbonMat);
    knot.position.set(0, P0.y + .95, .75);
    bouquet.add(knot);

    /* ---------- Tamanho ---------- */
    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = camera.aspect < 1 ? 11 / Math.max(camera.aspect, .55) * .9 : 11;
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(wrap);
    resize();

    /* ---------- Loop: só roda com a seção visível ---------- */
    let visible = false, raf = 0, bloom = 0, sY = window.scrollY;

    function tick(t) {
      raf = 0;
      if (!visible) return;
      const rect = section.getBoundingClientRect();
      const target = clamp((window.innerHeight - rect.top) / (rect.height * 0.9), 0, 1);
      bloom += (target - bloom) * 0.08;
      sY += (window.scrollY - sY) * 0.08;
      const e = ease(bloom);

      // sobe e cresce ao entrar; gira e balança com o scroll
      pose.position.y = -(1 - e) * 1.4;
      pose.scale.setScalar(0.65 + 0.35 * e);
      pose.rotation.x = 0.1 + Math.sin(sY * 0.003) * 0.08;
      pose.rotation.z = -0.1 + Math.sin(sY * 0.002) * 0.06;
      bouquet.rotation.y = sY * 0.0042 + (reduce ? 0 : Math.sin(t * 0.0006) * 0.15);

      roses.forEach((r) => {
        const i = r.userData.idx;
        const b = ease(clamp(bloom * 1.4 - i * 0.07, 0, 1));
        r.scale.setScalar(ROSE_SCALE * (0.15 + 0.85 * b));
        r.userData.model.rotation.y = sY * 0.006 * (i % 2 ? 1 : -1);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }, { rootMargin: '100px' }).observe(section);
  }

  ready(() => loadThree(init));
})();
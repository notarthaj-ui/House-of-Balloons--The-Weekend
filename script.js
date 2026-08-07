const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const lines = [...document.querySelectorAll('.title-line')];

// Split the headline once, so every glyph can respond independently.
lines.forEach((line) => {
  const label = line.dataset.line;
  line.textContent = '';
  [...label].forEach((character, index) => {
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = character;
    span.style.transitionDelay = `${index * 12}ms`;
    line.appendChild(span);
  });
});

if (isFinePointer && !reduceMotion) {
  const orb = document.querySelector('.cursor-orb');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const orbPosition = { ...mouse };
  let raf;

  function animate() {
    // Low-pass interpolation creates the weighted, physical trailing motion.
    orbPosition.x += (mouse.x - orbPosition.x) * 0.095;
    orbPosition.y += (mouse.y - orbPosition.y) * 0.095;
    orb.style.transform = `translate3d(${orbPosition.x - 160}px, ${orbPosition.y - 160}px, 0)`;
    raf = requestAnimationFrame(animate);
  }

  function reactToType(event) {
    const radius = 190;
    document.querySelectorAll('.letter').forEach((letter) => {
      const rect = letter.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const dx = event.clientX - x;
      const dy = event.clientY - y;
      const distance = Math.hypot(dx, dy);
      const force = Math.max(0, 1 - distance / radius);
      const moveX = (dx / radius) * force * -20;
      const moveY = (dy / radius) * force * -26;
      const rotate = (dx / radius) * force * 8;
      const scaleY = 1 + force * 0.15;
      letter.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotate(${rotate}deg) scaleY(${scaleY})`;
    });
  }

  window.addEventListener('pointermove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    reactToType(event);
  }, { passive: true });

  document.addEventListener('pointerleave', () => {
    document.querySelectorAll('.letter').forEach((letter) => { letter.style.transform = ''; });
  });

  animate();
  addEventListener('beforeunload', () => cancelAnimationFrame(raf));
}

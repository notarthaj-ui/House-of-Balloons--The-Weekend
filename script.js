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

// Keep the artwork's cursor response active on desktop. Coarse/touch pointers
// still skip this entire block so the page remains calm and responsive on mobile.
if (isFinePointer) {
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

const tracks = [
  ['High for This', 'assets/audio/01-high-for-this.flac'], ['What You Need', 'assets/audio/02-what-you-need.flac'],
  ['House of Balloons / Glass Table Girls', 'assets/audio/03-house-of-balloons-glass-table-girls.flac'], ['The Morning', 'assets/audio/04-the-morning.flac'],
  ['Wicked Games', 'assets/audio/05-wicked-games.flac'], ['The Party & The After Party', 'assets/audio/06-the-party-and-the-after-party.flac'],
  ['Coming Down', 'assets/audio/07-coming-down.flac'], ['Loft Music', 'assets/audio/08-loft-music.flac'], ['The Knowing', 'assets/audio/09-the-knowing.flac'],
];
const audio = document.querySelector('#audio');
const toggle = document.querySelector('#play-toggle');
const heroPlay = document.querySelector('#hero-play');
const trackRows = [...document.querySelectorAll('[data-track]')];
const nowPlaying = document.querySelector('#now-playing');
const seek = document.querySelector('#seek');
const timeDisplay = document.querySelector('#time-display');
const miniPlayer = document.querySelector('#mini-player');
const miniTitle = document.querySelector('#mini-title');
const miniToggle = document.querySelector('#mini-toggle');
let activeTrack = 0;
const formatTime = (seconds) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00';
function updateControls() { const playing = !audio.paused; const icon = playing ? 'Ⅱ' : '▶'; toggle.textContent = icon; miniToggle.textContent = icon; toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play'); miniToggle.setAttribute('aria-label', playing ? 'Pause' : 'Play'); heroPlay.innerHTML = `<span>${icon}</span>${playing ? 'Pause current track' : 'Play the first chapter'}`; trackRows.forEach((row, index) => row.classList.toggle('is-active', index === activeTrack)); }
function loadTrack(index, autoplay = false) { activeTrack = (index + tracks.length) % tracks.length; audio.src = tracks[activeTrack][1]; nowPlaying.textContent = tracks[activeTrack][0]; miniTitle.textContent = tracks[activeTrack][0]; seek.value = '0'; timeDisplay.textContent = '0:00 / --:--'; audio.load(); if (autoplay) audio.play().catch(updateControls); updateControls(); }
function togglePlayback() { if (!audio.src) loadTrack(activeTrack); if (audio.paused) audio.play().catch(updateControls); else audio.pause(); }
trackRows.forEach((row) => { const select = () => loadTrack(Number(row.dataset.track), true); row.addEventListener('click', select); row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } }); });
toggle.addEventListener('click', togglePlayback);
heroPlay.addEventListener('click', () => { activeTrack = 0; loadTrack(0, true); });
document.querySelector('#previous').addEventListener('click', () => loadTrack(activeTrack - 1, true));
document.querySelector('#next').addEventListener('click', () => loadTrack(activeTrack + 1, true));
miniToggle.addEventListener('click', togglePlayback);
document.querySelector('#mini-previous').addEventListener('click', () => loadTrack(activeTrack - 1, true));
document.querySelector('#mini-next').addEventListener('click', () => loadTrack(activeTrack + 1, true));
audio.addEventListener('play', updateControls); audio.addEventListener('pause', updateControls);
audio.addEventListener('loadedmetadata', () => { timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`; });
audio.addEventListener('timeupdate', () => { seek.value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : '0'; timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`; });
audio.addEventListener('ended', () => loadTrack(activeTrack + 1, true));
seek.addEventListener('input', () => { if (audio.duration) audio.currentTime = (Number(seek.value) / 100) * audio.duration; });
loadTrack(0);

// The mini player stays out of the way while the full player is visible.
new IntersectionObserver(([entry]) => {
  const showMini = !entry.isIntersecting && !audio.paused;
  miniPlayer.classList.toggle('is-visible', showMini);
  miniPlayer.setAttribute('aria-hidden', String(!showMini));
}, { threshold: 0.25 }).observe(document.querySelector('.player'));



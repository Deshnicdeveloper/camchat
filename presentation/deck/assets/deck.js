/* ===================================================================
   CamChat deck — runtime: reveal init, replayable entrance animations,
   count-up numbers, SVG line-draw timing.
   =================================================================== */
(function () {
  const deck = new Reveal({
    width: 1280,
    height: 720,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 2.0,
    hash: true,
    controls: true,
    progress: true,
    slideNumber: 'c/t',
    transition: 'slide',          // per-slide motion
    transitionSpeed: 'default',
    backgroundTransition: 'fade',
    center: false,
    overview: true,
  });

  // Count-up animation for elements with .count[data-to]
  function runCounts(slide) {
    slide.querySelectorAll('.count').forEach((el) => {
      const to = parseFloat(el.dataset.to || '0');
      const dur = 1100;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = to * eased;
        el.textContent = Number.isInteger(to) ? Math.round(v) : v.toFixed(1);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = to;
      }
      requestAnimationFrame(tick);
    });
  }

  // (Re)play entrance animations: toggle .go on the slide so CSS keyframes restart
  function animate(slide) {
    if (!slide) return;
    slide.classList.remove('go');
    // force reflow so the animation restarts cleanly
    // eslint-disable-next-line no-unused-expressions
    void slide.offsetWidth;
    slide.classList.add('go');
    runCounts(slide);
  }

  const isPrint = /print-pdf/gi.test(window.location.search);

  // In PDF-export mode every slide is rendered at once: reveal all of them
  // and snap counters to their final value (CSS forces visibility too).
  function finalizeAll() {
    document.querySelectorAll('.reveal .slides section').forEach((s) => {
      s.classList.add('go');
      s.querySelectorAll('.count').forEach((el) => {
        el.textContent = el.dataset.to || el.textContent;
      });
    });
  }

  deck.initialize().then(() => {
    if (isPrint) finalizeAll();
    else animate(deck.getCurrentSlide());
  });

  if (!isPrint) {
    deck.on('slidechanged', (e) => animate(e.currentSlide));
    deck.on('ready', (e) => animate(e.currentSlide));
    // when entering overview, reveal everything so thumbnails aren't blank
    deck.on('overviewshown', finalizeAll);
  }
})();

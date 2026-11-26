// Scroll scrubs game time: the clock shows the minute of the moment in view.
// Progressive enhancement: without JS the clock simply reads 0:00.
(() => {
  const moments = [...document.querySelectorAll('li[data-at]')];
  const clocks = document.querySelectorAll('[data-clock]');
  const periods = document.querySelectorAll('[data-period]:not(li)');
  const fills = document.querySelectorAll('[data-fill]');
  const scrubber = document.querySelector('.scrubber');
  const bigClock = document.querySelector('.clock');
  if (!moments.length) return;

  const minutes = (t) => {
    const [m, s] = t.split(':').map(Number);
    return m + s / 60;
  };

  let current = null;
  const show = (el) => {
    if (el === current) return;
    current = el;
    const at = el ? el.dataset.at : '0:00';
    const period = el ? el.dataset.period : '1st half';
    clocks.forEach((c) => (c.textContent = at));
    periods.forEach((p) => (p.textContent = period));
    const pct = Math.min(100, (minutes(at) / 60) * 100);
    fills.forEach((f) => (f.style.width = `${pct}%`));
    moments.forEach((m) => m.classList.toggle('is-now', m === el));
    document.documentElement.classList.toggle('is-halftime', period === 'Half-time');
  };

  // "Now" is the last moment whose top has passed a reading line 45% down the
  // viewport. Recomputed from positions on every frame, so fast scrolls and
  // jumps (e.g. the Install link) always land on the right minute.
  let queued = false;
  const update = () => {
    queued = false;
    const line = window.innerHeight * 0.45;
    let now = null;
    for (const m of moments) {
      if (m.getBoundingClientRect().top <= line) now = m;
      else break;
    }
    // At the very bottom of the page, full time is "now".
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      now = moments[moments.length - 1];
    }
    show(now);
    // Phone scrubber only appears once the big clock has left the screen.
    if (scrubber && bigClock) scrubber.classList.toggle('is-on', bigClock.getBoundingClientRect().bottom < 0);
  };
  const request = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  update();
})();

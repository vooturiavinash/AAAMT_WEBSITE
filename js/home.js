(function () {
  const hero = document.querySelector("[data-hero-rotator]");
  if (hero) {
    const videos = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-video]"));
    const panels = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-panel]"));
    let index = 0;
    let switching = false;

    function show(next) {
      if (!videos.length || switching) return;
      const current = index;
      if (next === current && videos[current].classList.contains("is-active")) {
        const play = videos[current].play();
        if (play) play.catch(function () {});
        return;
      }
      switching = true;
      index = ((next % videos.length) + videos.length) % videos.length;

      videos.forEach(function (video, i) {
        const active = i === index;
        video.classList.toggle("is-active", active);
        if (active) {
          try { video.currentTime = 0; } catch (err) {}
          const play = video.play();
          if (play) play.catch(function () {});
        } else {
          video.pause();
        }
      });

      panels.forEach(function (panel, i) {
        const active = i === index;
        panel.classList.toggle("is-active", active);
        panel.setAttribute("aria-hidden", active ? "false" : "true");
      });

      window.setTimeout(function () {
        switching = false;
      }, 700);
    }

    videos.forEach(function (video, i) {
      video.loop = false;
      video.muted = true;
      video.addEventListener("ended", function () {
        show(i + 1);
      });
    });

    show(0);
  }

  const slides = [
    {
      image: "assets/images/avatar-b.png",
      name: "S. Lakshmi, Accounts Manager, DPS School ( Hyderabad )",
      quote: "“Fee management is now 100% error-free.”",
      body: "Earlier we had multiple mismatches in fee collections. After switching to this ERP, reconciliation is smooth, reports are instant, and transparency has improved greatly."
    },
    {
      image: "assets/images/avatar-a.png",
      name: "Prof. Raghav Rao, Academic Coordinator",
      quote: "“Student engagement increased significantly.”",
      body: "Students receive instant updates on exams, assignments, and events. The mobile app made communication easier, and faculty love the simplified evaluation tools."
    },
    {
      image: "assets/images/dr-meera-prakash.jpg",
      name: "Dr. Meera Prakash, Principal, Skyline Degree College",
      quote: "“Managing our entire college became effortless.”",
      body: "Attendance, examinations, communication - everything is now streamlined. Our staff saves hours every day, and the dashboard gives complete visibility. This software has truly improved our operational efficiency."
    }
  ];

  const root = document.querySelector("[data-testimonials]");
  if (!root) return;

  const stage = root.querySelector("[data-voice-stage]");
  const photo = root.querySelector("[data-photo]");
  const name = root.querySelector("[data-name]");
  const quote = root.querySelector("[data-quote]");
  const body = root.querySelector("[data-body]");
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  let index = 0;
  let animating = false;
  let autoTimer = null;
  const AUTO_MS = 5000;
  const TRANSITION_MS = 450;

  function isMobileVoices() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function applySlide() {
    const slide = slides[index];
    photo.src = slide.image;
    photo.alt = slide.name;
    name.textContent = slide.name;
    quote.textContent = slide.quote;
    body.textContent = slide.body;
    if (prev && next) {
      // On mobile buttons are hidden; keep them enabled for desktop loop UX
      if (isMobileVoices()) {
        prev.disabled = false;
        next.disabled = false;
      } else {
        prev.disabled = index === 0;
        next.disabled = index === slides.length - 1;
      }
    }
  }

  function goTo(nextIndex, fromAuto) {
    if (animating) return;
    const target = ((nextIndex % slides.length) + slides.length) % slides.length;
    if (target === index) return;

    animating = true;
    stopAuto();

    function finish() {
      index = target;
      applySlide();
      if (!stage) {
        animating = false;
        startAuto();
        return;
      }
      stage.classList.remove("is-leaving");
      stage.classList.add("is-entering");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          stage.classList.remove("is-entering");
          window.setTimeout(function () {
            animating = false;
            startAuto();
          }, TRANSITION_MS);
        });
      });
    }

    if (!stage) {
      finish();
      return;
    }

    stage.classList.add("is-leaving");
    window.setTimeout(finish, TRANSITION_MS);
  }

  function startAuto() {
    stopAuto();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Always auto-advance; on mobile this is the only navigation
    autoTimer = window.setTimeout(function () {
      goTo(index + 1, true);
    }, AUTO_MS);
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  if (prev) {
    prev.addEventListener("click", function () {
      if (isMobileVoices()) return;
      if (index === 0) return;
      goTo(index - 1, false);
    });
  }
  if (next) {
    next.addEventListener("click", function () {
      if (isMobileVoices()) return;
      if (index === slides.length - 1) return;
      goTo(index + 1, false);
    });
  }

  // Pause autoplay when user hovers (desktop); resume on leave
  if (root) {
    root.addEventListener("mouseenter", function () {
      if (!isMobileVoices()) stopAuto();
    });
    root.addEventListener("mouseleave", function () {
      startAuto();
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  window.addEventListener("resize", function () {
    applySlide();
  });

  applySlide();
  startAuto();
})();
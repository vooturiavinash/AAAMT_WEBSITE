/**
 * People at AAAMT quote carousel — fixed equal card boxes + auto-advance every 10s.
 */
(function () {
  var INTERVAL_MS = 10000;

  function bind(root) {
    var track = root.querySelector("[data-people-track]");
    var prev = root.querySelector("[data-people-prev]");
    var next = root.querySelector("[data-people-next]");
    var cards = track ? track.querySelectorAll(".people-card") : [];
    if (!track || !prev || !next || !cards.length) return;

    var index = 0;
    var timer = null;
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function cardStep() {
      var card = cards[0];
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || "24") || 24;
      return card.getBoundingClientRect().width + gap;
    }

    function maxIndex() {
      return Math.max(0, cards.length - 1);
    }

    function goTo(nextIndex, smooth) {
      var max = maxIndex();
      if (nextIndex < 0) index = max;
      else if (nextIndex > max) index = 0;
      else index = nextIndex;

      track.scrollTo({
        left: index * cardStep(),
        behavior: smooth && !reduceMotion ? "smooth" : "auto",
      });
      updateButtons();
    }

    function updateButtons() {
      var looping = maxIndex() > 0;
      prev.disabled = !looping;
      next.disabled = !looping;
      prev.classList.toggle("is-active", false);
      next.classList.toggle("is-active", true);
    }

    function syncIndexFromScroll() {
      var step = cardStep();
      if (step <= 0) return;
      index = Math.round(track.scrollLeft / step);
      index = Math.max(0, Math.min(maxIndex(), index));
      updateButtons();
    }

    function stopAuto() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if (reduceMotion || maxIndex() <= 0) return;
      timer = window.setInterval(function () {
        goTo(index + 1, true);
      }, INTERVAL_MS);
    }

    function restartAuto() {
      stopAuto();
      startAuto();
    }

    prev.addEventListener("click", function () {
      goTo(index - 1, true);
      restartAuto();
    });
    next.addEventListener("click", function () {
      goTo(index + 1, true);
      restartAuto();
    });

    track.addEventListener(
      "scroll",
      function () {
        window.requestAnimationFrame(syncIndexFromScroll);
      },
      { passive: true }
    );

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", function (e) {
      if (!root.contains(e.relatedTarget)) startAuto();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    window.addEventListener("resize", function () {
      goTo(Math.min(index, maxIndex()), false);
      restartAuto();
    });

    goTo(0, false);
    startAuto();
  }

  function init() {
    document.querySelectorAll("[data-people-carousel]").forEach(bind);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

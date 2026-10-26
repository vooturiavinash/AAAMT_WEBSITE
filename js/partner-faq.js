/**
 * Partnership FAQ accordion — click +/− to reveal answers with height animation.
 */
(function () {
  function closeItem(item, immediate) {
    var btn = item.querySelector(".partner-faq-q");
    var panel = item.querySelector(".partner-faq-a");
    if (!item.classList.contains("is-open") && !immediate) return;

    item.classList.remove("is-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (!panel) return;

    panel.setAttribute("aria-hidden", "true");

    if (immediate) {
      panel.hidden = true;
      return;
    }

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      if (!item.classList.contains("is-open")) panel.hidden = true;
    }
    panel.addEventListener("transitionend", finish, { once: true });
    window.setTimeout(finish, 400);
  }

  function openItem(item) {
    var btn = item.querySelector(".partner-faq-q");
    var panel = item.querySelector(".partner-faq-a");
    if (panel) {
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      void panel.offsetHeight;
    }
    item.classList.add("is-open");
    if (btn) btn.setAttribute("aria-expanded", "true");
  }

  function bind(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll(".partner-faq-item"));
    items.forEach(function (item, index) {
      if (item.classList.contains("is-open") || index === 0) {
        openItem(item);
      } else {
        closeItem(item, true);
      }

      var btn = item.querySelector(".partner-faq-q");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        items.forEach(function (other) {
          if (other !== item) closeItem(other);
        });
        if (isOpen) closeItem(item);
        else openItem(item);
      });
    });
  }

  function init() {
    document.querySelectorAll("[data-partner-faq]").forEach(bind);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

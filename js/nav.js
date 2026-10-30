(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  var lockedScrollY = 0;

  function setNavOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }

  function lockPageScroll() {
    if (document.body.classList.contains("products-open")) return;
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add("products-open");
    document.body.style.top = "-" + lockedScrollY + "px";
  }

  function unlockPageScroll() {
    if (!document.body.classList.contains("products-open")) return;
    document.body.classList.remove("products-open");
    document.body.style.top = "";
    window.scrollTo(0, lockedScrollY);
  }

  function setProductsOpen(open) {
    if (open) lockPageScroll();
    else unlockPageScroll();
  }

  function closeNav() {
    setNavOpen(false);
  }

  function closeDrops() {
    document.querySelectorAll(".nav-drop.is-open").forEach(function (drop) {
      drop.classList.remove("is-open");
      const button = drop.querySelector(".nav-drop-btn");
      if (button) button.setAttribute("aria-expanded", "false");
    });
    setProductsOpen(false);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const open = !nav.classList.contains("is-open");
      setNavOpen(open);
      if (!open) closeDrops();
    });
  }

  document.querySelectorAll("[data-open-products]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const drop = document.querySelector(".nav-drop");
      const button = drop && drop.querySelector(".nav-drop-btn");
      if (!drop || !button) return;
      drop.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      setProductsOpen(true);
    });
  });

  document.querySelectorAll(".nav-drop-btn").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const drop = button.closest(".nav-drop");
      const open = drop.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      setProductsOpen(open);
    });
  });

  if (nav) {
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 860px)").matches) {
          closeNav();
          closeDrops();
        }
      });
    });
  }

  document.querySelectorAll(".cta-card video").forEach(function (video) {
    video.muted = true;
    video.loop = true;
    video.setAttribute("playsinline", "");
    const play = video.play();
    if (play) play.catch(function () {});
  });

  document.addEventListener("click", function (event) {
    document.querySelectorAll(".nav-drop.is-open").forEach(function (drop) {
      if (!drop.contains(event.target)) {
        drop.classList.remove("is-open");
        const button = drop.querySelector(".nav-drop-btn");
        if (button) button.setAttribute("aria-expanded", "false");
      }
    });

    if (
      nav &&
      toggle &&
      nav.classList.contains("is-open") &&
      !nav.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      closeNav();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDrops();
      closeNav();
    }
  });

  window.addEventListener("resize", function () {
    if (window.matchMedia("(min-width: 861px)").matches) {
      closeNav();
    }
  });
})();

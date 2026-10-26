(function () {
  var layout = document.querySelector("[data-work-layout]");
  if (!layout) return;

  var items = Array.prototype.slice.call(layout.querySelectorAll("[data-work-item]"));
  var images = Array.prototype.slice.call(layout.querySelectorAll("[data-work-image]"));

  function activate(index) {
    items.forEach(function (item, i) {
      item.classList.toggle("is-active", i === index);
    });
    images.forEach(function (img, i) {
      img.classList.toggle("is-active", i === index);
    });
  }

  items.forEach(function (item, index) {
    item.addEventListener("mouseenter", function () {
      activate(index);
    });
    item.addEventListener("focus", function () {
      activate(index);
    });
    item.addEventListener("click", function () {
      activate(index);
    });
    item.setAttribute("tabindex", "0");
  });

  activate(0);
})();

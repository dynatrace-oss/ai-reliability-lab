document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("a[href]").forEach(function (link) {
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });

  if (window.location.pathname.includes("dynatrace-setup")) {
    var nextLink = document.querySelector(".md-footer__link--next");
    if (nextLink) {
      nextLink.href = "/";
      var title = nextLink.querySelector(".md-footer__title");
      if (title) title.textContent = "Home";
      var direction = nextLink.querySelector(".md-footer__direction");
      if (direction) direction.textContent = "Next";
    }
  }
});

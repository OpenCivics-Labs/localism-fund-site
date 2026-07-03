/* Localism Fund retrospective — light progressive enhancement. No dependencies. */
(function () {
  "use strict";

  // Reveal-on-scroll
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Nav: switch to on-dark styling while over a dark hero, or the narrative
  // scroll (index). Two signals share one apply so they can't fight.
  var nav = document.querySelector(".nav");
  var darkHero = document.querySelector("[data-darknav]");
  var navDarkHero = false, navDarkReport = false;
  function applyNavDark() { if (nav) nav.classList.toggle("on-dark", navDarkHero || navDarkReport); }
  if (nav && darkHero) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        navDarkHero = e.isIntersecting && e.intersectionRatio > 0.1;
      });
      applyNavDark();
    }, { rootMargin: "-48px 0px 0px 0px", threshold: [0, 0.1, 0.5] });
    navIO.observe(darkHero);
  }

  // Mobile nav: hamburger toggles the collapsed menu
  var navToggle = document.querySelector(".nav__toggle");
  var navEl = document.querySelector(".nav");
  if (navToggle && navEl) {
    var setOpen = function (open) {
      navEl.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    navToggle.addEventListener("click", function () {
      setOpen(!navEl.classList.contains("is-open"));
    });
    navEl.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) setOpen(false);
    });
  }

  // Parallax: translate [data-parallax] layers against scroll
  var px = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (px.length && !reduce) {
    var ticking = false;
    var vh = window.innerHeight;
    function paint() {
      px.forEach(function (el) {
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        var host = el.parentElement || el;
        var r = host.getBoundingClientRect();
        var offset = (r.top + r.height / 2) - vh / 2;
        el.style.transform = "translate3d(0," + (-offset * speed).toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    function onScroll() { if (!ticking) { window.requestAnimationFrame(paint); ticking = true; } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { vh = window.innerHeight; onScroll(); });
    paint();
  }

  // Layered parallax: fixed orbs drift by raw scroll position (depth)
  var orbs = Array.prototype.slice.call(document.querySelectorAll("[data-scroll-speed]"));
  if (orbs.length && !reduce) {
    var oTick = false;
    function paintOrbs() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      orbs.forEach(function (el) {
        var s = parseFloat(el.getAttribute("data-scroll-speed")) || 0.1;
        el.style.transform = "translate3d(0," + (y * s).toFixed(1) + "px,0)";
      });
      oTick = false;
    }
    window.addEventListener("scroll", function () { if (!oTick) { window.requestAnimationFrame(paintOrbs); oTick = true; } }, { passive: true });
    paintOrbs();
  }

  // Keep one detail open at a time? No — allow many. Just smooth-scroll a newly opened one into view if off-screen.
  document.querySelectorAll("details.disc").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) {
        var r = d.getBoundingClientRect();
        if (r.top < 60) d.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Pinned narrative report: scroll drives the active chapter; frame stays set.
  // Embedded mid-page (below the hero), so the fixed chrome — side TOC and
  // progress bar — only shows while the report itself is on screen.
  var report = document.querySelector(".report");
  if (report) {
    var chapters = Array.prototype.slice.call(report.querySelectorAll(".chapter"));
    var tocItems = Array.prototype.slice.call(report.querySelectorAll(".toc li"));
    var tocEl = report.querySelector(".toc");
    var barEl = report.querySelector(".progress");
    var N = chapters.length, cur = -1, rTick = false;
    function setActive(idx) {
      idx = Math.max(0, Math.min(N - 1, idx));
      if (idx === cur) return; cur = idx;
      chapters.forEach(function (c, i) { c.classList.toggle("is-active", i === idx); });
      tocItems.forEach(function (t, i) { t.classList.toggle("is-active", i === idx); });
    }
    function rPaint() {
      var total = report.offsetHeight - window.innerHeight;
      var p = total > 0 ? (window.pageYOffset - report.offsetTop) / total : 0;
      p = Math.max(0, Math.min(0.9999, p));
      setActive(Math.floor(p * N));
      var rect = report.getBoundingClientRect();
      var engaged = rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5;
      if (tocEl) tocEl.classList.toggle("is-visible", engaged);
      if (barEl) {
        barEl.classList.toggle("is-visible", engaged);
        barEl.style.width = (p * 100) + "%";
      }
      navDarkReport = rect.top < 56 && rect.bottom > 56;
      applyNavDark();
      rTick = false;
    }
    window.addEventListener("scroll", function () { if (!rTick) { window.requestAnimationFrame(rPaint); rTick = true; } }, { passive: true });
    window.addEventListener("resize", rPaint);
    report.querySelectorAll(".toc button").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-go"), 10) || 0;
        var total = report.offsetHeight - window.innerHeight;
        window.scrollTo({ top: report.offsetTop + ((i + 0.5) / N) * total, behavior: "smooth" });
      });
    });
    rPaint();
  }

  // Attested experts modal (experts.html): click a roster name for photo + why
  var emodal = document.getElementById("expert-modal");
  if (emodal) {
    var expertsData = [];
    try { expertsData = JSON.parse((document.getElementById("experts-data") || {}).textContent || "[]"); } catch (err) { }
    var emPhoto = emodal.querySelector(".emodal__photo");
    var emName = emodal.querySelector("#emodal-name");
    var emEns = emodal.querySelector(".emodal__ens");
    var emWhyWrap = emodal.querySelector(".emodal__whywrap");
    var emWhy = emodal.querySelector(".emodal__why");
    var emLastFocus = null;
    function emClose() {
      emodal.hidden = true;
      document.body.style.overflow = "";
      if (emLastFocus) emLastFocus.focus();
    }
    function emOpen(i) {
      var d = expertsData[i];
      if (!d) return;
      emName.textContent = d.name;
      emEns.textContent = d.ens || "";
      emEns.hidden = !d.ens;
      if (d.img) { emPhoto.src = d.img; emPhoto.alt = d.name; emPhoto.hidden = false; }
      else { emPhoto.hidden = true; }
      if (d.why) { emWhy.textContent = d.why; emWhyWrap.hidden = false; }
      else { emWhyWrap.hidden = true; }
      emodal.hidden = false;
      document.body.style.overflow = "hidden";
      emodal.querySelector(".emodal__close").focus();
    }
    document.querySelectorAll(".roster [data-expert]").forEach(function (b) {
      b.addEventListener("click", function () {
        emLastFocus = b;
        emOpen(parseInt(b.getAttribute("data-expert"), 10));
      });
    });
    emodal.addEventListener("click", function (ev) {
      if (ev.target.hasAttribute && ev.target.hasAttribute("data-close")) emClose();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !emodal.hidden) emClose();
    });
  }

  // Count-up stats: roll each numeric stat value up to its final figure the
  // first time it scrolls into view. Ease-out cubic so it lands softly.
  // Skipped entirely under prefers-reduced-motion (values render as authored).
  var statVals = Array.prototype.slice.call(document.querySelectorAll(".statband .stat__value"));
  if (statVals.length && !reduce && "IntersectionObserver" in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countIO.unobserve(en.target);
        var el = en.target;
        var final = el.textContent;
        var m = final.match(/\d+/);
        if (!m) return;
        var target = parseInt(m[0], 10);
        var prefix = final.slice(0, m.index);
        var suffix = final.slice(m.index + m[0].length);
        var t0 = null, DUR = 1400;
        function tick(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / DUR);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(eased * target) + suffix;
          if (p < 1) window.requestAnimationFrame(tick);
          else el.textContent = final;
        }
        window.requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    statVals.forEach(function (el) { countIO.observe(el); });
  }

  // Interactive expert graph — highlight a person's connections on hover/focus
  document.querySelectorAll(".egraph").forEach(function (svg) {
    var edges = Array.prototype.slice.call(svg.querySelectorAll(".eedge"));
    svg.querySelectorAll(".enode").forEach(function (n) {
      var i = n.getAttribute("data-i");
      function on() { n.classList.add("hot"); edges.forEach(function (e) { if (e.getAttribute("data-a") === i || e.getAttribute("data-b") === i) e.classList.add("hot"); }); }
      function off() { n.classList.remove("hot"); edges.forEach(function (e) { e.classList.remove("hot"); }); }
      n.addEventListener("mouseenter", on); n.addEventListener("mouseleave", off);
      n.addEventListener("focus", on); n.addEventListener("blur", off);
    });
  });
})();

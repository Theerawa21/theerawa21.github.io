(() => {
  "use strict";
  const root = document.documentElement;
  // Redirect previous one-page anchor bookmarks to their new dedicated pages.
  const lastPath = window.location.pathname.split("/").pop();
  const oldSectionMap = {
    "#about": ["about", ""],
    "#expertise": ["expertise", ""],
    "#projects": ["projects", ""],
    "#publications": ["publications", ""],
    "#featured-achievements": ["publications", "#featured-achievements"],
    "#highlights": ["publications", "#highlights"],
    "#contact": ["contact", ""]
  };
  if ((lastPath === "" || lastPath === "index.html" || lastPath === "en.html") && oldSectionMap[window.location.hash]) {
    const [page, fragment] = oldSectionMap[window.location.hash];
    const target = (lastPath === "en.html" ? "en-" : "") + page + ".html" + fragment;
    window.location.replace(target);
    return;
  }

  const themeButton = document.querySelector(".theme-toggle");
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-nav");
  const year = document.getElementById("year");
  try { const saved = localStorage.getItem("tt-theme"); if(saved === "dark" || saved === "light") root.dataset.theme = saved; } catch (_) {}
  const updateTheme = () => themeButton?.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
  updateTheme();
  themeButton?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("tt-theme", root.dataset.theme); } catch (_) {}
    updateTheme();
  });
  function closeMenu() {
    if (!mobileMenu || !menuButton) return;
    mobileMenu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", root.lang === "th" ? "เปิดเมนู" : "Open menu");
  }
  menuButton?.addEventListener("click", () => {
    if (!mobileMenu) return;
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    mobileMenu.hidden = isOpen;
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? (root.lang === "th" ? "เปิดเมนู" : "Open menu") : (root.lang === "th" ? "ปิดเมนู" : "Close menu"));
  });
  mobileMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  // Jump straight to a selected section and keep its title visible below the sticky header.
  const siteHeader = document.querySelector(".site-header");
  const sectionLinks = [...document.querySelectorAll('a[href^="#"]')];
  function activateLink(hash) {
    document.querySelectorAll('.desktop-nav a, .mobile-nav a').forEach(link => {
      if (link.getAttribute("href") === hash) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function jumpToSection(hash, updateUrl = true) {
    if (!/^#[A-Za-z][A-Za-z0-9_-]*$/.test(hash)) return false;
    const target = document.getElementById(hash.slice(1));
    if (!target) return false;
    closeMenu();
    // Recalculate after closing the mobile menu; fixed offset prevents covered headings.
    const headerHeight = siteHeader?.getBoundingClientRect().height || 0;
    const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
    const top = hash === "#top" ? 0 : Math.max(0, absoluteTop - headerHeight - 18);
    window.scrollTo({ top, behavior: "auto" });
    if (updateUrl && window.location.hash !== hash) {
      try { window.history.pushState(null, "", hash); } catch (_) { window.location.hash = hash; }
    }
    activateLink(hash);
    // Move keyboard and assistive-technology focus to the selected section.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
    return true;
  }
  sectionLinks.forEach(link => {
    link.addEventListener("click", event => {
      const hash = link.getAttribute("href");
      if (!hash || !document.getElementById(hash.slice(1))) return;
      event.preventDefault();
      jumpToSection(hash);
    });
  });
  if (window.location.hash) {
    window.addEventListener("load", () => jumpToSection(window.location.hash, false), { once: true });
    activateLink(window.location.hash);
  }
  window.addEventListener("popstate", () => {
    if (window.location.hash) jumpToSection(window.location.hash, false);
    else jumpToSection("#top", false);
  });
  // Lightweight client-side search across publication titles and descriptions.
  const searchInput = document.getElementById("publication-query");
  const searchClear = document.querySelector(".publication-clear");
  const searchStatus = document.getElementById("publication-search-status");
  const publicationItems = [...document.querySelectorAll("#publication-list > .publication-item")];
  const isThai = root.lang === "th";
  const normalize = value => String(value || "").normalize("NFKC").toLocaleLowerCase().trim();
  function filterPublications() {
    if (!searchInput || !publicationItems.length) return;
    const query = normalize(searchInput.value);
    let found = 0;
    publicationItems.forEach(item => {
      const visible = !query || normalize(item.textContent).includes(query);
      item.hidden = !visible;
      if (visible) found++;
    });
    if (searchStatus) {
      searchStatus.textContent = query
        ? (found ? (isThai ? "พบ " + found + " รายการ" : found + " matching item(s)") : (isThai ? "ไม่พบผลงานที่ตรงกับคำค้น ลองคำอื่นหรือกดล้างคำค้น" : "No matches. Try another term or clear the search."))
        : (isThai ? "แสดงผลงาน " + publicationItems.length + " รายการ" : "Showing all " + publicationItems.length + " entries");
    }
  }
  searchInput?.addEventListener("input", filterPublications);
  searchClear?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    filterPublications();
    searchInput.focus();
  });
  filterPublications();

  // Short path back to the top, shown after reading further down the page.
  const backToTop = document.querySelector(".floating-top");
  function updateBackToTop() {
    if (backToTop) backToTop.hidden = window.scrollY < 650;
  }
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();


  // Warm only the destination the visitor is about to open.
  const prefetchedPages = new Set();
  function prefetchOnIntent(link) {
    const rawHref = link?.getAttribute("href");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("http:") || rawHref.startsWith("https:")) return;
    let pageUrl;
    try {
      pageUrl = new URL(rawHref, window.location.href);
      if (pageUrl.origin !== window.location.origin || !/\.html$/.test(pageUrl.pathname)) return;
    } catch (_) { return; }
    const key = pageUrl.pathname;
    if (prefetchedPages.has(key) || key === window.location.pathname) return;
    prefetchedPages.add(key);
    const hint = document.createElement("link");
    hint.rel = "prefetch";
    hint.href = pageUrl.pathname;
    hint.as = "document";
    document.head.appendChild(hint);
  }
  document.querySelectorAll(".desktop-nav a, .mobile-nav a, .quick-access-item, .hero-buttons a, .home-featured-card, .page-switcher a")
    .forEach(link => {
      link.addEventListener("pointerenter", () => prefetchOnIntent(link), { once: true, passive: true });
      link.addEventListener("focus", () => prefetchOnIntent(link), { once: true });
    });

  // Subtle, pointer-only portrait tilt. Disabled for reduced motion.
  const heroFrame = document.querySelector(".hero--enhanced .hero-photo-frame");
  const heroArt = document.querySelector(".hero--enhanced .hero-art-photo");
  if (heroFrame && heroArt && window.matchMedia("(hover: hover) and (pointer: fine)").matches
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let raf = 0;
    let nextX = 0, nextY = 0;
    heroArt.addEventListener("pointermove", event => {
      const bounds = heroFrame.getBoundingClientRect();
      const px = (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2);
      const py = (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2);
      nextX = Math.max(-3.5, Math.min(3.5, -py * 3.5));
      nextY = Math.max(-3.5, Math.min(3.5, px * 3.5));
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        heroFrame.style.setProperty("--tilt-x", nextX.toFixed(2) + "deg");
        heroFrame.style.setProperty("--tilt-y", nextY.toFixed(2) + "deg");
        raf = 0;
      });
    }, { passive: true });
    heroArt.addEventListener("pointerleave", () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      heroFrame.style.removeProperty("--tilt-x");
      heroFrame.style.removeProperty("--tilt-y");
    });
  }

  if (year) year.textContent = String(new Date().getFullYear());
})();

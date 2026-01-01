// Wait for the ninja-keys custom element to be defined before using it
const initSearch = () => {
  let searchTheme = determineComputedTheme();
  const ninjaKeys = document.querySelector("ninja-keys");

  if (!ninjaKeys) {
    // ninja-keys not yet available, retry after a short delay
    setTimeout(initSearch, 100);
    return;
  }

  if (searchTheme === "dark") {
    ninjaKeys.classList.add("dark");
  } else {
    ninjaKeys.classList.remove("dark");
  }

  // Make openSearchModal available globally
  window.openSearchModal = () => {
    // collapse navbarNav if expanded on mobile
    const $navbarNav = $("#navbarNav");
    if ($navbarNav.hasClass("show")) {
      $navbarNav.collapse("hide");
    }
    ninjaKeys.open();
  };
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearch);
} else {
  initSearch();
}

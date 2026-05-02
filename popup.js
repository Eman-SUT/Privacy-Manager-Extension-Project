function showTab(tabId) {
  let sections = document.querySelectorAll(".section");

  sections.forEach(sec => {
    sec.classList.remove("active");
  });

  document.getElementById(tabId).classList.add("active");
}


document.getElementById("btnTrackers").addEventListener("click", () => showTab("trackers"));
document.getElementById("btnCookies").addEventListener("click", () => showTab("cookies"));
document.getElementById("btnPrivacy").addEventListener("click", () => showTab("privacy"));
document.getElementById("btnGdpr").addEventListener("click", () => showTab("gdpr"));

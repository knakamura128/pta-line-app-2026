const modeChips = document.querySelectorAll(".mode-chip");
const screenLinks = document.querySelectorAll(".screen-link");
const screens = document.querySelectorAll("[data-screen-id]");
const goButtons = document.querySelectorAll("[data-go]");

function setMode(target) {
  modeChips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.target === target);
  });

  document.querySelectorAll(".screen-list").forEach((list) => {
    list.classList.toggle("is-active", list.dataset.group === target);
  });

  document.querySelectorAll(".device-stage").forEach((stage) => {
    stage.classList.toggle("is-active", stage.dataset.group === target);
  });

  const defaultLink = document.querySelector(`.screen-list[data-group="${target}"] .screen-link`);
  if (defaultLink) {
    setScreen(defaultLink.dataset.screen);
  }
}

function setScreen(screenId) {
  screenLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.screen === screenId);
  });

  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screenId === screenId);
  });
}

function inferMode(screenId) {
  if (screenId.startsWith("member-")) return "member";
  if (screenId.startsWith("admin-")) return "admin";
  return "member";
}

modeChips.forEach((chip) => {
  chip.addEventListener("click", () => setMode(chip.dataset.target));
});

screenLinks.forEach((link) => {
  link.addEventListener("click", () => setScreen(link.dataset.screen));
});

goButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.go;
    setMode(inferMode(target));
    setScreen(target);
  });
});

setMode("member");

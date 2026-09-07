const COLORS = {
  red: { en: "Red", zh: "紅", hex: "#e53e38" },
  yellow: { en: "Yellow", zh: "黃", hex: "#f3d323" },
  blue: { en: "Blue", zh: "藍", hex: "#2867c7" }
};

const WHEEL_COLORS = [
  { key: "yellow", en: "Yellow", zh: "黃", hex: "#f3d323", type: "primary" },
  { key: "yellow-orange", en: "Yellow-Orange", zh: "黃橙", hex: "#f5a623", type: "tertiary" },
  { key: "orange", en: "Orange", zh: "橙", hex: "#ee7d21", type: "secondary" },
  { key: "red-orange", en: "Red-Orange", zh: "紅橙", hex: "#e64b2f", type: "tertiary" },
  { key: "red", en: "Red", zh: "紅", hex: "#d9363e", type: "primary" },
  { key: "red-purple", en: "Red-Purple", zh: "紅紫", hex: "#b33d7b", type: "tertiary" },
  { key: "purple", en: "Purple", zh: "紫", hex: "#7c4dac", type: "secondary" },
  { key: "blue-purple", en: "Blue-Purple", zh: "藍紫", hex: "#4f55ad", type: "tertiary" },
  { key: "blue", en: "Blue", zh: "藍", hex: "#246bc1", type: "primary" },
  { key: "blue-green", en: "Blue-Green", zh: "藍綠", hex: "#159b9a", type: "tertiary" },
  { key: "green", en: "Green", zh: "綠", hex: "#39a652", type: "secondary" },
  { key: "yellow-green", en: "Yellow-Green", zh: "黃綠", hex: "#91bf3b", type: "tertiary" }
];

const MIX_RULES = {
  "red+yellow": { equal: "orange", red: "red-orange", yellow: "yellow-orange" },
  "blue+yellow": { equal: "green", yellow: "yellow-green", blue: "blue-green" },
  "blue+red": { equal: "purple", blue: "blue-purple", red: "red-purple" }
};

const REVERSE_RECIPES = {
  "orange": { colors: ["red", "yellow"], parts: [1, 1] },
  "red-orange": { colors: ["red", "yellow"], parts: [2, 1] },
  "yellow-orange": { colors: ["red", "yellow"], parts: [1, 2] },
  "green": { colors: ["yellow", "blue"], parts: [1, 1] },
  "yellow-green": { colors: ["yellow", "blue"], parts: [2, 1] },
  "blue-green": { colors: ["yellow", "blue"], parts: [1, 2] },
  "purple": { colors: ["blue", "red"], parts: [1, 1] },
  "blue-purple": { colors: ["blue", "red"], parts: [2, 1] },
  "red-purple": { colors: ["blue", "red"], parts: [1, 2] }
};

const state = { selected: [], parts: [1, 1], result: null, wheelFilter: "all" };
const screens = [...document.querySelectorAll("[data-screen]")];
const choiceButtons = [...document.querySelectorAll("[data-color]")];

function showScreen(name) {
  screens.forEach((screen) => {
    const active = screen.dataset.screen === name;
    screen.hidden = !active;
    screen.classList.toggle("is-active", active);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetExperiment() {
  state.selected = [];
  state.parts = [1, 1];
  state.result = null;
  choiceButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
  updateSelection();
  showScreen("choose");
}

function updateSelection() {
  document.querySelector("[data-to-mix]").disabled = state.selected.length !== 2;
}

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const color = button.dataset.color;
    const index = state.selected.indexOf(color);
    if (index >= 0) {
      state.selected.splice(index, 1);
      button.setAttribute("aria-pressed", "false");
    } else if (state.selected.length < 2) {
      state.selected.push(color);
      button.setAttribute("aria-pressed", "true");
    }
    updateSelection();
  });
});

function getResult(first, second, firstParts, secondParts) {
  const pairKey = [first, second].sort().join("+");
  const rules = MIX_RULES[pairKey];
  const resultKey = firstParts === secondParts ? rules.equal : (firstParts > secondParts ? rules[first] : rules[second]);
  return WHEEL_COLORS.find((color) => color.key === resultKey);
}

function renderMix() {
  document.querySelectorAll("[data-paint-control]").forEach((control, index) => {
    const color = COLORS[state.selected[index]];
    control.querySelector("[data-color-zh]").textContent = color.zh;
    control.querySelector("[data-color-en]").textContent = color.en;
    const dots = control.querySelector("[data-paint-dots]");
    dots.innerHTML = Array.from({ length: state.parts[index] }, () => `<span class="dot" style="background:${color.hex}"></span>`).join("");
    dots.setAttribute("aria-label", `${color.zh}色 ${state.parts[index]} 份`);
    control.querySelector("[data-decrease]").disabled = state.parts[index] === 1;
    control.querySelector("[data-increase]").disabled = state.parts[index] === 2 || state.parts[1 - index] === 2;
  });

  state.result = getResult(state.selected[0], state.selected[1], state.parts[0], state.parts[1]);
  const swatch = document.querySelector("[data-result-swatch]");
  swatch.style.background = state.result.hex;
  swatch.classList.remove("is-changing");
  requestAnimationFrame(() => swatch.classList.add("is-changing"));
  setTimeout(() => swatch.classList.remove("is-changing"), 260);
  document.querySelector("[data-result-zh]").textContent = state.result.zh;
  document.querySelector("[data-result-en]").textContent = state.result.en;
  document.querySelector("[data-ratio]").textContent = `${state.parts[0]}：${state.parts[1]}`;
}

function changeParts(index, amount) {
  if (amount > 0 && state.parts[1 - index] === 2) return;
  const next = Math.max(1, Math.min(2, state.parts[index] + amount));
  if (next === state.parts[index]) return;
  state.parts[index] = next;
  renderMix();
}

document.querySelectorAll("[data-paint-control]").forEach((control, index) => {
  control.querySelector("[data-decrease]").addEventListener("click", () => changeParts(index, -1));
  control.querySelector("[data-increase]").addEventListener("click", () => changeParts(index, 1));
});

function renderWheel() {
  const wheel = document.querySelector("[data-color-wheel]");
  const radius = Math.max(126, Math.min(wheel.parentElement.clientWidth * .43, 224));
  wheel.className = `color-wheel${state.wheelFilter === "all" ? "" : ` filter-${state.wheelFilter}`}`;
  wheel.innerHTML = WHEEL_COLORS.map((color, index) => `
    <button type="button" class="wheel-item is-${color.type}${color.key === state.result.key ? " is-result" : ""}${state.wheelFilter !== "all" && color.type !== state.wheelFilter ? " is-hidden" : ""}" data-wheel-color="${color.key}" aria-label="${color.type === "primary" ? `${color.zh}是原色，不需要混色` : `查看${color.zh}的調色比例`}" ${color.type === "primary" ? "disabled" : ""} style="--angle:${index * 30}deg;--radius:${radius}px;--item-color:${color.hex}">
      <span></span><strong>${color.zh}</strong><small>${color.en}</small>
    </button>`).join("");
  document.querySelector("[data-answer-swatch]").style.background = state.result.hex;
  document.querySelector("[data-answer-zh]").textContent = state.result.zh;
  document.querySelector("[data-answer-en]").textContent = state.result.en;
}

document.querySelector("[data-start]").addEventListener("click", resetExperiment);
document.querySelector("[data-to-mix]").addEventListener("click", () => {
  state.parts = [1, 1];
  renderMix();
  showScreen("mix");
});
document.querySelector("[data-back-choose]").addEventListener("click", () => showScreen("choose"));
document.querySelector("[data-to-wheel]").addEventListener("click", () => {
  state.wheelFilter = "all";
  document.querySelectorAll("[data-wheel-filter]").forEach((button) => button.setAttribute("aria-pressed", button.dataset.wheelFilter === "all" ? "true" : "false"));
  showScreen("wheel");
  renderWheel();
});
document.querySelectorAll("[data-wheel-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.wheelFilter = button.dataset.wheelFilter;
    document.querySelectorAll("[data-wheel-filter]").forEach((item) => item.setAttribute("aria-pressed", item === button ? "true" : "false"));
    renderWheel();
  });
});
document.querySelector("[data-color-wheel]").addEventListener("click", (event) => {
  const colorButton = event.target.closest("[data-wheel-color]");
  if (!colorButton) return;
  const recipe = REVERSE_RECIPES[colorButton.dataset.wheelColor];
  if (!recipe) return;
  state.selected = [...recipe.colors];
  state.parts = [...recipe.parts];
  choiceButtons.forEach((button) => button.setAttribute("aria-pressed", state.selected.includes(button.dataset.color) ? "true" : "false"));
  updateSelection();
  renderMix();
  showScreen("mix");
});
document.querySelector("[data-back-mix]").addEventListener("click", () => {
  renderMix();
  showScreen("mix");
});
document.querySelector("[data-try-again]").addEventListener("click", resetExperiment);
window.addEventListener("resize", () => {
  if (!document.querySelector('[data-screen="wheel"]').hidden && state.result) renderWheel();
});

// Small, dependency-free test surface used by local verification.
window.ColorMixingLab = { getResult, COLORS, WHEEL_COLORS, MIX_RULES };
showScreen("home");

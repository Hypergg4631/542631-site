const root = document.documentElement;
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  root.dataset.theme = "dark";
}

const themeToggle = document.querySelector("[data-theme-toggle]");
const updateThemeButton = () => {
  if (!themeToggle) return;
  const isDark = root.dataset.theme === "dark";
  themeToggle.setAttribute("aria-label", isDark ? "切换到浅色模式" : "切换到深色模式");
  themeToggle.textContent = isDark ? "日" : "月";
};

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  if (nextTheme === "dark") {
    root.dataset.theme = "dark";
    localStorage.setItem("theme", "dark");
  } else {
    delete root.dataset.theme;
    localStorage.setItem("theme", "light");
  }
  updateThemeButton();
});

updateThemeButton();

const progress = document.querySelector("[data-reading-progress]");
const updateProgress = () => {
  if (!progress) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
  progress.style.transform = `scaleX(${percentage})`;
};

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();

const spotlightArea = document.querySelector("[data-spotlight]");
spotlightArea?.addEventListener("pointermove", (event) => {
  root.style.setProperty("--spotlight-x", `${event.clientX}px`);
  root.style.setProperty("--spotlight-y", `${event.clientY}px`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 },
);

document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

const depthCards = document.querySelectorAll("[data-depth-card]");
depthCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-2px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

const searchInput = document.querySelector("[data-post-search]");
const filterButtons = [...document.querySelectorAll("[data-tag-filter]")];
const posts = [...document.querySelectorAll("[data-post-card]")];
const emptyState = document.querySelector("[data-empty-state]");
let activeTag = "全部";

const applyFilters = () => {
  const query = searchInput?.value.trim().toLowerCase() ?? "";
  let visibleCount = 0;

  posts.forEach((post) => {
    const text = post.dataset.searchText?.toLowerCase() ?? "";
    const tags = post.dataset.tags?.split(",") ?? [];
    const matchesQuery = !query || text.includes(query);
    const matchesTag = activeTag === "全部" || tags.includes(activeTag);
    const isVisible = matchesQuery && matchesTag;

    post.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  if (emptyState) emptyState.hidden = visibleCount > 0;
};

searchInput?.addEventListener("input", applyFilters);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTag = button.dataset.tagFilter ?? "全部";
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    applyFilters();
  });
});

const canvas = document.querySelector("[data-kinetic-canvas]");
const canvasContext = canvas?.getContext("2d");
let animationFrame = 0;
let time = 0;

const resizeCanvas = () => {
  if (!canvas || !canvasContext) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
};

const drawKineticField = () => {
  if (!canvas || !canvasContext) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvasContext.clearRect(0, 0, width, height);
  canvasContext.lineWidth = 1;

  const bands = 12;
  for (let i = 0; i < bands; i += 1) {
    const progressValue = i / (bands - 1);
    const y = height * (0.14 + progressValue * 0.72);
    const hueColor = i % 3 === 0 ? "118, 94, 64" : i % 3 === 1 ? "151, 126, 88" : "92, 82, 70";
    canvasContext.strokeStyle = `rgba(${hueColor}, ${0.08 + progressValue * 0.045})`;
    canvasContext.beginPath();
    for (let x = -40; x <= width + 40; x += 18) {
      const wave = Math.sin(x * 0.008 + time * 0.018 + i * 0.75) * (22 + i * 1.6);
      const drift = Math.cos(time * 0.012 + i) * 18;
      const pointY = y + wave + drift;
      if (x === -40) {
        canvasContext.moveTo(x, pointY);
      } else {
        canvasContext.lineTo(x, pointY);
      }
    }
    canvasContext.stroke();
  }

  for (let i = 0; i < 28; i += 1) {
    const x = ((i * 97 + time * 0.38) % (width + 160)) - 80;
    const y = height * (0.12 + ((i * 37) % 100) / 125);
    const size = 2 + (i % 4);
    canvasContext.fillStyle = `rgba(118, 94, 64, ${0.1 + (i % 5) * 0.02})`;
    canvasContext.fillRect(x, y, size * 8, 1);
  }

  time += 1;
  animationFrame = window.requestAnimationFrame(drawKineticField);
};

if (canvas && canvasContext && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  resizeCanvas();
  drawKineticField();
  window.addEventListener("resize", resizeCanvas);
} else if (canvas) {
  canvas.hidden = true;
}

window.addEventListener("beforeunload", () => {
  window.cancelAnimationFrame(animationFrame);
});

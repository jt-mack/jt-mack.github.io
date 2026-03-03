// ===== Helpers =====
const $ = (id) => document.getElementById(id);

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function youTubeEmbedUrl(input) {
  // Accepts:
  // - YouTube URL (watch?v=, youtu.be/, /embed/)
  // - raw video id
  const s = (input || "").trim();
  if (!s) return null;

  // raw ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return `https://www.youtube.com/embed/${s}`;

  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return s;
      const id = u.searchParams.get("v");
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    // not a URL
  }

  return null;
}

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return res.json();
}

// ===== Theme toggle =====
(function initTheme() {
  const root = document.documentElement;
  const btn = $("themeBtn");
  const icon = $("themeIcon");
  const text = $("themeText");

  const stored = localStorage.getItem("theme") || "dark";
  root.setAttribute("data-bs-theme", stored);

  function sync() {
    const t = root.getAttribute("data-bs-theme") || "dark";
    const isLight = t === "light";
    icon.textContent = isLight ? "☀️" : "🌙";
    text.textContent = isLight ? "Light" : "Dark";
    btn.classList.toggle("btn-outline-light", !isLight);
    btn.classList.toggle("btn-outline-dark", isLight);
  }

  sync();

  btn.addEventListener("click", () => {
    const cur = root.getAttribute("data-bs-theme") || "dark";
    const next = cur === "light" ? "dark" : "light";
    root.setAttribute("data-bs-theme", next);
    localStorage.setItem("theme", next);
    sync();
  });
})();

// ===== Footer year =====
$("year").textContent = new Date().getFullYear();

// ===== Rendering =====
function renderProjects(items) {
  const grid = $("projectsGrid");
  grid.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    $("projectsEmpty").style.display = "block";
    return;
  }

  $("projectsEmpty").style.display = "none";

  for (const p of items) {
    const title = escapeHtml(p.title || "Untitled project");
    const description = escapeHtml(p.description || "");
    const href = (p.url || "").trim();
    const repo = (p.repo || "").trim();

    const tags = Array.isArray(p.tags) ? p.tags : [];
    const tagHtml = tags
      .slice(0, 8)
      .map((t) => `<span class="badge rounded-pill tag text-body">${escapeHtml(String(t))}</span>`)
      .join(" ");

    const buttons = [
      href ? `<a class="btn btn-sm btn-primary" href="${href}" target="_blank" rel="noreferrer">Link</a>` : "",
      repo ? `<a class="btn btn-sm btn-outline-secondary" href="${repo}" target="_blank" rel="noreferrer">Repo</a>` : ""
    ].filter(Boolean).join(" ");

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="col-md-6 col-lg-4 item-card">
        <div class="card rounded-4 h-100">
          <div class="card-body d-flex flex-column">
            <h3 class="h5 fw-semibold mb-2">${title}</h3>
            <p class="text-secondary mb-3">${description}</p>
            ${tagHtml ? `<div class="d-flex flex-wrap gap-2 mb-3">${tagHtml}</div>` : `<div class="mb-2"></div>`}
            <div class="mt-auto d-flex gap-2 flex-wrap">
              ${buttons || `<span class="item-meta small">No links yet</span>`}
            </div>
          </div>
        </div>
      </div>
      `
    );
  }
}

function renderFeatured(items) {
  const grid = $("featuredGrid");
  grid.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    $("featuredEmpty").style.display = "block";
    return;
  }

  $("featuredEmpty").style.display = "none";

  for (const f of items) {
    const title = escapeHtml(f.title || "Featured");
    const description = escapeHtml(f.description || "");
    const type = (f.type || "link").toLowerCase();
    const youTubeLink= ("youtube" in f) && f["youtube"] ? f.youtube : ""
    const image=("image" in f) && f["image"] ? f.image : ""

    let body = "";
    let footer = "";

    if (type === "youtube" || youTubeLink) {
      const embed = youTubeEmbedUrl(f.youtube || f.url || "");
      if (embed) {
        body = `
          <div class="ratio ratio-16x9 rounded-3 overflow-hidden mb-3">
            <iframe
              src="${embed}"
              title="${title}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
        `;
      } else {
        body = `<div class="text-secondary small mb-3">Invalid YouTube link/id in featured.json</div>`;
      }
      footer = f.url
        ? `<a class="btn btn-sm btn-outline-secondary" href="${f.url}" target="_blank" rel="noreferrer">${f.type === "youtube" ? "Open on YouTube":"Open"}</a>`
        : "";
    } else {
      const url = (f.url || "").trim();
      body = description ? `<div><p class="text-secondary mb-3">${description}</p>${image?` <div class="ratio ratio-16x9 rounded-3 overflow-hidden mb-3"><img src=${image} class="h-100 w-100" style="object-fit: cover;" /></div>`:""}</div>` : "";
      footer = url
        ? `<a class="btn btn-sm btn-primary" href="${url}" target="_blank" rel="noreferrer">Open</a>`
        : `<span class="item-meta small">No URL provided</span>`;
    }

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="col-md-6 item-card">
        <div class="card rounded-4 h-100">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
              <h3 class="h5 fw-semibold m-0">${title}</h3>
              <span class="badge rounded-pill tag text-body text-uppercase">${escapeHtml(type)}</span>
            </div>
            ${type === "youtube" || youTubeLink ? (description ? `<p class="text-secondary mb-3">${description}</p>` : "") : ""}
            ${body}
            <div class="d-flex gap-2 flex-wrap">
              ${footer}
            </div>
          </div>
        </div>
      </div>
      `
    );
  }
}

// ===== Boot =====
(async function boot() {
  try {
    const featured = await loadJson("./assets/js/data/featured.json");
    renderFeatured(featured);
  } catch (e) {
    console.warn(e);
    $("featuredEmpty").style.display = "block";
  }

  try {
    const projects = await loadJson("./assets/js/data/projects.json");
    renderProjects(projects);
  } catch (e) {
    console.warn(e);
    $("projectsEmpty").style.display = "block";
  }
})();
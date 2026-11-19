// Sunset Cover — offline GTA-style poster maker.
// All state lives here; the cover is drawn on a canvas so the preview and the
// exported PNG are the same drawing at different sizes. No network requests.

const $ = (id) => document.getElementById(id);

const SIZES = {
  square: { w: 1080, h: 1080, label: "1080 × 1080 · Square" },
  portrait: { w: 1080, h: 1350, label: "1080 × 1350 · Portrait" },
  wide: { w: 1920, h: 1080, label: "1920 × 1080 · Widescreen" },
};

// Panel rectangles as fractions of the cover [x, y, w, h].
const LAYOUTS = {
  vice: [[0, 0, 1, 0.6], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]],
  strip: [[0, 0, 0.58, 1], [0.58, 0, 0.42, 0.5], [0.58, 0.5, 0.42, 0.5]],
  trio: [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
};

const SAMPLES = [
  { name: "Boulevard sunset", src: "samples/boulevard.jpg" },
  { name: "Neon beach", src: "samples/beach.jpg" },
  { name: "Night city", src: "samples/city.jpg" },
];

const state = {
  photos: [], // {img, name}
  panels: [], // {photo, zoom, panX, panY} — pan in % of panel size
  layout: "vice",
  size: "square",
  grade: "sunset",
  gradeStrength: 0.7,
  title: "SUNSET DRIVE",
  subtitle: "A VICE CITY STORY",
  titleColor: "#ffffff",
  selected: 0,
};

const preview = $("previewCanvas");
const pctx = preview.getContext("2d");

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function resetPanels() {
  const count = LAYOUTS[state.layout].length;
  const old = state.panels;
  state.panels = Array.from({ length: count }, (_, i) => {
    const prev = old[i];
    return prev ?? { photo: state.photos.length ? i % state.photos.length : null, zoom: 1.2, panX: 0, panY: 0 };
  });
  state.selected = Math.min(state.selected, count - 1);
  syncPanelControls();
}

function addPhoto(img, name) {
  state.photos.push({ img, name });
  // Fill empty panels with the new photo, first-come first-served.
  for (const p of state.panels) {
    if (p.photo === null) { p.photo = state.photos.length - 1; break; }
  }
  renderStrip();
  renderAll();
}

function renderStrip() {
  const strip = $("photoStrip");
  strip.innerHTML = "";
  if (!state.photos.length) {
    const span = document.createElement("span");
    span.className = "empty";
    span.textContent = "No photos yet — add yours, or try a sample below.";
    strip.appendChild(span);
  }
  state.photos.forEach((ph, i) => {
    const thumb = document.createElement("img");
    thumb.src = ph.img.src;
    thumb.alt = ph.name;
    thumb.title = `${ph.name} — click to put in the selected panel`;
    if (state.panels[state.selected] && state.panels[state.selected].photo === i) thumb.classList.add("assigned");
    thumb.addEventListener("click", () => {
      state.panels[state.selected].photo = i;
      renderStrip();
      renderAll();
    });
    strip.appendChild(thumb);
  });
}

// ---- drawing ---------------------------------------------------------------

function photoFilter() {
  if (state.grade === "noir") return "grayscale(0.9) contrast(1.18) brightness(1.02)";
  if (state.grade === "neon") return "saturate(1.45) contrast(1.12)";
  return "saturate(1.35) contrast(1.08) brightness(1.03)";
}

function drawPanelPhoto(ctx, panel, rect) {
  const [fx, fy, fw, fh] = rect;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const x = fx * W, y = fy * H, w = fw * W, h = fh * H;
  const ph = state.photos[panel.photo];
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (ph) {
    const img = ph.img;
    const scale = Math.max(w / img.width, h / img.height) * panel.zoom;
    const dw = img.width * scale, dh = img.height * scale;
    const dx = x + (w - dw) / 2 + (panel.panX / 100) * w;
    const dy = y + (h - dh) / 2 + (panel.panY / 100) * h;
    ctx.filter = photoFilter();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#2c1840";
    ctx.fillRect(x, y, w, h);
  }
  // Colour-grade wash.
  const s = state.gradeStrength;
  if (state.grade === "sunset") {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(255,120,60,0)");
    g.addColorStop(1, `rgba(255,80,40,${0.28 * s})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = `rgba(255,150,70,${0.08 * s})`;
    ctx.fillRect(x, y, w, h);
  } else if (state.grade === "neon") {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, `rgba(255,40,160,${0.22 * s})`);
    g.addColorStop(0.55, "rgba(120,40,200,0)");
    g.addColorStop(1, `rgba(0,220,255,${0.2 * s})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } else {
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${0.45 * s})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function drawCaption(ctx) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const bandH = H * 0.21;
  const y0 = H - bandH;
  const g = ctx.createLinearGradient(0, y0 - H * 0.06, 0, H);
  g.addColorStop(0, "rgba(10,4,20,0)");
  g.addColorStop(0.35, "rgba(10,4,20,0.82)");
  g.addColorStop(1, "rgba(10,4,20,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y0 - H * 0.06, W, bandH + H * 0.06);

  const pad = W * 0.045;
  const title = (state.title || "UNTITLED").toUpperCase();
  let size = W * 0.105;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(title).width > W - pad * 2 && size > W * 0.03) {
    size *= 0.92;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(20,5,30,0.9)";
  ctx.lineWidth = size * 0.14;
  ctx.strokeText(title, pad, H - pad * 0.9 - size * 0.28);
  ctx.fillStyle = state.titleColor;
  ctx.fillText(title, pad, H - pad * 0.9 - size * 0.28);

  // Sunset underline bar + subtitle.
  const subY = H - pad * 0.55;
  ctx.fillStyle = "#ff5ea8";
  ctx.fillRect(pad, subY - size * 0.18, W * 0.09, Math.max(4, H * 0.008));
  ctx.fillStyle = "#ffb13e";
  ctx.fillRect(pad + W * 0.09, subY - size * 0.18, W * 0.045, Math.max(4, H * 0.008));
  ctx.font = `700 ${Math.max(13, W * 0.021)}px system-ui, sans-serif`;
  ctx.fillStyle = "#f5eef7";
  ctx.fillText((state.subtitle || "").toUpperCase(), pad + W * 0.16, subY);
}

function renderCover(ctx) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = "#ffffff"; // gutters between panels
  ctx.fillRect(0, 0, W, H);
  const gut = Math.max(4, W * 0.006);
  LAYOUTS[state.layout].forEach((r, i) => {
    const inset = [r[0] + (r[0] > 0 ? gut / W : 0), r[1] + (r[1] > 0 ? gut / H : 0),
      r[2] - (r[0] > 0 ? gut / W : 0) - (r[0] + r[2] < 1 ? gut / W : 0),
      r[3] - (r[1] > 0 ? gut / H : 0) - (r[1] + r[3] < 1 ? gut / H : 0)];
    drawPanelPhoto(ctx, state.panels[i], inset);
  });
  drawCaption(ctx);
}

function renderAll() {
  const { w, h } = SIZES[state.size];
  preview.width = w > 1400 ? 960 : 900;
  preview.height = Math.round(preview.width * (h / w));
  renderCover(pctx);
  // Selected-panel outline, preview only (never in the export).
  const r = LAYOUTS[state.layout][state.selected];
  if (r) {
    pctx.save();
    pctx.strokeStyle = "#3ee6ff";
    pctx.lineWidth = 5;
    pctx.setLineDash([14, 9]);
    pctx.strokeRect(r[0] * preview.width + 3, r[1] * preview.height + 3,
      r[2] * preview.width - 6, r[3] * preview.height - 6);
    pctx.restore();
  }
  $("sizeLabel").textContent = SIZES[state.size].label;
  const p = state.panels[state.selected];
  $("panelHint").textContent = p
    ? `Panel ${state.selected + 1} of ${state.panels.length} selected — drag it, or use the sliders.`
    : "No panel selected.";
}

// ---- export ----------------------------------------------------------------

async function exportPNG() {
  const { w, h } = SIZES[state.size];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas.getContext("2d"));
  const status = $("exportStatus");
  status.textContent = "Exporting…";
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sunset-cover-${state.size}-${w}x${h}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.__lastExport = { width: w, height: h, bytes: blob.size, name: a.download };
  status.textContent = `Exported ${w} × ${h} PNG (${(blob.size / 1024).toFixed(0)} KB) — check your downloads.`;
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ---- panel controls ----------------------------------------------------------

function syncPanelControls() {
  const p = state.panels[state.selected];
  if (!p) return;
  $("zoomInput").value = Math.round(p.zoom * 100);
  $("panXInput").value = p.panX;
  $("panYInput").value = p.panY;
}

function panelAt(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return LAYOUTS[state.layout].findIndex((r) => x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3]);
}

let dragging = false, dragStart = null, dragPanel = null;
preview.addEventListener("pointerdown", (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  syncPanelControls();
  renderStrip();
  dragging = true;
  dragPanel = state.panels[i];
  dragStart = { x: e.clientX, y: e.clientY, panX: dragPanel.panX, panY: dragPanel.panY };
  preview.setPointerCapture(e.pointerId);
  renderAll();
});
preview.addEventListener("pointermove", (e) => {
  if (!dragging || !dragPanel) return;
  const rect = preview.getBoundingClientRect();
  const r = LAYOUTS[state.layout][state.selected];
  dragPanel.panX = Math.max(-50, Math.min(50, dragStart.panX + ((e.clientX - dragStart.x) / rect.width / r[2]) * 100));
  dragPanel.panY = Math.max(-50, Math.min(50, dragStart.panY + ((e.clientY - dragStart.y) / rect.height / r[3]) * 100));
  syncPanelControls();
  renderAll();
});
preview.addEventListener("pointerup", () => { dragging = false; dragPanel = null; });
preview.addEventListener("wheel", (e) => {
  e.preventDefault();
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  const p = state.panels[i];
  p.zoom = Math.max(1, Math.min(2.5, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  syncPanelControls();
  renderAll();
}, { passive: false });

// ---- wiring ------------------------------------------------------------------

$("fileInput").addEventListener("change", async (e) => {
  for (const file of e.target.files) {
    const img = await loadImage(URL.createObjectURL(file));
    addPhoto(img, file.name);
  }
  e.target.value = "";
});

$("onePhotoBtn").addEventListener("click", () => {
  if (!state.photos.length) return;
  const first = state.panels.find((p) => p.photo !== null);
  const idx = first ? first.photo : 0;
  state.panels.forEach((p) => { p.photo = idx; });
  renderStrip();
  renderAll();
});
$("shuffleBtn").addEventListener("click", () => {
  if (!state.photos.length) return;
  state.panels.forEach((p) => { p.photo = Math.floor(Math.random() * state.photos.length); });
  renderStrip();
  renderAll();
});

function segRow(id, key, fn) {
  $(id).addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-" + key + "]");
    if (!btn) return;
    $(id).querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    fn(btn.dataset[key]);
  });
}
segRow("layoutRow", "layout", (v) => { state.layout = v; resetPanels(); renderAll(); });
segRow("sizeRow", "size", (v) => { state.size = v; renderAll(); });
segRow("gradeRow", "grade", (v) => { state.grade = v; renderAll(); });

$("titleColorRow").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-color]");
  if (!btn) return;
  $("titleColorRow").querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  state.titleColor = btn.dataset.color;
  renderAll();
});

$("titleInput").addEventListener("input", (e) => { state.title = e.target.value; renderAll(); });
$("subtitleInput").addEventListener("input", (e) => { state.subtitle = e.target.value; renderAll(); });
$("gradeInput").addEventListener("input", (e) => { state.gradeStrength = e.target.value / 100; renderAll(); });
$("zoomInput").addEventListener("input", (e) => { state.panels[state.selected].zoom = e.target.value / 100; renderAll(); });
$("panXInput").addEventListener("input", (e) => { state.panels[state.selected].panX = +e.target.value; renderAll(); });
$("panYInput").addEventListener("input", (e) => { state.panels[state.selected].panY = +e.target.value; renderAll(); });
$("exportBtn").addEventListener("click", exportPNG);

// ---- start: load the built-in sample scenes so the first paint is a poster ---
resetPanels();
(async () => {
  for (const s of SAMPLES) {
    try { addPhoto(await loadImage(s.src), s.name); } catch { /* sample missing: app still works */ }
  }
  document.fonts?.load('40px Anton').then(() => renderAll()).catch(() => renderAll());
  renderAll();
})();

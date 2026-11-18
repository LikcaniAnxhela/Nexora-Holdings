/* ============================================================
   NEXORA HOLDINGS — main.js
   Edit CONFIG below to plug in your real details.
   ============================================================ */
const CONFIG = {
  zoomLink: "https://zoom.us/j/0000000000",   // <-- put your real Zoom meeting link here
  hqName: "Nexora Tower, Marunouchi, Tokyo",
  rotating: ["FUTURE.", "NEXT ERA.", "DEEP TECH.", "TOMORROW."],
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Typed rotating headline ---------- */
(() => {
  const el = $("#typed");
  let w = 0, i = 0, del = false;
  (function tick() {
    const word = CONFIG.rotating[w];
    el.textContent = word.slice(0, i);
    if (!del && i === word.length) { del = true; return setTimeout(tick, 1400); }
    if (del && i === 0) { del = false; w = (w + 1) % CONFIG.rotating.length; }
    i += del ? -1 : 1;
    setTimeout(tick, del ? 45 : 95);
  })();
})();

/* ---------- Tokyo clock ---------- */
(() => {
  const el = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const up = () => (el.textContent = fmt.format(new Date()) + " JST");
  up(); setInterval(up, 1000);
})();

/* ---------- Scroll progress + reveal + counters ---------- */
addEventListener("scroll", () => {
  const h = document.documentElement;
  $("#progress").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
}, { passive: true });

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    const b = $("b[data-count]", e.target);
    if (b && !b.dataset.done) { b.dataset.done = 1; countUp(b); }
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
$$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + "ms"; io.observe(el); });

function countUp(b) {
  const end = +b.dataset.count, suf = b.dataset.suffix || "+";
  const t0 = performance.now(), dur = 1800;
  (function f(t) {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    b.textContent = Math.round(end * e).toLocaleString() + (p === 1 ? suf : "");
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

/* ---------- Cursor glow + 3D tilt cards ---------- */
const glow = $("#cursor-glow");
addEventListener("pointermove", (e) => { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; });
$$(".tilt").forEach((c) => {
  c.style.setProperty("--c", c.dataset.c);
  c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.transform = `rotateY(${(x - .5) * 16}deg) rotateX(${(.5 - y) * 16}deg) translateZ(10px)`;
    c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
  });
  c.addEventListener("pointerleave", () => (c.style.transform = ""));
});

/* ---------- Background: neural particle field ---------- */
(() => {
  const cv = $("#bg"), ctx = cv.getContext("2d");
  let W, H, pts = [], mouse = { x: -999, y: -999 };
  const cols = ["#00f0ff", "#ff2bd6", "#b6ff3b", "#7a5cff"];
  function size() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    const n = Math.min(140, Math.floor((W * H) / 14000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.8 + 0.2,
      vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, c: cols[(Math.random() * 4) | 0],
    }));
  }
  addEventListener("resize", size); size();
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  (function draw() {
    ctx.fillStyle = "rgba(5,6,13,.35)"; ctx.fillRect(0, 0, W, H);
    const sy = scrollY * 0.15;
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 160) { p.x += (dx / d) * 2.2; p.y += (dy / d) * 2.2; }
      p.x += p.vx * p.z; p.y += p.vy * p.z;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, (p.y - sy * p.z + H * 3) % H, 1.6 * p.z + .4, 0, 7);
      ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 10; ctx.fill();
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 120) { ctx.strokeStyle = `rgba(0,240,255,${(1 - d / 120) * .22})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  })();
})();

/* ============================================================
   VIRTUAL DRIVE — pseudo-3D neon road to Tokyo
   ============================================================ */
const Drive = (() => {
  const wrap = $("#drive"), cv = $("#road"), ctx = cv.getContext("2d");
  const TARGET = 9000;
  let on = false, raf, W, H, last = 0;
  let S = { pos: 0, speed: 0, x: 0, done: false };
  const keys = {};
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const neon = ["#00f0ff", "#ff2bd6", "#b6ff3b", "#7a5cff", "#ffb800"];
  const curve = (z) => Math.sin(z * 0.0021) * 1.0 + Math.sin(z * 0.0057) * 0.45;

  function size() { W = cv.width = innerWidth; H = cv.height = innerHeight; }

  function open() {
    wrap.hidden = false; on = true; size();
    S = { pos: 0, speed: 0, x: 0, done: false };
    $("#arrived").hidden = true; document.body.style.overflow = "hidden";
    last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function close() { on = false; wrap.hidden = true; cancelAnimationFrame(raf); document.body.style.overflow = ""; }

  function update(dt) {
    const up = keys.ArrowUp || keys.w || keys.W || keys.go;
    const down = keys.ArrowDown || keys.s || keys.S;
    const turbo = keys[" "];
    const max = turbo ? 520 : 340;
    if (S.done) S.speed *= 0.95;
    else if (up) S.speed += (turbo ? 330 : 200) * dt;
    else if (down) S.speed -= 380 * dt;
    else S.speed -= 70 * dt;
    S.speed = Math.max(0, Math.min(max, S.speed));
    const steer = (keys.ArrowLeft || keys.a || keys.A || keys.left ? -1 : 0) + (keys.ArrowRight || keys.d || keys.D || keys.right ? 1 : 0);
    S.x += steer * dt * 1.6 * (0.3 + S.speed / 340);
    S.x -= curve(S.pos * 20 + 400) * dt * (S.speed / 340) * 0.9;     // centrifugal drift
    S.x = Math.max(-1.6, Math.min(1.6, S.x));
    if (Math.abs(S.x) > 1.05) S.speed *= 1 - dt * 1.8;                // off-road drag
    S.pos += S.speed * dt * 4;
    if (!S.done && S.pos >= TARGET) { S.done = true; $("#arrived").hidden = false; }
    $("#spd").textContent = Math.round(S.speed);
    $("#prog").style.width = Math.min(100, (S.pos / TARGET) * 100) + "%";
  }

  function render(t) {
    const hor = H * 0.42, roadH = H - hor;
    // sky
    let g = ctx.createLinearGradient(0, 0, 0, hor);
    g.addColorStop(0, "#02020a"); g.addColorStop(.6, "#1a0838"); g.addColorStop(1, "#ff2bd6");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hor + 2);
    // stars
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 70; i++) { const x = (hash(i) * W + S.x * -20) % W, y = hash(i + 99) * hor * .7; ctx.globalAlpha = .3 + hash(i + 5) * .7; ctx.fillRect((x + W) % W, y, 1.5, 1.5); }
    ctx.globalAlpha = 1;
    // sun
    const sx = W / 2 - curve(S.pos * 20) * W * 0.05 - S.x * 40, sr = Math.min(W, H) * 0.2;
    g = ctx.createLinearGradient(0, hor - sr * 1.6, 0, hor);
    g.addColorStop(0, "#ffe600"); g.addColorStop(1, "#ff2bd6");
    ctx.save(); ctx.beginPath(); ctx.arc(sx, hor - sr * .55, sr, 0, 7); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(sx - sr, hor - sr * 1.6, sr * 2, sr * 2);
    ctx.fillStyle = "#1a0838"; for (let i = 0; i < 6; i++) ctx.fillRect(sx - sr, hor - sr * .75 + i * sr * .18, sr * 2, 2 + i * 1.6);
    ctx.restore();
    // far skyline (Tokyo silhouette w/ Tokyo Tower-ish spike)
    ctx.fillStyle = "#0a0420";
    for (let i = 0; i < 40; i++) { const bw = W / 40, bh = 20 + hash(i + 7) * 70; ctx.fillRect(i * bw - S.x * 30, hor - bh, bw - 2, bh); }
    ctx.beginPath(); ctx.moveTo(W * .72 - S.x * 30, hor); ctx.lineTo(W * .735 - S.x * 30, hor - 150); ctx.lineTo(W * .75 - S.x * 30, hor); ctx.fill();
    // ground
    ctx.fillStyle = "#06020f"; ctx.fillRect(0, hor, W, roadH);

    // road strips
    for (let y = H; y > hor; y -= 2) {
      const p = (y - hor) / roadH, d = 1 / p, wz = S.pos + d * 20;
      const off = curve(wz) * (1 - p) * (1 - p) * W * 0.55 - curve(S.pos) * 0 ;
      const cx = W / 2 + off - S.x * p * W * 0.42, hw = p * W * 0.42;
      const band = Math.floor(wz / 40) % 2;
      // grass grid
      ctx.fillStyle = band ? "#0a0320" : "#12063a"; ctx.fillRect(0, y, W, 2);
      // rumble
      ctx.fillStyle = band ? "#ff2bd6" : "#00f0ff"; ctx.fillRect(cx - hw * 1.12, y, hw * .12, 2); ctx.fillRect(cx + hw, y, hw * .12, 2);
      // asphalt
      ctx.fillStyle = band ? "#14102a" : "#191436"; ctx.fillRect(cx - hw, y, hw * 2, 2);
      // lane dashes
      if (band) { ctx.fillStyle = "#b6ff3b"; ctx.fillRect(cx - hw * .02, y, hw * .04, 2); }
    }

    // roadside neon towers (far to near)
    const base = Math.floor(S.pos / 60);
    for (let k = 40; k >= 1; k--) {
      const idx = base + k, wz = idx * 60, d = (wz - S.pos) / 20;
      if (d < 1.1) continue;
      const p = 1 / d, y = hor + roadH * p;
      const off = curve(wz) * (1 - p) * (1 - p) * W * 0.55;
      const cx = W / 2 + off - S.x * p * W * 0.42, hw = p * W * 0.42;
      for (const side of [-1, 1]) {
        const hh = hash(idx * 2 + (side > 0 ? 1 : 0)), bh = (60 + hh * 340) * p * (H / 700), bw = (50 + hh * 90) * p * (W / 900) ;
        const col = neon[Math.floor(hh * 5)];
        const bx = cx + side * (hw * 1.45) - (side < 0 ? bw : 0);
        ctx.globalAlpha = Math.min(1, p * 3 + .15);
        ctx.fillStyle = "#07031a"; ctx.fillRect(bx, y - bh, bw, bh);
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, 2 * p * 3); ctx.shadowColor = col; ctx.shadowBlur = 14 * p + 2;
        ctx.strokeRect(bx, y - bh, bw, bh);
        ctx.shadowBlur = 0; ctx.fillStyle = col;
        const rows = Math.floor(bh / (14 * Math.max(p * 3, .5)));
        for (let r = 1; r < rows; r++) if (hash(idx + r * 3.1 + side) > .55) ctx.fillRect(bx + bw * .15, y - bh + r * (bh / rows), bw * .7, Math.max(1, bh / rows * .35));
      }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    // speed lines
    if (S.speed > 250) {
      ctx.strokeStyle = "rgba(0,240,255,.35)"; ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const a = hash(i + Math.floor(t / 60)) * 6.28, r1 = Math.min(W, H) * (.35 + hash(i) * .2), r2 = r1 + 40 + S.speed * .2;
        ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r1, H * .55 + Math.sin(a) * r1 * .6); ctx.lineTo(W / 2 + Math.cos(a) * r2, H * .55 + Math.sin(a) * r2 * .6); ctx.stroke();
      }
    }

    // car
    const cw = Math.min(W * .2, 200), cx2 = W / 2 + S.x * W * 0.05, cy = H - 70 + Math.sin(t / 60) * (S.speed / 200);
    const tilt = (keys.ArrowLeft || keys.left ? -1 : 0) + (keys.ArrowRight || keys.right ? 1 : 0);
    ctx.save(); ctx.translate(cx2, cy); ctx.rotate(tilt * 0.05 * (S.speed / 340));
    ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 30;
    ctx.fillStyle = "#0b0b22"; ctx.beginPath();
    ctx.moveTo(-cw / 2, 0); ctx.lineTo(-cw * .42, -cw * .22); ctx.lineTo(-cw * .22, -cw * .38); ctx.lineTo(cw * .22, -cw * .38); ctx.lineTo(cw * .42, -cw * .22); ctx.lineTo(cw / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 3; ctx.stroke();
    ctx.shadowColor = "#ff2bd6"; ctx.fillStyle = "#ff2bd6"; ctx.shadowBlur = 24;
    ctx.fillRect(-cw * .45, -cw * .12, cw * .2, cw * .05); ctx.fillRect(cw * .25, -cw * .12, cw * .2, cw * .05);
    ctx.fillStyle = "#00f0ff"; ctx.shadowColor = "#00f0ff"; ctx.fillRect(-cw * .18, -cw * .3, cw * .36, cw * .08);
    if (keys[" "] && S.speed > 100) { ctx.fillStyle = "#ffb800"; ctx.shadowColor = "#ffb800"; ctx.beginPath(); ctx.moveTo(-cw * .1, 0); ctx.lineTo(0, cw * (.2 + Math.random() * .2)); ctx.lineTo(cw * .1, 0); ctx.fill(); }
    ctx.restore(); ctx.shadowBlur = 0;

    // final gate
    if (S.pos > TARGET - 1200) {
      const d = (TARGET - S.pos) / 20, p = Math.min(1, 1 / Math.max(d, 1)), gy = hor + roadH * p, off = curve(TARGET) * (1 - p) * (1 - p) * W * .55, gx = W / 2 + off - S.x * p * W * .42, gw = p * W * .6;
      ctx.strokeStyle = "#b6ff3b"; ctx.shadowColor = "#b6ff3b"; ctx.shadowBlur = 25; ctx.lineWidth = 6 * p + 1;
      ctx.strokeRect(gx - gw / 2, gy - gw * .8, gw, gw * .8);
      ctx.fillStyle = "#b6ff3b"; ctx.font = `700 ${Math.max(10, 38 * p)}px Orbitron, sans-serif`; ctx.textAlign = "center"; ctx.fillText("NEXORA TOWER", gx, gy - gw * .85); ctx.shadowBlur = 0;
    }
    // vignette
    g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H); g.addColorStop(0, "transparent"); g.addColorStop(1, "rgba(0,0,0,.7)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function loop(t) {
    if (!on) return;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    update(dt); render(t); raf = requestAnimationFrame(loop);
  }

  addEventListener("resize", () => on && size());
  addEventListener("keydown", (e) => { if (!on) return; keys[e.key] = true; if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault(); if (e.key === "Escape") close(); });
  addEventListener("keyup", (e) => { keys[e.key] = false; });
  // touch controls
  const hold = (id, k) => { const b = $(id); ["pointerdown", "pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, (e) => { keys[k] = ev === "pointerdown"; e.preventDefault(); })); };
  hold("#tl", "left"); hold("#tr", "right"); hold("#tg", "go");
  $("#exitDrive").addEventListener("click", close);
  $("#again").addEventListener("click", open);
  ["#driveBtn", "#driveBtn2"].forEach((s) => $(s).addEventListener("click", open));
  return { open, close };
})();

/* ============================================================
   ZOOM MODAL — builds a downloadable .ics invite + opens Zoom
   ============================================================ */
const Zoom = (() => {
  const m = $("#zoom"), form = $("#zoomForm");
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  function open() {
    Drive.close(); m.hidden = false;
    const d = new Date(Date.now() + 864e5); d.setMinutes(0, 0, 0); d.setHours(10);
    const pad = (n) => String(n).padStart(2, "0");
    $("#when").value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    $("#tzNote").textContent = `Your timezone: ${tz}. Tokyo is ${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(new Date())} JST right now.`;
  }
  const close = () => (m.hidden = true);
  $$("[data-zoom]").forEach((b) => b.addEventListener("click", open));
  $("#closeZoom").addEventListener("click", close);
  m.addEventListener("click", (e) => e.target === m && close());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form), start = new Date(f.get("when")), end = new Date(+start + 36e5);
    const z = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nexora Holdings//EN", "BEGIN:VEVENT",
      `UID:${Date.now()}@nexora.example`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(start)}`, `DTEND:${z(end)}`,
      "SUMMARY:Nexora Holdings — Zoom Briefing", `DESCRIPTION:Join Zoom: ${CONFIG.zoomLink}`, `LOCATION:${CONFIG.zoomLink}`,
      `ATTENDEE;CN=${f.get("name")}:mailto:${f.get("email")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "nexora-zoom-briefing.ics"; a.click();
    window.open(CONFIG.zoomLink, "_blank", "noopener");
    close();
  });
  addEventListener("keydown", (e) => e.key === "Escape" && close());
  return { open };
})();

/* ============================================================
   COMMAND PALETTE (Ctrl/Cmd + K)
   ============================================================ */
(() => {
  const p = $("#palette"), input = $("#palIn"), list = $("#palList");
  const go = (id) => () => $(id).scrollIntoView({ behavior: "smooth" });
  const cmds = [
    { n: "Drive to HQ (virtual)", k: "drive", f: Drive.open },
    { n: "Join via Zoom", k: "zoom", f: Zoom.open },
    { n: "Go to Portfolio", k: "portfolio", f: go("#portfolio") },
    { n: "Go to Metrics", k: "stats metrics", f: go("#stats") },
    { n: "Go to Headquarters", k: "hq", f: go("#hq") },
    { n: "Go to Contact", k: "contact", f: go("#contact") },
    { n: "Back to top", k: "top", f: go("#top") },
  ];
  let sel = 0, shown = cmds;
  function paint() {
    list.innerHTML = shown.map((c, i) => `<li class="${i === sel ? "sel" : ""}" data-i="${i}">${c.n}<small>↵</small></li>`).join("");
  }
  function open() { p.hidden = false; input.value = ""; shown = cmds; sel = 0; paint(); input.focus(); }
  const close = () => (p.hidden = true);
  const run = (c) => { close(); c && c.f(); };
  $("#openPalette").addEventListener("click", open);
  p.addEventListener("click", (e) => e.target === p && close());
  list.addEventListener("click", (e) => { const li = e.target.closest("li"); if (li) run(shown[+li.dataset.i]); });
  input.addEventListener("input", () => { const q = input.value.toLowerCase(); shown = cmds.filter((c) => (c.n + c.k).toLowerCase().includes(q)); sel = 0; paint(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { sel = (sel + 1) % shown.length; paint(); e.preventDefault(); }
    if (e.key === "ArrowUp") { sel = (sel - 1 + shown.length) % shown.length; paint(); e.preventDefault(); }
    if (e.key === "Enter") run(shown[sel]);
    if (e.key === "Escape") close();
  });
  addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); p.hidden ? open() : close(); } });
})();

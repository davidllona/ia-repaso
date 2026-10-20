/* Experimento: DBSCAN interactivo: núcleo, borde y ruido */
Lab.register("curso1/c1m4-dbscan", function (root, api) {
/* ---- utilidades compartidas por los experimentos del módulo 4 (se copian dentro de cada demo) ---- */
function hexToRgb(h) {
  h = String(h).trim();
  if (h.charAt(0) === "#") {
    if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }
  var m = h.match(/\d+(\.\d+)?/g);
  return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
}
/* Mezcla dos colores del tema: así hay más de 4 colores sin escribir ninguno a mano. */
function mix(a, b, t) {
  var x = hexToRgb(a), y = hexToRgb(b);
  return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * t) + "," + Math.round(x[1] + (y[1] - x[1]) * t) + "," + Math.round(x[2] + (y[2] - x[2]) * t) + ")";
}
function palette(C) {
  return [C.cobalto, C.terracota, C.oliva, C.marker, mix(C.cobalto, C.terracota, 0.5), mix(C.cobalto, C.paper, 0.45),
    mix(C.terracota, C.marker, 0.55), mix(C.oliva, C.marker, 0.5), mix(C.terracota, C.ink, 0.55), mix(C.oliva, C.ink, 0.6)];
}
/* Forma distinta por grupo (ayuda a quien no distingue bien los colores). */
function shape(ctx, k, x, y, r, fill, stroke, sw) {
  ctx.beginPath();
  var s = k % 4;
  if (s === 0) ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (s === 1) ctx.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8);
  else if (s === 2) { ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r * 1.05, y + r * 0.85); ctx.lineTo(x - r * 1.05, y + r * 0.85); ctx.closePath(); }
  else { ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 1.2, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r * 1.2, y); ctx.closePath(); }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 1; ctx.stroke(); }
}
function cross(ctx, x, y, r, color, w) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w || 2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); ctx.restore();
}
/* Marco del gráfico sin números en los ejes (los datos son de ejemplo). */
function frame(ctx, plot, C, grid) {
  var b = plot.box;
  ctx.save(); ctx.fillStyle = C.surface; ctx.fillRect(b.x, b.y, b.w, b.h);
  if (grid !== false) {
    var i;
    for (i = 1; i < 6; i++) {
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.globalAlpha = 0.55; ctx.beginPath();
      ctx.moveTo(b.x + b.w * i / 6, b.y); ctx.lineTo(b.x + b.w * i / 6, b.y + b.h);
      ctx.moveTo(b.x, b.y + b.h * i / 6); ctx.lineTo(b.x + b.w, b.y + b.h * i / 6); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.restore();
}
/* Rótulos de los ejes: cada punto es un usuario de la plataforma, situado según lo que le gusta. */
function axisCaps(ctx, plot, C, xt, yt) {
  var b = plot.box, D = api.d;
  D.text(ctx, xt, b.x + b.w / 2, b.y + b.h + 14, { size: 10.5, align: "center", color: C.ink2 });
  D.text(ctx, yt, b.x - 6, b.y + b.h / 2, { size: 10.5, align: "center", color: C.ink2, rotate: -Math.PI / 2 });
}
function sq2(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return dx * dx + dy * dy; }
function dist2(a, b) { return Math.sqrt(sq2(a, b)); }

/* ---- K-Means ---- */
function kAssign(P, C) {
  var lab = new Array(P.length), i, k;
  for (i = 0; i < P.length; i++) {
    var best = 0, bd = Infinity;
    for (k = 0; k < C.length; k++) { var dd = sq2(P[i], C[k]); if (dd < bd) { bd = dd; best = k; } }
    lab[i] = best;
  }
  return lab;
}
function kUpdate(P, lab, C) {
  var K = C.length, s = [], n = [], i, k;
  for (k = 0; k < K; k++) { s.push([0, 0]); n.push(0); }
  for (i = 0; i < P.length; i++) { if (lab[i] < 0) continue; s[lab[i]][0] += P[i][0]; s[lab[i]][1] += P[i][1]; n[lab[i]]++; }
  return C.map(function (c, k2) { return n[k2] ? [s[k2][0] / n[k2], s[k2][1] / n[k2]] : [c[0], c[1]]; });
}
function kInertia(P, lab, C) {
  var s = 0, i; for (i = 0; i < P.length; i++) if (lab[i] >= 0) s += sq2(P[i], C[lab[i]]); return s;
}
function kppInit(P, K, r) {
  var C = [P[r.int(0, P.length - 1)].slice()], i, k;
  while (C.length < K) {
    var d = P.map(function (p) { var m = Infinity; for (var j = 0; j < C.length; j++) m = Math.min(m, sq2(p, C[j])); return m; });
    var tot = 0; for (i = 0; i < d.length; i++) tot += d[i];
    var u = r.next() * tot, acc = 0, pick = P.length - 1;
    for (i = 0; i < d.length; i++) { acc += d[i]; if (acc >= u) { pick = i; break; } }
    C.push(P[pick].slice());
  }
  return C;
}
function kmeansRun(P, C0, maxIter) {
  var C = C0.map(function (c) { return c.slice(); }), lab = kAssign(P, C), it = 0, changed = true;
  while (changed && it < (maxIter || 100)) {
    C = kUpdate(P, lab, C);
    var nl = kAssign(P, C); changed = false;
    for (var i = 0; i < P.length; i++) if (nl[i] !== lab[i]) { changed = true; break; }
    lab = nl; it++;
  }
  return { C: C, lab: lab, inertia: kInertia(P, lab, C), iters: it };
}
function kmeansBest(P, K, seed, nInit) {
  var r = api.rng(seed), best = null, t;
  for (t = 0; t < (nInit || 8); t++) {
    var run = kmeansRun(P, kppInit(P, K, r), 100);
    if (!best || run.inertia < best.inertia) best = run;
  }
  return best;
}
/* ---- Silhouette y Davies-Bouldin ---- */
function silhouetteSamples(P, lab) {
  var n = P.length, K = 0, i, j, k;
  for (i = 0; i < n; i++) if (lab[i] + 1 > K) K = lab[i] + 1;
  var s = new Array(n), cnt = new Array(K).fill(0);
  for (i = 0; i < n; i++) if (lab[i] >= 0) cnt[lab[i]]++;
  for (i = 0; i < n; i++) {
    if (lab[i] < 0 || cnt[lab[i]] < 2) { s[i] = 0; continue; }
    var sum = new Array(K).fill(0);
    for (j = 0; j < n; j++) if (j !== i && lab[j] >= 0) sum[lab[j]] += dist2(P[i], P[j]);
    var a = sum[lab[i]] / (cnt[lab[i]] - 1), b = Infinity;
    for (k = 0; k < K; k++) if (k !== lab[i] && cnt[k] > 0) b = Math.min(b, sum[k] / cnt[k]);
    s[i] = b === Infinity ? 0 : (b - a) / Math.max(a, b);
  }
  return s;
}
function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }
function daviesBouldin(P, lab, C) {
  var K = C.length, sc = new Array(K).fill(0), cn = new Array(K).fill(0), i, j;
  for (i = 0; i < P.length; i++) { sc[lab[i]] += dist2(P[i], C[lab[i]]); cn[lab[i]]++; }
  for (i = 0; i < K; i++) sc[i] = cn[i] ? sc[i] / cn[i] : 0;
  var tot = 0;
  for (i = 0; i < K; i++) {
    var worst = 0;
    for (j = 0; j < K; j++) if (j !== i) { var dd = dist2(C[i], C[j]); if (dd > 0) worst = Math.max(worst, (sc[i] + sc[j]) / dd); }
    tot += worst;
  }
  return tot / K;
}
/* ---- DBSCAN (distancia <= eps, min_samples cuenta al propio punto: igual que scikit-learn) ---- */
function dbscan(P, eps, minPts) {
  var n = P.length, nb = new Array(n), i, j, e2 = eps * eps + 1e-12;
  for (i = 0; i < n; i++) nb[i] = [];
  for (i = 0; i < n; i++) { nb[i].push(i); for (j = i + 1; j < n; j++) if (sq2(P[i], P[j]) <= e2) { nb[i].push(j); nb[j].push(i); } }
  var lab = new Array(n).fill(-1), core = new Array(n), c = 0;
  for (i = 0; i < n; i++) core[i] = nb[i].length >= minPts;
  for (i = 0; i < n; i++) {
    if (!core[i] || lab[i] !== -1) continue;
    lab[i] = c; var stack = [i];
    while (stack.length) {
      var p = stack.pop();
      if (!core[p]) continue;
      for (j = 0; j < nb[p].length; j++) { var q = nb[p][j]; if (lab[q] === -1) { lab[q] = c; stack.push(q); } }
    }
    c++;
  }
  var type = lab.map(function (l, idx) { return l === -1 ? "ruido" : (core[idx] ? "nucleo" : "borde"); });
  return { lab: lab, core: core, nb: nb, type: type, k: c };
}
/* ---- Índice de Rand ajustado ---- */
function ari(a, b) {
  var n = a.length, ma = {}, mb = {}, mab = {}, i;
  function c2(x) { return x * (x - 1) / 2; }
  for (i = 0; i < n; i++) {
    var ka = String(a[i]), kb = String(b[i]), kk = ka + "|" + kb;
    ma[ka] = (ma[ka] || 0) + 1; mb[kb] = (mb[kb] || 0) + 1; mab[kk] = (mab[kk] || 0) + 1;
  }
  var sij = 0, sa = 0, sb = 0, key;
  for (key in mab) sij += c2(mab[key]);
  for (key in ma) sa += c2(ma[key]);
  for (key in mb) sb += c2(mb[key]);
  var exp = sa * sb / c2(n), mx = (sa + sb) / 2;
  return mx === exp ? 1 : (sij - exp) / (mx - exp);
}
/* ---- Autovalores de una matriz simétrica (método de Jacobi) ---- */
function jacobiEigen(A0) {
  var n = A0.length, A = A0.map(function (r) { return r.slice(); }), V = [], i, j, k;
  for (i = 0; i < n; i++) { V.push(new Array(n).fill(0)); V[i][i] = 1; }
  for (var sweep = 0; sweep < 60; sweep++) {
    var off = 0;
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-18) break;
    for (var p = 0; p < n - 1; p++) for (var q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-14) continue;
      var th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      var t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      var c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (k = 0; k < n; k++) { var akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (k = 0; k < n; k++) { var apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (k = 0; k < n; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  var idx = []; for (i = 0; i < n; i++) idx.push(i);
  idx.sort(function (x, y) { return A[y][y] - A[x][x]; });
  return { values: idx.map(function (i2) { return A[i2][i2]; }),
    vectors: idx.map(function (i2) { var v = []; for (var r2 = 0; r2 < n; r2++) v.push(V[r2][i2]); return v; }) };
}

var EPS = 0.8, MIN = 5, mode = "inspect", P = [], base = 0, sel = 0, res = null, lastAdd = null;
function gen() {
  var r = api.rng(33), t, i, R = 3.3, cx = 3.7, cy = 3.3; P = [];
  for (i = 0; i < 56; i++) { t = Math.PI * i / 55; P.push([cx + R * Math.cos(t) + r.normal(0, 0.14), cy + R * Math.sin(t) + r.normal(0, 0.14)]); }
  for (i = 0; i < 56; i++) { t = Math.PI * i / 55; P.push([cx + R - R * Math.cos(t) + r.normal(0, 0.14), cy + 0.5 * R - R * Math.sin(t) + r.normal(0, 0.14)]); }
  for (i = 0; i < 30; i++) P.push([13.2 + r.normal(0, 0.6), 6.8 + r.normal(0, 0.6)]);
  for (i = 0; i < 12; i++) P.push([r.range(0.4, 15.6), r.range(0.4, 9.6)]);
  base = P.length;
}
function run() { res = dbscan(P, EPS, MIN); }
function startSel() { for (var i = 0; i < P.length; i++) if (res.core[i]) { sel = i; return; } sel = 0; }

var view = api.view(root, { aspect: 1.6, minH: 230, maxH: 600, drag: true, label: "Usuarios situados según sus gustos y coloreados según DBSCAN: núcleo, borde y ruido" });
var plot = api.plot(view, { xr: [0, 16], yr: [0, 10], pad: { l: 18, r: 8, t: 8, b: 22 } });
var ui = api.controls(root);
ui.slider({ label: "eps (radio del vecindario)", min: 0.15, max: 2.4, step: 0.05, value: EPS, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { EPS = v; run(); update(); } });
ui.slider({ label: "min_samples (usuarios mínimos para ser núcleo)", min: 2, max: 12, step: 1, value: MIN, onInput: function (v) { MIN = v; run(); update(); } });
ui.segmented({ label: "Al tocar el gráfico…", options: [["inspect", "Inspeccionar un usuario"], ["add", "Añadir usuarios"]], value: mode, onChange: function (v) { mode = v; update(); } });
ui.button("Quitar los usuarios añadidos", function () { P.length = base; run(); if (sel >= P.length) sel = 0; update(); });
var out = api.readout(root);
var lg = api.el("div", { class: "lab-legend" });
lg.appendChild(api.el("span", { text: "● núcleo (relleno)" })); lg.appendChild(api.el("span", { text: "○ borde (más pequeño, hueco)" })); lg.appendChild(api.el("span", { text: "✕ ruido" })); lg.appendChild(api.el("span", { text: "forma y color = grupo" }));
root.appendChild(lg);

function fit() { var b = plot.box; plot.xr = [0, 10 * b.w / b.h]; }
function draw(ctx, w, h, C) {
  var D = api.d, pal = palette(C), i, j;
  fit(); frame(ctx, plot, C); axisCaps(ctx, plot, C, "gusto por la acción →", "gusto por la comedia →"); ctx.save(); plot.clip(ctx);
  var sc = plot.x(1) - plot.x(0);
  // vecindario del punto inspeccionado
  if (res && sel < P.length) {
    var sx = plot.x(P[sel][0]), sy = plot.y(P[sel][1]);
    ctx.fillStyle = mix(C.terracota, C.surface, 0.82); ctx.beginPath(); ctx.arc(sx, sy, EPS * sc, 0, Math.PI * 2); ctx.fill();
    D.circle(ctx, sx, sy, EPS * sc, null, C.terracota, 2);
    res.nb[sel].forEach(function (q) { if (q !== sel) D.line(ctx, sx, sy, plot.x(P[q][0]), plot.y(P[q][1]), C.terracota, 1.2, [3, 3]); });
  }
  for (i = 0; i < P.length; i++) {
    var px = plot.x(P[i][0]), py = plot.y(P[i][1]), t = res.type[i], k = res.lab[i];
    if (t === "ruido") cross(ctx, px, py, 3.6, C.ink, 1.8);
    else if (t === "nucleo") shape(ctx, k, px, py, 4.9, pal[k % 10], C.ink, 0.8);
    else shape(ctx, k, px, py, 3.7, mix(pal[k % 10], C.surface, 0.7), pal[k % 10], 1.8);
  }
  if (res && sel < P.length) { D.circle(ctx, plot.x(P[sel][0]), plot.y(P[sel][1]), 10, null, C.ink, 2.2); }
  ctx.restore();
}
function update() {
  view.redraw();
  var nc = 0, nb = 0, nn = 0, i; res.type.forEach(function (t) { if (t === "nucleo") nc++; else if (t === "borde") nb++; else nn++; });
  var s = "eps = <b>" + EPS.toFixed(2) + "</b> · min_samples = <b>" + MIN + "</b> → <b>" + res.k + " grupos</b> · núcleo: <b>" + nc + "</b> · borde: <b>" + nb + "</b> · ruido: <b>" + nn + "</b> · usuarios totales: <b>" + P.length + "</b>";
  if (sel < P.length) {
    var cnt = res.nb[sel].length, t = res.type[sel];
    s += "<br>Usuario marcado: tiene <b>" + cnt + "</b> usuarios dentro de eps (contándose a sí mismo) " + (cnt >= MIN ? "≥" : "<") + " " + MIN + " → <b>" + (t === "nucleo" ? "NÚCLEO" : t === "borde" ? "BORDE" : "RUIDO") + "</b>" +
      (t === "borde" ? " (no llega al mínimo, pero está dentro del radio de un núcleo)" : t === "ruido" ? " (no llega al mínimo y ningún núcleo lo alcanza)" : "");
  }
  if (nn > P.length * 0.5) s += "<br><span class='bad'>Casi todo es ruido: eps es demasiado pequeño (o min_samples demasiado grande) para esta densidad.</span>";
  else if (res.k === 1 && nn < P.length * 0.1) s += "<br><span class='bad'>Todo se ha fundido en un solo grupo: eps es demasiado grande.</span>";
  else if (res.k >= 3 && nn > 0 && nn < P.length * 0.25) s += "<br><span class='good'>Buenos parámetros para estos datos: grupos con la forma real y el ruido marcado aparte.</span>";
  out.set(s);
}
function nearest(px, py) {
  var best = -1, bd = 26;
  for (var i = 0; i < P.length; i++) { var d = Math.hypot(plot.x(P[i][0]) - px, plot.y(P[i][1]) - py); if (d < bd) { bd = d; best = i; } }
  return best;
}
function act(px, py, first) {
  if (!plot.inside(px, py)) return;
  if (mode === "inspect") { var n = nearest(px, py); if (n >= 0 && n !== sel) { sel = n; update(); } }
  else {
    var wx = plot.ix(px), wy = plot.iy(py);
    if (!first && lastAdd && Math.hypot(wx - lastAdd[0], wy - lastAdd[1]) < 0.22) return;
    if (P.length - base >= 200) return;
    P.push([wx, wy]); lastAdd = [wx, wy]; run(); update();
  }
}
view.pointer({
  down: function (px, py) { lastAdd = null; act(px, py, true); },
  drag: function (px, py) { act(px, py, false); },
  move: function (px, py, e, down) { if (!down && mode === "inspect") act(px, py, false); }
});
gen(); run(); startSel(); view.draw(draw); update();

});

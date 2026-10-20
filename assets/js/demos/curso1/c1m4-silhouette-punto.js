/* Experimento: Silhouette de un punto: a(i), b(i) y s(i) en vivo */
Lab.register("curso1/c1m4-silhouette-punto", function (root, api) {
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

var CEN = [[3.6, 3.2], [12.2, 3.6], [8.2, 7.9]], P = [], L = [], X = [5.3, 4.6], own = 0, showLines = true;
(function () {
  var r = api.rng(12), k, i;
  for (k = 0; k < 3; k++) for (i = 0; i < 7; i++) { P.push([CEN[k][0] + r.normal(0, 0.95), CEN[k][1] + r.normal(0, 0.95)]); L.push(k); }
})();
var view = api.view(root, { aspect: 1.6, minH: 230, maxH: 600, drag: true, label: "Tres grupos de puntos y un punto arrastrable cuyo silhouette se calcula en vivo" });
var plot = api.plot(view, { xr: [0, 16], yr: [0, 10], pad: { l: 8, r: 8, t: 8, b: 8 } });
var gview = api.view(root, { aspect: 9, minH: 62, maxH: 80, label: "Escala del silhouette de -1 a 1 con la posición del punto" });
var ui = api.controls(root), out = api.readout(root);
api.legend(root, [[api.colors().cobalto, "grupo 1"], [api.colors().terracota, "grupo 2"], [api.colors().oliva, "grupo 3"]]);
ui.segmented({ label: "El punto arrastrable pertenece al…", options: [[0, "grupo 1"], [1, "grupo 2"], [2, "grupo 3"]], value: 0, onChange: function (v) { own = v; update(); } });
ui.toggle({ label: "Mostrar distancias y círculos a y b", value: true, onChange: function (v) { showLines = v; update(); } });

function calc() {
  var sum = [0, 0, 0], cnt = [0, 0, 0], i, k;
  for (i = 0; i < P.length; i++) { sum[L[i]] += dist2(X, P[i]); cnt[L[i]]++; }
  var a = sum[own] / cnt[own], b = Infinity, bk = -1;
  for (k = 0; k < 3; k++) if (k !== own) { var m = sum[k] / cnt[k]; if (m < b) { b = m; bk = k; } }
  var s = (b - a) / Math.max(a, b);
  var P2 = P.concat([X]), L2 = L.concat([own]), ss = silhouetteSamples(P2, L2);
  return { a: a, b: b, bk: bk, s: s, mean: mean(ss) };
}
function fit() { var b = plot.box; plot.xr = [0, 10 * b.w / b.h]; }
function draw(ctx, w, h, C) {
  var D = api.d, pal = palette(C), i, r = calc();
  fit(); frame(ctx, plot, C); ctx.save(); plot.clip(ctx);
  var xx = plot.x(X[0]), xy = plot.y(X[1]), sc = plot.x(1) - plot.x(0);
  if (showLines) {
    D.circle(ctx, xx, xy, r.b * sc, null, pal[r.bk], 2);
    D.circle(ctx, xx, xy, r.a * sc, null, pal[own], 2);
    for (i = 0; i < P.length; i++) {
      if (L[i] === own) D.line(ctx, xx, xy, plot.x(P[i][0]), plot.y(P[i][1]), pal[own], 1.1, [2, 3]);
      else if (L[i] === r.bk) D.line(ctx, xx, xy, plot.x(P[i][0]), plot.y(P[i][1]), pal[r.bk], 1.1, [6, 4]);
    }
  }
  for (i = 0; i < P.length; i++) shape(ctx, L[i], plot.x(P[i][0]), plot.y(P[i][1]), 4.8, pal[L[i]], C.ink, 0.9);
  shape(ctx, own, xx, xy, 8.5, pal[own], C.ink, 3);
  D.text(ctx, "x", xx, xy + 4.2, { size: 11, weight: 600, align: "center", color: C.ink });
  ctx.restore();
  if (showLines) {
    // etiquetas a y b sobre sus círculos, con fondo para que se lean
    function tag(txt, ang, rad, col) {
      var tx = xx + Math.cos(ang) * rad * sc, ty = xy + Math.sin(ang) * rad * sc, bx = plot.box;
      tx = Math.max(bx.x + 14, Math.min(bx.x + bx.w - 14, tx)); ty = Math.max(bx.y + 12, Math.min(bx.y + bx.h - 12, ty));
      ctx.save(); ctx.fillStyle = C.paper; ctx.globalAlpha = 0.9; ctx.fillRect(tx - 11, ty - 9, 22, 17); ctx.restore();
      D.text(ctx, txt, tx, ty + 4, { size: 12, weight: 600, align: "center", color: col, mono: true });
    }
    tag("a", -Math.PI / 4, r.a, C.ink); tag("b", Math.PI / 4, r.b, C.ink);
  }
}
function drawG(ctx, w, h, C) {
  var D = api.d, r = calc(), L0 = 30, R0 = w - 30, y0 = 18, bh = 16;
  function gx(v) { return L0 + (v + 1) / 2 * (R0 - L0); }
  var gr = ctx.createLinearGradient(L0, 0, R0, 0); gr.addColorStop(0, C.terracotaWash); gr.addColorStop(0.5, C.paper2); gr.addColorStop(1, C.olivaWash);
  ctx.fillStyle = gr; ctx.fillRect(L0, y0, R0 - L0, bh); D.rect(ctx, L0, y0, R0 - L0, bh, null, C.ink, 1.2);
  [-1, -0.5, 0, 0.5, 1].forEach(function (t) { D.line(ctx, gx(t), y0 + bh, gx(t), y0 + bh + 4, C.ink, 1); D.text(ctx, String(t), gx(t), y0 + bh + 17, { size: 10.5, align: "center", color: C.muted, mono: true }); });
  var mx = gx(Math.max(-1, Math.min(1, r.s)));
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(mx, y0 - 2); ctx.lineTo(mx - 6, y0 - 12); ctx.lineTo(mx + 6, y0 - 12); ctx.closePath(); ctx.fill();
  D.line(ctx, mx, y0, mx, y0 + bh, C.ink, 3);
}
function update() {
  view.redraw(); gview.redraw();
  var r = calc(), cls, msg;
  if (r.s >= 0.5) { cls = "good"; msg = "Bien asignado: está claramente más cerca de su grupo que de cualquier otro."; }
  else if (r.s >= 0.1) { cls = ""; msg = "Asignación floja: el punto está en una zona intermedia."; }
  else if (r.s >= -0.1) { cls = "bad"; msg = "Punto frontera: a ≈ b, podría estar en cualquiera de los dos grupos."; }
  else { cls = "bad"; msg = "Probablemente mal asignado: está más cerca del grupo " + (r.bk + 1) + " que del suyo."; }
  out.set("a(x) = distancia media a su grupo (" + (own + 1) + ") = <b>" + r.a.toFixed(2) + "</b><br>" +
    "b(x) = distancia media al grupo vecino más cercano (" + (r.bk + 1) + ") = <b>" + r.b.toFixed(2) + "</b><br>" +
    "s(x) = (b − a) / máx(a, b) = (" + r.b.toFixed(2) + " − " + r.a.toFixed(2) + ") / " + Math.max(r.a, r.b).toFixed(2) + " = <b>" + r.s.toFixed(2) + "</b><br>" +
    "<span class='" + cls + "'>" + msg + "</span><br>Silhouette medio de los 22 puntos: <b>" + r.mean.toFixed(2) + "</b>");
}
function move(px, py) {
  if (!plot.inside(px, py)) return;
  X = [Math.max(0.3, Math.min(plot.xr[1] - 0.3, plot.ix(px))), Math.max(0.3, Math.min(9.7, plot.iy(py)))]; update();
}
view.pointer({ down: move, drag: move });
view.draw(draw); gview.draw(drawG); update();

});

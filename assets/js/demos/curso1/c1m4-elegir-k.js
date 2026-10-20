/* Experimento: Elegir K con el codo y el silhouette */
Lab.register("curso1/c1m4-elegir-k", function (root, api) {
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

var G = 4, SD = 1.0, K = 4, seed = 21, showTrue = true, P = [], truth = [], res = [], inertia1 = 1;
var KMAX = 9;
function centers(g) {
  var out = [], i;
  for (i = 0; i < g; i++) { var a = -Math.PI / 2 + 2 * Math.PI * i / g + (g === 2 ? Math.PI / 2 : 0); out.push([8 + 5.6 * Math.cos(a), 5 + 2.8 * Math.sin(a)]); }
  return out;
}
function compute() {
  var r = api.rng(seed), cs = centers(G), i, k; P = []; truth = [];
  for (k = 0; k < G; k++) for (i = 0; i < 36; i++) { P.push([cs[k][0] + r.normal(0, SD), cs[k][1] + r.normal(0, SD)]); truth.push(k); }
  var mu = [mean(P.map(function (p) { return p[0]; })), mean(P.map(function (p) { return p[1]; }))];
  inertia1 = P.reduce(function (s, p) { return s + sq2(p, mu); }, 0);
  res = [null];
  for (k = 2; k <= KMAX; k++) {
    var run = kmeansBest(P, k, 7 + k, 6), ss = silhouetteSamples(P, run.lab);
    res.push({ k: k, run: run, inertia: run.inertia, sil: mean(ss), db: daviesBouldin(P, run.lab, run.C) });
  }
}
function bestBy(f, dir) { var b = null; for (var k = 2; k <= KMAX; k++) if (!b || dir * f(res[k - 1]) > dir * f(b)) b = res[k - 1]; return b; }

var row = api.el("div", { class: "lab-row" }), left = api.el("div"), right = api.el("div", { style: { display: "flex", flexDirection: "column", gap: "0.6rem" } });
row.appendChild(left); row.appendChild(right); root.appendChild(row);
var view = api.view(left, { aspect: 1.6, minH: 190, maxH: 420, label: "Puntos coloreados según el resultado de K-Means con el K elegido" });
var plot = api.plot(view, { xr: [0, 16], yr: [0, 10], pad: { l: 6, r: 6, t: 6, b: 6 } });
var v1 = api.view(right, { aspect: 2.5, minH: 125, maxH: 200, label: "Curva del codo: inercia según K" });
var p1 = api.plot(v1, { xr: [1, KMAX], yr: [0, 1], xticks: KMAX - 1, yticks: 2, pad: { l: 40, r: 10, t: 22, b: 22 }, xfmt: function (t) { return Math.round(t); } });
var v2 = api.view(right, { aspect: 2.5, minH: 125, maxH: 200, label: "Silhouette medio según K" });
var p2 = api.plot(v2, { xr: [1, KMAX], yr: [0, 1], xticks: KMAX - 1, yticks: 2, pad: { l: 40, r: 10, t: 22, b: 22 }, xfmt: function (t) { return Math.round(t); } });
api.legend(root, [[api.colors().ink, "línea continua: el K que pruebas"], [api.colors().oliva, "línea discontinua: grupos reales"]]);
var ui = api.controls(root);
ui.slider({ label: "Grupos reales que hay en los datos", min: 2, max: 6, step: 1, value: G, onInput: function (v) { G = v; compute(); K = Math.min(Math.max(2, K), KMAX); update(); } });
ui.slider({ label: "Dispersión de cada grupo", min: 0.5, max: 2.2, step: 0.1, value: SD, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { SD = v; compute(); update(); } });
var ks = ui.slider({ label: "K que pruebas", min: 2, max: KMAX, step: 1, value: K, onInput: function (v) { K = v; update(); } });
ui.toggle({ label: "Revelar los grupos reales", value: true, onChange: function (v) { showTrue = v; update(); } });
ui.button("Datos nuevos", function () { seed += 5; compute(); update(); });
var out = api.readout(root);
var tbl = api.table(root, ["K", "Inercia", "Silhouette", "D-B"]);

function fit() { var b = plot.box; plot.xr = [0, 10 * b.w / b.h]; }
function drawScatter(ctx, w, h, C) {
  var D = api.d, pal = palette(C), r = res[K - 1], i;
  fit(); frame(ctx, plot, C, false); ctx.save(); plot.clip(ctx);
  for (i = 0; i < P.length; i++) shape(ctx, r.run.lab[i], plot.x(P[i][0]), plot.y(P[i][1]), 3.6, pal[r.run.lab[i]], C.ink, 0.6);
  for (i = 0; i < r.run.C.length; i++) { D.circle(ctx, plot.x(r.run.C[i][0]), plot.y(r.run.C[i][1]), 8, pal[i], C.ink, 2.5); }
  ctx.restore();
}
function curve(ctx, plt, C, vals, label, col, bestK, yfmt, ymin) {
  var D = api.d, k;
  plt.axes(ctx);
  var pts = []; for (k = 0; k < vals.length; k++) pts.push([plt.x(vals[k][0]), plt.y(vals[k][1])]);
  if (showTrue) { D.line(ctx, plt.x(G), plt.box.y, plt.x(G), plt.box.y + plt.box.h, C.oliva, 2, [5, 4]); }
  D.line(ctx, plt.x(K), plt.box.y, plt.x(K), plt.box.y + plt.box.h, C.ink, 1.5);
  D.path(ctx, pts, col, 2.5);
  vals.forEach(function (v) { D.circle(ctx, plt.x(v[0]), plt.y(v[1]), v[0] === K ? 6 : 3.6, v[0] === K ? col : C.paper, col, 2); });
  if (bestK) { var bv = vals.filter(function (v) { return v[0] === bestK; })[0]; if (bv) D.circle(ctx, plt.x(bv[0]), plt.y(bv[1]), 10, null, C.terracota, 2.5); }
  D.text(ctx, label, plt.box.x, plt.box.y - 7, { size: 11.5, weight: 600, color: C.ink2 });
}
function draw1(ctx, w, h, C) {
  var vals = [[1, 1]]; for (var k = 2; k <= KMAX; k++) vals.push([k, res[k - 1].inertia / inertia1]);
  curve(ctx, p1, C, vals, "Inercia (relativa a K = 1)", C.cobalto, null);
}
function draw2(ctx, w, h, C) {
  var vals = [], lo = 0; for (var k = 2; k <= KMAX; k++) { vals.push([k, res[k - 1].sil]); lo = Math.min(lo, res[k - 1].sil); }
  p2.yr = [Math.min(0, Math.floor(lo * 10) / 10), 1];
  curve(ctx, p2, C, vals, "Silhouette medio (círculo = máximo)", C.terracota, bestBy(function (r) { return r.sil; }, 1).k);
}
function update() {
  view.redraw(); v1.redraw(); v2.redraw();
  var r = res[K - 1], bs = bestBy(function (x) { return x.sil; }, 1), bd = bestBy(function (x) { return x.db; }, -1);
  out.set("K = <b>" + K + "</b> → inercia = <b>" + r.inertia.toFixed(1) + "</b> · silhouette = <b>" + r.sil.toFixed(3) + "</b> · Davies–Bouldin (D-B) = <b>" + r.db.toFixed(3) + "</b><br>" +
    "Mejor K según silhouette: <b>" + bs.k + "</b> · según Davies–Bouldin (menor es mejor): <b>" + bd.k + "</b> · grupos reales: <b>" + G + "</b><br>" +
    (bs.k === G ? "<span class='good'>El silhouette acierta el número real de grupos.</span>" : "<span class='bad'>El silhouette ya no coincide con los " + G + " grupos reales: cuando los grupos se solapan (más dispersión o más grupos en el mismo espacio) no hay un K «correcto» claro.</span>"));
  tbl.set(res.slice(1).map(function (x) {
    var cur = x.k === K, f = function (t) { return cur ? "<b>" + t + "</b>" : t; };
    return [f(x.k + (x.k === bs.k ? " ★" : "")), f(x.inertia.toFixed(1)), f(x.sil.toFixed(3)), f(x.db.toFixed(3))];
  }));
}
compute(); view.draw(drawScatter); v1.draw(draw1); v2.draw(draw2); update();

});

/* Experimento: K-Means frente a DBSCAN según la forma de los grupos */
Lab.register("curso1/c1m4-kmeans-vs-dbscan", function (root, api) {
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
  D.text(ctx, xt, b.x + b.w / 2, b.y + b.h + 13, { size: 10, align: "center", color: C.ink2 });
  D.text(ctx, yt, b.x - 5, b.y + b.h / 2, { size: 10, align: "center", color: C.ink2, rotate: -Math.PI / 2 });
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

var DS = "moons", seed = 4, K = 2, EPS = 0.75, MIN = 5, P = [], truth = [], km = null, db = null;
var DEF = { moons: [2, 0.75, 5], rings: [2, 1.1, 5], blobs: [3, 0.9, 5], noisy: [3, 1.2, 9] };
function gen() {
  var r = api.rng(seed * 7 + 1), i, t; P = []; truth = [];
  if (DS === "moons") {
    for (i = 0; i < 70; i++) { t = Math.PI * i / 69; P.push([4.4 + 3.4 * Math.cos(t) + r.normal(0, 0.2), 3.4 + 3.4 * Math.sin(t) + r.normal(0, 0.2)]); truth.push(0); }
    for (i = 0; i < 70; i++) { t = Math.PI * i / 69; P.push([4.4 + 3.4 - 3.4 * Math.cos(t) + r.normal(0, 0.2), 3.4 + 1.7 - 3.4 * Math.sin(t) + r.normal(0, 0.2)]); truth.push(1); }
    P = P.map(function (p) { return [p[0] + 1.4, p[1] + 0.9]; });
  } else if (DS === "rings") {
    for (i = 0; i < 70; i++) { t = r.range(0, 2 * Math.PI); P.push([8 + 1.8 * Math.cos(t) + r.normal(0, 0.16), 5 + 1.8 * Math.sin(t) + r.normal(0, 0.16)]); truth.push(0); }
    for (i = 0; i < 140; i++) { t = r.range(0, 2 * Math.PI); P.push([8 + 4.1 * Math.cos(t) + r.normal(0, 0.16), 5 + 4.1 * Math.sin(t) + r.normal(0, 0.16)]); truth.push(1); }
  } else {
    [[3.6, 3.3], [12.2, 3.6], [8, 7.7]].forEach(function (c, k) { for (i = 0; i < 45; i++) { P.push([c[0] + r.normal(0, 0.95), c[1] + r.normal(0, 0.95)]); truth.push(k); } });
    if (DS === "noisy") for (i = 0; i < 18; i++) { P.push([r.range(0.4, 15.6), r.range(0.4, 9.6)]); truth.push(3); }
  }
}
function runKM() { km = kmeansBest(P, K, 5 + seed, 8); }
function runDB() { db = dbscan(P, EPS, MIN); }

var row = api.el("div", { class: "lab-row" }), cl = api.el("div"), cr = api.el("div");
row.appendChild(cl); row.appendChild(cr); root.appendChild(row);
var hl = api.el("p", { style: { margin: "0 0 .3rem", fontWeight: "600", fontSize: ".9rem" } }), hr = api.el("p", { style: { margin: "0 0 .3rem", fontWeight: "600", fontSize: ".9rem" } });
cl.appendChild(hl); cr.appendChild(hr);
var v1 = api.view(cl, { aspect: 1.6, minH: 190, maxH: 420, label: "Resultado de K-Means sobre los usuarios elegidos" });
var v2 = api.view(cr, { aspect: 1.6, minH: 190, maxH: 420, label: "Resultado de DBSCAN sobre los mismos usuarios" });
var p1 = api.plot(v1, { xr: [0, 16], yr: [0, 10], pad: { l: 16, r: 5, t: 5, b: 20 } }), p2 = api.plot(v2, { xr: [0, 16], yr: [0, 10], pad: { l: 16, r: 5, t: 5, b: 20 } });
var ui = api.controls(root);
var segDS = ui.segmented({ label: "Datos", options: [["moons", "Dos lunas"], ["rings", "Dos anillos"], ["blobs", "Tres manchas"], ["noisy", "Manchas + ruido"]], value: DS, onChange: function (v) { DS = v; K = DEF[v][0]; EPS = DEF[v][1]; MIN = DEF[v][2]; sK.set(K, true); sE.set(EPS, true); sM.set(MIN, true); gen(); runKM(); runDB(); update(); } });
var sK = ui.slider({ label: "K-Means: K", min: 2, max: 6, step: 1, value: K, onInput: function (v) { K = v; runKM(); update(); } });
var sE = ui.slider({ label: "DBSCAN: eps", min: 0.2, max: 2.0, step: 0.05, value: EPS, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { EPS = v; runDB(); update(); } });
var sM = ui.slider({ label: "DBSCAN: min_samples", min: 2, max: 12, step: 1, value: MIN, onInput: function (v) { MIN = v; runDB(); update(); } });
ui.button("Datos nuevos", function () { seed++; gen(); runKM(); runDB(); update(); });
var out = api.readout(root);
var lg = api.el("div", { class: "lab-legend" }); lg.appendChild(api.el("span", { text: "forma y color = grupo que encuentra cada algoritmo" })); lg.appendChild(api.el("span", { text: "✕ = usuario suelto, ruido (solo DBSCAN)" })); root.appendChild(lg);

function fitP(p) { var b = p.box; p.xr = [0, 10 * b.w / b.h]; }
function scatter(ctx, plt, C, lab, big) {
  var pal = palette(C), i; fitP(plt); frame(ctx, plt, C, false); axisCaps(ctx, plt, C, "gusto por la acción →", "gusto por la comedia →"); ctx.save(); plt.clip(ctx);
  for (i = 0; i < P.length; i++) {
    var x = plt.x(P[i][0]), y = plt.y(P[i][1]);
    if (lab[i] < 0) cross(ctx, x, y, 3.2, C.ink, 1.6); else shape(ctx, lab[i], x, y, 3.5, pal[lab[i] % 10], C.ink, 0.6);
  }
  if (big) for (i = 0; i < km.C.length; i++) { api.d.circle(ctx, plt.x(km.C[i][0]), plt.y(km.C[i][1]), 8, pal[i], C.ink, 2.5); }
  ctx.restore();
}
function meanSilNoNoise(lab) {
  var idx = [], i; for (i = 0; i < lab.length; i++) if (lab[i] >= 0) idx.push(i);
  var k = new Set(idx.map(function (j) { return lab[j]; })).size; if (k < 2) return null;
  var s = silhouetteSamples(idx.map(function (j) { return P[j]; }), idx.map(function (j) { return lab[j]; }));
  return mean(s);
}
function update() {
  v1.redraw(); v2.redraw();
  var nn = db.lab.filter(function (l) { return l < 0; }).length;
  hl.textContent = "K-Means con K = " + K; hr.textContent = "DBSCAN con eps = " + EPS.toFixed(2) + ", min_samples = " + MIN;
  var a1 = ari(truth, km.lab), a2 = ari(truth, db.lab), s1 = meanSilNoNoise(km.lab), s2 = meanSilNoNoise(db.lab);
  out.set("K-Means: coincidencia con los grupos reales (índice de Rand ajustado) = <b>" + a1.toFixed(2) + "</b> · silhouette = <b>" + (s1 === null ? "—" : s1.toFixed(2)) + "</b><br>" +
    "DBSCAN: coincidencia con los grupos reales = <b>" + a2.toFixed(2) + "</b> · silhouette = <b>" + (s2 === null ? "—" : s2.toFixed(2)) + "</b> · <b>" + db.k + " grupos</b> + <b>" + nn + " usuarios sueltos (ruido)</b><br>" +
    "<span style='opacity:.8'>1,00 = coinciden exactamente con los grupos reales; 0 = como repartir al azar.</span>");
}
gen(); runKM(); runDB();
v1.draw(function (ctx, w, h, C) { scatter(ctx, p1, C, km.lab, true); }); v2.draw(function (ctx, w, h, C) { scatter(ctx, p2, C, db.lab, false); });
update();

});

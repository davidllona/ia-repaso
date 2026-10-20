/* Experimento: K-Means paso a paso (asignar, mover centroides, repetir) */
Lab.register("curso1/c1m4-kmeans-pasos", function (root, api) {
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

var seed = 5, K = 4, P = [], C = [], prevC = null, lab = null, labBefore = null, phase = "init", iter = 0, hist = [], converged = false, zones = true;
var initCount = 0, lastInit = "pp", bestInertia = 0, drag = -1, running = false, tick = 0;
var BAD = [[1.5, 2], [3, 3], [2.4, 7.6], [8, 5]];
var CENTERS = [[3.4, 3.6], [3.8, 7.6], [11.8, 3.2], [12.6, 7.2]];

function genData() {
  var r = api.rng(seed), i, k; P = [];
  for (k = 0; k < CENTERS.length; k++) for (i = 0; i < 20; i++) P.push([CENTERS[k][0] + r.normal(0, 1.15), CENTERS[k][1] + r.normal(0, 1.15)]);
  bestInertia = kmeansBest(P, K, 3, 10).inertia;
}
function resetRun() { lab = null; labBefore = null; prevC = null; phase = "init"; iter = 0; hist = []; converged = false; running = false; loop.stop(); }
function placeInit(kind) {
  lastInit = kind; initCount++;
  var r = api.rng(100 + initCount * 17 + seed);
  if (kind === "bad") {
    C = []; for (var k = 0; k < K; k++) C.push(k < BAD.length ? BAD[k].slice() : [r.range(1, 15), r.range(1, 9)]);
  } else if (kind === "rand") {
    C = []; for (var k2 = 0; k2 < K; k2++) C.push([r.range(1, 15), r.range(1, 9)]);
  } else C = kppInit(P, K, r);
  resetRun(); bestInertia = kmeansBest(P, K, 3, 10).inertia;
}

var view = api.view(root, { aspect: 1.6, minH: 230, maxH: 600, drag: true, label: "Usuarios de la plataforma situados según su gusto por la acción y por la comedia, con los centroides de K-Means, que se pueden arrastrar" });
var plot = api.plot(view, { xr: [0, 16], yr: [0, 10], pad: { l: 18, r: 8, t: 8, b: 22 } });
var ui = api.controls(root), out = api.readout(root);
api.legend(root, [[api.colors().muted, "usuario sin grupo"], [api.colors().cobalto, "tipo 1"], [api.colors().terracota, "tipo 2"], [api.colors().oliva, "tipo 3"], [api.colors().marker, "tipo 4"]]);

var kslider = ui.slider({ label: "K (cuántos tipos de espectador buscas)", min: 2, max: 6, step: 1, value: K, onInput: function (v) { K = v; placeInit("pp"); update(); } });
ui.button("1 · Asignar usuarios", function () { doAssign(); update(); });
ui.button("2 · Mover centroides", function () { doMove(); update(); });
ui.button("Ejecutar hasta converger", function () { run(); }, "primary");
ui.button("Centroides al azar", function () { placeInit("rand"); update(); });
ui.button("Centroides k-means++", function () { placeInit("pp"); update(); });
ui.button("Mala inicialización (ejemplo)", function () { K = 4; kslider.set(4, true); placeInit("bad"); update(); }, "warm");
ui.button("Datos nuevos", function () { seed += 3; genData(); placeInit(lastInit === "bad" ? "pp" : lastInit); update(); });
ui.toggle({ label: "Zonas de influencia", value: true, onChange: function (v) { zones = v; view.redraw(); } });

function doAssign() {
  var nl = kAssign(P, C);
  if (lab && phase === "updated" && labBefore) {
    var same = true; for (var i = 0; i < nl.length; i++) if (nl[i] !== labBefore[i]) { same = false; break; }
    if (same) converged = true;
  }
  lab = nl; phase = "assigned"; hist.push(kInertia(P, lab, C));
}
function doMove() {
  if (phase !== "assigned") { doAssign(); if (converged) return; }
  labBefore = lab.slice(); prevC = C.map(function (c) { return c.slice(); });
  C = kUpdate(P, lab, C); phase = "updated"; iter++; hist.push(kInertia(P, lab, C));
}
function stepAuto() {
  if (converged) return false;
  if (phase === "assigned") doMove(); else doAssign();
  update();
  return !converged;
}
var loop = api.loop(function () { if (stepAuto() === false) { running = false; update(); return false; } }, { fps: 1.8 });
function run() {
  if (converged) { placeInit(lastInit); }
  if (api.reduceMotion) { var guard = 0; while (!converged && guard++ < 200) { if (phase === "assigned") doMove(); else doAssign(); } update(); return; }
  running = true; loop.start();
}

function drawZones(ctx, C0, Cc) {
  var b = plot.box, step = Math.max(6, Math.round(b.w / 110)), x, y, pal = palette(Cc).map(function (c) { return mix(c, Cc.surface, 0.86); });
  ctx.save(); plot.clip(ctx);
  for (x = b.x; x < b.x + b.w; x += step) for (y = b.y; y < b.y + b.h; y += step) {
    var wx = plot.ix(x + step / 2), wy = plot.iy(y + step / 2), best = 0, bd = Infinity;
    for (var k = 0; k < C0.length; k++) { var dd = (wx - C0[k][0]) * (wx - C0[k][0]) + (wy - C0[k][1]) * (wy - C0[k][1]); if (dd < bd) { bd = dd; best = k; } }
    ctx.fillStyle = pal[best]; ctx.fillRect(x, y, step + 1, step + 1);
  }
  ctx.restore();
}
function fit() { var b = plot.box; plot.xr = [0, 10 * b.w / b.h]; }
function draw(ctx, w, h, Cc) {
  var D = api.d, pal = palette(Cc), i, k;
  fit(); frame(ctx, plot, Cc); axisCaps(ctx, plot, Cc, "gusto por la acción →", "gusto por la comedia →");
  if (zones) drawZones(ctx, C, Cc);
  ctx.save(); plot.clip(ctx);
  if (lab && phase === "assigned") for (i = 0; i < P.length; i++) D.line(ctx, plot.x(P[i][0]), plot.y(P[i][1]), plot.x(C[lab[i]][0]), plot.y(C[lab[i]][1]), pal[lab[i]], 1, [2, 3]);
  for (i = 0; i < P.length; i++) {
    var px = plot.x(P[i][0]), py = plot.y(P[i][1]);
    if (lab) shape(ctx, lab[i], px, py, 4.6, pal[lab[i]], Cc.ink, 0.8);
    else D.circle(ctx, px, py, 3.8, Cc.muted, Cc.paper, 1);
  }
  if (prevC && phase === "updated") for (k = 0; k < C.length; k++) {
    D.circle(ctx, plot.x(prevC[k][0]), plot.y(prevC[k][1]), 6, null, pal[k], 2);
    D.arrow(ctx, plot.x(prevC[k][0]), plot.y(prevC[k][1]), plot.x(C[k][0]), plot.y(C[k][1]), Cc.ink, 2);
  }
  for (k = 0; k < C.length; k++) {
    var cx = plot.x(C[k][0]), cy = plot.y(C[k][1]);
    D.circle(ctx, cx, cy, 11, pal[k], Cc.ink, 3);
    D.text(ctx, String(k + 1), cx, cy + 4.5, { size: 12, weight: 600, align: "center", color: Cc.ink });
  }
  ctx.restore();
}
function update() {
  view.redraw();
  var stepTxt = { init: "centroides colocados", assigned: "usuarios asignados al centroide más cercano", updated: "centroides movidos a la media de su grupo" }[phase];
  var cur = lab ? kInertia(P, lab, C) : null, sizes = "";
  if (lab) { var cnt = new Array(K).fill(0); lab.forEach(function (l) { cnt[l]++; }); sizes = "tamaños: <b>" + cnt.join(" · ") + "</b>"; }
  var s = "Iteración <b>" + iter + "</b> · estado: <b>" + stepTxt + "</b><br>" +
    "Inercia (suma de distancias² a su centroide): <b>" + (cur === null ? "—" : cur.toFixed(1)) + "</b>" + (sizes ? " · " + sizes : "") + "<br>" +
    "Historial de la inercia: <b>" + (hist.length ? hist.map(function (v) { return v.toFixed(0); }).join(" → ") : "—") + "</b>";
  if (converged) {
    var ratio = cur / bestInertia;
    s += ratio < 1.03 ? "<br><span class='good'>Convergido: ninguna asignación cambia. Es (casi) la mejor solución que se encuentra con 10 inicios k-means++ (inercia " + bestInertia.toFixed(1) + ").</span>"
      : "<br><span class='bad'>Convergido, pero en un mínimo local peor: " + cur.toFixed(1) + " frente a " + bestInertia.toFixed(1) + " con buenos inicios. K-Means no se da cuenta: solo baja desde donde empezó.</span>";
  } else if (running) s += "<br>Ejecutando…";
  out.set(s);
}
function inside(px, py) { return plot.inside(px, py); }
view.pointer({
  down: function (px, py) {
    var best = -1, bd = 22;
    for (var k = 0; k < C.length; k++) { var d = Math.hypot(plot.x(C[k][0]) - px, plot.y(C[k][1]) - py); if (d < bd) { bd = d; best = k; } }
    drag = best;
    if (drag >= 0) { if (lab || phase !== "init") { resetRun(); } }
  },
  drag: function (px, py) {
    if (drag < 0) return;
    C[drag] = [Math.max(0.2, Math.min(plot.xr[1] - 0.2, plot.ix(px))), Math.max(0.2, Math.min(9.8, plot.iy(py)))];
    update();
  },
  up: function () { if (drag >= 0) { drag = -1; update(); } }
});
genData(); placeInit("pp"); view.draw(draw); update();
return { destroy: function () { loop.stop(); } };

});

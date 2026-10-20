/* Experimento: PCA: gira la recta y busca la dirección de máxima varianza */
Lab.register("curso1/c1m4-pca-rotacion", function (root, api) {
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

var P = [], theta = 100, showErr = true, tween = null, N = 60, sxx, syy, sxy, total, th1, th2, lam1, lam2;
(function () {
  var r = api.rng(17), i, a = 28 * Math.PI / 180, raw = [];
  for (i = 0; i < N; i++) { var u = r.normal(0, 2.5), v = r.normal(0, 0.85); raw.push([u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)]); }
  var mx = mean(raw.map(function (p) { return p[0]; })), my = mean(raw.map(function (p) { return p[1]; }));
  P = raw.map(function (p) { return [p[0] - mx, p[1] - my]; });
  sxx = 0; syy = 0; sxy = 0;
  P.forEach(function (p) { sxx += p[0] * p[0]; syy += p[1] * p[1]; sxy += p[0] * p[1]; });
  sxx /= (N - 1); syy /= (N - 1); sxy /= (N - 1); total = sxx + syy;
  var tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(tr * tr / 4 - det);
  lam1 = tr / 2 + disc; lam2 = tr / 2 - disc;
  th1 = (0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI + 180) % 180; th2 = (th1 + 90) % 180;
})();
function stats(t) {
  var c = Math.cos(t * Math.PI / 180), s = Math.sin(t * Math.PI / 180), sum = 0, sum2 = 0, perp = 0;
  P.forEach(function (p) { var z = p[0] * c + p[1] * s; sum2 += z * z; var e = -p[0] * s + p[1] * c; perp += e * e; });
  return { cap: sum2 / (N - 1), lost: perp / (N - 1) };
}
var view = api.view(root, { aspect: 1.5, minH: 240, maxH: 520, drag: true, label: "Nube de puntos con una recta que se puede girar y las proyecciones de los puntos sobre ella" });
var plot = api.plot(view, { xr: [-6, 6], yr: [-4.5, 4.5], pad: { l: 8, r: 8, t: 8, b: 8 } });
var cview = api.view(root, { aspect: 3.0, minH: 140, maxH: 230, label: "Varianza capturada según el ángulo de la recta" });
var cplot = api.plot(cview, { xr: [0, 180], yr: [0, 1], xticks: 4, yticks: 2, xlabel: "ángulo de la recta (grados)", pad: { l: 44, r: 12, t: 22, b: 36 }, xfmt: function (v) { return Math.round(v) + "°"; }, yfmt: function (v) { return v.toFixed(1); } });
var ui = api.controls(root);
var sl = ui.slider({ label: "Ángulo de la recta de proyección", min: 0, max: 179, step: 1, value: theta, fmt: function (v) { return v + "°"; }, onInput: function (v) { tween = null; theta = v; update(); } });
ui.button("Ir a PC1 (máxima varianza)", function () { go(th1); }, "primary");
ui.button("Ir a PC2 (perpendicular)", function () { go(th2); });
ui.toggle({ label: "Mostrar errores de reconstrucción", value: true, onChange: function (v) { showErr = v; update(); } });
var out = api.readout(root);
var loop = api.loop(function (dt) {
  if (!tween) return false;
  tween.t = Math.min(1, tween.t + dt / 0.7); var e = 1 - Math.pow(1 - tween.t, 3);
  theta = tween.a + (tween.b - tween.a) * e; sl.set(Math.round(theta), true); update();
  if (tween.t >= 1) { theta = tween.b; tween = null; sl.set(Math.round(theta) % 180, true); update(); return false; }
}, { fps: 40 });
function go(target) {
  var a = theta, b = target; if (b - a > 90) b -= 180; if (a - b > 90) b += 180;
  if (api.reduceMotion) { theta = ((target % 180) + 180) % 180; sl.set(Math.round(theta), true); update(); return; }
  tween = { a: a, b: b, t: 0 }; loop.start();
}
function fit() { var b = plot.box, ratio = b.w / b.h; plot.xr = [-4.5 * ratio, 4.5 * ratio]; }
function draw(ctx, w, h, C) {
  var D = api.d, c = Math.cos(theta * Math.PI / 180), s = Math.sin(theta * Math.PI / 180), i;
  fit(); frame(ctx, plot, C); ctx.save(); plot.clip(ctx);
  D.line(ctx, plot.x(-30 * c), plot.y(-30 * s), plot.x(30 * c), plot.y(30 * s), C.terracota, 3);
  for (i = 0; i < N; i++) {
    var p = P[i], z = p[0] * c + p[1] * s, fx = z * c, fy = z * s;
    if (showErr) D.line(ctx, plot.x(p[0]), plot.y(p[1]), plot.x(fx), plot.y(fy), C.terracota, 1.2, [3, 2]);
  }
  for (i = 0; i < N; i++) {
    var q = P[i], z2 = q[0] * c + q[1] * s;
    D.circle(ctx, plot.x(z2 * c), plot.y(z2 * s), 2.6, C.ink);
    D.circle(ctx, plot.x(q[0]), plot.y(q[1]), 4.6, C.cobalto, C.paper, 1);
  }
  D.circle(ctx, plot.x(0), plot.y(0), 4, C.paper, C.ink, 2);
  ctx.restore();
  var b = plot.box, ex = plot.x(plot.xr[1] * 0.9 * 0 + 4.0 * c), ey = plot.y(4.0 * s);
  D.circle(ctx, plot.x(4.1 * c), plot.y(4.1 * s), 8, C.terracota, C.ink, 2);
}
function drawC(ctx, w, h, C) {
  var D = api.d, k, pts = [];
  cplot.yr = [0, total * 1.05]; cplot.axes(ctx);
  for (k = 0; k <= 180; k += 2) pts.push([cplot.x(k), cplot.y(stats(k).cap)]);
  D.path(ctx, pts, C.cobalto, 2.5);
  D.line(ctx, cplot.x(0), cplot.y(lam1), cplot.x(180), cplot.y(lam1), C.oliva, 1.4, [5, 4]);
  D.line(ctx, cplot.x(0), cplot.y(lam2), cplot.x(180), cplot.y(lam2), C.oliva, 1.4, [5, 4]);
  D.circle(ctx, cplot.x(th1), cplot.y(lam1), 5, C.oliva, C.ink, 1.5); D.circle(ctx, cplot.x(th2), cplot.y(lam2), 5, C.oliva, C.ink, 1.5);
  var st = stats(theta); D.line(ctx, cplot.x(theta), cplot.box.y, cplot.x(theta), cplot.box.y + cplot.box.h, C.terracota, 1.5);
  D.circle(ctx, cplot.x(theta), cplot.y(st.cap), 6, C.terracota, C.ink, 2);
  D.text(ctx, w < 520 ? "varianza capturada (máx. = PC1, mín. = PC2)" : "varianza capturada por la recta (máximo = PC1, mínimo = PC2)", cplot.box.x, cplot.box.y - 5, { size: 11, weight: 600, color: C.ink2 });
}
function update() {
  view.redraw(); cview.redraw();
  var st = stats(theta), pct = 100 * st.cap / total;
  var nearMax = Math.abs(st.cap - lam1) < 0.02 * total, nearMin = Math.abs(st.cap - lam2) < 0.02 * total;
  out.set("Ángulo = <b>" + Math.round(theta % 180) + "°</b><br>" +
    "Varianza total de los datos = <b>" + total.toFixed(2) + "</b> (= varianza en x " + sxx.toFixed(2) + " + varianza en y " + syy.toFixed(2) + ")<br>" +
    "Varianza capturada por la recta = <b>" + st.cap.toFixed(2) + "</b> (<b>" + pct.toFixed(1) + " %</b>) · varianza perdida (distancia² media a la recta) = <b>" + st.lost.toFixed(2) + "</b><br>" +
    "Comprobación: " + st.cap.toFixed(2) + " + " + st.lost.toFixed(2) + " = <b>" + (st.cap + st.lost).toFixed(2) + "</b><br>" +
    "PC1 está a <b>" + th1.toFixed(1) + "°</b> y captura <b>" + lam1.toFixed(2) + "</b> (" + (100 * lam1 / total).toFixed(1) + " %); PC2 está a <b>" + th2.toFixed(1) + "°</b> y captura <b>" + lam2.toFixed(2) + "</b> (" + (100 * lam2 / total).toFixed(1) + " %)" +
    (nearMax ? "<br><span class='good'>Estás en PC1: la dirección que conserva más varianza y deja menos error.</span>" : nearMin ? "<br><span class='bad'>Estás en PC2: la peor dirección; se pierde casi toda la información.</span>" : ""));
}
function setFromPointer(px, py) {
  var cx = plot.x(0), cy = plot.y(0), a = Math.atan2(-(py - cy), px - cx) * 180 / Math.PI;
  tween = null; theta = ((Math.round(a) % 180) + 180) % 180; sl.set(theta, true); update();
}
view.pointer({ down: setFromPointer, drag: setFromPointer });
view.draw(draw); cview.draw(drawC); update();
return { destroy: function () { loop.stop(); } };

});

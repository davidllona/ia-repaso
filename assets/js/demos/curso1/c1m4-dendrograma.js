/* Experimento: Dendrograma: enlaces y corte por altura */
Lab.register("curso1/c1m4-dendrograma", function (root, api) {
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

var data = "blobs", link = "ward", cut = 0, P = [], merges = [], order = [], pos = [], maxH = 1, cutSet = false;
function gen() {
  var r = api.rng(data === "blobs" ? 8 : 4), i; P = [];
  if (data === "blobs") {
    [[3.2, 3.4], [11.6, 3.6], [7.6, 7.6]].forEach(function (c) {
      var k = 0, tries = 0, q, t, ok;
      while (k < 5) {   // rechazo: ningún punto a menos de 0.9 de otro (para que no se pisen las etiquetas)
        q = [c[0] + r.normal(0, 1.15), c[1] + r.normal(0, 1.15)]; ok = true; tries++;
        for (t = 0; t < P.length; t++) if (dist2(q, P[t]) < 0.9) { ok = false; break; }
        if (ok || tries > 300) { P.push(q); k++; }
      }
    });
  } else {
    for (i = 0; i < 6; i++) P.push([3.2 + r.normal(0, 0.8), 5 + r.normal(0, 0.8)]);
    for (i = 0; i < 6; i++) P.push([12.8 + r.normal(0, 0.8), 5 + r.normal(0, 0.8)]);
    P.push([6.1, 5.3]); P.push([7.5, 4.8]); P.push([8.9, 5.2]); P.push([10.3, 4.9]);
  }
}
function linkDist(A, B) {
  var i, j, d, m;
  if (link === "single") { m = Infinity; for (i = 0; i < A.length; i++) for (j = 0; j < B.length; j++) { d = dist2(P[A[i]], P[B[j]]); if (d < m) m = d; } return m; }
  if (link === "complete") { m = 0; for (i = 0; i < A.length; i++) for (j = 0; j < B.length; j++) { d = dist2(P[A[i]], P[B[j]]); if (d > m) m = d; } return m; }
  if (link === "average") { var s = 0; for (i = 0; i < A.length; i++) for (j = 0; j < B.length; j++) s += dist2(P[A[i]], P[B[j]]); return s / (A.length * B.length); }
  var ca = [0, 0], cb = [0, 0];
  A.forEach(function (a) { ca[0] += P[a][0] / A.length; ca[1] += P[a][1] / A.length; });
  B.forEach(function (b) { cb[0] += P[b][0] / B.length; cb[1] += P[b][1] / B.length; });
  return Math.sqrt(2 * A.length * B.length / (A.length + B.length)) * dist2(ca, cb);
}
function build() {
  var n = P.length, cl = [], i, j; merges = [];
  for (i = 0; i < n; i++) cl.push({ id: i, pts: [i] });
  var nextId = n;
  while (cl.length > 1) {
    var best = null;
    for (i = 0; i < cl.length; i++) for (j = i + 1; j < cl.length; j++) { var d = linkDist(cl[i].pts, cl[j].pts); if (!best || d < best.d) best = { i: i, j: j, d: d }; }
    var a = cl[best.i], b = cl[best.j], node = { id: nextId++, a: a.id, b: b.id, h: best.d, pts: a.pts.concat(b.pts) };
    merges.push(node); cl.splice(best.j, 1); cl.splice(best.i, 1); cl.push({ id: node.id, pts: node.pts });
  }
  var byId = {}; merges.forEach(function (m) { byId[m.id] = m; });
  order = []; (function walk(id) { if (id < n) order.push(id); else { walk(byId[id].a); walk(byId[id].b); } })(merges[merges.length - 1].id);
  pos = new Array(n); order.forEach(function (p, k) { pos[p] = k; });
  maxH = merges[merges.length - 1].h;
  merges.byId = byId;
}
function clustersAt(h) {
  var n = P.length, parent = []; for (var i = 0; i < n; i++) parent.push(i);
  function find(x) { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; }
  merges.forEach(function (m) { if (m.h <= h) { var ra = find(m.pts[0]), rb = find(m.pts[m.pts.length - 1]); } });
  // más sencillo: reconstruimos por nodos
  var lab = new Array(n).fill(-1), k = 0, byId = merges.byId;
  (function assign(id, forced) {
    if (id < n) { if (forced === undefined) { lab[id] = k++; } else lab[id] = forced; return; }
    var m = byId[id];
    if (forced !== undefined) { assign(m.a, forced); assign(m.b, forced); return; }
    if (m.h <= h) { var c = k++; assign(m.a, c); assign(m.b, c); } else { assign(m.a); assign(m.b); }
  })(merges[merges.length - 1].id);
  return { lab: lab, k: k };
}
function gaps() {
  var hs = merges.map(function (m) { return m.h; }).sort(function (a, b) { return a - b; }), best = { g: -1 }, i;
  for (i = 0; i < hs.length - 1; i++) { var g = hs[i + 1] - hs[i]; if (g > best.g) best = { g: g, lo: hs[i], hi: hs[i + 1], k: hs.length - i }; }
  return best;
}

var row = api.el("div", { class: "lab-row" }), left = api.el("div"), right = api.el("div");
row.appendChild(left); row.appendChild(right); root.appendChild(row);
var view = api.view(left, { aspect: 1.6, minH: 200, maxH: 420, label: "Usuarios numerados y coloreados según el corte del dendrograma" });
var plot = api.plot(view, { xr: [0, 16], yr: [0, 10], pad: { l: 16, r: 6, t: 6, b: 20 } });
var dview = api.view(right, { aspect: 1.45, minH: 220, maxH: 430, drag: true, label: "Dendrograma con una línea de corte horizontal que se puede arrastrar" });
var ui = api.controls(root), out = api.readout(root);
ui.segmented({ label: "Datos", options: [["blobs", "Tres grupos de usuarios"], ["bridge", "Dos grupos con usuarios puente"]], value: data, onChange: function (v) { data = v; gen(); build(); cutSet = false; defaultCut(); update(); } });
ui.segmented({ label: "Enlace (linkage)", options: [["single", "single"], ["complete", "complete"], ["average", "average"], ["ward", "ward"]], value: link, onChange: function (v) { link = v; build(); cutSet = false; defaultCut(); update(); } });
var cs = ui.slider({ label: "Altura de corte", min: 0, max: 1000, step: 1, value: 500, fmt: function (v) { return (v / 1000 * maxH * 1.05).toFixed(2); }, onInput: function (v) { cut = v / 1000 * maxH * 1.05; update(true); } });
ui.button("Cortar en el mayor salto", function () { var g = gaps(); cut = (g.lo + g.hi) / 2; syncSlider(); update(true); }, "primary");
function syncSlider() { cs.set(Math.round(cut / (maxH * 1.05) * 1000), true); }
function defaultCut() { var g = gaps(); cut = (g.lo + g.hi) / 2; syncSlider(); }

function fit() { var b = plot.box; plot.xr = [0, 10 * b.w / b.h]; }
function draw(ctx, w, h, C) {
  var D = api.d, pal = palette(C), cl = clustersAt(cut), i;
  fit(); frame(ctx, plot, C, false); axisCaps(ctx, plot, C, "gusto por la acción →", "gusto por la comedia →"); ctx.save(); plot.clip(ctx);
  for (i = 0; i < P.length; i++) shape(ctx, cl.lab[i], plot.x(P[i][0]), plot.y(P[i][1]), 5, pal[cl.lab[i] % 10], C.ink, 0.8);
  ctx.restore();
  for (i = 0; i < P.length; i++) D.text(ctx, String(i + 1), plot.x(P[i][0]) + 7, plot.y(P[i][1]) - 6, { size: 10.5, color: C.ink2, mono: true });
}
function dGeom(w, h) { return { l: 38, r: 10, t: 12, b: 24, w: w, h: h }; }
function drawD(ctx, w, h, C) {
  var D = api.d, pal = palette(C), g = dGeom(w, h), n = P.length, cl = clustersAt(cut), byId = merges.byId;
  var bw = w - g.l - g.r, bh = h - g.t - g.b, top = maxH * 1.05;
  function X(p) { return g.l + (p + 0.5) / n * bw; }
  function Y(v) { return g.t + bh - v / top * bh; }
  ctx.fillStyle = C.surface; ctx.fillRect(g.l, g.t, bw, bh); D.rect(ctx, g.l, g.t, bw, bh, null, C.ink, 1.5);
  var t, nt = 4;
  for (t = 0; t <= nt; t++) { var v = top * t / nt; D.line(ctx, g.l, Y(v), g.l + bw, Y(v), C.line, 1); D.text(ctx, v.toFixed(1), g.l - 5, Y(v) + 4, { size: 10.5, align: "right", color: C.muted, mono: true }); }
  var nodeX = {}, nodeY = {}, nodeCol = {};
  function colorOf(id) { // color del subárbol si queda por debajo del corte
    if (id < n) return cl.lab[id];
    var m = byId[id]; return m.h <= cut ? cl.lab[m.pts[0]] : -1;
  }
  for (var i = 0; i < n; i++) { nodeX[i] = X(pos[i]); nodeY[i] = 0; }
  merges.forEach(function (m) {
    nodeX[m.id] = (nodeX[m.a] + nodeX[m.b]) / 2; nodeY[m.id] = m.h;
    var c = m.h <= cut ? pal[cl.lab[m.pts[0]] % 10] : C.muted, wd = m.h <= cut ? 2.6 : 1.6;
    D.path(ctx, [[nodeX[m.a], Y(nodeY[m.a])], [nodeX[m.a], Y(m.h)], [nodeX[m.b], Y(m.h)], [nodeX[m.b], Y(nodeY[m.b])]], c, wd);
  });
  for (i = 0; i < n; i++) { D.text(ctx, String(i + 1), nodeX[i], g.t + bh + 14, { size: 10.5, align: "center", color: C.ink2, mono: true }); }
  var cy = Y(Math.min(cut, top)); D.line(ctx, g.l - 4, cy, g.l + bw, cy, C.terracota, 2.5, [7, 4]);
  D.circle(ctx, g.l + bw - 7, cy, 6, C.terracota, C.paper, 1.5);
}
function update(fromCut) {
  view.redraw(); dview.redraw();
  var cl = clustersAt(cut), g = gaps(), sizes = new Array(cl.k).fill(0);
  cl.lab.forEach(function (l) { sizes[l]++; });
  out.set("Enlace <b>" + link + "</b> · altura de corte = <b>" + cut.toFixed(2) + "</b> → <b>" + cl.k + " grupos</b> (tamaños " + sizes.slice().sort(function (a, b) { return b - a; }).join(" · ") + ")<br>" +
    "Altura de la última fusión (todo en 1 grupo): <b>" + maxH.toFixed(2) + "</b> · el mayor salto entre alturas consecutivas va de <b>" + g.lo.toFixed(2) + "</b> a <b>" + g.hi.toFixed(2) + "</b>: cortar ahí da <b>" + g.k + " grupos</b>");
}
function setCut(px, py) {
  var g = dGeom(dview.w, dview.h), bh = dview.h - g.t - g.b, top = maxH * 1.05;
  var v = (g.t + bh - py) / bh * top; cut = Math.max(0, Math.min(top, v)); syncSlider(); update(true);
}
dview.pointer({ down: setCut, drag: setCut });
gen(); build(); view.draw(draw); dview.draw(drawD); defaultCut(); update();

});

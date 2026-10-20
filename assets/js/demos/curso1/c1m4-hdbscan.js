/* Experimento: DBSCAN con un solo eps frente a HDBSCAN con densidades distintas */
Lab.register("curso1/c1m4-hdbscan", function (root, api) {
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

var HD = {"pts":[[2.84,3.14],[2.95,3.48],[3.23,3.42],[2.89,3.24],[3.15,3.73],[3.05,3.15],[2.81,3.72],[3.04,3.05],[2.98,3.17],[2.87,3.3],[2.86,3.51],[2.99,3.28],[3.08,3.57],[2.67,3.35],[2.8,3.37],[2.74,3.4],[2.99,3.34],[2.79,3.32],[2.78,3.13],[3.04,3.18],[3.23,3.54],[2.6,3.45],[2.78,3.41],[3.01,3.0],[2.95,3.35],[3.19,3.16],[3.15,3.18],[2.93,3.23],[3.29,3.51],[3.49,3.53],[3.17,3.57],[2.88,3.39],[3.27,3.32],[3.04,3.4],[3.12,3.33],[2.97,3.45],[3.02,3.23],[3.18,3.14],[2.76,3.14],[3.19,3.33],[2.81,3.17],[3.08,3.19],[2.75,3.52],[2.76,3.34],[3.0,3.31],[2.99,3.67],[2.9,3.15],[2.63,3.36],[2.93,3.45],[2.91,3.3],[2.86,3.3],[3.03,3.32],[3.02,3.78],[3.1,3.08],[3.35,3.47],[4.61,3.58],[4.8,3.28],[4.67,3.2],[4.81,3.61],[4.73,3.48],[5.18,3.16],[4.85,3.34],[4.59,3.19],[4.8,3.49],[4.69,3.41],[4.94,3.46],[4.97,3.49],[4.9,3.77],[4.92,3.43],[4.94,3.22],[4.73,3.56],[4.93,3.71],[4.8,3.11],[5.19,3.62],[4.59,3.68],[4.81,3.04],[4.72,3.3],[5.12,3.24],[4.75,3.34],[4.72,3.22],[4.84,3.62],[4.92,3.21],[4.57,3.42],[4.66,3.27],[4.46,3.79],[4.98,3.21],[4.98,3.67],[4.32,3.29],[4.72,3.53],[4.78,3.35],[4.79,3.77],[5.23,3.3],[4.61,3.94],[4.6,3.29],[4.81,3.5],[5.01,3.48],[4.63,3.5],[4.85,3.78],[4.8,3.13],[4.59,3.69],[4.69,2.98],[4.68,3.4],[5.04,3.2],[4.93,3.56],[4.66,3.36],[5.15,3.74],[4.97,3.47],[5.03,3.37],[4.78,3.23],[4.8,3.38],[15.66,6.11],[13.41,8.38],[11.22,8.15],[8.23,6.54],[12.79,2.8],[9.76,7.98],[11.11,4.75],[10.94,5.59],[12.59,7.08],[11.08,5.4],[11.42,8.39],[12.02,7.36],[11.27,4.46],[10.43,7.38],[11.65,5.04],[9.07,6.57],[10.99,5.87],[11.01,6.83],[11.94,7.84],[12.89,8.4],[12.71,5.9],[11.42,7.14],[11.03,7.22],[13.23,5.2],[8.84,8.19],[11.53,7.46],[9.5,9.0],[12.61,6.21],[10.97,6.57],[11.25,5.98],[9.82,8.29],[11.44,6.51],[11.64,2.86],[12.29,5.91],[11.07,6.5],[10.04,7.67],[10.46,5.04],[10.21,6.64],[12.62,5.51],[9.23,7.99],[9.9,8.19],[11.42,5.35],[10.54,7.09],[12.83,6.1],[12.92,9.53],[11.19,4.68],[9.92,4.31],[10.54,5.31],[9.51,7.2],[7.58,4.42],[14.52,7.96],[12.28,7.09],[14.16,7.2],[11.62,4.55],[11.39,5.3],[10.44,5.33],[11.43,5.91],[12.81,4.41],[11.25,9.19],[11.56,8.2],[9.28,3.02],[9.31,2.71],[1.66,1.75],[10.97,7.74],[8.33,9.35],[8.34,8.91],[11.65,4.44],[1.49,0.92],[3.57,3.58],[15.51,5.23],[4.92,3.87],[4.23,7.17],[1.41,7.29],[5.11,8.73],[8.93,4.71],[0.9,2.54]],"truth":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],"h":{"5":{"lab":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,0,0,0,0,-1,1,-1,2,-1,-1,-1,0,-1],"prob":[0.8,0.63,0.51,0.92,0.41,0.84,0.33,0.55,0.92,0.87,0.59,1.0,0.46,0.59,0.87,0.84,1.0,0.87,0.59,1.0,0.51,0.44,0.8,0.42,0.89,0.6,0.69,0.92,0.51,0.28,0.45,0.8,0.42,0.73,0.59,0.71,1.0,0.64,0.51,0.46,0.78,1.0,0.46,0.87,1.0,0.39,0.8,0.55,0.78,0.92,0.92,0.89,0.33,0.64,0.47,0.94,1.0,1.0,0.95,1.0,0.55,1.0,0.85,1.0,1.0,1.0,1.0,0.9,1.0,0.76,1.0,0.9,0.84,0.45,0.62,0.59,1.0,0.8,1.0,1.0,0.91,0.82,0.95,1.0,0.44,0.8,0.77,0.33,1.0,1.0,0.72,0.53,0.44,1.0,1.0,1.0,1.0,0.9,0.95,0.6,0.52,1.0,0.82,1.0,1.0,0.45,1.0,0.9,1.0,1.0,0.0,0.62,1.0,0.49,0.41,1.0,1.0,1.0,0.86,1.0,1.0,1.0,1.0,1.0,1.0,0.6,1.0,1.0,1.0,0.64,1.0,1.0,1.0,0.87,0.87,1.0,0.82,1.0,1.0,1.0,1.0,1.0,0.51,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,0.46,1.0,0.73,1.0,1.0,0.37,0.41,1.0,0.5,1.0,1.0,1.0,1.0,0.72,0.58,1.0,0.39,0.37,0.0,1.0,0.53,0.67,1.0,0.0,0.21,0.0,0.7,0.0,0.0,0.0,0.53,0.0]},"10":{"lab":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,-1,0,0,0,0,-1,1,-1,2,-1,-1,-1,0,-1],"prob":[0.74,0.68,0.57,1.0,0.37,0.86,0.38,0.7,0.9,1.0,0.66,1.0,0.57,0.62,0.92,0.81,1.0,0.98,0.63,0.93,0.51,0.45,0.89,0.55,1.0,0.66,0.78,1.0,0.49,0.31,0.52,1.0,0.54,0.93,0.83,0.84,1.0,0.64,0.62,0.64,0.8,0.95,0.63,0.92,0.99,0.53,0.84,0.51,0.79,1.0,1.0,0.9,0.36,0.81,0.45,0.69,0.96,0.85,0.83,0.97,0.36,0.89,0.61,0.99,1.0,0.89,0.74,0.53,1.0,0.75,0.86,0.6,0.75,0.45,0.55,0.56,1.0,0.49,1.0,0.99,0.85,0.69,0.72,1.0,0.35,0.67,0.7,0.34,0.99,1.0,0.61,0.42,0.35,0.89,1.0,0.64,0.79,0.54,0.72,0.53,0.42,1.0,0.54,1.0,0.97,0.44,0.76,0.77,1.0,1.0,0.0,0.43,0.73,0.36,0.31,0.68,1.0,1.0,0.67,1.0,0.64,0.72,0.81,0.83,0.9,0.49,1.0,0.98,0.8,0.49,0.59,0.93,0.98,0.46,0.62,0.96,0.46,0.66,1.0,1.0,0.63,0.84,0.36,0.74,1.0,0.77,0.82,0.73,0.64,0.6,0.69,1.0,0.91,0.56,0.34,0.99,0.51,0.89,0.71,0.31,0.31,0.68,0.41,0.67,1.0,0.81,1.0,0.5,0.46,0.72,0.32,0.0,0.0,0.88,0.33,0.38,0.69,0.0,0.27,0.0,0.43,0.0,0.0,0.0,0.4,0.0]},"15":{"lab":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,-1,0,0,0,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,0,0,0,0,0,0,0,0,0,-1,-1,-1,0,-1,-1,0,-1,1,-1,2,-1,-1,-1,0,-1],"prob":[0.77,0.81,0.6,1.0,0.43,0.94,0.45,0.67,1.0,1.0,0.75,1.0,0.64,0.64,1.0,0.8,1.0,0.95,0.64,1.0,0.55,0.46,0.88,0.6,1.0,0.68,0.84,1.0,0.49,0.32,0.59,1.0,0.59,0.91,0.86,0.85,1.0,0.67,0.68,0.77,0.75,1.0,0.68,0.83,1.0,0.49,1.0,0.58,0.96,1.0,1.0,0.99,0.38,0.63,0.45,0.77,1.0,0.85,0.89,1.0,0.47,1.0,0.77,1.0,1.0,0.85,0.8,0.6,0.91,0.81,0.89,0.72,0.76,0.49,0.63,0.64,1.0,0.55,1.0,1.0,0.95,0.86,0.77,1.0,0.41,0.73,0.83,0.4,0.94,1.0,0.68,0.47,0.41,0.84,1.0,0.75,0.86,0.62,0.83,0.62,0.49,1.0,0.64,0.84,1.0,0.49,0.8,0.78,1.0,1.0,0.0,0.5,0.86,0.48,0.0,0.73,0.95,1.0,0.73,1.0,0.74,0.89,0.8,1.0,1.0,0.6,1.0,1.0,0.76,0.59,0.77,1.0,1.0,0.55,0.55,1.0,0.57,0.76,0.98,1.0,0.71,1.0,0.46,0.88,1.0,0.8,0.91,0.88,0.74,0.65,0.73,1.0,0.91,0.7,0.43,0.92,0.65,0.98,0.74,0.42,0.0,0.85,0.5,0.83,1.0,0.92,1.0,0.66,0.58,0.76,0.0,0.0,0.0,0.98,0.0,0.0,0.77,0.0,0.27,0.0,0.47,0.0,0.0,0.0,0.5,0.0]},"25":{"lab":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,-1,-1,0,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,0,0,0,0,0,0,0,0,0,0,0,-1,0,0,0,0,-1,-1,0,-1,0,0,0,0,0,0,0,-1,-1,-1,0,-1,-1,0,-1,1,-1,2,-1,-1,-1,0,-1],"prob":[0.98,1.0,0.81,1.0,0.55,1.0,0.58,0.82,1.0,1.0,0.93,1.0,0.78,0.78,1.0,0.9,1.0,1.0,0.89,1.0,0.67,0.62,0.95,0.73,1.0,0.79,0.92,1.0,0.65,0.44,0.67,1.0,0.76,1.0,1.0,1.0,1.0,0.79,0.85,0.93,1.0,1.0,0.74,1.0,1.0,0.65,1.0,0.7,1.0,1.0,1.0,1.0,0.52,0.8,0.6,0.89,1.0,0.92,1.0,1.0,0.6,1.0,0.81,1.0,1.0,1.0,1.0,0.82,1.0,1.0,1.0,0.8,0.82,0.62,0.75,0.73,1.0,0.71,1.0,1.0,1.0,1.0,1.0,1.0,0.54,0.92,0.75,0.56,1.0,1.0,0.78,0.61,0.49,0.96,1.0,0.98,0.95,0.8,0.86,0.74,0.59,1.0,0.77,1.0,1.0,0.57,1.0,0.91,1.0,1.0,0.0,0.0,0.96,0.0,0.0,0.93,0.94,1.0,1.0,1.0,0.93,1.0,0.88,1.0,1.0,0.79,1.0,1.0,0.94,0.7,0.95,1.0,1.0,0.79,0.66,1.0,0.67,1.0,1.0,1.0,0.85,1.0,0.0,1.0,1.0,0.95,0.9,1.0,0.95,0.78,0.9,1.0,1.0,0.94,0.0,0.95,0.75,1.0,0.88,0.0,0.0,1.0,0.0,0.94,1.0,1.0,1.0,0.74,0.71,0.97,0.0,0.0,0.0,1.0,0.0,0.0,0.92,0.0,0.38,0.0,0.65,0.0,0.0,0.0,0.67,0.0]},"40":{"lab":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,-1,1,-1,-1,-1,1,1,1,1,1,1,1,1,1,1,1,1,1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,-1,1,1,1,1,1,1,-1,-1,1,1,1,-1,1,-1,1,1,0,-1,1,-1,1,1,1,1,-1,-1,1,-1,-1,0,1,-1,-1,1,0,0,-1,0,-1,-1,-1,-1,0],"prob":[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0,1.0,1.0,1.0,1.0,1.0,0.99,1.0,1.0,1.0,1.0,1.0,1.0,0.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,1.0,1.0,1.0,0.0,1.0,0.0,1.0,1.0,1.0,1.0,1.0,1.0,0.0,0.0,1.0,1.0,1.0,0.0,1.0,0.0,1.0,1.0,0.27,0.0,1.0,0.0,1.0,1.0,1.0,1.0,0.0,0.0,1.0,0.0,0.0,0.38,1.0,0.0,0.0,1.0,0.28,1.0,0.0,1.0,0.0,0.0,0.0,0.0,0.35]}}};

var P = HD.pts, truth = HD.truth, method = "dbscan", EPS = 0.4, MIN = 5, MCS = [5, 10, 15, 25, 40], mi = 2, showTruth = false, res = null;
function recovered(lab) {
  var maj = [], ok = 0, k, i;
  for (k = 0; k < 3; k++) {
    var cnt = {}; for (i = 0; i < P.length; i++) if (truth[i] === k) cnt[lab[i]] = (cnt[lab[i]] || 0) + 1;
    var best = null; for (var key in cnt) if (best === null || cnt[key] > cnt[best]) best = key;
    maj.push([+best, cnt[best]]);
  }
  for (k = 0; k < 3; k++) {
    var l = maj[k][0], c = maj[k][1], dup = 0, tot = 0, size = 0;
    for (var j = 0; j < 3; j++) if (maj[j][0] === l) dup++;
    for (i = 0; i < P.length; i++) { if (lab[i] === l) tot++; if (truth[i] === k) size++; }
    if (l >= 0 && dup === 1 && c / size >= 0.7 && c / tot >= 0.7) ok++;
  }
  return ok;
}
function compute() {
  if (method === "dbscan") { var d = dbscan(P, EPS, MIN); res = { lab: d.lab, type: d.type, prob: null, k: d.k }; }
  else { var h = HD.h[String(MCS[mi])]; var kk = 0; h.lab.forEach(function (l) { if (l + 1 > kk) kk = l + 1; }); res = { lab: h.lab, type: h.lab.map(function (l) { return l < 0 ? "ruido" : "nucleo"; }), prob: h.prob, k: kk }; }
}
var view = api.view(root, { aspect: 1.6, minH: 230, maxH: 600, label: "Usuarios de tres grupos con densidades distintas (dos clubes de fans muy parecidos entre sí y un público general disperso) más usuarios sueltos, coloreados por DBSCAN o por HDBSCAN" });
var plot = api.plot(view, { xr: [0, 16], yr: [0, 10], pad: { l: 18, r: 8, t: 8, b: 22 } });
var ui = api.controls(root);
ui.segmented({ label: "Algoritmo", options: [["dbscan", "DBSCAN (calculado aquí)"], ["hdbscan", "HDBSCAN (precalculado)"]], value: method, onChange: function (v) { method = v; compute(); update(); } });
var sE = ui.slider({ label: "DBSCAN: eps", min: 0.1, max: 2.5, step: 0.05, value: EPS, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { EPS = v; method = "dbscan"; compute(); update(); } });
var sM = ui.slider({ label: "DBSCAN: min_samples", min: 2, max: 12, step: 1, value: MIN, onInput: function (v) { MIN = v; method = "dbscan"; compute(); update(); } });
var sH = ui.slider({ label: "HDBSCAN: min_cluster_size", min: 0, max: MCS.length - 1, step: 1, value: mi, fmt: function (v) { return MCS[v]; }, onInput: function (v) { mi = v; method = "hdbscan"; compute(); update(); } });
ui.toggle({ label: "Ver los 3 grupos reales (clubes de fans y público general)", value: false, onChange: function (v) { showTruth = v; update(); } });
var out = api.readout(root);
var lg = api.el("div", { class: "lab-legend" }); lg.appendChild(api.el("span", { text: "forma y color = grupo" })); lg.appendChild(api.el("span", { text: "✕ usuario suelto (ruido)" })); lg.appendChild(api.el("span", { text: "en HDBSCAN, un punto más transparente = menos confianza (probabilities_)" })); root.appendChild(lg);

function fit() { var b = plot.box; plot.xr = [0, 10 * b.w / b.h]; }
function draw(ctx, w, h, C) {
  var pal = palette(C), i; fit(); frame(ctx, plot, C); axisCaps(ctx, plot, C, "gusto por la acción →", "gusto por la comedia →"); ctx.save(); plot.clip(ctx);
  for (i = 0; i < P.length; i++) {
    var x = plot.x(P[i][0]), y = plot.y(P[i][1]), l = showTruth ? truth[i] : res.lab[i];
    ctx.globalAlpha = (!showTruth && res.prob) ? 0.3 + 0.7 * res.prob[i] : 1;
    if (showTruth) { if (l === 3) cross(ctx, x, y, 3.4, C.ink, 1.6); else shape(ctx, l, x, y, 3.9, pal[l], C.ink, 0.6); }
    else if (l < 0) cross(ctx, x, y, 3.4, C.ink, 1.6);
    else shape(ctx, l, x, y, 3.9, pal[l % 10], C.ink, 0.6);
  }
  ctx.globalAlpha = 1; ctx.restore();
}
function update() {
  view.redraw();
  var nn = res.lab.filter(function (l) { return l < 0; }).length, rec = recovered(res.lab);
  var name = method === "dbscan" ? "DBSCAN (eps = " + EPS.toFixed(2) + ", min_samples = " + MIN + ")" : "HDBSCAN (min_cluster_size = " + MCS[mi] + ", sin eps)";
  out.set((showTruth ? "<b>Mostrando los grupos reales</b> (✕ = usuario suelto sembrado)<br>" : "") + name + " → <b>" + res.k + " grupos</b> + <b>" + nn + " usuarios sueltos (ruido)</b><br>" +
    "Grupos reales recuperados limpiamente (ni fundidos ni perdidos): <b>" + rec + " de 3</b>" +
    (rec === 3 ? "<br><span class='good'>Los tres: el club de fans de la izquierda, el club vecino pegado a él y el público general disperso de la derecha.</span>" :
      method === "dbscan" ? "<br><span class='bad'>" + (EPS < 0.9 ? "Con eps pequeño los dos clubes de fans se separan, pero el público general (disperso) se deshace en ruido." : "Con eps grande aparece el público general, pero los dos clubes de fans se funden en uno.") + "</span>" :
        "<br><span class='bad'>min_cluster_size demasiado grande para el tamaño de estos grupos (55 usuarios cada uno).</span>"));
}
compute(); view.draw(draw); update();

});

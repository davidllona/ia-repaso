/* Experimento: el mapa de la pérdida en el plano (w, b) con los 14 usuarios, para MSE y para BCE.
   Cada color es un nivel de pérdida (las líneas oscuras separan niveles). Se hace clic para elegir el punto de partida y se
   deja bajar el descenso del gradiente con las dos pérdidas. Mismos datos (14 usuarios: días sin abrir la app -> canceló) y cuentas que el fragmento 12. */
Lab.register("curso4/c4m4-paisaje", function (root, api) {
  var M = api.math, D = api.d;
  var X = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8];
  var Y = [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1];
  var WR = [-3, 4], BR = [-10, 10], NW = 70, NB = 80;
  var STEP = { mse: 0.03, bce: 0.4 }, CAP = { mse: 0.62, bce: 7 };
  var S = { w0: -2, b0: 8, lr: 0.5, max: 400, n: 0 };
  var P = {}, loop, ready = false;

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function lossAt(kind, w, b) {
    var s = 0, i, z, p;
    for (i = 0; i < X.length; i++) {
      z = w * X[i] + b; p = sig(z);
      if (kind === "mse") s += (p - Y[i]) * (p - Y[i]);
      else s += Math.max(z, 0) - z * Y[i] + Math.log(1 + Math.exp(-Math.abs(z)));
    }
    return s / X.length;
  }
  function gradAt(kind, w, b) {
    var gw = 0, gb = 0, i, p, e;
    for (i = 0; i < X.length; i++) { p = sig(w * X[i] + b); e = kind === "bce" ? p - Y[i] : 2 * (p - Y[i]) * p * (1 - p); gw += e * X[i]; gb += e; }
    return [gw / X.length, gb / X.length];
  }
  var G = {}; // mapas precalculados en las esquinas de la rejilla (NW+1) x (NB+1)
  ["mse", "bce"].forEach(function (k) {
    var g = [], mn = Infinity, i, j, v;
    for (i = 0; i <= NW; i++) { g.push([]); for (j = 0; j <= NB; j++) { v = lossAt(k, WR[0] + (WR[1] - WR[0]) * i / NW, BR[0] + (BR[1] - BR[0]) * j / NB); g[i].push(v); if (v < mn) mn = v; } }
    G[k] = { v: g, min: mn };
  });

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "10px" } });
  root.appendChild(grid);
  ["mse", "bce"].forEach(function (k) {
    var cell = api.el("div");
    grid.appendChild(cell);
    var v = api.view(cell, { aspect: 1.1, minH: 250, maxH: 400, drag: !matchMedia("(pointer:coarse)").matches, label: "Mapa de la pérdida " + k.toUpperCase() + " en el plano (w, b)" });
    var p = api.plot(v, { xr: WR, yr: BR, xticks: 7, yticks: 4, xlabel: "w", ylabel: "b", pad: { l: 40, r: 8, t: 24, b: 34 }, grid: false, xfmt: function (t) { return +t.toFixed(1); } });
    P[k] = { v: v, p: p, trail: [] };
    v.pointer({ down: function (px, py) { pick(k, px, py); }, drag: function (px, py) { pick(k, px, py); } });
  });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Learning rate", min: 0.05, max: 2, step: 0.05, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; reset(); } });
  ui.select({ label: "Punto de partida (o haz clic en cualquiera de los mapas)", value: "malo", options: [["malo", "Confiado y equivocado (−2, 8)"], ["neutro", "Neutro (0, 0)"], ["lejos", "Lejos (3.5, −9)"], ["inv", "Al revés (−2.5, 5)"]],
    onChange: function (v) { var s = { malo: [-2, 8], neutro: [0, 0], lejos: [3.5, -9], inv: [-2.5, 5] }[v]; S.w0 = s[0]; S.b0 = s[1]; reset(); } });
  var bPlay = ui.button("Descender", function () { if (loop.running) loop.stop(); else { if (S.n >= S.max) reset(); if (api.reduceMotion) { advance(S.max - S.n); redraw(); } else loop.start(); } }, "primary");
  ui.button("+ 50 pasos", function () { advance(50); redraw(); });
  ui.button("Volver al inicio", function () { reset(); });

  function pick(k, px, py) {
    var p = P[k].p; if (!p.inside(px, py)) return;
    S.w0 = Math.round(p.ix(px) * 20) / 20; S.b0 = Math.round(p.iy(py) * 10) / 10; reset();
  }
  var cur;
  function reset() {
    if (loop) loop.stop();
    cur = { mse: { w: S.w0, b: S.b0 }, bce: { w: S.w0, b: S.b0 } }; S.n = 0;
    P.mse.trail = [[S.w0, S.b0]]; P.bce.trail = [[S.w0, S.b0]]; redraw();
  }
  function advance(n) {
    var k, kind, g;
    for (k = 0; k < n && S.n < S.max; k++) {
      ["mse", "bce"].forEach(function (kd) { g = gradAt(kd, cur[kd].w, cur[kd].b); cur[kd].w -= S.lr * g[0]; cur[kd].b -= S.lr * g[1]; });
      S.n++;
      if (S.n % 2 === 0 || S.n < 20) ["mse", "bce"].forEach(function (kd) { P[kd].trail.push([cur[kd].w, cur[kd].b]); });
    }
  }
  loop = api.loop(function () { advance(8); redraw(); return S.n < S.max; }, { fps: 20, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Descender"; } });

  function paint(k) {
    return function (ctx, w, h, C) {
      if (!ready) return;
      var p = P[k].p, g = G[k], i, j, bx = p.box, base = g.min, st = STEP[k], cap = CAP[k];
      var x0, x1, y0, y1, t, v00, v10, v01, v11, mn, mx, lv, lo, hi, seg, q;
      ctx.save(); p.clip(ctx);
      ctx.fillStyle = C.surface; ctx.fillRect(bx.x, bx.y, bx.w, bx.h);
      for (i = 0; i < NW; i++) {
        x0 = Math.round(p.x(WR[0] + (WR[1] - WR[0]) * i / NW)); x1 = Math.round(p.x(WR[0] + (WR[1] - WR[0]) * (i + 1) / NW));
        for (j = 0; j < NB; j++) {
          y0 = Math.round(p.y(BR[0] + (BR[1] - BR[0]) * (j + 1) / NB)); y1 = Math.round(p.y(BR[0] + (BR[1] - BR[0]) * j / NB));
          t = M.clamp(((g.v[i][j] + g.v[i + 1][j] + g.v[i][j + 1] + g.v[i + 1][j + 1]) / 4 - base) / (cap - base), 0, 1);
          ctx.globalAlpha = 0.05 + 0.55 * t; ctx.fillStyle = k === "mse" ? C.terracota : C.cobalto; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
      }
      // curvas de nivel (marching squares) cada "st" de pérdida
      ctx.globalAlpha = 0.65; ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath();
      for (i = 0; i < NW; i++) for (j = 0; j < NB; j++) {
        v00 = g.v[i][j]; v10 = g.v[i + 1][j]; v01 = g.v[i][j + 1]; v11 = g.v[i + 1][j + 1];
        mn = Math.min(v00, v10, v01, v11); mx = Math.max(v00, v10, v01, v11);
        lo = Math.ceil((mn - base) / st); hi = Math.floor((mx - base) / st);
        for (lv = lo; lv <= hi; lv++) {
          q = base + lv * st; if (q > cap) break; seg = [];
          // bordes: abajo (v00-v10), derecha (v10-v11), arriba (v01-v11), izquierda (v00-v01)
          if ((v00 - q) * (v10 - q) < 0) seg.push([i + (q - v00) / (v10 - v00), j]);
          if ((v10 - q) * (v11 - q) < 0) seg.push([i + 1, j + (q - v10) / (v11 - v10)]);
          if ((v01 - q) * (v11 - q) < 0) seg.push([i + (q - v01) / (v11 - v01), j + 1]);
          if ((v00 - q) * (v01 - q) < 0) seg.push([i, j + (q - v00) / (v01 - v00)]);
          if (seg.length >= 2) {
            ctx.moveTo(p.x(WR[0] + (WR[1] - WR[0]) * seg[0][0] / NW), p.y(BR[0] + (BR[1] - BR[0]) * seg[0][1] / NB));
            ctx.lineTo(p.x(WR[0] + (WR[1] - WR[0]) * seg[1][0] / NW), p.y(BR[0] + (BR[1] - BR[0]) * seg[1][1] / NB));
          }
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      var tr = P[k].trail.map(function (q) { return [p.x(M.clamp(q[0], WR[0], WR[1])), p.y(M.clamp(q[1], BR[0], BR[1]))]; });
      D.path(ctx, tr, C.ink, 2.5);
      D.circle(ctx, p.x(S.w0), p.y(S.b0), 5, C.marker, C.ink, 2);
      var c = cur[k];
      D.circle(ctx, p.x(M.clamp(c.w, WR[0], WR[1])), p.y(M.clamp(c.b, BR[0], BR[1])), 7, C.oliva, C.ink, 2.5);
      ctx.restore();
      D.rect(ctx, bx.x, bx.y, bx.w, bx.h, null, C.ink, 1.5);
      var i2, tv;
      for (i2 = 0; i2 <= 7; i2++) { tv = WR[0] + (WR[1] - WR[0]) * i2 / 7; D.text(ctx, String(+tv.toFixed(1)), p.x(tv), bx.y + bx.h + 14, { align: "center", size: 10.5, color: C.muted, mono: true }); }
      for (i2 = 0; i2 <= 4; i2++) { tv = BR[0] + (BR[1] - BR[0]) * i2 / 4; D.text(ctx, String(tv), bx.x - 5, p.y(tv) + 4, { align: "right", size: 10.5, color: C.muted, mono: true }); }
      D.text(ctx, "w", bx.x + bx.w / 2, h - 4, { align: "center", size: 12, color: C.ink2, weight: 500 });
      D.text(ctx, "b", 11, bx.y + bx.h / 2, { align: "center", size: 12, color: C.ink2, weight: 500, rotate: -Math.PI / 2 });
      D.text(ctx, k === "mse" ? "Pérdida MSE" : "Pérdida BCE (entropía cruzada)", bx.x, 14, { size: 12, weight: 600, color: k === "mse" ? C.terracotaInk : C.cobaltoInk });
    };
  }
  P.mse.v.draw(paint("mse")); P.bce.v.draw(paint("bce"));

  function redraw() {
    P.mse.v.redraw(); P.bce.v.redraw();
    var gm = gradAt("mse", cur.mse.w, cur.mse.b), gb = gradAt("bce", cur.bce.w, cur.bce.b);
    function nrm(g) { return Math.sqrt(g[0] * g[0] + g[1] * g[1]); }
    out.set("inicio (w, b) = (<b>" + S.w0.toFixed(2) + "</b>, <b>" + S.b0.toFixed(1) + "</b>) · paso <b>" + S.n + "</b> de " + S.max + "<br>" +
      "<span style='color:" + api.colors().terracotaInk + "'>MSE</span>: (w, b) = (" + cur.mse.w.toFixed(2) + ", " + cur.mse.b.toFixed(2) + ") · pérdida " + lossAt("mse", cur.mse.w, cur.mse.b).toFixed(4) + " · |gradiente| = <b>" + nrm(gm).toFixed(4) + "</b><br>" +
      "<span style='color:" + api.colors().cobaltoInk + "'>BCE</span>: (w, b) = (" + cur.bce.w.toFixed(2) + ", " + cur.bce.b.toFixed(2) + ") · pérdida " + lossAt("bce", cur.bce.w, cur.bce.b).toFixed(4) + " · |gradiente| = <b>" + nrm(gb).toFixed(4) + "</b>");
  }
  ready = true; reset();
  return { destroy: function () { loop.stop(); } };
});

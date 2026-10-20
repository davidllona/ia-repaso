/* Experimento: una neurona por clase. Cada fila de W (un vector w_k) es una "puntuación" lineal z_k = s·(w_k·x) + b_k.
   El plano se reparte en zonas rectas: gana la clase con mayor puntuación. Los sesgos mueven las fronteras. */
Lab.register("curso4/c4m5-regiones", function (root, api) {
  var D = api.d, M = api.math, K = 3, HM = 2, GRID = 40, NAMES = ["acción", "comedia", "terror"];
  var ANG = [90, 210, 330], WV = ANG.map(function (a) { return [1.5 * Math.cos(a * Math.PI / 180), 1.5 * Math.sin(a * Math.PI / 180)]; });
  var S = { b: [0, 0, 0], s: 2, probe: [0.6, 0.4] };
  function rgb(h) {
    h = (h || "#888").trim();
    if (h.charAt(0) === "#") { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    var m = h.match(/\d+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function logits(x) { var z = [], k; for (k = 0; k < K; k++) z.push(S.s * (WV[k][0] * x[0] + WV[k][1] * x[1]) + S.b[k]); return z; }
  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var view = api.view(colA, { aspect: 1.0, minH: 240, maxH: 400, drag: true, label: "Mapa de tráilers con las tres zonas de decisión (acción, comedia, terror), las flechas w de cada género y un tráiler de prueba" });
  var plot = api.plot(view, { xr: [-HM, HM], yr: [-HM, HM], xticks: 4, yticks: 4, pad: { l: 30, r: 12, t: 8, b: 22 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var viewB = api.view(colB, { aspect: 1.0, minH: 240, maxH: 400, label: "Puntuaciones z y probabilidades de los tres géneros para el tráiler de prueba" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.7rem, 2.6vw, .82rem)";
  var sl = [0, 1, 2].map(function (k) {
    return ui.slider({ label: "sesgo b" + k, min: -1.5, max: 1.5, step: 0.1, value: 0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.b[k] = v; update(); } });
  });
  var ss = ui.slider({ label: "escala s de los pesos", min: 0.5, max: 6, step: 0.1, value: 2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.s = v; update(); } });
  ui.button("Sesgos a 0", function () { sl.forEach(function (q) { q.set(0, true); }); S.b = [0, 0, 0]; update(); });
  api.legend(root, [[api.colors().cobalto, "acción (clase 0)"], [api.colors().terracota, "comedia (clase 1)"], [api.colors().oliva, "terror (clase 2)"], [api.colors().ink, "tráiler de prueba (arrástralo)"]]);
  function cls(C) { return [C.cobalto, C.terracota, C.oliva]; }
  var off = document.createElement("canvas"), octx = off.getContext("2d");
  function setProbe(px, py) { if (!plot.inside(px, py)) return; S.probe = [plot.ix(px), plot.iy(py)]; update(); }
  view.pointer({ down: setProbe, drag: setProbe });
  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, cs = cls(C).map(rgb), N = GRID, i, j, k;
    off.width = N; off.height = N; var img = octx.createImageData(N, N);
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var p = M.softmax(logits([-HM + 2 * HM * (i + 0.5) / N, HM - 2 * HM * (j + 0.5) / N])), q = 4 * (j * N + i), r = 0, g = 0, bl = 0;
      for (k = 0; k < K; k++) { r += p[k] * cs[k][0]; g += p[k] * cs[k][1]; bl += p[k] * cs[k][2]; }
      img.data[q] = r; img.data[q + 1] = g; img.data[q + 2] = bl; img.data[q + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.save(); plot.clip(ctx); ctx.globalAlpha = 0.5; ctx.imageSmoothingEnabled = true; ctx.drawImage(off, b.x, b.y, b.w, b.h); ctx.globalAlpha = 1;
    var cl = cls(C), ox = plot.x(0), oy = plot.y(0);
    for (k = 0; k < K; k++) {
      var tx = plot.x(WV[k][0] * 0.62), ty = plot.y(WV[k][1] * 0.62);
      D.arrow(ctx, ox, oy, tx, ty, cl[k], 2.4);
      D.text(ctx, "w" + k, plot.x(WV[k][0] * 0.62 + (WV[k][0] > 0 ? 0.2 : (WV[k][0] < 0 ? -0.2 : 0))), plot.y(WV[k][1] * 0.62 + (WV[k][1] > 0 ? 0.2 : -0.2)) + 4, { size: 12, weight: 700, color: C.ink, align: "center" });
    }
    var px = plot.x(S.probe[0]), py = plot.y(S.probe[1]);
    D.circle(ctx, px, py, 8, null, C.ink, 2.6); D.line(ctx, px - 12, py, px + 12, py, C.ink, 1.2); D.line(ctx, px, py - 12, px, py + 12, C.ink, 1.2);
    ctx.restore();
  });
  viewB.draw(function (ctx, w, h, C) {
    var z = logits(S.probe), p = M.softmax(z), cl = cls(C), k, mx = Math.max(2, Math.max.apply(null, z.map(Math.abs)));
    var midx = w * 0.46, bh = Math.min(46, (h - 60) / 3 - 20);
    D.text(ctx, "puntuación z", midx / 2, 16, { size: 11, weight: 700, align: "center", color: C.ink2 });
    D.text(ctx, "softmax: p", (w + midx) / 2 + 6, 16, { size: 11, weight: 700, align: "center", color: C.ink2 });
    for (k = 0; k < K; k++) {
      var y = 34 + k * (bh + 24), zx = 14 + (midx - 14) / 2, zw = (midx - 40) / 2 * z[k] / mx;
      D.line(ctx, zx, y - 3, zx, y + bh + 3, C.muted, 1);
      D.rect(ctx, Math.min(zx, zx + zw), y, Math.abs(zw), bh, cl[k]);
      D.text(ctx, z[k].toFixed(2).replace("-", "−"), zx + (z[k] >= 0 ? -4 : 4), y + bh + 12, { size: 10.5, mono: true, color: C.ink2, align: z[k] >= 0 ? "right" : "left" });
      var x0 = midx + 22, wmax = w - x0 - 50;
      D.text(ctx, String(k), midx + 10, y + bh / 2 + 5, { size: 13, weight: 700, align: "center" });
      D.text(ctx, NAMES[k], midx + 22, y - 4, { size: 10.5, weight: 700, color: C.ink2 });
      D.rect(ctx, x0, y, wmax, bh, C.surface, C.line, 1);
      D.rect(ctx, x0, y, Math.max(1, wmax * p[k]), bh, cl[k]);
      D.text(ctx, (p[k] * 100).toFixed(1) + "%", x0 + wmax + 4, y + bh / 2 + 4, { size: 10.5, mono: true });
    }
  });
  function f2(v) { return v.toFixed(2).replace("-", "−"); }
  function update() {
    var x = S.probe, z = logits(x), p = M.softmax(z), best = 0, k, lines = [];
    for (k = 1; k < K; k++) if (z[k] > z[best]) best = k;
    for (k = 0; k < K; k++) lines.push("z" + k + " = " + S.s.toFixed(1) + "·(" + f2(WV[k][0]) + "·" + f2(x[0]) + " + " + f2(WV[k][1]) + "·" + f2(x[1]) + ") + " + f2(S.b[k]) + " = <b>" + f2(z[k]) + "</b>");
    out.set("Tráiler x = (" + f2(x[0]) + ", " + f2(x[1]) + ")<br>" + lines.join("<br>") + "<br>softmax → p = (" + p.map(function (v) { return v.toFixed(3); }).join(", ") + ") · <b>argmax = clase " + best + " (" + NAMES[best] + ")</b>");
    view.redraw(); viewB.redraw();
  }
  update();
});

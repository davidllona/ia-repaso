/* Experimento: batch, mini-batch y SGD con DataLoader: reparto de lotes, camino en (w, b) y MSE por época. */
Lab.register("curso4/c4m3-lotes", function (root, api) {
  var N = 30, r = api.rng(3), X = [], Y = [], i, bs = 5, lr = 0.02, shuffle = true, dropLast = false;
  for (i = 0; i < N; i++) { var xv = -3 + 6 * i / (N - 1); X.push(xv); Y.push(-3 * xv + 1 + r.normal(0, 0.5)); }
  var rs = api.rng(11), w0 = -5.5, b0 = 4, w, b, plan, ptr, epoch, updates, path, hist;
    /* Mapa de calor + curvas de nivel del coste (se guarda en un canvas auxiliar para no recalcularlo). */
  function makeHeat(view) {
    var cache = { key: "", cv: null };
    function draw(ctx, plot, C, f, scale) {
      var b = plot.box, dpr = view.canvas.width / view.w;
      var key = [Math.round(b.w), Math.round(b.h), dpr, C.terracota, C.ink, plot.xr[0], plot.xr[1], plot.yr[0], plot.yr[1], scale].join("|");
      if (cache.key !== key) {
        var cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(b.w * dpr)); cv.height = Math.max(1, Math.round(b.h * dpr));
        var c2 = cv.getContext("2d"); c2.scale(dpr, dpr);
        var cs = 2, nx = Math.ceil(b.w / cs), ny = Math.ceil(b.h / cs), lv = [], i, j, den = Math.log(1 + scale);
        for (j = 0; j < ny; j++) {
          lv.push([]);
          for (i = 0; i < nx; i++) {
            var xv = plot.xr[0] + (i + 0.5) * cs / b.w * (plot.xr[1] - plot.xr[0]);
            var yv = plot.yr[1] - (j + 0.5) * cs / b.h * (plot.yr[1] - plot.yr[0]);
            lv[j].push(Math.log(1 + f(xv, yv)) / den);
          }
        }
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
          c2.globalAlpha = 0.03 + 0.5 * Math.min(1, lv[j][i]); c2.fillStyle = C.terracota; c2.fillRect(i * cs, j * cs, cs, cs);
        }
        c2.globalAlpha = 0.4; c2.fillStyle = C.ink;
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
          var bd = Math.floor(lv[j][i] * 9);
          if (i + 1 < nx && Math.floor(lv[j][i + 1] * 9) !== bd) c2.fillRect((i + 1) * cs - 0.5, j * cs, 1, cs);
          if (j + 1 < ny && Math.floor(lv[j + 1][i] * 9) !== bd) c2.fillRect(i * cs, (j + 1) * cs - 0.5, cs, 1);
        }
        cache.key = key; cache.cv = cv;
      }
      ctx.drawImage(cache.cv, b.x, b.y, b.w, b.h);
      api.d.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
    }
    draw.invalidate = function () { cache.key = ""; };
    return draw;
  }

  function mse(w, b) { var s = 0, i; for (i = 0; i < N; i++) { var e = w * X[i] + b - Y[i]; s += e * e; } return s / N; }
  var A = [[0, 0], [0, 0]];
  var vS = api.view(root, { aspect: 9, minH: 52, maxH: 70, label: "Cómo reparte el DataLoader las 30 muestras en lotes" });
  var row = api.el("div", { class: "lab-row" }); root.appendChild(row);
  var p1 = api.el("div", { style: { minWidth: 0 } }), p2 = api.el("div", { style: { minWidth: 0 } }); row.appendChild(p1); row.appendChild(p2);
  var vB = api.view(p1, { aspect: 1.1, minH: 250, label: "Camino de (w, b) sobre el mapa del coste" });
  var pB = api.plot(vB, { xr: [-6, 0], yr: [-3, 5], xticks: 3, yticks: 4, xlabel: "w", ylabel: "b", pad: { l: 40, r: 12, t: 12, b: 36 } });
  var heat = makeHeat(vB);
  var vC = api.view(p2, { aspect: 1.1, minH: 250, label: "MSE total al final de cada época, en escala logarítmica" });
  var pC = api.plot(vC, { xr: [0, 20], yr: [-2, 2], xticks: 4, yticks: 4, xlabel: "época", yfmt: function (t) { return "1e" + t; }, pad: { l: 46, r: 12, t: 12, b: 36 } });
  var ui = api.controls(root);
  var sBs = ui.slider({ label: "batch_size", min: 1, max: 30, step: 1, value: bs, fmt: function (v) { return v; }, onInput: function (v) { bs = v; reset(); } });
  var sLr = ui.slider({ label: "learning rate", min: 0.005, max: 0.2, step: 0.005, value: lr, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { lr = v; reset(); } });
  ui.toggle({ label: "shuffle (barajar)", value: true, onChange: function (on) { shuffle = on; reset(); } });
  ui.toggle({ label: "drop_last (tirar el lote incompleto)", value: false, onChange: function (on) { dropLast = on; reset(); } });
  ui.button("Un lote", function () { stepBatch(); redraw(); }, "primary");
  ui.button("Una época", function () { oneEpoch(); redraw(); });
  ui.button("10 épocas", function () { for (var q = 0; q < 10; q++) oneEpoch(); redraw(); });
  var out = api.readout(root);

  function newPlan() {
    var idx = []; for (var q = 0; q < N; q++) idx.push(q);
    if (shuffle) rs.shuffle(idx);
    var nb = dropLast ? Math.floor(N / bs) : Math.ceil(N / bs), batches = [];
    for (q = 0; q < nb; q++) batches.push(idx.slice(q * bs, Math.min(N, (q + 1) * bs)));
    var dropped = idx.slice(nb * bs);
    return { batches: batches, dropped: dropped };
  }
  function reset() { rs = api.rng(11); w = w0; b = b0; plan = newPlan(); ptr = 0; epoch = 0; updates = 0; path = [[w, b]]; hist = [mse(w, b)]; redraw(); }
  function stepBatch() {
    if (!plan.batches.length) return;
    var bt = plan.batches[ptr], gw = 0, gb = 0, k;
    for (k = 0; k < bt.length; k++) { var e = w * X[bt[k]] + b - Y[bt[k]]; gw += 2 * e * X[bt[k]] / bt.length; gb += 2 * e / bt.length; }
    w -= lr * gw; b -= lr * gb; updates++; path.push([w, b]); ptr++;
    if (ptr >= plan.batches.length) { epoch++; hist.push(mse(w, b)); ptr = 0; plan = newPlan(); }
  }
  function oneEpoch() { var e0 = epoch, g = 0; while (epoch === e0 && g++ < 100) stepBatch(); }

  function drawS(ctx, W, H, C) {
    var D = api.d, nb = plan.batches.length, gap = 5, pad = 6, tot = N + (plan.dropped.length ? 0 : 0), cw = (W - 2 * pad - (nb + (plan.dropped.length ? 1 : 0) - 1) * gap) / N, pal = [C.cobalto, C.terracota, C.oliva], x = pad, bi, k;
    for (bi = 0; bi < nb; bi++) {
      var bt = plan.batches[bi];
      for (k = 0; k < bt.length; k++) {
        D.rect(ctx, x, 14, cw - 1, H - 28, pal[bi % 3], null);
        if (cw >= 17) D.text(ctx, String(bt[k] + 1), x + (cw - 1) / 2, H / 2 + 4, { size: 10, color: C.paper, align: "center", weight: 600 });
        x += cw;
      }
      if (bi === ptr) D.rect(ctx, x - bt.length * cw - 2, 11, bt.length * cw + 3, H - 22, null, C.ink, 2);
      x += gap;
    }
    plan.dropped.forEach(function (q) { D.rect(ctx, x, 14, cw - 1, H - 28, null, C.muted, 1); if (cw >= 17) D.text(ctx, String(q + 1), x + (cw - 1) / 2, H / 2 + 4, { size: 10, color: C.muted, align: "center" }); x += cw; });
    D.text(ctx, "próxima época: un color = un lote; el número es la muestra", pad, 10, { size: 10.5, color: C.ink2 });
  }
  function drawB(ctx, W, H, C) {
    var D = api.d, i, bx = pB.box;
    pB.axes(ctx); heat(ctx, pB, C, mse, 120);
    ctx.save(); pB.clip(ctx);
    D.circle(ctx, pB.x(-3), pB.y(1), 7, C.marker, C.ink, 2);
    D.path(ctx, path.map(function (p) { return [pB.x(p[0]), pB.y(p[1])]; }), C.cobaltoInk, 1.4);
    if (path.length < 120) for (i = 0; i < path.length; i++) D.circle(ctx, pB.x(path[i][0]), pB.y(path[i][1]), 2.6, C.paper, C.cobaltoInk, 1.1);
    D.circle(ctx, pB.x(w), pB.y(b), 6.5, C.cobalto, C.paper, 2);
    ctx.restore();
    D.text(ctx, "punto amarillo = mínimo", bx.x + 8, bx.y + 16, { size: 10.5, color: C.ink, weight: 600 });
  }
  function drawC(ctx, W, H, C) {
    var D = api.d, mx = Math.max(20, Math.ceil((hist.length - 1) / 20) * 20);
    pC.xr = [0, mx]; pC.axes(ctx); ctx.save(); pC.clip(ctx);
    D.path(ctx, hist.map(function (m, i) { return [pC.x(i), pC.y(api.math.clamp(Math.log(Math.max(m, 1e-9)) / Math.LN10, -2, 2))]; }), C.terracota, 2.5);
    hist.forEach(function (m, i) { if (hist.length < 40) D.circle(ctx, pC.x(i), pC.y(api.math.clamp(Math.log(Math.max(m, 1e-9)) / Math.LN10, -2, 2)), 3, C.terracota, C.paper, 1); });
    ctx.restore();
  }
  function redraw() {
    vS.redraw(); vB.redraw(); vC.redraw();
    var nb = plan.batches.length, sizes = plan.batches.map(function (a) { return a.length; }), m = mse(w, b);
    var szTxt = sizes.length > 8 ? sizes.slice(0, 4).join(", ") + ", …, " + sizes[sizes.length - 1] : sizes.join(", ");
    out.set("batch_size = <b>" + bs + "</b> → " + (dropLast ? "⌊30/" + bs + "⌋" : "⌈30/" + bs + "⌉") + " = <b>" + nb + "</b> actualizaciones por época (lotes de " + szTxt + ")" + (plan.dropped.length ? " · se tiran <b>" + plan.dropped.length + "</b> muestras" : "") + "<br>" +
      "época <b>" + epoch + "</b> · actualizaciones <b>" + updates + "</b> · muestras leídas <b>" + (epoch * N + (ptr ? plan.batches.slice(0, ptr).reduce(function (s, a) { return s + a.length; }, 0) : 0)) + "</b><br>" +
      "w = <b>" + (isFinite(w) ? w.toFixed(3) : "∞") + "</b> · b = <b>" + (isFinite(b) ? b.toFixed(3) : "∞") + "</b> · MSE total = <b>" + (m > 1e6 || !isFinite(m) ? "enorme (diverge)" : m.toFixed(3)) + "</b>" + (m > 1e4 || !isFinite(m) ? "<br><span class='bad'>lr demasiado grande para este tamaño de lote</span>" : ""));
  }
  reset();
  vS.draw(drawS); vB.draw(drawB); vC.draw(drawC); redraw();
});

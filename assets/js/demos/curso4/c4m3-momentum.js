/* Experimento: SGD con y sin momentum sobre un valle largo y estrecho (variable x sin centrar). */
Lab.register("curso4/c4m3-momentum", function (root, api) {
  var n = 50, r = api.rng(2), X = [], Y = [], i, lr = 0.008, mu = 0.9, k, A, B, hA, hB, status, loop;
  for (i = 0; i < n; i++) { var xv = 10 * i / (n - 1); X.push(xv); Y.push(2 * xv + 1 + r.normal(0, 0.1)); }
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

  function mse(w, b) { var s = 0, i; for (i = 0; i < n; i++) { var e = w * X[i] + b - Y[i]; s += e * e; } return s / n; }
  function grad(w, b) { var gw = 0, gb = 0, i; for (i = 0; i < n; i++) { var e = w * X[i] + b - Y[i]; gw += 2 * e * X[i] / n; gb += 2 * e / n; } return [gw, gb]; }
  var opt = (function () { var sx = 0, sy = 0, sxx = 0, sxy = 0; for (var q = 0; q < n; q++) { sx += X[q]; sy += Y[q]; sxx += X[q] * X[q]; sxy += X[q] * Y[q]; } var w = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [w, (sy - w * sx) / n]; })();
  A = { p: [0, 0], v: [0, 0], t: [[0, 0]] }; B = { p: [0, 0], v: [0, 0], t: [[0, 0]] }; k = 0; hA = [mse(0, 0)]; hB = [mse(0, 0)]; status = "run";
  var row = api.el("div", { class: "lab-row" }); root.appendChild(row);
  var p1 = api.el("div", { style: { minWidth: 0 } }), p2 = api.el("div", { style: { minWidth: 0 } }); row.appendChild(p1); row.appendChild(p2);
  var vB = api.view(p1, { aspect: 1.1, minH: 250, label: "Mapa del coste con los caminos sin momentum y con momentum" });
  var pB = api.plot(vB, { xr: [-0.5, 4], yr: [-4, 12], xticks: 3, yticks: 4, xlabel: "w", ylabel: "b", pad: { l: 40, r: 12, t: 12, b: 36 } });
  var heat = makeHeat(vB);
  var vC = api.view(p2, { aspect: 1.1, minH: 250, label: "MSE de cada camino en cada paso, escala logarítmica" });
  var pC = api.plot(vC, { xr: [0, 300], yr: [-2, 4], xticks: 5, yticks: 6, xlabel: "paso", yfmt: function (t) { return "1e" + t; }, pad: { l: 46, r: 12, t: 12, b: 36 } });
  api.legend(root, [[api.colors().cobalto, "SGD sin momentum (μ = 0)"], [api.colors().terracota, "SGD con momentum (μ del control)"], [api.colors().marker, "óptimo"]]);
  var ui = api.controls(root);
  ui.slider({ label: "learning rate", min: 0.002, max: 0.03, step: 0.002, value: lr, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { lr = v; reset(); } });
  ui.slider({ label: "momentum μ", min: 0, max: 0.99, step: 0.01, value: mu, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { mu = v; reset(); } });
  ui.button("Un paso", function () { if (!loop.running) { advance(); redraw(); } }, "primary");
  var bPlay = ui.button("Ejecutar 300 pasos", function () {
    if (loop.running) { loop.stop(); return; }
    if (status !== "run") reset();
    if (api.reduceMotion) { while (status === "run") advance(); redraw(); } else loop.start();
  });
  ui.button("Volver al inicio", function () { reset(); });
  var out = api.readout(root);

  function move(S, m) {
    var g = grad(S.p[0], S.p[1]);
    S.v[0] = m * S.v[0] + g[0]; S.v[1] = m * S.v[1] + g[1];
    S.p[0] -= lr * S.v[0]; S.p[1] -= lr * S.v[1]; S.t.push([S.p[0], S.p[1]]);
  }
  function advance() { move(A, 0); move(B, mu); k++; hA.push(mse(A.p[0], A.p[1])); hB.push(mse(B.p[0], B.p[1])); if (k >= 300) status = "done"; }
  function reset() { if (loop) loop.stop(); A = { p: [0, 0], v: [0, 0], t: [[0, 0]] }; B = { p: [0, 0], v: [0, 0], t: [[0, 0]] }; k = 0; hA = [mse(0, 0)]; hB = [mse(0, 0)]; status = "run"; redraw(); }
  loop = api.loop(function () { for (var q = 0; q < 3 && status === "run"; q++) advance(); redraw(); return status === "run"; }, { fps: 30, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Ejecutar 300 pasos"; } });

  function inb(p) { return Math.abs(p[0]) < 1e3 && Math.abs(p[1]) < 1e3; }
  function drawB(ctx, W, H, C) {
    var D = api.d;
    pB.axes(ctx); heat(ctx, pB, C, mse, 3000);
    ctx.save(); pB.clip(ctx);
    D.circle(ctx, pB.x(opt[0]), pB.y(opt[1]), 7, C.marker, C.ink, 2);
    [[B, C.terracota, 1.6], [A, C.cobalto, 3]].forEach(function (z) {
      var pts = z[0].t.filter(inb).map(function (p) { return [pB.x(p[0]), pB.y(p[1])]; });
      D.path(ctx, pts, z[1], z[2]);
      var last = z[0].p; if (inb(last)) D.circle(ctx, pB.x(last[0]), pB.y(last[1]), 6, z[1], C.paper, 2);
    });
    ctx.restore();
  }
  function drawC(ctx, W, H, C) {
    var D = api.d, lg = function (v) { return api.math.clamp(Math.log(Math.max(v, 1e-9)) / Math.LN10, -2, 4); };
    pC.axes(ctx); ctx.save(); pC.clip(ctx);
    D.path(ctx, hA.map(function (m, i) { return [pC.x(i), pC.y(lg(m))]; }), C.cobalto, 2.5);
    D.path(ctx, hB.map(function (m, i) { return [pC.x(i), pC.y(lg(m))]; }), C.terracota, 2.5);
    ctx.restore();
  }
  function redraw() {
    vB.redraw(); vC.redraw();
    var fa = hA[k], fb = hB[k], d = function (v) { return v > 1e6 || !isFinite(v) ? "enorme" : v.toFixed(3); };
    out.set("paso <b>" + k + "</b> · óptimo (mínimos cuadrados) = (" + opt[0].toFixed(3) + ", " + opt[1].toFixed(3) + ")<br>" +
      "sin momentum: (w, b) = <b>(" + A.p[0].toFixed(3) + ", " + A.p[1].toFixed(3) + ")</b> · MSE = <b>" + d(fa) + "</b><br>" +
      "con μ = " + mu.toFixed(2) + ": (w, b) = <b>(" + (isFinite(B.p[0]) ? B.p[0].toFixed(3) : "∞") + ", " + (isFinite(B.p[1]) ? B.p[1].toFixed(3) : "∞") + ")</b> · MSE = <b>" + d(fb) + "</b>" +
      (k >= 300 ? "<br>" + (fb < fa ? "<span class='good'>con momentum el MSE final es " + (fa / Math.max(fb, 1e-9)).toFixed(1) + " veces menor.</span>" : "<span class='bad'>aquí el momentum no ayuda: prueba otro μ o lr.</span>") : ""));
  }
  vB.draw(drawB); vC.draw(drawC); redraw();
  return { destroy: function () { loop.stop(); } };
});

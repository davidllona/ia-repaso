/* Experimento: descenso del gradiente con dos parámetros (w, b) sobre el MSE de tres puntos, paso a paso. */
Lab.register("curso4/c4m3-gd-paso", function (root, api) {
  var Y = [2, 5, 8], n = 3, centered = false, lr = 0.05, w0 = 0, b0 = 0, w, b, k, trail, hist, status, loop, X = [1, 2, 3];
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
  w = w0; b = b0; k = 0; trail = [[w, b]]; hist = [mse(w, b)]; status = "run";
  var row = api.el("div", { class: "lab-row" }); root.appendChild(row);
  var p1 = api.el("div", { style: { minWidth: 0 } }), p2 = api.el("div", { style: { minWidth: 0 } }); row.appendChild(p1); row.appendChild(p2);
  var vA = api.view(p1, { aspect: 1.05, minH: 250, label: "Las tres películas (presupuesto y horas vistas) y la recta actual" });
  var pA = api.plot(vA, { xr: [0, 4], yr: [-2, 12], xticks: 4, yticks: 7, xlabel: "presupuesto x (×10 M€)", ylabel: "horas vistas y", pad: { l: 40, r: 12, t: 12, b: 36 } });
  var coarse = !!(window.matchMedia && matchMedia("(pointer:coarse)").matches);
  var vB = api.view(p2, { aspect: 1.05, minH: 250, drag: !coarse, label: "Mapa del coste con el camino del descenso; haz clic para elegir el punto de partida" });
  var pB = api.plot(vB, { xr: [-1, 7], yr: [-5, 3], xticks: 4, yticks: 4, xlabel: "w", ylabel: "b", pad: { l: 40, r: 12, t: 12, b: 36 } });
  var heat = makeHeat(vB);
  var vC = api.view(root, { aspect: 4.2, minH: 120, maxH: 170, label: "Curva de aprendizaje: log del MSE frente al paso" });
  var pC = api.plot(vC, { xr: [0, 60], yr: [-6, 3], xticks: 6, yticks: 3, xlabel: "paso", yfmt: function (t) { return "1e" + t; }, pad: { l: 46, r: 12, t: 8, b: 32 } });
  var ui = api.controls(root);
  var sl = ui.slider({ label: "learning rate (lr)", min: 0.005, max: 0.3, step: 0.005, value: lr, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { lr = v; reset(); } });
  ui.toggle({ label: "Centrar x (presupuesto − media: −1, 0, 1)", value: false, onChange: function (on) { centered = on; setData(); } });
  ui.button("Un paso", function () { if (!loop.running) step(); }, "primary");
  var bPlay = ui.button("Ejecutar", function () {
    if (loop.running) { loop.stop(); return; }
    if (status !== "run") reset();
    if (api.reduceMotion) { for (var q = 0; q < 2000 && status === "run"; q++) advance(); redraw(); } else loop.start();
  });
  ui.button("Volver al inicio", function () { reset(); });
  var out = api.readout(root);

  function setData() {
    X = centered ? [-1, 0, 1] : [1, 2, 3];
    pA.xr = centered ? [-2, 2] : [0, 4]; pB.yr = centered ? [-1, 9] : [-5, 3];
    heat.invalidate(); reset();
  }
  function advance() {
    var g = grad(w, b);
    w -= lr * g[0]; b -= lr * g[1]; k++; trail.push([w, b]);
    var m = mse(w, b); hist.push(m);
    if (!isFinite(m) || m > 1e8) status = "diverge";
    else if (m < 1e-6) status = "converge";
    else if (k >= 3000) status = "limit";
  }
  function step() { if (status === "run") { advance(); redraw(); } }
  function reset() { if (loop) loop.stop(); w = w0; b = b0; k = 0; trail = [[w, b]]; hist = [mse(w, b)]; status = "run"; redraw(); }
  loop = api.loop(function () { for (var q = 0; q < 4 && status === "run"; q++) advance(); redraw(); return status === "run"; }, { fps: 30, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Ejecutar"; } });

  function drawA(ctx, W, H, C) {
    var D = api.d, i, x0 = pA.xr[0], x1 = pA.xr[1];
    pA.axes(ctx); ctx.save(); pA.clip(ctx);
    D.line(ctx, pA.x(x0), pA.y(w * x0 + b), pA.x(x1), pA.y(w * x1 + b), C.cobalto, 3);
    for (i = 0; i < n; i++) D.line(ctx, pA.x(X[i]), pA.y(Y[i]), pA.x(X[i]), pA.y(w * X[i] + b), C.terracota, 2.5);
    for (i = 0; i < n; i++) D.circle(ctx, pA.x(X[i]), pA.y(Y[i]), 6, C.terracota, C.paper, 1.5);
    ctx.restore();
    D.text(ctx, "recta de predicción actual", pA.box.x + 8, pA.box.y + 16, { size: 11, color: C.cobaltoInk, weight: 600 });
  }
  function drawB(ctx, W, H, C) {
    var D = api.d, i, bx = pB.box;
    pB.axes(ctx); heat(ctx, pB, C, mse, 160);
    ctx.save(); pB.clip(ctx);
    D.circle(ctx, pB.x(3), pB.y(centered ? 5 : -1), 7, C.marker, C.ink, 2);
    D.path(ctx, trail.map(function (p) { return [pB.x(p[0]), pB.y(p[1])]; }), C.cobaltoInk, 1.6);
    for (i = 0; i < trail.length && i < 80; i++) D.circle(ctx, pB.x(trail[i][0]), pB.y(trail[i][1]), 3, C.paper, C.cobaltoInk, 1.2);
    D.circle(ctx, pB.x(w), pB.y(b), 6.5, C.cobalto, C.paper, 2);
    ctx.restore();
    D.text(ctx, "amarillo = mínimo; clic = nueva partida", bx.x + 8, bx.y + 16, { size: 10.5, color: C.ink, weight: 600 });
  }
  function drawC(ctx, W, H, C) {
    var D = api.d, mx = Math.max(60, Math.ceil((hist.length - 1) / 60) * 60);
    pC.xr = [0, mx]; pC.axes(ctx); ctx.save(); pC.clip(ctx);
    D.path(ctx, hist.map(function (m, i) { return [pC.x(i), pC.y(api.math.clamp(Math.log(Math.max(m, 1e-12)) / Math.LN10, -6, 3))]; }), C.terracota, 2.5);
    ctx.restore();
  }
  function f3(v) { return Math.abs(v) > 1e6 ? v.toExponential(1) : v.toFixed(3); }
  function redraw() {
    vA.redraw(); vB.redraw(); vC.redraw();
    var g = grad(w, b), m = mse(w, b), msg = "";
    if (status === "converge") msg = "<br><span class='good'>CONVERGE: MSE &lt; 1e-6 en " + k + " pasos. (w, b) = (" + w.toFixed(3) + ", " + b.toFixed(3) + ").</span>";
    else if (status === "diverge") msg = "<br><span class='bad'>DIVERGE: cada paso se pasa del fondo y acaba más arriba. lr demasiado grande para esta forma de valle.</span>";
    else if (status === "limit") msg = "<br><span class='bad'>3000 pasos y aún sin asentarse.</span>";
    out.set("paso <b>" + k + "</b> · w = <b>" + f3(w) + "</b> · b = <b>" + f3(b) + "</b> · MSE = <b>" + (m > 1e6 ? m.toExponential(1) : m.toFixed(4)) + "</b><br>" +
      "gradiente: dw = <b>" + f3(g[0]) + "</b>, db = <b>" + f3(g[1]) + "</b><br>" +
      "siguiente: w = " + f3(w) + " − " + lr.toFixed(3) + "·(" + f3(g[0]) + ") = <b>" + f3(w - lr * g[0]) + "</b> · b = " + f3(b) + " − " + lr.toFixed(3) + "·(" + f3(g[1]) + ") = <b>" + f3(b - lr * g[1]) + "</b>" + msg);
  }
  function pick(px, py) {
    if (!pB.inside(px, py)) return;
    w0 = Math.round(pB.ix(px) * 10) / 10; b0 = Math.round(pB.iy(py) * 10) / 10; reset();
  }
  /* táctil: la pantalla no se queda atrapada en el mapa (se desplaza con normalidad); un toque corto elige el punto */
  vB.pointer({ down: function (px, py) { if (!coarse) pick(px, py); }, drag: function (px, py) { if (!coarse) pick(px, py); }, up: function (px, py, e) { if (coarse && e.type === "pointerup") pick(px, py); } });
  vA.draw(drawA); vB.draw(drawB); vC.draw(drawC); reset();
  return { destroy: function () { loop.stop(); } };
});

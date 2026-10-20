/* Experimento: el coste MSE como paisaje: parábola con un parámetro, cuenco con dos. */
Lab.register("curso4/c4m3-superficie", function (root, api) {
  var X = [1, 2, 3], Y = [2, 5, 8], n = 3, w = 0, b = 0, mode = "dos";
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
  var row = api.el("div", { class: "lab-row" }); root.appendChild(row);
  var p1 = api.el("div", { style: { minWidth: 0 } }), p2 = api.el("div", { style: { minWidth: 0 } }); row.appendChild(p1); row.appendChild(p2);
  var vA = api.view(p1, { aspect: 1.05, minH: 250, label: "Los tres puntos y la recta con los parámetros elegidos" });
  var pA = api.plot(vA, { xr: [0, 4], yr: [-2, 10], xticks: 4, yticks: 4, xlabel: "x", ylabel: "y", pad: { l: 40, r: 12, t: 12, b: 36 } });
  var vB = api.view(p2, { aspect: 1.05, minH: 250, drag: true, label: "El coste MSE en función de los parámetros: haz clic o arrastra para elegir w y b" });
  var po = { xr: [-1, 7], yr: [-5, 3], xticks: 4, yticks: 4, xlabel: "w", ylabel: "b", pad: { l: 40, r: 12, t: 12, b: 36 } };
  var pB = api.plot(vB, po);
  var heat = makeHeat(vB);
  var ui = api.controls(root);
  ui.segmented({ label: "¿Cuántos parámetros se mueven?", options: [["uno", "Solo w (b = −1 fijo)"], ["dos", "w y b"]], value: mode, onChange: function (v) { setMode(v); } });
  var sw = ui.slider({ label: "w (pendiente)", min: -1, max: 7, step: 0.05, value: w, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { w = v; update(); } });
  var sb = ui.slider({ label: "b (sesgo)", min: -5, max: 3, step: 0.05, value: b, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { b = v; update(); } });
  var out = api.readout(root);

  function setMode(m) {
    mode = m;
    if (m === "uno") { b = -1; sb.set(-1, true); po.yr = [0, 80]; pB.yr = [0, 80]; po.ylabel = "MSE"; po.yticks = 4; sb.input.parentNode.style.display = "none"; }
    else { po.yr = [-5, 3]; pB.yr = [-5, 3]; po.ylabel = "b"; po.yticks = 4; sb.input.parentNode.style.display = ""; }
    update();
  }
  function drawA(ctx, W, H, C) {
    var D = api.d, i; pA.axes(ctx); ctx.save(); pA.clip(ctx);
    D.line(ctx, pA.x(0), pA.y(b), pA.x(4), pA.y(w * 4 + b), C.cobalto, 3);
    for (i = 0; i < n; i++) D.line(ctx, pA.x(X[i]), pA.y(Y[i]), pA.x(X[i]), pA.y(w * X[i] + b), C.terracota, 2.5);
    for (i = 0; i < n; i++) D.circle(ctx, pA.x(X[i]), pA.y(Y[i]), 6, C.terracota, C.paper, 1.5);
    ctx.restore();
    D.text(ctx, "la recta ŷ = w·x + b", pA.box.x + 8, pA.box.y + 16, { size: 11, color: C.cobaltoInk, weight: 600 });
  }
  function drawB(ctx, W, H, C) {
    var D = api.d, bx = pB.box, g = grad(w, b), i;
    pB.axes(ctx);
    if (mode === "dos") {
      heat(ctx, pB, C, mse, 160);
      ctx.save(); pB.clip(ctx);
      D.circle(ctx, pB.x(3), pB.y(-1), 7, C.marker, C.ink, 2);
      var px = pB.x(w), py = pB.y(b), vx = -g[0], vy = g[1], L = Math.sqrt(vx * vx + vy * vy) || 1, len = Math.min(46, 8 + L * 2.2);
      if (L > 1e-6) D.arrow(ctx, px, py, px + vx / L * len, py + vy / L * len, C.oliva, 3);
      D.circle(ctx, px, py, 7, C.cobalto, C.paper, 2);
      ctx.restore();
      D.text(ctx, "punto amarillo = mínimo (3, −1)", bx.x + 8, bx.y + 16, { size: 11, color: C.ink, weight: 600 });
      D.text(ctx, "flecha verde = hacia dónde baja el coste", bx.x + 8, bx.y + bx.h - 8, { size: 10.5, color: C.olivaInk, weight: 600 });
    } else {
      ctx.save(); pB.clip(ctx);
      var pts = [], k;
      for (k = 0; k <= 160; k++) { var wv = -1 + 8 * k / 160; pts.push([pB.x(wv), pB.y(mse(wv, -1))]); }
      D.path(ctx, pts, C.ink, 3);
      D.line(ctx, pB.x(3), bx.y, pB.x(3), bx.y + bx.h, C.oliva, 1.5, [4, 4]);
      var m = grad(w, -1)[0], y0 = mse(w, -1), dx = 1.2;
      D.line(ctx, pB.x(w - dx), pB.y(y0 - m * dx), pB.x(w + dx), pB.y(y0 + m * dx), C.terracota, 2.5);
      D.circle(ctx, pB.x(w), pB.y(y0), 7, C.cobalto, C.paper, 2);
      ctx.restore();
      D.text(ctx, "MSE(w) = 4,67·(w − 3)²", bx.x + 8, bx.y + 16, { size: 11, color: C.ink, weight: 600 });
      D.text(ctx, "mínimo en w = 3", pB.x(3) + 6, bx.y + bx.h - 8, { size: 10.5, color: C.olivaInk, weight: 600 });
      D.text(ctx, "recta roja = pendiente", bx.x + 8, bx.y + 31, { size: 10.5, color: C.terracotaInk, weight: 600 });
    }
  }
  function update() {
    var es = [], i, s = 0, g = grad(w, b);
    for (i = 0; i < n; i++) { var e = w * X[i] + b - Y[i]; es.push(e * e); s += e * e; }
    vA.redraw(); vB.redraw();
    out.set("w = <b>" + w.toFixed(2) + "</b>" + (mode === "dos" ? ", b = <b>" + b.toFixed(2) + "</b>" : " (b = −1)") + "<br>" +
      "MSE = (" + es.map(function (v) { return v.toFixed(2); }).join(" + ") + ") / 3 = <b>" + (s / n).toFixed(3) + "</b><br>" +
      (mode === "dos" ? "pendiente del paisaje: ∂MSE/∂w = <b>" + g[0].toFixed(2) + "</b> · ∂MSE/∂b = <b>" + g[1].toFixed(2) + "</b>" : "pendiente de la parábola: dMSE/dw = <b>" + g[0].toFixed(2) + "</b>") +
      (s / n < 0.01 ? "<br><span class='good'>estás en el fondo: coste casi 0</span>" : ""));
  }
  function pick(px, py) {
    if (!pB.inside(px, py)) return;
    w = api.math.clamp(Math.round(pB.ix(px) * 20) / 20, -1, 7); sw.set(w, true);
    if (mode === "dos") { b = api.math.clamp(Math.round(pB.iy(py) * 20) / 20, -5, 3); sb.set(b, true); }
    update();
  }
  vB.pointer({ down: pick, drag: pick });
  vA.draw(drawA); vB.draw(drawB); update();
});

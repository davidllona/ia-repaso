/* Experimento: sin activación no lineal, dos capas colapsan en una y XOR es imposible; con ReLU sí se puede.
   Red 2-2-1 con pesos fijos: h1 = f(x1 + x2), h2 = f(x1 + x2 - 1), y = h1 - 2·h2. f(z) = z si z > 0; alfa·z si no. */
Lab.register("curso2/c2m1-sin-no-linealidad", function (root, api) {
  var M = api.math, D = api.d, C0 = api.colors();
  var S = { alfa: 1, p: 0 };
  var PTS = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]];   // x1, x2, clase (XOR)

  function f(z) { return z > 0 ? z : S.alfa * z; }
  function net(x1, x2) {
    var z1 = x1 + x2, z2 = x1 + x2 - 1, h1 = f(z1), h2 = f(z2);
    return { z1: z1, z2: z2, h1: h1, h2: h2, y: h1 - 2 * h2 };
  }

  var row = api.el("div", { class: "lab-row" });
  var colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var view = api.view(colA, { aspect: 1.0, minH: 250, maxH: 440, label: "Plano de entradas del XOR con la salida de la red coloreada y los cuatro puntos" });
  var plot = api.plot(view, { xr: [-0.5, 1.5], yr: [-0.5, 1.5], xticks: 4, yticks: 4, xlabel: "x₁", ylabel: "x₂", pad: { l: 46, r: 12, t: 12, b: 36 },
    xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var view2 = api.view(colB, { aspect: 1.0, minH: 250, maxH: 440, label: "Diagrama de la red 2-2-1 con los valores del punto elegido" });

  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var slider = ui.slider({ label: "Pendiente de la parte negativa α  (1 = sin activación · 0 = ReLU)", min: 0, max: 1, step: 0.05, value: 1,
    fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.alfa = v; update(); } });
  ui.segmented({ label: "Punto que sigues por la red", value: 0, options: [[0, "(0, 0)"], [1, "(0, 1)"], [2, "(1, 0)"], [3, "(1, 1)"]], onChange: function (v) { S.p = v; update(); } });
  ui.button("Sin activación (α = 1)", function () { slider.set(1); }, "warm");
  ui.button("ReLU (α = 0)", function () { slider.set(0); }, "primary");
  api.legend(root, [[C0.cobalto, "la red responde «1»"], [C0.terracota, "la red responde «0»"]]);

  function drawPlane(ctx, w, h, C) {
    var b = plot.box, n = 30, cw = b.w / n, ch = b.h / n, i, j;
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      var px = Math.round(b.x + i * cw), py = Math.round(b.y + j * ch);
      var pw = Math.round(b.x + (i + 1) * cw) - px, ph = Math.round(b.y + (j + 1) * ch) - py;
      var y = net(plot.ix(b.x + (i + 0.5) * cw), plot.iy(b.y + (j + 0.5) * ch)).y, t = M.clamp(y, 0, 1);
      ctx.globalAlpha = 0.4 * t; ctx.fillStyle = C.cobalto; ctx.fillRect(px, py, pw, ph);
      ctx.globalAlpha = 0.4 * (1 - t); ctx.fillStyle = C.terracota; ctx.fillRect(px, py, pw, ph);
    }
    ctx.restore();
    PTS.forEach(function (p, k) {
      var o = net(p[0], p[1]), ok = (o.y > 0.5) === (p[2] === 1), px = plot.x(p[0]), py = plot.y(p[1]);
      D.circle(ctx, px, py, k === S.p ? 11 : 8, p[2] ? C.cobalto : C.terracota, k === S.p ? C.marker : C.ink, k === S.p ? 3.5 : 2);
      var top = p[1] > 0.5;
      D.text(ctx, "y=" + o.y.toFixed(2) + (ok ? " ✓" : " ✗"), px, top ? py - 17 : py + 25,
        { size: 11, mono: true, weight: 600, align: "center", color: ok ? C.olivaInk : C.terracotaInk });
    });
  }

  function drawNet(ctx, w, h, C) {
    var P = PTS[S.p], o = net(P[0], P[1]);
    var X = [0.13 * w, 0.5 * w, 0.87 * w], r = Math.max(14, Math.min(21, w * 0.05));
    var yIn = [0.3 * h, 0.7 * h], yH = [0.3 * h, 0.7 * h], yO = 0.5 * h;
    var nodes = { x1: [X[0], yIn[0]], x2: [X[0], yIn[1]], h1: [X[1], yH[0]], h2: [X[1], yH[1]], y: [X[2], yO] };
    function edge(a, b, wt, t, up) {
      var A = nodes[a], B = nodes[b];
      D.line(ctx, A[0], A[1], B[0], B[1], wt >= 0 ? C.cobalto : C.terracota, 1 + Math.min(2.5, Math.abs(wt) * 1.1));
      var lx = A[0] + (B[0] - A[0]) * t, ly = A[1] + (B[1] - A[1]) * t;
      var s = String(wt).replace("-", "−");
      ctx.save(); ctx.font = "600 11px 'IBM Plex Mono',monospace";
      var tw = ctx.measureText(s).width + 6; ctx.restore();
      D.rect(ctx, lx - tw / 2, ly - 8, tw, 16, C.surface, null);
      D.text(ctx, s, lx, ly + 4, { size: 11, mono: true, weight: 600, align: "center", color: C.ink });
    }
    edge("x1", "h1", 1, 0.3); edge("x1", "h2", 1, 0.3); edge("x2", "h1", 1, 0.3); edge("x2", "h2", 1, 0.3);
    edge("h1", "y", 1, 0.4); edge("h2", "y", -2, 0.4);
    function node(k, label, fill) { var p = nodes[k]; D.circle(ctx, p[0], p[1], r, fill, C.ink, 2); D.text(ctx, label, p[0], p[1] + 4, { size: 12, weight: 600, align: "center", color: C.ink }); }
    node("x1", "x₁", C.paper); node("x2", "x₂", C.paper); node("h1", "h₁", C.cobaltoWash); node("h2", "h₂", C.cobaltoWash); node("y", "y", C.terracotaWash);
    function lines(k, arr, below) {
      var p = nodes[k], y0 = below ? p[1] + r + 14 : p[1] - r - 6 - 14 * (arr.length - 1);
      arr.forEach(function (t, i) { D.text(ctx, t, p[0], y0 + 14 * i, { size: 11, mono: true, align: "center", color: i === arr.length - 1 ? C.ink : C.muted, weight: i === arr.length - 1 ? 600 : 400 }); });
    }
    function v(x) { return (Math.abs(x) < 5e-10 ? 0 : x).toFixed(2).replace("-", "−"); }
    lines("x1", ["x₁ = " + P[0]], false); lines("x2", ["x₂ = " + P[1]], true);
    lines("h1", ["b = 0", "z = " + v(o.z1), "h = " + v(o.h1)], false);
    lines("h2", ["b = −1", "z = " + v(o.z2), "h = " + v(o.h2)], true);
    lines("y", ["b = 0", "y = " + v(o.y)], true);
  }

  function update() {
    var o = net(PTS[S.p][0], PTS[S.p][1]), P = PTS[S.p];
    function v(x) { return (Math.abs(x) < 5e-10 ? 0 : x).toFixed(2); }
    var ys = PTS.map(function (p) { return net(p[0], p[1]).y; });
    var one = [ys[1], ys[2]], zero = [ys[0], ys[3]];
    var sep = Math.min.apply(null, one) > Math.max.apply(null, zero) || Math.max.apply(null, one) < Math.min.apply(null, zero);
    var hits = PTS.filter(function (p, k) { return (ys[k] > 0.5) === (p[2] === 1); }).length;
    out.set(
      "Punto (" + P[0] + ", " + P[1] + "): h₁ = f(" + v(o.z1) + ") = <b>" + v(o.h1) + "</b> · h₂ = f(" + v(o.z2) + ") = <b>" + v(o.h2) + "</b><br>" +
      "y = h₁ − 2·h₂ = " + v(o.h1) + " − 2·(" + v(o.h2) + ") = <b>" + v(o.y) + "</b><br>" +
      "Salidas de los 4 puntos: (0,0)→" + v(ys[0]) + " · (0,1)→" + v(ys[1]) + " · (1,0)→" + v(ys[2]) + " · (1,1)→" + v(ys[3]) + "<br>" +
      "Con umbral 0,5 aciertas <b>" + hits + " de 4</b>. " +
      (sep ? "<span class='good'>Los «1» y los «0» quedan a lados distintos: un umbral los separa. XOR resuelto.</span>"
           : "<span class='bad'>Hay un «0» por encima y otro por debajo de los «1»: NINGÚN umbral separa las clases.</span>") +
      (S.alfa === 1 ? "<br>Con α = 1 las dos capas colapsan: y = (x₁+x₂) − 2(x₁+x₂−1) = <b>2 − x₁ − x₂</b>, una sola capa." : "")
    );
    view.redraw(); view2.redraw();
  }

  view.draw(drawPlane); view2.draw(drawNet); update();
});

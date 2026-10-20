/* Experimento: un "embedding" de 2 números por palabra. Cada palabra es una flecha desde el origen; arrastra su punta y
   se recalcula la similitud coseno (el ángulo entre flechas) y la distancia euclídea con otra palabra. */
Lab.register("curso2/c2m4-embeddings-2d", function (root, api) {
  var D = api.d, C0 = api.colors();
  var words = [
    ["gato", 4, 3], ["perro", 3, 4], ["caballo", 4.6, 1.6],
    ["coche", -3, 4], ["tren", -4.4, 2.6], ["bici", -2, 4.7],
    ["pan", -1.6, -4.2], ["queso", -3, -3.6], ["manzana", -0.4, -4.8],
    ["Madrid", 4.5, -1.5], ["Roma", 4.1, -2.8], ["París", 3, -3.8]
  ];
  var W = words.map(function (w) { return { t: w[0], x: w[1], y: w[2], x0: w[1], y0: w[2] }; });
  var S = { a: 0, b: 1, drag: -1 };
  var LIM = 6;

  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function dot(p, q) { return p.x * q.x + p.y * q.y; }
  function len(p) { return Math.sqrt(p.x * p.x + p.y * p.y); }
  function cos(p, q) { var l = len(p) * len(q); return l < 1e-9 ? 0 : dot(p, q) / l; }
  function ang(p) { return Math.atan2(p.y, p.x); }

  var view = api.view(root, { aspect: 1.25, minH: 320, maxH: 520, drag: true, label: "Plano con doce palabras dibujadas como flechas desde el origen; se pueden arrastrar" });
  var plot = api.plot(view, { xr: [-LIM, LIM], yr: [-LIM, LIM], xticks: 6, yticks: 6, pad: { l: 12, r: 12, t: 12, b: 12 }, grid: true,
    xfmt: function () { return ""; }, yfmt: function () { return ""; } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var selB = ui.select({ label: "Comparar la palabra seleccionada (A) con…", value: W[S.b].t, options: W.map(function (w, i) { return [i, w.t]; }), onChange: function (v) { S.b = parseInt(v, 10); update(); } });
  ui.button("Duplicar la longitud de A (×2)", function () { W[S.a].x *= 2; W[S.a].y *= 2; clampAll(); update(); });
  ui.button("Devolver las palabras a su sitio", function () { W.forEach(function (w) { w.x = w.x0; w.y = w.y0; }); update(); });
  api.legend(root, [[C0.terracota, "A (la que arrastras)"], [C0.cobalto, "B (con la que comparas)"], [C0.muted, "las demás"]]);

  function clampAll() { W.forEach(function (w) { w.x = Math.max(-LIM + 0.3, Math.min(LIM - 0.3, w.x)); w.y = Math.max(-LIM + 0.3, Math.min(LIM - 0.3, w.y)); }); }

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var ox = plot.x(0), oy = plot.y(0), b = plot.box, i;
    D.line(ctx, b.x, oy, b.x + b.w, oy, C.muted, 1);
    D.line(ctx, ox, b.y, ox, b.y + b.h, C.muted, 1);
    var A = W[S.a], B = W[S.b];
    // arco del ángulo entre A y B
    if (S.a !== S.b) {
      var a1 = ang(A), a2 = ang(B), da = a2 - a1;
      while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      ctx.save(); ctx.strokeStyle = C.marker; ctx.lineWidth = 4; ctx.beginPath();
      var rad = Math.min(b.w, b.h) * 0.16;
      // el eje y del canvas está invertido
      ctx.arc(ox, oy, rad, -a1, -(a1 + da), da > 0); ctx.stroke(); ctx.restore();
    }
    for (i = 0; i < W.length; i++) {
      var p = W[i], px = plot.x(p.x), py = plot.y(p.y), col = i === S.a ? C.terracota : (i === S.b ? C.cobalto : C.muted);
      D.arrow(ctx, ox, oy, px, py, col, i === S.a || i === S.b ? 2.2 : 1.2);
      D.circle(ctx, px, py, i === S.a ? 7 : 5, col, C.paper, 1.5);
      var l = Math.sqrt((px - ox) * (px - ox) + (py - oy) * (py - oy)) || 1, ux = (px - ox) / l, uy = (py - oy) / l;
      var tx = px + ux * 16, ty = py + uy * 14 + 4;
      tx = Math.max(b.x + 24, Math.min(b.x + b.w - 24, tx)); ty = Math.max(b.y + 12, Math.min(b.y + b.h - 4, ty));
      D.text(ctx, p.t, tx, ty, { size: 12, align: "center", weight: i === S.a || i === S.b ? 600 : 400, color: i === S.a ? C.terracotaInk : (i === S.b ? C.cobaltoInk : C.ink2) });
    }
  }
  function nearest(px, py) {
    var best = -1, bd = 22 * 22;
    W.forEach(function (p, i) { var dx = plot.x(p.x) - px, dy = plot.y(p.y) - py, d2 = dx * dx + dy * dy; if (d2 < bd) { bd = d2; best = i; } });
    return best;
  }
  view.pointer({
    down: function (px, py) {
      var i = nearest(px, py);
      if (i >= 0) {
        S.drag = i;
        if (i !== S.a) { if (i === S.b) { S.b = S.a; selB.set(S.b); } S.a = i; }
        update();
      }
    },
    drag: function (px, py) {
      if (S.drag < 0) return;
      W[S.drag].x = Math.max(-LIM + 0.3, Math.min(LIM - 0.3, plot.ix(px)));
      W[S.drag].y = Math.max(-LIM + 0.3, Math.min(LIM - 0.3, plot.iy(py)));
      update();
    },
    up: function () { S.drag = -1; }
  });
  view.draw(draw);

  function update() {
    view.redraw();
    var A = W[S.a], B = W[S.b];
    selB.set(S.b);
    var c = cos(A, B), d = Math.sqrt((A.x - B.x) * (A.x - B.x) + (A.y - B.y) * (A.y - B.y));
    var angle = Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
    var near = W.map(function (q, i) { return { i: i, c: cos(A, q) }; }).filter(function (o) { return o.i !== S.a; }).sort(function (p, q) { return q.c - p.c; }).slice(0, 3);
    var verdict = c > 0.8 ? "<span class='good'>muy parecidas (apuntan casi en la misma dirección)</span>" : c < 0.2 ? (c < -0.2 ? "<span class='bad'>opuestas</span>" : "<span class='bad'>sin relación (casi perpendiculares)</span>") : "parecido moderado";
    out.set("A = <b>" + A.t + "</b> (" + n(A.x) + ", " + n(A.y) + ")   B = <b>" + B.t + "</b> (" + n(B.x) + ", " + n(B.y) + ")<br>" +
      "A·B = " + n(A.x) + "·" + n(B.x) + " + " + n(A.y) + "·" + n(B.y) + " = <b>" + n(dot(A, B)) + "</b>   |A| = " + n(len(A)) + "   |B| = " + n(len(B)) + "<br>" +
      "coseno = A·B / (|A|·|B|) = <b>" + n(c, 3) + "</b> → ángulo = <b>" + n(angle, 1) + "°</b> → " + verdict + "<br>" +
      "distancia euclídea = <b>" + n(d) + "</b> (cambia si alargas A; el coseno no)<br>" +
      "Más parecidas a " + A.t + ": " + near.map(function (o) { return "<b>" + W[o.i].t + "</b> (" + n(o.c, 2) + ")"; }).join(", "));
  }
  update();
});

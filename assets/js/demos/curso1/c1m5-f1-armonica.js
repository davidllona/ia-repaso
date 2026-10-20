/* Experimento: F1 es la media ARMÓNICA de precision y recall (castiga el desequilibrio), no la aritmética. */
Lab.register("curso1/c1m5-f1-armonica", function (root, api) {
  var M = api.math, D = api.d;
  var st = { p: 0.9, r: 0.1, beta: 1 };

  function hex(c) {
    c = c.trim();
    if (c[0] === "#") { if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
    var m = c.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2]];
  }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," + Math.round(A[1] + (B[1] - A[1]) * t) + "," + Math.round(A[2] + (B[2] - A[2]) * t) + ")";
  }
  function fb(p, r, b) { var b2 = b * b; return (p + r) === 0 ? 0 : (1 + b2) * p * r / (b2 * p + r); }

  var view = api.view(root, { aspect: 1.45, minH: 270, maxH: 430, drag: true, label: "Mapa de color del valor F según precision (horizontal) y recall (vertical), con un punto que se puede arrastrar" });
  var plot = api.plot(view, { xr: [0, 1], yr: [0, 1], xticks: 5, yticks: 5, xlabel: "precision", ylabel: "recall", pad: { l: 46, r: 12, t: 12, b: 38 }, grid: false });
  var ui = api.controls(root), out = api.readout(root);
  var seg = ui.segmented({ label: "Qué medida combina precision y recall", options: [[0.5, "F0.5 (pesa más la precision)"], [1, "F1 (equilibrada)"], [2, "F2 (pesa más el recall)"]], value: st.beta, onChange: function (v) { st.beta = v; update(); } });
  ui.button("Precision 0,9 · recall 0,1", function () { st.p = 0.9; st.r = 0.1; update(); });
  ui.button("Precision = recall = 0,6", function () { st.p = 0.6; st.r = 0.6; update(); });
  ui.button("Caso de los éxitos: 0,43 y 0,60", function () { st.p = 0.4286; st.r = 0.6; update(); });
  var C0 = api.colors();
  api.legend(root, [[C0.ink, "línea de puntos: media aritmética = 0,5"], [C0.muted, "línea discontinua: precision = recall"]]);

  function draw(ctx, w, h, C) {
    var b = plot.box, n = 36, i, j;
    plot.axes(ctx);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      var p = (i + 0.5) / n, r = (j + 0.5) / n, v = fb(p, r, st.beta);
      ctx.fillStyle = mix(C.terracotaWash, C.cobalto, Math.pow(v, 0.9));
      ctx.fillRect(b.x + b.w * i / n, b.y + b.h - b.h * (j + 1) / n, b.w / n + 0.6, b.h / n + 0.6);
    }
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
    D.line(ctx, plot.x(0), plot.y(0), plot.x(1), plot.y(1), C.muted, 1.5, [6, 4]);
    D.line(ctx, plot.x(0), plot.y(1), plot.x(1), plot.y(0), C.ink, 1.8, [2, 4]);
    var px = plot.x(st.p), py = plot.y(st.r);
    D.line(ctx, px, py, px, plot.y(0), C.ink, 1, [3, 3]);
    D.line(ctx, plot.x(0), py, px, py, C.ink, 1, [3, 3]);
    D.circle(ctx, px, py, 9, C.terracota, C.ink, 2.5);
    var v = fb(st.p, st.r, st.beta), tx = px > b.x + b.w * 0.6 ? px - 16 : px + 16;
    D.text(ctx, "F = " + v.toFixed(2), tx, py - 14, { size: 12, weight: 600, align: px > b.x + b.w * 0.6 ? "right" : "left", color: C.ink });
  }

  function update() {
    view.redraw();
    var p = st.p, r = st.r, am = (p + r) / 2, f = fb(p, r, st.beta), name = st.beta === 1 ? "F1" : "F" + st.beta;
    out.set("precision = <b>" + p.toFixed(2) + "</b> · recall = <b>" + r.toFixed(2) + "</b><br>" +
      "media aritmética = (P+R)/2 = <b>" + am.toFixed(3) + "</b><br>" +
      name + " = (1+β²)·P·R / (β²·P + R) = <b>" + f.toFixed(3) + "</b> " +
      (am - f > 0.05 ? "<span class='bad'>← mucho menos que la media: uno de los dos es flojo</span>" : "<span class='good'>← los dos están parecidos y F no se aleja de la media</span>"));
  }
  function move(px, py) {
    st.p = M.clamp(Math.round(plot.ix(px) * 100) / 100, 0.01, 1); st.r = M.clamp(Math.round(plot.iy(py) * 100) / 100, 0.01, 1); update();
  }
  view.pointer({ down: move, drag: move });
  view.draw(draw); update();
});

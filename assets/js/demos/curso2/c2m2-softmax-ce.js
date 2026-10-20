/* Experimento: softmax y entropía cruzada categórica con logits editables. */
Lab.register("curso2/c2m2-softmax-ce", function (root, api) {
  var M = api.math;
  var NAMES = ["acción", "comedia", "terror", "romance", "animación"];
  var st = { k: 3, z: [2.0, 1.0, 0.1, -1.0, 0.5], y: 0 };
  var sl = [];

  var view = api.view(root, { aspect: 2.3, minH: 200, maxH: 280, label: "Probabilidades que da softmax para cada género de película, junto a la etiqueta One-Hot" });
  var tbl = api.table(root, ["género", "z", "e^z", "p", "y", "y·ln p"]);
  var view2 = api.view(root, { aspect: 3.2, minH: 140, maxH: 200, label: "Curva de la pérdida −ln(p): cuanto menos probabilidad a la clase correcta, más pérdida" });
  var plot2 = api.plot(view2, { xr: [0, 1], yr: [0, 5], xticks: 5, yticks: 5, xlabel: "p = probabilidad que la red da a la clase CORRECTA", ylabel: "−ln(p)", pad: { l: 44, r: 12, t: 10, b: 34 } });
  var ui = api.controls(root), out = api.readout(root);
  var slK = ui.slider({ label: "Número de géneros (clases)", min: 2, max: 5, step: 1, value: st.k, onInput: function (v) { st.k = v; if (st.y >= v) { st.y = 0; segSet(); } update(); } });
  var seg = ui.segmented({ label: "Género verdadero de la película (la etiqueta)", value: 0, options: [[0, "0 acción"], [1, "1 comedia"], [2, "2 terror"], [3, "3 romance"], [4, "4 animación"]], onChange: function (v) { st.y = Math.min(v, st.k - 1); update(); } });
  for (var i = 0; i < 5; i++) (function (i) {
    sl[i] = ui.slider({ label: "logit z" + i + " (" + NAMES[i] + ")", min: -4, max: 6, step: 0.1, value: st.z[i], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.z[i] = v; update(); } });
  })(i);
  ui.button("Todos los logits iguales", function () { for (var j = 0; j < 5; j++) { st.z[j] = 0; sl[j].set(0, true); } update(); });
  ui.button("Ejemplo del texto (2, 1, 0.1)", function () { st.k = 3; st.y = 0; st.z = [2.0, 1.0, 0.1, -1.0, 0.5]; for (var j = 0; j < 5; j++) sl[j].set(st.z[j], true); slK.set(3, true); segSet(); update(); }, "primary");

  function segSet() { var bs = ui.el.querySelectorAll(".seg button"); bs.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === st.y)); }); }
  function probs() { return M.softmax(st.z.slice(0, st.k)); }

  function draw(ctx, w, h, C) {
    var D = api.d, p = probs(), k = st.k, left = 70, right = w - 40, top = 12, rowH = (h - top - 8) / k, i;
    D.text(ctx, "probabilidad (softmax)", left, 9, { size: 10.5, color: C.muted });
    for (i = 0; i < k; i++) {
      var y0 = top + i * rowH + rowH * 0.16, bh = rowH * 0.68, isT = i === st.y;
      D.text(ctx, NAMES[i], 10, y0 + bh / 2 + 4, { size: 11.5, weight: isT ? 700 : 500, color: isT ? C.terracotaInk : C.ink });
      D.rect(ctx, left, y0, right - left - 4, bh, C.surface, C.line, 1);
      D.rect(ctx, left, y0, (right - left - 4) * p[i], bh, isT ? C.terracota : C.cobalto, null);
      var lab = p[i].toFixed(3);
      var inside = (right - left - 4) * p[i] > 46;
      D.text(ctx, lab, inside ? left + (right - left - 4) * p[i] - 5 : left + (right - left - 4) * p[i] + 5, y0 + bh / 2 + 4, { align: inside ? "right" : "left", size: 11.5, mono: true, weight: 600, color: inside ? C.paper : C.ink });
      D.circle(ctx, w - 18, y0 + bh / 2, 9, isT ? C.oliva : null, C.ink, 1.5);
      D.text(ctx, isT ? "1" : "0", w - 18, y0 + bh / 2 + 4, { align: "center", size: 11, weight: 700, color: isT ? C.paper : C.muted });
    }
    D.text(ctx, "y", w - 18, 9, { align: "center", size: 10.5, color: C.muted });
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, p = probs()[st.y], pts = [], i;
    plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    for (i = 1; i <= 200; i++) { var x = i / 200; pts.push([plot2.x(x), plot2.y(Math.min(5, -Math.log(x)))]); }
    D.path(ctx, pts, C.ink2, 2.2);
    ctx.restore();
    var L = -Math.log(Math.max(p, 1e-9)), px = plot2.x(p), py = plot2.y(Math.min(5, L));
    D.line(ctx, px, plot2.box.y + plot2.box.h, px, py, C.terracota, 1.5, [4, 3]);
    D.circle(ctx, px, py, 6.5, C.terracota, C.paper, 2);
    var right = px > plot2.box.x + plot2.box.w * 0.55;
    var lx = right ? px - 10 : px + 10, ly = Math.max(plot2.box.y + 16, py - 12), lt = "pérdida = " + L.toFixed(3);
    window.C2M2.halo(ctx, lt, lx, ly, { align: right ? "right" : "left", size: 12, weight: 700, bg: C.surface });
    D.text(ctx, lt, lx, ly, { align: right ? "right" : "left", size: 12, weight: 700, color: C.terracotaInk });
  }
  function update() {
    var k = st.k, z = st.z.slice(0, k), p = probs(), m = Math.max.apply(null, z), rows = [], terms = [], i, loss = 0, sumE = 0;
    var ez = z.map(function (v) { return Math.exp(v); }); sumE = M.sum(ez);
    for (i = 0; i < k; i++) {
      var t = i === st.y ? Math.log(p[i]) : 0;
      rows.push([(i === st.y ? "<b>" + i + "</b>" : i) + " " + NAMES[i], z[i].toFixed(1), ez[i].toFixed(3), p[i].toFixed(4), i === st.y ? "<b>1</b>" : "0", i === st.y ? t.toFixed(4) : "0"]);
      terms.push((i === st.y ? "1" : "0") + "·ln(" + p[i].toFixed(3) + ")");
    }
    rows.push(["<b>suma</b>", "", "<b>" + sumE.toFixed(3) + "</b>", "<b>" + M.sum(p).toFixed(4) + "</b>", "<b>1</b>", "<b>" + Math.log(p[st.y]).toFixed(4) + "</b>"]);
    tbl.set(rows);
    tbl.el.firstChild.style.fontSize = root.clientWidth < 520 ? ".72rem" : "";
    loss = -Math.log(p[st.y]);
    var arg = p.indexOf(Math.max.apply(null, p)), ok = arg === st.y;
    view.redraw(); view2.redraw();
    out.set("pérdida categórica = −Σ yₖ·ln(pₖ) = −(" + terms.join(" + ") + ") = <b>" + loss.toFixed(4) + "</b><br>" +
      "con etiqueta entera (sparse): −ln(p[" + st.y + "]) = −ln(" + p[st.y].toFixed(4) + ") = <b>" + loss.toFixed(4) + "</b> (el mismo número)<br>" +
      "argmax = clase <b>" + arg + "</b> (" + NAMES[arg] + ") · " + (ok ? "<span class='good'>acierta</span> con p = " + (100 * p[st.y]).toFixed(1) + " %" : "<span class='bad'>falla: la clase correcta solo recibe " + (100 * p[st.y]).toFixed(1) + " %</span>"));
  }
  view.draw(draw); view2.draw(draw2); update();
});

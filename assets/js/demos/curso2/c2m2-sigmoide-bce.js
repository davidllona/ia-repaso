/* Experimento: sigmoide + binary crossentropy con un logit editable. */
Lab.register("curso2/c2m2-sigmoide-bce", function (root, api) {
  var M = api.math, st = { z: 2, y: 1, thr: 0.5 };
  var row = api.el("div", { class: "lab-row" }), cA = api.el("div"), cB = api.el("div");
  row.appendChild(cA); row.appendChild(cB); root.appendChild(row);
  var viewA = api.view(cA, { aspect: 1.35, minH: 220, maxH: 320, label: "Curva sigmoide: logit z en el eje horizontal y probabilidad en el vertical" });
  var plotA = api.plot(viewA, { xr: [-8, 8], yr: [0, 1], xticks: 4, yticks: 4, xlabel: "z (logit)", ylabel: "p = σ(z)", pad: { l: 40, r: 10, t: 10, b: 34 } });
  var viewB = api.view(cB, { aspect: 1.35, minH: 220, maxH: 320, label: "Pérdida binary crossentropy según el logit, para etiqueta 1 y para etiqueta 0" });
  var plotB = api.plot(viewB, { xr: [-8, 8], yr: [0, 6], xticks: 4, yticks: 3, xlabel: "z (logit)", ylabel: "pérdida", pad: { l: 40, r: 10, t: 10, b: 34 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "logit z (lo que da Dense(1) antes de la sigmoide)", min: -8, max: 8, step: 0.1, value: st.z, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.z = v; update(); } });
  ui.segmented({ label: "Etiqueta real y", value: 1, options: [[1, "y = 1 (la terminó)"], [0, "y = 0 (la abandonó)"]], onChange: function (v) { st.y = v; update(); } });
  ui.slider({ label: "Umbral de decisión", min: 0.1, max: 0.9, step: 0.05, value: st.thr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.thr = v; update(); } });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function bce(z, y) { var p = Math.min(1 - 1e-12, Math.max(1e-12, sig(z))); return -(y * Math.log(p) + (1 - y) * Math.log(1 - p)); }

  function drawA(ctx, w, h, C) {
    var D = api.d, b = plotA.box, pts = [], i;
    plotA.axes(ctx);
    var ty = plotA.y(st.thr);
    ctx.save(); ctx.globalAlpha = 0.6;
    D.rect(ctx, b.x + 1, b.y + 1, b.w - 2, ty - b.y - 1, C.terracotaWash, null);
    D.rect(ctx, b.x + 1, ty, b.w - 2, b.y + b.h - ty - 1, C.cobaltoWash, null);
    ctx.restore();
    for (i = 0; i <= 160; i++) { var z = -8 + 16 * i / 160; pts.push([plotA.x(z), plotA.y(sig(z))]); }
    D.path(ctx, pts, C.ink, 2.4);
    D.line(ctx, b.x, ty, b.x + b.w, ty, C.ink2, 1.2, [5, 4]);
    D.text(ctx, "la termina (1)", b.x + 6, b.y + 14, { size: 11, weight: 600, color: C.terracotaInk });
    D.text(ctx, "la abandona (0)", b.x + 6, b.y + b.h - 8, { size: 11, weight: 600, color: C.cobaltoInk });
    var p = sig(st.z), px = plotA.x(st.z), py = plotA.y(p);
    D.line(ctx, px, b.y + b.h, px, py, C.terracota, 1.4, [4, 3]); D.line(ctx, b.x, py, px, py, C.terracota, 1.4, [4, 3]);
    D.circle(ctx, px, py, 6.5, C.terracota, C.paper, 2);
    var right = px > b.x + b.w * 0.6;
    var lx = right ? px - 10 : px + 10, ly = py + (p > 0.5 ? 20 : -10), lt = "p = " + p.toFixed(3);
    window.C2M2.halo(ctx, lt, lx, ly, { align: right ? "right" : "left", size: 12, weight: 700, bg: C.surface });
    D.text(ctx, lt, lx, ly, { align: right ? "right" : "left", size: 12, weight: 700, color: C.terracotaInk });
  }
  function drawB(ctx, w, h, C) {
    var D = api.d, b = plotB.box, p1 = [], p0 = [], i;
    plotB.axes(ctx); ctx.save(); plotB.clip(ctx);
    for (i = 0; i <= 160; i++) { var z = -8 + 16 * i / 160; p1.push([plotB.x(z), plotB.y(Math.min(6, bce(z, 1)))]); p0.push([plotB.x(z), plotB.y(Math.min(6, bce(z, 0)))]); }
    D.path(ctx, p0, st.y === 0 ? C.cobalto : C.line, st.y === 0 ? 3 : 2);
    D.path(ctx, p1, st.y === 1 ? C.terracota : C.line, st.y === 1 ? 3 : 2);
    ctx.restore();
    D.text(ctx, "y = 1", plotB.x(-4.5), plotB.y(5.2), { align: "left", size: 11.5, weight: 700, color: C.terracotaInk });
    D.text(ctx, "y = 0", plotB.x(4.5), plotB.y(5.2), { align: "right", size: 11.5, weight: 700, color: C.cobaltoInk });
    var L = bce(st.z, st.y), px = plotB.x(st.z), py = plotB.y(Math.min(6, L));
    D.line(ctx, px, b.y + b.h, px, py, C.ink, 1.3, [4, 3]);
    D.circle(ctx, px, py, 6.5, st.y ? C.terracota : C.cobalto, C.paper, 2);
    var right = px > b.x + b.w * 0.55;
    var lx = right ? px - 10 : px + 10, ly = Math.max(b.y + 16, Math.min(b.y + b.h - 26, py - 14)), lt = "pérdida = " + L.toFixed(3);
    window.C2M2.halo(ctx, lt, lx, ly, { align: right ? "right" : "left", size: 12, weight: 700, bg: C.surface });
    D.text(ctx, lt, lx, ly, { align: right ? "right" : "left", size: 12, weight: 700, color: C.ink });
  }
  function update() {
    viewA.redraw(); viewB.redraw();
    var p = sig(st.z), cls = p > st.thr ? 1 : 0, L = bce(st.z, st.y), ok = cls === st.y;
    var term = st.y ? "1·ln(" + p.toFixed(4) + ") + 0·ln(" + (1 - p).toFixed(4) + ")" : "0·ln(" + p.toFixed(4) + ") + 1·ln(" + (1 - p).toFixed(4) + ")";
    out.set("p = σ(" + st.z.toFixed(1) + ") = 1 / (1 + e<sup>−" + st.z.toFixed(1) + "</sup>) = <b>" + p.toFixed(4) + "</b> → predice <b>" + (cls ? "«la termina»" : "«la abandona»") + "</b> (clase " + cls + ", umbral " + st.thr.toFixed(2) + ") · " + (ok ? "<span class='good'>acierta</span>" : "<span class='bad'>falla</span>") +
      "<br>pérdida = −[y·ln p + (1−y)·ln(1−p)] = −[" + term + "] = <b>" + L.toFixed(4) + "</b>" +
      "<br>gradiente respecto al logit: p − y = " + p.toFixed(4) + " − " + st.y + " = <b>" + (p - st.y).toFixed(4) + "</b>" +
      (L > 3 ? "<br><span class='bad'>Muy seguro y muy equivocado: la pérdida se dispara. Es lo que más castiga la BCE.</span>" : ""));
  }
  viewA.draw(drawA); viewB.draw(drawB); update();
});

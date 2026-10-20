/* Experimento: ToTensor + Normalize con números. Histograma REAL de los 115 008 píxeles de load_digits (niveles 0..16 → ToTensor los lleva a 0..1)
   y el mismo histograma tras (x - media) / desviación con la media y la desviación que elijas. */
Lab.register("curso4/c4m2-normalize", function (root, api) {
  var D = api.d, M = api.math;
  var CNT = [56272, 4095, 3296, 2944, 3261, 2803, 2559, 2627, 3464, 2585, 2711, 2845, 3668, 3509, 3609, 4304, 10456];
  var TOTAL = CNT.reduce(function (a, b) { return a + b; }, 0), L = CNT.length - 1;
  var mu0 = 0, sd0 = 0, k;
  CNT.forEach(function (c, i) { mu0 += c * i / L; }); mu0 /= TOTAL;
  CNT.forEach(function (c, i) { sd0 += c * Math.pow(i / L - mu0, 2); }); sd0 = Math.sqrt(sd0 / TOTAL);
  var S = { mu: 0.5, sd: 0.5, px: 128 };

  var v1 = api.view(root, { aspect: 3.4, minH: 110, maxH: 150, label: "Histograma de los píxeles entre 0 y 1" });
  var v2 = api.view(root, { aspect: 3.4, minH: 110, maxH: 150, label: "Histograma de los píxeles tras Normalize" });
  var ui = api.controls(root), out = api.readout(root);
  var sMu = ui.slider({ label: "mean", min: 0, max: 1, step: 0.01, value: S.mu, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.mu = v; update(); } });
  var sSd = ui.slider({ label: "std", min: 0.1, max: 1, step: 0.01, value: S.sd, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.sd = v; update(); } });
  ui.slider({ label: "un píxel de ejemplo (0–255)", min: 0, max: 255, step: 1, value: S.px, onInput: function (v) { S.px = v; update(); } });
  function setMS(m, s) { S.mu = m; S.sd = s; sMu.set(m, true); sSd.set(s, true); update(); }
  ui.button("0.5 / 0.5", function () { setMS(0.5, 0.5); });
  ui.button("estadísticas del dataset", function () { setMS(Math.round(mu0 * 1e4) / 1e4, Math.round(sd0 * 1e4) / 1e4); }, "primary");
  ui.button("MNIST: 0.1307 / 0.3081", function () { setMS(0.1307, 0.3081); });

  function hist(ctx, w, h, C, lo, hi, color, fill, title, mapx) {
    var pad = { l: 14, r: 14, t: 18, b: 22 }, W = w - pad.l - pad.r, H = h - pad.t - pad.b, mx = 20000, i;
    D.rect(ctx, pad.l, pad.t, W, H, C.surface, C.line, 1);
    for (i = 0; i <= L; i++) {
      var x = pad.l + (mapx(i / L) - lo) / (hi - lo) * W;
      var bh = Math.min(CNT[i] / mx, 1) * (H - 2), bwid = Math.max(3, (mapx(1) - mapx(0)) / L / (hi - lo) * W * 0.7);
      D.rect(ctx, x - bwid / 2, pad.t + H - bh, bwid, bh, fill, color, 1);
    }
    D.text(ctx, title, 14, 12, { size: 11, color: C.ink2, weight: 600 });
    if (w >= 560) D.text(ctx, "(la barra del 0 sale cortada: hay 56 272 píxeles a 0)", w - 14, 12, { size: 9.5, color: C.muted, align: "right" });
    else D.text(ctx, "barra del 0 cortada", w - 14, 12, { size: 9, color: C.muted, align: "right" });
    var nt = 4;
    for (i = 0; i <= nt; i++) { var v = lo + (hi - lo) * i / nt; D.text(ctx, v.toFixed(2), pad.l + W * i / nt, h - 7, { size: 10, color: C.muted, align: "center", mono: true }); }
    return { pad: pad, W: W, lo: lo, hi: hi };
  }
  function d1(ctx, w, h, C) { hist(ctx, w, h, C, -0.05, 1.05, C.cobalto, C.cobaltoWash, "después de ToTensor: x = nivel / 16", function (t) { return t; }); }
  function d2(ctx, w, h, C) {
    var a = (0 - S.mu) / S.sd, b = (1 - S.mu) / S.sd, m = (b - a) * 0.05;
    var r = hist(ctx, w, h, C, a - m, b + m, C.terracota, C.terracotaWash, "después de Normalize: (x − " + S.mu.toFixed(2) + ") / " + S.sd.toFixed(2), function (t) { return (t - S.mu) / S.sd; });
    if (a - m < 0 && b + m > 0) { var x0 = r.pad.l + (0 - r.lo) / (r.hi - r.lo) * r.W; D.line(ctx, x0, r.pad.t, x0, r.pad.t + h - r.pad.t - r.pad.b, C.ink, 1.2, [3, 3]); }
  }
  v1.draw(d1); v2.draw(d2);

  function update() {
    var nm = (mu0 - S.mu) / S.sd, ns = sd0 / S.sd, a = (0 - S.mu) / S.sd, b = (1 - S.mu) / S.sd;
    var x = S.px / 255, z = (x - S.mu) / S.sd, good = Math.abs(nm) < 0.02 && Math.abs(ns - 1) < 0.03;
    out.set("Dataset tras ToTensor: media <b>" + mu0.toFixed(4) + "</b>, desviación <b>" + sd0.toFixed(4) + "</b>, rango 0 a 1.<br>" +
      "Tras Normalize(" + S.mu.toFixed(4) + ", " + S.sd.toFixed(4) + "): media = (" + mu0.toFixed(4) + " − " + S.mu.toFixed(4) + ") / " + S.sd.toFixed(4) + " = <b class='" + (good ? "good" : "bad") + "'>" + nm.toFixed(4) + "</b>, desviación = " + sd0.toFixed(4) + " / " + S.sd.toFixed(4) + " = <b class='" + (good ? "good" : "bad") + "'>" + ns.toFixed(4) + "</b>, rango <b>" + a.toFixed(3) + "</b> a <b>" + b.toFixed(3) + "</b>.<br>" +
      "Un píxel de <b>" + S.px + "</b>: ToTensor → " + S.px + " / 255 = <b>" + x.toFixed(4) + "</b> → Normalize → (" + x.toFixed(4) + " − " + S.mu.toFixed(2) + ") / " + S.sd.toFixed(2) + " = <b>" + z.toFixed(4) + "</b>" +
      (good ? "<br><span class='good'>Con las estadísticas del propio dataset, los datos quedan con media 0 y desviación 1.</span>" : ""));
    v1.redraw(); v2.redraw();
  }
  update();
});

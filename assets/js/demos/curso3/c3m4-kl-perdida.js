/* Experimento: pérdida del VAE = reconstrucción + β·KL, con un codificador de 1 neurona y un decodificador de juguete x̂ = z.
   Reconstrucción esperada E[(x − z)²] = (x − μ)² + σ².  KL(N(μ,σ²) || N(0,1)) = ½(μ² + σ² − 1 − ln σ²).
   Óptimo analítico: μ* = 2x/(2+β), σ*² = β/(2+β). */
Lab.register("curso3/c3m4-kl-perdida", function (root, api) {
  var D = api.d, M = api.math;
  var S = { x: 2, mu: 0.5, sg: 1.0, beta: 1 };
  var view = api.view(root, { aspect: 1.25, minH: 320, maxH: 460, label: "Densidad del posterior frente al prior y barras de reconstrucción, KL y pérdida total" });
  var ui = api.controls(root), out = api.readout(root);
  var sx = ui.slider({ label: "Dato x (dónde está de verdad la peli)", min: -3, max: 3, step: 0.1, value: S.x, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x = v; update(); } });
  var sm = ui.slider({ label: "μ (dónde la coloca el codificador)", min: -3, max: 3, step: 0.05, value: S.mu, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.mu = v; update(); } });
  var ss = ui.slider({ label: "σ (cuánto duda el codificador)", min: 0.05, max: 2, step: 0.05, value: S.sg, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.sg = v; update(); } });
  var sb = ui.slider({ label: "Peso β del término KL", min: 0, max: 6, step: 0.1, value: S.beta, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.beta = v; update(); } });
  function opt() { return { mu: 2 * S.x / (2 + S.beta), sg: Math.max(0.05, Math.sqrt(S.beta / (2 + S.beta))) }; }
  ui.button("Ir al óptimo para este β", function () { var o = opt(); S.mu = o.mu; S.sg = o.sg; sm.set(S.mu, true); ss.set(S.sg, true); update(); }, "primary");
  ui.button("Solo reconstrucción (β = 0)", function () { S.beta = 0; sb.set(0, true); var o = opt(); S.mu = o.mu; S.sg = o.sg; sm.set(S.mu, true); ss.set(S.sg, true); update(); });
  ui.button("β grande (6)", function () { sb.set(6, true); S.beta = 6; var o = opt(); S.mu = o.mu; S.sg = o.sg; sm.set(S.mu, true); ss.set(S.sg, true); update(); });

  function vals() {
    var rec = (S.x - S.mu) * (S.x - S.mu) + S.sg * S.sg;
    var kl = 0.5 * (S.mu * S.mu + S.sg * S.sg - 1 - Math.log(S.sg * S.sg));
    return { rec: rec, kl: kl, tot: rec + S.beta * kl };
  }
  function dens(x, mu, s) { return Math.exp(-0.5 * (x - mu) * (x - mu) / (s * s)) / (s * Math.sqrt(2 * Math.PI)); }
  function f(v, k) { return (Math.abs(v) < Math.pow(10, -(k === undefined ? 2 : k)) / 2 ? 0 : v).toFixed(k === undefined ? 2 : k).replace("-", "−"); }

  function draw(ctx, w, h, C) {
    var V = vals(), l = 12, r = 12, plotW = w - l - r, topH = h * 0.50, y0 = h * 0.07, base = y0 + topH;
    var XR = [-4, 4];
    function gx(v) { return l + (v - XR[0]) / (XR[1] - XR[0]) * plotW; }
    var ymax = Math.max(0.8, dens(S.mu, S.mu, S.sg)), sc = topH / (ymax * 1.08), x, pts;
    // prior
    pts = []; for (x = XR[0]; x <= XR[1] + 1e-9; x += 0.05) pts.push([gx(x), base - dens(x, 0, 1) * sc]);
    ctx.save(); ctx.beginPath(); ctx.moveTo(gx(XR[0]), base); pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); }); ctx.lineTo(gx(XR[1]), base); ctx.closePath(); ctx.fillStyle = C.cobaltoWash; ctx.fill(); ctx.restore();
    D.path(ctx, pts, C.cobalto, 2, [6, 4]);
    // posterior
    pts = []; for (x = XR[0]; x <= XR[1] + 1e-9; x += 0.05) pts.push([gx(x), base - dens(x, S.mu, S.sg) * sc]);
    ctx.save(); ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(gx(XR[0]), base); pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); }); ctx.lineTo(gx(XR[1]), base); ctx.closePath(); ctx.fillStyle = C.terracotaWash; ctx.fill(); ctx.restore();
    D.path(ctx, pts, C.terracota, 2.5);
    D.line(ctx, l, base, l + plotW, base, C.ink, 1.5);
    for (var t = -4; t <= 4; t += 2) { D.line(ctx, gx(t), base, gx(t), base + 4, C.ink, 1); D.text(ctx, String(t).replace("-", "−"), gx(t), base + 15, { size: 10, mono: true, color: C.muted, align: "center" }); }
    // dato x
    D.line(ctx, gx(S.x), base, gx(S.x), y0 + 8, C.oliva, 2.5);
    D.circle(ctx, gx(S.x), y0 + 8, 5, C.oliva, C.paper, 1.5);
    var labX = gx(S.x) > w * 0.5 ? gx(S.x) - 6 : gx(S.x) + 6;
    D.text(ctx, "x", labX, y0 + 12, { size: 12, weight: 700, color: C.olivaInk, align: gx(S.x) > w * 0.5 ? "right" : "left" });
    D.line(ctx, gx(S.mu), base, gx(S.mu), base - dens(S.mu, S.mu, S.sg) * sc, C.terracotaInk, 1.2, [3, 3]);
    // leyenda dentro del gráfico
    D.text(ctx, "- - prior N(0,1)", l + 4, y0 + 12 + (gx(S.x) < w * 0.3 ? 16 : 0), { size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "— posterior N(μ,σ²)", l + 4, y0 + 28 + (gx(S.x) < w * 0.3 ? 16 : 0), { size: 11, color: C.terracotaInk, weight: 600 });
    // barras
    var by = base + 30, bh = Math.max(18, (h - by - 14) / 3 - 8), lw = Math.min(118, w * 0.30), bx = l + lw, bw = plotW - lw - 56;
    var items = [["Reconstrucción", V.rec, C.cobalto], ["β · KL", S.beta * V.kl, C.terracota], ["Pérdida total", V.tot, C.ink]];
    var mx = Math.max(6, V.tot * 1.05), i;
    for (i = 0; i < 3; i++) {
      var yy = by + i * (bh + 8), len = Math.min(bw, Math.max(0, items[i][1] / mx * bw));
      D.text(ctx, items[i][0], l, yy + bh / 2 + 4, { size: 11, weight: 600, color: C.ink2 });
      D.rect(ctx, bx, yy, bw, bh, C.surface, C.line, 1);
      D.rect(ctx, bx, yy, len, bh, items[i][2]);
      D.text(ctx, f(items[i][1], 2), bx + bw + 6, yy + bh / 2 + 4, { size: 11, mono: true, weight: 700, color: C.ink });
    }
  }
  function update() {
    var V = vals(), o = opt();
    var s2 = S.sg * S.sg;
    out.set("<b>Reconstrucción</b> = (x − μ)² + σ² = (" + f(S.x, 1) + " − " + f(S.mu) + ")² + " + f(S.sg) + "² = " + f((S.x - S.mu) * (S.x - S.mu)) + " + " + f(s2) + " = <b>" + f(V.rec) + "</b><br>" +
      "<b>KL</b> = ½(μ² + σ² − 1 − ln σ²) = ½(" + f(S.mu * S.mu) + " + " + f(s2) + " − 1 − (" + f(Math.log(s2)) + ")) = <b>" + f(V.kl) + "</b><br>" +
      "<b>Total</b> = " + f(V.rec) + " + " + f(S.beta, 1) + "·" + f(V.kl) + " = <b>" + f(V.tot) + "</b> · óptimo para este β: μ* = " + f(o.mu) + ", σ* = " + f(o.sg) + "<br>" +
      (S.beta === 0 ? "<span class='bad'>Sin KL el codificador se encoge a σ → 0: es un autoencoder normal, sin nube y sin hueco que rellenar.</span>" :
        S.beta >= 4 ? "<span class='bad'>Con β grande gana el KL: μ → 0 y σ → 1 sea cual sea x. El posterior ignora el dato (<em>posterior collapse</em>).</span>" :
          "<span class='good'>Equilibrio: μ se acerca a x y σ se queda en una nube razonable.</span>"));
    view.redraw();
  }
  view.draw(draw); update();
});

/* Experimento: las formas (shapes) y los parámetros dentro de un bloque Transformer, y por qué la atención cuesta n². Todo son cuentas exactas. */
Lab.register("curso2/c2m4-forma-bloque", function (root, api) {
  var D = api.d, C0 = api.colors();
  var S = { B: 8, n: 128, d: 256, h: 8, ffm: 4 };

  function g(v) { var s = String(Math.round(v)), o = "", i; for (i = 0; i < s.length; i++) { if (i > 0 && (s.length - i) % 3 === 0) o += "."; o += s.charAt(i); } return o; }
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ","); }
  function mem(bytes) {
    if (bytes >= 1e12) return n(bytes / 1e12, 1) + " TB"; if (bytes >= 1e9) return n(bytes / 1e9, 1) + " GB";
    if (bytes >= 1e6) return n(bytes / 1e6, 1) + " MB"; return n(bytes / 1e3, 1) + " KB";
  }
  var R;
  function compute() {
    var B = S.B, nn = S.n, d = S.d, h = S.h, dff = S.ffm * d, dk = d / h;
    var pAtt = 4 * d * d + 4 * d, pFF = 2 * d * dff + dff + d, pLN = 4 * d;
    R = { dk: dk, dff: dff, pAtt: pAtt, pFF: pFF, pLN: pLN, total: pAtt + pFF + pLN, scores: B * h * nn * nn, one: nn * nn,
      rows: [
        ["1 · Entrada x", "(" + B + ", " + nn + ", " + d + ")", "—"],
        ["2 · Q, K, V (3 capas Dense)", "3 × (" + B + ", " + nn + ", " + d + ")", g(3 * (d * d + d))],
        ["3 · Reparto en " + h + " cabezas", "(" + B + ", " + h + ", " + nn + ", " + dk + ")", "0"],
        ["4 · Puntuaciones Q·Kᵀ / √" + dk, "(" + B + ", " + h + ", " + nn + ", " + nn + ")", "0"],
        ["5 · Softmax por filas", "(" + B + ", " + h + ", " + nn + ", " + nn + ")", "0"],
        ["6 · Mezcla A·V", "(" + B + ", " + h + ", " + nn + ", " + dk + ")", "0"],
        ["7 · Concatenar cabezas + Dense(" + d + ")", "(" + B + ", " + nn + ", " + d + ")", g(d * d + d)],
        ["8 · Residual + LayerNorm", "(" + B + ", " + nn + ", " + d + ")", g(2 * d)],
        ["9 · Feed-forward: Dense(" + dff + ") + ReLU", "(" + B + ", " + nn + ", " + dff + ")", g(d * dff + dff)],
        ["10 · Feed-forward: Dense(" + d + ")", "(" + B + ", " + nn + ", " + d + ")", g(dff * d + d)],
        ["11 · Residual + LayerNorm", "(" + B + ", " + nn + ", " + d + ")", g(2 * d)]
      ] };
  }

  var view = api.view(root, { aspect: 3.4, minH: 190, maxH: 250, label: "El cuadrado de atención n por n crece con el cuadrado de la longitud; reparto de parámetros entre atención y feed-forward" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  function opts(a) { return a.map(function (v) { return [v, String(v)]; }); }
  ui.select({ label: "Tamaño de lote (batch: cuántos textos a la vez)", value: S.B, options: opts([1, 8, 32]), onChange: function (v) { S.B = +v; update(); } });
  ui.select({ label: "Longitud de la secuencia n (tokens)", value: S.n, options: opts([16, 64, 128, 512, 1024, 2048, 4096]), onChange: function (v) { S.n = +v; update(); } });
  var selD = ui.select({ label: "Tamaño del modelo d_model", value: S.d, options: opts([64, 128, 256, 512, 768]), onChange: function (v) { S.d = +v; if (S.d % S.h) { S.h = 1; selH.set(1); } update(); } });
  var selH = ui.select({ label: "Cabezas de atención h (deben dividir a d_model)", value: S.h, options: opts([1, 2, 4, 8, 12, 16]), onChange: function (v) { var hv = +v; if (S.d % hv) { selH.set(S.h); out.set("<span class='bad'>" + hv + " cabezas no dividen a d_model = " + S.d + ": d_model / h debe ser entero.</span>"); return; } S.h = hv; update(); } });
  ui.select({ label: "Feed-forward: d_ff = … × d_model", value: S.ffm, options: [[2, "2"], [4, "4"]], onChange: function (v) { S.ffm = +v; update(); } });
  var tab = api.table(root, ["paso", "forma de salida", "parámetros"]);

  function draw(ctx, w, h, C) {
    var full = h - 46, x0 = 14, y0 = 26, sizes = [16, 64, 128, 512, 1024, 2048, 4096];
    D.text(ctx, "Matriz n × n (a escala)", x0, 14, { size: 11, color: C.ink2, weight: 500 });
    sizes.forEach(function (q) { var sd = Math.max(2, full * q / 4096); D.rect(ctx, x0, y0, sd, sd, q === S.n ? C.terracotaWash : null, q === S.n ? C.terracota : C.line, q === S.n ? 2 : 1); });
    var side = Math.max(2, full * S.n / 4096);
    D.text(ctx, "n × n", x0 + full + 10, y0 + full * 0.35, { size: 12, weight: 600, color: C.terracotaInk });
    D.text(ctx, g(R.one), x0 + full + 10, y0 + full * 0.35 + 16, { size: 11, mono: true, color: C.ink2 });
    // reparto de parámetros
    var bx = Math.max(w * 0.55, x0 + full + 90), bw = w - bx - 14, by = 40, bh = 26, tot = R.total, parts = [[R.pAtt, C.cobalto, "atención"], [R.pFF, C.oliva, "feed-forward"], [R.pLN, C.marker, "LN"]], acc = 0;
    D.text(ctx, "Parámetros del bloque", bx, 14, { size: 11.5, color: C.ink2, weight: 500 });
    parts.forEach(function (p) { var ww = bw * p[0] / tot; D.rect(ctx, bx + acc, by, ww, bh, p[1], C.ink, 1); acc += ww; });
    D.text(ctx, "atención " + n(100 * R.pAtt / tot, 0) + " %", bx, by + bh + 16, { size: 11, color: C.cobaltoInk });
    D.text(ctx, "feed-forward " + n(100 * R.pFF / tot, 0) + " %", bx, by + bh + 32, { size: 11, color: C.olivaInk });
    D.text(ctx, g(tot) + " en total", bx, by + bh + 52, { size: 11.5, mono: true, weight: 600 });
  }
  compute(); view.draw(draw);
  function update() {
    compute(); view.redraw(); tab.set(R.rows);
    var bytes = R.scores * 4;
    out.set("Cada cabeza guarda <b>" + g(R.one) + "</b> puntuaciones por ejemplo; con " + S.h + " cabezas y lote " + S.B + " son <b>" + g(R.scores) + "</b> números = <b>" + mem(bytes) + "</b> en float32 solo para esa matriz.<br>" +
      "d_k = d_model / h = " + S.d + " / " + S.h + " = <b>" + R.dk + "</b> · d_ff = " + S.ffm + "·" + S.d + " = <b>" + R.dff + "</b><br>" +
      "Parámetros: atención 4·d² + 4·d = <b>" + g(R.pAtt) + "</b> · feed-forward <b>" + g(R.pFF) + "</b> · LayerNorm <b>" + g(R.pLN) + "</b> → total <b>" + g(R.total) + "</b><br>" +
      "<span class='good'>Los parámetros NO dependen de n</span>: el mismo bloque sirve para 16 o para 4096 tokens; lo que crece como n² es la memoria y el cálculo de la atención." +
      (bytes > 2e9 ? "<br><span class='bad'>Más de 2 GB solo en puntuaciones: por eso los modelos largos usan trucos (FlashAttention, ventanas…).</span>" : ""));
  }
  update();
});

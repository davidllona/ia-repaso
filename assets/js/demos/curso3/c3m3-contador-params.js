/* Experimento: contador de parámetros de un Transformer. Las fórmulas son exactas (coinciden con model.summary() de los fragmentos 12 y 15).
   Muestra dónde viven los parámetros, que el número de cabezas no los cambia si key_dim = d_model / h, y qué pasa con key_dim = d_model. */
Lab.register("curso3/c3m3-contador-params", function (root, api) {
  var D = api.d;
  var S = { tipo: "texto", d: 32, h: 2, ff: 64, nb: 2, vocab: 31, maxlen: 16, bad: false };
  function g(v) { var s = String(Math.round(v)), o = "", i; for (i = 0; i < s.length; i++) { if (i > 0 && (s.length - i) % 3 === 0) o += "."; o += s.charAt(i); } return o; }
  function n(v, k) { return v.toFixed(k === undefined ? 1 : k).replace(".", ","); }
  function calc() {
    var d = S.d, h = S.h, kd = S.bad ? d : Math.floor(d / h), rows = [], mha = 3 * (d * h * kd + h * kd) + h * kd * d + d, ffn = d * S.ff + S.ff + S.ff * d + d, ln = 4 * d, inp, out;
    if (S.tipo === "texto") {
      inp = S.vocab * d + S.maxlen * d; out = d * S.vocab + S.vocab;
      rows.push(["Embedding de tokens", "(" + S.vocab + ", " + d + ")", S.vocab * d, 0]);
      rows.push(["Embedding de posiciones", "(" + S.maxlen + ", " + d + ")", S.maxlen * d, 0]);
    } else {
      inp = d + d; out = d + 1;
      rows.push(["Dense(d_model) de entrada", "(1 → " + d + ")", inp, 0]);
      rows.push(["Codificación posicional sinusoidal", "(no se entrena)", 0, 0]);
    }
    rows.push(["Atención (por bloque)", "key_dim = " + kd + ", h = " + h, mha, 1]);
    rows.push(["Feed-forward (por bloque)", d + " → " + S.ff + " → " + d, ffn, 2]);
    rows.push(["2 × LayerNorm (por bloque)", "2 × (γ, β de " + d + ")", ln, 3]);
    rows.push(["Capa de salida", S.tipo === "texto" ? "Dense(" + S.vocab + ")" : "Dense(1)", out, 4]);
    var total = inp + S.nb * (mha + ffn + ln) + out;
    return { rows: rows, mha: mha, ffn: ffn, ln: ln, inp: inp, out: out, total: total, kd: kd };
  }
  var view = api.view(root, { aspect: 5.5, minH: 70, maxH: 100, label: "Barra apilada con el reparto de parámetros entre entrada, atención, feed-forward, LayerNorm y salida" });
  var tab = api.table(root, ["Pieza (forma / ajuste)", "Parámetros"]);
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var C0 = api.colors();
  api.legend(root, [[C0.oliva, "entrada / embeddings"], [C0.cobalto, "atención"], [C0.terracota, "feed-forward"], [C0.marker, "LayerNorm"], [C0.muted, "salida"]]);
  ui.segmented({ label: "Modelo", value: "texto", options: [["texto", "Mini-GPT de texto"], ["serie", "Serie temporal"]], onChange: function (v) { S.tipo = v; update(); } });
  var sd = ui.slider({ label: "d_model", min: 8, max: 256, step: 8, value: S.d, onInput: function (v) { S.d = v; update(); } });
  ui.segmented({ label: "Cabezas h", value: 2, options: [[1, "1"], [2, "2"], [4, "4"], [8, "8"]], onChange: function (v) { S.h = v; update(); } });
  ui.slider({ label: "d_ff (red feed-forward)", min: 8, max: 1024, step: 8, value: S.ff, onInput: function (v) { S.ff = v; update(); } });
  ui.slider({ label: "Bloques", min: 1, max: 12, step: 1, value: S.nb, onInput: function (v) { S.nb = v; update(); } });
  ui.slider({ label: "Vocabulario (solo texto)", min: 10, max: 5000, step: 1, value: S.vocab, onInput: function (v) { S.vocab = v; update(); } });
  ui.slider({ label: "Longitud máxima (solo texto)", min: 8, max: 512, step: 8, value: S.maxlen, onInput: function (v) { S.maxlen = v; update(); } });
  ui.toggle({ label: "Error típico: key_dim = d_model", value: false, onChange: function (v) { S.bad = v; update(); } });
  var R = calc();
  view.draw(function (ctx, w, h, C) {
    var parts = [[R.inp, C.oliva], [S.nb * R.mha, C.cobalto], [S.nb * R.ffn, C.terracota], [S.nb * R.ln, C.marker], [R.out, C.muted]], x = 8, bw = w - 16, by = 14, bh = Math.max(22, h - 40);
    parts.forEach(function (p) {
      var wd = bw * p[0] / R.total; D.rect(ctx, x, by, wd, bh, p[1], C.paper, 1);
      if (wd > 38) D.text(ctx, n(100 * p[0] / R.total, 0) + " %", x + wd / 2, by + bh / 2 + 4, { size: 11, align: "center", weight: 600, color: C.ink });
      x += wd;
    });
    D.text(ctx, "total = " + g(R.total) + " parámetros", w / 2, h - 6, { size: 12, align: "center", weight: 600 });
  });
  function update() {
    if (S.d % S.h !== 0 && !S.bad) { /* key_dim = floor(d/h): aviso en el readout */ }
    R = calc(); view.redraw();
    tab.set(R.rows.map(function (r) { return [r[0] + "<br><small>" + r[1] + "</small>", g(r[2]) + (r[3] >= 1 && r[3] <= 3 ? " × " + S.nb : "")]; }).concat([["<b>Total</b>", "<b>" + g(R.total) + "</b>"]]));
    var ok = S.tipo === "texto" && S.d === 32 && S.h === 2 && S.ff === 64 && S.nb === 2 && S.vocab === 31 && S.maxlen === 16 && !S.bad;
    var ok2 = S.tipo === "serie" && S.d === 32 && S.h === 4 && S.ff === 64 && S.nb === 2 && !S.bad;
    out.set("Una capa de atención: <b>" + g(R.mha) + "</b> = 4·d² + 4·d = 4·" + S.d + "² + 4·" + S.d + (S.bad ? " … pero con key_dim = d_model son <b>" + g(R.mha) + "</b>: " + n(R.mha / (4 * S.d * S.d + 4 * S.d), 1) + " × más" : "") + "<br>" +
      "Un bloque: " + g(R.mha) + " + " + g(R.ffn) + " + " + g(R.ln) + " = <b>" + g(R.mha + R.ffn + R.ln) + "</b>; × " + S.nb + " bloques = <b>" + g(S.nb * (R.mha + R.ffn + R.ln)) + "</b>.<br>" +
      (S.d % S.h !== 0 && !S.bad ? "<span class='bad'>d_model no es múltiplo de h: key_dim = ⌊d/h⌋ = " + R.kd + " y se pierden números al concatenar.</span> " : "") +
      (ok ? "<span class='good'>Coincide con el model.summary() del fragmento 15: 19.615.</span>" : (ok2 ? "<span class='good'>Coincide con el model.summary() del fragmento 12: 17.185.</span>" : "Cambia el número de cabezas con d_model fijo: el total no se mueve.")));
  }
  update();
});

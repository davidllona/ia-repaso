/* Experimento: la misma muestra, dos respuestas. Una neurona con BatchNorm (γ=1, β=0) seguida de Dropout, sobre un lote de 6 valores.
   En train() la BatchNorm normaliza con el media y la varianza DEL LOTE (depende de los compañeros) y Dropout apaga valores;
   en eval() usa running_mean = 1 y running_var = 2 (guardadas) y Dropout no hace nada. */
Lab.register("curso5/c5m4-train-eval", function (root, api) {
  var D = api.d, EPS = 1e-5, RM = 1, RV = 2;
  var S = { x: 1.0, mates: "var", p: 0.3, modo: "train", seed: 3 };
  var MATES = { par: [0.8, 1.2, 0.9, 1.1, 1.0], var: [-1.5, 3.0, 0.2, 2.2, -0.6], alt: [4.2, 5.0, 4.6, 5.4, 4.8] };
  function f2(v) { return v.toFixed(2).replace("-", "−").replace(".", ","); }

  function bn(vals, modo) {
    var n = vals.length, m, v, i;
    if (modo === "eval") return vals.map(function (x) { return (x - RM) / Math.sqrt(RV + EPS); });
    m = api.math.mean(vals); v = 0; for (i = 0; i < n; i++) v += (vals[i] - m) * (vals[i] - m); v /= n;
    return vals.map(function (x) { return (x - m) / Math.sqrt(v + EPS); });
  }
  function mascara() { var r = api.rng(S.seed), a = []; for (var i = 0; i < 6; i++) a.push(r.next() >= S.p ? 1 / (1 - S.p) : 0); return a; }
  function salida(mates, modo) {
    var vals = [S.x].concat(MATES[mates]), y = bn(vals, modo);
    if (modo === "train") { var mk = mascara(); y = y.map(function (q, i) { return q * mk[i]; }); }
    return { ent: vals, bn: bn(vals, modo), sal: y, mask: modo === "train" ? mascara() : [1, 1, 1, 1, 1, 1] };
  }

  var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 360, label: "Seis valores de entrada y su salida tras BatchNorm y Dropout en el modo elegido" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Valor de la muestra que miramos (la primera barra)", min: -3, max: 3, step: 0.1, value: S.x, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x = v; update(); } });
  ui.slider({ label: "Probabilidad de Dropout (p)", min: 0, max: 0.8, step: 0.1, value: S.p, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.p = v; update(); } });
  ui.segmented({ label: "Compañeros de lote", value: S.mates, options: [["par", "parecidos"], ["var", "variados"], ["alt", "muy altos"]], onChange: function (v) { S.mates = v; update(); } });
  ui.segmented({ label: "Modo", value: S.modo, options: [["train", "train()"], ["eval", "eval()"]], onChange: function (v) { S.modo = v; update(); } });
  ui.button("Otra máscara de Dropout", function () { S.seed++; update(); });

  function draw(ctx, w, h, C) {
    var r = salida(S.mates, S.modo), n = 6, left = 34, right = 8, wd = w - left - right, bw = wd / n, i;
    var mid1 = h * 0.28, mid2 = h * 0.78, sc1 = h * 0.40 / 6, sc2 = h * 0.40 / 4.5;
    D.text(ctx, "entrada", 4, 12, { size: 10.5, color: C.muted });
    D.text(ctx, "salida: BatchNorm → Dropout", 4, h * 0.54, { size: 10.5, color: C.muted });
    D.line(ctx, left, mid1, w - right, mid1, C.line, 1); D.line(ctx, left, mid2, w - right, mid2, C.line, 1);
    for (i = 0; i < n; i++) {
      var x = left + bw * i + bw * 0.18, ww = bw * 0.64, col = i === 0 ? C.terracota : C.cobalto;
      var v = r.ent[i], y1 = mid1 - v * sc1;
      D.rect(ctx, x, Math.min(mid1, y1), ww, Math.max(1.5, Math.abs(mid1 - y1)), col, null);
      D.text(ctx, f2(v), x + ww / 2, v >= 0 ? y1 - 3 : y1 + 11, { size: 10, mono: true, color: C.ink, align: "center" });
      var o = r.sal[i], y2 = mid2 - Math.max(-4.5, Math.min(4.5, o)) * sc2, apag = S.modo === "train" && r.mask[i] === 0;
      if (apag) { D.rect(ctx, x, mid2 - 5, ww, 10, null, C.muted, 1.2); D.text(ctx, "apagado", x + ww / 2, mid2 - 9, { size: 9, color: C.muted, align: "center" }); }
      else {
        D.rect(ctx, x, Math.min(mid2, y2), ww, Math.max(1.5, Math.abs(mid2 - y2)), col, null);
        D.text(ctx, f2(o), x + ww / 2, o >= 0 ? y2 - 3 : y2 + 11, { size: 10, mono: true, color: C.ink, align: "center" });
      }
      if (i === 0) D.text(ctx, "tu muestra", x + ww / 2, h - 3, { size: 9.5, color: C.terracotaInk, align: "center", weight: 600 });
    }
  }
  view.draw(draw);

  function update() {
    var a = bn([S.x].concat(MATES.par), "train")[0], b = bn([S.x].concat(MATES["var"]), "train")[0], c = bn([S.x].concat(MATES.alt), "train")[0], e = bn([S.x].concat(MATES.par), "eval")[0];
    var s = "BatchNorm de la muestra x = <b>" + f2(S.x) + "</b> (sin Dropout):<br>en <b>train()</b> con compañeros parecidos <b>" + f2(a) + "</b> · variados <b>" + f2(b) + "</b> · muy altos <b>" + f2(c) + "</b><br>en <b>eval()</b>, con cualquier compañero: <b>" + f2(e) + "</b> = (x − " + RM + ") / √(" + RV + " + ε)";
    if (S.modo === "train") s += "<br><span class='bad'>En train() la respuesta para el mismo x cambia con quién esté en el lote, y además Dropout apaga valores al azar (p = " + S.p.toFixed(1).replace(".", ",") + ", los que sobreviven se multiplican por " + (1 / (1 - S.p)).toFixed(2).replace(".", ",") + ").</span>";
    else s += "<br><span class='good'>En eval() la respuesta no depende del lote ni del azar: es lo que quieres al predecir.</span>";
    out.set(s); view.redraw();
  }
  update();
});

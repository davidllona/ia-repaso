/* Experimento: las opciones de nn.CrossEntropyLoss (weight, label_smoothing, ignore_index, reduction) sobre un lote de
   2 muestras. La fórmula replica la de PyTorch (comprobada contra torch con 24 combinaciones). */
Lab.register("curso4/c4m5-opciones-loss", function (root, api) {
  var M = api.math, K = 3;
  var LG = [[2.0, 1.0, 0.1], [0.5, 2.5, 0.2]], Y = [0, 2];
  var S = { eps: 0, w2: 1, ign: false, red: "mean" };
  var ui = api.controls(root);
  ui.slider({ label: "label_smoothing (ε)", min: 0, max: 0.3, step: 0.01, value: 0, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.eps = v; update(); } });
  ui.slider({ label: "weight de la clase 2 (las clases 0 y 1 pesan 1)", min: 1, max: 5, step: 0.5, value: 1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w2 = v; update(); } });
  ui.select({ label: "reduction", value: "mean", options: [["mean", "mean (la media, por defecto)"], ["sum", "sum (la suma)"], ["none", "none (una pérdida por muestra)"]], onChange: function (v) { S.red = v; update(); } });
  ui.toggle({ label: "Marcar la 2.ª muestra con y = −100 (ignore_index)", value: false, onChange: function (v) { S.ign = v; update(); } });
  var tab = api.table(root, ["i", "logits", "y", "p<sub>y</sub>", "w<sub>y</sub>", "−ln p<sub>y</sub>", "pérdida"]);
  var tbl = tab.el.querySelector("table"); tbl.style.fontSize = "clamp(.6rem, 2.7vw, .82rem)";
  Array.prototype.forEach.call(tab.el.querySelectorAll("th"), function (t) { t.style.textTransform = "none"; t.style.setProperty("padding", ".3rem .25rem", "important"); });
  var padFix = function () { Array.prototype.forEach.call(tab.el.querySelectorAll("td"), function (t) { t.style.setProperty("padding", ".3rem .25rem", "important"); t.style.whiteSpace = "nowrap"; }); };
  Array.prototype.forEach.call(tab.el.querySelectorAll("th"), function (t) { t.style.textTransform = "none"; });
  var out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  function f(v, n) { return v.toFixed(n).replace("-", "−"); }
  function update() {
    var w = [1, 1, S.w2], rows = [], li = [], sw = 0, tot = 0, i, k;
    for (i = 0; i < 2; i++) {
      var ig = S.ign && i === 1, lp = M.softmax(LG[i]).map(Math.log), nll = -w[Y[i]] * lp[Y[i]], sm = 0;
      for (k = 0; k < K; k++) sm -= w[k] * lp[k];
      var l = (1 - S.eps) * nll + S.eps / K * sm;
      if (ig) { rows.push([i, LG[i].join(", "), "−100", "—", "—", "—", "<i>ignorada</i>"]); li.push(null); continue; }
      li.push(l); sw += w[Y[i]]; tot += l;
      rows.push([i, LG[i].join(", "), Y[i], Math.exp(lp[Y[i]]).toFixed(4), w[Y[i]].toFixed(1), f(-lp[Y[i]], 4), "<b>" + f(l, 4) + "</b>"]);
    }
    tab.set(rows); padFix();
    var res;
    if (S.red === "mean") res = "<b>" + f(tot / sw, 4) + "</b>  (suma de pérdidas " + f(tot, 4) + " ÷ suma de pesos de las y " + sw.toFixed(1) + ")";
    else if (S.red === "sum") res = "<b>" + f(tot, 4) + "</b>";
    else res = "<b>(" + li.map(function (v) { return v === null ? "0" : f(v, 4); }).join(", ") + ")</b>";
    out.set("CrossEntropyLoss(weight=[1, 1, " + S.w2.toFixed(1) + "], label_smoothing=" + S.eps.toFixed(2) + ", reduction='" + S.red + "') →<br>" + res);
  }
  update();
});

/* Experimento: cuántos parámetros tiene una red densa.
   Cada capa densa tiene (neuronas de antes × neuronas de la capa) pesos + 1 bias por neurona.
   Disfraz: la red que predice si un usuario terminará una película de Netflix. */
Lab.register("curso2/c2m1-contar-parametros", function (root, api) {
  var D = api.d, M = api.math;
  var S = { ent: 2, oc: 2, capas: 1, sal: 1 };

  var view = api.view(root, { aspect: 1.7, minH: 230, maxH: 360, label: "Dibujo de una red neuronal densa: columnas de neuronas conectadas todas con todas, con el número de parámetros de cada capa" });
  var ui = api.controls(root), out = api.readout(root);
  var sE = ui.slider({ label: "Entradas (datos de cada película)", min: 1, max: 8, step: 1, value: S.ent, fmt: function (v) { return v; }, onInput: function (v) { S.ent = v; update(); } });
  var sC = ui.slider({ label: "Capas ocultas", min: 1, max: 3, step: 1, value: S.capas, fmt: function (v) { return v; }, onInput: function (v) { S.capas = v; update(); } });
  var sO = ui.slider({ label: "Neuronas por capa oculta", min: 1, max: 8, step: 1, value: S.oc, fmt: function (v) { return v; }, onInput: function (v) { S.oc = v; update(); } });
  var sS = ui.slider({ label: "Neuronas de salida", min: 1, max: 4, step: 1, value: S.sal, fmt: function (v) { return v; }, onInput: function (v) { S.sal = v; update(); } });
  ui.button("Red 2-2-1 del módulo", function () { set(2, 1, 2, 1); }, "primary");
  ui.button("8 datos → 5 neuronas", function () { set(8, 1, 5, 1); });

  function set(e, c, o, s) {
    S.ent = e; S.capas = c; S.oc = o; S.sal = s;
    sE.set(e, true); sC.set(c, true); sO.set(o, true); sS.set(s, true); update();
  }
  function tam() { var t = [S.ent], i; for (i = 0; i < S.capas; i++) t.push(S.oc); t.push(S.sal); return t; }
  function capas() {
    var t = tam(), r = [], i;
    for (i = 1; i < t.length; i++) r.push({ nin: t[i - 1], nout: t[i], pesos: t[i - 1] * t[i], bias: t[i] });
    return r;
  }

  function draw(ctx, w, h, C) {
    var t = tam(), L = t.length, top = 34, bot = 30, padX = Math.max(26, w * 0.07);
    var colX = function (k) { return padX + (w - 2 * padX) * k / (L - 1); };
    var maxN = Math.max.apply(null, t);
    var r = M.clamp((h - top - bot) / (maxN * 2.6), 5, 15);
    var ys = function (n, j) { var hh = h - top - bot; return top + hh / 2 + (j - (n - 1) / 2) * Math.min(hh / Math.max(n, 1), r * 4.2); };
    var k, i, j;
    for (k = 0; k < L - 1; k++) {
      for (i = 0; i < t[k]; i++) for (j = 0; j < t[k + 1]; j++) {
        D.line(ctx, colX(k), ys(t[k], i), colX(k + 1), ys(t[k + 1], j), k % 2 ? C.terracota : C.cobalto, 1, null);
      }
    }
    for (k = 0; k < L; k++) {
      var fill = k === 0 ? C.surface : (k === L - 1 ? C.olivaWash : C.cobaltoWash);
      for (i = 0; i < t[k]; i++) D.circle(ctx, colX(k), ys(t[k], i), r, fill, C.ink, 1.4);
      var nom = k === 0 ? "entrada" : (k === L - 1 ? "salida" : (L > 3 ? "oculta " + k : "oculta"));
      D.text(ctx, nom, colX(k), 18, { size: 12, align: "center", color: C.ink2, weight: 600 });
    }
    var cs = capas();
    for (k = 0; k < cs.length; k++) {
      var xm = (colX(k) + colX(k + 1)) / 2;
      D.text(ctx, String(cs[k].pesos + cs[k].bias), xm, h - 9, { size: 12, mono: true, align: "center", weight: 700, color: C.ink });
    }
  }

  function update() {
    var cs = capas(), tot = 0, lin = [];
    cs.forEach(function (c, k) {
      var p = c.pesos + c.bias; tot += p;
      lin.push((k === cs.length - 1 ? "Salida" : "Oculta " + (k + 1)) + ": " + c.nin + " × " + c.nout + " pesos + " + c.bias + " bias = <b>" + p + "</b>");
    });
    out.set(lin.join("<br>") + "<br>Total de parámetros: <b>" + tot + "</b>" +
      (S.ent === 2 && S.capas === 1 && S.oc === 2 && S.sal === 1 ? "<br><span class='good'>La red 2-2-1 del módulo: 6 + 3 = 9.</span>" : "") +
      "<br>Los números de abajo del dibujo son los parámetros de cada capa.");
    view.redraw();
  }
  view.draw(draw); update();
});

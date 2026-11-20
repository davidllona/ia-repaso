/* Experimento: tres formas de predecir la audiencia h pasos después de una ventana de 48 valores.
   La serie se fabrica en el navegador con la misma receta del laboratorio (tendencia 0,0008·t + seno de periodo 50
   + seno de periodo 12 + ruido de desviación 0,15). El ruido no es el mismo que el de NumPy, así que los errores
   se parecen a los del laboratorio pero no son idénticos. Se comparan «repetir el último valor» y una regresión lineal
   sobre la ventana (Ridge, ajustada aquí mismo con los datos de entrenamiento). */
Lab.register("curso3/c3m3-lineas-base", function (root, api) {
  var D = api.d, N = 2000, W = 48, NTR = 1400, NVAL = 300;
  var S = { h: 10, k: 120, lin: true };
  var serie = (function () {
    var r = api.rng(0), out = [], t;
    for (t = 0; t < N; t++) out.push(0.0008 * t + Math.sin(2 * Math.PI * t / 50) + 0.5 * Math.sin(2 * Math.PI * t / 12) + r.normal(0, 0.15));
    var m = 0, v = 0; for (t = 0; t < NTR; t++) m += out[t]; m /= NTR;
    for (t = 0; t < NTR; t++) v += (out[t] - m) * (out[t] - m); v = Math.sqrt(v / NTR);
    return out.map(function (x) { return (x - m) / v; });
  })();
  var test = serie.slice(NTR + NVAL);
  var modelo = null;
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }

  /* Ridge (alpha = 1) con término independiente: se centran X e y y se resuelven las ecuaciones normales */
  function ajustar(h) {
    var tr = serie.slice(0, NTR), M = tr.length - W - h + 1, i, j, k, mx = new Array(W).fill(0), my = 0;
    for (i = 0; i < M; i++) { for (j = 0; j < W; j++) mx[j] += tr[i + j]; my += tr[i + W + h - 1]; }
    for (j = 0; j < W; j++) mx[j] /= M; my /= M;
    var A = [], b = new Array(W).fill(0);
    for (j = 0; j < W; j++) { A.push(new Array(W).fill(0)); A[j][j] = 1; }
    for (i = 0; i < M; i++) {
      var yi = tr[i + W + h - 1] - my;
      for (j = 0; j < W; j++) { var xj = tr[i + j] - mx[j]; b[j] += xj * yi; for (k = j; k < W; k++) A[j][k] += xj * (tr[i + k] - mx[k]); }
    }
    for (j = 0; j < W; j++) for (k = 0; k < j; k++) A[j][k] = A[k][j];
    for (j = 0; j < W; j++) {                       // eliminación de Gauss (la matriz es simétrica y definida positiva)
      for (i = j + 1; i < W; i++) { var f = A[i][j] / A[j][j]; for (k = j; k < W; k++) A[i][k] -= f * A[j][k]; b[i] -= f * b[j]; }
    }
    var wv = new Array(W).fill(0);
    for (j = W - 1; j >= 0; j--) { var s = b[j]; for (k = j + 1; k < W; k++) s -= A[j][k] * wv[k]; wv[j] = s / A[j][j]; }
    var c = my; for (j = 0; j < W; j++) c -= wv[j] * mx[j];
    return { w: wv, c: c };
  }
  function predLin(arr, st) { var s = modelo.c, j; for (j = 0; j < W; j++) s += modelo.w[j] * arr[st + j]; return s; }
  function maes() {
    var M = test.length - W - S.h + 1, a = 0, b = 0, i;
    for (i = 0; i < M; i++) { var y = test[i + W + S.h - 1]; a += Math.abs(test[i + W - 1] - y); b += Math.abs(predLin(test, i) - y); }
    return { per: a / M, lin: b / M, M: M };
  }

  var view = api.view(root, { aspect: 2.0, minH: 240, maxH: 330, label: "Trozo de test de la serie de audiencia con una ventana marcada en azul, el valor real a predecir en naranja y las predicciones de las dos líneas base" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "ventana (48 valores)"], [C0.terracota, "valor real"], [C0.muted, "repetir el último"], [C0.oliva, "regresión lineal"]]);
  var sk = ui.slider({ label: "Ventana de test nº", min: 0, max: 242, step: 1, value: S.k, onInput: function (v) { S.k = v; update(); } });
  ui.slider({ label: "Horizonte (pasos por delante)", min: 1, max: 20, step: 1, value: S.h, onInput: function (v) { S.h = v; refit(); } });
  ui.toggle({ label: "Mostrar la regresión lineal", value: true, onChange: function (v) { S.lin = v; update(); } });
  var plot = api.plot(view, { xr: [0, test.length], yr: [-2.6, 3.4], xticks: 6, yticks: 4, xlabel: "instante dentro del trozo de test", pad: { l: 34, r: 16, t: 14, b: 36 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return v.toFixed(1).replace(".", ","); } });

  function refit() {
    modelo = ajustar(S.h);
    var M = test.length - W - S.h + 1;
    sk.input.max = M - 1;
    if (S.k > M - 1) { S.k = M - 1; sk.set(S.k, true); }
    update();
  }
  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    if (!modelo) return;
    var b = plot.box, st = S.k, e = st + W - 1, ty = st + W + S.h - 1, i;
    ctx.save(); plot.clip(ctx);
    ctx.fillStyle = C.cobalto; ctx.globalAlpha = 0.16; ctx.fillRect(plot.x(st), b.y, plot.x(e) - plot.x(st), b.h); ctx.globalAlpha = 1;
    D.path(ctx, test.map(function (v, t) { return [plot.x(t), plot.y(v)]; }), C.line, 1.2);
    D.path(ctx, test.slice(st, e + 1).map(function (v, t) { return [plot.x(st + t), plot.y(v)]; }), C.cobalto, 2);
    var yp = test[e];
    D.line(ctx, plot.x(e), plot.y(yp), plot.x(ty), plot.y(yp), C.muted, 1.5, [4, 3]);
    D.circle(ctx, plot.x(ty), plot.y(yp), 5, C.muted, C.ink, 1.5);
    if (S.lin) { var yl = predLin(test, st); D.circle(ctx, plot.x(ty), plot.y(yl), 5, C.oliva, C.ink, 1.5); }
    D.circle(ctx, plot.x(ty), plot.y(test[ty]), 6, C.terracota, C.ink, 2);
    ctx.restore();
  });
  function update() {
    if (!modelo) return;
    view.redraw();
    var st = S.k, e = st + W - 1, ty = st + W + S.h - 1, y = test[ty], yp = test[e], yl = predLin(test, st), m = maes();
    out.set("Ventana: instantes " + st + "–" + e + " del test → hay que predecir el instante <b>" + ty + "</b> (" + S.h + " pasos después).<br>" +
      "Valor real <b>" + n(y) + "</b> · repetir el último: " + n(yp) + " (error " + n(Math.abs(yp - y)) + ")" +
      (S.lin ? " · regresión lineal: " + n(yl) + " (error " + n(Math.abs(yl - y)) + ")" : "") + "<br>" +
      "Error medio (MAE) en las " + m.M + " ventanas de test: repetir el último = <b>" + n(m.per, 3) + "</b>" + (S.lin ? " · regresión lineal = <b class='good'>" + n(m.lin, 3) + "</b>" : "") + "<br>" +
      "En el laboratorio (paso 8), con el ruido de NumPy y horizonte 10: 0,928 · 0,158 · y el Transformer, 0,172.");
  }
  refit();
});

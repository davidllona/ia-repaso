/* Experimento: deriva de una columna en producción. La app apunta los accesos con retraso, DiasSinEntrar sube
   y el modelo (que no ha cambiado) empieza a avisar de más: el PSI lo detecta, el ROC-AUC no. Simulación en el navegador. */
Lab.register("curso1/c1m6-deriva-psi", function (root, api) {
  var M = api.math, R = api.rng(2024);
  var N = 5000, UMBRAL = 0.20, CFP = 15, CFN = 60;
  // Cuatro tipos de usuario (como en el StreamFlix ampliado): proporción y media de días sin entrar
  var TIPOS = [[0.15, 26], [0.35, 7], [0.25, 3], [0.25, 1.4]];
  var dias = [], otra = [], y = [], i;
  for (i = 0; i < N; i++) {
    var u = R.next(), acc = 0, k = 0;
    for (k = 0; k < TIPOS.length; k++) { acc += TIPOS[k][0]; if (u < acc) break; }
    var media = TIPOS[Math.min(k, TIPOS.length - 1)][1];
    dias.push(Math.min(59, Math.round(-media * Math.log(1 - R.next() * 0.999))));
    otra.push(R.normal(0, 1)); // el resto de columnas (horas, tickets, antigüedad…) resumidas en un número
  }
  var mu = M.mean(dias), sd = M.std(dias) || 1, W = 0.8586, WO = 1.5;
  function logit(d, o, b0) { return b0 + W * (d - mu) / sd + WO * o; }
  // intercepto para que la probabilidad media sea la tasa real (0,278): búsqueda por bisección
  var lo = -6, hi = 3, b0 = 0, it;
  for (it = 0; it < 50; it++) {
    b0 = (lo + hi) / 2;
    var s = 0; for (i = 0; i < N; i++) s += M.sigmoid(logit(dias[i], otra[i], b0));
    if (s / N > 0.278) hi = b0; else lo = b0;
  }
  for (i = 0; i < N; i++) y.push(R.next() < M.sigmoid(logit(dias[i], otra[i], b0)) ? 1 : 0);
  var tasa = M.mean(y);

  var CORTES = [0, 1, 2, 3, 5, 8, 13, 21, 60], ETQ = ["0", "1", "2", "3–4", "5–7", "8–12", "13–20", "21+"];
  function tramos(desp) {
    var c = new Array(ETQ.length).fill(0);
    for (var j = 0; j < N; j++) {
      var d = dias[j] + desp;
      for (var b = 0; b < ETQ.length; b++) if (d >= CORTES[b] && (d < CORTES[b + 1] || b === ETQ.length - 1)) { c[b]++; break; }
    }
    return c.map(function (v) { return v / N; });
  }
  function psi(a, d) {
    var s = 0;
    for (var b = 0; b < a.length; b++) { var ai = Math.max(a[b], 1e-4), di = Math.max(d[b], 1e-4); s += (di - ai) * Math.log(di / ai); }
    return s;
  }
  function auc(sc) {
    var idx = sc.map(function (v, j) { return j; }).sort(function (p, q) { return sc[p] - sc[q]; });
    var rs = 0, np = 0;
    for (var r = 0; r < idx.length; r++) if (y[idx[r]]) { rs += r + 1; np++; }
    var nn = N - np;
    return (rs - np * (np + 1) / 2) / (np * nn);
  }
  function evalua(desp) {
    var p = [], sum = 0, tp = 0, fp = 0, fn = 0;
    for (var j = 0; j < N; j++) {
      var q = M.sigmoid(logit(dias[j] + desp, otra[j], b0)); p.push(q); sum += q;
      var av = q >= UMBRAL;
      if (av && y[j]) tp++; else if (av) fp++; else if (y[j]) fn++;
    }
    return { media: sum / N, aviso: tp + fp, coste: fp * CFP + fn * CFN, auc: auc(p), tp: tp, fp: fp, fn: fn };
  }

  var desp = 0, base = tramos(0), ref = evalua(0);
  var view = api.view(root, { aspect: 1.5, minH: 250, maxH: 340, label: "Reparto de usuarios por tramos de días sin entrar: en el entrenamiento y ahora, con el PSI" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Retraso con el que la app apunta los accesos", min: 0, max: 12, step: 1, value: 0, fmt: function (v) { return "+" + v + " días"; }, onInput: function (v) { desp = v; update(); } });
  ui.button("La app nueva (+6 días)", function () { sl.set(6); }, "primary");
  ui.button("Sin cambios", function () { sl.set(0); });
  api.legend(root, [[api.colors().cobalto, "entrenamiento (antes)"], [api.colors().terracota, "producción (ahora)"]]);

  function draw(ctx, w, h, C) {
    var D = api.d, ahora = tramos(desp), mx = 0, b;
    for (b = 0; b < ETQ.length; b++) mx = Math.max(mx, base[b], ahora[b]);
    var P = api.plot(view, { xr: [0, ETQ.length], yr: [0, Math.ceil(mx * 10) / 10], xticks: ETQ.length, yticks: 4, grid: true, pad: { l: 44, r: 10, t: 22, b: 40 },
      xfmt: function () { return ""; }, yfmt: function (t) { return Math.round(t * 100) + " %"; }, xlabel: "Días sin entrar (tramos)" });
    P.axes(ctx);
    var bw = (P.x(1) - P.x(0)) * 0.36;
    for (b = 0; b < ETQ.length; b++) {
      var cx = P.x(b + 0.5);
      D.rect(ctx, cx - bw, P.y(base[b]), bw, P.y(0) - P.y(base[b]), C.cobalto);
      D.rect(ctx, cx, P.y(ahora[b]), bw, P.y(0) - P.y(ahora[b]), C.terracota);
      D.text(ctx, ETQ[b], cx, P.y(0) + 14, { size: 10.5, align: "center", color: C.muted, mono: true });
    }
    var v = psi(base, ahora), col = v < 0.10 ? C.oliva : v < 0.25 ? C.marker : C.terracota;
    D.text(ctx, "PSI = " + v.toFixed(2), w - 12, 15, { size: 13, weight: 700, align: "right", color: col === C.marker ? C.ink : col });
  }
  function f(x, d) { return x.toFixed(d).replace(".", ","); }
  function update() {
    view.redraw();
    var v = psi(base, tramos(desp)), e = evalua(desp);
    var banda = v < 0.10 ? "<span class='good'>estable</span>" : v < 0.25 ? "cambio moderado" : "<span class='bad'>cambio serio</span>";
    out.set("PSI de <code>DiasSinEntrar</code>: <b>" + f(v, 2) + "</b> → " + banda + ".<br>" +
      "ROC-AUC: <b>" + f(ref.auc, 3) + "</b> antes · <b>" + f(e.auc, 3) + "</b> ahora (el orden de los usuarios no cambia).<br>" +
      "Probabilidad media de cancelar: " + f(ref.media, 3) + " → <b>" + f(e.media, 3) + "</b> (la tasa real sigue en " + f(tasa, 3) + ").<br>" +
      "Con umbral 0,20: avisados " + ref.aviso + " → <b>" + e.aviso + "</b> · coste " + ref.coste.toLocaleString("es-ES") + " € → <b>" + e.coste.toLocaleString("es-ES") + " €</b> (5.000 usuarios simulados).");
  }
  view.draw(draw); update();
});

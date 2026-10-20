/* Experimento: una fila real con un hueco (NaN) atraviesa el Pipeline: Imputer → Scaler/One-Hot → regresión logística.
   Parámetros REALES (medianas, medias, desviaciones, pesos) del modelo ajustado en la ejecución del módulo. */
Lab.register("curso1/c1m6-pipeline-fila", function (root, api) {
  var P = {"numericas":["Edad","AntiguedadMeses","HorasMes","DiasSinEntrar","TicketsSoporte","PctAccion","PctComedia","PctDrama","PctInfantil","PctDocumental"],"categoricas":["Plan","Dispositivo"],"mediana":[36.0,13.0,27.8,4.0,0.0,15.4,24.3,20.8,12.1,13.7],"media":[36.1922,20.0218,32.5618,8.0238,0.6062,20.157,25.0956,22.0693,17.1776,15.5006],"desv":[9.9225,19.066,22.1142,9.8157,0.8314,15.7108,11.4582,11.8399,14.6558,10.6007],"frecuente":["Basic","Móvil"],"categorias":[["Basic","Premium","Standard"],["Móvil","PC","TV","Tablet"]],"coef":[-0.0484,-0.3492,-0.4683,0.8586,0.2996,0.022,-0.0484,-0.0195,-0.0005,0.0414,0.102,-0.0011,-0.1012,0.0743,-0.0275,0.0097,-0.0569],"intercepto":-1.2355,"C":0.01,"candidatas":[[2078,["HorasMes"]],[4974,["AntiguedadMeses"]],[353,["AntiguedadMeses"]],[244,["Edad"]],[707,["HorasMes"]],[18,["Edad"]],[4325,["AntiguedadMeses"]],[866,["Plan"]],[691,["Edad"]],[630,["HorasMes"]],[3855,["HorasMes"]],[1247,["Edad"]]],"filas":[{"id":2078,"x":{"Edad":36.0,"Plan":"Basic","Dispositivo":"Móvil","AntiguedadMeses":17.0,"HorasMes":null,"DiasSinEntrar":25.0,"TicketsSoporte":1.0,"PctAccion":18.2,"PctComedia":18.6,"PctDrama":39.1,"PctInfantil":3.6,"PctDocumental":20.5},"y":1},{"id":866,"x":{"Edad":25.0,"Plan":null,"Dispositivo":"TV","AntiguedadMeses":6.0,"HorasMes":79.1,"DiasSinEntrar":4.0,"TicketsSoporte":0.0,"PctAccion":54.2,"PctComedia":1.5,"PctDrama":10.9,"PctInfantil":32.4,"PctDocumental":1.0},"y":0},{"id":244,"x":{"Edad":null,"Plan":"Standard","Dispositivo":"Móvil","AntiguedadMeses":1.0,"HorasMes":90.2,"DiasSinEntrar":3.0,"TicketsSoporte":1.0,"PctAccion":48.0,"PctComedia":12.4,"PctDrama":16.3,"PctInfantil":12.3,"PctDocumental":11.0},"y":0}]};
  var NUM = P.numericas, CAT = P.categoricas;
  var STAGES = [["1", "Fila cruda"], ["2", "Imputer"], ["3", "Scaler + One-Hot"], ["4", "Pesos del modelo"], ["5", "Probabilidad"]];
  var stage = 0, rowIdx = 0, forceNaN = false, dias = null;

  var view = api.view(root, { aspect: 5.2, minH: 64, maxH: 92, label: "Las cinco etapas por las que pasa una fila: cruda, imputer, scaler y one-hot, pesos del modelo y probabilidad" });
  var ui = api.controls(root);
  ui.select({ label: "Usuario de ejemplo (con un hueco distinto cada uno)", options: P.filas.map(function (f, i) {
    var miss = Object.keys(f.x).filter(function (k) { return f.x[k] === null; }).join(", ");
    return [i, "usuario nº " + f.id + " · le falta " + miss]; }), value: 0, onChange: function (v) { rowIdx = +v; dias = null; forceNaN = false; sD.set(base().DiasSinEntrar, true); update(); } });
  function base() { return P.filas[rowIdx].x; }
  var sD = ui.slider({ label: "Cambia los días sin entrar de este usuario", min: 0, max: 60, step: 1, value: P.filas[0].x.DiasSinEntrar, onInput: function (v) { dias = v; update(); } });
  ui.toggle({ label: "Borrar su dato de HorasMes (NaN)", value: false, onChange: function (v) { forceNaN = v; update(); } });
  ui.button("◀ Etapa anterior", function () { stage = Math.max(0, stage - 1); update(); });
  ui.button("Etapa siguiente ▶", function () { stage = Math.min(4, stage + 1); update(); }, "primary");
  var tbl = api.table(root, ["Variable", "Crudo", "Imputer", "Scaler / One-Hot", "Peso", "Aporte al logit"]);
  var out = api.readout(root);

  function fmt(v, k) { return (v < 0 ? "−" : (k === "+" ? "+" : "")) + Math.abs(v).toFixed(2); }
  function compute() {
    var x = Object.assign({}, base());
    if (dias !== null) x.DiasSinEntrar = dias;
    if (forceNaN) x.HorasMes = null;
    var rows = [], logit = P.intercepto, i;
    for (i = 0; i < NUM.length; i++) {
      var raw = x[NUM[i]], filled = raw === null ? P.mediana[i] : raw;
      var z = (filled - P.media[i]) / P.desv[i], w = P.coef[i], a = w * z;
      logit += a;
      rows.push({ name: NUM[i], raw: raw, filled: filled, imputed: raw === null, z: z, mu: P.media[i], sd: P.desv[i], w: w, a: a, cat: false });
    }
    var off = NUM.length;
    for (var c = 0; c < CAT.length; c++) {
      var rawc = x[CAT[c]], fc = rawc === null ? P.frecuente[c] : rawc, cats = P.categorias[c], hot = cats.indexOf(fc);
      var wv = P.coef[off + hot];
      logit += wv;
      rows.push({ name: CAT[c], raw: rawc, filled: fc, imputed: rawc === null, hot: cats.map(function (q, j) { return j === hot ? 1 : 0; }), cats: cats, w: wv, a: wv, cat: true, wname: cats[hot] });
      off += cats.length;
    }
    return { rows: rows, logit: logit, prob: 1 / (1 + Math.exp(-logit)) };
  }

  function draw(ctx, w, h, C) {
    var D = api.d, n = STAGES.length, gap = 8, bw = (w - gap * (n - 1) - 8) / n, i;
    for (i = 0; i < n; i++) {
      var x = 4 + i * (bw + gap), on = i === stage, done = i < stage;
      D.rect(ctx, x, 6, bw, h - 12, on ? C.cobalto : (done ? C.cobaltoWash : C.surface), on ? C.cobalto : C.line, on ? 2 : 1);
      var col = on ? C.paper : C.ink;
      D.text(ctx, STAGES[i][0], x + bw / 2, 26, { size: 13, weight: 700, align: "center", color: col });
      var words = STAGES[i][1].split(" "), narrow = bw < 80;
      var l1 = narrow && words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(" ") : STAGES[i][1];
      var l2 = narrow && words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(" ") : "";
      D.text(ctx, l1, x + bw / 2, h - (l2 ? 26 : 16), { size: narrow ? 10 : 11.5, weight: 600, align: "center", color: col });
      if (l2) D.text(ctx, l2, x + bw / 2, h - 12, { size: 10, weight: 600, align: "center", color: col });
      if (i < n - 1) D.text(ctx, "›", x + bw + gap / 2, h / 2 + 5, { size: 15, align: "center", color: C.muted });
    }
  }

  function update() {
    view.redraw();
    var r = compute(), f = P.filas[rowIdx], body = [];
    r.rows.forEach(function (q) {
      var raw = q.raw === null ? "<span class='bad'><b>NaN</b></span>" : (q.cat ? q.raw : q.raw.toFixed(1));
      var imp = stage >= 1 ? (q.imputed ? "<span class='good'><b>" + (q.cat ? q.filled : q.filled.toFixed(1)) + "</b></span> <small>(" + (q.cat ? "más frecuente" : "mediana") + ")</small>" : (q.cat ? q.filled : q.filled.toFixed(1))) : "·";
      var sc = "·", w = "·", ap = "·";
      if (stage >= 2) sc = q.cat ? "[" + q.hot.join(", ") + "]<br><small>" + q.cats.join(" · ") + "</small>" : "(" + q.filled.toFixed(1) + " − " + q.mu.toFixed(1) + ") / " + q.sd.toFixed(1) + " = <b>" + fmt(q.z) + "</b>";
      if (stage >= 3) { w = fmt(q.w, "+") + (q.cat ? "<br><small>de " + q.name + "_" + q.wname + "</small>" : ""); ap = "<b>" + fmt(q.a, "+") + "</b>" + (q.cat ? "" : "<br><small>" + fmt(q.w) + " × " + fmt(q.z) + "</small>"); }
      body.push([q.name, raw, imp, sc, w, ap]);
    });
    tbl.set(body);
    var hn = r.rows.filter(function (q) { return q.imputed; }).map(function (q) { return q.name; });
    var msgs = [
      "<b>Fila cruda.</b> Esto es lo que entra al Pipeline tal como está en la tabla. " + (hn.length ? "Los huecos (<span class='bad'>NaN</span>) en <b>" + hn.join(", ") + "</b> harían fallar a la regresión logística." : "Esta fila no tiene huecos; borra HorasMes con el botón para ver al Imputer trabajar."),
      "<b>Imputer.</b> " + (hn.length ? "Cada hueco se rellena con lo que el Imputer <em>aprendió en el train</em>: la mediana de la columna (numéricas) o el valor más frecuente (categorías). Aquí: " + r.rows.filter(function (q) { return q.imputed; }).map(function (q) { return q.name + " → " + (q.cat ? q.filled : q.filled.toFixed(1)); }).join("; ") + "." : "Nada que rellenar: el Imputer deja la fila igual."),
      "<b>Scaler y One-Hot.</b> Las numéricas pasan a z = (x − μ) / σ, con la media μ y la desviación σ aprendidas en el train; cada categoría se convierte en columnas 0/1. La fila queda convertida en 17 números sin huecos y en la misma escala.",
      "<b>Pesos.</b> La regresión logística (C = " + P.C + ") ya aprendió un peso por columna. Multiplicar peso × valor da el <em>aporte</em> de cada variable: positivo empuja hacia «cancela», negativo hacia «se queda».",
      "<b>Probabilidad.</b> logit = intercepto (" + fmt(P.intercepto, "+") + ") + suma de aportes = <b>" + fmt(r.logit, "+") + "</b>. Probabilidad = 1 / (1 + e<sup>−logit</sup>) = <b>" + (r.prob * 100).toFixed(1) + " %</b> de cancelar. " +
        "Con umbral 0,50 → <b>" + (r.prob >= 0.5 ? "avisa" : "no avisa") + "</b>; con 0,35 → <b>" + (r.prob >= 0.35 ? "avisa" : "no avisa") + "</b>; con 0,20 → <b>" + (r.prob >= 0.2 ? "avisa" : "no avisa") + "</b>. Lo que ocurrió de verdad con este usuario: <b>" + (f.y ? "canceló" : "se quedó") + "</b>."
    ];
    out.set(msgs[stage]);
  }
  view.draw(draw); update();
});

/* Experimento: qué columnas existen «el día de predecir». Línea de tiempo de dos días y una feature extra que puede ser una fuga.
   Las exactitudes salen de la ejecución real del módulo (fragmento «La fuga, demostrada»). */
Lab.register("curso1/c1m6-fuga-temporal", function (root, api) {
  var M = api.math;
  var FG = {"honesto":[0.82,0.5],"h9":[0.817,0.509],"p9":[0.84,0.553],"h3":[0.838,0.534],"rf":[1.0,1.0]}, HONESTO = FG.honesto;
  var FEATS = [
    { id: "ninguna", name: "Ninguna (solo datos de hoy, día D)", t: null, acc: HONESTO[0], rec: HONESTO[1], what: "" },
    { id: "h9", name: "Humidity9am de mañana (D+1)", t: 9, acc: FG.h9[0], rec: FG.h9[1], what: "se mide a las 9:00 de mañana" },
    { id: "p9", name: "Pressure9am de mañana (D+1)", t: 9, acc: FG.p9[0], rec: FG.p9[1], what: "se mide a las 9:00 de mañana" },
    { id: "h3", name: "Humidity3pm de mañana (D+1)", t: 15, acc: FG.h3[0], rec: FG.h3[1], what: "se mide a las 15:00 de mañana" },
    { id: "rf", name: "Rainfall de mañana (D+1)", t: 24, acc: FG.rf[0], rec: FG.rf[1], what: "es la lluvia total de mañana: se conoce cuando el día ya ha terminado, es decir, ES la respuesta (el final de la serie)" }
  ];
  var NOW = [[7, "07:00 de mañana (antes de nada)"], [12, "12:00 de mañana"], [17, "17:00 de mañana"]];
  var cur = 0, now = 7;

  var view = api.view(root, { aspect: 2.4, minH: 215, maxH: 300, label: "Línea de tiempo de dos días: hoy (día D) y mañana (día D+1). Se marca el momento de decidir y cuándo se conoce cada columna." });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Columna extra que añades a las features", options: FEATS.map(function (f, i) { return [i, f.name]; }), value: 0, onChange: function (v) { cur = +v; update(); } });
  ui.select({ label: "Momento en que necesitas la predicción", options: NOW.map(function (n) { return [n[0], n[1]]; }), value: 7, onChange: function (v) { now = +v; update(); } });

  function tx(plot, hours) { return plot.x(hours); }
  var plot = api.plot(view, { xr: [0, 48], yr: [0, 1], xticks: 8, yticks: 1, grid: false, pad: { l: 24, r: 24, t: 12, b: 28 },
    yfmt: function () { return ""; }, xfmt: function (v) { return ("0" + (v % 24)).slice(-2) + "h"; } });

  function draw(ctx, w, h, C) {
    var D = api.d, narrow = w < 480, b = plot.box, f = FEATS[cur], disp = f.t !== null && f.t <= now + 0.001, leak = f.t !== null && !disp;
    plot.axes(ctx);
    // bandas de los dos días
    ctx.save(); ctx.globalAlpha = 0.10; D.rect(ctx, plot.x(0), b.y, plot.x(24) - plot.x(0), b.h, C.cobalto); D.rect(ctx, plot.x(24), b.y, plot.x(48) - plot.x(24), b.h, C.terracota); ctx.restore();
    D.text(ctx, narrow ? "Hoy (D)" : "Hoy (día D): ya ha pasado", plot.x(12), b.y + 15, { size: 11.5, weight: 600, align: "center", color: C.cobaltoInk });
    D.text(ctx, narrow ? "Mañana (D+1)" : "Mañana (D+1): el que predices", plot.x(36), b.y + 15, { size: 11.5, weight: 600, align: "center", color: C.terracotaInk });
    D.line(ctx, plot.x(24), b.y, plot.x(24), b.y + b.h, C.ink, 1.5);
    // todo lo medido el día D
    var yD = b.y + b.h * 0.42;
    D.rect(ctx, plot.x(0.5), yD - 11, plot.x(24) - plot.x(0.5) - 6, 22, C.cobalto);
    D.text(ctx, narrow ? "features de hoy" : "features de hoy: todas conocidas", plot.x(12.2), yD + 4, { size: 11, weight: 600, align: "center", color: C.paper });
    // la feature extra
    var yE = b.y + b.h * 0.70;
    if (f.t !== null) {
      var col = disp ? C.oliva : C.terracota, xs = plot.x(f.t);
      D.line(ctx, xs, yE - 14, xs, b.y + b.h, col, 2, [4, 3]);
      D.circle(ctx, xs, yE, 9, col, C.paper, 2);
      var label = f.name.replace(" de mañana (D+1)", "(D+1)");
      var lx = Math.min(Math.max(xs, b.x + 70), b.x + b.w - 70);
      D.text(ctx, label, lx, yE + 25, { size: 11, weight: 600, align: "center", color: disp ? C.olivaInk : C.terracotaInk });
    }
    // el objetivo
    D.rect(ctx, plot.x(24.4), yD - 11, plot.x(47.6) - plot.x(24.4), 22, C.paper, C.terracota, 2);
    D.text(ctx, narrow ? "¿llueve?" : "¿llueve? (¿paraguas?)", plot.x(36), yD + 4, { size: 11, weight: 600, align: "center", color: C.terracotaInk });
    // ahora
    var xn = plot.x(24 + now);
    D.line(ctx, xn, b.y + 22, xn, b.y + b.h, C.ink, 2.4);
    D.text(ctx, "ahora", xn, b.y + 33, { size: 11, weight: 700, align: "center", color: C.ink });
    ctx.save(); ctx.globalAlpha = 0.16; D.rect(ctx, xn, b.y + 22, plot.x(48) - xn, b.h - 22, C.ink); ctx.restore();
    D.text(ctx, "futuro: no existe todavía", Math.min((xn + plot.x(48)) / 2, b.x + b.w - 70), b.y + b.h - 10, { size: 10.5, align: "center", color: C.ink2 });
  }
  function update() {
    view.redraw();
    var f = FEATS[cur], disp = f.t !== null && f.t <= now + 0.001, base = HONESTO;
    var msg;
    if (f.t === null) {
      msg = "Solo con lo medido hoy (día D): accuracy <b>" + base[0].toFixed(3) + "</b> y recall <b>" + base[1].toFixed(3) + "</b>. Es lo que de verdad obtendrás: todo existe cuando decides, sin spoilers.";
    } else if (disp) {
      msg = "<b>" + f.name + "</b> " + f.what + ". A las " + NOW.filter(function (n) { return n[0] === now; })[0][1].split(" ")[0] + " <span class='good'>ya existe: es legítima</span>. Accuracy <b>" + f.acc.toFixed(3) + "</b> (sin ella, " + base[0].toFixed(3) + "). Eso sí: ahora estás resolviendo otro problema —predecir a mediodía con lo ya medido— y esa es la cifra que debes comparar.";
    } else {
      msg = "<b>" + f.name + "</b> " + f.what + ". Cuando necesitas la predicción <span class='bad'>todavía no existe: es una FUGA</span> (un spoiler).<br>En el laboratorio el modelo saca accuracy <b>" + f.acc.toFixed(3) + "</b> y recall <b>" + f.rec.toFixed(3) + "</b> (honesto: " + base[0].toFixed(3) + " y " + base[1].toFixed(3) + "). " +
        (f.acc > 0.99 ? "Un 100 % es casi siempre una fuga: la columna es el propio target disfrazado." : "Una mejora que desaparecerá en producción, porque ese dato no estará ahí.");
    }
    out.set(msg);
  }
  view.draw(draw); update();
});

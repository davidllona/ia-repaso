/* Experimento: ciclo de vida de una capa personalizada. __init__ no conoce la entrada; build(input_shape) crea los pesos
   la primera vez que se llama a la capa; las llamadas siguientes reutilizan esos pesos (y fallan si las formas no encajan). */
Lab.register("curso3/c3m1-ciclo-capa", function (root, api) {
  var D = api.d;
  var S = { u: 3, n1: 2, n2: 5, bt: 4, bt2: 7, ph: 0 };
  var view = api.view(root, { aspect: 2.4, minH: 200, maxH: 280, label: "Tensor de entrada, pesos de la capa y tensor de salida, con sus formas" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "unidades (argumento de __init__)", min: 1, max: 6, step: 1, value: S.u, onInput: function (v) { S.u = v; update(); } });
  ui.slider({ label: "notas por usuario en la 1.ª llamada (features)", min: 1, max: 6, step: 1, value: S.n1, onInput: function (v) { S.n1 = v; update(); } });
  ui.slider({ label: "notas por usuario en la 2.ª llamada (features)", min: 1, max: 6, step: 1, value: S.n2, onInput: function (v) { S.n2 = v; update(); } });
  ui.button("◀ Atrás", function () { if (S.ph > 0) S.ph--; update(); });
  ui.button("Paso ▶", function () { if (S.ph < 3) S.ph++; update(); }, "primary");
  ui.button("Reiniciar", function () { S.ph = 0; update(); }, "warm");

  var CALL = ["capa = CapaDensa(%u)", "y = capa(x)        # x: (%b, %n1)", "y = capa(x2)       # x2: (%b, %n2)", "y = capa(x3)       # x3: (%b2, %n1)"];
  function fill(t) { return t.replace("%u", S.u).replace("%b2", S.bt2).replace("%b", S.bt).replace("%n1", S.n1).replace("%n2", S.n2); }
  function shp(a) { return "(" + a.join(", ") + ")"; }
  function box(ctx, x, y, w, h, fill, bd, lines, C) {
    D.rect(ctx, x, y, w, h, fill, bd, 2);
    lines.forEach(function (l, i) { D.text(ctx, l[0], x + w / 2, y + 18 + i * 16, { align: "center", size: l[1] || 11, mono: true, weight: l[2] ? 700 : 400, color: l[3] || C.ink }); });
  }
  function draw(ctx, w, h, C) {
    var ph = S.ph, built = ph >= 1, err = ph === 2 && S.n2 !== S.n1, bw = Math.max(72, Math.min(130, w * 0.24)), bh = 82, y = h / 2 - bh / 2 - 6, gap = (w - 3 * bw) / 4;
    var x1 = gap, x2 = 2 * gap + bw, x3 = 3 * gap + 2 * bw;
    var nin = ph === 2 ? S.n2 : S.n1, bt = ph === 3 ? S.bt2 : S.bt;
    if (ph === 0) {
      D.text(ctx, "Aún no hay datos: __init__ solo guarda", w / 2, y + 10, { align: "center", size: 12, color: C.ink2 });
      D.text(ctx, "unidades = " + S.u + ". La forma de la entrada es desconocida.", w / 2, y + 28, { align: "center", size: 12, color: C.ink2 });
      box(ctx, w / 2 - bw / 2 - 10, y + 44, bw + 20, 60, C.cobaltoWash, C.ink, [["CapaDensa", 12, true], ["built = False", 11], ["pesos: []", 11]], C);
      return;
    }
    box(ctx, x1, y, bw, bh, C.paper, C.ink, [["x" + (ph === 2 ? "2" : ph === 3 ? "3" : ""), 12, true], [shp([bt, nin]), 11], [bw >= 118 ? "usuarios × notas" : "usuario×nota", 9.5, false, C.muted]], C);
    box(ctx, x2, y, bw, bh + 18, built ? C.cobaltoWash : C.surface, err ? C.terracota : C.ink, [["CapaDensa", 12, true], ["built = True", 10.5], ["W " + shp([S.n1, S.u]), 11, true], ["b " + shp([S.u]), 11, true]], C);
    box(ctx, x3, y, bw, bh, err ? C.terracotaWash : C.olivaWash, err ? C.terracota : C.ink, err ? [["ERROR", 12, true, C.terracotaInk], ["matmul", 10.5], [shp([bt, nin]) + "·" + shp([S.n1, S.u]), 9.5]] : [["y", 12, true], [shp([bt, S.u]), 11], [bw >= 118 ? "usuarios × unidades" : "usuario×unid.", 9.5, false, C.muted]], C);
    D.arrow(ctx, x1 + bw, y + bh / 2, x2 - 2, y + bh / 2, C.ink, 2);
    D.arrow(ctx, x2 + bw, y + bh / 2, x3 - 2, y + bh / 2, err ? C.terracota : C.ink, 2);
    D.text(ctx, "y = x·W + b", (x2 + x3 + bw) / 2 - bw / 2 + 0, y + bh + 36, { align: "center", size: 11.5, mono: true, color: C.ink2, weight: 600 });
  }
  function update() {
    var ph = S.ph, s = "<b>Paso " + ph + "</b> · <code>" + fill(CALL[ph]) + "</code><br>";
    if (ph === 0) s += "Keras ejecuta <code>__init__(unidades=" + S.u + ")</code>. La capa existe, pero <b>no tiene pesos</b>: todavía no sabe cuántas features tendrán los datos.";
    if (ph === 1) s += "Keras ve el primer tensor y llama a <code>build(input_shape=" + shp([S.bt, S.n1]) + ")</code>. Dentro: <code>n_in = input_shape[-1] = " + S.n1 + "</code>, así que <code>add_weight</code> crea <b>W " + shp([S.n1, S.u]) + "</b> y <b>b " + shp([S.u]) + "</b> = " + (S.n1 * S.u + S.u) + " parámetros. Después ejecuta <code>call(x)</code> → y " + shp([S.bt, S.u]) + ".";
    if (ph === 2) {
      s += "<b>build NO se vuelve a llamar</b>: la capa ya está construida. Ejecuta <code>call</code> con W " + shp([S.n1, S.u]) + ". ";
      s += S.n2 === S.n1 ? "<span class='good'>Como las features coinciden (" + S.n1 + "), funciona.</span> Cambia «features de la 2.ª llamada» para provocar el error." : "<span class='bad'>x2 tiene " + S.n2 + " columnas y W tiene " + S.n1 + " filas: Matrix size-incompatible: In[0]: [" + S.bt + "," + S.n2 + "], In[1]: [" + S.n1 + "," + S.u + "].</span>";
    }
    if (ph === 3) s += "Cambiar el <b>tamaño del lote</b> (" + S.bt + " → " + S.bt2 + ") no importa: W no depende de él. <span class='good'>Funciona</span> y la salida es " + shp([S.bt2, S.u]) + ". Los pesos son los mismos: la capa tiene siempre " + (S.n1 * S.u + S.u) + " parámetros.";
    out.set(s); view.redraw();
  }
  view.draw(draw); update();
});

/* Experimento: ¿qué pasa al llamar a nn.CrossEntropyLoss con distintas formas y tipos de etiquetas?
   Los mensajes de error son los REALES de PyTorch 2.14 (ejecutados con torch.manual_seed(0); torch.randn(4, 3));
   la pérdida de los casos válidos se calcula aquí, en JavaScript. */
Lab.register("curso4/c4m5-errores-forma", function (root, api) {
  var D = api.d, M = api.math;
  var LOG = [[1.541, -0.2934, -2.1788], [0.5684, -1.0845, -1.3986], [0.4033, 0.838, -0.7193], [-0.4033, -0.5966, 0.182]];
  var Y = [0, 2, 1, 2];
  var T = {
    ok: { n: "long, forma (4,)  →  [0, 2, 1, 2]", kind: "vec", vals: Y, dt: "int64", shape: "(4,)" },
    fuera: { n: "long, forma (4,) con un 3  →  [0, 2, 3, 2]", kind: "vec", vals: [0, 2, 3, 2], dt: "int64", shape: "(4,)" },
    float: { n: "float32, forma (4,)  →  [0., 2., 1., 2.]", kind: "vec", vals: Y, dt: "float32", shape: "(4,)", f: true },
    int32: { n: "int32, forma (4,)", kind: "vec", vals: Y, dt: "int32", shape: "(4,)" },
    col: { n: "long, forma (4, 1)", kind: "col", vals: Y, dt: "int64", shape: "(4, 1)" },
    onehot_long: { n: "one-hot long, forma (4, 3)", kind: "oh", vals: Y, dt: "int64", shape: "(4, 3)" },
    onehot_float: { n: "one-hot float32, forma (4, 3)", kind: "oh", vals: Y, dt: "float32", shape: "(4, 3)", f: true },
    lista: { n: "lista de Python [0, 2, 1, 2]", kind: "lista", vals: Y, dt: "list", shape: "—" }
  };
  var ERR = {"normal|ok":["ok",0.9357],"normal|fuera":["err","IndexError: Target 3 is out of bounds."],"normal|float":["err","RuntimeError: expected target dtype to be Long or Byte, but got Float"],"normal|int32":["err","RuntimeError: expected target dtype to be Long or Byte, but got Int"],"normal|col":["err","RuntimeError: 0D or 1D target tensor expected, multi-target not supported"],"normal|onehot_long":["err","RuntimeError: Expected floating point type for target with class probabilities, got Long"],"normal|onehot_float":["ok",0.9357],"normal|lista":["err","TypeError: cross_entropy_loss(): argument 'target' (position 2) must be Tensor, not list"],
    "transpuesto|ok":["err","ValueError: Expected input batch_size (3) to match target batch_size (4)."],"transpuesto|fuera":["err","ValueError: Expected input batch_size (3) to match target batch_size (4)."],"transpuesto|float":["err","ValueError: Expected input batch_size (3) to match target batch_size (4)."],"transpuesto|int32":["err","ValueError: Expected input batch_size (3) to match target batch_size (4)."],"transpuesto|col":["err","ValueError: Expected input batch_size (3) to match target batch_size (4)."],"transpuesto|onehot_long":["err","ValueError: Expected input batch_size (3) to match target batch_size (4)."],"transpuesto|onehot_float":["err","ValueError: Expected input batch_size (3) to match target batch_size (4)."],"transpuesto|lista":["err","TypeError: cross_entropy_loss(): argument 'target' (position 2) must be Tensor, not list"]};
  var FIX = {
    ok: "Es la combinación estándar: logits <code>(N, K)</code> en <code>float32</code> + una etiqueta entera <code>int64</code> por muestra.",
    fuera: "Hay una etiqueta (3) que no está en 0…K−1 = 0…2. Revisa cómo codificaste las clases (¿empiezan en 1?) y que K sea el correcto.",
    float: "<code>y = y.long()</code>: las etiquetas de clase son índices enteros, no decimales.",
    int32: "<code>y = y.long()</code>: pide 64 bits (<code>int64</code>); <code>int32</code> tampoco vale.",
    col: "<code>y = y.squeeze(1)</code> (o <code>y.view(-1)</code>): una etiqueta por muestra, forma <code>(N,)</code>.",
    onehot_long: "O conviertes a índices (<code>y.argmax(dim=1)</code>) o lo pasas a decimales (<code>.float()</code>) para que cuente como distribución de probabilidad.",
    onehot_float: "Válido desde PyTorch 1.10: un vector de probabilidades por muestra (aquí 0/1, pero podría ser 0,9/0,05/0,05). Mismo resultado que con índices.",
    lista: "<code>y = torch.tensor(lista)</code>: la pérdida solo acepta tensores."
  };
  var S = { lg: "normal", t: "ok" };
  var view = api.view(root, { aspect: 2.3, minH: 215, maxH: 250, label: "Tensor de logits y tensor de etiquetas con su forma y tipo" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  ui.select({ label: "logits (lo que devuelve el modelo)", value: "normal", options: [["normal", "forma (4, 3)  = (N, K)"], ["transpuesto", "forma (3, 4)  = (K, N), transpuesto"]], onChange: function (v) { S.lg = v; update(); } });
  ui.select({ label: "etiquetas y", value: "ok", options: Object.keys(T).map(function (k) { return [k, T[k].n]; }), onChange: function (v) { S.t = v; update(); } });
  function res() { return ERR[S.lg + "|" + S.t]; }
  function ceLoss() {
    var t = T[S.t], tot = 0, i, k;
    for (i = 0; i < 4; i++) { var lp = M.softmax(LOG[i]).map(Math.log); tot -= lp[t.vals[i]]; }
    return tot / 4;
  }
  view.draw(function (ctx, w, h, C) {
    var r = res(), good = r[0] === "ok", edge = good ? C.oliva : C.terracota, t = T[S.t], tr = S.lg === "transpuesto";
    var rows = tr ? 3 : 4, cols = tr ? 4 : 3, cs = Math.min(40, Math.floor((w - 70) / 8)), i, j, x0 = 12, y0 = 40;
    D.text(ctx, "logits " + (tr ? "(3, 4)" : "(4, 3)") + " float32", x0, 18, { size: 11, weight: 700, color: C.ink2 });
    for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) {
      var v = tr ? LOG[j][i] : LOG[i][j];
      D.rect(ctx, x0 + j * cs, y0 + i * cs, cs, cs, C.surface, C.line, 1);
      D.text(ctx, v.toFixed(1).replace("-", "−"), x0 + j * cs + cs / 2, y0 + i * cs + cs / 2 + 4, { size: 10, mono: true, align: "center", color: C.ink2 });
    }
    D.rect(ctx, x0 - 1.5, y0 - 1.5, cols * cs + 3, rows * cs + 3, null, C.cobalto, 2);
    D.text(ctx, tr ? "K filas × N columnas" : "N filas (muestras) × K columnas (clases)", x0, y0 + rows * cs + 18, { size: 10, color: C.muted });
    var x1 = x0 + cols * cs + Math.max(26, cs * 0.8);
    D.text(ctx, "etiquetas " + t.shape + " " + t.dt, x1, 18, { size: 11, weight: 700, color: C.ink2 });
    if (t.kind === "lista") {
      D.text(ctx, "[0, 2, 1, 2]", x1, y0 + cs, { size: 12, mono: true, color: C.ink });
      D.text(ctx, "(no es un tensor)", x1, y0 + cs + 18, { size: 10, color: C.muted });
    } else if (t.kind === "oh") {
      for (i = 0; i < 4; i++) for (j = 0; j < 3; j++) {
        var on = t.vals[i] === j;
        D.rect(ctx, x1 + j * cs, y0 + i * cs, cs, cs, on ? C.oliva : C.surface, C.line, 1);
        D.text(ctx, t.f ? (on ? "1." : "0.") : (on ? "1" : "0"), x1 + j * cs + cs / 2, y0 + i * cs + cs / 2 + 4, { size: 10.5, mono: true, align: "center", color: on ? C.paper : C.muted });
      }
      D.rect(ctx, x1 - 1.5, y0 - 1.5, 3 * cs + 3, 4 * cs + 3, null, edge, 2);
    } else {
      var cw = t.kind === "col" ? cs * 1.0 : cs;
      for (i = 0; i < 4; i++) {
        var bad = S.t === "fuera" && t.vals[i] === 3;
        D.rect(ctx, x1, y0 + i * cs, cw, cs, bad ? C.terracotaWash : C.surface, bad ? C.terracota : C.line, bad ? 2 : 1);
        D.text(ctx, t.kind === "col" ? "[" + t.vals[i] + "]" : (t.f ? t.vals[i] + "." : String(t.vals[i])), x1 + cw / 2, y0 + i * cs + cs / 2 + 4, { size: 11, mono: true, align: "center" });
      }
      D.rect(ctx, x1 - 1.5, y0 - 1.5, cw + 3, 4 * cs + 3, null, edge, 2);
    }
    D.text(ctx, good ? "✓ válido" : "✗ error", w - 10, h - 10, { size: 13, weight: 700, color: good ? C.oliva : C.terracotaInk, align: "right" });
  });
  function update() {
    var r = res(), good = r[0] === "ok", t = T[S.t];
    var line = "criterio(logits, y)  →  " + (good ? "<span class='good'>OK</span>, pérdida = <b>" + (S.lg === "normal" ? ceLoss().toFixed(4) : r[1]) + "</b>" : "<span class='bad'>" + r[1] + "</span>");
    var fix = S.lg === "transpuesto" && !(S.t === "lista") ? "Los logits deben ser <code>(N, K)</code>: aquí N = 4 muestras y K = 3 clases. Mira <code>logits.shape</code> y cuál es la salida de tu última capa <code>nn.Linear</code>." : FIX[S.t];
    out.set(line + "<br><span style='font-family:var(--font-sans)'>" + fix + "</span>");
    out.el.style.fontFamily = "";
    view.redraw();
  }
  update();
});

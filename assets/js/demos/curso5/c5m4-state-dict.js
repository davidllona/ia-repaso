/* Experimento: qué hay dentro del state_dict de ResNet-18 y qué ocurre al cargarlo en otra red.
   Las claves y formas se generan con la misma regla que torchvision (comprobadas contra model.state_dict() real: 122 entradas en ResNet-18
   y 218 en ResNet-34). La lógica de load_state_dict reproduce la de PyTorch: un tamaño distinto es siempre error;
   claves que faltan o sobran son error solo con strict=True. */
Lab.register("curso5/c5m4-state-dict", function (root, api) {
  var D = api.d;
  var S = { destino: "mismo", K: 10, strict: true };

  function claves(bloques, K) {
    var out = [], ch = [64, 128, 256, 512], i, b;
    function bn(p, c) { out.push([p + ".weight", [c], "p"], [p + ".bias", [c], "p"], [p + ".running_mean", [c], "b"], [p + ".running_var", [c], "b"], [p + ".num_batches_tracked", [], "n"]); }
    out.push(["conv1.weight", [64, 3, 7, 7], "p"]); bn("bn1", 64);
    for (i = 0; i < 4; i++) for (b = 0; b < bloques[i]; b++) {
      var cin = (b === 0 && i > 0) ? ch[i - 1] : ch[i], c = ch[i], p = "layer" + (i + 1) + "." + b;
      out.push([p + ".conv1.weight", [c, cin, 3, 3], "p"]); bn(p + ".bn1", c);
      out.push([p + ".conv2.weight", [c, c, 3, 3], "p"]); bn(p + ".bn2", c);
      if (b === 0 && i > 0) { out.push([p + ".downsample.0.weight", [c, cin, 1, 1], "p"]); bn(p + ".downsample.1", c); }
    }
    out.push(["fc.weight", [K, 512], "p"], ["fc.bias", [K], "p"]);
    return out;
  }
  function numel(sh) { return sh.reduce(function (a, b) { return a * b; }, 1); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function shp(sh) { return "[" + sh.join(", ") + "]"; }

  var ck = claves([2, 2, 2, 2], 1000);
  function destino() { return S.destino === "r34" ? claves([3, 4, 6, 3], 1000) : claves([2, 2, 2, 2], S.destino === "mismo" ? 1000 : S.K); }

  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Red donde cargamos el checkpoint de ResNet-18 (1000 clases)", value: S.destino, options: [["mismo", "ResNet-18 igual"], ["cabeza", "ResNet-18 con otra fc"], ["r34", "ResNet-34"]], onChange: function (v) { S.destino = v; update(); } });
  ui.slider({ label: "Clases de la nueva fc (K)", min: 2, max: 1000, step: 1, value: S.K, onInput: function (v) { S.K = v; update(); } });
  ui.segmented({ label: "load_state_dict(…, strict=…)", value: "t", options: [["t", "True"], ["f", "False"]], onChange: function (v) { S.strict = v === "t"; update(); } });
  var tb = api.table(root, ["clave", "forma", "tipo", "al cargar"]);
  tb.el.style.maxHeight = "260px"; tb.el.style.overflowY = "auto"; tb.el.querySelector("table").style.fontSize = "0.7rem";

  function evalua() {
    var dst = destino(), mapa = {}, falta = [], sobra = [], tam = [], i;
    dst.forEach(function (e) { mapa[e[0]] = e; });
    var cmap = {}; ck.forEach(function (e) { cmap[e[0]] = e; });
    ck.forEach(function (e) { if (!mapa[e[0]]) sobra.push(e[0]); else if (shp(mapa[e[0]][1]) !== shp(e[1])) tam.push(e); });
    dst.forEach(function (e) { if (!cmap[e[0]]) falta.push(e[0]); });
    return { dst: dst, falta: falta, sobra: sobra, tam: tam, mapa: mapa };
  }
  function update() {
    var r = evalua(), rows = [], tipo = { p: "param.", b: "buffer", n: "buffer int" };
    ck.forEach(function (e) {
      var est = "ok", m = r.mapa[e[0]];
      if (!m) est = "<span class='bad'>sobra</span>"; else if (shp(m[1]) !== shp(e[1])) est = "<span class='bad'>tamaño " + shp(m[1]) + "</span>";
      rows.push(["<span style='word-break:break-all'>" + e[0] + "</span>", shp(e[1]), tipo[e[2]], est]);
    });
    tb.set(rows);
    var s = "El checkpoint tiene <b>" + ck.length + "</b> entradas (" + ck.filter(function (e) { return e[2] === "p"; }).length + " parámetros y " + ck.filter(function (e) { return e[2] !== "p"; }).length + " buffers de BatchNorm) · red destino con <b>" + r.dst.length + "</b> entradas<br>";
    var hay = r.tam.length > 0, listas = r.falta.length > 0 || r.sobra.length > 0;
    if (!hay && !listas) s += "<span class='good'>&lt;All keys matched successfully&gt;</span>";
    else if (hay) {
      s += "<span class='bad'>RuntimeError: Error(s) in loading state_dict for ResNet:</span><br>";
      r.tam.forEach(function (e) { s += "&nbsp;&nbsp;size mismatch for " + e[0] + ": copying a param with shape torch.Size(" + shp(e[1]) + ") from checkpoint, the shape in current model is torch.Size(" + shp(r.mapa[e[0]][1]) + ").<br>"; });
      s += "<b>Un tamaño distinto es error SIEMPRE</b>, también con strict=False. Solución: quitar esas claves del diccionario antes de cargar (<code>k.startswith(\"fc.\")</code>).";
    } else if (S.strict) {
      s += "<span class='bad'>RuntimeError: Error(s) in loading state_dict for ResNet:</span> " + (r.falta.length ? "Missing key(s): <b>" + r.falta.length + "</b> (" + r.falta[0] + ", …) " : "") + (r.sobra.length ? "Unexpected key(s): <b>" + r.sobra.length + "</b>" : "");
    } else {
      s += "<span class='good'>_IncompatibleKeys(missing_keys=[" + r.falta.length + " claves" + (r.falta.length ? ", p. ej. '" + r.falta[0] + "'" : "") + "], unexpected_keys=[" + r.sobra.length + " claves])</span><br>Con strict=False se carga lo que coincide y se avisa de lo demás: las " + r.falta.length + " claves que faltan se quedan con sus pesos al azar.";
    }
    var by = ck.reduce(function (a, e) { return a + numel(e[1]) * (e[2] === "n" ? 8 : 4); }, 0);
    s += "<br>Tamaño del archivo ≈ <b>" + (by / 1048576).toFixed(1).replace(".", ",") + " MiB</b> (cada número en 4 bytes; los contadores, en 8)";
    out.set(s);
  }
  update();
});

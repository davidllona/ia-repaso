/* Experimento: recorrer línea a línea el bucle de entrenamiento de PyTorch del clasificador de pósters
   y ver qué cambia en cada paso: modo train/eval, Dropout, gradientes, pesos y grabación de autograd.
   Dos interruptores muestran los dos olvidos típicos: zero_grad() y model.eval(). */
Lab.register("curso6/c6m2-bucle", function (root, api) {
  var CODE = [
    "for epoca in range(1, 13):",
    "    red.train()",
    "    for xb, yb in lotes:",
    "        opt.zero_grad()",
    "        loss = perdida(red(xb), yb)",
    "        loss.backward()",
    "        opt.step()",
    "    red.eval()",
    "    with torch.no_grad():",
    "        logits = red(X_va)"
  ];
  var EXPLICA = [
    "Empieza una época: una pasada completa por los 800 pósters (25 lotes de 32).",
    "<b>red.train()</b> pone la red en modo entrenamiento: Dropout apaga al azar el 30 % de las 64 neuronas de la cabeza.",
    "El DataLoader entrega el siguiente lote barajado: <b>xb</b> (32, 3, 32, 32) y <b>yb</b> (32,).",
    "<b>zero_grad()</b> vacía los gradientes del lote anterior. PyTorch los <em>suma</em> si no los vacías.",
    "Forward: la red da 32 logits y <b>BCEWithLogitsLoss</b> los compara con las etiquetas. Autograd va grabando las operaciones.",
    "<b>backward()</b> recorre la grabación hacia atrás y deja en cada peso su gradiente (.grad).",
    "<b>step()</b> mueve cada peso un paso de Adam en contra de su gradiente. Solo aquí cambian los pesos.",
    "<b>red.eval()</b> pone la red en modo evaluación: Dropout deja pasar todo (y BatchNorm usaría sus medias guardadas).",
    "<b>torch.no_grad()</b>: no se graba nada para backward. Va más rápido y gasta menos memoria.",
    "Se predicen los 200 pósters de validación de golpe. Con eval() la nota es siempre la misma."
  ];
  var S;
  function reset() { S = { linea: 0, epoca: 1, lote: 0, modo: "—", grad: 0, pasos: 0, grabando: false, nograd: false, evals: 0 }; }
  reset();
  var OLV = { zero: false, eval: false };
  var VAL_TRAIN = ["0.980", "0.975", "0.980", "0.980", "0.975"];   // medidas reales con mejor.pt en modo train

  var view = api.view(root, { aspect: 2.1, minH: 340, maxH: 400, label: "Bucle de entrenamiento de PyTorch con la línea actual resaltada y el estado de la red al lado" });
  var ui = api.controls(root), out = api.readout(root);
  ui.button("Siguiente línea →", function () { paso(); update(); }, "primary");
  ui.button("Acabar la época", function () { var g = 0; do { paso(); g++; } while (S.linea !== 9 && g < 400); update(); });
  OLV.tz = ui.toggle({ label: "Olvidar zero_grad()", value: false, onChange: function (v) { OLV.zero = v; reset(); update(); } });
  OLV.te = ui.toggle({ label: "Olvidar red.eval()", value: false, onChange: function (v) { OLV.eval = v; reset(); update(); } });

  // La línea resaltada es la que ACABA de ejecutarse; el panel muestra el estado después de ella.
  function paso() {
    var l = S.linea, sig = l === 6 ? (S.lote < 25 ? 2 : 7) : (l + 1) % 10;
    S.linea = sig;
    if (sig === 0) { S.epoca++; S.lote = 0; S.nograd = false; }
    if (sig === 1) S.modo = "train";
    if (sig === 2) S.lote++;
    if (sig === 3 && !OLV.zero) S.grad = 0;
    if (sig === 4) S.grabando = true;
    if (sig === 5) { S.grad += 1; S.grabando = false; }
    if (sig === 6) S.pasos++;
    if (sig === 7 && !OLV.eval) S.modo = "eval";
    if (sig === 8) S.nograd = true;
    if (sig === 9) S.evals++;
  }

  function draw(ctx, w, h, C) {
    var estrecho = w < 560, fs = estrecho ? 11 : 12.5, lh = estrecho ? 16 : 22, x0 = 10, y0 = 18, i;
    var codeW = estrecho ? w - 20 : w * 0.56;
    api.d.rect(ctx, 4, 4, codeW + 6, CODE.length * lh + 14, C.surface, C.line, 1);
    for (i = 0; i < CODE.length; i++) {
      var y = y0 + i * lh, act = i === S.linea;
      var omit = (i === 3 && OLV.zero) || (i === 7 && OLV.eval);
      if (act) api.d.rect(ctx, 6, y - lh + 5, codeW + 2, lh, C.cobaltoWash);
      var linea = omit ? CODE[i].replace(/^( *)/, "$1# ") : CODE[i];
      api.d.text(ctx, linea, x0, y, { size: fs, mono: true,
        color: omit ? C.muted : act ? C.cobaltoInk : C.ink, weight: act ? 600 : 400 });
    }
    // Panel de estado
    var px = estrecho ? 10 : codeW + 24, py = estrecho ? CODE.length * lh + 34 : 20, pw = estrecho ? w - 20 : w - px - 8, rh = estrecho ? 21 : 30;
    var filas = [
      ["Época / lote", S.epoca + " / " + S.lote + " de 25", null],
      ["Modo", S.modo, S.modo === "train" ? C.terracota : S.modo === "eval" ? C.oliva : null],
      ["Dropout", S.modo === "train" ? "activo: apaga el 30 %" : S.modo === "eval" ? "apagado: pasa todo" : "—", S.modo === "train" ? C.terracota : null],
      ["Gradientes", S.grad === 0 ? "vacíos" : S.grad === 1 ? "los de este lote" : "suma de " + S.grad + " lotes", S.grad > 1 ? C.terracota : S.grad === 1 ? C.cobalto : null],
      ["Pesos actualizados", S.pasos === 1 ? "1 vez" : S.pasos + " veces", null],
      ["Autograd", S.nograd ? "sin grabar (no_grad)" : S.grabando ? "grabando…" : "en espera", null]
    ];
    for (i = 0; i < filas.length; i++) {
      var yy = py + i * rh;
      api.d.text(ctx, filas[i][0], px, yy + 12, { size: estrecho ? 10.5 : 11, color: C.muted });
      api.d.text(ctx, filas[i][1], px + (estrecho ? pw * 0.42 : 0), yy + (estrecho ? 12 : 26), { size: estrecho ? 11 : 12.5, weight: 600, color: filas[i][2] || C.ink });
    }
    var gw = Math.min(pw * 0.3, 110), gx = px + pw - gw, gy = py + 3 * rh + (estrecho ? 6 : 20);
    api.d.rect(ctx, gx, gy, gw, 7, C.line);
    api.d.rect(ctx, gx, gy, Math.min(gw, gw * S.grad / 6), 7, S.grad > 1 ? C.terracota : C.cobalto);
  }

  function update() {
    view.redraw();
    var extra = "";
    if (OLV.zero && S.grad > 1) extra = "<br><span class='bad'>Sin zero_grad cada step usa la suma de todos los lotes anteriores: pasos cada vez más largos y torcidos.</span>";
    if (OLV.eval && S.evals > 0) extra = "<br><span class='bad'>Sin eval(), Dropout sigue sorteando en validación. Midiendo 5 veces el mismo modelo real salió val_acc " + VAL_TRAIN.join(", ") + " en vez de 0.980 siempre.</span>";
    out.set("<b>Línea " + (S.linea + 1) + ":</b> " + EXPLICA[S.linea] + extra);
  }
  view.draw(draw); update();
});

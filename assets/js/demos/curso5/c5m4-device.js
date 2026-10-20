/* Experimento: ¿dónde vive cada cosa en un paso de entrenamiento? Simula la lógica de dispositivos de PyTorch para un paso
   (forward → pérdida → backward → step): un módulo se mueve in situ con .to(); un tensor devuelve una copia (hay que reasignar).
   Los mensajes de error son los textos habituales con GPU; el detalle exacto varía con la versión y la capa. */
Lab.register("curso5/c5m4-device", function (root, api) {
  var D = api.d;
  var S = { gpu: "si", modelo: "mueve", x: "reasigna", y: "mueve", numpy: "no" };
  function esc(t) { return t.replace(/</g, "&lt;"); }

  function simula() {
    var dev = S.gpu === "si" ? "cuda:0" : "cpu";
    var mD = S.modelo === "mueve" ? dev : "cpu", xD = S.x === "reasigna" ? dev : "cpu", yD = S.y === "mueve" ? dev : "cpu";
    var pasos = [], salD = null, fallo = false;
    pasos.push({ txt: "dispositivo = torch.device(\"cuda\" if torch.cuda.is_available() else \"cpu\")", ok: true, res: "→ " + dev + (S.gpu === "no" ? "  (no hay GPU: todo se queda en la CPU y nada puede fallar)" : "") });
    pasos.push({ txt: S.modelo === "mueve" ? "modelo.to(dispositivo)" : "(no muevo el modelo)", ok: true, res: "modelo en " + mD });
    pasos.push({ txt: S.x === "reasigna" ? "x = x.to(dispositivo)" : (S.x === "sin" ? "x.to(dispositivo)   # sin reasignar" : "(no muevo x)"), ok: true, res: "x en " + xD + (S.x === "sin" && S.gpu === "si" ? "  (la copia en la GPU se perdió)" : "") });
    pasos.push({ txt: S.y === "mueve" ? "y = y.to(dispositivo)" : "(no muevo y)", ok: true, res: "y en " + yD });
    if (mD !== xD) { pasos.push({ txt: "salida = modelo(x)", ok: false, res: "RuntimeError: Expected all tensors to be on the same device, but found at least two devices, " + (mD < xD ? mD + " and " + xD : xD + " and " + mD) + "!" }); fallo = true; }
    else { salD = mD; pasos.push({ txt: "salida = modelo(x)", ok: true, res: "salida en " + salD }); }
    if (!fallo) {
      if (salD !== yD) { pasos.push({ txt: "l = perdida(salida, y)", ok: false, res: "RuntimeError: Expected all tensors to be on the same device, but found at least two devices, " + (salD < yD ? salD + " and " + yD : yD + " and " + salD) + "!" }); fallo = true; }
      else pasos.push({ txt: "l = perdida(salida, y)", ok: true, res: "pérdida en " + salD });
    }
    if (!fallo) {
      pasos.push({ txt: "l.backward(); optimizador.step()", ok: true, res: "gradientes y pesos actualizados en " + salD });
      if (S.numpy === "si") {
        if (salD.indexOf("cuda") === 0) pasos.push({ txt: "salida.numpy()", ok: false, res: "TypeError: can't convert cuda:0 device type tensor to numpy. Use Tensor.cpu() to copy the tensor to host memory first." });
        else pasos.push({ txt: "salida.numpy()", ok: true, res: "array de NumPy (el tensor ya estaba en la CPU)" });
      }
    }
    return { pasos: pasos, mD: mD, xD: xD, yD: yD, salD: salD, fallo: fallo || pasos.some(function (p) { return !p.ok; }) };
  }

  var view = api.view(root, { aspect: 2.0, minH: 200, maxH: 280, label: "Memoria de la CPU y de la GPU y dónde está cada objeto" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "¿Tu ordenador tiene GPU (cuda)?", value: S.gpu, options: [["si", "sí"], ["no", "no"]], onChange: function (v) { S.gpu = v; update(); } });
  ui.segmented({ label: "Modelo", value: S.modelo, options: [["mueve", "modelo.to(dev)"], ["no", "no lo muevo"]], onChange: function (v) { S.modelo = v; update(); } });
  ui.segmented({ label: "Imágenes x", value: S.x, options: [["reasigna", "x = x.to(dev)"], ["sin", "x.to(dev) a secas"], ["no", "no las muevo"]], onChange: function (v) { S.x = v; update(); } });
  ui.segmented({ label: "Etiquetas y", value: S.y, options: [["mueve", "y = y.to(dev)"], ["no", "no las muevo"]], onChange: function (v) { S.y = v; update(); } });
  ui.segmented({ label: "Luego imprimo salida.numpy()", value: S.numpy, options: [["no", "no"], ["si", "sí"]], onChange: function (v) { S.numpy = v; update(); } });

  function chip(ctx, x, y, w, h, txt, col, C, off) {
    D.rect(ctx, x, y, w, h, col, null);
    D.text(ctx, txt, x + w / 2, y + h / 2 + 4, { size: 11, mono: true, color: C.paper, align: "center", weight: 600 });
  }
  function draw(ctx, w, h, C) {
    var r = simula(), bw = (w - 30) / 2, i;
    var boxes = [{ n: "cpu", x: 8, t: "CPU (RAM)" }, { n: "cuda:0", x: 22 + bw, t: S.gpu === "si" ? "GPU (VRAM)" : "GPU: no existe" }];
    boxes.forEach(function (b) {
      var vive = b.n === "cpu" || S.gpu === "si";
      D.rect(ctx, b.x, 8, bw, h - 16, vive ? C.surface : C.paper, vive ? C.ink : C.muted, vive ? 1.6 : 1);
      D.text(ctx, b.t, b.x + 8, 24, { size: 11.5, color: vive ? C.ink2 : C.muted, weight: 600 });
    });
    var items = [["modelo", r.mD, C.cobalto], ["x", r.xD, C.terracota], ["y", r.yD, C.oliva]];
    var cnt = { "cpu": 0, "cuda:0": 0 };
    items.forEach(function (it) {
      var bx = it[1] === "cpu" ? boxes[0] : boxes[1], k = cnt[it[1]]++;
      chip(ctx, bx.x + 10, 36 + k * 36, bw - 20, 28, it[0], it[2], C);
    });
    if (r.salD) { var bx2 = r.salD === "cpu" ? boxes[0] : boxes[1], k2 = cnt[r.salD]++; D.rect(ctx, bx2.x + 10, 36 + k2 * 36, bw - 20, 28, C.paper, C.ink2, 1.4); D.text(ctx, "salida", bx2.x + bw / 2, 36 + k2 * 36 + 18, { size: 11, mono: true, color: C.ink2, align: "center" }); }
    if (r.fallo) D.text(ctx, "el paso falla", w / 2, h - 10, { size: 12, color: C.terracotaInk, align: "center", weight: 700 });
  }
  view.draw(draw);

  function update() {
    var r = simula(), s = "";
    r.pasos.forEach(function (p) { s += (p.ok ? "<span class='good'>ok </span>" : "<span class='bad'>ERROR </span>") + "<b>" + esc(p.txt) + "</b> " + esc(p.res) + "<br>"; });
    if (r.fallo) s += "<span class='bad'>Regla: modelo, datos y etiquetas deben estar en el MISMO dispositivo. Texto típico con GPU; el detalle exacto varía con la versión y la capa.</span>";
    else if (S.gpu === "si") s += "<span class='good'>Paso correcto. El modelo ocupa en la GPU unos <b>44,6 MiB</b> (11.689.512 parámetros × 4 bytes); Adam guarda además dos copias del mismo tamaño.</span>";
    else s += "<span class='good'>Sin GPU, el mismo código corre en la CPU y no hay nada que mover.</span>";
    out.set(s); view.redraw();
  }
  update();
});

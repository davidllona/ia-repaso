/* Experimento: validation_split en image_dataset_from_directory. Cada llamada (subset="training" y subset="validation")
   baraja la lista de archivos con su semilla y corta: training se queda el principio y validation el final.
   Con la MISMA semilla los dos trozos son complementarios; con semillas distintas hay pósters en los dos (fuga)
   y pósters en ninguno. 40 archivos: 0–19 «accion», 20–39 «animacion». */
Lab.register("curso6/c6m1-split-semilla", function (root, api) {
  var D = api.d, N = 40;
  var S = { sa: 42, sb: 42, vs: 0.2 };

  var view = api.view(root, { aspect: 1.35, minH: 280, maxH: 420, label: "Dos listas barajadas de 40 archivos, una por llamada, y la rejilla de archivos coloreada según acaben en train, en validación, en los dos o en ninguno" });
  var ui = api.controls(root), out = api.readout(root);
  var sA = ui.slider({ label: "seed de subset=\"training\"", min: 0, max: 50, step: 1, value: S.sa, fmt: function (v) { return v; }, onInput: function (v) { S.sa = v; update(); } });
  var sB = ui.slider({ label: "seed de subset=\"validation\"", min: 0, max: 50, step: 1, value: S.sb, fmt: function (v) { return v; }, onInput: function (v) { S.sb = v; update(); } });
  ui.slider({ label: "validation_split", min: 0.1, max: 0.5, step: 0.05, value: S.vs, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.vs = v; update(); } });
  ui.button("Misma semilla en las dos", function () { S.sb = S.sa; sB.set(S.sa, true); update(); }, "primary");
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "solo train"], [C0.oliva, "solo validación"], [C0.terracota, "en los dos (fuga)"], [C0.line, "en ninguno"]]);

  function barajar(seed) {
    var a = []; for (var i = 0; i < N; i++) a.push(i);
    return api.rng(seed * 7919 + 13).shuffle(a);
  }
  function calc() {
    var nVal = Math.floor(S.vs * N), A = barajar(S.sa), B = barajar(S.sb);
    var tr = A.slice(0, N - nVal), va = B.slice(N - nVal), st = [];
    for (var i = 0; i < N; i++) {
      var t = tr.indexOf(i) >= 0, v = va.indexOf(i) >= 0;
      st.push(t && v ? "ambos" : t ? "train" : v ? "val" : "nada");
    }
    return { A: A, B: B, nVal: nVal, tr: tr, va: va, st: st };
  }

  function draw(ctx, w, h, C) {
    var r = calc(), padL = 10, cw = (w - 2 * padL) / N, y1 = 26, sh = 16;
    function tira(lista, y, desde, hasta, col, txt) {
      D.text(ctx, txt, padL, y - 6, { size: 11, color: C.ink2, weight: 600 });
      lista.forEach(function (id, k) {
        var dentro = k >= desde && k < hasta;
        D.rect(ctx, padL + k * cw + 0.5, y, cw - 1, sh, dentro ? col : C.line);
      });
      D.rect(ctx, padL + desde * cw, y - 2, (hasta - desde) * cw, sh + 4, null, C.ink, 1.5);
    }
    tira(r.A, y1, 0, N - r.nVal, C.cobalto, "training, seed=" + S.sa + ": baraja y toma el principio");
    tira(r.B, y1 + 44, N - r.nVal, N, C.oliva, "validation, seed=" + S.sb + ": baraja y toma el final");
    var top = y1 + 44 + sh + 30, cols = 10, rows = 4, gap = 5;
    D.text(ctx, "Los 40 archivos (0–19 accion, 20–39 animacion)", padL, top - 8, { size: 11, color: C.ink2, weight: 600 });
    var cs = Math.min((w - 2 * padL - gap * (cols - 1)) / cols, (h - top - 8 - gap * (rows - 1)) / rows);
    var x0 = (w - (cols * cs + (cols - 1) * gap)) / 2;
    var col = { train: C.cobalto, val: C.oliva, ambos: C.terracota, nada: C.surface };
    for (var i = 0; i < N; i++) {
      var cx = x0 + (i % cols) * (cs + gap), cy = top + Math.floor(i / cols) * (cs + gap), st = r.st[i];
      D.rect(ctx, cx, cy, cs, cs, col[st], st === "nada" ? C.muted : null, 1.5);
      D.text(ctx, String(i), cx + cs / 2, cy + cs / 2 + 4, { size: Math.min(13, cs * 0.4), align: "center", weight: 600, mono: true, color: st === "nada" ? C.muted : C.surface });
    }
  }

  function update() {
    var r = calc(), cnt = { train: 0, val: 0, ambos: 0, nada: 0 };
    r.st.forEach(function (s) { cnt[s]++; });
    var ok = cnt.ambos === 0 && cnt.nada === 0;
    out.set("train: <b>" + (N - r.nVal) + "</b> archivos · validación: <b>" + r.nVal + "</b> (" + S.vs.toFixed(2) + " · 40 = " + (S.vs * 40).toFixed(1).replace(".", ",") + " → " + r.nVal + ")<br>" +
      (ok ? "<span class='good'>Misma semilla: los dos trozos se reparten los 40 sin repetir ni perder ninguno.</span>"
        : "<span class='bad'>Semillas distintas: <b>" + cnt.ambos + "</b> pósters están en train Y en validación (la validación ya los ha visto) y <b>" + cnt.nada + "</b> no se usan nunca.</span>"));
    view.redraw();
  }
  view.draw(draw); update();
});

/* Experimento: trocear un póster de 224×224 en parches cuadrados. Se elige el tamaño del parche y se ve
   la rejilla, la fila de tokens que sale (en orden de lectura), cuántos números tiene cada parche aplanado
   y cuántas parejas tendría que comparar la atención: (N + 1)². */
Lab.register("curso6/c6m3-parches", function (root, api) {
  var TAM = [56, 32, 28, 16, 14, 8];               // divisores de 224
  var S = { i: 3, foco: 0 };
  var view = api.view(root, { aspect: 1.25, minH: 340, maxH: 470, label: "Póster de 224 por 224 píxeles dividido en una rejilla de parches y, debajo, la fila de tokens que salen en orden de lectura" });
  var ui = api.controls(root), out = api.readout(root);
  var off = document.createElement("canvas"); off.width = 224; off.height = 224;
  var loop = null;

  var sl = ui.slider({ label: "Tamaño del parche (píxeles)", min: 0, max: TAM.length - 1, step: 1, value: S.i,
    fmt: function (v) { var p = TAM[v]; return p + "×" + p; }, onInput: function (v) { S.i = v; S.foco = 0; update(); } });
  ui.button("Recorrer en orden de lectura", function () { recorrer(); }, "primary");

  function miles(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function p() { return TAM[S.i]; }
  function lado() { return 224 / p(); }
  function n() { return lado() * lado(); }

  function pintaPoster(C) {
    var g = off.getContext("2d");
    g.fillStyle = C.cobaltoWash; g.fillRect(0, 0, 224, 224);
    g.fillStyle = C.paper2; g.fillRect(0, 150, 224, 74);            // suelo
    g.fillStyle = C.marker; g.beginPath(); g.arc(178, 52, 20, 0, 6.3); g.fill();   // sol
    g.fillStyle = C.terracota; g.fillRect(20, 14, 130, 30);          // banda del título
    g.fillStyle = C.paper; g.fillRect(30, 24, 22, 10); g.fillRect(58, 24, 30, 10); g.fillRect(94, 24, 44, 10);
    g.fillStyle = C.oliva; g.beginPath(); g.arc(112, 128, 36, 0, 6.3); g.fill();    // personaje
    g.fillRect(84, 150, 56, 50);
    g.fillStyle = C.paper; g.beginPath(); g.arc(100, 120, 7, 0, 6.3); g.arc(124, 120, 7, 0, 6.3); g.fill();
    g.fillStyle = C.ink; g.beginPath(); g.arc(101, 121, 3, 0, 6.3); g.arc(125, 121, 3, 0, 6.3); g.fill();
    g.fillStyle = C.ink2; g.fillRect(40, 206, 144, 6);              // créditos
  }

  function draw(ctx, w, h, C) {
    pintaPoster(C);
    var P = Math.min(w - 24, h * 0.56, 260), x0 = (w - P) / 2, y0 = 22, k = P / 224, L = lado(), i;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, x0, y0, P, P);
    for (i = 0; i <= L; i++) {
      api.d.line(ctx, x0 + i * p() * k, y0, x0 + i * p() * k, y0 + P, C.ink, L > 20 ? 0.5 : 1);
      api.d.line(ctx, x0, y0 + i * p() * k, x0 + P, y0 + i * p() * k, C.ink, L > 20 ? 0.5 : 1);
    }
    var fr = Math.floor(S.foco / L), fc = S.foco % L;
    api.d.rect(ctx, x0 + fc * p() * k, y0 + fr * p() * k, p() * k, p() * k, null, C.terracota, 3);
    api.d.text(ctx, "póster 224×224 · rejilla " + L + "×" + L, w / 2, 14, { align: "center", size: 12, color: C.ink2, weight: 600 });

    // fila de tokens
    var ty = y0 + P + 30, t = Math.max(14, Math.min(30, Math.floor((w - 24) / 16))), gap = 3;
    var porFila = Math.floor((w - 24 + gap) / (t + gap)), filas = Math.max(1, Math.floor((h - ty - 6) / (t + gap)));
    var cabe = porFila * filas, mostrar = Math.min(n(), cabe - (n() > cabe ? 1 : 0));
    api.d.text(ctx, "la «frase» que recibe el Transformer: " + n() + " tokens", 12, ty - 8, { size: 12, color: C.ink2, weight: 600 });
    for (i = 0; i < mostrar; i++) {
      var r = Math.floor(i / L), c = i % L, col = i % porFila, fil = Math.floor(i / porFila);
      var x = 12 + col * (t + gap), y = ty + fil * (t + gap);
      ctx.drawImage(off, c * p(), r * p(), p(), p(), x, y, t, t);
      api.d.rect(ctx, x, y, t, t, null, i === S.foco ? C.terracota : C.line, i === S.foco ? 3 : 1);
    }
    if (n() > mostrar) {
      var j = mostrar, xx = 12 + (j % porFila) * (t + gap), yy = ty + Math.floor(j / porFila) * (t + gap);
      api.d.text(ctx, "+" + (n() - mostrar), xx + 2, yy + t * 0.7, { size: 11, color: C.muted, weight: 600 });
    }
  }

  function update() {
    view.redraw();
    var L = lado(), num = p() * p() * 3, pares = (n() + 1) * (n() + 1);
    var fr = Math.floor(S.foco / L) + 1, fc = S.foco % L + 1;
    out.set("Parche " + p() + "×" + p() + " → rejilla " + L + "×" + L + " = <b>" + n() + " tokens</b><br>" +
      "Cada parche aplanado: " + p() + "·" + p() + "·3 = <b>" + miles(num) + " números</b> → la proyección E lo deja en d números<br>" +
      "Atención con el CLS: (" + n() + " + 1)² = <b>" + miles(pares) + " parejas</b> por cabeza<br>" +
      "Recuadro naranja: token " + (S.foco + 1) + " = fila " + fr + ", columna " + fc +
      (p() <= 8 ? "<br><span class='bad'>Parches diminutos: muchísimos tokens y la atención se dispara.</span>" : ""));
  }

  function recorrer() {
    if (loop) loop.stop();
    if (api.reduceMotion) { S.foco = n() - 1; update(); return; }
    S.foco = 0; var acc = 0, paso = Math.max(0.03, 3 / n()), salto = Math.max(1, Math.round(n() / 90));
    loop = api.loop(function (dt) {
      acc += dt; if (acc < paso) return; acc = 0;
      S.foco += salto; if (S.foco >= n()) { S.foco = n() - 1; update(); return false; }
      update();
    });
    loop.start();
  }

  view.draw(draw); update();
  return { destroy: function () { if (loop) loop.stop(); } };
});

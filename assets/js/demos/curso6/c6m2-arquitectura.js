/* Experimento: montar el clasificador de pósters bloque a bloque. Cada bloque conv 3×3 → MaxPool 2×2
   reduce la imagen a la mitad, duplica los filtros y amplía lo que «ve» cada neurona (campo receptivo).
   La cabeza puede aplanar (Flatten) o promediar (GlobalAveragePooling): se ve dónde están los parámetros. */
Lab.register("curso6/c6m2-arquitectura", function (root, api) {
  var S = { bloques: 3, f0: 16, cabeza: "flatten" };

  var view = api.view(root, { aspect: 1.6, minH: 340, maxH: 420, label: "Esquema del clasificador de pósters: cada bloque convolucional encoge la imagen y añade filtros; abajo, barras con los parámetros de cada capa" });
  var ui = api.controls(root), out = api.readout(root);

  ui.slider({ label: "Bloques conv → pool", min: 1, max: 4, step: 1, value: S.bloques,
    fmt: function (v) { return v; }, onInput: function (v) { S.bloques = v; update(); } });
  ui.segmented({ label: "Filtros del primer bloque", value: "16",
    options: [["8", "8"], ["16", "16"], ["32", "32"]], onChange: function (v) { S.f0 = +v; update(); } });
  ui.segmented({ label: "Cabeza", value: "flatten",
    options: [["flatten", "Flatten"], ["gap", "GlobalAvgPool"]], onChange: function (v) { S.cabeza = v; update(); } });

  function capas() {
    var L = [], lado = 32, cin = 3, rf = 1, salto = 1, b, cout;
    L.push({ nombre: "entrada", lado: 32, c: 3, p: 0, tipo: "in", rf: 1 });
    for (b = 0; b < S.bloques; b++) {
      cout = S.f0 * Math.pow(2, b);
      rf += 2 * salto;
      L.push({ nombre: "conv " + (b + 1), lado: lado, c: cout, p: 9 * cin * cout + cout, tipo: "conv", rf: rf });
      rf += salto; salto *= 2; lado = lado / 2;
      L.push({ nombre: "pool " + (b + 1), lado: lado, c: cout, p: 0, tipo: "pool", rf: rf });
      cin = cout;
    }
    var plano = S.cabeza === "flatten" ? lado * lado * cin : cin;
    L.push({ nombre: S.cabeza === "flatten" ? "Flatten" : "GAP", lado: 0, n: plano, p: 0, tipo: "flat" });
    L.push({ nombre: "Dense 64", lado: 0, n: 64, p: plano * 64 + 64, tipo: "dense" });
    L.push({ nombre: "sigmoide", lado: 0, n: 1, p: 64 + 1, tipo: "out" });
    return L;
  }

  var fmtN = function (n) { return n.toLocaleString("es-ES"); };

  function draw(ctx, w, h, C) {
    var L = capas(), n = L.length, i;
    var colW = (w - 16) / n, estrecho = colW < 52;
    var top = 22, alto = h * (estrecho ? 0.42 : 0.5), gap = 4;
    var maxC = 0; L.forEach(function (l) { if (l.c) maxC = Math.max(maxC, l.c); });
    var total = 0; L.forEach(function (l) { total += l.p; });
    api.d.text(ctx, "Forma de cada capa (alto = tamaño de la imagen)", 8, 14, { size: 11, color: C.muted });
    for (i = 0; i < n; i++) {
      var l = L[i], cx = 8 + colW * i + colW / 2, bw, bh, col;
      if (l.tipo === "flat" || l.tipo === "dense" || l.tipo === "out") {
        bw = Math.max(6, colW * 0.28);
        bh = l.tipo === "out" ? 10 : Math.max(14, Math.min(alto, alto * Math.log(l.n + 1) / Math.log(8193)));
        col = l.tipo === "out" ? C.terracota : C.oliva;
      } else {
        bh = Math.max(8, alto * l.lado / 32);
        bw = Math.max(5, (colW - gap) * (l.tipo === "in" ? 0.25 : 0.25 + 0.6 * l.c / maxC));
        col = l.tipo === "in" ? C.line : l.tipo === "conv" ? C.cobalto : C.cobaltoWash;
      }
      var y0 = top + (alto - bh) / 2;
      api.d.rect(ctx, cx - bw / 2, y0, bw, bh, col, C.ink2, 0.6);
      var etiqueta = l.lado ? l.lado + "×" + l.lado + "×" + l.c : String(l.n);
      if (estrecho) {           // en móvil: etiquetas al tresbolillo para que no se pisen
        var dy = (i % 2) * 22;
        api.d.line(ctx, cx, top + alto + 2, cx, top + alto + 4 + dy, C.line, 1);
        api.d.text(ctx, etiqueta, cx, top + alto + 13 + dy, { align: "center", size: 8.5, mono: true, color: C.ink2 });
        api.d.text(ctx, l.nombre, cx, top + alto + 23 + dy, { align: "center", size: 8.5, color: C.muted });
      } else {
        api.d.text(ctx, etiqueta, cx, top + alto + 14, { align: "center", size: 10, mono: true, color: C.ink2 });
        api.d.text(ctx, l.nombre, cx, top + alto + 27, { align: "center", size: 10, color: C.muted });
      }
    }
    // barras de parámetros
    var by = top + alto + (estrecho ? 62 : 44), bh2 = h - by - 8, maxP = 0;
    L.forEach(function (l) { maxP = Math.max(maxP, l.p); });
    api.d.text(ctx, "Parámetros de cada capa", 8, by, { size: 11, color: C.muted });
    for (i = 0; i < n; i++) {
      var p = L[i].p; if (!p) continue;
      var cx2 = 8 + colW * i + colW / 2, hh = Math.max(2, (bh2 - 26) * p / maxP), wB = Math.max(6, colW * 0.5);
      var c2 = L[i].tipo === "conv" ? C.cobalto : L[i].tipo === "out" ? C.terracota : C.oliva;
      api.d.rect(ctx, cx2 - wB / 2, by + bh2 - hh - 4, wB, hh, c2);
      var pct = Math.round(100 * p / total);
      api.d.text(ctx, pct + "%", cx2, by + bh2 - hh - 8, { align: "center", size: 10, weight: 600, color: C.ink });
    }
  }

  function update() {
    view.redraw();
    var L = capas(), total = 0, densa = 0, conv = 0, ultimo = null;
    L.forEach(function (l) { total += l.p; if (l.tipo === "dense") densa = l.p; if (l.tipo === "conv") conv += l.p; if (l.tipo === "pool") ultimo = l; });
    out.set("Total: <b>" + fmtN(total) + "</b> parámetros · convoluciones " + fmtN(conv) +
      " · Dense(64) <b>" + fmtN(densa) + "</b> (" + Math.round(100 * densa / total) + " %)<br>" +
      "Cada neurona del último mapa (" + ultimo.lado + "×" + ultimo.lado + ") ve una zona de <b>" + Math.min(ultimo.rf, 32) + "×" + Math.min(ultimo.rf, 32) + "</b> píxeles del póster" +
      (ultimo.rf >= 32 ? " (ya cubre el póster entero)." : ".") +
      (S.cabeza === "flatten" && densa / total > 0.6 ? "<br><span class='bad'>Casi todo el modelo está en la cabeza densa.</span>" : "") +
      (S.cabeza === "gap" ? "<br><span class='good'>GlobalAvgPool resume cada mapa en un número: la cabeza adelgaza.</span>" : ""));
  }
  view.draw(draw); update();
});

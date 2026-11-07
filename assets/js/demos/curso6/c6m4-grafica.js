/* Experimento: cada pregunta del evaluador se contesta con una gráfica concreta. Sale una pregunta; eliges entre
   curvas de entrenamiento, matriz de confusión, tabla comparativa o galería de errores; se dibuja lo que elegiste
   (con las cifras de ejemplo de la lección: CNN de pósters animación / acción, test de 200) y te dice si responde. */
Lab.register("curso6/c6m4-grafica", function (root, api) {
  var D = api.d;
  var ACC = [0.62, 0.74, 0.81, 0.86, 0.89, 0.92, 0.94, 0.96, 0.97, 0.98];
  var VAL = [0.60, 0.71, 0.79, 0.84, 0.87, 0.89, 0.90, 0.90, 0.89, 0.89];
  var CM = [[93, 7], [12, 88]];
  var TABLA = [["Baseline (siempre «acción»)", "0,500", "—"], ["CNN Keras", "0,905", "6 min"], ["CNN PyTorch", "0,910", "5 min"], ["ViT afinado", "0,955", "25 min"]];
  var PREG = [
    { q: "«¿Tu modelo ha memorizado el entrenamiento?»", ok: "curvas", why: "Las curvas enseñan la brecha: 0,98 en entrenamiento frente a 0,89 en validación al final. Un poco de sobreajuste desde la época 7." },
    { q: "«¿En qué clase se equivoca más?»", ok: "matriz", why: "La matriz lo dice fila a fila: 12 pósters de acción salen como animación, frente a solo 7 al revés." },
    { q: "«¿Por qué elegiste ese modelo y no el ViT?»", ok: "tabla", why: "La tabla pone accuracy, tiempo y coste lado a lado: el ViT gana 5 puntos pero tarda 4 veces más." },
    { q: "«¿Qué pósters le cuestan, y tiene sentido?»", ok: "errores", why: "Solo mirando los errores ves si son «bonitos» (pósters ambiguos) o «feos» (fallos seguros sin explicación, señal de un atajo o de un bug)." },
    { q: "«¿Cuántas épocas entrenaste y por qué paraste ahí?»", ok: "curvas", why: "La validación toca techo en la época 7 (0,90) y luego baja: ahí se para (o EarlyStopping lo hace por ti)." },
    { q: "«Un 90 %, ¿es mucho o poco?»", ok: "tabla", why: "Solo comparado: la tabla incluye el baseline (0,50 con clases equilibradas) y los otros modelos." }
  ];
  var NOM = { curvas: "Curvas de entrenamiento", matriz: "Matriz de confusión", tabla: "Tabla comparativa", errores: "Galería de errores" };
  var ART = { curvas: "las curvas de entrenamiento", matriz: "la matriz de confusión", tabla: "la tabla comparativa", errores: "la galería de errores" };
  var S = { i: 0, g: null, ok: 0, hechas: 0, resp: {} };

  var view = api.view(root, { aspect: 1.8, minH: 260, maxH: 340, label: "La gráfica elegida para responder a la pregunta del evaluador" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Responde con…", value: "", options: [["", "— elige una gráfica —"], ["curvas", NOM.curvas], ["matriz", NOM.matriz], ["tabla", NOM.tabla], ["errores", NOM.errores]],
    onChange: function (v) { elegir(v || null); } });
  var selEl = root.querySelector(".lab-controls select");
  ui.button("Siguiente pregunta →", function () { S.i = (S.i + 1) % PREG.length; S.g = null; selEl.value = ""; update(); }, "primary");

  function elegir(g) {
    S.g = g;
    if (g && !S.resp[S.i]) { S.resp[S.i] = true; S.hechas++; if (g === PREG[S.i].ok) S.ok++; }
    update();
  }

  function poster(ctx, x, y, s, tipo, C) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s * 1.4); ctx.clip();
    var H = s * 1.4, i;
    if (tipo === "anim") { D.rect(ctx, x, y, s, H, C.markerWash); D.circle(ctx, x + s / 2, y + H * 0.45, s * 0.26, C.cobalto); }
    else if (tipo === "acc") { D.rect(ctx, x, y, s, H, C.ink2); for (i = -2; i < 5; i++) D.line(ctx, x + i * s / 3, y + H, x + i * s / 3 + s, y, C.terracota, Math.max(2, s / 9)); }
    else if (tipo === "mezcla") { D.rect(ctx, x, y, s, H, C.ink2); D.circle(ctx, x + s / 2, y + H * 0.45, s * 0.26, C.cobalto); D.line(ctx, x, y + H, x + s, y + H * 0.3, C.terracota, Math.max(2, s / 9)); }
    else if (tipo === "pastel") { D.rect(ctx, x, y, s, H, C.terracotaWash); for (i = -2; i < 5; i++) D.line(ctx, x + i * s / 3, y + H, x + i * s / 3 + s, y, C.terracota, Math.max(1.5, s / 14)); }
    else { D.rect(ctx, x, y, s, H, C.markerWash); D.circle(ctx, x + s / 2, y + H * 0.45, s * 0.26, C.cobalto); D.rect(ctx, x, y + H * 0.78, s, H * 0.22, C.ink2); }
    ctx.restore(); D.rect(ctx, x, y, s, s * 1.4, null, C.line, 1);
  }

  function draw(ctx, w, h, C) {
    if (!S.g) {
      D.text(ctx, "Elige qué gráfica enseñarías", w / 2, h / 2 - 6, { align: "center", size: 15, weight: 600, color: C.ink2 });
      D.text(ctx, "para contestar a la pregunta de abajo", w / 2, h / 2 + 16, { align: "center", size: 12, color: C.muted });
      return;
    }
    var i;
    if (S.g === "curvas") {
      var p = api.plot(view, { xr: [1, 10], yr: [0.6, 1], xticks: 9, yticks: 4, xlabel: "época", ylabel: "accuracy", pad: { l: 50, r: 14, t: 18, b: 40 }, xfmt: function (v) { return Math.round(v); } });
      p.axes(ctx);
      D.line(ctx, p.x(7), p.box.y, p.x(7), p.box.y + p.box.h, C.muted, 1, [4, 4]);
      D.path(ctx, ACC.map(function (v, k) { return [p.x(k + 1), p.y(v)]; }), C.cobalto, 2.5);
      D.path(ctx, VAL.map(function (v, k) { return [p.x(k + 1), p.y(v)]; }), C.terracota, 2.5);
      var lx = p.x(1) + 8;
      D.line(ctx, lx, p.y(0.975) - 4, lx + 16, p.y(0.975) - 4, C.cobalto, 2.5);
      D.text(ctx, "entrenamiento", lx + 22, p.y(0.975), { size: 11, color: C.cobaltoInk, weight: 600 });
      D.line(ctx, lx, p.y(0.935) - 4, lx + 16, p.y(0.935) - 4, C.terracota, 2.5);
      D.text(ctx, "validación", lx + 22, p.y(0.935), { size: 11, color: C.terracotaInk, weight: 600 });
      D.text(ctx, "mejor: época 7", p.x(7) - 4, p.y(0.62), { align: "right", size: 10, color: C.muted });
    } else if (S.g === "matriz") {
      var s = Math.min((w - 140) / 2, (h - 70) / 2), x0 = (w - 2 * s) / 2 + 30, y0 = 34, r, c, lab = ["animación", "acción"];
      for (r = 0; r < 2; r++) for (c = 0; c < 2; c++) {
        var v = CM[r][c], diag = r === c;
        D.rect(ctx, x0 + c * s, y0 + r * s, s, s, diag ? C.olivaWash : (v > 10 ? C.terracotaWash : C.surface), C.line, 1);
        D.text(ctx, String(v), x0 + c * s + s / 2, y0 + r * s + s / 2 + 8, { align: "center", size: 24, weight: 600, color: diag ? C.olivaInk : C.terracotaInk });
      }
      for (i = 0; i < 2; i++) {
        D.text(ctx, lab[i], x0 - 8, y0 + i * s + s / 2 + 4, { align: "right", size: 12, color: C.ink2 });
        D.text(ctx, lab[i], x0 + i * s + s / 2, y0 - 8, { align: "center", size: 12, color: C.ink2 });
      }
      D.text(ctx, "filas: lo que era · columnas: lo que dijo", w / 2, h - 10, { align: "center", size: 11, color: C.muted });
    } else if (S.g === "tabla") {
      var cols = w < 420 ? [8, w * 0.62, w * 0.84] : [20, w * 0.58, w * 0.8], rh = Math.min(42, (h - 30) / 5), y = 26;
      ["modelo", "accuracy", "tiempo"].forEach(function (t, k) { D.text(ctx, t, cols[k], y, { size: 12, weight: 600, color: C.muted }); });
      TABLA.forEach(function (f, k) {
        var yy = y + (k + 1) * rh;
        D.line(ctx, 8, yy - rh + 10, w - 8, yy - rh + 10, C.line, 1);
        f.forEach(function (t, m) { D.text(ctx, w < 420 && m === 0 ? t.replace("Baseline (siempre «acción»)", "Baseline «acción»") : t, cols[m], yy, { size: w < 420 ? 12 : 13, mono: m > 0, color: k === 0 ? C.muted : C.ink, weight: k === 3 && m === 1 ? 600 : 400 }); });
      });
    } else {
      var tipos = [["mezcla", "anim.", "acción", "0,58", 1], ["pastel", "acción", "anim.", "0,55", 1], ["anim", "anim.", "acción", "0,97", 0], ["texto", "anim.", "acción", "0,94", 0]];
      var n = tipos.length, gap = 14, ps = Math.min((w - gap * (n + 1)) / n, (h - 92) / 1.4);
      var xs = (w - (n * ps + (n - 1) * gap)) / 2, y0g = Math.max(10, (h - ps * 1.4 - 66) / 2);
      for (i = 0; i < n; i++) {
        var t = tipos[i], x = xs + i * (ps + gap);
        poster(ctx, x, y0g, ps, t[0], C);
        var yb = y0g + ps * 1.4;
        D.text(ctx, "era " + t[1], x + ps / 2, yb + 15, { align: "center", size: 11, color: C.ink2 });
        D.text(ctx, "→ " + t[2], x + ps / 2, yb + 29, { align: "center", size: 11, color: C.ink2 });
        D.text(ctx, t[3], x + ps / 2, yb + 43, { align: "center", size: 11, mono: true, color: C.ink2 });
        D.text(ctx, t[4] ? "bonito" : "feo", x + ps / 2, yb + 60, { align: "center", size: 12, weight: 600, color: t[4] ? C.olivaInk : C.terracotaInk });
      }
    }
  }

  function update() {
    view.redraw();
    var P = PREG[S.i], msg = "Pregunta " + (S.i + 1) + " de " + PREG.length + ": <b>" + P.q + "</b><br>";
    if (S.g) msg += (S.g === P.ok ? "<span class='good'>Sí: " : "<span class='bad'>Mejor con " + ART[P.ok] + ". </span><span>") + P.why + "</span><br>";
    msg += "Aciertos: <b>" + S.ok + " de " + S.hechas + "</b>";
    out.set(msg);
  }
  view.draw(draw); update();
});

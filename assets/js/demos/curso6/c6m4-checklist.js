/* Experimento: la checklist antes de entregar el proyecto final. Quince comprobaciones en cinco grupos; cinco son
   «críticas» (si fallan, los números de la presentación no valen). Marcas las que tienes y la barra de cada grupo
   se llena; el cuadro de lectura te dice qué crítica falta todavía. Son reglas, no un modelo. */
Lab.register("curso6/c6m4-checklist", function (root, api) {
  var D = api.d;
  var G = [
    { nom: "Datos", items: [["Train, validación y test separados antes de mirar, sin pósters repetidos", 1], ["El mismo preprocesado al entrenar y al predecir", 0], ["Aumento de datos solo en entrenamiento", 0]] },
    { nom: "Modelos", items: [["Keras y PyTorch con las mismas condiciones (datos, tamaño, épocas)", 1], ["Semillas fijadas: dos ejecuciones dan lo mismo", 0], ["El ViT dice de dónde vienen sus pesos preentrenados", 0]] },
    { nom: "Evaluación", items: [["El test se mira una sola vez, al final", 1], ["Hay un baseline en la tabla", 0], ["Matriz de confusión y 3–5 errores comentados", 0]] },
    { nom: "Presentación", items: [["Una gráfica por pregunta, con ejes y unidades", 0], ["Tabla comparativa con los pesos a la vista", 0], ["Limitaciones y próximos pasos", 1]] },
    { nom: "Entrega", items: [["El modelo guardado se recarga y predice igual", 0], ["El cuaderno corre de arriba abajo en limpio", 1], ["Versiones de las librerías anotadas", 0]] }
  ];
  var hecho = {};

  var view = api.view(root, { aspect: 3.2, minH: 120, maxH: 170, label: "Barras de progreso de la checklist por grupo" });
  var ui = api.controls(root), out = api.readout(root);
  ui.button("Marcar todo", function () { G.forEach(function (g, a) { g.items.forEach(function (_, b) { hecho[a + "-" + b] = true; }); }); sync(); }, "primary");
  ui.button("Desmarcar todo", function () { hecho = {}; sync(); });

  var lista = api.el("div", { class: "lab-checklist" });
  lista.style.cssText = "display:grid;gap:.6rem;margin-top:.6rem;font-size:.92rem;line-height:1.4";
  var cajas = [];
  G.forEach(function (g, a) {
    var bloque = api.el("fieldset", {});
    bloque.style.cssText = "border:1px solid var(--line);padding:.4rem .7rem .5rem;margin:0;min-width:0";
    bloque.appendChild(api.el("legend", { text: g.nom }));
    g.items.forEach(function (it, b) {
      var id = api.uid("ck"), cb = api.el("input", { type: "checkbox", id: id });
      cb.addEventListener("change", function () { hecho[a + "-" + b] = cb.checked; update(); });
      var lab = api.el("label", { for: id }, cb, " " + it[0] + (it[1] ? " ★" : ""));
      lab.style.cssText = "display:block;padding:.15rem 0;cursor:pointer";
      bloque.appendChild(lab);
      cajas.push([a + "-" + b, cb]);
    });
    lista.appendChild(bloque);
  });
  root.appendChild(lista);

  function sync() { cajas.forEach(function (c) { c[1].checked = !!hecho[c[0]]; }); update(); }

  function draw(ctx, w, h, C) {
    var n = G.length, gap = 8, bw = (w - 16 - gap * (n - 1)) / n, top = 24, bh = h - top - 30;
    G.forEach(function (g, a) {
      var hechas = g.items.filter(function (_, b) { return hecho[a + "-" + b]; }).length, x = 8 + a * (bw + gap), f = hechas / g.items.length;
      D.rect(ctx, x, top, bw, bh, C.surface, C.line, 1);
      D.rect(ctx, x, top + bh * (1 - f), bw, bh * f, f === 1 ? C.oliva : C.cobalto);
      D.text(ctx, hechas + "/" + g.items.length, x + bw / 2, top - 7, { align: "center", size: 11, mono: true, color: C.ink2 });
      D.text(ctx, w < 420 ? g.nom.slice(0, 5) + (g.nom.length > 5 ? "." : "") : g.nom, x + bw / 2, h - 10, { align: "center", size: 11, color: C.ink2 });
    });
  }

  function update() {
    view.redraw();
    var total = 0, ok = 0, faltan = [];
    G.forEach(function (g, a) { g.items.forEach(function (it, b) { total++; if (hecho[a + "-" + b]) ok++; else if (it[1]) faltan.push(it[0]); }); });
    out.set("Llevas <b>" + ok + " de " + total + "</b>. " +
      (faltan.length ? "<span class='bad'>Críticas (★) pendientes: " + faltan.length + "</span><br>La primera: <b>" + faltan[0] + "</b>." :
        "<span class='good'>Todas las críticas hechas" + (ok === total ? " y el resto también: listo para entregar." : "; remata las demás si te da tiempo.") + "</span>"));
  }
  view.draw(draw); update();
});

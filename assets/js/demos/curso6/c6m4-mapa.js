/* Experimento: el proyecto entero en un mapa. Cinco cajas (datos → CNN → ViT → híbrido → presentar), recorridas
   con Keras o con PyTorch. Al tocar una caja se ve qué hace, la línea clave en cada framework, la forma del tensor
   que sale de ella (canal al final en Keras, delante en PyTorch) y un enlace al módulo donde se explica. */
Lab.register("curso6/c6m4-mapa", function (root, api) {
  var D = api.d;
  var base = (document.body.getAttribute("data-root") || "../../") + "curso-6/";
  var ETAPAS = [
    { id: "datos", nom: "Datos", mod: 1, href: "modulo-1/leccion-6.html", k: "(32, 32, 32, 3)", p: "(32, 3, 32, 32)",
      txt: "Carpetas → lotes de 32 pósters, con aumento de datos solo al entrenar.",
      kc: "image_dataset_from_directory + capas Random…", pc: "ImageFolder + transforms + DataLoader" },
    { id: "cnn", nom: "CNN", mod: 2, href: "modulo-2/leccion-1.html", k: "(32, 2)", p: "(32, 2)", km: "(32, 8, 8, 32)", pm: "(32, 32, 8, 8)",
      txt: "Filtros que buscan bordes y formas; pooling que resume; una Dense que decide.",
      kc: "Sequential([Conv2D, MaxPooling2D, …, Dense])", pc: "nn.Module con nn.Conv2d, nn.MaxPool2d, nn.Linear" },
    { id: "vit", nom: "ViT", mod: 3, href: "modulo-3/leccion-1.html", k: "(32, 65, 64)", p: "(32, 65, 64)",
      txt: "El póster se trocea en 64 parches de 4×4; cada parche es un token, más el CLS. Se parte de pesos preentrenados.",
      kc: "capas propias de parches + MultiHeadAttention", pc: "timm / torchvision vit_b_16(weights=…)" },
    { id: "hib", nom: "Híbrido", mod: 3, href: "modulo-3/leccion-5.html", k: "(32, 65, 32)", p: "(32, 65, 32)",
      txt: "La CNN saca mapas 8×8×32; cada casilla del mapa se convierte en un token para el transformer.",
      kc: "Conv2D… → Reshape((64, 32)) → bloques transformer", pc: "cnn(x).flatten(2).transpose(1, 2) → TransformerEncoder" },
    { id: "pres", nom: "Presentar", mod: 4, href: "modulo-4/leccion-2.html", k: "tabla", p: "tabla",
      txt: "Métrica, curvas, matriz de confusión, tabla comparativa con pesos y limitaciones honestas.",
      kc: "history.history + sklearn.metrics", pc: "listas de pérdidas propias + sklearn.metrics" }
  ];
  var S = { fw: "k", i: 0 };

  var view = api.view(root, { aspect: 2.3, minH: 300, maxH: 340, label: "Mapa del proyecto: cinco cajas en cadena (datos, CNN, ViT, híbrido y presentar) con la forma del tensor que sale de cada una" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Framework", options: [["k", "Keras"], ["p", "PyTorch"]], value: S.fw, onChange: function (v) { S.fw = v; update(); } });
  ui.button("← Anterior", function () { S.i = (S.i + ETAPAS.length - 1) % ETAPAS.length; update(); });
  ui.button("Siguiente →", function () { S.i = (S.i + 1) % ETAPAS.length; update(); }, "primary");

  var cajas = [];
  function layout(w, h) {
    var n = ETAPAS.length, r = [], i;
    if (w >= 560) {
      var gap = 22, bw = (w - 20 - gap * (n - 1)) / n, bh = Math.min(130, h - 160), y = 60;
      for (i = 0; i < n; i++) r.push({ x: 10 + i * (bw + gap), y: y, w: bw, h: bh, dir: "h" });
    } else {
      var gh = 12, bh2 = (h - 16 - gh * (n - 1)) / n, bw2 = Math.min(150, w * 0.42);
      for (i = 0; i < n; i++) r.push({ x: 8, y: 8 + i * (bh2 + gh), w: bw2, h: bh2, dir: "v" });
    }
    return r;
  }

  function draw(ctx, w, h, C) {
    cajas = layout(w, h);
    var i, b, e, sel, col, wash;
    for (i = 0; i < cajas.length; i++) {
      b = cajas[i]; e = ETAPAS[i]; sel = i === S.i;
      col = e.mod === 1 ? C.oliva : e.mod === 2 ? C.cobalto : e.mod === 3 ? C.terracota : C.ink2;
      wash = e.mod === 1 ? C.olivaWash : e.mod === 2 ? C.cobaltoWash : e.mod === 3 ? C.terracotaWash : C.paper2;
      D.rect(ctx, b.x, b.y, b.w, b.h, sel ? wash : C.surface, sel ? col : C.line, sel ? 3 : 1.5);
      if (b.dir === "h") {
        D.text(ctx, e.nom, b.x + b.w / 2, b.y + b.h / 2 - 2, { align: "center", size: 15, weight: 600, color: C.ink });
        D.text(ctx, "módulo " + e.mod, b.x + b.w / 2, b.y + b.h / 2 + 18, { align: "center", size: 11, color: C.muted });
        D.text(ctx, S.fw === "k" ? e.k : e.p, b.x + b.w / 2, b.y + b.h + 26, { align: "center", size: 11, mono: true, color: sel ? C.ink : C.muted, weight: sel ? 600 : 400 });
        if (i < cajas.length - 1) D.arrow(ctx, b.x + b.w + 2, b.y + b.h / 2, cajas[i + 1].x - 2, b.y + b.h / 2, C.muted, 1.5);
      } else {
        D.text(ctx, e.nom, b.x + 10, b.y + b.h / 2 + 5, { size: 14, weight: 600, color: C.ink });
        D.text(ctx, "M" + e.mod, b.x + b.w - 8, b.y + b.h / 2 + 4, { align: "right", size: 11, color: C.muted });
        D.text(ctx, S.fw === "k" ? e.k : e.p, b.x + b.w + 12, b.y + b.h / 2 + 4, { size: 11, mono: true, color: sel ? C.ink : C.muted, weight: sel ? 600 : 400 });
        if (i < cajas.length - 1) D.arrow(ctx, b.x + 22, b.y + b.h, b.x + 22, cajas[i + 1].y, C.muted, 1.5);
      }
    }
    if (cajas[0].dir === "h") {
      D.text(ctx, S.fw === "k" ? "Keras: el canal va al final (N, H, W, C)" : "PyTorch: el canal va delante (N, C, H, W)", w / 2, 32, { align: "center", size: 13, weight: 500, color: C.ink2 });
      D.text(ctx, "forma de lo que sale de cada caja (lote de 32 pósters de 32×32)", w / 2, h - 18, { align: "center", size: 11, color: C.muted });
    }
  }

  view.pointer({ down: function (x, y) {
    for (var i = 0; i < cajas.length; i++) {
      var b = cajas[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { S.i = i; update(); return; }
    }
  } });

  function update() {
    view.redraw();
    var e = ETAPAS[S.i], k = S.fw === "k";
    var forma = (k ? e.k : e.p) + (e.km ? " (mapas antes de aplanar: " + (k ? e.km : e.pm) + ")" : "");
    out.set("<b>" + (S.i + 1) + " · " + e.nom + "</b> — " + e.txt + "<br>" +
      "Keras: <b>" + e.kc + "</b><br>PyTorch: <b>" + e.pc + "</b><br>" +
      "Sale: <b>" + forma + "</b><br>" +
      "<a href=\"" + base + e.href + "\">Repasar en el módulo " + e.mod + " →</a>");
  }
  view.draw(draw); update();
});

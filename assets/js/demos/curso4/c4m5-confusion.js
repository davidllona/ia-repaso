/* Experimento: matriz de confusión REAL de la regresión softmax de dígitos (360 imágenes de test) en varios momentos
   del entrenamiento (SGD lr 0.5, lotes de 32). La matriz, la exactitud, la precisión y el recall se calculan aquí
   a partir de las 360 etiquetas reales y las 360 predicciones guardadas de cada época. */
Lab.register("curso4/c4m5-confusion", function (root, api) {
  var D = api.d, M = api.math;
  var DATA = {"y":"528172626505934424996381256034672666650917965752750855324002756137657090382582359327968101294912784269373961109216348710046582883008643933330700195815066661776778736590380981959589979195473049775658345492552138893610140556674384107928484240002670452290468239230687144116381257832034199963716947181305341935474151509842384120114457503224277876311588867278942034","snaps":{"0":{"pred":"222300220222202222820222222222000002022200202022022222220220022200220420222222222020622222222022022202006202202222022022222202226422022002202044220222200002200022002222222202222022202222202202002222222222222222220022022220200023320220220226222022222222200222202000200020002020002223022202020220220222202222202222342022020222222822220002200200202228200402222222","acc":0.0861,"loss":2.4179},"1":{"pred":"921172626505934424436381256034678666450917965752750155324000756137697090382582354327961101294812784268373969109216348710046512813008643933334700195815066661176778736590380911959589973195473049475158345492551138893690140556674384504921484240002670452290468239230687944116381257832034197963716447181309311935474141508812384120114457503224277876311588867278942034","acc":0.9028,"loss":0.6976},"2":{"pred":"528672626505934424996381256034672666850917965752750155324002756137697090382572354327968908294812784269373969109216348720046582812008643933334700195825066661776778736590380981959589979195473049775658345492552138893690140556674384507921484240002670452290462239230687944166381257732034197963726947281305343935474151509842384120614457503224277876311588867278942034","acc":0.925,"loss":0.4507},"3":{"pred":"521672626505934424996381256034672666850917965752750155324000756137697090382572359327961908294812784269373969109216348710046512813008643933334700195815066661776778736590380911959589979195473049775158345492552138893690140556674384507921484240002670452290468239230697944116381257832034197963716947181305311935474151509842384120114457503224277876311588867278942034","acc":0.9333,"loss":0.3466},"5":{"pred":"528672626505934424996381256034672666850917965752750155324002756137697090382572354327968108294812784269373969109216348710046512813008643933334700195815066661776778736590380911959589979195473049775158345492552138893690140556674384507921484240002670452290468239230687944116381257832034197963716947181305343935474151509842384120114457503224277876311588867278942034","acc":0.9444,"loss":0.2633},"10":{"pred":"521672626505934424996381256034672666850917965752750155324002756137697090382572354327961108294812784269373961109216348710046512813008643933334700195815066661776778736590380911959589979195473049775158345492552138893690140556674384507921484240002670452290468239230687144116381257732034197963716947181305341935474151509842384120114457503224277876311588867278942034","acc":0.9444,"loss":0.1823},"20":{"pred":"528672626505934424996381256034672666850917965752750155324002756137657090382572359327968108294812784269373969109216348710046582813008643933334700195815066661776778736590580981959589979195473049775658345492552138893690140556674384507921484240002670452290468239230687144116381257832034199963716947181305341935474151509842384120114457503224277876311588867278942034","acc":0.9639,"loss":0.1289},"30":{"pred":"528672626505934424996381256034672666850917965752750155324002756137657090382572359327968908294812784269373969109216348710046582813008643933334700195815066661776778736590380981959589979195473049775658345492552138893690140556674384807921484240002670452290468239230687144116381257832034199963716947181305343935474151509842384120114457503224277876311588867278942034","acc":0.9611,"loss":0.1046}}};
  var EPS = [0, 1, 2, 3, 5, 10, 20, 30];
  function rgb(h) {
    h = (h || "#888").trim();
    if (h.charAt(0) === "#") { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    var m = h.match(/\d+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function mix(a, b, t) { return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(",") + ")"; }
  var S = { e: 7, pct: false, r: 1, c: 9 };
  function matrix(ep) {
    var cm = [], i, j, pr = DATA.snaps[String(ep)].pred;
    for (i = 0; i < 10; i++) { cm.push(new Array(10).fill(0)); }
    for (i = 0; i < DATA.y.length; i++) cm[+DATA.y.charAt(i)][+pr.charAt(i)]++;
    return cm;
  }
  var view = api.view(root, { aspect: 1.05, minH: 300, maxH: 470, drag: false, label: "Matriz de confusión de diez por diez: filas la clase real, columnas la predicha" });
  var geo = {};
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  ui.slider({ label: "época del entrenamiento", min: 0, max: EPS.length - 1, step: 1, value: S.e, fmt: function (v) { return EPS[v] === 0 ? "0 (sin entrenar)" : EPS[v]; }, onInput: function (v) { S.e = v; update(); } });
  ui.toggle({ label: "Mostrar % de cada fila (recall)", value: false, onChange: function (v) { S.pct = v; update(); } });
  view.pointer({ down: function (px, py) {
    var c = Math.floor((px - geo.x0) / geo.cs), r = Math.floor((py - geo.y0) / geo.cs);
    if (c < 0 || c > 9 || r < 0 || r > 9) return; S.r = r; S.c = c; update();
  } });
  view.draw(function (ctx, w, h, C) {
    var cm = matrix(EPS[S.e]), cs = Math.floor(Math.min((w - 54) / 10, (h - 62) / 10)), x0 = Math.round((w - 10 * cs) / 2) + 14, y0 = 40, i, j;
    geo = { cs: cs, x0: x0, y0: y0 };
    var pa = rgb(C.surface), ol = rgb(C.oliva), te = rgb(C.terracota);
    D.text(ctx, "clase predicha por el modelo", x0 + 5 * cs, 14, { size: 11, weight: 700, align: "center", color: C.ink2 });
    D.text(ctx, "real", x0 - 34, y0 + 5 * cs, { size: 11, weight: 700, align: "center", color: C.ink2, rotate: -Math.PI / 2 });
    for (i = 0; i < 10; i++) {
      D.text(ctx, String(i), x0 + i * cs + cs / 2, y0 - 8, { size: 11, mono: true, align: "center", weight: i === S.c ? 700 : 400, color: i === S.c ? C.ink : C.muted });
      D.text(ctx, String(i), x0 - 10, y0 + i * cs + cs / 2 + 4, { size: 11, mono: true, align: "center", weight: i === S.r ? 700 : 400, color: i === S.r ? C.ink : C.muted });
    }
    for (i = 0; i < 10; i++) {
      var rs = cm[i].reduce(function (a, b) { return a + b; }, 0);
      for (j = 0; j < 10; j++) {
        var v = cm[i][j], frac = rs ? v / rs : 0, fill;
        if (i === j) fill = v ? mix(pa, ol, 0.15 + 0.7 * frac) : C.surface;
        else fill = v ? mix(pa, te, Math.min(1, 0.3 + 0.12 * v)) : C.surface;
        D.rect(ctx, x0 + j * cs, y0 + i * cs, cs, cs, fill, C.line, 1);
        if (v) D.text(ctx, S.pct ? String(Math.round(100 * frac)) : String(v), x0 + j * cs + cs / 2, y0 + i * cs + cs / 2 + 4, { size: cs > 26 ? 11 : 9.5, mono: true, align: "center", weight: i === j ? 700 : 400, color: C.ink });
      }
    }
    D.rect(ctx, x0, y0 + S.r * cs, 10 * cs, cs, null, C.cobalto, 1.6);
    D.rect(ctx, x0 + S.c * cs, y0, cs, 10 * cs, null, C.cobalto, 1.6);
    D.rect(ctx, x0 + S.c * cs, y0 + S.r * cs, cs, cs, null, C.ink, 2.6);
  });
  function update() {
    var ep = EPS[S.e], cm = matrix(ep), tr = 0, tot = 0, i, j;
    for (i = 0; i < 10; i++) for (j = 0; j < 10; j++) { tot += cm[i][j]; if (i === j) tr += cm[i][j]; }
    var k = S.r, tp = cm[k][k], rs = 0, cs = 0;
    for (j = 0; j < 10; j++) rs += cm[k][j]; for (i = 0; i < 10; i++) cs += cm[i][k];
    var fn = rs - tp, fp = cs - tp, prec = cs ? tp / cs : 0, rec = rs ? tp / rs : 0;
    out.set("Época <b>" + ep + "</b> · diagonal = " + tr + " de " + tot + " → exactitud (accuracy) = <b>" + (tr / tot).toFixed(4) + "</b><br>" +
      "Celda marcada: real <b>" + S.r + "</b> → predicho <b>" + S.c + "</b>: <b>" + cm[S.r][S.c] + "</b> imágenes" + (S.r === S.c ? " (acierto)" : " (error)") + "<br>" +
      "Clase " + k + ": TP = " + tp + ", FN = " + fn + " (resto de su fila), FP = " + fp + " (resto de su columna)<br>" +
      "recall = " + tp + "/" + rs + " = <b>" + rec.toFixed(3) + "</b> · precisión = " + tp + "/" + cs + " = <b>" + (cs ? prec.toFixed(3) : "—") + "</b>");
    view.redraw();
  }
  update();
});

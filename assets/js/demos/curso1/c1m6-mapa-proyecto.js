/* Experimento: el flujo de un proyecto de ML como mapa clicable que enlaza cada etapa con el módulo donde se explica. */
Lab.register("curso1/c1m6-mapa-proyecto", function (root, api) {
  var M = api.math;
  var ST = [
    { t: "Problema de negocio → target", mod: "M1", links: [[1, "tipos de problema y ciclo de vida"]], sec: "negocio-a-ml",
      txt: "«Retener clientes» se convierte en una pregunta que un modelo pueda responder: <b>¿cancelará el próximo mes?</b> El target es <code>Cancelado</code> (0/1) y el problema es de clasificación. En el proyecto de lluvia: <code>RainToday</code>." },
    { t: "Datos y limpieza", mod: "M1", links: [[1, "NaN, outliers, Pandas"]], sec: "streamflix-datos",
      txt: "StreamFlix: 5.000 usuarios con 164 edades y 148 valores de <code>HorasMes</code> sin rellenar. Lluvia: al hacer <code>dropna()</code> se pierde el 21 % de las filas." },
    { t: "Features y preprocesado", mod: "M1", links: [[1, "escalado, One-Hot, feature engineering"], [5, "Pipelines sin fugas"]], sec: "preparacion",
      txt: "Imputar con la mediana, escalar las numéricas, One-Hot en <code>Plan</code> y <code>Dispositivo</code> (17 columnas finales). En lluvia, <code>Date</code> se convierte en <code>Season</code>." },
    { t: "Reparto train/test y fuga", mod: "M5", links: [[5, "train/test, data leakage"], [1, "generalización"]], sec: "lluvia-fuga",
      txt: "<code>train_test_split(..., stratify=y)</code> y, sobre todo, preguntarse <b>qué columnas existen el día en que hay que predecir</b>. Una sola columna filtrada da un 100 % falso." },
    { t: "Baseline", mod: "M5", links: [[5, "métricas con clases desequilibradas"]], sec: "lluvia-balance",
      txt: "«Siempre No llueve» acierta el 75,9 %; «nadie cancela», el 72,2 %. Cualquier modelo tiene que ganar a eso, y en la métrica que importa." },
    { t: "Modelos", mod: "M2 · M3", links: [[2, "regresión lineal y logística"], [3, "KNN, árboles, Random Forest"]], sec: "clasificacion",
      txt: "Regresión logística, KNN y Random Forest para clasificar; regresión lineal y Random Forest Regressor para predecir horas." },
    { t: "Ajuste y validación cruzada", mod: "M5", links: [[5, "GridSearchCV, cross-validation, regularización"]], sec: "clasificacion",
      txt: "<code>GridSearchCV</code> con <code>StratifiedKFold</code>: 5 combinaciones de C, 4 de k y 12 de Random Forest, todas medidas solo con el train." },
    { t: "Evaluación", mod: "M5 · M2", links: [[5, "matriz de confusión, precision, recall, F1, ROC-AUC"], [2, "MAE, MSE, RMSE, R²"]], sec: "clasificacion",
      txt: "Matriz de confusión (TN, FP, FN, TP), precision, recall, ROC-AUC en clasificación; MAE, RMSE y R² en regresión. Siempre sobre el test, una sola vez." },
    { t: "Decisión: umbral y euros", mod: "M5 · M6", links: [[5, "precision y recall"]], sec: "umbral",
      txt: "Un falso positivo cuesta un descuento (15 €) y un falso negativo un cliente perdido (60 €). El umbral sale de esa proporción: 0,20, no 0,50." },
    { t: "Aprendizaje sin target", mod: "M4", links: [[4, "K-Means, DBSCAN, PCA, t-SNE"]], sec: "clustering",
      txt: "Clusters (K-Means, K = 4), anomalías (DBSCAN) y mapas en 2 dimensiones (PCA, t-SNE): entender a los usuarios sin necesitar ninguna etiqueta." },
    { t: "Recomendación", mod: "M1 · M3", links: [[1, "content-based, colaborativo, híbrido"], [3, "KNN"]], sec: "recomendador",
      txt: "Usuarios parecidos (vecinos más cercanos con distancia coseno) recomiendan lo que han visto: acierta el 70,7 % frente al 50,4 % de «lo más popular»." },
    { t: "Producción y vigilancia", mod: "M1", links: [[1, "ciclo de vida de un modelo"]], sec: "produccion",
      txt: "Desplegar, monitorizar, detectar deriva (drift) y reentrenar: el modelo empieza a envejecer el día que sale a producción." }
  ];
  var sel = 0;
  var ROWH = 34, TOP = 8;
  var view = api.view(root, { aspect: 0.9, minH: ST.length * ROWH + TOP * 2, maxH: ST.length * ROWH + TOP * 2, drag: false, label: "Mapa de doce etapas de un proyecto de Machine Learning; cada etapa indica el módulo donde se explica" });
  view.canvas.style.touchAction = "pan-y"; view.canvas.style.cursor = "pointer";
  var out = api.readout(root);
  var ui = api.controls(root);
  ui.button("◀ Etapa anterior", function () { sel = (sel + ST.length - 1) % ST.length; update(); });
  ui.button("Etapa siguiente ▶", function () { sel = (sel + 1) % ST.length; update(); }, "primary");

  function chipColor(C, mod) {
    if (mod.indexOf("M6") === 0) return C.marker;
    return { M1: C.cobalto, M2: C.terracota, M3: C.oliva, M4: C.cobalto, M5: C.terracota }[mod.slice(0, 2)] || C.muted;
  }
  function draw(ctx, w, h, C) {
    var D = api.d, narrow = w < 480, x0 = 16, cx = x0 + 11, i;
    for (i = 0; i < ST.length; i++) {
      var y = TOP + i * ROWH + ROWH / 2, on = i === sel;
      if (i < ST.length - 1) D.line(ctx, cx, y + 11, cx, y + ROWH - 11, C.line, 2);
      var rx = x0 + 30, rw = w - rx - 10;
      ctx.save();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(rx, y - 14, rw, 28, 7) : ctx.rect(rx, y - 14, rw, 28);
      ctx.fillStyle = on ? C.cobaltoWash : C.surface; ctx.fill();
      ctx.lineWidth = on ? 2.2 : 1; ctx.strokeStyle = on ? C.cobalto : C.line; ctx.stroke();
      ctx.restore();
      D.circle(ctx, cx, y, 11, on ? C.cobalto : C.paper, on ? C.cobalto : C.muted, 1.6);
      D.text(ctx, String(i + 1), cx, y + 4, { size: 11.5, align: "center", weight: 700, color: on ? C.paper : C.ink2 });
      D.text(ctx, ST[i].t, rx + 10, y + 4.5, { size: narrow ? 12 : 13.5, weight: on ? 600 : 500, color: C.ink });
      var chip = ST[i].mod, cw = chip.length * 7.2 + 14, chx = rx + rw - cw - 6;
      D.rect(ctx, chx, y - 9, cw, 18, chipColor(C, chip));
      D.text(ctx, chip, chx + cw / 2, y + 4, { size: 11, align: "center", weight: 700, color: C.paper });
    }
  }
  function update() {
    view.redraw();
    var s = ST[sel], l = s.links.map(function (q) { return "<a href='modulo-" + q[0] + ".html'>Módulo " + q[0] + "</a> (" + q[1] + ")"; }).join(" · ");
    out.set("<b>Etapa " + (sel + 1) + ": " + s.t + "</b><br>" + s.txt + "<br><span class='good'>Dónde se explica a fondo:</span> " + l + " · <a href='#" + s.sec + "'>en este módulo ↓</a>");
  }
  view.canvas.addEventListener("click", function (e) {
    var r = view.canvas.getBoundingClientRect(), py = (e.clientY - r.top) * (view.h / r.height);
    var i = Math.floor((py - TOP) / ROWH);
    if (i >= 0 && i < ST.length) { sel = i; update(); }
  });
  view.draw(draw); update();
});

/* Experimento: "qué hago ante un problema nuevo". Respondes tres preguntas (tipo de datos, cuántas etiquetas tienes, qué predices) y
   se arma la receta con un orden de trabajo, la métrica adecuada, lo primero que probar y los errores que más se cometen en ese caso.
   Puedes ir marcando cada paso: la barra de progreso te dice cuánto del proyecto llevas. Es un conjunto de reglas (no un modelo). */
Lab.register("curso3/c3m7-checklist", function (root, api) {
  var S = { data: "tabla", labels: "medio", target: "numero" };
  var done = {};
  var ui = api.controls(root);
  var box = document.createElement("div");
  box.style.cssText = "margin-top:10px;font-size:0.95em;line-height:1.5";

  function sel(label, key, opts) { ui.select({ label: label, options: opts, value: S[key], onChange: function (v) { S[key] = v; render(); } }); }
  sel("Tipo de datos", "data", [["tabla", "Tabla (una ficha por película)"], ["imagen", "Imágenes (carátulas)"], ["serie", "Serie temporal (visionado día a día)"], ["texto", "Texto (reseñas)"]]);
  sel("Datos etiquetados", "labels", [["pocos", "Pocos (menos de 1.000)"], ["medio", "Bastantes (1.000 a 50.000)"], ["muchos", "Muchísimos (más de 50.000)"]]);
  sel("Qué quieres predecir", "target", [["numero", "Un número (regresión)"], ["clase", "Una categoría (clasificación)"]]);
  ui.button("Desmarcar todo", function () { done = {}; render(); });
  root.appendChild(box);

  function metric() {
    return S.target === "numero" ? "MAE (error medio en las unidades reales), RMSE y R² frente al baseline de la media" : "exactitud solo si las clases están equilibradas; si no, matriz de confusión, precisión, exhaustividad y F1";
  }
  function specifics() {
    var d = S.data, l = S.labels, s = [], notes = [];
    if (d === "tabla") {
      s.push("Baselines: predecir la media (o la clase mayoritaria), regresión lineal/logística y random forest. Son rápidos y te dicen cuánto hay que ganar.");
      if (l === "pocos") { s.push("Con tan pocos datos, valida con validación cruzada (un solo reparto es ruido) y espera que <b>la red no gane</b> a los modelos clásicos, como en load_diabetes."); notes.push("Una red grande con pocas filas memoriza el ruido, como quien se sabe de memoria las pocas películas que ha visto sin entender sus gustos."); }
      else { s.push("Red en API funcional: Dense + BatchNormalization + Dropout + L2, EarlyStopping y ReduceLROnPlateau. Compárala con 3-5 semillas, no con una."); s.push("Keras Tuner (RandomSearch) sobre neuronas, dropout, L2 y learning rate."); }
      notes.push("Escalado, imputación y one-hot se ajustan solo con el train (ColumnTransformer dentro de un flujo).");
    } else if (d === "imagen") {
      if (l === "pocos") { s.push("Transfer learning en dos fases: base preentrenada congelada + cabeza nueva (lr 1e-3), después descongelar las últimas capas con lr 1e-5 a 1e-4."); s.push("Data augmentation moderada: rotaciones, zoom y desplazamientos que conserven la etiqueta."); notes.push("Entrenar una CNN desde cero con tan pocas imágenes casi siempre pierde."); }
      else if (l === "medio") { s.push("Transfer learning con fine-tuning de varios bloques y data augmentation; compara con una CNN pequeña propia."); }
      else { s.push("Con muchos datos puedes afinar casi toda la red o incluso entrenar desde cero si tus imágenes se parecen poco a ImageNet (rayos X, microscopio). Usa tf.data con prefetch."); }
      notes.push("Usa el preprocesado que espera la base (preprocess_input) y llama a la base con training=False.");
      notes.push("Revisa que el aumento no cambie la etiqueta (voltear una carátula con el título impreso lo deja ilegible).");
    } else if (d === "serie") {
      s.push("Baselines de verdad: «repite el último valor» y la media móvil. Una red que no los supera no sirve.");
      s.push("Ventanas deslizantes (timeseries_dataset_from_array) y modelo lineal/random forest con retardos; después LSTM o Transformer (módulo 3) si hay patrón que lo justifique.");
      notes.push("<b>Reparte por el tiempo</b> (pasado para entrenar, futuro para validar y probar), nunca al azar: barajar filtra el futuro al entrenamiento.");
    } else {
      s.push("Baseline: TF-IDF + regresión logística (minutos de trabajo y sorprendentemente fuerte).");
      s.push(l === "pocos" ? "Reutiliza un modelo preentrenado (embeddings o un Transformer) y entrena solo una cabeza pequeña." : "Ajusta (fine-tuning) un Transformer preentrenado; entrenar uno desde cero necesita muchísimos más datos.");
      notes.push("Fija el vocabulario/tokenizador con el train y reutilízalo tal cual para val, test y producción.");
    }
    if (S.target === "clase") notes.push("Mira el reparto de clases: si solo el 5 % de los usuarios cancela la suscripción, «nadie cancela» ya acierta el 95 %.");
    return { steps: s, notes: notes };
  }
  function steps() {
    var sp = specifics();
    return [].concat(
      ["Defino qué decisión se toma con la predicción (p. ej. «¿qué película recomiendo?»), la métrica de éxito (" + metric() + ") y el coste de equivocarse."],
      ["Separo train / validación / test <b>antes</b> de mirar o transformar nada, y guardo el test sin tocar."],
      sp.steps.slice(0, 1),
      ["Monto el preprocesado como parte del flujo (sin fugas) y miro los datos: huecos, rangos, desbalance, duplicados."],
      sp.steps.slice(1),
      ["Entreno con curvas de aprendizaje a la vista y callbacks (EarlyStopping, ReduceLROnPlateau, ModelCheckpoint)."],
      ["Ajusto lo que tenga sentido (Keras Tuner o a mano), eligiendo siempre con la validación."],
      ["Comparo con los baselines <b>con honestidad</b>: varias semillas, mismas particiones, misma métrica."],
      ["Evalúo en el test <b>una sola vez</b> con el modelo ya elegido."],
      ["Analizo los errores: matriz de confusión, errores por grupos, los peores casos uno a uno."],
      ["Guardo el modelo (.keras), lo vuelvo a cargar y compruebo que predice igual; escribo una función predecir() con el mismo preprocesado."],
      ["Documento qué hice y vigilo el modelo en uso: los datos cambian y el modelo se degrada."]
    );
  }
  function render() {
    var st = steps(), sp = specifics(), n = 0, i;
    st.forEach(function (t) { if (done[t]) n++; });
    var html = "<div style='border:1px solid var(--line);background:var(--surface);padding:10px 12px;border-radius:6px'>" +
      "<div style='font-weight:700;margin-bottom:6px'>Receta recomendada · " + n + " de " + st.length + " pasos hechos</div>" +
      "<div style='height:8px;border:1px solid var(--ink);background:var(--paper);margin-bottom:10px'><div style='height:100%;width:" + Math.round(100 * n / st.length) + "%;background:var(--oliva)'></div></div>" +
      "<ol style='list-style:none;margin:0;padding:0'>";
    st.forEach(function (t, k) {
      html += "<li style='display:flex;gap:8px;align-items:flex-start;padding:3px 0'><input type='checkbox' data-k='" + k + "' " + (done[t] ? "checked" : "") + " style='margin-top:5px;flex:none' aria-label='Paso " + (k + 1) + "'>" +
        "<span style='" + (done[t] ? "opacity:.55;text-decoration:line-through" : "") + "'><b>" + (k + 1) + ".</b> " + t + "</span></li>";
    });
    html += "</ol>";
    if (sp.notes.length) html += "<div style='margin-top:10px;padding-top:8px;border-top:1px dashed var(--line)'><b>Ojo con esto en tu caso:</b><ul style='margin:4px 0 0 18px;padding:0'>" + sp.notes.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul></div>";
    html += "</div>";
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll("input[type=checkbox]"), function (cb) {
      cb.addEventListener("change", function () { done[st[+cb.getAttribute("data-k")]] = cb.checked; render(); });
    });
  }
  render();
});

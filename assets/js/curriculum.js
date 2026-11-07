/* =====================================================================
   CURRICULUM — única fuente de verdad del temario.
   La barra lateral, la portada, los índices de curso y la navegación
   anterior/siguiente se generan a partir de este archivo.

   Para añadir un curso nuevo:
   1. Añade un objeto en `courses` (id, slug, title, blurb, modules).
   2. Crea la carpeta `curso-N/` con index.html y modulo-1.html, ...
      (copia docs/plantilla-modulo.html).
   3. Quita el curso de `upcoming`.
   ===================================================================== */
window.CURRICULUM = {
  site: {
    name: "Cuaderno de IA",
    tagline: "IBM AI Engineering, explicado desde cero",
    author: "David"
  },

  courses: [
    {
      id: 1,
      slug: "curso-1",
      title: "Machine Learning con Python",
      short: "Machine Learning",
      blurb: "Qué es aprender de datos y cómo se hace de verdad: regresión, clasificación, agrupación, evaluación honesta de modelos y un proyecto completo con scikit-learn.",
      modules: [
        {
          n: 1, slug: "modulo-1",
          title: "Introducción al Machine Learning y preparación de datos",
          summary: "Qué significa que un ordenador «aprenda», qué piezas tiene todo problema de ML y cómo dejar los datos listos para un modelo.",
          tags: ["IA · ML · DL", "Features y target", "Ciclo de vida", "Pandas", "NaN y outliers", "Escalado", "One-Hot", "Generalización"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Aprender es probar reglas y quedarse con la que menos falla", "blurb": "Programar es escribir la regla; aprender es dejar que salga de los ejemplos.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "X es lo que el modelo sabe; y, lo que debe adivinar", "blurb": "IA ⊃ ML ⊃ DL, y las piezas de cualquier problema: features, target, modelo, parámetros.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Supervisado o no: todo depende de si tienes la respuesta", "blurb": "Los cuatro tipos de aprendizaje y por qué la misma película admite dos preguntas distintas.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Ocho preguntas, ocho técnicas: lo raro, el orden y lo que va junto", "blurb": "Cada técnica responde a una pregunta distinta; la anomalía y el orden, con números.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Un proyecto es una película de trece escenas, y el modelo es la más corta", "blurb": "Las trece escenas del ciclo de vida con StreamFlix: del problema a la deriva.", "min": 4},
            {"n": 6, "slug": "leccion-6", "title": "No entrenes tu propio LLM: adáptalo con prompts, RAG y PEFT", "blurb": "Ciencia de Datos vs Ingeniería de IA, del predictivo al prescriptivo, RAG y las herramientas.", "min": 4},
            {"n": 7, "slug": "leccion-7", "title": "Los datos nunca llegan limpios: huecos, extremos, escalas y texto", "blurb": "NaN, outliers, StandardScaler y One-Hot: dejar la tabla lista para el modelo.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "La meta es generalizar: acertar con datos que el modelo nunca vio", "blurb": "Train/test, overfitting y el flujo de scikit-learn: crear → fit → predict → evaluar.", "min": 4}
          ]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Regresión lineal y logística",
          summary: "Predecir números con una recta (y con curvas) y predecir categorías con probabilidades. Aprender = bajar una montaña llamada «coste».",
          tags: ["Regresión simple", "Múltiple", "Polinómica", "MAE · MSE · RMSE · R²", "Sigmoide", "Gradient Descent", "SGD"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Predecir un número es trazar una recta: cuota fija más tanto por unidad", "blurb": "Qué es una regresión, X e y, y cómo se lee ŷ = θ₀ + θ₁x con cinco películas.", "min": 4},
            {"n": 2, "slug": "leccion-2", "title": "La mejor recta es la que menos se equivoca… al cuadrado", "blurb": "Residuos, por qué al cuadrado, el MSE como función de coste y la fórmula OLS a mano; el peligro de los outliers.", "min": 4},
            {"n": 3, "slug": "leccion-3", "title": "R² no es un porcentaje de aciertos: compara tu recta con «predecir siempre la media»", "blurb": "MAE, MSE, RMSE y R² con cinco películas; por qué R² no es accuracy y se mide en test.", "min": 4},
            {"n": 4, "slug": "leccion-4", "title": "Cada peso se lee «manteniendo lo demás constante»", "blurb": "Varias variables, un peso cada una: cómo leerlos, colinealidad, One-Hot sin trampa y el exceso de variables.", "min": 4},
            {"n": 5, "slug": "leccion-5", "title": "Una curva también es regresión lineal: inventa columnas (x², ln x, seno)", "blurb": "Polinómica, exponencial, logarítmica y periódica con columnas nuevas; el grado y el sobreajuste.", "min": 4},
            {"n": 6, "slug": "leccion-6", "title": "La sigmoide aplasta cualquier puntuación entre 0 y 1: eso es una probabilidad", "blurb": "Por qué una recta falla para clasificar, la sigmoide, la probabilidad a mano, el umbral y la frontera.", "min": 4},
            {"n": 7, "slug": "leccion-7", "title": "Entrenar es bajar una montaña con niebla: coste, gradiente y learning rate", "blurb": "Las cuatro piezas, el log-loss, gradient descent a mano, learning rate y convergencia.", "min": 4},
            {"n": 8, "slug": "leccion-8", "title": "SGD: un paso por película en vez de uno por catálogo", "blurb": "Batch, SGD y mini-batch; fórmula exacta o gradient descent; y el código completo de los laboratorios de IBM.", "min": 3}
          ]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Modelos de clasificación y ensembles",
          summary: "Árboles, vecinos, márgenes, probabilidades y comités de modelos: cómo piensa cada algoritmo y cuándo conviene cada uno.",
          tags: ["Árboles", "KNN", "SVM", "Naive Bayes", "Bias–Variance", "Random Forest", "Boosting", "XGBoost"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Un árbol elige la pregunta que más desorden quita", "blurb": "Las cinco formas de decidir y la primera: Gini, entropía y ganancia de información.", "min": 4},
            {"n": 2, "slug": "leccion-2", "title": "Un árbol sin límites se aprende las películas de memoria", "blurb": "Profundidad y sobreajuste, árboles de regresión (una media por hoja) e importancias.", "min": 4},
            {"n": 3, "slug": "leccion-3", "title": "KNN copia la respuesta de los vecinos, y K decide cuántos votan", "blurb": "Distancia euclídea, elegir K y por qué hay que escalar antes de medir.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "La SVM elige la calle más ancha entre dos grupos", "blurb": "Margen, vectores de soporte, C, kernel RBF y gamma; One-vs-Rest y One-vs-One.", "min": 4},
            {"n": 5, "slug": "leccion-5", "title": "Naive Bayes cuenta palabras y les da la vuelta con Bayes", "blurb": "Reseñas positivas o negativas: prior, verosimilitud, independencia y Laplace.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Un modelo falla por terco (sesgo) o por nervioso (varianza)", "blurb": "Error = sesgo² + varianza + ruido, y cómo diagnosticarlo con train y test.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Cien árboles distintos votan mejor que uno", "blurb": "Comités, voting, bootstrap, bagging, OOB y Random Forest.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "El boosting encadena árboles que corrigen al anterior", "blurb": "AdaBoost, Gradient Boosting, XGBoost y cómo elegir algoritmo midiendo.", "min": 4}
          ]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Aprendizaje no supervisado",
          summary: "Encontrar estructura en datos sin respuestas: grupos, anomalías y mapas con menos dimensiones.",
          tags: ["K-Means", "Jerárquico", "DBSCAN", "HDBSCAN", "PCA", "t-SNE", "UMAP"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Sin respuestas, lo único que puede mirar el modelo es qué se parece a qué", "blurb": "Sin columna respuesta, el modelo solo puede medir qué está cerca de qué: la distancia y las cuatro tareas.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "La confianza engaña; el lift dice si la pareja es real", "blurb": "Soporte, confianza y lift con 10 usuarios: Toy Story ⇒ Shrek sí, Toy Story ⇒ Stranger Things no.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Para recomendar, pregunta a las personas que se parecen a ti", "blurb": "NearestNeighbors: tus 3 vecinos más parecidos votan Interstellar.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "K-Means: asignar al centroide más cercano, moverlo a la media, repetir", "blurb": "Asignar, mover a la media, repetir: seis películas, la inercia que nunca sube y k-means++.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Sin respuestas correctas, un buen grupo es compacto y está lejos de los demás", "blurb": "Silhouette, Davies–Bouldin y el codo de la inercia para elegir cuántos tipos de espectador hay.", "min": 4},
            {"n": 6, "slug": "leccion-6", "title": "El dendrograma guarda todas las K a la vez: tú decides dónde cortar", "blurb": "Clustering jerárquico: fusionar lo más cercano, los cuatro enlaces y dónde cortar el árbol.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Un grupo es una zona densa; lo que no cabe en ninguna es ruido (o una anomalía)", "blurb": "DBSCAN (núcleo, borde, ruido), HDBSCAN para densidades distintas e Isolation Forest y LOF para lo raro.", "min": 4},
            {"n": 8, "slug": "leccion-8", "title": "Menos columnas sin perder lo esencial: PCA conserva la varianza, t-SNE y UMAP conservan a los vecinos", "blurb": "La maldición de la dimensionalidad, PCA a mano, t-SNE y UMAP, y el no supervisado dentro de un proyecto.", "min": 4}
          ]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Evaluar y validar modelos",
          summary: "Cómo saber si un modelo funciona de verdad: separar datos, métricas que no engañan, validación cruzada, regularización y fugas de datos.",
          tags: ["Train/Test", "Matriz de confusión", "Precision · Recall · F1", "ROC-AUC", "Cross-validation", "Ridge · Lasso", "Data leakage", "GridSearchCV"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Al modelo se le examina con datos que no ha visto, y el test se mira una sola vez", "blurb": "Train, validación y test; por qué mirar el test muchas veces infla la nota (data snooping) y para qué sirve stratify.", "min": 4},
            {"n": 2, "slug": "leccion-2", "title": "Un «sí o no» tiene cuatro resultados: la matriz de confusión", "blurb": "TP, TN, FP y FN con el recomendador de películas; por qué los dos errores nunca pesan igual.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "El accuracy engaña cuando una clase es rara: mira precision, recall y F1", "blurb": "Un modelo que nunca detecta ningún éxito acierta el 95 %; precision, recall y F1 lo delatan.", "min": 4},
            {"n": 4, "slug": "leccion-4", "title": "El umbral reparte los errores; la curva ROC los enseña todos a la vez", "blurb": "predict_proba y el umbral que menos cuesta en euros; la ROC en escalera con 10 películas y qué significa el AUC.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Una sola nota es una lotería: la validación cruzada repite el examen K veces", "blurb": "K-Fold paso a paso, leer «media ± desviación» y cuándo usar StratifiedKFold, GroupKFold o TimeSeriesSplit.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Ridge y Lasso cobran un impuesto a los pesos para que el modelo no memorice", "blurb": "Medir el error de una regresión (MAE, RMSE, R²) y frenar el sobreajuste: Ridge encoge, Lasso anula, alpha se elige con validación cruzada.", "min": 4},
            {"n": 7, "slug": "leccion-7", "title": "La fuga de datos no da error: fit solo con train, y un Pipeline lo garantiza", "blurb": "Las cuatro fugas (target, preprocesado, tiempo, duplicados), el escalador con números, y Pipeline + ColumnTransformer como defensa.", "min": 4},
            {"n": 8, "slug": "leccion-8", "title": "Los hiperparámetros se eligen con validación cruzada, nunca con el test: el flujo completo", "blurb": "GridSearchCV frente a RandomizedSearchCV, curvas de validación y de aprendizaje para diagnosticar, guardar el pipeline y la secuencia completa del módulo.", "min": 4}
          ]
        },
        {
          n: 6, slug: "modulo-6",
          title: "Proyecto final: de los datos a la decisión",
          summary: "Todo el curso en un único flujo: el proyecto de lluvia en Australia y un caso completo de plataforma de streaming con clasificación, regresión, clusters y recomendación.",
          tags: ["Pipeline", "ColumnTransformer", "GridSearchCV", "Matriz de confusión", "Feature importance", "StreamFlix"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "«Retener clientes» no es un problema de ML hasta que lo traduces", "blurb": "Antes del código: decisión, target, datos del momento de decidir y coste de cada error.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Si el dato aún no existe el día de predecir, es un spoiler", "blurb": "La fuga temporal: una columna del futuro da notas de 10 en el laboratorio y falla en la vida real.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Un 84 % de aciertos no vale nada hasta compararlo con el modelo tonto", "blurb": "El baseline y la trampa del accuracy: con clases desequilibradas, predecir siempre «no» ya acierta mucho.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Primero se reparte, después se prepara: el Pipeline lo garantiza", "blurb": "Imputar, escalar y One-Hot aprenden de los datos: que lo aprendan solo del train, dentro de un Pipeline.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "El umbral no es 0,5: lo deciden los euros", "blurb": "El modelo da una probabilidad; el umbral sale del coste de cada error: 15 / (15 + 60) = 0,20.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Una media esconde dónde falla el modelo", "blurb": "MAE, RMSE y R² frente a un baseline, y partir los errores por grupos para ver lo que la media esconde.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Sin etiquetas, el algoritmo agrupa y tú pones el nombre", "blurb": "K-Means, DBSCAN, PCA, t-SNE y un recomendador por vecinos: todo es medir parecidos entre usuarios.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "El modelo empieza a envejecer el día que sale", "blurb": "En producción el mundo cambia: vigila entradas, salidas y euros, porque el ROC-AUC puede no enterarse.", "min": 3}
          ]
        }
      ]
    },

    {
      id: 2,
      slug: "curso-2",
      title: "Introducción al Deep Learning y redes neuronales con Keras",
      short: "Deep Learning con Keras",
      blurb: "Cómo funciona una red neuronal por dentro, cómo aprende y cómo se construye con Keras: redes densas, CNN, RNN, Transformers, autoencoders y modelos preentrenados.",
      modules: [
        {
          n: 1, slug: "modulo-1",
          title: "Neuronas y cómo aprende una red",
          summary: "De la neurona artificial al entrenamiento completo: pesos, bias, activaciones, pérdida, backpropagation, Adam y por qué los gradientes se desvanecen.",
          tags: ["Neurona", "Pesos y bias", "ReLU · Sigmoide · Softmax", "Forward", "Loss", "Backpropagation", "Adam", "Vanishing gradient"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Una neurona suma razones con pesos y luego decide", "blurb": "Entradas, pesos, bias, suma ponderada y activación: la cuenta de «¿pongo esta peli?».", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Sin una curva, cien capas valen lo mismo que una", "blurb": "Por qué la activación tiene que ser no lineal (XOR) y qué activación elegir.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Una red es la misma cuenta repetida capa a capa", "blurb": "Capas densas, cuántos parámetros tiene una red y el forward pass a mano de la red 2-2-1.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Softmax reparte el 100 % y la pérdida pone la nota", "blurb": "Softmax para varias clases y las pérdidas MSE y entropía cruzada: cuánto se equivoca la red.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Aprender es bajar la cuesta a pasos pequeños", "blurb": "Derivadas, regla de la cadena, gradient descent y el learning rate.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Backpropagation reparte la culpa hacia atrás, batch a batch", "blurb": "Backpropagation en la red 2-2-1, una iteración completa, y época, batch e iteración.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Cómo dar el paso: optimizadores y gradientes que se apagan", "blurb": "SGD, Momentum, RMSprop y Adam, y por qué el gradiente se desvanece o explota en redes profundas.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "El tamaño justo: capacidad para aprender, frenos para no memorizar", "blurb": "Aproximación universal, neuronas ReLU como bisagras, y L2, dropout y early stopping contra el sobreajuste.", "min": 3}
          ]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Keras: regresión y clasificación con redes densas",
          summary: "TensorFlow, PyTorch y Keras. Construir, compilar, entrenar y usar una red con Sequential para predecir números y categorías.",
          tags: ["TensorFlow · PyTorch · Keras", "Sequential · Dense", "compile · fit · predict", "One-Hot", "Crossentropy", "Shallow vs Deep"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Keras es el mando a distancia: cinco pasos y solo fit aprende", "blurb": "TensorFlow hace el trabajo pesado; Keras te da cinco botones, y solo fit cambia los pesos.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Un lote es un puñado de valoraciones; una época, repasarlas todas", "blurb": "Forma de los datos, batch, step y epoch: cuántas veces se corrigen los pesos.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Una capa Dense es una tabla de pesos más un bias, y se cuenta a mano", "blurb": "Sequential, Input y Dense: pesos, bias y parámetros contados a mano (4→8→8→3 = 139).", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "La pérdida enseña y la métrica informa: compile, fit y las curvas", "blurb": "Optimizador, pérdida y métricas; fit, History, evaluate y predict.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Para predecir un número, la última neurona va sin activación", "blurb": "Regresión: Dense(1) sin activación, MSE, ReLU y entradas normalizadas.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Clasificar es repartir probabilidad: sigmoide para sí o no, softmax para varias clases", "blurb": "Sigmoide + binary crossentropy; softmax + One-Hot o enteros + crossentropy.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Para una red densa, una imagen es una lista de 64 números entre 0 y 1", "blurb": "Dígitos: aplanar, normalizar, 64 → 64 → 10 y argmax.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "El tamaño justo: capas para lo difícil y parar antes de memorizar", "blurb": "Profundidad a igual tamaño, EarlyStopping, guardar el modelo y errores típicos.", "min": 3}
          ]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Redes convolucionales (CNN)",
          summary: "Cómo una red «ve» imágenes: filtros, stride, mapas de características, pooling y las cuentas de tamaños que hay que saber hacer.",
          tags: ["Imagen RGB", "Filtros", "Stride", "Feature maps", "Max Pooling", "Flatten", "Conv2D"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Una imagen es una pila de tablas de números, y la red densa se ahoga con ella", "blurb": "Píxeles, canales RGB y formas (N, alto, ancho, canales); por qué una Dense no sirve y qué arregla la lupa que se desliza.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Convolucionar es multiplicar, sumar y deslizar", "blurb": "La convolución a mano sobre el fotograma de la sala de cine: un filtro de 9 números encuentra el borde de la pantalla.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Cada filtro busca un patrón, la red lo aprende y ReLU se queda con lo que encaja", "blurb": "Desenfoque, nitidez y bordes con 9 números; quién decide los pesos y por qué va ReLU detrás de cada convolución.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Un filtro mira todos los canales a la vez, y sus parámetros no dependen del tamaño", "blurb": "Filtros 3×3×3, varios filtros = varios canales de salida, y la fórmula (f·f·C_in + 1)·F frente a una Dense.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "El tamaño de salida sale de una fórmula: ⌊(n + 2p − f)/s⌋ + 1", "blurb": "Stride (cuánto salta la ventana), padding (el marco de ceros), valid frente a same y la cuenta que sale en todos los exámenes.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Apilando capas la red ve más imagen, y el pooling la resume", "blurb": "Mapas de características, de bordes a objetos, el campo receptivo y el max/average pooling, que no tiene pesos.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Flatten y Dense deciden, y las formas se cuentan capa a capa", "blurb": "Flatten no aprende, softmax decide el género, la arquitectura típica y la CNN de las notas: de 100×100×3 a 1 698 291 parámetros.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Una CNN se entrena como cualquier red, y por dentro se ven los bordes", "blurb": "El mismo ciclo de siempre, el gradiente de un peso compartido, overfitting, una CNN real por dentro, Conv2D en Keras 3 y los errores típicos.", "min": 3}
          ]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Secuencias y atención: RNN, LSTM y Transformers",
          summary: "Datos donde el orden importa: memoria recurrente, LSTM y la idea que cambió la IA: la atención.",
          tags: ["RNN", "LSTM", "Tokens y embeddings", "Posición", "Self-attention", "Q · K · V", "GPT"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "El orden también es información", "blurb": "Qué es una secuencia, por qué una red densa no basta y cómo se cortan ventanas de una serie.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Una RNN es la misma neurona repetida, con un post-it de memoria", "blurb": "El estado oculto h, la fórmula de la RNN, los pesos compartidos y tres pasos a mano.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Lo que viste hace 50 capítulos casi no llega: el gradiente se desvanece", "blurb": "Backpropagation a través del tiempo y por qué factor^k apaga (o dispara) la señal del pasado.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "La LSTM decide qué recordar: tres puertas sobre una cinta", "blurb": "Celda c, puertas de olvido, entrada y salida, un paso a mano y por qué arregla el gradiente.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Un embedding da coordenadas a cada palabra (o película)", "blurb": "Tokens, ids y la tabla de embeddings; la similitud coseno con Toy Story, Shrek y Resacón.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "El Transformer no ve el orden: hay que sumárselo", "blurb": "Codificación posicional: embedding + posición, senos y cosenos como manecillas de reloj.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Atención: cada título de tu historial decide a quién mirar", "blurb": "Q, K y V, la softmax de las puntuaciones, √d_k, cabezas, máscara causal y el bloque Transformer.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "GPT solo predice la siguiente palabra (y tú eliges cuánto arriesga)", "blurb": "El bucle autorregresivo, la pérdida −ln p, temperatura, top-k y top-p, y cuándo usar cada familia.", "min": 3}
          ]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Autoencoders, modelos preentrenados y proyecto final",
          summary: "Comprimir y reconstruir datos, reutilizar el conocimiento de VGG16 con transfer learning y fine-tuning, y el proyecto de daños en aviones.",
          tags: ["Autoencoder", "Denoising", "VGG16", "Transfer learning", "Fine-tuning", "ImageDataGenerator", "BLIP"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Un autoencoder comprime y reconstruye, y el pasillo estrecho le obliga a resumir", "blurb": "Encoder, cuello de botella y decoder; fit(X, X) sin etiquetas y la carátula de 784 números resumida en 32.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Para quitar ruido basta con cambiar el objetivo: entra la imagen sucia y se pide la limpia", "blurb": "El denoising autoencoder: fit(ruidosa, limpia), ruido normal de 0,25 con clip y por qué el ruido no cabe en el pasillo.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "El autoencoder convolucional baja con pooling y sube con UpSampling, pero el detalle no vuelve", "blurb": "La arquitectura de las notas capa a capa: 28 → 14 → 7 → 14 → 28, padding same, 3.217 parámetros y un entrenamiento de 8 épocas.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Un autoencoder no lineal sigue curvas que PCA no puede, pero no siempre gana", "blurb": "Encoder y decoder por separado, autoencoder frente a PCA (0,0240 / 0,0242 / 0,0161), sus usos y en qué se diferencian las RBM.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Un preentrenado ya sabe ver: le quitas el clasificador y congelas lo demás", "blurb": "VGG16 e ImageNet, include_top=False y los 7×7×512 = 25.088 valores, y congelar con trainable=False: 13.108.737 entrenables de 27.823.425.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Con pocos datos, toca poco: tres escenarios y un learning rate diminuto", "blurb": "Feature extraction, transfer learning y fine-tuning; por qué Adam(1e-5), las trampas de trainable en Keras 3 y un experimento honesto.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "El proyecto empieza en carpetas: las fotos llegan a la red en lotes de 32", "blurb": "Dent o crack con VGG16: las 10 tareas, train/valid/test, ImageDataGenerator, flow_from_directory, batches y steps, y la cabeza con Dropout.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Un 90 % de acierto no basta: mira la brecha de las curvas y la matriz de confusión", "blurb": "compile y fit, loss frente a accuracy, curvas sanas o sobreajustadas, matriz de confusión y umbral, la parte 2 con BLIP y los errores típicos.", "min": 3}
          ]
        }
      ]
    },

    {
      id: 3,
      slug: "curso-3",
      title: "Deep Learning con Keras y TensorFlow",
      short: "Keras y TensorFlow avanzado",
      blurb: "El siguiente nivel: APIs funcional y de subclases, CNN avanzadas, Transformers, modelos generativos, bucles de entrenamiento propios, ajuste de hiperparámetros y aprendizaje por refuerzo.",
      modules: [
        {
          n: 1, slug: "modulo-1",
          title: "Funcionalidades avanzadas de Keras",
          summary: "Más allá de Sequential: la API funcional, la API de subclases, capas y modelos personalizados y los fundamentos de TensorFlow 2.x.",
          tags: ["Tensores", "API funcional", "Subclassing", "Capas personalizadas", "Modelos personalizados", "TensorFlow 2.x"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Un tensor es una tabla con forma, y el eje que nombras desaparece", "blurb": "Rango, forma y tipo; tf.constant frente a tf.Variable; reshape, sumar por ejes y matmul con los visionados de Ana y Luis.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Broadcasting: se alinea por la derecha y solo se estira el 1", "blurb": "Las dos reglas para sumar formas distintas, el sesgo de una Dense y el error silencioso que convierte (3, 1) − (3,) en (3, 3).", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "GradientTape graba la ida y rebobina la vuelta", "blurb": "Diferenciación automática con la neurona que predice capítulos: ∂L/∂w = −18, un paso de descenso y el bucle de entrenamiento en tres pasos.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "tf.function traza una vez por firma y reutiliza el grafo", "blurb": "Trazado, caché de grafos y retracing; print frente a tf.print; AutoGraph e input_signature, con la lista de reproducción como analogía.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Sequential es una fila; la API funcional, un grafo de capas", "blurb": "Sequential, funcional o subclassing; Input simbólico, capas como funciones, Add frente a Concatenate y el modelo con atajo de 467 parámetros.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "En un grafo funcional todo se suma: gradientes compartidos y pérdidas de varias salidas", "blurb": "Una capa compartida cuenta una vez y recibe la suma de dos gradientes; con dos salidas se minimiza la suma ponderada de pérdidas.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Subclassing: el modelo es un programa, y training cambia lo que hace", "blurb": "Capas en __init__, cálculo en call; el modelo «sin construir»; Dropout reescala ×2 y BatchNorm cambia el lote por las medias móviles.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Una capa propia crea sus pesos al ver los datos y se guarda como receta", "blurb": "__init__, build, call y get_config; .keras = receta + pesos; registrar la clase o custom_objects; Lambda y safe_mode; el proyecto de las dos lunas.", "min": 3}
          ]
        },
        {
          n: 2, slug: "modulo-2",
          title: "CNN avanzadas",
          summary: "Redes convolucionales para problemas reales: más datos con augmentation, transfer learning bien hecho y la convolución transpuesta.",
          tags: ["Arquitecturas CNN", "Data augmentation", "Transfer learning", "Convolución transpuesta"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Separar los pesos del filtro deja ver más sin pagar ni un parámetro", "blurb": "Tres formas de ampliar el campo receptivo y la nueva: la dilatación, con el tráiler, la fórmula k_ef = k + (k − 1)(d − 1) y dilation_rate.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "En las CNN clásicas casi todos los parámetros están en las capas densas del final", "blurb": "LeNet, AlexNet y VGG16 contadas a mano: las convoluciones son baratas en parámetros y la primera densa se lo lleva casi todo.", "min": 2},
            {"n": 3, "slug": "leccion-3", "title": "Un 1×1 y una convolución separable hacen el mismo trabajo con unas 9 veces menos cuentas", "blurb": "El cuello de botella de Inception, la convolución separable de MobileNet, el escalado de EfficientNet y la tabla real de keras.applications.", "min": 2},
            {"n": 4, "slug": "leccion-4", "title": "Un atajo y = x + F(x) deja pasar el gradiente por cientos de capas", "blurb": "La degradación de las redes profundas, el bloque residual, el «+1» de la derivada, Add y la proyección 1×1, y por qué ResNet-50 tiene 50 capas.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "La augmentation inventa pósters nuevos que conservan la etiqueta, y compra robustez", "blurb": "Transformaciones que conservan la etiqueta, la interpolación hacia atrás, las capas Random… de Keras 3, el interruptor training y cómo cargar carpetas con tf.data.", "min": 2},
            {"n": 6, "slug": "leccion-6", "title": "Transfer learning: reutiliza el cuerpo que ya sabe ver y entrena solo la cabeza", "blurb": "Extracción de características frente a ajuste fino, preprocess_input, trainable y recompilar, BatchNormalization y un experimento honesto.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "La convolución transpuesta agranda estampando el kernel como un sello", "blurb": "Los sellos en 1D y 2D, el stride como separación, la fórmula (n − 1)s − 2p + k, output_padding, la matriz Cᵀ y la convolución con ceros.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Si el kernel no es múltiplo del stride, la transpuesta pinta un tablero de ajedrez", "blurb": "Contar sellos por casilla, los dos remedios, nearest y bilinear como transpuestas fijas, Conv2DTranspose en Keras, autoencoder, U-Net y los errores típicos.", "min": 3}
          ]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Transformers en Keras",
          summary: "Construir un Transformer pieza a pieza y aplicarlo a series temporales y a generación de texto.",
          tags: ["Datos secuenciales", "Series temporales", "Atención multi-cabeza", "Generación de texto"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Una fila de audiencias se convierte en miles de ejemplos cortando ventanas", "blurb": "Ventana y horizonte, N = ⌊(n − w − h)/s⌋ + 1, la forma (ejemplos, pasos, rasgos), cortar en el tiempo sin fugas, normalizar con train y la línea base.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Cada título mira a todos los demás a la vez: softmax(QKᵀ/√d)·V", "blurb": "Por qué las LSTM se quedan cortas, Q, K y V como proyecciones aprendidas, las formas de la fórmula y un ejemplo entero a mano con Toy Story, Titanic y Shrek.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Dos retoques al softmax: dividir entre √d_k y tapar el futuro con −∞", "blurb": "Por qué la desviación de q·k es √d_k y la softmax se satura, la máscara causal y la de relleno, use_causal_mask, self- y cross-attention y su coste.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Varias cabezas miran a cosas distintas por el mismo precio", "blurb": "Repetir la atención h veces, concatenar y mezclar con W_O, contar 4d² + 4d parámetros, MultiHeadAttention en Keras y el error de key_dim.", "min": 2},
            {"n": 5, "slug": "leccion-5", "title": "Sin posición, «Woody salva a Buzz» y «Buzz salva a Woody» son lo mismo", "blurb": "La atención no ve el orden (equivarianza a permutaciones), la codificación sinusoidal como relojes, por qué solo cuenta la distancia y las posiciones aprendidas.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Un bloque Transformer: atención y FFN, cada una con su atajo y su LayerNorm", "blurb": "LayerNormalization a mano y frente a BatchNorm, la conexión residual, la red feed-forward por posición, post-LN y pre-LN, cuántos parámetros tiene un bloque, BERT/GPT/T5 y el bloque como capa de Keras.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "En una serie, cada valor entra por una Dense, y la línea base puede ganar", "blurb": "Dense(d_model) en lugar de Embedding, regresión con Dense(1) y MSE frente a las líneas base, el error de la posición con NumPy y clasificación de curvas con softmax.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Un mini-GPT adivina la siguiente palabra, y la temperatura decide cuánto arriesga", "blurb": "TextVectorization, ventanas desplazadas, decoder causal, logits y from_logits, perplejidad y su suelo, temperatura y top-k, y guardar un modelo con capas propias.", "min": 3}
          ]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Aprendizaje no supervisado y modelos generativos",
          summary: "Modelos que crean datos nuevos: autoencoders variacionales, modelos de difusión y GANs.",
          tags: ["Autoencoders", "Difusión", "GAN", "Generador y discriminador"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Para inventar hace falta un mapa sin huecos", "blurb": "Discriminativo frente a generativo, p(y|x) frente a p(x), y los huecos del espacio latente de un autoencoder normal comparados con el VAE.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "El VAE guarda una nube por película, y el azar va aparte en ε", "blurb": "El encoder da μ y log σ²; el decoder se entrena con puntos sorteados; z = μ + σ·ε deja pasar el gradiente (∂z/∂μ = 1, ∂z/∂σ = ε).", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "La pérdida del VAE: reconstruir bien contra ordenar el mapa", "blurb": "Reconstrucción + β·KL, el KL ½(μ² + σ² − 1 − ln σ²) a mano (0,8181), suma frente a media, β-VAE y posterior collapse.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Para generar basta el decoder; para interpolar, caminar por el mapa", "blurb": "Sortear z ~ N(0, I) y decodificar; z(t) = (1 − t)·z_A + t·z_B entre Toy Story y Shrek; latente frente a mezcla de píxeles.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Difusión: ensuciar con nieve tiene una fórmula de un salto", "blurb": "Un paso de ruido que conserva la varianza, ᾱ como señal que queda, la fórmula de un salto con x₀ = 2 y el schedule lineal frente al coseno.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "La red solo adivina el ruido; generar es quitarlo poco a poco", "blurb": "La pérdida ‖ε − ε̂‖², el paso t como entrada, el muestreo inverso del DDPM con números y el DDIM, que se salta pasos.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "GAN: un falsificador y un crítico que se entrenan por turnos", "blurb": "Generador contra discriminador, el equilibrio con −2 ln 2, la pérdida no saturante (−0,99 frente a −0,01) y el train_step con dos cintas.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Cuando la GAN se queda en dos géneros: mode collapse, y qué familia elegir", "blurb": "Ocho géneros en círculo: 8 de 8 con velocidades parejas, 2 de 8 con un D 17 veces más rápido; remedios, comparativa y errores de Keras 3.", "min": 3}
          ]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Técnicas avanzadas de Keras",
          summary: "Controlar el entrenamiento: bucles personalizados con GradientTape, ajuste de hiperparámetros con Keras Tuner y optimización de modelos.",
          tags: ["Custom training loop", "GradientTape", "Callbacks", "Keras Tuner", "Optimización"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Entrenar a mano: cinco piezas que se repiten en cada lote", "blurb": "Cinta, forward, gradientes, apply_gradients y Mean; un paso a mano (pérdida 25 → 0) y la media de época ponderada 4,67.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "tf.function rueda tu paso una vez; train_step lo mete en fit", "blurb": "Qué va dentro y fuera de la tf.function, por qué el último lote traza dos veces y el contrato de train_step (devolver el diccionario).", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Los callbacks deciden al final de cada época: parar, guardar o frenar", "blurb": "Orden de los ganchos, EarlyStopping con patience = 3 a mano, ReduceLROnPlateau y las trampas de val_loss y de la extensión .keras.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "El optimizador convierte el gradiente en un paso; el planificador lo encoge", "blurb": "Momentum 0,95 → 0,855, Nesterov 0,905, Adam independiente de la escala, AdamW; schedules y el suelo de ruido 0,214 → 0,0015.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "El gradiente tiene que caber: ni infinito ni cero", "blurb": "Factor por capa √(nσ²/2): 7,07¹⁰ explota y He da 1; los tres recortes; float16, underflow y loss scaling con S = 1024.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Regularizar es poner una multa a memorizar", "blurb": "Multas L2 = 0,14 y L1 = 0,06, L1 manda 7 de 7 variables inútiles a 0, Dropout ×2 y BatchNorm −1,34 frente a +1,91.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Keras Tuner prueba combinaciones por ti, y el azar explora mejor que la rejilla", "blurb": "hp.Int, Float(log), Choice y Boolean; rejilla frente a azar; Hyperband: 17 configuraciones en 75 épocas en vez de 153.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Como en el streaming: que los datos no se corten y que puedas continuar", "blurb": "map → cache → shuffle → batch → prefetch, del 45 % al 99 % de modelo ocupado; .keras con optimizador, semillas y la chuleta final.", "min": 3}
          ]
        },
        {
          n: 6, slug: "modulo-6",
          title: "Aprendizaje por refuerzo",
          summary: "Agentes que aprenden por prueba y error: Q-learning, la ecuación de Bellman y Deep Q-Networks.",
          tags: ["Agente y entorno", "Recompensa", "Q-learning", "Bellman", "DQN"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "El agente aprende solo con premios, nunca con la respuesta correcta", "blurb": "Estado, acción, recompensa y episodio con el recomendador de StreamFlix; por qué no es supervisado, el reward hacking y el bucle de Gymnasium.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Una recompensa vale menos cuanto más tarde llega", "blurb": "Retorno descontado y factor γ: el +10 de dentro de dos pasos vale 8,1, el horizonte 1/(1−γ) y la cuenta de atrás G_t = r_t + γ G_{t+1}.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "El valor de hoy es el premio de ahora más γ por el valor de mañana", "blurb": "MDP, V y Q, y la ecuación de Bellman en la portada y la ficha de StreamFlix: V(A) = 5, V(B) = 7, por sistema y por barridos.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Para encontrar la mejor película hay que probar, a veces, una al azar", "blurb": "Explorar o explotar: el bandido de cinco películas, la media incremental y ε-greedy (0,925 frente a 0,025), con ε fijo y decreciente.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Q-learning corrige cada valor hacia «premio + γ por lo mejor de después»", "blurb": "La tabla Q y la regla TD: objetivo, error y nuevo valor (0,40 → 0,441); la recompensa viaja hacia atrás una pantalla por episodio.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "SARSA cuenta con sus propios despistes; Q-learning supone que jugará perfecto", "blurb": "On-policy y off-policy: el mismo paso da 2 en Q-learning y 0,5 en SARSA; en el acantilado, uno bordea y el otro da un rodeo.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "DQN: una red sustituye a la tabla, y dos trucos evitan que se descontrole", "blurb": "La red Q, el objetivo con (1 − terminated), Huber, replay buffer y red objetivo; CartPole real: 192 de media, inestable entre semillas.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "El máximo de estimaciones con ruido sale optimista: Double DQN lo corrige", "blurb": "Sobreestimación y Double DQN (3,79 → 3,16), Dueling, replay priorizado, policy gradient y la tabla de errores típicos del refuerzo.", "min": 3}
          ]
        },
        {
          n: 7, slug: "modulo-7",
          title: "Proyecto final",
          summary: "Un modelo de regresión avanzado en Keras y un clasificador de imágenes con transfer learning.",
          tags: ["Regresión avanzada", "Transfer learning", "Clasificación de imágenes", "Evaluación"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "El test es el estreno: se reparte en tres y se mira una sola vez", "blurb": "El mapa del proyecto y el reparto de los 4.000 pisos en 2.400 / 800 / 800; por qué mirar el test para decidir lo gasta.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Primero se reparte, después se ajusta", "blurb": "Fugas de datos: la media de un escalador o las columnas elegidas son parámetros; elegir antes de repartir da 0,83 con ruido puro.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Un error de 9,5 no dice nada sin un baseline", "blurb": "MAE, RMSE y R² a mano con cuatro películas (15; 15,81; 0,92) y los tres baselines de los pisos: media, lineal y random forest.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Una red pequeña con frenos, y tres vigilantes que deciden cuándo parar", "blurb": "Dense → BatchNorm → ReLU → Dropout con L2 (3.201 parámetros) y EarlyStopping, ReduceLROnPlateau y ModelCheckpoint leyendo las curvas.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "¿Gana la red? Mismo reparto, varias semillas y el test una vez", "blurb": "Keras Tuner con RandomSearch y el veredicto en el test: la red baja el MAE un 16 % frente al random forest en los pisos y no gana en la diabetes.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Con 75 carátulas: una base prestada y variantes que no cambian la etiqueta", "blurb": "Transfer learning (base y cabeza), los dígitos como carátulas diminutas, el aumento de datos (±21,6°) y la BatchNorm que no converge (0,99⁴⁶ ≈ 0,63).", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Dos fases: primero solo la cabeza, después afinar con learning rate bajo (y recompilar)", "blurb": "Extracción de características (5.125 de 29.045 parámetros), fine-tuning con lr 1e-4, la trampa de recompilar y el resultado honesto: desde cero gana.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "La exactitud esconde dónde falla: matriz de confusión y un predecir() que sabe dudar", "blurb": "Precisión, exhaustividad y F1 del 8 (1,000; 0,538; 0,700), guardar en .keras y predecir() con umbral 0,6; errores típicos, checklist y cierre del curso.", "min": 3}
          ]
        }
      ]
    }

    ,{
      id: 4,
      slug: "curso-4",
      title: "Introducción a las redes neuronales y PyTorch",
      short: "Redes neuronales con PyTorch",
      blurb: "Empezar PyTorch desde cero: tensores, derivadas automáticas, datasets y las regresiones lineal, logística y softmax construidas a mano y con nn.Module.",
      modules: [
        {
          n: 1, slug: "modulo-1",
          title: "Tensores y derivadas automáticas",
          summary: "Qué es un tensor en PyTorch, cómo se opera con él y cómo calcula PyTorch derivadas por ti con autograd.",
          tags: ["Tensores 1D y 2D", "Operaciones", "NumPy ↔ PyTorch", "Derivadas", "requires_grad", "backward"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Un tensor es una tabla con ejes, forma y tipo", "blurb": "De una nota suelta a un lote de carátulas: ejes, forma, numel, dtype y bytes; torch.tensor y las fábricas de tensores.", "min": 4},
            {"n": 2, "slug": "leccion-2", "title": "Cambiar la forma o recortar no mueve los números: son vistas", "blurb": "Las 12 carátulas en 3 × 4 o 4 × 3: strides, por qué view falla tras .T, slicing con trozos y enteros, vistas y clone().", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "* multiplica casilla a casilla; @, filas por columnas", "blurb": "Minutos a horas sin bucles, sum(dim=…) hace desaparecer un eje y el producto de matrices calcula la afinidad usuario × película.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Broadcasting: se alinea por la derecha y solo se estira el 1", "blurb": "Las dos reglas para sumar formas distintas, el sesgo de una capa y la resta (3, 1) − (3,) que da un MSE de 1,3333 con predicciones perfectas.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "from_numpy comparte memoria; torch.tensor copia", "blurb": "Una lista de reproducción compartida o copiada: from_numpy, torch.tensor, .numpy(), el float64 de NumPy, tablas de Pandas y .detach() para dibujar.", "min": 2},
            {"n": 6, "slug": "leccion-6", "title": "La derivada es una pendiente, y el gradiente una flecha cuesta arriba", "blurb": "De la secante a la tangente: (x²)' = 2x, la regla de la cadena, derivadas parciales y el gradiente que apunta cuesta arriba.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Autograd apunta cada operación y la recorre hacia atrás", "blurb": "Marcar, calcular, backward() y leer .grad: ∂L/∂w = −18 a mano y con PyTorch, el grafo dinámico, detach y no_grad.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "El bucle que aprende: backward suma, así que vacía el cubo en cada paso", "blurb": "backward() suma a .grad (4, 8, 12…), el orden del bucle, w -= lr * w.grad en no_grad, el factor (1 − 2η) y la recta que encuentra el descenso.", "min": 3}
          ]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Datasets, transformaciones y DataLoader",
          summary: "Cómo preparar y servir los datos a un modelo: clases Dataset, transforms y lotes con DataLoader.",
          tags: ["Dataset", "Transforms", "DataLoader", "Batch", "Shuffle"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Se entrena por lotes: muchos pasos con ruido o pocos pasos precisos", "blurb": "Época, paso y lote; ⌈N/B⌉ pasos por época y el ruido σ/√B, con los maratones de palomitas calculados a mano.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Un Dataset solo responde dos preguntas: cuántas fichas hay y cuál es la i", "blurb": "__init__, __len__ y __getitem__; carga perezosa; TensorDataset y un CSV de películas estandarizado a mano.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "La receta del póster: primero geometría, luego ToTensor, luego Normalize", "blurb": "Compose y el orden, ToTensor (PIL → tensor, 0–255 → 0–1, HWC → CHW) y Normalize (x − μ)/σ con un píxel gris.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Aumento de datos: el mismo póster, otra versión en cada época", "blurb": "Volteos, giros y recortes al azar que se sortean en cada ds[i]; solo en entrenamiento y sin cambiar la etiqueta.", "min": 2},
            {"n": 5, "slug": "leccion-5", "title": "Imágenes: PyTorch quiere el canal delante, (C, H, W)", "blurb": "PIL (ancho, alto), NumPy (H, W, C), tensor (C, H, W) y lote (B, C, H, W); permute no es reshape; ImageFolder.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "El DataLoader baraja los índices y los corta en lotes", "blurb": "len(cargador) = ⌈N/B⌉, for y next(iter()), shuffle solo en entrenamiento, drop_last y WeightedRandomSampler.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Cómo se fabrica cada bandeja: collate_fn apila y num_workers adelanta", "blurb": "default_collate apila en (B, …) y falla con tamaños distintos; el padding lo arregla; num_workers prepara lotes en paralelo.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Tres conjuntos sin fugas: random_split, Subset y dos datasets", "blurb": "random_split con fracciones (1797 → 1258/270/269), Subset, semilla fija, la trampa del aumento y los errores típicos.", "min": 3}
          ]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Regresión lineal con PyTorch",
          summary: "Predicción, coste, descenso del gradiente, SGD y mini-batch, primero a mano y luego con nn.Module, optimizadores y regresión múltiple.",
          tags: ["Predicción", "MSE", "Gradient Descent", "SGD", "Mini-batch", "nn.Linear", "Múltiple"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Predecir es multiplicar y sumar: ŷ = w·x + b", "blurb": "Una recta con dos números que se aprenden: tensores con requires_grad, la forma (N, 1) y nn.Linear con su weight y su bias.", "min": 4},
            {"n": 2, "slug": "leccion-2", "title": "El MSE resume el fallo en un número (si las formas coinciden)", "blurb": "Errores al cuadrado y promediados: 0,9167 a mano y con nn.MSELoss, y por qué (3, 1) contra (3,) da 8,9167 sin avisar.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "El gradiente señala hacia dónde baja el coste", "blurb": "El coste como paisaje, sus derivadas a mano (−24 y −10) y con loss.backward(), y un paso que baja el MSE de 31 a 6,57.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Descender es repetir el paso, y centrar x lo acelera", "blurb": "Forward, coste, backward, actualizar y vaciar, época tras época; el factor (1 − lr·λ) y por qué centrar x convierte el valle en un cuenco redondo.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "zero_grad, backward, step: el bucle de todo PyTorch", "blurb": "Cada línea del bucle a mano tiene su pieza: optim.SGD hace el paso, zero_grad vacía, y el momentum le da inercia a la bola.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "batch_size decide cuántos pasos das en cada época", "blurb": "El mismo bucle con lotes de 60, de 10 o de 1: 5, 30 o 300 pasos en 5 épocas, el gradiente de un lote y el último lote incompleto.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "El learning rate y el mejor modelo se eligen con validación", "blurb": "Por qué lr = 0,4 diverge y 0,2 gana, train / validación / test, copiar el mejor state_dict con deepcopy y guardarlo a disco.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Con varias variables cambia una línea… y hay que estandarizar", "blurb": "nn.Linear(k, 1) y nn.Linear(k, m), variables en escalas distintas que explotan o se atascan, z = (x − μ)/σ y la lista de errores típicos.", "min": 3}
          ]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Regresión logística con PyTorch",
          summary: "Clasificar en dos clases: la sigmoide, la entropía cruzada y el bucle de entrenamiento completo.",
          tags: ["Sigmoide", "Umbral", "Cross-entropy", "BCE", "nn.Sequential"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "La sigmoide convierte cualquier puntuación en una probabilidad", "blurb": "Una recta da «probabilidades» de −0.13 o 1.5; la sigmoide las aplasta entre 0 y 1. Peso, sesgo, frontera y odds.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "En PyTorch el modelo es nn.Linear seguido de nn.Sigmoid", "blurb": "Dos capas en fila (o una clase con forward), formas (N, 1) en float32 y los errores de forma y tipo con sus mensajes reales.", "min": 2},
            {"n": 3, "slug": "leccion-3", "title": "Con MSE el gradiente se apaga justo cuando más te equivocas", "blurb": "La regla de la cadena da 2(p − y)·p(1 − p): casi cero cuando el modelo está seguro. La carrera MSE contra entropía cruzada.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "La entropía cruzada castiga más cuanto más seguro te equivocas", "blurb": "Pérdida = −ln de la probabilidad que el modelo dio a lo que pasó. Su gradiente es p − y, sin factor que se apague. nn.BCELoss.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Mejor logits y BCEWithLogitsLoss: la misma cuenta, sin romperse", "blurb": "El modelo devuelve logits y la pérdida aplica la sigmoide por dentro con una fórmula estable. pos_weight y la doble sigmoide.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Cada vuelta del bucle: forward, pérdida, zero_grad, backward y step", "blurb": "Las cinco líneas de cada vuelta, un paso a mano con cinco usuarios, el learning rate, DataLoader y por qué w crece sin fin con datos separables.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "El umbral convierte la probabilidad en decisión (y elige qué error cometes)", "blurb": "Del 0.57 a «cancela»: umbral, accuracy, falsos positivos y negativos, y por qué bajar el umbral cambia un error por otro.", "min": 2},
            {"n": 8, "slug": "leccion-8", "title": "Con dos variables la frontera es una recta (y a veces no basta)", "blurb": "nn.Linear(2, 1) traza una valla recta en el plano; estandarizar las variables; círculos imposibles y la variable x1² + x2².", "min": 3}
          ]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Softmax y clasificación multiclase",
          summary: "Más de dos clases: función softmax, entrenamiento con CrossEntropyLoss y clasificación de dígitos.",
          tags: ["Softmax", "Argmax", "CrossEntropyLoss", "Multiclase", "Dígitos"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Una neurona por clase: cada crítico da su puntuación", "blurb": "Tres críticos de Netflix (acción, comedia, terror) puntúan el mismo tráiler: nn.Linear(D, K), la forma de W y por qué con dos clases basta una neurona.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "La softmax exponencia y reparte: solo importan las diferencias", "blurb": "De (3, 1, −1) a (0,8668; 0,1173; 0,0159): exponenciar y dividir entre la suma, la invarianza a sumar una constante, la temperatura y el dim de torch.softmax.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Restar el máximo evita que la exponencial reviente", "blurb": "Los logits (1000, 1001, 1002) dan nan; restando 1002 dan (0,0900; 0,2447; 0,6652). log_softmax evita el ln 0 y explica por qué la pérdida quiere logits.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "La pérdida es la sorpresa, −ln p, y su gradiente es p − y", "blurb": "Los Vengadores, El Resplandor y Shrek: −ln p_y de cada tráiler, la media 0,5051, la pérdida de adivinar ln K y el gradiente «lo que creías menos lo que era».", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "CrossEntropyLoss quiere logits (N, K) y etiquetas long (N,)", "blurb": "Qué pasarle a la pérdida, qué hace por dentro, los mensajes de error típicos y su arreglo, y la doble softmax que se estanca en 1,46 sin dar ningún error.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Una imagen son 64 números, y cada fila de W es una plantilla", "blurb": "Dígitos de 8×8 como carátulas en miniatura: aplanar con 8·fila + columna, preparar los tensores y ver cada fila de W como una plantilla que suma o resta.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Se empieza en ln K y se termina mirando la matriz de confusión", "blurb": "De 2,4179 de pérdida y 9,6 % de acierto a 346 de 360: la plantilla correcta se acerca a la imagen, el bucle de cinco pasos y qué dígitos se confunden con cuáles.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Un género por película, softmax; varios a la vez, sigmoides", "blurb": "Titanic es drama y romance: softmax reparte el 100 %, las sigmoides juzgan cada género por separado. Y el cierre del curso: el mismo molde cinco veces.", "min": 3}
          ]
        }
      ]
    }
    ,{
      id: 5,
      slug: "curso-5",
      title: "Deep Learning con PyTorch",
      short: "Deep Learning con PyTorch",
      blurb: "Redes superficiales y profundas, técnicas para entrenarlas bien (dropout, inicialización, momentum, batch normalization), redes convolucionales y modelos preentrenados con TorchVision.",
      modules: [
        {
          n: 1, slug: "modulo-1",
          title: "Redes neuronales superficiales",
          summary: "Capa oculta, funciones de activación y el problema XOR: por qué una sola neurona no basta y cómo lo resuelven unas pocas.",
          tags: ["Capa oculta", "Activaciones", "XOR", "nn.Module", "Neuronas"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Una neurona dibuja una recta, y XOR no cabe en una recta", "blurb": "AND y OR se separan con una recta; XOR no: la contradicción de las cuatro filas y la pérdida clavada en ln 2.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "La capa oculta reescribe los datos hasta que basta una recta", "blurb": "Dos ayudantes (OR y AND) y un jefe: XOR resuelto a mano con una red 2-2-1 y el espacio oculto donde una recta ya basta.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Una capa es X·Wᵀ + b; una red, capas en fila", "blurb": "nn.Linear con sus formas, el forward de la red 2-2-1 a mano (p = 0.4125), nn.Sequential, nn.Module y cuántos parámetros tiene una red.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "La activación decide cuánto gradiente vuelve atrás", "blurb": "Las cuatro activaciones y sus derivadas, 0.25⁵ ≈ 0.001, la carrera de entrenamiento y las neuronas ReLU «muertas».", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Entrenar es corregir hacia atrás, empezando por p − y", "blurb": "Salida y pérdida para cada problema, el gradiente p − y, un paso de backward a mano y por qué el entrenamiento a veces no arranca.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Cada neurona es un corte recto: hacen falta las justas", "blurb": "Regiones 1 + H + H(H−1)/2, por qué hacen falta 3 neuronas para encerrar un círculo, e infraajuste frente a sobreajuste.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "K clases, K neuronas: la red da logits y la pérdida pone la softmax", "blurb": "Una neurona de salida por género, logits, softmax y argmax a mano, y la pérdida inicial ≈ ln K.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Dígitos de verdad: aplanar, una red 64-16-10 y a medir", "blurb": "Imágenes de 8×8 aplanadas en 64 números, DataLoader con lotes de 64, 97.3 % en test y la lista de comprobación antes de entrenar.", "min": 3}
          ]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Redes profundas y técnicas de entrenamiento",
          summary: "Backpropagation, gradientes que se desvanecen, dropout, inicialización de pesos, momentum y batch normalization.",
          tags: ["Backpropagation", "Dropout", "Inicialización", "Momentum", "BatchNorm", "Optimizadores"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Una red profunda es la misma capa repetida, guardada en nn.ModuleList", "blurb": "Capas en fila como los equipos de un rodaje, la cuenta de parámetros [64, 32, 32, 32, 10] = 4.522 y por qué una lista de Python deja al optimizador sin pesos.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Backpropagation: la culpa del error viaja hacia atrás multiplicando", "blurb": "La red 2-2-1 que predice la nota de Shrek, a mano: −2 en la salida, δ = (−4, 2), un paso que baja la pérdida de 1 a 0,098, y el grafo de autograd que lo hace solo.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Los gradientes se apagan capa a capa: mídelos", "blurb": "Una cola de cine donde la opinión llega a un cuarto del volumen: 0,25⁸ ≈ 1,5·10⁻⁵ con sigmoides, la norma del gradiente por capa y clip_grad_norm_ para el caso contrario.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Inicializar los pesos para que cada capa conserve el volumen", "blurb": "Una fila de amplificadores: Var(z) = n·Var(w)·Var(x), por qué σ = 0,1 es estable con 100 entradas, Xavier para tanh y sigmoide, He para ReLU y nn.init.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Dropout: rodar cada día con medio reparto para no memorizar", "blurb": "Apagar neuronas al azar y reescalar por 1/(1−p), el panel de 8 críticos, model.train() frente a model.eval() y la trampa de F.dropout.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "BatchNorm: todas las capas hablan en la misma escala", "blurb": "Normalizar con la media y la varianza del lote, γ y β, las medias móviles de eval(), el crítico sobre 10 frente al crítico sobre 100 y las tres trampas.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Momentum y Adam: el paso aprende de los pasos anteriores", "blurb": "La velocidad v = μv + g que multiplica el paso hasta por 10, Nesterov, RMSprop, Adam con corrección de sesgo (primer paso = lr), AdamW y los planificadores.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "La receta completa: ReLU + He dan el salto, lo demás afina", "blurb": "Una ablación de seis recetas sobre los dígitos (de 10 % a 97 %), el laboratorio para diseñar tu red, la receta de partida y la chuleta síntoma → remedio.", "min": 3}
          ]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Redes convolucionales con PyTorch",
          summary: "Convolución, canales, pooling y CNN completas para imágenes, con las cuentas de tamaños que hay que dominar.",
          tags: ["Conv2d", "Canales", "MaxPool", "CNN", "Imágenes"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "La lupa que busca a Woody: pocos pesos, muchas cuentas", "blurb": "Por qué una CNN y qué cambia de Keras a PyTorch: 448 parámetros frente a 3.000.100, la convolución a mano con F.conv2d y por qué la CNN hace 10 veces más multiplicaciones.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "PyTorch quiere las imágenes como (N, C, H, W)", "blurb": "NCHW frente a NHWC con las láminas de tinta de un póster, unsqueeze, permute y ToTensor, los strides en memoria y cómo leer los errores de forma.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Cada filtro suma lo que ve en todos los canales", "blurb": "Los 16 críticos que miran las tres láminas de color: un kernel por canal de entrada, el 3,5 a mano, el peso (C_out, C_in, k, k) y la cuenta C_out·(C_in·k²+1).", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Una sola fórmula da el tamaño de salida, también del pooling", "blurb": "⌊(n + 2p − d(k−1) − 1)/s⌋ + 1 con stride, padding y dilatación; padding='same', la ventana que se queda sin mirar la última columna y MaxPool2d con su stride por defecto.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Del mapa al vector: in_features = C·H·W, capa a capa", "blurb": "La CNN del laboratorio con su tabla de formas (16 → 8 → 4), nn.Flatten, el 512 de nn.Linear, LazyLinear, AdaptiveAvgPool2d(1) y el «resumen» con hooks: 18.378 parámetros.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Entrenar por lotes: 1.347 pósters son 14 lotes por época", "blurb": "Dataset y DataLoader, ⌈N/B⌉ lotes con el último de 47, drop_last, el bucle de cinco pasos y la CNN del laboratorio de 0,093 a 0,980 de acierto en 8 épocas.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "BatchNorm2d pone a cada canal en su propia escala", "blurb": "Dos críticos con escalas de 1–8 y de 10–80: una media y una varianza por canal sobre N·H·W valores, γ y β, running_mean en eval() y un experimento de 0,297 a 0,970.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Mueve el póster un píxel: la CNN es equivariante, no invariante", "blurb": "La estrella que cambia o no de ventana de pooling, la densa y la CNN probadas con imágenes movidas (0,476 y 0,630), data augmentation, mirar dentro con hooks y la chuleta del módulo.", "min": 3}
          ]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Modelos preentrenados y TorchVision",
          summary: "Reutilizar redes ya entrenadas: TorchVision, transfer learning, congelar capas y cambiar la última capa.",
          tags: ["TorchVision", "Transfer learning", "ResNet", "Congelar capas", "GPU"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Reutiliza al crítico veterano: solo le enseñas tus géneros", "blurb": "Las primeras capas valen para cualquier imagen: con una cabeza nueva entrenas 5.130 de 11,2 millones de parámetros. TorchVision y weights=.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "ResNet-18 encoge la carátula y suma un atajo para que el gradiente llegue", "blurb": "224 → 112 → 56 → 28 → 14 → 7 con la fórmula de la convolución, layer4 con el 71,8 % de los parámetros y el atajo F(x) + x.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "La red solo entiende carátulas preparadas como las de ImageNet", "blurb": "Resize, CenterCrop, ToTensor y Normalize: el rojo 200 entra en la red como 1,307. Aumento de datos solo al entrenar.", "min": 2},
            {"n": 4, "slug": "leccion-4", "title": "Antes de predecir: eval() cambia el cálculo y no_grad() ahorra memoria", "blurb": "La misma película da +1,22 o −1,22 según su sesión en train(); en eval() siempre lo mismo. no_grad() y softmax.", "min": 2},
            {"n": 5, "slug": "leccion-5", "title": "Candado al cuerpo, cabeza nueva y, si hace falta, afinar despacio", "blurb": "Congelar, sustituir fc y optimizar solo la cabeza, en ese orden; luego afinar layer4 con un learning rate 10 veces menor.", "min": 2},
            {"n": 6, "slug": "leccion-6", "title": "Congelar los pesos no congela la BatchNorm", "blurb": "running_mean pasa de 0 a 0,3, 0,57, 0,813… sin que cambie ningún parámetro. Ponerla en eval() o dejarla adaptarse.", "min": 2},
            {"n": 7, "slug": "leccion-7", "title": "Todo en la misma sala y guardado con su nombre: .to() y state_dict", "blurb": ".to() mueve el módulo pero copia el tensor; state_dict guarda los números con nombre y size mismatch falla aunque pongas strict=False.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "Mide antes de creértelo: con dígitos, el preentrenado no siempre gana", "blurb": "Seis métodos, cinco semillas y una regresión logística que gana con 1 o 2 imágenes por cifra. La receta y la chuleta de errores.", "min": 3}
          ]
        }
      ]
    },

    {
      id: 6,
      slug: "curso-6",
      title: "Proyecto final de IA con aprendizaje profundo",
      short: "Proyecto final DL",
      blurb: "Un proyecto completo de clasificación de imágenes, hecho dos veces: con Keras y con PyTorch. Carga y aumento de datos, CNN, Vision Transformers con transfer learning y la presentación final.",
      modules: [
        {
          n: 1, slug: "modulo-1",
          title: "Tratamiento de datos: carga y aumento con Keras y PyTorch",
          summary: "Cómo meter miles de imágenes en un modelo sin que explote la memoria: carga en memoria frente a generadores, y aumento de datos en los dos frameworks.",
          tags: ["Carga en memoria", "Generadores", "Data augmentation", "ImageDataGenerator", "Dataset y DataLoader", "Keras vs PyTorch"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Cada carpeta es una clase: el nombre de la carpeta es la etiqueta", "blurb": "El proyecto (satélite en Coursera, pósters aquí): una subcarpeta por clase, etiquetas por orden alfabético y las cuentas de train, validación y lotes.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Cargar todo en memoria funciona hasta que no cabe: el generador trae un lote cada vez", "blurb": "Memoria = N · alto · ancho · 3 · bytes: 10.000 pósters de 224 × 224 son 6 GB, un lote de 32 son 19 MB; el streaming de Netflix.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "image_dataset_from_directory: de carpetas a lotes, con la misma semilla en train y validación", "blurb": "image_dataset_from_directory: image_size, batch_size, validation_split, subset y la misma seed; píxeles en 0–255 y Rescaling.", "min": 2},
            {"n": 4, "slug": "leccion-4", "title": "Aumento de datos en Keras: capas que cambian el póster en cada época, y solo al entrenar", "blurb": "RandomFlip, RandomRotation(0.1) = ±36° y RandomZoom(0.2) = ±20 %; activas con training=True, dentro del modelo o con map.", "min": 2},
            {"n": 5, "slug": "leccion-5", "title": "En PyTorch la tubería son tres piezas: ImageFolder, transforms y DataLoader", "blurb": "ImageFolder, Compose (aumento, ToTensor, Normalize), random_split y DataLoader; lotes (B, 3, H, W) y una receta limpia para validación.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Keras y PyTorch hacen lo mismo con los datos; cambian dónde va el canal y quién divide entre 255", "blurb": "Tabla lado a lado, (B, H, W, C) frente a (B, C, H, W), 0–255 frente a 0–1, grados frente a vueltas, y los fallos que no avisan.", "min": 3}
          ]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Desarrollo de modelos CNN en Keras y PyTorch",
          summary: "Construir, entrenar y evaluar un clasificador CNN para el mismo problema en los dos frameworks, y comparar resultados, tiempos y despliegue.",
          tags: ["CNN", "Keras", "PyTorch", "Entrenamiento", "Evaluación", "Comparación"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "El clasificador es una escalera: cada bloque ve más póster y una sigmoide decide", "blurb": "Tres bloques conv → pool, una cabeza densa y 89.249 parámetros contados a mano.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "En Keras, fit entrena y dos callbacks deciden cuándo parar y qué guardar", "blurb": "compile, fit con validación, EarlyStopping y ModelCheckpoint sobre curvas reales.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "En PyTorch el bucle lo escribes tú, y train() o eval() cambian lo que hace la red", "blurb": "nn.Module con logits, el bucle de entrenamiento y validación, y los dos modos de la red.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "La nota de verdad sale del test: matriz de confusión, precision y recall", "blurb": "400 pósters de test, cuatro casillas, tres preguntas y el umbral que reparte los errores.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Keras frente a PyTorch: misma red, mismas notas; la diferencia está en el código", "blurb": "Tres semillas, segundos por época y líneas de código: qué es diferencia y qué es ruido.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Cuando la accuracy empata, el framework lo eligen los pesos del proyecto", "blurb": "Matriz de decisión, despliegue con KB y milisegundos, y una justificación defendible.", "min": 3}
          ]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Vision Transformers y transfer learning",
          summary: "Qué es un Vision Transformer, cómo aplicar transfer learning con uno en Keras y en PyTorch, y cómo integrarlo con una CNN y comparar.",
          tags: ["ViT", "Parches", "Transfer learning", "Fine-tuning", "CNN + ViT", "Comparación"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Un póster es una frase de parches: trocear en 16×16, aplanar y proyectar", "blurb": "224/16 = 14, 196 parches de 768 números, la matriz E de 590.592 parámetros y por qué es una Conv2D con kernel = stride.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Sin posición, «título arriba» y «título abajo» son el mismo póster", "blurb": "El token CLS y la tabla de posiciones aprendida: 197 tokens, y un ViT diminuto que pasa de 0,520 a 1,000 de acierto.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "Cada parche mira a todos desde el primer bloque, y por eso el ViT necesita tantos datos", "blurb": "El bloque Transformer sobre parches, el mapa de atención del CLS (57 % a la fila del título) y el sesgo inductivo que le falta.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Un ViT preentrenado se reutiliza en tres pasos: congelar, cambiar la cabeza y afinar", "blurb": "Keras y PyTorch lado a lado: 1.538 entrenables de 86.567.656, afinar con lr 1e-5 y 30 pósters que bastan si el cuerpo ya sabe ver.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "En el híbrido, cada casilla del mapa de la CNN es un token", "blurb": "Cortar tu CNN tras el último pooling, (H, W, C) → H·W tokens, y por qué cortar pronto dispara la atención.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "Con pocos datos gana quien trae la vista de serie: CNN, ViT e híbrido en Keras y PyTorch", "blurb": "Tabla real con 100 y 800 pósters: el ViT falla con pocos datos, todos empatan con muchos y el coste decide.", "min": 3}
          ]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Presentación del proyecto final",
          summary: "Cómo resumir todo el proyecto, qué métricas y gráficas enseñar, cómo justificar la elección del framework y qué viene después.",
          tags: ["Resumen del proyecto", "Métricas", "Gráficas", "Justificación", "Próximos pasos"],
          lessons: [
            {"n": 1, "slug": "leccion-1", "title": "Todo el proyecto cabe en un mapa: datos → CNN → ViT → híbrido, dos veces", "blurb": "Cinco cajas en Keras y en PyTorch; el canal cambia de sitio y un póster de 32×32 llega al transformer como 64 tokens.", "min": 3},
            {"n": 2, "slug": "leccion-2", "title": "Cada pregunta del evaluador se contesta con una gráfica distinta", "blurb": "La métrica que importa, curvas, matriz 93/7/12/88 y errores bonitos y feos; con matplotlib y sklearn.", "min": 3},
            {"n": 3, "slug": "leccion-3", "title": "La tabla comparativa elige con los pesos que tú pones", "blurb": "Accuracy, minutos, MB y despliegue en escala 0–1; con el perfil del móvil gana el híbrido por 0,037: empate técnico.", "min": 3},
            {"n": 4, "slug": "leccion-4", "title": "Contar lo que falta también puntúa: limitaciones medidas y próximos pasos", "blurb": "Limitación, prueba y remedio; de 800 a 1.600 pósters se gana 0,0 puntos. Y los cursos que siguen en el certificado.", "min": 3},
            {"n": 5, "slug": "leccion-5", "title": "Antes de entregar, comprueba que tus números se pueden repetir", "blurb": "Quince comprobaciones, cinco críticas; repetidos, semilla y recarga del modelo con código. Fin del cuaderno.", "min": 3}
          ]
        }
      ]
    }
  ],

  upcoming: null
};

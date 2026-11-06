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
            {"n": 5, "slug": "leccion-5", "title": "Un proyecto es una película de trece escenas, y el modelo es la más corta", "blurb": "Las trece escenas del ciclo de vida con StreamFlix: del problema a la deriva.", "min": 3},
            {"n": 6, "slug": "leccion-6", "title": "No entrenes tu propio LLM: adáptalo con prompts, RAG y PEFT", "blurb": "Ciencia de Datos vs Ingeniería de IA, del predictivo al prescriptivo, RAG y las herramientas.", "min": 3},
            {"n": 7, "slug": "leccion-7", "title": "Los datos nunca llegan limpios: huecos, extremos, escalas y texto", "blurb": "NaN, outliers, StandardScaler y One-Hot: dejar la tabla lista para el modelo.", "min": 3},
            {"n": 8, "slug": "leccion-8", "title": "La meta es generalizar: acertar con datos que el modelo nunca vio", "blurb": "Train/test, overfitting y el flujo de scikit-learn: crear → fit → predict → evaluar.", "min": 3}
          ]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Regresión lineal y logística",
          summary: "Predecir números con una recta (y con curvas) y predecir categorías con probabilidades. Aprender = bajar una montaña llamada «coste».",
          tags: ["Regresión simple", "Múltiple", "Polinómica", "MAE · MSE · RMSE · R²", "Sigmoide", "Gradient Descent", "SGD"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "¿Qué es una regresión y para qué sirve?",
                        "blurb": "La respuesta que buscas es un número : no «sí» o «no», ni «de tipo A o B», sino 183, 240 o 301 mil horas.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Regresión lineal simple: una recta entre los puntos",
                        "blurb": "Eso es la regresión lineal simple : «simple» porque usa una variable de entrada, y «lineal» porque la relación que busca es una recta .",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "¿Cuál es la mejor recta? Residuos y error cuadrático",
                        "blurb": "Tiene que ser un criterio numérico, para que el ordenador pueda aplicarlo: la mejor recta es la que más se acerca a los puntos .",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Mínimos cuadrados (OLS): la mejor recta, sin tantear",
                        "blurb": "No.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Métricas: MAE, MSE, RMSE y R²",
                        "blurb": "Una métrica es un número que resume lo bien (o mal) que predice un modelo.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Regresión múltiple: varias variables a la vez",
                        "blurb": "Claro: la regresión lineal múltiple usa varias variables de entrada \\( x_1, x_2, \\dots, x_p \\) (presupuesto, nota de la crítica, semanas de promoción…) y les da a cada una su propio peso:",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Regresión polinómica: curvas con una regresión lineal",
                        "blurb": "Una recta es una mala descripción de una «U»: sube en un extremo y baja en el otro sin poder doblarse.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Otras formas: exponencial, logarítmica, periódica y rendimientos decrecientes",
                        "blurb": "La estrategia es siempre la misma: transformar una variable (o la y) hasta que la relación se vuelva recta , y entonces aplicar regresión lineal.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Regresión logística: de números a probabilidades",
                        "blurb": "Es un problema de clasificación binaria (dos clases): el target solo vale 0 o 1.",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Cómo aprende un modelo: función de coste y gradient descent",
                        "blurb": "Con una idea sencilla que se repite en todo el Machine Learning: partir de unos parámetros cualesquiera, medir cuánto se equivoca el modelo y retocar los parámetros un poquito en la dirección que reduce el…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 3, slug: "modulo-3",
          title: "Modelos de clasificación y ensembles",
          summary: "Árboles, vecinos, márgenes, probabilidades y comités de modelos: cómo piensa cada algoritmo y cuándo conviene cada uno.",
          tags: ["Árboles", "KNN", "SVM", "Naive Bayes", "Bias–Variance", "Random Forest", "Boosting", "XGBoost"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "El mapa: cinco formas de decidir una clase",
                        "blurb": "En el módulo 2 viste una primera forma: la regresión logística dibuja una frontera recta y convierte la distancia a esa frontera en una probabilidad.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Árboles de decisión: las veinte preguntas",
                        "blurb": "Mira la tabla del apartado anterior.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "KNN: dime con quién andas",
                        "blurb": "KNN ( K-Nearest Neighbors , «los K vecinos más cercanos») es el algoritmo más intuitivo que existe, porque hace lo que haría cualquier persona: para decidir sobre un caso nuevo, busca los K casos conocidos más…",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "SVM: la calle más ancha entre dos grupos",
                        "blurb": "Una SVM ( Support Vector Machine , «máquina de vectores de soporte») también separa clases con una frontera, pero con una idea más fina que la regresión logística: de todas las fronteras que separan bien…",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Naive Bayes: contar y aplicar Bayes",
                        "blurb": "Naive Bayes es el algoritmo de las probabilidades contadas .",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Más de dos clases: One-vs-Rest y One-vs-One",
                        "blurb": "Algunos algoritmos son multiclase de nacimiento : los árboles, KNN, Naive Bayes y Random Forest no tienen ningún problema con 3 o con 30 clases.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Sesgo y varianza: por qué fallan los modelos",
                        "blurb": "Hasta aquí has visto el sobreajuste como «train alto, test bajo».",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Ensembles: muchos modelos mejor que uno",
                        "blurb": "Un ensemble («conjunto», «comité») combina las predicciones de varios modelos en una sola.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Cuándo usar cada algoritmo",
                        "blurb": "No existe un algoritmo mejor en todos los problemas (a veces se le llama el teorema del No Free Lunch , «no hay almuerzo gratis»): cada uno hace unas suposiciones sobre cómo son los datos, y rinde cuando esas…",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 4, slug: "modulo-4",
          title: "Aprendizaje no supervisado",
          summary: "Encontrar estructura en datos sin respuestas: grupos, anomalías y mapas con menos dimensiones.",
          tags: ["K-Means", "Jerárquico", "DBSCAN", "HDBSCAN", "PCA", "t-SNE", "UMAP"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "¿Qué es el aprendizaje no supervisado y cuándo se usa?",
                        "blurb": "En el módulo 1 viste el aprendizaje supervisado : cada fila de la tabla traía su respuesta (el target y ) y el algoritmo aprendía la relación entre las columnas ( X ) y esa respuesta.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Reglas de asociación: qué se compra junto",
                        "blurb": "Esta tarea se llama reglas de asociación ( association rule mining ; en un supermercado se conoce como «análisis de la cesta de la compra»).",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Recomendar por vecinos: quién se parece a ti",
                        "blurb": "Las reglas de asociación miran títulos que se ven juntos.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "K-Means: agrupar con centroides",
                        "blurb": "K-Means ( K-medias ) representa cada grupo con un único punto, su centroide , y reparte las filas dando cada una al centroide que tiene más cerca.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Evaluar grupos sin respuestas correctas",
                        "blurb": "Hay dos familias de métricas:",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "¿Cuántos grupos? Elegir K",
                        "blurb": "Prueba varios valores de K y apunta la inercia de cada uno.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Clustering jerárquico: el árbol de agrupaciones",
                        "blurb": "El clustering jerárquico aglomerativo ( agglomerative , «de abajo arriba») construye un árbol de agrupaciones sin que le digas cuántos grupos quieres:",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "DBSCAN: agrupar por densidad",
                        "blurb": "DBSCAN ( Density-Based Spatial Clustering of Applications with Noise ) no usa centroides.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "HDBSCAN: DBSCAN sin elegir eps",
                        "blurb": "Imagina el mapa de gustos de una plataforma con dos clubes de fans (por ejemplo, de Harry Potter y de Star Wars ): sus miembros tienen gustos casi idénticos entre sí, y los dos clubes están pegados el uno al…",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Detección de anomalías: encontrar lo raro",
                        "blurb": "Una anomalía ( outlier , anomaly ) es una fila que se comporta de forma muy distinta al resto.",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Reducir dimensiones: la maldición y el PCA",
                        "blurb": "Una nota de vocabulario: cada columna ( feature ) es una dimensión .",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "t-SNE: un mapa que respeta a los vecinos",
                        "blurb": "t-SNE ( t-distributed Stochastic Neighbor Embedding ) no busca ejes, sino una colocación : pone cada punto en un plano de 2 dimensiones de modo que los vecinos de cada punto en el espacio original sigan siendo…",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "UMAP: más rápido y con transform",
                        "blurb": "UMAP ( Uniform Manifold Approximation and Projection ) persigue lo mismo que t-SNE, con otras matemáticas:",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "PCA, t-SNE y UMAP: cuál usar",
                        "blurb": "La mejor forma de entender las diferencias es verlas sobre los mismos datos.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "El aprendizaje no supervisado dentro de un proyecto de ML",
                        "blurb": "Un modelo lineal como la regresión logística solo puede separar las clases con una recta (o un plano).",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 5, slug: "modulo-5",
          title: "Evaluar y validar modelos",
          summary: "Cómo saber si un modelo funciona de verdad: separar datos, métricas que no engañan, validación cruzada, regularización y fugas de datos.",
          tags: ["Train/Test", "Matriz de confusión", "Precision · Recall · F1", "ROC-AUC", "Cross-validation", "Ridge · Lasso", "Data leakage", "GridSearchCV"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Por qué un modelo necesita un examen honesto",
                        "blurb": "Depende por completo de con qué datos y con qué métrica se ha medido ese 99 %.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Partir los datos: train, validación y test",
                        "blurb": "No del todo, y la razón es sutil.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "La matriz de confusión: los cuatro tipos de acierto y de error",
                        "blurb": "Primero fija una convención: la clase positiva es la que quieres detectar (una película que te va a gustar, un fraude, un suscriptor que se da de baja, mañana lloverá).",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Accuracy, precision, recall y F1: qué mide cada una",
                        "blurb": "Cada métrica es una pregunta distinta sobre la misma matriz.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "El umbral de decisión: el botón que reparte los errores",
                        "blurb": "En el módulo 2 viste que un clasificador como la regresión logística no responde «sí/no», sino una probabilidad : «este suscriptor tiene un 0,73 de probabilidad de darse de baja».",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Curva ROC y AUC: evaluar sin elegir umbral",
                        "blurb": "La idea es probar todos los umbrales a la vez y dibujar qué pasa.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Métricas de regresión y la convención neg_",
                        "blurb": "Ya conoces estas métricas del módulo 2 ; aquí van en una pasada, con una cuenta a mano que las reúne, porque las vas a usar dentro de validaciones cruzadas.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Validación cruzada: no fiarse de un solo reparto",
                        "blurb": "Ninguna de las dos, y las dos a la vez.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Regularización: Ridge, Lasso y ElasticNet",
                        "blurb": "En el módulo 2 viste que un modelo con demasiada libertad se aprende el ruido.",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Data leakage: cuando el modelo hace trampa sin que lo sepas",
                        "blurb": "Lo más probable es una fuga de datos ( data leakage ): información que no estará disponible cuando el modelo trabaje de verdad se coló durante el entrenamiento o la evaluación.",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Pipeline y ColumnTransformer: la forma segura de encadenar pasos",
                        "blurb": "Un Pipeline es una cadena de pasos que se comporta como un único modelo .",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Buscar hiperparámetros: GridSearchCV y RandomizedSearchCV",
                        "blurb": "Recuerda la diferencia del módulo 1: los parámetros los aprende el modelo al entrenar (los pesos); los hiperparámetros los eliges tú antes de entrenar (K, la profundidad, C , alpha …).",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Diagnosticar: curvas de validación y de aprendizaje",
                        "blurb": "Las tres respuestas pueden ser correctas o inútiles según el caso, y trabajar a ciegas es muy caro (recoger datos cuesta semanas).",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Guardar y cargar un modelo: joblib y pickle",
                        "blurb": "No: un modelo entrenado es un objeto de Python, y se puede guardar en un fichero y volver a cargarlo después, en otro programa o en otro ordenador, sin reentrenar.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "El flujo completo, paso a paso",
                        "blurb": "Todo lo del módulo encaja en una sola secuencia (las escenas 9 a 12 de la película del Machine Learning del principio).",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 6, slug: "modulo-6",
          title: "Proyecto final: de los datos a la decisión",
          summary: "Todo el curso en un único flujo: el proyecto de lluvia en Australia y un caso completo de plataforma de streaming con clasificación, regresión, clusters y recomendación.",
          tags: ["Pipeline", "ColumnTransformer", "GridSearchCV", "Matriz de confusión", "Feature importance", "StreamFlix"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "De «quiero retener clientes» a un problema de Machine Learning",
                        "blurb": "Esta es la parte del proyecto que más se salta en los cursos y la que más proyectos reales arruina.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "El mapa del proyecto: doce etapas y dónde se aprendió cada una",
                        "blurb": "Este módulo no introduce algoritmos nuevos: combina los de los módulos anteriores y se detiene en las decisiones que hay entre ellos.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "¿Lloverá mañana? Datos, huecos y limpieza",
                        "blurb": "Es la misma clase de pregunta que «¿terminaré esta serie esta noche?» o «¿cancelará este usuario?»: la respuesta es sí o no .",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "La fuga temporal: qué sabes «el día de predecir»",
                        "blurb": "Una fuga de datos ( data leakage ) ocurre cuando alguna columna de entrada contiene, directa o indirectamente, información del futuro o de la propia respuesta .",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Reparto, baseline y la trampa del accuracy",
                        "blurb": "El fragmento 5 hace lo primero que se hace con cualquier problema supervisado: separar X (las columnas que el modelo verá) de y (la respuesta, convertida a 0/1) y repartir las filas en entrenamiento (80 %) y…",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Pipeline, GridSearch y resultados del modelo de lluvia",
                        "blurb": "Los modelos de scikit-learn solo aceptan números.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "StreamFlix de tus apuntes: los datos",
                        "blurb": "Este es tu proyecto : el código de StreamFlix de tus apuntes, con sus nombres de variables, sus parámetros y su semilla (42).",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "StreamFlix de tus apuntes: clasificar quién cancelará",
                        "blurb": "Todas las métricas de clasificación salen de contar cuatro cosas.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "StreamFlix de tus apuntes: predecir las horas del mes siguiente",
                        "blurb": "Un modelo que predijera siempre la media de las horas de entrenamiento tendría un MAE de 8,50 h y un RMSE de 10,73 h .",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "StreamFlix de tus apuntes: clusters, anomalías, mapas y vecinos",
                        "blurb": "El fragmento 19 toma siete columnas de comportamiento ( HorasMes , DiasDesdeUltimoUso , PeliculasVistas , SeriesVistas , ProblemasPago , ErroresApp , Dispositivos ), rellena los huecos con la mediana, las…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Tus números frente a los de la ejecución",
                        "blurb": "Esta es la tabla que prometí al principio.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "StreamFlix ampliado: los datos y su exploración",
                        "blurb": "Esta versión de StreamFlix tiene 5.000 usuarios .",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Preparación: reparto, ColumnTransformer y el viaje de una fila",
                        "blurb": "El fragmento 26 empieza separando X (las 12 columnas que el modelo verá) de los dos targets y reparte las filas con train_test_split en 4.000 de entrenamiento y 1.000 de test , con stratify=y (la tasa de…",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Clasificar: baseline, tres modelos, validación cruzada y ROC-AUC",
                        "blurb": "Una función auxiliar, construir(modelo) , crea para cada candidato un Pipeline con una copia limpia del preprocesador.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "De la probabilidad a la decisión: el umbral en euros",
                        "blurb": "Por defecto, predict() usa el umbral 0,5: «avisa si la probabilidad es al menos el 50 %».",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Leer los errores y la importancia de las variables",
                        "blurb": "Un número global (accuracy, AUC, euros) esconde dónde falla el modelo.",
                        "min": 3
            },
            {
                        "n": 17,
                        "slug": "leccion-17",
                        "title": "Regresión: ¿cuántas horas verá el mes que viene?",
                        "blurb": "Es el segundo target: HorasProximoMes .",
                        "min": 3
            },
            {
                        "n": 18,
                        "slug": "leccion-18",
                        "title": "Clustering con K-Means: ¿qué tipos de usuario hay?",
                        "blurb": "Esto es aprendizaje no supervisado (módulo 4): el algoritmo busca grupos de usuarios parecidos sin que nadie le diga cuáles son los grupos .",
                        "min": 3
            },
            {
                        "n": 19,
                        "slug": "leccion-19",
                        "title": "DBSCAN y las cuentas anómalas",
                        "blurb": "DBSCAN agrupa por densidad en vez de por centros: un punto es «denso» si tiene suficientes vecinos cerca, y los puntos que no pertenecen a ninguna zona densa se etiquetan como ruido ( −1 ).",
                        "min": 3
            },
            {
                        "n": 20,
                        "slug": "leccion-20",
                        "title": "Reducir dimensiones: PCA para entender, t-SNE para dibujar",
                        "blurb": "El PCA (análisis de componentes principales) busca nuevos ejes, combinaciones de las columnas originales, ordenados por cuánta variación de los datos explican.",
                        "min": 3
            },
            {
                        "n": 21,
                        "slug": "leccion-21",
                        "title": "Un recomendador por vecinos: «a quien se parece a ti le gustó…»",
                        "blurb": "El fragmento 38 construye una matriz R de 5.000 filas (usuarios) × 15 columnas (títulos): 0 si el usuario no lo ha visto, y su nota (1–5) si lo ha visto.",
                        "min": 3
            },
            {
                        "n": 22,
                        "slug": "leccion-22",
                        "title": "Producción: el modelo empieza a envejecer el día que sale",
                        "blurb": "Un modelo en producción no es un fichero que se despliega y se olvida: es un sistema vivo que depende de que el mundo se siga pareciendo a los datos con los que se entrenó.",
                        "min": 3
            },
            {
                        "n": 23,
                        "slug": "leccion-23",
                        "title": "Checklist de un proyecto de ML y mapa del Curso 1",
                        "blurb": "Este es el resumen operativo del módulo: las preguntas que debes poder contestar antes de dar un proyecto por terminado.",
                        "min": 3
            },
            {
                        "n": 24,
                        "slug": "leccion-24",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]}
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
          tags: ["Neurona", "Pesos y bias", "ReLU · Sigmoide · Softmax", "Forward", "Loss", "Backpropagation", "Adam", "Vanishing gradient"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "De la regresión a la neurona",
                        "blurb": "Las redes neuronales son el motor del Deep Learning.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Por qué la activación tiene que ser no lineal",
                        "blurb": "En general, con cualquier número de capas lineales:",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "El catálogo de funciones de activación",
                        "blurb": "Una función de activación \\( f \\) toma la suma ponderada \\( z \\) y devuelve la salida de la neurona.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Softmax: de números sueltos a probabilidades",
                        "blurb": "Esos tres números sin normalizar se llaman logits (los \\( z \\) de la última capa).",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "De una neurona a una red: capas y arquitectura",
                        "blurb": "Una capa ( layer ) es un grupo de neuronas que reciben las mismas entradas y calculan en paralelo.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "El forward pass: calcular una red a mano",
                        "blurb": "El recorrido de la información desde la entrada hasta la salida se llama forward pass ( propagación hacia delante ).",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "La función de pérdida: medir cuánto se equivoca",
                        "blurb": "Para que una red aprenda hace falta un número que diga cómo de mala es su predicción .",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Derivadas desde cero y la regla de la cadena",
                        "blurb": "La derivada de una función \\( f(w) \\) en un punto es su pendiente allí: cuánto sube (o baja) \\( f \\) por cada unidad que aumentas \\( w \\), cuando el aumento es diminuto.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Gradient descent y el learning rate",
                        "blurb": "Si la pendiente es positiva, aumentar el peso sube la pérdida: hay que bajarlo .",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Backpropagation: calcular todas las derivadas",
                        "blurb": "La respuesta se llama backpropagation ( retropropagación del error ): la regla de la cadena aplicada de la salida hacia la entrada , aprovechando que las derivadas de una capa se reutilizan para calcular las…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Épocas, batches e iteraciones: el bucle de entrenamiento",
                        "blurb": "La pérdida de un conjunto es la media de las pérdidas de sus ejemplos, y la derivada de una media es la media de las derivadas.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Optimizadores: SGD, Momentum, RMSprop y Adam",
                        "blurb": "Un optimizador es la regla que convierte el gradiente \\( g \\) en un movimiento de los pesos.",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Gradientes que se desvanecen o explotan",
                        "blurb": "Mira la fórmula del delta de una capa oculta que obtuvimos en backpropagation: \\( \\delta_j = \\delta_o\\,v_j\\,\\sigma'(z_j) \\).",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Sobreajuste en redes: dropout, L2 y early stopping",
                        "blurb": "La señal para detectarlo está en las curvas de pérdida por época: la de entrenamiento baja siempre; la de validación baja al principio, toca fondo y vuelve a subir cuando la red empieza a memorizar.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "¿Cuántas capas y cuántas neuronas?",
                        "blurb": "Hay un resultado matemático famoso (Cybenko, 1989, para la sigmoide; Hornik y otros, más general) que dice, en lenguaje llano: una red con una sola capa oculta con suficientes neuronas y una activación no…",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 2, slug: "modulo-2",
          title: "Keras: regresión y clasificación con redes densas",
          summary: "TensorFlow, PyTorch y Keras. Construir, compilar, entrenar y usar una red con Sequential para predecir números y categorías.",
          tags: ["TensorFlow · PyTorch · Keras", "Sequential · Dense", "compile · fit · predict", "One-Hot", "Crossentropy", "Shallow vs Deep"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "TensorFlow, PyTorch y Keras: qué es cada cosa",
                        "blurb": "Entrenar una red neuronal exige resolver tres tareas que, escritas desde cero, serían enormes:",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Anatomía de un programa Keras: cinco pasos",
                        "blurb": "El esqueleto en código es este (los detalles de cada línea los verás uno por uno en las secciones siguientes):",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Los datos: formas, lotes (batch) y épocas (epoch)",
                        "blurb": "Keras espera los datos como un array de NumPy (o un tensor) cuya primera dimensión siempre es el número de muestras .",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Sequential, Input y Dense: construir la red",
                        "blurb": "keras.Sequential([...]) es la forma más sencilla de construir una red: le das una lista de capas y los datos las atraviesan en ese orden , la salida de cada una es la entrada de la siguiente.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "compile(): decidir cómo va a aprender",
                        "blurb": "model.compile(optimizer=..., loss=..., metrics=[...]) responde a esas tres preguntas.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "fit(), History, evaluate() y predict()",
                        "blurb": "fit ejecuta el bucle que describimos en el módulo 1 —lote tras lote, época tras época: propagar hacia delante, calcular la pérdida, hacer backpropagation y actualizar los pesos— y se detiene al llegar al…",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Regresión con una red densa",
                        "blurb": "Cada pieza tiene su porqué:",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Clasificación binaria: sigmoide + binary crossentropy",
                        "blurb": "Queremos una pérdida que valga casi 0 cuando la red está segura y acierta y muchísimo cuando está segura y se equivoca .",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Clasificación multiclase: softmax, One-Hot y crossentropy",
                        "blurb": "La última capa tiene una neurona por clase (\\( C \\) en total).",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Ejemplo completo: reconocer dígitos escritos a mano",
                        "blurb": "Una carátula real es demasiado grande para empezar, así que practicamos con el problema clásico en pequeño: leer un dígito escrito a mano (como el número de sala que alguien apunta a boli en una entrada de…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Redes poco profundas frente a redes profundas",
                        "blurb": "Esta frontera (2 frente a 3 capas ocultas) es la que se usa en el curso, pero no es universal : según el libro o el equipo, «profunda» empieza en 2, en 3 o en 10 capas.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Sobreajuste y EarlyStopping",
                        "blurb": "Ya conoces el sobreajuste del Curso 1, y lo has visto en la frontera retorcida del experimento de la sección de fit .",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Guardar, cargar y reproducir un modelo",
                        "blurb": "Un archivo .keras es en realidad un zip con tres cosas (se ha comprobado abriéndolo):",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Errores típicos y cómo leerlos",
                        "blurb": "Los mensajes de la tabla de abajo son reales : se provocan a propósito en el fragmento 15 (y los de las etiquetas, en el 8) con la versión de este módulo (TensorFlow 2.21, Keras 3.15).",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "Chuleta: funciones y argumentos de Keras del módulo",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 3, slug: "modulo-3",
          title: "Redes convolucionales (CNN)",
          summary: "Cómo una red «ve» imágenes: filtros, stride, mapas de características, pooling y las cuentas de tamaños que hay que saber hacer.",
          tags: ["Imagen RGB", "Filtros", "Stride", "Feature maps", "Max Pooling", "Flatten", "Conv2D"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "¿Por qué una red densa funciona mal con imágenes?",
                        "blurb": "Una capa Dense espera un vector , no una imagen.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Una imagen es un tensor de números",
                        "blurb": "Una imagen digital es una cuadrícula de píxeles .",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "La convolución, a mano",
                        "blurb": "Necesitamos dos cosas: la imagen (una matriz de números) y el filtro o kernel (otra matriz, mucho más pequeña, por ejemplo de 3×3).",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Filtros: detectores de patrones que la red aprende sola",
                        "blurb": "Cambiando los pesos del filtro cambia lo que «busca».",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Varios canales de entrada y varios filtros",
                        "blurb": "Para una entrada RGB, un filtro «3×3» es en realidad un bloque de 3×3×3 : tres kernels de 3×3, uno por canal.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Stride, padding y el tamaño de la salida",
                        "blurb": "El stride es el desplazamiento de la ventana entre una posición y la siguiente.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Cuántos parámetros tiene una Conv2D",
                        "blurb": "Cada filtro tiene \\( f \\cdot f \\cdot C_{in} \\) pesos (un kernel \\( f \\times f \\) por cada canal de entrada) más un bias .",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "ReLU después de la convolución",
                        "blurb": "Una convolución es una operación lineal (multiplicar y sumar).",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Mapas de características y campo receptivo",
                        "blurb": "El mapa de características ( feature map ) es la salida de un filtro sobre toda la imagen: una matriz que dice «aquí el patrón aparece mucho, aquí nada».",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Pooling: resumir y ganar tolerancia",
                        "blurb": "El pooling (en español, «agrupamiento») divide cada mapa en bloques pequeños y resume cada bloque con un solo número .",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Flatten y la clasificación final",
                        "blurb": "La parte convolucional extrae características ; la parte final decide .",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "La arquitectura típica y las cuentas de formas",
                        "blurb": "Casi todas las CNN de clasificación siguen el mismo esquema (la usó LeNet-5, de Yann LeCun, en 1998 para leer cheques; y es la base de redes mucho mayores):",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "La CNN completa de las notas: de 100×100×3 a «comedia, terror o animación»",
                        "blurb": "Esta es la cuenta de tamaños que hay que saber hacer , de principio a fin, con las dos reglas que ya conoces: la fórmula del tamaño de salida y \\( (f\\cdot f\\cdot C_{in}+1)\\cdot F \\) para los parámetros.",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Cómo aprende una CNN",
                        "blurb": "No.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "Qué aprende cada capa: una CNN real en miniatura",
                        "blurb": "El siguiente experimento usa una CNN pequeñísima: Conv2D(4, 3×3) → pooling → Conv2D(8, 3×3) → pooling → Flatten → Dense(3) , con 723 parámetros .",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Conv2D y compañía en Keras",
                        "blurb": "Y sus compañeros: MaxPooling2D(pool_size=(2, 2), strides=None, padding=\"valid\") (si strides es None , vale lo mismo que pool_size ), AveragePooling2D , GlobalAveragePooling2D() , Flatten() , Dense(unidades…",
                        "min": 3
            },
            {
                        "n": 17,
                        "slug": "leccion-17",
                        "title": "Errores típicos y cómo reconocerlos",
                        "blurb": "El fragmento 11 reproduce varios de estos errores y muestra los mensajes reales de Keras.",
                        "min": 3
            },
            {
                        "n": 18,
                        "slug": "leccion-18",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 4, slug: "modulo-4",
          title: "Secuencias y atención: RNN, LSTM y Transformers",
          summary: "Datos donde el orden importa: memoria recurrente, LSTM y la idea que cambió la IA: la atención.",
          tags: ["RNN", "LSTM", "Tokens y embeddings", "Posición", "Self-attention", "Q · K · V", "GPT"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Datos secuenciales: cuando el orden importa",
                        "blurb": "Una secuencia es una lista de elementos en la que el orden forma parte de la información .",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "RNN: una red con memoria",
                        "blurb": "Una RNN lee la secuencia un elemento (un paso) cada vez : una palabra de un subtítulo o un capítulo de tu historial.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "LSTM: una memoria con puertas",
                        "blurb": "Eso es una LSTM .",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Tokens y embeddings: cómo se le da una palabra a una red",
                        "blurb": "Piensa en los subtítulos de una película: cada línea es un texto que la red tiene que convertir en números.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Posición: cómo sabe un Transformer el orden",
                        "blurb": "La RNN conocía el orden gratis: lo recibía paso a paso.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Self-attention: Q, K y V",
                        "blurb": "Una RNN pasa toda la información por un cuello de botella (el estado \\(h\\)) y, para que la palabra 1 influya en la palabra 50, el mensaje tiene que atravesar 49 pasos, deteriorándose en el camino.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "GPT: un Transformer que predice la siguiente palabra",
                        "blurb": "GPT significa Generative Pre-trained Transformer :",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "¿Cuál uso? RNN, LSTM o Transformer",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 5, slug: "modulo-5",
          title: "Autoencoders, modelos preentrenados y proyecto final",
          summary: "Comprimir y reconstruir datos, reutilizar el conocimiento de VGG16 con transfer learning y fine-tuning, y el proyecto de daños en aviones.",
          tags: ["Autoencoder", "Denoising", "VGG16", "Transfer learning", "Fine-tuning", "ImageDataGenerator", "BLIP"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Autoencoders: aprender a comprimir y a reconstruir",
                        "blurb": "Eso es un autoencoder : una red neuronal que aprende a comprimir un dato y a reconstruirlo después.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Un autoencoder diminuto, resuelto a mano",
                        "blurb": "Imagina que apuntas, de cada sesión de cine en casa, dos números \\( (x_1, x_2) \\): las horas de película que ves (\\( x_1 \\)) y las bolsas de palomitas que te comes (\\( x_2 \\)).",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Cómo se entrena y por qué no se limita a copiar",
                        "blurb": "Un autoencoder se entrena con el mismo ciclo que cualquier red de este curso:",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Autoencoder con ruido: quitar el ruido de las imágenes",
                        "blurb": "Sí, y es una de las aplicaciones más famosas: el denoising autoencoder (autoencoder para quitar ruido).",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "El autoencoder convolucional de las notas, capa a capa",
                        "blurb": "Las notas generan sus propias imágenes con create_rectangle_images(number_samples=500, image_size=28) : 500 imágenes negras de 28×28 con un rectángulo blanco en posición y tamaño aleatorios (imagínalas como…",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Compilar y entrenar: compile , fit y el error a mano",
                        "blurb": "Lee la tabla con calma.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Autoencoder frente a PCA",
                        "blurb": "Hay un hecho precioso: si construyes un autoencoder sin activaciones (todo lineal) y lo entrenas con MSE, aprende prácticamente el mismo subespacio que PCA.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Un modelo distinto que se presenta cerca: las RBM",
                        "blurb": "No.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Modelos preentrenados: no entrenar desde cero",
                        "blurb": "Sí: un modelo preentrenado es una red que ya fue entrenada antes con un dataset muy grande (por ejemplo ImageNet , con 1.000 categorías de objetos cotidianos).",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "VGG16 por dentro: de 224×224×3 a 7×7×512",
                        "blurb": "VGG16 es una CNN muy ordenada: cinco bloques de convoluciones 3×3 (todas con padding=\"same\" y ReLU), cada uno terminado en un MaxPooling2D 2×2 que reduce a la mitad el alto y el ancho, y al final un…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Congelar capas: trainable = False",
                        "blurb": "Congelar una capa significa layer.trainable = False .",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Los tres escenarios: feature extraction, transfer learning y fine-tuning",
                        "blurb": "¿Por qué las superiores y no las primeras?",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "El proyecto final: daños en aviones",
                        "blurb": "El proyecto final del Curso 2 tiene dos partes que usan el mismo principio: no empezar de cero cuando ya existe un modelo preentrenado .",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Datos y ImageDataGenerator",
                        "blurb": "Las imágenes se reparten en tres conjuntos , cada uno en su carpeta, y dentro de cada uno una subcarpeta por clase :",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "El modelo: VGG16 congelada y una cabeza nueva",
                        "blurb": "Imagina un panel de 12 críticos que puntúan una película.",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Compilar y entrenar: compile , fit , history",
                        "blurb": "model.compile(optimizer=Adam(learning_rate=0.0001), loss='binary_crossentropy', metrics=['accuracy']) .",
                        "min": 3
            },
            {
                        "n": 17,
                        "slug": "leccion-17",
                        "title": "Leer las curvas de aprendizaje (tarea 6)",
                        "blurb": "La tarea 6 dibuja la curva de accuracy : plt.figure(figsize=(5, 5)) , dos plt.plot ( train_history['accuracy'] y train_history['val_accuracy'] ), un título 'Accuracy Curve' , los ejes 'Epochs' y 'Accuracy' …",
                        "min": 3
            },
            {
                        "n": 18,
                        "slug": "leccion-18",
                        "title": "Probar en el test y la matriz de confusión (tarea 7)",
                        "blurb": "La tarea 7 llama a test_model_on_image(test_generator, model, index_to_plot=1) , una función auxiliar del cuaderno: toma una imagen del conjunto de test , la muestra, la predice y compara con la etiqueta real.",
                        "min": 3
            },
            {
                        "n": 19,
                        "slug": "leccion-19",
                        "title": "Un experimento honesto: ¿ayuda de verdad congelar un preentrenado?",
                        "blurb": "El fragmento 18 reproduce la idea en pequeño.",
                        "min": 3
            },
            {
                        "n": 20,
                        "slug": "leccion-20",
                        "title": "Parte 2: describir la imagen con BLIP",
                        "blurb": "BLIP es un modelo preentrenado multimodal : entiende a la vez visión y lenguaje .",
                        "min": 3
            },
            {
                        "n": 21,
                        "slug": "leccion-21",
                        "title": "Errores típicos del entorno y cómo reconocerlos",
                        "blurb": "El módulo tiene dos ideas que dan mucho de sí:",
                        "min": 3
            },
            {
                        "n": 22,
                        "slug": "leccion-22",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]}
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
          tags: ["Tensores", "API funcional", "Subclassing", "Capas personalizadas", "Modelos personalizados", "TensorFlow 2.x"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "TensorFlow 2.x, Keras 3 y por qué un tutorial antiguo falla",
                        "blurb": "La versión que se ha usado para ejecutar todo el código de este módulo, y para pegar aquí las salidas reales, la imprime el fragmento 1 : TensorFlow 2.21.0 y Keras 3.15.1 , con backend tensorflow .",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Tensores: el único tipo de dato de una red",
                        "blurb": "Un tensor es una tabla de números de cualquier número de dimensiones, en la que todos los números tienen el mismo tipo .",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Broadcasting: sumar tensores de formas distintas",
                        "blurb": "La respuesta es el broadcasting (difusión): cuando dos tensores tienen formas distintas, TensorFlow intenta «estirar» el más pequeño copiándolo las veces necesarias para que encajen.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Derivadas automáticas: GradientTape",
                        "blurb": "La idea es la diferenciación automática ( autodiff ): en lugar de derivar con fórmulas simbólicas, TensorFlow anota cada operación que haces mientras calculas hacia delante y, después, recorre las anotaciones…",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "tf.function: de Python a un grafo rápido",
                        "blurb": "Si decoras una función con @tf.function (o la envuelves con tf.function(f) ), sucede esto:",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Tres formas de construir el mismo modelo",
                        "blurb": "El fragmento 11 construye la misma red (4 entradas → 8 neuronas ReLU → 3 salidas softmax) de las tres maneras:",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "La API funcional: un modelo es un grafo de capas",
                        "blurb": "Una capa de Keras es un objeto al que se «llama» como a una función: y = capa(x) .",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Capas compartidas, modelos anidados y capas congeladas",
                        "blurb": "En la API funcional compartir una capa es tan sencillo como llamar dos veces al mismo objeto capa .",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Varias entradas y varias salidas",
                        "blurb": "El fragmento 14 hace exactamente eso con datos sintéticos (600 usuarios inventados).",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Subclassing: tu propio modelo como una clase de Python",
                        "blurb": "Un modelo por subclases hereda de keras.Model y rellena dos métodos :",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Capas personalizadas: abrir una Dense por dentro",
                        "blurb": "Antes del código, hagamos la cuenta de una capa Dense con 2 entradas y 2 neuronas ReLU, un solo dato y una pérdida \\( L = \\tfrac12\\sum_j (a_j - t_j)^2 \\).",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Guardar y cargar modelos con piezas propias",
                        "blurb": "modelo.save(\"modelo.keras\") guarda un único archivo (en realidad un zip) con tres cosas: la arquitectura ( config.json : qué capas hay y con qué hiperparámetros, es decir, el resultado de get_config de cada…",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Todo junto: un clasificador con capas propias, atajo y guardado",
                        "blurb": "El fragmento 20 junta casi todo el módulo:",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Errores típicos del módulo y cómo se arreglan",
                        "blurb": "Todos los mensajes de esta tabla se han provocado y leído en la versión usada (TensorFlow 2.21 y Keras 3.15); si tu versión es otra, el texto puede variar un poco, pero la causa suele ser la misma.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 2, slug: "modulo-2",
          title: "CNN avanzadas",
          summary: "Redes convolucionales para problemas reales: más datos con augmentation, transfer learning bien hecho y la convolución transpuesta.",
          tags: ["Arquitecturas CNN", "Data augmentation", "Transfer learning", "Convolución transpuesta"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Repaso rápido y una pieza nueva: la dilatación",
                        "blurb": "Para que una neurona abarque más imagen hay tres caminos.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Las grandes arquitecturas: de LeNet a EfficientNet",
                        "blurb": "Entender las arquitecturas famosas no es cultura general: son los ladrillos que luego reutilizas en transfer learning, y cada una trae una idea que sigue viva.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "ResNet: los atajos que permiten redes de cientos de capas",
                        "blurb": "Al apilar capas ocurría algo desconcertante: una red de 56 capas daba peor error incluso en entrenamiento que una de 20.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Data augmentation: inventar datos sin salir de casa",
                        "blurb": "El requisito es que la transformación conserve la etiqueta .",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Cargar datos de verdad: carpetas, tf.data y tf.image",
                        "blurb": "El formato estándar es una carpeta por cada clase; el nombre de la carpeta es la etiqueta.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Transfer learning: no empieces de cero",
                        "blurb": "Una CNN tiene dos partes que ya viste en el módulo anterior: el cuerpo (capas convolucionales que extraen características) y la cabeza (las capas finales que clasifican).",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "La convolución transpuesta: agrandar con pesos que se aprenden",
                        "blurb": "Esta es la sección más importante del módulo y la que construiremos con más calma.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Errores típicos y cómo leerlos",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 3, slug: "modulo-3",
          title: "Transformers en Keras",
          summary: "Construir un Transformer pieza a pieza y aplicarlo a series temporales y a generación de texto.",
          tags: ["Datos secuenciales", "Series temporales", "Atención multi-cabeza", "Generación de texto"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Datos secuenciales y series temporales: de la serie a las ventanas",
                        "blurb": "Una secuencia es una lista de datos donde el orden importa: los capítulos que ves de una serie, las palabras de un subtítulo, la audiencia de un estreno día a día.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Por qué las RNN y las LSTM se quedan cortas",
                        "blurb": "Ya viste el detalle en el Curso 2, módulo 4 .",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "La atención escalada, pieza a pieza",
                        "blurb": "Los tokens llegan como una matriz \\(X\\) de forma \\((n, d_{model})\\): una fila por token (\\(n\\) tokens, cada uno con \\(d_{model}\\) números).",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Atención multi-cabeza y MultiHeadAttention",
                        "blurb": "La respuesta es repetir la atención varias veces en paralelo, cada una con sus propias matrices \\(W_Q\\), \\(W_K\\), \\(W_V\\).",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Codificación posicional",
                        "blurb": "Casi.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "El bloque Transformer encoder, pieza a pieza",
                        "blurb": "Un bloque tiene dos sub-bloques (atención y red feed-forward), cada uno rodeado de una conexión residual y una normalización .",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Un Transformer para series temporales",
                        "blurb": "En texto, el primer paso es una tabla de búsqueda Embedding que convierte un id entero en un vector.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Generación de texto con un Transformer decoder",
                        "blurb": "Sin internet no podemos bajar un corpus, y un texto sintético tiene una ventaja: podemos calcular exactamente cuánto vale un modelo perfecto.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 4, slug: "modulo-4",
          title: "Aprendizaje no supervisado y modelos generativos",
          summary: "Modelos que crean datos nuevos: autoencoders variacionales, modelos de difusión y GANs.",
          tags: ["Autoencoders", "Difusión", "GAN", "Generador y discriminador"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "De comprimir a crear: los modelos generativos",
                        "blurb": "Un modelo discriminativo (todo lo que has hecho hasta ahora: regresión logística, árboles, CNN…) aprende a separar : dado un dato \\( x \\), ¿qué etiqueta \\( y \\) le toca?",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "VAE: de un punto a una nube",
                        "blurb": "Un autoencoder variacional (VAE) cambia dos cosas del autoencoder normal.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "El truco de reparametrización",
                        "blurb": "Imagina el paso de sacar \\( z \\) como el botón «Sorpréndeme» de Netflix: le dices más o menos dónde buscar (el centro \\( \\mu \\) y cuánto te alejas, \\( \\sigma \\)) y te devuelve una película al azar de esa zona.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "La pérdida del VAE: reconstrucción + KL",
                        "blurb": "Con \\( \\beta = 1 \\) es, salvo constantes, la cota inferior de la evidencia o ELBO ( Evidence Lower BOund ): como no podemos calcular directamente lo bien que el modelo explica los datos, \\( \\log p(x) \\), se…",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Generar e interpolar con un VAE",
                        "blurb": "Como el KL ha moldeado el espacio latente para que se parezca a \\( \\mathcal{N}(0, I) \\), basta con sacar un \\( z \\) de esa normal estándar y pasarlo por el decoder .",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Modelos de difusión: destruir es fácil",
                        "blurb": "La flecha de izquierda a derecha es el proceso hacia delante ( forward process ): no se aprende, es una receta fija.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "La red que predice el ruido",
                        "blurb": "La idea más usada (DDPM) es sorprendentemente simple: dar a la red un dato con ruido \\( x_t \\) y pedirle que adivine el ruido \\( \\varepsilon \\) que se le añadió .",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Generar: el muestreo inverso",
                        "blurb": "Empezamos con \\( x_T \\sim \\mathcal{N}(0, I) \\), ruido recién sacado, y repetimos desde \\( t = T \\) hasta \\( t = 1 \\): preguntamos a la red qué ruido hay en \\( x_t \\), lo quitamos «un poquito» y añadimos una…",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "GAN: el falsificador y el detective",
                        "blurb": "Esa es la idea de las GAN .",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "GAN en Keras 3: DCGAN, WGAN y cGAN",
                        "blurb": "Se sobrescribe train_step en una subclase de keras.Model ( módulo 1 ), exactamente como en el VAE, pero con dos redes, dos optimizadores y dos cintas de gradiente . tf.GradientTape es una «cinta» que graba las…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Cuándo falla una GAN",
                        "blurb": "Se puede reproducir un colapso con ocho gaussianas en círculo (imagina cada una como un género de película: terror, comedia, animación…) y dos GAN idénticas que solo difieren en la velocidad de aprendizaje.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Comparativa: ¿cuándo usar cada familia?",
                        "blurb": "Los tres modelos del módulo se probaron aquí sobre problemas distintos (dígitos para el VAE, dos lunas para la difusión y la GAN), así que no se pueden comparar números, pero sí contar lo que cada uno exige:",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 5, slug: "modulo-5",
          title: "Técnicas avanzadas de Keras",
          summary: "Controlar el entrenamiento: bucles personalizados con GradientTape, ajuste de hiperparámetros con Keras Tuner y optimización de modelos.",
          tags: ["Custom training loop", "GradientTape", "Callbacks", "Keras Tuner", "Optimización"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Abrir la caja de fit : el mapa del módulo",
                        "blurb": "Piensa en fit como el botón «Reproducir» de Netflix: lo pulsas y la serie se ve sola, capítulo tras capítulo.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "El bucle de entrenamiento escrito a mano",
                        "blurb": "El aprendizaje de verdad son cuatro líneas , que ya conoces por el módulo 1 y por el Curso 2: calcular la predicción y la pérdida dentro de la cinta, pedir los gradientes y dárselos al optimizador.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "tf.function dentro del bucle: rapidez y trampas",
                        "blurb": "Tu bucle ejecuta cada operación desde Python una a una (ejecución inmediata). fit , en cambio, convierte el paso de entrenamiento en un grafo con tf.function (lo explicamos en el módulo 1 : el cuerpo de Python…",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Sobrescribir train_step : tu paso con el fit de siempre",
                        "blurb": "Sí.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Callbacks: engancharte al entrenamiento",
                        "blurb": "Un callback es una clase que hereda de keras.callbacks.Callback y sobrescribe los métodos on_... que le interesen.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Optimizadores en la práctica: Nesterov, AdamW y los mandos de Keras",
                        "blurb": "Para ver las reglas sin ruido, fijamos un solo peso del modelo de notas, \\( w=1 \\), un gradiente constante \\( g=0{,}5 \\) en todos los pasos, \\( \\eta=0{,}1 \\) y \\( \\beta=0{,}9 \\).",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Planificadores de learning rate (schedules)",
                        "blurb": "Con mini-lotes, cada gradiente lleva ruido.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Gradientes que explotan o se desvanecen: inicialización y recorte",
                        "blurb": "Sea una capa Dense con \\( n \\) entradas.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Regularización: L1, L2, Dropout y BatchNormalization",
                        "blurb": "Un modelo que memoriza suele tener pesos enormes que ajustan hasta el ruido.",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Keras Tuner: buscar hiperparámetros sin hacerlo a mano",
                        "blurb": "Un parámetro es lo que la red aprende (los pesos).",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "tf.data : que el modelo no espere a los datos",
                        "blurb": "Una tf.data.Dataset es una secuencia de elementos y una cadena de transformaciones que se aplican de forma perezosa (cuando alguien pide el siguiente elemento) y que se ejecutan en el motor de TensorFlow, en…",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Guardar, reanudar y reproducir un experimento",
                        "blurb": "Un detalle que importa: .keras incluye las variables del optimizador.",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Precisión mixta: números más pequeños, entrenamiento más rápido",
                        "blurb": "Un número de float32 usa 32 bits y cubre magnitudes de unos \\( 10^{-38} \\) a \\( 3{,}4\\cdot10^{38} \\).",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Chuleta: síntoma, causa y remedio",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 6, slug: "modulo-6",
          title: "Aprendizaje por refuerzo",
          summary: "Agentes que aprenden por prueba y error: Q-learning, la ecuación de Bellman y Deep Q-Networks.",
          tags: ["Agente y entorno", "Recompensa", "Q-learning", "Bellman", "DQN"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "El bucle agente–entorno: aprender probando",
                        "blurb": "Ya conoces la idea general desde el módulo 1 del Curso 1 : en el aprendizaje por refuerzo ( reinforcement learning , RL) hay un agente que actúa en un entorno y recibe recompensas .",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Retorno y descuento: cuánto vale el futuro",
                        "blurb": "La mayoría preferimos lo de ahora: es seguro, lo disfrutamos ya y quién sabe qué pasará dentro de cinco años.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Procesos de decisión de Markov: el mapa matemático",
                        "blurb": "Un proceso de decisión de Markov ( Markov Decision Process , MDP ) es la descripción matemática de un entorno de refuerzo.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "La ecuación de Bellman: el valor de hoy en función del valor de mañana",
                        "blurb": "Sí, y es el truco más importante de todo el refuerzo.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Exploración y explotación: la política ε-greedy",
                        "blurb": "Si siempre repites la de siempre, explotas lo que sabes, pero jamás descubrirás que había una mejor.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Q-learning: aprender la tabla Q sin conocer el mapa",
                        "blurb": "Sí.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "On-policy y off-policy: SARSA frente a Q-learning",
                        "blurb": "En todo agente conviven dos políticas.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Gymnasium: el laboratorio de entornos",
                        "blurb": "Gymnasium es una librería de Python con decenas de entornos listos (tableros, juegos clásicos, física, robots simulados) que comparten una interfaz única .",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Deep Q-Networks (DQN): una red neuronal en lugar de la tabla",
                        "blurb": "Se sustituye la tabla por una red \\( Q(s, a;\\, \\theta) \\), con pesos \\( \\theta \\).",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Mejoras de DQN: Double, Dueling y Prioritized Replay",
                        "blurb": "El objetivo usa un max sobre valores estimados , y estimados con ruido.",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Otra familia: aprender directamente la política (policy gradient y actor-crítico)",
                        "blurb": "Los métodos de gradiente de política ( policy gradient ) usan una red \\( \\pi_\\theta(a \\mid s) \\) que recibe el estado y devuelve una probabilidad por acción ( softmax ).",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Errores típicos y cómo depurarlos",
                        "blurb": "El refuerzo es el área donde un código que «no da error» puede estar mal sin enterarte, porque el único síntoma es que no aprende.",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 7, slug: "modulo-7",
          title: "Proyecto final",
          summary: "Un modelo de regresión avanzado en Keras y un clasificador de imágenes con transfer learning.",
          tags: ["Regresión avanzada", "Transfer learning", "Clasificación de imágenes", "Evaluación"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Un proyecto de principio a fin: el mapa",
                        "blurb": "Todos los proyectos de este módulo siguen la misma secuencia.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Parte 1 · Los datos: pisos y un reparto en tres",
                        "blurb": "Como no podemos descargar el conjunto de California, fabricamos uno .",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Preprocesado sin fugas",
                        "blurb": "Una fuga de datos ( data leakage ) ocurre cuando información del test (o del futuro) se cuela, aunque sea de refilón, en el entrenamiento.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Métricas y baselines: ¿contra quién compites?",
                        "blurb": "Un modelo de regresión se equivoca por una cantidad en cada fila: el error \\( e_i = \\hat y_i - y_i \\) (lo que predijo menos lo real).",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "La red con la API funcional: BatchNorm, Dropout y L2",
                        "blurb": "Para una pila de capas en fila, Sequential sería suficiente, y conviene decirlo con honestidad.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Entrenar con callbacks y leer las curvas",
                        "blurb": "Los callbacks del módulo 5 toman esas decisiones por ti, mirando la pérdida de validación después de cada época:",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Keras Tuner: dejar que el ordenador pruebe",
                        "blurb": "Los hiperparámetros (neuronas por capa, dropout, λ de L2, learning rate…) son los números que tú eliges y que no se aprenden por gradiente.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "El veredicto: ¿gana la red a la regresión lineal y al random forest?",
                        "blurb": "El fragmento 9 evalúa la red entrenada con callbacks (la del fragmento 8 , con los hiperparámetros por defecto, no los del tuner) y los dos baselines en las 800 filas del test:",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Parte 2 · Un clasificador de imágenes con transfer learning",
                        "blurb": "Una CNN tiene dos zonas con trabajos distintos ( módulo 2 ):",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Aumento de datos: ver 75 imágenes como si fueran miles",
                        "blurb": "Un aumento es válido solo si la transformación conserva la etiqueta .",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "La base convolucional y sus capas BatchNorm",
                        "blurb": "En un proyecto real la base sale de keras.applications (MobileNetV2, ResNet50, EfficientNet…) con pesos de ImageNet.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Las dos fases: extracción de características y fine-tuning",
                        "blurb": "Al principio la cabeza tiene pesos aleatorios, así que sus predicciones son malas y el gradiente que fluye hacia atrás es grande y poco fiable.",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Evaluar de verdad: matriz de confusión y análisis de errores",
                        "blurb": "Para una clase concreta (por ejemplo, «Netflix avisa a un usuario de que un estreno le va a gustar») hay cuatro posibilidades:",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Guardar el modelo y escribir predecir()",
                        "blurb": "modelo.save(\"archivo.keras\") guarda en un solo archivo la arquitectura (cómo están conectadas las capas), los pesos y la configuración de entrenamiento. keras.models.load_model lo reconstruye.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "El flujo real con ImageNet (código que no se ha ejecutado con los pesos)",
                        "blurb": "Casi nada.",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Errores típicos de un proyecto de Deep Learning",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 17,
                        "slug": "leccion-17",
                        "title": "Qué hacer ante un problema nuevo: la checklist",
                        "blurb": "No hay una receta única, pero sí un orden que evita casi todas las trampas de este módulo.",
                        "min": 3
            },
            {
                        "n": 18,
                        "slug": "leccion-18",
                        "title": "Cierre del Curso 3: lo que has construido",
                        "blurb": "Este módulo cierra el curso Deep Learning con Keras y TensorFlow .",
                        "min": 3
            },
            {
                        "n": 19,
                        "slug": "leccion-19",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]}
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
          tags: ["Tensores 1D y 2D", "Operaciones", "NumPy ↔ PyTorch", "Derivadas", "requires_grad", "backward"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "PyTorch frente a TensorFlow: la misma idea, otra forma de escribirla",
                        "blurb": "PyTorch es una librería de Python para cálculo numérico con tensores y derivadas automáticas, igual que la parte «TensorFlow» de lo que viste en el Curso 3.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Tensores: la tabla de números con la que PyTorch lo hace todo",
                        "blurb": "Porque todas se pueden convertir en números ordenados en una tabla .",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Crear tensores sin escribir los números a mano",
                        "blurb": "PyTorch trae «fábricas» de tensores.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "El tipo de dato (dtype): enteros, decimales y por qué importan los bytes",
                        "blurb": "El dtype dice qué clase de número contiene el tensor y cuántos bytes ocupa cada uno.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Cambiar la forma: view, reshape, transponer y unir",
                        "blurb": "x.view(3, 4) y x.reshape(3, 4) devuelven el tensor con la forma pedida.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Indexado y slicing: elegir partes de un tensor",
                        "blurb": "La sintaxis es la misma de NumPy y de las listas de Python.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Aritmética, funciones y estadísticos por ejes",
                        "blurb": "Las operaciones aritméticas entre tensores de la misma forma se hacen elemento a elemento , sin bucles: u + v suma casilla con casilla, u * v multiplica casilla con casilla, u ** 2 eleva cada elemento al…",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Producto de matrices y producto escalar",
                        "blurb": "Para dos vectores de la misma longitud \\( n \\), el producto escalar es \\( \\mathbf{u}\\cdot\\mathbf{v} = \\sum_{i=1}^{n} u_i v_i \\): multiplicar casilla a casilla y sumar.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Broadcasting: sumar tensores de formas distintas",
                        "blurb": "El broadcasting estira el tensor más pequeño, repitiéndolo las veces necesarias, para que las formas encajen (sin copiar memoria de verdad).",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "NumPy, Pandas y PyTorch: pasar de uno a otro",
                        "blurb": "Que se comparta memoria es muy eficiente (no se copian millones de números), pero tiene una consecuencia que hay que tener presente: si modificas uno, cambia el otro .",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Dibujar tensores con Matplotlib y derivadas: la pendiente de una curva",
                        "blurb": "Se usa Matplotlib , la librería de gráficos que ya conoces de los cursos anteriores.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Varias variables: derivadas parciales y gradiente",
                        "blurb": "La derivada parcial de \\( f(u, v) \\) respecto a \\( u \\), escrita \\( \\partial f/\\partial u \\), se calcula derivando como si \\( v \\) fuera una constante .",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Autograd: PyTorch deriva por ti",
                        "blurb": "La respuesta es la diferenciación automática ( autograd en PyTorch): mientras calculas hacia delante, PyTorch va apuntando cada operación en una libreta; cuando le pides la derivada, lee la libreta hacia atrás…",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "El grafo de cómputo dinámico: hojas, grad_fn y qué recibe gradiente",
                        "blurb": "El «cuaderno de apuntes» es un grafo : cada tensor es un nodo y cada operación une unos nodos con otros.",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "Cortar el grafo: detach, no_grad y las operaciones in-place",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 16,
                        "slug": "leccion-16",
                        "title": "Los gradientes se acumulan: zero_grad",
                        "blurb": "Es un comportamiento deliberado: cada backward() SUMA el gradiente nuevo al que ya hubiera en .grad , no lo reemplaza. (Es útil en casos avanzados, por ejemplo para acumular el gradiente de varios lotes que no…",
                        "min": 3
            },
            {
                        "n": 17,
                        "slug": "leccion-17",
                        "title": "Tu primer descenso del gradiente con autograd",
                        "blurb": "Sí.",
                        "min": 3
            },
            {
                        "n": 18,
                        "slug": "leccion-18",
                        "title": "Errores típicos del módulo y cómo se arreglan",
                        "blurb": "Casi todos los errores de PyTorch de este tramo son de dos familias: formas y tipos , más un tercer grupo de gradientes .",
                        "min": 3
            },
            {
                        "n": 19,
                        "slug": "leccion-19",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 2, slug: "modulo-2",
          title: "Datasets, transformaciones y DataLoader",
          summary: "Cómo preparar y servir los datos a un modelo: clases Dataset, transforms y lotes con DataLoader.",
          tags: ["Dataset", "Transforms", "DataLoader", "Batch", "Shuffle"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "El camino de los datos hasta el modelo (y por qué en lotes)",
                        "blurb": "PyTorch no tiene un único objeto «datos».",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "La clase Dataset: un catálogo numerado",
                        "blurb": "Los nombres con doble guion bajo ( __len__ , __getitem__ ) son los métodos especiales de Python: no los llamas tú directamente, es Python quien los llama cuando usas len(...) o los corchetes.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Transformaciones: preparar cada muestra al sacarla",
                        "blurb": "En PyTorch una transformación es cualquier cosa «llamable»: recibe una muestra y devuelve la muestra transformada.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Imágenes: formatos y cómo cargarlas",
                        "blurb": "El número de canales es 1 en una imagen en escala de grises (modo PIL \"L\" ), 3 en una de color ( \"RGB\" : rojo, verde, azul) y 4 si tiene transparencia ( \"RGBA\" ).",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "DataLoader: servir los datos en lotes",
                        "blurb": "batch_size es el número de muestras por lote (por defecto 1).",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Los lotes dentro del bucle de entrenamiento",
                        "blurb": "Todo entrenamiento en PyTorch tiene la misma forma: un bucle exterior por épocas y un bucle interior por lotes , y en cada lote el mismo ciclo de cinco pasos (el módulo 3 lo construirá completo con nn.Module y…",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Entrenamiento, validación y prueba: random_split y Subset",
                        "blurb": "random_split(dataset, lengths, generator=…) baraja los índices del dataset y los reparte en conjuntos del tamaño pedido.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Errores típicos de Dataset y DataLoader",
                        "blurb": "Y los errores silenciosos (los peores porque no dan mensaje): la validación con aumento (sección anterior), reshape en lugar de permute con las imágenes (experimento «De (alto, ancho, canal) a (canal, alto…",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 3, slug: "modulo-3",
          title: "Regresión lineal con PyTorch",
          summary: "Predicción, coste, descenso del gradiente, SGD y mini-batch, primero a mano y luego con nn.Module, optimizadores y regresión múltiple.",
          tags: ["Predicción", "MSE", "Gradient Descent", "SGD", "Mini-batch", "nn.Linear", "Múltiple"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "La regresión lineal, vista desde PyTorch",
                        "blurb": "Entrenar un modelo en PyTorch son siempre las mismas cuatro piezas, da igual que el modelo sea una recta o una red con millones de parámetros:",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Predecir con tensores: de w * x + b a nn.Linear",
                        "blurb": "La recta es una multiplicación y una suma.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "El coste: MSE a mano, nn.MSELoss y la superficie del coste",
                        "blurb": "\\( n \\) es el número de muestras; \\( \\sum \\) suma desde la primera hasta la última; \\( \\hat{y}_i - y_i \\) es el error de la muestra \\( i \\) (positivo si el modelo se pasa, negativo si se queda corto); al…",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "La pendiente del paisaje: gradientes a mano y con autograd",
                        "blurb": "Derivando el MSE respecto a cada parámetro (con la regla de la cadena: la derivada de \\( (\\hat{y}-y)^2 \\) es \\( 2(\\hat{y}-y) \\) por la derivada de \\( \\hat{y} \\), que es \\( x \\) para \\( w \\) y 1 para \\( b \\))…",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Descenso del gradiente a mano: el bucle de verdad",
                        "blurb": "El descenso del gradiente ( gradient descent ) es repetir muchas veces estos cinco pasos.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Dejar que PyTorch haga el trabajo: nn.Module , MSELoss y optim.SGD",
                        "blurb": "Cada línea del bucle a mano tiene su pieza en PyTorch:",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Batch, mini-batch y SGD con DataLoader",
                        "blurb": "El gradiente del coste es un promedio sobre las muestras.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Elegir el learning rate, y entrenar / validar / probar",
                        "blurb": "Con un solo parámetro y un cuenco de curvatura \\( \\lambda \\), cada paso del descenso multiplica la distancia al fondo por \\( (1 - lr\\cdot\\lambda) \\).",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Regresión múltiple y varias salidas",
                        "blurb": "La regresión lineal múltiple suma una contribución por variable:",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Evaluar con datos nuevos y guardar el modelo",
                        "blurb": "En cada época se ajusta con train y se mide en validation (sin mover los parámetros).",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Errores típicos, con su mensaje real",
                        "blurb": "Casi todos los problemas de este módulo caen en seis familias.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 4, slug: "modulo-4",
          title: "Regresión logística con PyTorch",
          summary: "Clasificar en dos clases: la sigmoide, la entropía cruzada y el bucle de entrenamiento completo.",
          tags: ["Sigmoide", "Umbral", "Cross-entropy", "BCE", "nn.Sequential"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "De la recta a la probabilidad: lo que ya sabes y lo que cambia",
                        "blurb": "Durante todo el módulo usaremos un conjunto de datos diminuto para poder hacer las cuentas a mano: los días sin abrir la app de 14 usuarios de una plataforma de streaming como Netflix (cifras inventadas para…",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "El modelo en PyTorch: nn.Linear + nn.Sigmoid",
                        "blurb": "Casi todos los errores de PyTorch son de forma ( shape ) o de tipo ( dtype ), así que conviene fijarlas desde el principio.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "¿Por qué no usar MSE? El gradiente que se aplana",
                        "blurb": "Fijémonos en un solo usuario y en la pérdida en función de la puntuación \\( z \\).",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Entropía cruzada binaria (BCE): la pérdida que sí sirve",
                        "blurb": "Para un usuario, el modelo da una probabilidad \\( p \\) de que cancele.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "BCELoss o BCEWithLogitsLoss: logits y estabilidad numérica",
                        "blurb": "Se llama logit a la puntuación \\( z = wx + b \\) antes de aplicarle la sigmoide.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "El bucle de entrenamiento, un paso a mano y el learning rate",
                        "blurb": "Es el mismo bucle del módulo 3, palabra por palabra; solo han cambiado el modelo y la pérdida.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Evaluar: del número p a la decisión, accuracy y matriz de confusión",
                        "blurb": "El modelo no dice «cancelará», dice «cancelará con probabilidad 0.57».",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Dos variables: la frontera es una recta (y por qué hay que estandarizar)",
                        "blurb": "Solo cambia el primer argumento: nn.Linear(2, 1) .",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Mini-batches con DataLoader",
                        "blurb": "En PyTorch se hace con dos clases de torch.utils.data : TensorDataset(X, y) empareja cada fila de X con su etiqueta, y DataLoader(dataset, batch_size=, shuffle=) reparte los datos en lotes, barajándolos en…",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "El límite de una neurona: la frontera siempre es recta",
                        "blurb": "El fragmento 18 usa make_circles de scikit-learn (400 puntos: un círculo pequeño de la clase 1 dentro de uno grande de la clase 0).",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Errores típicos, con los mensajes reales",
                        "blurb": "El fragmento 19 provoca ocho errores a propósito y copia los mensajes que devuelve la versión instalada (PyTorch 2.14.1).",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 5, slug: "modulo-5",
          title: "Softmax y clasificación multiclase",
          summary: "Más de dos clases: función softmax, entrenamiento con CrossEntropyLoss y clasificación de dígitos.",
          tags: ["Softmax", "Argmax", "CrossEntropyLoss", "Multiclase", "Dígitos"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "De dos clases a K clases: una neurona por clase",
                        "blurb": "Con \\( K \\) clases la respuesta del modelo ya no es un número («la probabilidad de ser un 1»), sino un reparto de confianza entre \\( K \\) opciones : «un 70 % de que el tráiler es de acción, un 20 % de que es…",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "La softmax, paso a paso",
                        "blurb": "Primero lo ingenuo: dividir cada número entre la suma.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Cuando la exponencial se desborda: restar el máximo y log-sum-exp",
                        "blurb": "Los números de float32 (los que usa PyTorch por defecto) llegan como máximo a unos \\( 3{,}4\\cdot 10^{38} \\).",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "De probabilidades a una pérdida: la entropía cruzada y su gradiente",
                        "blurb": "La idea es la de la sorpresa .",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "nn.CrossEntropyLoss : qué espera, qué hace y sus opciones",
                        "blurb": "Hay otra forma de dar el objetivo, más reciente: un tensor float de forma (N, K) con una distribución de probabilidad por muestra (por ejemplo, un one-hot ya convertido a decimales o etiquetas «suavizadas»).",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Errores de forma y de tipo: el mensaje y el arreglo",
                        "blurb": "La pérdida y el modelo comprueban la forma ( shape ) y el tipo ( dtype ) de los tensores.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Los datos: dígitos escritos a mano (y la verdad sobre MNIST)",
                        "blurb": "Hasta aquí los tráilers tenían solo 2 rasgos inventados.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "El modelo: una sola capa nn.Linear(64, 10) y lo que aprende",
                        "blurb": "La regresión softmax (también llamada regresión logística multinomial ) es la capa lineal de la primera sección con la pérdida de la sección anterior.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Entrenar: la pérdida inicial, un paso a mano y el bucle completo",
                        "blurb": "Con los pesos iniciales aleatorios y pequeños, los diez logits son casi iguales, la softmax reparte casi a partes iguales (\\( \\approx 1/10 \\) cada clase) y la pérdida es \\( \\approx \\ln 10 = 2{,}3026 \\); el…",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Evaluar: accuracy, matriz de confusión y mirar los errores",
                        "blurb": "Con torch.no_grad() y el modelo en eval() se obtienen los logits del test; su argmax(dim=1) es la clase predicha y la softmax da la confianza.",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Softmax o sigmoide: multiclase frente a multi-etiqueta",
                        "blurb": "La softmax obliga a elegir : sus probabilidades suman 1, así que si una sube, las otras bajan.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "De los dígitos 8×8 a MNIST, y guardar el modelo",
                        "blurb": "El fragmento 22 (sí se ejecuta) comprueba las formas con un lote falso de 100 imágenes aleatorias de \\( 1\\times 28\\times 28 \\): nn.Flatten() las convierte en (100, 784) igual que view(100, -1) , el modelo…",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Cierre del Curso 4: el mismo molde cinco veces",
                        "blurb": "Los tres modelos del curso son la misma pieza (una capa lineal) con tres cabezas distintas.",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]}
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
          tags: ["Capa oculta", "Activaciones", "XOR", "nn.Module", "Neuronas"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Una neurona dibuja una recta (y eso no basta)",
                        "blurb": "En el ejemplo de Netflix, las dos entradas valen 1 si has visto la película y 0 si no: \\( x_1 \\) es «¿has visto Toy Story ?» y \\( x_2 \\) es «¿has visto Shrek ?».",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "La capa oculta: dos rectas y una decisión sobre ellas",
                        "blurb": "Se llama capa oculta a la que está entre la entrada y la salida.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "nn.Linear: una capa entera en una línea",
                        "blurb": "Esa tabla de resultados es la matriz \\( Z \\) de un lote.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Funciones de activación en PyTorch",
                        "blurb": "Piensa en \\( z \\) como las ganas brutas que tiene un usuario de ver una película: pueden ser muy altas, cero o incluso negativas («ni de regalo»).",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Construir la red: nn.Module y nn.Sequential",
                        "blurb": "Cuando la red es una cadena recta («sale de una capa y entra en la siguiente»), nn.Sequential te ahorra la clase:",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "La capa de salida y la pérdida: qué combinación para cada problema",
                        "blurb": "Una predicción «de verdad» (probabilidades o clases) se obtiene después : torch.sigmoid(logit) o torch.softmax(logits, dim=1) , y las clases con logit > 0 o argmax(dim=1) .",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Entrenar la red: el bucle, un paso a mano y por qué a veces se atasca",
                        "blurb": "Seguimos con la red 2-2-1 (sigmoides) y el mismo usuario, \\( \\mathbf{x} = (1, 2) \\), que sí terminó la serie (\\( y = 1 \\)).",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "La frontera de decisión y cuántas neuronas necesitas",
                        "blurb": "Con \\( H \\) rectas en el plano, en el mejor caso (ninguna paralela ni tres que se crucen en el mismo punto) el número máximo de regiones es:",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Sigmoide, tanh, ReLU o LeakyReLU: qué cambia al entrenar",
                        "blurb": "El fragmento 11 entrena la misma red 2-8-1 con las cuatro activaciones sobre dos lunas (400 puntos, ruido 0.2), con SGD sin momentum, y promedia 5 semillas (cada activación usa las mismas 5).",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "Más de dos clases: K neuronas de salida",
                        "blurb": "Con una capa oculta, la red es \\( D_{in}\\text{-}H\\text{-}K \\): la capa oculta es igual que siempre y la última capa tiene una neurona por clase ( nn.Linear(H, K) : pesos de forma \\( (K, H) \\), una fila por…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Dígitos: una red 64-16-10 de verdad",
                        "blurb": "Una imagen de 8×8 es una cuadrícula de 64 números, como una mini-carátula en blanco y negro con 64 casillas.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Errores típicos y chuleta de equivalencias",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 2, slug: "modulo-2",
          title: "Redes profundas y técnicas de entrenamiento",
          summary: "Backpropagation, gradientes que se desvanecen, dropout, inicialización de pesos, momentum y batch normalization.",
          tags: ["Backpropagation", "Dropout", "Inicialización", "Momentum", "BatchNorm", "Optimizadores"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Redes profundas: más capas, un solo bloque de código",
                        "blurb": "Una red profunda ( deep network ) es una red con varias capas ocultas apiladas.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Backpropagation a mano con la regla de la cadena",
                        "blurb": "Es un mini recomendador (cifras inventadas para el ejemplo).",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Cómo lo hace PyTorch: el grafo de autograd",
                        "blurb": "Cada vez que haces una operación con un tensor que tiene requires_grad=True , PyTorch apunta en el resultado qué operación lo creó ( grad_fn ) y de qué tensores venía.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Gradientes que se desvanecen (y que explotan): medirlos capa por capa",
                        "blurb": "En la sección de backpropagation viste que cada capa multiplica el gradiente por sus pesos y por la derivada de su activación.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Inicialización de pesos: que la señal no se apague ni se sature",
                        "blurb": "¿Por qué no ceros?",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Dropout: apagar neuronas al azar para que no memoricen",
                        "blurb": "En cada paso de entrenamiento, nn.Dropout(p) apaga cada activación con probabilidad \\( p \\) (la pone a 0) y multiplica las que sobreviven por \\( 1/(1-p) \\) :",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Momentum y Nesterov: darle memoria al descenso",
                        "blurb": "\\( g_t \\) es el gradiente de este paso, \\( v_t \\) la velocidad (en PyTorch se llama momentum buffer ), \\( \\mu \\) (casi siempre 0,9) es cuánto se conserva de la velocidad anterior y \\( lr \\) es el learning rate.",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Batch normalization: normalizar lo que ve cada capa",
                        "blurb": "Para cada característica, con los \\( N \\) valores del lote:",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Optimizadores adaptativos: RMSprop, Adam y planificadores del learning rate",
                        "blurb": "\\( s_t \\) es una media móvil de \\( g^2 \\) (el «tamaño típico» del gradiente al cuadrado); \\( \\alpha \\) (0,99 por defecto en PyTorch) dice cuánta memoria tiene; \\( \\varepsilon=10^{-8} \\) evita dividir entre…",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "La receta completa: qué aporta cada pieza",
                        "blurb": "El fragmento 15 monta una red profunda configurable (6 capas ocultas de 64 neuronas, nn.ModuleList de bloques Linear → BatchNorm → ReLU → Dropout ) y la entrena sobre los dígitos con seis recetas que añaden…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Chuleta: síntoma, causa probable y remedio",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 3, slug: "modulo-3",
          title: "Redes convolucionales con PyTorch",
          summary: "Convolución, canales, pooling y CNN completas para imágenes, con las cuentas de tamaños que hay que dominar.",
          tags: ["Conv2d", "Canales", "MaxPool", "CNN", "Imágenes"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Por qué una CNN, y qué cambia al pasar de Keras a PyTorch",
                        "blurb": "Todo eso sigue valiendo.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "El formato de las imágenes: NCHW frente a NHWC",
                        "blurb": "Un lote de imágenes es un tensor de 4 dimensiones.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "La convolución a mano y con F.conv2d",
                        "blurb": "En PyTorch hay dos formas de llamar a la operación:",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "nn.Conv2d : sus argumentos, su tensor de pesos y varios canales",
                        "blurb": "La firma completa de la capa es:",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Stride, padding, dilation y el tamaño de la salida",
                        "blurb": "La dilatación ( dilation , que ya viste en el Curso 3 ) separa los puntos del filtro: con dilation=2 un kernel 3×3 toca píxeles alternos y cubre una zona de 5×5 con los mismos 9 pesos.",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Activación y pooling: nn.ReLU , nn.MaxPool2d y compañía",
                        "blurb": "Una idea importante del módulo que aprenderás mediante un ejemplo concreto.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "De mapas a vector: nn.Flatten y el in_features de la capa lineal",
                        "blurb": "Después de las convoluciones y los pooling, el tensor sigue siendo (N, C, H, W).",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Una CNN completa, capa a capa: formas, parámetros y el «resumen» con hooks",
                        "blurb": "El patrón de casi todas las CNN pequeñas es el mismo y se repite: convolución → ReLU → pooling , tantas veces como haga falta; después, aplanar y una o dos capas lineales.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "Entrenar la CNN: Dataset, DataLoader y el bucle de siempre",
                        "blurb": "Los cursos originales usan MNIST (60.000 imágenes de 28×28 que se descargan de internet) reducida a 16×16 con transforms.Resize((16, 16)) y ToTensor() .",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "nn.BatchNorm2d: normalizar cada canal",
                        "blurb": "\\( x \\) es un valor del canal \\( c \\); \\( \\mu_c \\) y \\( \\sigma_c^2 \\) son la media y la varianza de ese canal sobre todo el lote (se suman \\( N\\cdot H\\cdot W \\) valores, no \\( N \\)); \\( \\varepsilon=10^{-5} \\)…",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "¿Reconoce el dígito si se mueve? Equivarianza, invariancia y data augmentation",
                        "blurb": "Hay que separar dos propiedades.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Mirar dentro de la red: mapas de características y filtros",
                        "blurb": "Los hooks que ya usaste para el resumen sirven también para guardar la salida de una capa .",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "Los errores de forma más frecuentes, y cómo leerlos",
                        "blurb": "La mayoría de los fallos de una CNN son de forma o de tipo .",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Chuleta del módulo",
                        "blurb": "Y las diferencias de Keras que más tiempo hacen perder: padding por defecto 0 en PyTorch ( \"valid\" en Keras), canal de entrada que tú escribes, activaciones como capas aparte, MaxPool2d(k) con stride \\( k \\)…",
                        "min": 3
            },
            {
                        "n": 15,
                        "slug": "leccion-15",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]},
        {
          n: 4, slug: "modulo-4",
          title: "Modelos preentrenados y TorchVision",
          summary: "Reutilizar redes ya entrenadas: TorchVision, transfer learning, congelar capas y cambiar la última capa.",
          tags: ["TorchVision", "Transfer learning", "ResNet", "Congelar capas", "GPU"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Por qué reutilizar una red ya entrenada",
                        "blurb": "Una red convolucional ( CNN ) aprende en capas.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "TorchVision: modelos, pesos y la nueva forma de pedirlos",
                        "blurb": "TorchVision es la librería de visión que acompaña a PyTorch.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Por dentro de una ResNet-18",
                        "blurb": "La ResNet ( Red Residual ) es la familia de redes más usada para transfer learning por su equilibrio entre tamaño y calidad.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "El bloque residual: por qué ResNet puede ser profunda",
                        "blurb": "Un bloque normal calcula \\( y = F(x) \\), donde \\( F \\) son las convoluciones del bloque.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "El preprocesado de ImageNet: la red espera números muy concretos",
                        "blurb": "Una red preentrenada se entrenó viendo imágenes de una forma muy concreta: todas del mismo tamaño y con los valores de los píxeles en una escala determinada, como un crítico que solo ha visto películas en…",
                        "min": 3
            },
            {
                        "n": 6,
                        "slug": "leccion-6",
                        "title": "Predecir con la red: eval() , no_grad() y softmax",
                        "blurb": "Fíjate en que eval() y no_grad() son cosas distintas que se suelen confundir: eval() cambia cómo se calcula la salida; no_grad() cambia si se guarda lo necesario para derivar.",
                        "min": 3
            },
            {
                        "n": 7,
                        "slug": "leccion-7",
                        "title": "Congelar, sustituir la última capa y entrenar solo la cabeza",
                        "blurb": "Cada parámetro de PyTorch lleva un interruptor, requires_grad .",
                        "min": 3
            },
            {
                        "n": 8,
                        "slug": "leccion-8",
                        "title": "Ajuste fino ( fine-tuning ): afinar el cuerpo con learning rate bajo",
                        "blurb": "El ajuste fino ( fine-tuning ) consiste en descongelar las últimas etapas del cuerpo y entrenarlas junto con la cabeza.",
                        "min": 3
            },
            {
                        "n": 9,
                        "slug": "leccion-9",
                        "title": "BatchNorm al congelar: la trampa de las estadísticas",
                        "blurb": "No del todo.",
                        "min": 3
            },
            {
                        "n": 10,
                        "slug": "leccion-10",
                        "title": "CPU o GPU: device y .to()",
                        "blurb": "Los números de un tensor se guardan en la memoria de un dispositivo : la CPU (memoria RAM del ordenador) o una GPU ( cuda en tarjetas NVIDIA, mps en los Mac con chip de Apple).",
                        "min": 3
            },
            {
                        "n": 11,
                        "slug": "leccion-11",
                        "title": "Guardar y cargar: state_dict",
                        "blurb": "Un state_dict es un diccionario de Python que asocia el nombre de cada tensor del modelo con su valor: \"conv1.weight\" , \"bn1.running_mean\" , \"fc.bias\" … Contiene los parámetros y los buffers de BatchNorm.",
                        "min": 3
            },
            {
                        "n": 12,
                        "slug": "leccion-12",
                        "title": "Nuestro experimento: ¿ayuda de verdad el preentrenamiento?",
                        "blurb": "Sí: construimos nuestro propio «ImageNet de bolsillo» con los dígitos de 8×8 de load_digits (los mismos del Curso 3, sin internet), como en el proyecto de Keras.",
                        "min": 3
            },
            {
                        "n": 13,
                        "slug": "leccion-13",
                        "title": "La receta completa y la chuleta de errores",
                        "blurb": "Todo lo del módulo, en el orden en que lo harías con tus propias carátulas:",
                        "min": 3
            },
            {
                        "n": 14,
                        "slug": "leccion-14",
                        "title": "Repaso activo y evaluación del módulo",
                        "blurb": "Repasa los conceptos y resuelve el cuestionario completo del módulo.",
                        "min": 3
            }
]}
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
          tags: ["Carga en memoria", "Generadores", "Data augmentation", "ImageDataGenerator", "Dataset y DataLoader", "Keras vs PyTorch"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Una imagen es un tensor; una carpeta es un dataset",
                        "blurb": "Primero aprendemos a representar una foto y una etiqueta. Sin datos bien organizados, no hay modelo fiable.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Keras carga por lotes sin llenar la memoria",
                        "blurb": "En un dataset grande, lo importante es cargar y procesar solo el siguiente grupo de imágenes.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "PyTorch separa Dataset y DataLoader",
                        "blurb": "Dataset sabe buscar una imagen; DataLoader sabe agruparlas y entregarlas.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Data augmentation: más variedad sin nuevas fotos",
                        "blurb": "Girar o recortar ligeramente puede ayudar a generalizar, pero solo si conserva la etiqueta.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "La lista de comprobación antes de entrenar",
                        "blurb": "Dos frameworks distintos deben recibir la misma información y las mismas clases.",
                        "min": 3
            }
]},
        {
          n: 2, slug: "modulo-2",
          title: "Desarrollo de modelos CNN en Keras y PyTorch",
          summary: "Construir, entrenar y evaluar un clasificador CNN para el mismo problema en los dos frameworks, y comparar resultados, tiempos y despliegue.",
          tags: ["CNN", "Keras", "PyTorch", "Entrenamiento", "Evaluación", "Comparación"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Una CNN comparte filtros en toda la imagen",
                        "blurb": "Un filtro pequeño detecta el mismo patrón sin aprender una regla distinta para cada píxel.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Construir una CNN con Keras, capa a capa",
                        "blurb": "En Keras declaras el camino de la imagen y configuras cómo se entrenará.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "La misma CNN con PyTorch",
                        "blurb": "La idea matemática es idéntica, pero PyTorch explicita más detalles de tensores y entrenamiento.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Entrenar: fit en Keras y el bucle explícito en PyTorch",
                        "blurb": "Forward, loss, backward y actualización son los mismos pasos bajo dos estilos distintos.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Evaluación: una sola cifra puede engañarte",
                        "blurb": "Compara ambos modelos en el mismo TEST y examina qué clases les cuesta reconocer.",
                        "min": 3
            }
]},
        {
          n: 3, slug: "modulo-3",
          title: "Vision Transformers y transfer learning",
          summary: "Qué es un Vision Transformer, cómo aplicar transfer learning con uno en Keras y en PyTorch, y cómo integrarlo con una CNN y comparar.",
          tags: ["ViT", "Parches", "Transfer learning", "Fine-tuning", "CNN + ViT", "Comparación"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "ViT convierte imágenes en parches y tokens",
                        "blurb": "Un Vision Transformer procesa la imagen como una secuencia de regiones pequeñas.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Atención y posición: el ViT relaciona regiones",
                        "blurb": "El mismo parche visual puede significar algo distinto según su posición y sus vecinos.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "ViT preentrenado con KerasHub",
                        "blurb": "Reutiliza un Vision Transformer entrenado en imágenes grandes y adapta su cabeza a dos clases.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "ViT preentrenado con TorchVision",
                        "blurb": "En PyTorch puedes cambiar la cabeza final y entrenar solo los parámetros nuevos.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "CNN y ViT: elegir con pruebas, no por moda",
                        "blurb": "Una arquitectura es una hipótesis: compárala bajo las mismas condiciones.",
                        "min": 3
            }
]},
        {
          n: 4, slug: "modulo-4",
          title: "Presentación del proyecto final",
          summary: "Cómo resumir todo el proyecto, qué métricas y gráficas enseñar, cómo justificar la elección del framework y qué viene después.",
          tags: ["Resumen del proyecto", "Métricas", "Gráficas", "Justificación", "Próximos pasos"]
        ,
          lessons: [
            {
                        "n": 1,
                        "slug": "leccion-1",
                        "title": "Contar el proyecto como una historia reproducible",
                        "blurb": "Una buena presentación no empieza por el código: empieza por el problema y la decisión.",
                        "min": 3
            },
            {
                        "n": 2,
                        "slug": "leccion-2",
                        "title": "Presentar métricas con una matriz de confusión",
                        "blurb": "No basta con decir «accuracy 70 %»: explica qué errores comete el modelo.",
                        "min": 3
            },
            {
                        "n": 3,
                        "slug": "leccion-3",
                        "title": "Curvas de entrenamiento: detectar sobreajuste",
                        "blurb": "Dos curvas cuentan si la red está aprendiendo patrones o memorizando TRAIN.",
                        "min": 3
            },
            {
                        "n": 4,
                        "slug": "leccion-4",
                        "title": "Justificar Keras o PyTorch según el proyecto",
                        "blurb": "No hay ganador universal: escoge según control, ecosistema y necesidades reales.",
                        "min": 3
            },
            {
                        "n": 5,
                        "slug": "leccion-5",
                        "title": "Tu entrega final: resultados, límites y próximos pasos",
                        "blurb": "El proyecto está completo cuando otra persona puede entender, reproducir y cuestionar tus resultados.",
                        "min": 3
            }
]}
      ]
    }
  ],

  upcoming: null
};

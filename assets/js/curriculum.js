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
          tags: ["IA · ML · DL", "Features y target", "Ciclo de vida", "Pandas", "NaN y outliers", "Escalado", "One-Hot", "Generalización"]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Regresión lineal y logística",
          summary: "Predecir números con una recta (y con curvas) y predecir categorías con probabilidades. Aprender = bajar una montaña llamada «coste».",
          tags: ["Regresión simple", "Múltiple", "Polinómica", "MAE · MSE · RMSE · R²", "Sigmoide", "Gradient Descent", "SGD"]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Modelos de clasificación y ensembles",
          summary: "Árboles, vecinos, márgenes, probabilidades y comités de modelos: cómo piensa cada algoritmo y cuándo conviene cada uno.",
          tags: ["Árboles", "KNN", "SVM", "Naive Bayes", "Bias–Variance", "Random Forest", "Boosting", "XGBoost"]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Aprendizaje no supervisado",
          summary: "Encontrar estructura en datos sin respuestas: grupos, anomalías y mapas con menos dimensiones.",
          tags: ["K-Means", "Jerárquico", "DBSCAN", "HDBSCAN", "PCA", "t-SNE", "UMAP"]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Evaluar y validar modelos",
          summary: "Cómo saber si un modelo funciona de verdad: separar datos, métricas que no engañan, validación cruzada, regularización y fugas de datos.",
          tags: ["Train/Test", "Matriz de confusión", "Precision · Recall · F1", "ROC-AUC", "Cross-validation", "Ridge · Lasso", "Data leakage", "GridSearchCV"]
        },
        {
          n: 6, slug: "modulo-6",
          title: "Proyecto final: de los datos a la decisión",
          summary: "Todo el curso en un único flujo: el proyecto de lluvia en Australia y un caso completo de plataforma de streaming con clasificación, regresión, clusters y recomendación.",
          tags: ["Pipeline", "ColumnTransformer", "GridSearchCV", "Matriz de confusión", "Feature importance", "StreamFlix"]
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
          tags: ["Neurona", "Pesos y bias", "ReLU · Sigmoide · Softmax", "Forward", "Loss", "Backpropagation", "Adam", "Vanishing gradient"]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Keras: regresión y clasificación con redes densas",
          summary: "TensorFlow, PyTorch y Keras. Construir, compilar, entrenar y usar una red con Sequential para predecir números y categorías.",
          tags: ["TensorFlow · PyTorch · Keras", "Sequential · Dense", "compile · fit · predict", "One-Hot", "Crossentropy", "Shallow vs Deep"]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Redes convolucionales (CNN)",
          summary: "Cómo una red «ve» imágenes: filtros, stride, mapas de características, pooling y las cuentas de tamaños que hay que saber hacer.",
          tags: ["Imagen RGB", "Filtros", "Stride", "Feature maps", "Max Pooling", "Flatten", "Conv2D"]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Secuencias y atención: RNN, LSTM y Transformers",
          summary: "Datos donde el orden importa: memoria recurrente, LSTM y la idea que cambió la IA: la atención.",
          tags: ["RNN", "LSTM", "Tokens y embeddings", "Posición", "Self-attention", "Q · K · V", "GPT"]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Autoencoders, modelos preentrenados y proyecto final",
          summary: "Comprimir y reconstruir datos, reutilizar el conocimiento de VGG16 con transfer learning y fine-tuning, y el proyecto de daños en aviones.",
          tags: ["Autoencoder", "Denoising", "VGG16", "Transfer learning", "Fine-tuning", "ImageDataGenerator", "BLIP"]
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
          tags: ["Tensores", "API funcional", "Subclassing", "Capas personalizadas", "Modelos personalizados", "TensorFlow 2.x"]
        },
        {
          n: 2, slug: "modulo-2",
          title: "CNN avanzadas",
          summary: "Redes convolucionales para problemas reales: más datos con augmentation, transfer learning bien hecho y la convolución transpuesta.",
          tags: ["Arquitecturas CNN", "Data augmentation", "Transfer learning", "Convolución transpuesta"]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Transformers en Keras",
          summary: "Construir un Transformer pieza a pieza y aplicarlo a series temporales y a generación de texto.",
          tags: ["Datos secuenciales", "Series temporales", "Atención multi-cabeza", "Generación de texto"]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Aprendizaje no supervisado y modelos generativos",
          summary: "Modelos que crean datos nuevos: autoencoders variacionales, modelos de difusión y GANs.",
          tags: ["Autoencoders", "Difusión", "GAN", "Generador y discriminador"]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Técnicas avanzadas de Keras",
          summary: "Controlar el entrenamiento: bucles personalizados con GradientTape, ajuste de hiperparámetros con Keras Tuner y optimización de modelos.",
          tags: ["Custom training loop", "GradientTape", "Callbacks", "Keras Tuner", "Optimización"]
        },
        {
          n: 6, slug: "modulo-6",
          title: "Aprendizaje por refuerzo",
          summary: "Agentes que aprenden por prueba y error: Q-learning, la ecuación de Bellman y Deep Q-Networks.",
          tags: ["Agente y entorno", "Recompensa", "Q-learning", "Bellman", "DQN"]
        },
        {
          n: 7, slug: "modulo-7",
          title: "Proyecto final",
          summary: "Un modelo de regresión avanzado en Keras y un clasificador de imágenes con transfer learning.",
          tags: ["Regresión avanzada", "Transfer learning", "Clasificación de imágenes", "Evaluación"]
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
          tags: ["Tensores 1D y 2D", "Operaciones", "NumPy ↔ PyTorch", "Derivadas", "requires_grad", "backward"]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Datasets, transformaciones y DataLoader",
          summary: "Cómo preparar y servir los datos a un modelo: clases Dataset, transforms y lotes con DataLoader.",
          tags: ["Dataset", "Transforms", "DataLoader", "Batch", "Shuffle"]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Regresión lineal con PyTorch",
          summary: "Predicción, coste, descenso del gradiente, SGD y mini-batch, primero a mano y luego con nn.Module, optimizadores y regresión múltiple.",
          tags: ["Predicción", "MSE", "Gradient Descent", "SGD", "Mini-batch", "nn.Linear", "Múltiple"]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Regresión logística con PyTorch",
          summary: "Clasificar en dos clases: la sigmoide, la entropía cruzada y el bucle de entrenamiento completo.",
          tags: ["Sigmoide", "Umbral", "Cross-entropy", "BCE", "nn.Sequential"]
        },
        {
          n: 5, slug: "modulo-5",
          title: "Softmax y clasificación multiclase",
          summary: "Más de dos clases: función softmax, entrenamiento con CrossEntropyLoss y clasificación de dígitos.",
          tags: ["Softmax", "Argmax", "CrossEntropyLoss", "Multiclase", "Dígitos"]
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
          tags: ["Capa oculta", "Activaciones", "XOR", "nn.Module", "Neuronas"]
        },
        {
          n: 2, slug: "modulo-2",
          title: "Redes profundas y técnicas de entrenamiento",
          summary: "Backpropagation, gradientes que se desvanecen, dropout, inicialización de pesos, momentum y batch normalization.",
          tags: ["Backpropagation", "Dropout", "Inicialización", "Momentum", "BatchNorm", "Optimizadores"]
        },
        {
          n: 3, slug: "modulo-3",
          title: "Redes convolucionales con PyTorch",
          summary: "Convolución, canales, pooling y CNN completas para imágenes, con las cuentas de tamaños que hay que dominar.",
          tags: ["Conv2d", "Canales", "MaxPool", "CNN", "Imágenes"]
        },
        {
          n: 4, slug: "modulo-4",
          title: "Modelos preentrenados y TorchVision",
          summary: "Reutilizar redes ya entrenadas: TorchVision, transfer learning, congelar capas y cambiar la última capa.",
          tags: ["TorchVision", "Transfer learning", "ResNet", "Congelar capas", "GPU"]
        }
      ]
    }
  ],

  upcoming: null
};

#!/usr/bin/env python3
"""Second pass: 3-minute, visual-first path for every short lesson.
Preserves the original explanation and demonstrations in optional disclosures.
Idempotent: never modify pages already converted.
"""
import re, html, json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]

# Each topic has a different real-world analogy, a manipulable visual scene,
# and TWO useful application questions (not 'what lesson is this?').
TOPICS={
 'regression':{
  'viz':'regression','title':'De una entrada a una predicción','do':'Mueve los pedidos: observa cómo cambia el tiempo de preparación.',
  'examples':[
   ('Cafetería','Si preparar un café tarda 2 minutos, 4 cafés llevan aproximadamente 8 minutos. Queremos predecir un número, no una categoría.'),
   ('Bicicletas','Si cada kilómetro añade 3 minutos de viaje, 5 km sumarían 15 minutos, sin contar paradas.'),
   ('Tienda','Una caja contiene 6 productos. Para 4 cajas estimarías 24 productos. Esta es una relación numérica sencilla.')],
  'q1':('Quieres estimar el precio de una casa usando sus metros cuadrados. ¿Qué tipo de salida esperas?',['Una cifra en euros','La clase «casa» o «piso»','Un grupo creado sin etiquetas'],0,'Es una regresión porque queremos estimar un valor numérico.'),
  'q2':('Si aumentas la entrada de un modelo cuya pendiente es positiva, ¿qué sucede normalmente con su predicción?',['Disminuye necesariamente','Aumenta','Se convierte en texto'],1,'Una pendiente positiva representa una relación creciente.')},
 'classification':{
  'viz':'probability','title':'Del número a la decisión','do':'Modifica la confianza y observa qué cambia al cruzar el umbral.',
  'examples':[
   ('Correo','El detector de spam estima 80 % de probabilidad de spam. Con umbral del 50 %, la etiqueta sería «spam».'),
   ('Mascotas','Una aplicación estima 70 % de probabilidad de que una imagen sea de perro: clasifica como «perro» si el umbral es 50 %.'),
   ('Tienda','Un detector de fraude estima 10 % de riesgo. Con umbral del 50 %, no activa la alerta.')],
  'q1':('¿Cuál de estas salidas es una clasificación?',['Temperatura de mañana: 23,5 °C','Factura estimada: 42 €','¿El mensaje es spam?: sí / no'],2,'Clasificar significa decidir entre clases, por ejemplo spam y no spam.'),
  'q2':('Un sistema marca positivo si la probabilidad es al menos 50 %. Recibe 80 %. ¿Qué decide?',['Positivo','Negativo','No puede decidir porque es un porcentaje'],0,'80 % supera el umbral de 50 %.')},
 'grouping':{
  'viz':'clusters','title':'Descubre grupos que no estaban etiquetados','do':'Pulsa «Reagrupar» para ver cómo aparecen los grupos.',
  'examples':[
   ('Supermercado','Agrupas compras según cantidad y precio, sin haber escrito antes «cliente tipo A» ni «cliente tipo B».'),
   ('Mascotas','Tienes medidas de 100 perros sin indicar razas. Un algoritmo puede encontrar grupos de tamaños similares.'),
   ('Viajes','Agrupas destinos por clima y distancia; el algoritmo descubre similitudes sin etiquetas previas.')],
  'q1':('Dispones de medidas de 100 flores, pero no sabes sus especies. ¿Qué podrías intentar?',['Clustering para descubrir grupos','Calcular la accuracy contra etiquetas inexistentes','Entrenar un clasificador con respuestas que aún no tenemos'],0,'Sin etiquetas, agrupar por similitud es una opción natural.'),
  'q2':('Si cambias la cantidad de grupos solicitados, ¿qué puede pasar?',['Nada: los grupos son inmutables','La asignación de puntos puede cambiar','Todas las filas desaparecen'],1,'En algoritmos como K-Means, elegir otro K puede cambiar la distribución de ejemplos.')},
 'tree':{
  'viz':'tree','title':'Una decisión, paso a paso','do':'Prueba distintos valores y sigue el camino de la decisión.',
  'examples':[
   ('Riego','Un sensor decide: si la tierra está seca, regar; si está húmeda, esperar. Cada pregunta abre una rama.'),
   ('Envíos','Si un paquete pesa más de 5 kg, va a reparto especial; si no, va a reparto normal.'),
   ('Mascotas','Si un animal tiene plumas, seguimos una rama; si no, otra. Varias decisiones forman un árbol.')],
  'q1':('Un árbol pregunta «¿temperatura mayor de 30 °C?». Con 34 °C, ¿qué rama toma?',['La rama del sí','La rama del no','Ambas a la vez'],0,'34 supera 30; sigue la rama afirmativa.'),
  'q2':('¿Qué cambia al hacer un árbol mucho más profundo?',['Puede representar reglas más específicas','Elimina automáticamente el overfitting','Deja de necesitar datos'],0,'Más profundidad permite reglas más detalladas, aunque puede aumentar el sobreajuste.')},
 'data':{
  'viz':'data','title':'De datos imperfectos a datos útiles','do':'Pulsa «Preparar datos» y descubre qué se transforma.',
  'examples':[
   ('Veterinaria','De 5 mascotas falta el peso de una. Un dato ausente no equivale a 0 kg: hay que tratarlo.'),
   ('Tienda','La talla «M» es texto. Para ciertos algoritmos hay que codificarla en números sin inventar distancias.'),
   ('Tiempo','Una estación dejó de medir la lluvia un día. «Sin registro» y «0 mm» son cosas distintas.')],
  'q1':('En una tabla de temperatura aparece NaN. ¿Qué significa?',['La temperatura fue 0 °C','No hay valor registrado','La temperatura es muy alta'],1,'NaN representa un valor faltante, no cero.'),
  'q2':('¿Por qué conviene preparar los datos ANTES de entrenar?',['Para que el modelo reciba información coherente','Para garantizar un 100 % de aciertos','Para evitar siempre hacer pruebas'],0,'Las transformaciones y los datos faltantes afectan a lo que aprende el modelo.')},
 'split':{
  'viz':'split','title':'Entrenar no es examinar','do':'Cambia la proporción y observa qué ejemplos se reservan para el test.',
  'examples':[
   ('Examen','Practicas 8 ejercicios y guardas 2 sin mirar. Los dos reservados te dicen si sabes resolver casos nuevos.'),
   ('Mascotas','Con 100 fotos, puedes entrenar con 80 y reservar 20 que el modelo nunca ha visto.'),
   ('Tienda','Guardas pedidos de otro mes para comprobar si el modelo sigue funcionando fuera del entrenamiento.')],
  'q1':('Entrenas con 80 fotos. ¿Cuál es la mejor forma de medir si generaliza?',['Evaluarlo con esas mismas 80','Probarlo con fotos nuevas reservadas','Cambiar las etiquetas del test'],1,'TEST debe contener ejemplos no utilizados para entrenar.'),
  'q2':('¿Para qué sirve un conjunto de validación?',['Para elegir ajustes durante el desarrollo','Para ocultar errores al final','Para reemplazar las entradas de entrenamiento'],0,'Validación permite comparar y seleccionar configuraciones sin gastar el test final.')},
 'gradient':{
  'viz':'gradient','title':'Bajar el error, paso a paso','do':'Da pasos y mira cómo el punto se acerca al mínimo de la curva.',
  'examples':[
   ('Termostato','Ajustas la temperatura varias veces: mides cuánto te alejas de 21 °C y corriges hacia ese objetivo.'),
   ('Cocina','Pones demasiado azúcar y la próxima vez reduces la cantidad. Ajustas un parámetro usando el error.'),
   ('Reparto','Tu estimación se equivoca por 8 minutos. Ajustas el modelo con pequeños pasos, no de golpe.')],
  'q1':('Si el error baja después de un ajuste, ¿qué indica?',['Que ese ajuste mejoró el resultado medido','Que siempre generalizará perfectamente','Que se pueden ignorar los datos nuevos'],0,'La pérdida menor indica mejor ajuste para los datos en que se midió.'),
  'q2':('¿Qué riesgo tiene un learning rate demasiado grande?',['Puede saltarse el mínimo y oscilar','Siempre evita el sobreajuste','Convierte el modelo en clasificación'],0,'Pasos excesivos pueden impedir la convergencia.')},
 'neural':{
  'viz':'neural','title':'Señales que atraviesan una red','do':'Pulsa «Propagar» para seguir el recorrido de entradas a salida.',
  'examples':[
   ('Casa','Una neurona combina metros y habitaciones; cada dato tiene un peso y produce una salida.'),
   ('Mascotas','Una red combina tamaño, orejas y pelaje para distinguir patrones que no dependen de una sola regla.'),
   ('Gimnasio','Una red recibe horas de sueño y actividad; combina señales antes de calcular su predicción.')],
  'q1':('Una neurona recibe dos entradas. ¿Qué hace con los pesos?',['Multiplica cada entrada por su peso y combina resultados','Elige siempre la entrada mayor','Borra las entradas al entrenar'],0,'La suma ponderada combina entradas, pesos y bias antes de la activación.'),
  'q2':('¿Cuándo se actualizan los pesos de una red?',['Al aplicar el optimizador durante el entrenamiento','Cada vez que se abre la página','Nunca: los pesos son fijos'],0,'El optimizador utiliza los gradientes para ajustar parámetros durante el aprendizaje.')},
 'convolution':{
  'viz':'convolution','title':'Una ventana recorre la imagen','do':'Avanza el filtro 3×3; fíjate en qué píxeles observa cada vez.',
  'examples':[
   ('Fotografía','Un filtro 3×3 observa nueve posiciones cercanas y se desplaza para detectar bordes.'),
   ('Radiografía','La misma operación busca patrones locales en diferentes partes de una imagen médica.'),
   ('Mascotas','Para detectar orejas en una foto, un filtro busca formas locales aunque aparezcan en posiciones distintas.')],
  'q1':('Un kernel 3×3 se coloca sobre una foto. ¿Qué analiza primero?',['Nueve posiciones próximas de la imagen','Todas las fotografías del dataset a la vez','Solo la etiqueta final'],0,'El filtro procesa una región local y luego se desplaza.'),
  'q2':('¿Por qué compartir un filtro en distintas posiciones es útil?',['Porque permite buscar el mismo patrón en varias zonas','Porque hace innecesarias las imágenes','Porque siempre produce una sola clase'],0,'La convolución reutiliza los pesos del filtro en diferentes zonas.')},
 'sequence':{
  'viz':'sequence','title':'El orden también es información','do':'Avanza por la secuencia y mira cómo se añade el siguiente elemento.',
  'examples':[
   ('Frase','«El perro persigue al gato» no expresa lo mismo que «El gato persigue al perro». El orden cambia el significado.'),
   ('Lluvia','20 °C hoy y 15 °C mañana es una secuencia. Intercambiar los días cambia la historia.'),
   ('Pasos','100, 150 y 200 pasos por minuto expresan una tendencia distinta de 200, 150 y 100.')],
  'q1':('¿Por qué es importante el orden en una serie temporal?',['Porque intercambiar puntos puede cambiar el patrón','Porque reduce automáticamente los errores a cero','Porque las secuencias no contienen números'],0,'Las dependencias temporales forman parte de la información.'),
  'q2':('¿Cuál de estos datos es una secuencia?',['Temperatura diaria durante una semana','La altura de un único árbol','Un precio sin fecha ni contexto'],0,'Una secuencia contiene valores con orden significativo.')},
 'attention':{
  'viz':'attention','title':'Qué parte del contexto importa','do':'Selecciona otra palabra y observa qué conexiones destacan.',
  'examples':[
   ('Idioma','En «Ana dejó su mochila porque estaba cansada», el contexto ayuda a decidir a quién describe «cansada».'),
   ('Mascotas','En «el perro persigue la pelota y la atrapa», «la» se relaciona con «pelota».'),
   ('Mensajes','Un asistente considera varias palabras para interpretar «banco» como asiento o entidad financiera.')],
  'q1':('En «Fui al banco a retirar dinero», ¿qué ayuda a interpretar «banco»?',['El contexto «retirar dinero»','Solo la longitud de la palabra','Únicamente su primera letra'],0,'La atención permite relacionar términos y su contexto.'),
  'q2':('¿Qué busca un mecanismo de atención?',['Ponderar qué elementos de la entrada son relevantes','Borrar toda la información anterior','Convertir siempre imágenes en texto'],0,'La atención asigna importancia relativa a diferentes elementos del contexto.')},
 'evaluation':{
  'viz':'matrix','title':'Los aciertos y los errores tienen nombre','do':'Cambia el caso y comprueba qué celda de la matriz se ilumina.',
  'examples':[
   ('Alarma','La alarma sonó cuando no había humo: falso positivo. No sonó con humo: falso negativo.'),
   ('Spam','Un correo legítimo marcado como spam es un falso positivo si «spam» es la clase positiva.'),
   ('Lluvia','Predijiste «no llueve», pero llovió: falso negativo si «lluvia» es positivo.')],
  'q1':('Un detector dice «hay humo», pero no hay. ¿Qué error es?',['Falso positivo','Falso negativo','Verdadero positivo'],0,'Positivo predicho sin positivo real es un falso positivo.'),
  'q2':('Con muchas clases negativas, ¿por qué puede engañar la accuracy?',['Porque acertar solo la clase mayoritaria puede inflarla','Porque no existe en clasificación','Porque siempre es igual al recall'],0,'El porcentaje global puede ocultar un bajo recall de la clase importante.')},
 'compression':{
  'viz':'dimension','title':'Simplifica sin perder la idea','do':'Comprime la representación y descubre un dibujo más sencillo.',
  'examples':[
   ('Ropa','Tienes 50 medidas de prendas; una reducción dimensional permite representarlas con 2 ejes para explorar parecidos.'),
   ('Mascotas','De 100 rasgos de animales puedes buscar una representación breve que capture variaciones importantes.'),
   ('Productos','Reducir muchas características de artículos puede ayudar a visualizar familias similares.')],
  'q1':('Tienes 80 características y quieres visualizar relaciones en un plano. ¿Qué te puede ayudar?',['Reducción de dimensionalidad','Duplicar todas las columnas','Borrar todas las filas'],0,'Una proyección puede representar muchas características en menos dimensiones.'),
  'q2':('Al reducir dimensiones, ¿es posible perder información?',['Sí, puede haber pérdida','No, la información siempre se conserva toda','Solo si había tres filas'],0,'La reducción persigue retener lo relevante, pero puede descartar detalles.')},
 'generative':{
  'viz':'generative','title':'Del ruido a una estructura','do':'Avanza la transformación y observa cómo emerge un patrón.',
  'examples':[
   ('Dibujo','Un modelo generativo puede empezar con ruido y producir un dibujo que comparte patrones con los aprendidos.'),
   ('Texto','Un modelo puede generar la siguiente palabra a partir de palabras anteriores, una decisión detrás de otra.'),
   ('Diseño','Con ejemplos de diseños, un modelo puede crear variaciones nuevas sin copiar un ejemplo entero.')],
  'q1':('¿Qué distingue a un modelo generativo?',['Puede producir nuevas muestras aprendiendo patrones','Solo dibuja fronteras de decisión','Necesita predecir siempre el precio'],0,'Los modelos generativos intentan modelar datos para crear nuevas muestras.'),
  'q2':('En un proceso de difusión generativa, ¿qué suele aprender la red?',['A estimar y eliminar ruido progresivamente','A clasificar exclusivamente correos','A convertir todas las imágenes a blanco'],0,'Los modelos de difusión suelen aprender cómo invertir un proceso de añadir ruido.')},
 'transfer':{
  'viz':'transfer','title':'Reutilizar conocimiento previo','do':'Alterna entre «extraer características» y «ajustar capas».',
  'examples':[
   ('Mascotas','Una red que ya distingue formas puede adaptarse para reconocer gatos y perros con menos ejemplos.'),
   ('Vehículos','Reutilizas filtros entrenados en millones de fotos y cambias la última capa para detectar bicicletas.'),
   ('Plantas','Un modelo visual preentrenado puede servir de punto de partida para reconocer enfermedades en hojas.')],
  'q1':('Si reutilizas las capas visuales de un modelo ya entrenado, ¿qué técnica estás usando?',['Transfer learning','Clustering sin etiquetas','Regresión con una sola variable'],0,'El aprendizaje por transferencia aprovecha parámetros aprendidos antes.'),
  'q2':('¿Qué significa congelar una capa durante el entrenamiento?',['Sus pesos no se actualizan','Deja de producir salidas','Se elimina de la arquitectura'],0,'Congelar impide actualizar esos parámetros durante el ajuste.')},
 'pipeline':{
  'viz':'pipeline','title':'De los datos a una decisión útil','do':'Avanza por las etapas; ninguna se puede saltar sin comprobarla.',
  'examples':[
   ('Meteorología','Recoges humedad, limpias lecturas ausentes, entrenas y compruebas si aciertas días nuevos.'),
   ('Tienda','Un sistema pasa de pedidos históricos a una previsión, la evalúa y después la integra en la web.'),
   ('Mascotas','Ordenas fotos, entrenas, mides errores y explicas los límites antes de usar un clasificador.')],
  'q1':('¿Qué orden tiene sentido en un proyecto de ML?',['Preparar datos → entrenar → evaluar','Evaluar → inventar etiquetas → ignorar datos','Publicar → entrenar sin revisar resultados'],0,'La evaluación comprueba un modelo que se ha entrenado con datos preparados.'),
  'q2':('¿Qué conviene hacer antes de publicar un modelo?',['Evaluarlo con casos no vistos y documentar límites','Dar por hecho que siempre acierta','Eliminar las pruebas de validación'],0,'Hay que comprobar rendimiento y comunicar los riesgos.' )},
 'probability':{
  'viz':'softmax','title':'De puntuaciones a probabilidades','do':'Modifica una puntuación y compara las tres probabilidades.',
  'examples':[
   ('Mascotas','El clasificador devuelve gato 70 %, perro 20 % y conejo 10 %. Las probabilidades suman 100 %.'),
   ('Compras','Un detector asigna 60 % a «ropa», 30 % a «electrónica» y 10 % a «hogar».'),
   ('Plantas','Una foto recibe 10 % rosal, 70 % margarita y 20 % tulipán. La clase más probable es margarita.')],
  'q1':('El modelo asigna gato 70 %, perro 20 % y conejo 10 %. ¿Qué clase elegiría?',['Gato','Perro','Conejo'],0,'La clase con mayor probabilidad es gato.'),
  'q2':('En una softmax estándar, ¿cuánto suman las probabilidades de las clases?',['100 %','50 %','Puede ser cualquier número'],0,'Softmax normaliza las puntuaciones para que sumen 1 (100 %).')},
 'recommend':{
  'viz':'recommend','title':'Encuentra relaciones entre opciones','do':'Selecciona otra preferencia para observar cómo cambia la propuesta.',
  'examples':[
   ('Supermercado','Si muchas compras contienen pan y aceite, esta asociación puede inspirar una recomendación.'),
   ('Música','Si escuchas rock, el sistema puede comparar tus gustos con los de personas parecidas.'),
   ('Viajes','Quien visita museos puede recibir rutas culturales al consultar destinos parecidos.')],
  'q1':('Si las personas que compran café también compran filtros, ¿qué técnica puede detectar la relación?',['Reglas de asociación','Regresión para estimar metros','Descenso de gradiente sin datos'],0,'Las reglas de asociación buscan elementos que suelen aparecer juntos.'),
  'q2':('Un recomendador basado en vecinos compara principalmente…',['Usuarios o productos similares','El orden alfabético del nombre','Solo el archivo de instalación'],0,'La similitud permite sugerir opciones relacionadas.')}
}

ORDER=[
 ('probability',r'softmax|multiclase|crossentropy|cross.entropy|entrop[ií]a cruzada|logits|log.sum.exp'),
 ('evaluation',r'confusi[oó]n|precisi[oó]n|precision|recall|\bf1\b|roc|auc|\baccuracy\b|m[eé]trica|evaluaci[oó]n|\bmae\b|\brmse\b|\br²\b'),
 ('transfer',r'transfer|preentrenad|fine.tun|\bresnet\b|\bvgg\b|torchvision|imagenet|congelar|congelad|pesos pre'),
 ('generative',r'generativ|\bvae\b|difusi[oó]n|\bgan\b|\bruido\b|reparametriza|\bkl\b|muestra nueva'),
 ('attention',r'attention|atenci[oó]n|transformer|\btoken\b|\bqkv\b|\brag\b|\bllm\b|\bprompt\b|embeddings|\bgpt\b'),
 ('sequence',r'\brnn\b|\blstm\b|secuencia|series temporales|estado oculto|memoria a largo|temporales'),
 ('convolution',r'cnn|conv2d|convoluci[oó]n|\bkernel\b|pooling|stride|padding|filtro de imagen|p[ií]xel|rgb|imagen|fotograf[ií]a'),
 ('compression',r'\bpca\b|\bt.sne\b|\bumap\b|dimensional|autoencoder|bottleneck|latente|comprim|encoder|decoder'),
 ('recommend',r'recomenda|asociaci[oó]n|coocurrencia|carrito|compran junto'),
 ('grouping',r'clustering|\bk.means\b|\bdbscan\b|centroide|agrupa|jer[aá]rquico|\bepsilon\b|silhouette|grupos sin'),
 ('tree',r'[aá]rbol|\bknn\b|vecin|\bsvm\b|\bbayes\b|random.forest|\bbagging\b|\bboosting\b|\bxgboost\b|\bensemble\b|\bbias.variance\b|sobreajuste|overfitting'),
 ('classification',r'clasificaci[oó]n|log[ií]stica|sigmoide|\bumbral\b|binaria|\bthreshold\b'),
 ('split',r'train|\btest\b|validaci[oó]n|\bvalid\b|cross.validation|\bfolds?\b|stratif|partir los datos|divisi[oó]n'),
 ('gradient',r'gradient|gradiente|\badam\b|\bloss\b|learning.rate|\bcoste\b|p[eé]rdida|backprop|optimiza|descenso|m[ií]nimo'),
 ('regression',r'regresi[oó]n|\bols\b|pendiente|recta|residuo|polin[oó]m|\bmse\b'),
 ('neural',r'neurona|\bdense\b|linear|relu|activaci[oó]n|\bbias\b|\bepoch\b|\bbatch\b|\bforward\b|\bdropout\b|\blayer\b|\bnn.module\b|capas'),
 ('data',r'datos|dataset|\bnan\b|outlier|\bpandas\b|\bdataframe\b|tensor|preproces|escalado|\bone.hot\b|feature|etiqueta|\bshape\b|\bdtype\b|limpieza'),
 ('pipeline',r'proyecto|pipeline|aplicaci[oó]n|despliegue|producci[oó]n|guardar|cargar|inferenc|reproduc|document|presenta|publicar|curso|\bapi\b')
]

def classify(title,lead,c,m):
 s=(title+' '+lead).lower()
 # Match topic in actual lesson title first, so incidental mention in lead doesn't dominate.
 for name,rx in ORDER:
  if re.search(rx,title.lower()):return name
 for name,rx in ORDER:
  if re.search(rx,s):return name
 if c in (2,3,4,5):return 'neural'
 return 'pipeline'

def tidy(s):
 s=re.sub(r'\s+',' ',s).strip(); s=re.sub(r'\s+([,:;.!?])',r'\1',s)
 return s

def words(s):return len(re.findall(r'\b[\wáéíóúñü]+\b',s,re.U))

def independent(s):
 if not 25<=len(s)<=480:return False
 if words(s)<11:return False
 if re.match(r'^(no\.|sí\.|claro|depende|mira |eso |ya |en el módulo anterior|como hemos visto|aquí |fíjate|recuerda|primero lo ingenuo|la respuesta|para hacerlo|imagina el paso)',s.strip(),re.I):return False
 if s.count('\\(')>1:return False
 return True

def intro_from_html(sections,lead,title):
 options=[]
 for section in sections[:5]:
  for p in section.select('p')[:4]:
   if p.find_parent(['details','figure','article']):continue
   s=tidy(p.get_text(' ',strip=True))
   if independent(s):options.append(s)
 if independent(lead):options.insert(0,tidy(lead))
 if not options:return 'En esta lección descubrirás cómo funciona «'+title+'» con un caso sencillo. Observa el cambio en la demostración antes de elegir una respuesta.'
 s=options[0]
 if len(s)>345:
  fr=re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ¿¡])',s)
  out=''
  for sentence in fr:
   if words(out+' '+sentence)>63:break
   out+=(' ' if out else '')+sentence
  if out:s=out
  else:s=' '.join(s.split()[:64]).rstrip(',:;')+'…'
 if words(s)>71:s=' '.join(s.split()[:71]).rstrip(',:;')+'…'
 return s

def make_quiz(item, number,course,phase):
 q,opts,correct,why=item; shift=(number+course+phase)%3
 opts=opts[shift:]+opts[:shift];correct=(correct-shift)%3
 payload={'titulo':'Pausa rápida · '+('Comprueba la idea' if phase==0 else '¿Lo aplicarías?'), 'preguntas':[{'q':q,'opciones':opts,'correcta':correct,'porque':why}]}
 return '<section class="quiz mini micro-check" aria-label="Pregunta intercalada"><script type="application/json" class="quiz-data">'+json.dumps(payload,ensure_ascii=False).replace('</','<\\/')+'</script></section>'

N=0
for p in sorted(ROOT.glob('curso-*/modulo-*/leccion-*.html')):
 c=int(p.parts[-3].split('-')[-1]);m=int(p.parts[-2].split('-')[-1]);n=int(p.stem.split('-')[-1]);
 sou=BeautifulSoup(p.read_text(encoding='utf8'),'html.parser')
 page=sou.select_one('.page'); hero=page.select_one('.hero') if page else None
 if not hero or page.select_one('.micro-viz'): continue
 title=tidy(hero.select_one('h1').get_text(' ',strip=True)); lead=tidy(hero.select_one('.lead').get_text(' ',strip=True)) if hero.select_one('.lead') else ''
 topic=classify(title,lead,c,m);info=TOPICS[topic]
 # Preserve the full existing lesson body (including its original demo) as optional reading.
 deep=[]
 for child in list(page.children):
  if not getattr(child,'name',None):continue
  if child.name=='header' or child.name=='script':continue
  if child.name=='details' and 'predice' in child.get('class',[]):continue
  if child.name=='details' and 'profundizar' in child.get('class',[]):continue
  if child.name=='section' and 'quiz' in child.get('class',[]):continue
  if child.name=='nav' and 'modnav' in child.get('class',[]):continue
  if child.name=='div' and 'done-bar' in child.get('class',[]):continue
  deep.append(child)
 excerpt=intro_from_html(deep,lead,title)
 for part in deep:part.extract()
 orig_pred=page.select_one(':scope > details.predice')
 # Limit massive 'predict' questions to a single prompt, full source remains below.
 if orig_pred:
  summary=orig_pred.find('summary')
  if summary and words(summary.get_text(' ',strip=True))>42:
   summary.clear();summary.append('Antes de mirar el ejemplo: ¿qué crees que va a cambiar al mover los controles?')
  answer=orig_pred.select_one('div > p')
  if answer and words(answer.get_text(' ',strip=True))>36:
   answer.string= 'Haz una predicción, compruébala en la animación y lee la explicación completa si quieres saber por qué.'
 # Put main after the prediction, or after hero.
 spot=orig_pred or hero
 example_title,ex=info['examples'][(c*13+m*7+n)%len(info['examples'])]
 cap=f'''<section class="micro-core" aria-label="Explicación breve"><div class="micro-kicker">01 · ENTENDER <span>≈ 45 s</span></div><h2>La idea en palabras sencillas</h2><p>{html.escape(excerpt)}</p><div class="micro-example"><span class="micro-example-icon" aria-hidden="true">{ {'Cafetería':'☕','Mascotas':'🐾','Lluvia':'🌦️','Tiempo':'🌦️','Tienda':'🛍️','Supermercado':'🛒','Fotografía':'📸','Cocina':'🍳','Vehículos':'🚲','Viajes':'🧳','Casa':'🏠','Examen':'📝','Radiografía':'🩻','Plantas':'🌱'}.get(example_title,'💡')}</span><div><strong>Otro ejemplo · {html.escape(example_title)}</strong><p>{html.escape(ex)}</p></div></div></section>'''
 act=f'''<section class="micro-viz" data-micro-viz="{topic}" data-index="{n+m+c}" aria-label="Animación interactiva"><div class="micro-kicker">03 · EXPERIMENTAR <span>≈ 45 s</span></div><div class="micro-viz-title"><div><h2>{html.escape(info['title'])}</h2><p>{html.escape(info['do'])}</p></div><span aria-hidden="true" class="micro-viz-symbol">✦</span></div><div class="micro-viz-stage" aria-live="polite"><p>Animación interactiva: {html.escape(info['title'])}</p></div></section>'''
 x1=make_quiz(info['q1'],n,c,0); x2=make_quiz(info['q2'],n,c,1)
 bit='''<div class="micro-kicker micro-checkpoint">02 · RESPONDER <span>≈ 15 s</span></div>'''
 finish='<div class="micro-finish"><strong>Idea que te llevas</strong><span>'+html.escape(tidy(excerpt.split('.')[0])[:150])+'</span><small>¿Quieres más ejemplos, fórmulas o código? Los tienes justo debajo, sin límite de tiempo.</small></div>'
 # Use a fresh parse so selector / scripts stay valid.
 short_html=cap+bit+x1+act+'<div class="micro-kicker micro-checkpoint">04 · APLICAR <span>≈ 15 s</span></div>'+x2+finish
 short=BeautifulSoup(short_html,'html.parser')
 for node in reversed(list(short.contents)):
  spot.insert_after(node)
 if deep:
  block=sou.new_tag('details');block['class']=['profundizar','micro-legacy']
  summ=sou.new_tag('summary');label=sou.new_tag('span');label.string='Explorar más: explicación y simulaciones completas'
  sub=sou.new_tag('small');sub.string='Todo el texto original, tablas y demos avanzadas. Opcional.';label.append(sub);summ.append(label);block.append(summ)
  inside=sou.new_tag('div');inside['class']=['prof-body']
  for part in deep:inside.append(part)
  block.append(inside)
  # Put optional before original deep details/code, after quick path.
  anchor=page.select_one(':scope > details.profundizar')
  if anchor:anchor.insert_before(block)
  else:page.append(block)
 page['data-micro']='3min'
 for t in page.select('.micro-legacy .quiz'):
  pass
 p.write_text(str(sou),encoding='utf8');N+=1
print('Converted visual-first lessons:',N)
print('Lessons covered:',sum(1 for x in ROOT.glob('curso-*/modulo-*/leccion-*.html')))

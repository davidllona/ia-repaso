/* Microanimaciones didácticas: sin librerías ni peticiones externas.
   Una visualización interactiva en CADA lección, además de los laboratorios
   completos disponibles en «Profundizar». Todas las escenas son accesibles
   con teclado y respetan prefers-reduced-motion. */
(function(){'use strict';
 const $=(s,c=document)=>c.querySelector(s);
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const NS='http://www.w3.org/2000/svg';
 function ssvg(view,inner,desc){return `<svg viewBox="${view}" role="img" aria-label="${esc(desc)}" xmlns="${NS}" class="mv-svg">${inner}</svg>`}
 const rect=(x,y,w,h,cls='',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" ${extra}/>`;
 const circ=(x,y,r,cls='',extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" class="${cls}" ${extra}/>`;
 const line=(x1,y1,x2,y2,cls='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
 const tx=(x,y,t,cls='')=>`<text x="${x}" y="${y}" class="${cls}">${esc(t)}</text>`;
 const btn=(title='Probar otro caso')=>`<button type="button" class="mv-action">${esc(title)} ↻</button>`;
 const range=(name,min,max,val,step=1)=>`<label class="mv-range"><span>${esc(name)}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"/><strong class="mv-range-value" aria-live="off">${val}</strong></label>`;
 const feedback=(s)=>`<p class="mv-feedback" role="status">${s}</p>`;
 function render(box, scene, index){
  const target=$('.micro-viz-stage',box); if(!target)return;
  const set=(html)=>target.innerHTML=html;
  const action=()=>$('.mv-action',target);
  const update=(fn)=>{const r=$('.mv-range input',target);if(r){r.addEventListener('input',()=>{const v=+r.value;$('.mv-range-value',target).textContent=v;fn(v)});fn(+r.value)}};
  const say=(s)=>{const el=$('.mv-feedback',target);if(el)el.textContent=s};
  const replay=()=>{target.classList.remove('mv-play');void target.offsetWidth;target.classList.add('mv-play')};
  const pulse=(act)=>{if(act)act.addEventListener('click',()=>{replay()})};
  const suffix=()=>{target.classList.add('mv-rendered','mv-play')};

  if(scene==='regression'){
   let grid=''; for(let i=0;i<5;i++){grid+=line(37,24+i*37,306,24+i*37,'mv-grid')+line(37+i*62,22,37+i*62,178,'mv-grid')}
   let points='';for(let i=1;i<6;i++){let x=37+i*44,y=174-i*25;points+=circ(x,y,5,'mv-point',`style="--delay:${i*90}ms"`)}
   const graph=ssvg('0 0 340 214',grid+line(37,180,309,180,'mv-axis')+line(37,180,37,19,'mv-axis')+
    `<path d="M40 173 L306 22" class="mv-stroke mv-draw"/>`+points+`<g id="mv-r-ind">`+circ(37+4*44,174-4*25,9,'mv-active')+line(213,74,213,179,'mv-helper')+`</g>`+tx(205,204,'n.º de cafés','mv-label')+tx(9,16,'min','mv-label'),'Regresión: al aumentar el número de cafés, aumenta el tiempo');
   set(`<div class="mv-canvas">${graph}</div>${range('Cafés',1,6,4)}${feedback('4 cafés × 2 min = 8 minutos. Es una predicción NUMÉRICA.')}`);
   update(v=>{const marker=$('#mv-r-ind',target);if(marker)marker.setAttribute('transform',`translate(${(v-4)*44} ${(4-v)*25})`);say(`${v} ${v===1?'café':'cafés'} × 2 min = ${v*2} minutos. Predecimos una cantidad, no una etiqueta.`)});
  }
  else if(scene==='classification'){
   set(`<div class="mv-canvas"><div class="mv-prob-head"><span>NO SPAM</span><span>SPAM</span></div><div class="mv-prob-track"><span class="mv-prob-fill"></span><i class="mv-prob-cut"></i></div><div class="mv-big-number" aria-live="off">80 %</div><div class="mv-decision">Resultado: <strong>SPAM</strong></div></div>${range('Probabilidad de spam (%)',0,100,80,5)}${feedback('El umbral es 50 %. Prueba con 30 % y 70 %.')}`);
   update(v=>{const fill=$('.mv-prob-fill',target);if(fill)fill.style.width=v+'%';$('.mv-big-number',target).textContent=v+' %';$('.mv-decision strong',target).textContent=v>=50?'SPAM':'NO SPAM';say(v>=50?`${v} % ≥ 50 %: el modelo elige SPAM.`:`${v} % < 50 %: el modelo elige NO SPAM.`)});
  }
  else if(scene==='grouping'){
   let dots='';const pos=[[70,54],[88,76],[56,82],[96,47],[75,105],[250,60],[272,82],[235,101],[260,111],[236,39],[157,128],[176,151],[146,166],[185,131],[173,172]];
   pos.forEach((p,i)=>dots+=circ(162+(i*7)%5,100+(i*5)%5,7,`mv-cluster-point mv-cluster-${Math.floor(i/5)+1}`,`data-x="${p[0]}" data-y="${p[1]}" style="--i:${i}"`));
   set(`<div class="mv-canvas">${ssvg('0 0 330 205',dots,'Puntos sin etiqueta que se separan en tres grupos')}<p class="mv-legend"><span>● Grupo A</span><span>● Grupo B</span><span>● Grupo C</span></p></div>${btn('Agrupar puntos')}${feedback('Al principio todo está mezclado. ¿Ves tres conjuntos?')}`);
   let split=false;const run=()=>{split=!split;target.classList.toggle('mv-split',split);target.querySelectorAll('.mv-cluster-point').forEach(el=>{el.style.setProperty('--x',(+el.dataset.x-162)+'px');el.style.setProperty('--y',(+el.dataset.y-100)+'px')});say(split?'Se han formado 3 grupos por similitud; no había etiquetas iniciales.':'Los puntos han vuelto al origen. Prueba a descubrir los grupos de nuevo.')};action().addEventListener('click',run);setTimeout(run,450);
  }
  else if(scene==='tree'){
   let nodes=line(170,43,77,110,'mv-branch')+line(170,43,256,110,'mv-branch')+rect(104,14,132,45,'mv-node')+tx(170,34,'¿más de 30 °C?','mv-node-text')+tx(170,50,'Sensor','mv-small')+
    rect(16,101,125,49,'mv-node mv-node-no')+rect(196,101,125,49,'mv-node mv-node-yes')+tx(78,124,'NO · Esperar','mv-node-text')+tx(258,124,'SÍ · Ventilar','mv-node-text')+tx(115,93,'No','mv-small')+tx(215,93,'Sí','mv-small');
   set(`<div class="mv-canvas">${ssvg('0 0 340 170',nodes,'Árbol de decisión con un umbral de 30 grados')}</div>${range('Temperatura °C',15,42,34)}${feedback('34 °C supera 30 °C, sigue la rama SÍ.')}`);
   update(v=>{target.classList.toggle('mv-yes',v>30);target.classList.toggle('mv-no',v<=30);say(`${v} °C ${v>30?'>':'≤'} 30 °C. Rama ${v>30?'SÍ: ventilar':'NO: esperar'}.`) });
  }
  else if(scene==='data'){
   const tab=`<div class="mv-table" role="table" aria-label="Tabla de mascotas con un dato ausente"><div class="mv-trow mv-th" role="row"><span>Mascota</span><span>Peso</span><span>Edad</span></div><div class="mv-trow"><span>Luna</span><span>5 kg</span><span>2 años</span></div><div class="mv-trow mv-missing"><span>Toby</span><span class="mv-old">¿? NaN</span><span class="mv-new">6 kg*</span><span>4 años</span></div><div class="mv-trow"><span>Nala</span><span>7 kg</span><span>3 años</span></div></div>`;
   set(`<div class="mv-canvas">${tab}</div>${btn('Preparar datos')}${feedback('Falta un peso. NaN NO significa 0 kg.')}`);
   let on=false;action().onclick=()=>{on=!on;target.classList.toggle('mv-clean',on);say(on?'Se ha imputado un valor de ejemplo (6 kg). *Es una estimación, no una medición.':'Recuperamos el dato faltante original: NaN.')};
  }
  else if(scene==='split'){
   let data='';for(let i=0;i<10;i++)data+=rect(19+(i%5)*62,35+Math.floor(i/5)*56,48,39,'mv-sample',`data-i="${i}" rx="7"`)+tx(43+(i%5)*62,59,String(i+1).padStart(2,'0'),'mv-sample-text');
   set(`<div class="mv-canvas">${ssvg('0 0 340 162',data,'Diez muestras separadas en train y test')}<div class="mv-key"><span><i class="mv-swatch mv-train"></i> TRAIN</span><span><i class="mv-swatch mv-test"></i> TEST</span></div></div>${range('% de entrenamiento',50,90,80,10)}${feedback('8 ejemplos para entrenar. 2 ejemplos reservados.')}`);
   update(v=>{target.querySelectorAll('.mv-sample').forEach((el,i)=>{el.classList.toggle('mv-is-test',i>=v/10)});say(`${v/10} ejemplos TRAIN; ${10-v/10} ejemplos TEST. Nunca entrenes con el examen final.`)});
  }
  else if(scene==='gradient'){
   let curve='<path d="M25 22 Q90 188 170 175 Q245 165 313 22" class="mv-stroke mv-draw"/>'+line(22,186,316,186,'mv-axis');
   let dots=[{x:38,y:48,l:100},{x:72,y:104,l:57},{x:106,y:145,l:24},{x:140,y:169,l:5},{x:169,y:175,l:0}];
   curve+=circ(170,175,5,'mv-minimum')+tx(175,202,'mínimo','mv-small');
   set(`<div class="mv-canvas">${ssvg('0 0 340 214',curve+`<g class="mv-loss-cursor">${circ(38,48,10,'mv-active')}<path d="M38 48 V185" class="mv-helper"/></g>`,'Curva de error: un punto baja en cinco pasos')}</div>${btn('Dar un paso')}${feedback('Paso 0: error alto. Un paso pequeño suele acercarte al mínimo.')}`);
   let i=0;action().onclick=()=>{i=(i+1)%dots.length;const el=$('.mv-loss-cursor',target);if(el)el.setAttribute('transform',`translate(${dots[i].x-38} ${dots[i].y-48})`);say(`Paso ${i}: pérdida didáctica ${dots[i].l}. ${i===4?'¡Cerca del mínimo!':'Sigue corrigiendo los parámetros.'}`)};
  }
  else if(scene==='neural'){
   let g=''; const xs=[42,150,276],ys=[[49,103,157],[67,139],[103]];
   ys[0].forEach(a=>ys[1].forEach(b=>g+=line(xs[0],a,xs[1],b,'mv-wire')));
   ys[1].forEach(a=>g+=line(xs[1],a,xs[2],ys[2][0],'mv-wire'));
   ys.forEach((arr,j)=>arr.forEach((y,i)=>g+=circ(xs[j],y,14,`mv-neuron mv-n${j}`,`style="--delay:${j*320+i*75}ms"`)));
   g+=tx(42,196,'ENTRADAS','mv-caption')+tx(150,196,'CAPA OCULTA','mv-caption')+tx(276,196,'SALIDA','mv-caption');
   set(`<div class="mv-canvas">${ssvg('0 0 324 214',g,'Diagrama de red neuronal: tres entradas, dos neuronas ocultas y una salida')}</div>${btn('Propagar señales')}${feedback('Cada conexión utiliza un peso; cada neurona combina entradas.')}`);
   pulse(action());action().addEventListener('click',()=>say('Las señales viajan de entrada → capa oculta → salida. El entrenamiento ajusta pesos y bias.'));
  }
  else if(scene==='convolution'){
   let cells='';const vals=[7,2,1,6,3,9,1,6,9,2,1,4,5,2,8,7,8,6,6,4,7,8,3,1,8,9,2,1,4,6,7,1,4,5,2,3];
   for(let r=0;r<6;r++)for(let c=0;c<6;c++){const i=r*6+c;cells+=rect(33+c*38,14+r*28,34,24,'mv-pixel',`rx="3"`)+tx(50+c*38,30+r*28,vals[i],'mv-pixel-text')}
   cells+=rect(31,12,112,80,'mv-kernel','rx="3"');
   set(`<div class="mv-canvas">${ssvg('0 0 300 198',cells,'Matriz 6 por 6 con un filtro 3 por 3 que recorre la imagen')}</div>${btn('Siguiente posición')}${feedback('Paso 1: filtro 3×3; procesa 9 posiciones a la vez.')}`);
   let k=0;action().onclick=()=>{k=(k+1)%16; const r=Math.floor(k/4),c=k%4; $('.mv-kernel',target).setAttribute('transform',`translate(${c*38} ${r*28})`);say(`Posición ${k+1}/16. El kernel vuelve a usar los mismos pesos en otra zona.`)};
  }
  else if(scene==='sequence'){
   let tokens=['Ayer','llovió','hoy','brilla','el','sol'];
   set(`<div class="mv-canvas"><div class="mv-token-list">${tokens.map((v,i)=>`<span class="mv-token" data-step="${i}">${esc(v)}</span>`).join('')}</div><div class="mv-timeline"><span>INICIO</span><i></i><span>FINAL</span></div></div>${btn('Leer siguiente')}${feedback('Lee en orden: el siguiente elemento depende del contexto anterior.')}`);
   let k=-1;action().onclick=()=>{k=(k+1)%tokens.length;target.querySelectorAll('.mv-token').forEach((n,i)=>{n.classList.toggle('mv-current',i===k);n.classList.toggle('mv-past',i<k)});say(`Paso ${k+1}/${tokens.length}: «${tokens[k]}». Lo anterior cambia el contexto del siguiente token.`)};action().click();
  }
  else if(scene==='attention'){
   const tokens=['El','perro','persigue','la','pelota'];
   let w='';let pos=[38,98,171,248,303];for(let i=0;i<tokens.length;i++)for(let j=0;j<tokens.length;j++)if(i!==j&&Math.abs(i-j)<=2)w+=line(pos[i],105,pos[j],105,'mv-attn-line');
   w+=tokens.map((t,i)=>rect(pos[i]-26,85,52,35,'mv-attn-node',`rx="8" data-token="${i}"`)+tx(pos[i],108,t,'mv-attn-text')).join('');
   set(`<div class="mv-canvas">${ssvg('0 0 340 180',w,'Cinco tokens conectados por relaciones de atención')}<div class="mv-selector"><span>¿Qué palabra miramos?</span><div class="mv-choices">${tokens.map((t,i)=>`<button type="button" data-token="${i}">${esc(t)}</button>`).join('')}</div></div></div>${feedback('El contexto ayuda a interpretar cada palabra.')}`);
   const options=target.querySelectorAll('.mv-choices button');options.forEach((b,i)=>b.addEventListener('click',()=>{options.forEach((x,j)=>x.setAttribute('aria-pressed',String(j===i)));say(`Ahora observamos «${tokens[i]}»: su significado depende de las otras palabras y su contexto.`);target.querySelectorAll('.mv-attn-node').forEach((v,j)=>v.classList.toggle('mv-selected',j===i))}));options[2].click();
  }
  else if(scene==='evaluation'){
   const names=['Verdadero negativo','Falso positivo','Falso negativo','Verdadero positivo'];
   const html=`<div class="mv-matrix"><div class="mv-empty"></div><div class="mv-label">Predijo NO</div><div class="mv-label">Predijo SÍ</div><div class="mv-label">Real NO</div><div class="mv-mcell mv-tn">TN</div><div class="mv-mcell mv-fp">FP</div><div class="mv-label">Real SÍ</div><div class="mv-mcell mv-fn">FN</div><div class="mv-mcell mv-tp">TP</div></div>`;
   set(`<div class="mv-canvas">${html}</div>${btn('Otro caso')}${feedback('Real NO + predijo NO = verdadero negativo (TN).')}`);
   let k=-1;action().onclick=()=>{k=(k+1)%4;target.querySelectorAll('.mv-mcell').forEach((n,i)=>n.classList.toggle('mv-focus',i===k));say(`${names[k]}: ${['acertó ausencia','falsa alarma','pasó por alto un positivo','detectó correctamente un positivo'][k]}.`)};action().click();
  }
  else if(scene==='compression'){
   let pts='';for(let i=0;i<18;i++){const x=27+(i*37)%270,y=25+(i*43)%137;pts+=circ(x,y,5,i%3===0?'mv-point mv-p3':i%2?'mv-point mv-p2':'mv-point',`style="--i:${i};--x:${(i%3)*70+44-x}px;--y:${(i%6)*21+36-y}px"`)}
   set(`<div class="mv-canvas">${ssvg('0 0 330 175',pts,'Nube de puntos que puede reorganizarse en representación de dos dimensiones')}</div>${btn('Comprimir / expandir')}${feedback('Representación original: muchas medidas difíciles de visualizar.')}`);
   action().onclick=()=>{target.classList.toggle('mv-compressed');say(target.classList.contains('mv-compressed')?'Una proyección simplifica los puntos. Puede perder parte de la información.':'Volvemos a la representación original.');};
  }
  else if(scene==='generative'){
   let cells='';for(let i=0;i<100;i++){const row=Math.floor(i/10),col=i%10;let v=(i*71+13)%9;cells+=rect(col*22+34,row*13+13,20,11,'mv-noise',`data-i="${i}" style="--z:${v/9};--i:${i}"`)}
   set(`<div class="mv-canvas">${ssvg('0 0 290 162',cells,'Cuadrícula de ruido de la que emerge una estructura')}</div>${btn('Quitar ruido')}${feedback('Ruido inicial: no se distingue bien ningún patrón.')}`);
   let step=0;action().onclick=()=>{step=(step+1)%6;target.querySelectorAll('.mv-noise').forEach((r,i)=>{const c=i%10, y=Math.floor(i/10),inside=(c>=3&&c<=6&&y>=2&&y<=7);r.style.opacity=step===0?(.25+((i*71)%9)/12):inside?(0.35+step*.1):(1-step*.14);r.style.fill=inside?'var(--terracota)':'var(--cobalto)'});say(step===0?'Ruido inicial: pulsa para revelar el patrón.':`Paso ${step}/5: el ruido se reduce y aparece una forma. Es una ilustración, no un modelo entrenado.`)};
  }
  else if(scene==='transfer'){
   set(`<div class="mv-canvas"><div class="mv-transflow"><div class="mv-transbox">Imagen nueva<small>🐾</small></div><span class="mv-arrow">→</span><div class="mv-transbox mv-frozen">Capas conocidas<small>🔒 Filtros</small></div><span class="mv-arrow">→</span><div class="mv-transbox mv-head">Nueva salida<small>Gato / Perro</small></div></div></div>${btn('Congelar / ajustar')}${feedback('Primero congelas las capas conocidas y entrenas la nueva cabeza.')}`);
   let on=false;action().onclick=()=>{on=!on;target.classList.toggle('mv-finetune',on);say(on?'Fine-tuning: puedes desbloquear algunas capas y ajustarlas con cuidado.':'Extracción de características: conservas los pesos de las capas anteriores.')};
  }
  else if(scene==='pipeline'){
   let steps=['Datos','Preparar','Entrenar','Evaluar','Usar'];
   set(`<div class="mv-canvas"><div class="mv-steps">${steps.map((s,i)=>`<div class="mv-step" data-step="${i}"><i>${i+1}</i><span>${s}</span></div>`).join('<span class="mv-step-arrow">→</span>')}</div></div>${btn('Siguiente etapa')}${feedback('Paso 1: recoge los datos antes de entrenar.')}`);
   let k=-1;action().onclick=()=>{k=(k+1)%steps.length;target.querySelectorAll('.mv-step').forEach((n,i)=>{n.classList.toggle('mv-current',i===k);n.classList.toggle('mv-past',i<k)});say(`Etapa ${k+1}/${steps.length}: ${steps[k]}. ${['Observa qué ejemplos tienes.','Corrige errores y transforma variables.','Ajusta los parámetros del modelo.','Comprueba si funciona con datos nuevos.','Integra el resultado y vigila sus límites.'][k]}`)};action().click();
  }
  else if(scene==='probability'){
   set(`<div class="mv-canvas"><div class="mv-multibar"><div><span>Gato</span><i class="mv-b1"></i><strong>70 %</strong></div><div><span>Perro</span><i class="mv-b2"></i><strong>20 %</strong></div><div><span>Conejo</span><i class="mv-b3"></i><strong>10 %</strong></div></div></div>${range('Puntuación de gato',1,9,7)}${feedback('Las tres barras suman 100 %.')}`);
   update(v=>{const s=[v,2,1],mx=Math.max(...s.map(Math.exp)),scores=s.map(x=>Math.exp(x-mx)),sum=scores.reduce((a,b)=>a+b,0),p=scores.map(x=>Math.round(x/sum*100));p[2]=100-p[0]-p[1];['mv-b1','mv-b2','mv-b3'].forEach((cls,i)=>{$('.'+cls,target).style.width=p[i]+'%';$('.'+cls,target).parentElement.querySelector('strong').textContent=p[i]+' %'});say(`Gato ${p[0]} % · Perro ${p[1]} % · Conejo ${p[2]} %. La softmax redistribuye las puntuaciones.`)});
  }
  else if(scene==='recommend'){
   const products=[['☕','Café'],['🫖','Té'],['🍪','Galletas']];
   set(`<div class="mv-canvas"><div class="mv-products">${products.map((p,i)=>`<div class="mv-prod" data-id="${i}"><span>${p[0]}</span><strong>${p[1]}</strong><small>${[84,62,34][i]} % afinidad</small></div>`).join('')}</div></div>${btn('Cambiar preferencia')}${feedback('Si sueles comprar café, el sistema recomienda productos afines.')}`);
   let i=0;action().onclick=()=>{i=(i+1)%3;target.querySelectorAll('.mv-prod').forEach((n,j)=>{n.classList.toggle('mv-liked',j===i);n.querySelector('small').textContent=(j===i?'94':j===(i+1)%3?'68':'32')+' % afinidad'});say(`Preferencia: ${products[i][1]}. Las recomendaciones cambian según gustos o asociaciones.`)};action().click();
  }
  else {set(`<div class="mv-canvas">${ssvg('0 0 320 130',rect(14,40,90,46,'mv-node')+rect(214,40,90,46,'mv-node')+line(110,63,208,63,'mv-branch')+tx(59,66,'Entrada','mv-node-text')+tx(259,66,'Salida','mv-node-text'),'De la entrada al resultado')}</div>${btn('Repetir')}${feedback('Observa cómo cambia el resultado a partir de los datos de entrada.')}`);pulse(action())}
  suffix();
 }
 function start(){document.querySelectorAll('[data-micro-viz]').forEach(box=>{try{render(box,box.dataset.microViz,+box.dataset.index||0)}catch(e){const t=$('.micro-viz-stage',box);if(t)t.innerHTML='<p>Esta visualización no pudo iniciarse. Las explicaciones de la lección siguen disponibles.</p>';console.warn('Microvisualización:',e)}})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

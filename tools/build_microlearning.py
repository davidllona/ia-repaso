#!/usr/bin/env python3
"""Converts complete long-form modules into focused mobile lessons.
Original module markup is preserved under docs/originales; the full detail is
accessible in each generated lesson's 'Profundizar' disclosure.
The existing JS/CSS, curriculum, demos, pilot lessons and code annotations remain.
Run from anywhere: python3 tools/build_microlearning.py
"""
from __future__ import annotations
import json, re, shutil, textwrap, html, posixpath, os
from pathlib import Path
from bs4 import BeautifulSoup, Tag

ROOT=Path(__file__).resolve().parents[1]
ORIG=ROOT/'docs'/'originales'
STOP=set('el la los las un una unos unas de del al en por para con sin y o a ante que qué como cómo es son se su sus lo le este esta estos estas the and data modelo modelos datos curso modulo módulo modelo de una un del los la las en un por los por and with from into uso usar más menos entre'.split())


def text(e): return e.get_text(' ',strip=True) if hasattr(e,'get_text') else str(e)
def words(s): return len(re.findall(r'\b[\wáéíóúüñ]+\b',s,re.U))
def cut(s,n=165):
 s=re.sub(r'\s+',' ',s).strip();
 if len(s)<=n:return s
 s=s[:n].rsplit(' ',1)[0].rstrip('.,;:—')+'…'
 return s

def sentence(s,n=200):
 s=re.sub(r'\s+',' ',s).strip()
 s=re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ¿¡0-9])',s)[0]
 return cut(s,n)

def semantic_key(s):
 return set(re.findall(r'\b[\wáéíóúüñ]{4,}\b',s.lower()))-STOP

def soup(s): return BeautifulSoup(s,'html.parser')
def el(tag,content='',attrs=None):
 x=soup('') .new_tag(tag,attrs=attrs or {})
 if content:x.append(content)
 return x

def extract_intro(section):
 ps=section.find_all('p',recursive=False)
 return [p for p in ps if 'pregunta' not in (p.get('class') or []) and len(text(p))>20]

def main_fragments(sections):
 # Stay focused: first 1-3 paragraphs per topic, one diagram, one short worked example.
 chunks=[]; n=0
 for sec in sections:
  label=sec.find('h2')
  if label: chunks.append(f'<h2>{html.escape(text(label))}</h2>')
  count=0
  for p in extract_intro(sec):
   w=words(text(p))
   if count>=3 or n>=300:break
   if w>145:
    # produce a complete opening sentence or two rather than an arbitrarily truncated paragraph
    ts=re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ¿¡0-9])',text(p)); res=''
    for v in ts:
     if words(res)+words(v)>95 and res:break
     res+= (' ' if res else '')+v
    chunks.append('<p>'+html.escape(res)+'</p>')
    n+=words(res)
   else:
    st=soup(str(p)); nt=st.find('p');
    if nt:
     for attr in ('id',):nt.attrs.pop(attr,None)
     chunks.append(str(nt))
    n+=w
   count+=1
  flow=sec.find('ul',class_='flow')
  if flow and n<390:chunks.append(str(flow))
  if n>=410:break
 # One example from original, not an invented example.
 example=None
 for sec in sections:
  example=sec.find('div',class_='ejemplo')
  if example:break
 if example:
  raw=text(example)
  # Actual example kept in long-form; short recap in main.
  if words(raw)>20:
   s=sentence(raw.replace('Ejemplo numérico','').strip(),240)
   chunks.append('<div class="callout ejemplo"><span class="lbl">Ejemplo tomado del módulo</span><p>'+html.escape(s)+'</p></div>')
 elif sections:
  p=next((p for sec in sections for p in sec.find_all('p',recursive=False) if re.search(r'\d',text(p)) and len(text(p))>30),None)
  if p:chunks.append('<div class="callout ejemplo"><span class="lbl">Con números</span><p>'+html.escape(sentence(text(p),210))+'</p></div>')
 return '\n'.join(chunks)

def group_sections(secs):
 # A topic per screen unless the section is a short connecting thought.
 groups=[]; i=0
 while i<len(secs):
  group=[secs[i]]; w=words(text(secs[i])); i+=1
  if w<245 and i<len(secs): group.append(secs[i]);i+=1
  elif w<460 and i<len(secs) and words(text(secs[i]))<240:
   group.append(secs[i]);i+=1
  groups.append(group)
 return groups

def top_sections(page):
 content=[]; code=None; quiz=None; resumen=None
 for s in page.find_all('section',recursive=False):
  h=s.find('h2'); title=text(h).lower() if h else ''
  if s.get('id')=='codigo' or title=='código del módulo':code=s
  elif 'comprueba lo aprendido' in title:quiz=s
  elif 'resumen' in (s.get('class') or []) or 'resumen del módulo' in title:resumen=s
  else:content.append(s)
 return content,code,quiz,resumen

def lesson_title(sections):
 t=[text(s.find('h2')) for s in sections if s.find('h2')]
 t=[re.sub(r'^Proyecto\s+[1234]\s*·?\s*','',x,flags=re.I) for x in t]
 if len(t)>1:
  if len(t[0])>44:return cut(t[0],83)
  return cut(t[0]+' y '+t[1].lower(),91)
 return cut(t[0],95) if t else 'Idea del módulo'

def first_thesis(sections):
 for sec in sections:
  for p in extract_intro(sec):
   return sentence(text(p),210)
 return 'Una idea importante del módulo que aprenderás mediante un ejemplo concreto.'

def name_concept(groups,i):
 return lesson_title(groups[i])

def make_quiz(sections, allgroups,i):
 title=lesson_title(sections); lead=first_thesis(sections)
 others=[lesson_title(g) for j,g in enumerate(allgroups) if j!=i]
 distractors=[a for a in others if semantic_key(a).isdisjoint(semantic_key(title))]
 if len(distractors)<2:distractors=others
 wrong1=distractors[min((i*3)%len(distractors),len(distractors)-1)] if distractors else 'Evitar comprender los datos'
 wrong2=distractors[min((i*3+2)%len(distractors),len(distractors)-1)] if distractors else 'Repetir predicciones sin evaluar'
 if wrong1==wrong2:wrong2='Saltarse la validación y dar por bueno el primer resultado'
 q=[
  {'q':'¿Qué concepto estamos trabajando en esta lección?', 'opciones':[title,wrong1,wrong2], 'correcta':0,'porque':lead},
  {'q':'¿Cuál de estas afirmaciones recoge lo que acabas de estudiar?', 'opciones':['Siempre hay un único método que sirve para todos los problemas.', 'Lo importante es comprender la idea y comprobarla con ejemplos, no memorizar términos.', lead], 'correcta':2,'porque':'La explicación central es: '+lead},
  {'q':'Si una demo o un ejemplo te desconcierta, ¿cuál es la mejor forma de aprenderlo?', 'opciones':['Volver a los números, cambiar un valor y explicar qué ocurre.', 'Ignorar los resultados que no coinciden con tu intuición.', 'Memorizar el nombre sin entender la operación.'], 'correcta':0,'porque':'Explorar qué cambia y por qué ayuda a conectar el concepto con su resultado.'}
 ]
 # Rotate question choices deterministically to avoid correct always at same position.
 for k,v in enumerate(q):
  shift=(i+k)%3
  opts=v['opciones']; corr=v['correcta']
  v['opciones']=opts[shift:]+opts[:shift];v['correcta']=(corr-shift)%3
 return '<section class="quiz mini"><script type="application/json" class="quiz-data">'+json.dumps({'titulo':'¿Lo tienes?','preguntas':q},ensure_ascii=False).replace('</','<\\/')+'</script></section>'

def matched_snippets(groups,code):
 out=[[] for _ in groups]
 if not code:return out
 snippets=code.select('article.snippet')
 for k,sn in enumerate(snippets):
  title=text(sn.find('h3')) if sn.find('h3') else ''
  keys=semantic_key(title)
  scores=[]
  for idx,g in enumerate(groups):
   tit=lesson_title(g); first=' '.join(text(x.find('h2')) for x in g)
   score=5*len(keys & semantic_key(tit+' '+first))
   score+=len(keys & semantic_key(' '.join(text(p) for x in g for p in extract_intro(x)[:2])))
   score-=0.035*len(out[idx])
   scores.append(score)
  best=max(range(len(groups)),key=lambda i:(scores[i],-abs(i-(k+0.5)*len(groups)/max(len(snippets),1))))
  if scores[best]<1:best=min(len(groups)-1,int(k*len(groups)/max(len(snippets),1)))
  out[best].append(sn)
 return out

def intro_question(sections,title):
 p=next((s.find('p',class_='pregunta') for s in sections if s.find('p',class_='pregunta')),None)
 if p:return cut(text(p),320)
 return 'Antes de leer: ¿cómo explicarías con tus palabras «'+title+'» y qué comprobarías para saber que funciona?'

def fix_urls(fragment,src_rel,dest_rel,id_map):
 s=soup(fragment)
 for e in s.find_all(True):
  for name in ('href','src'):
   v=e.get(name)
   if not v or v.startswith(('http:','https:','mailto:','tel:','data:','javascript:','//')):continue
   if v.startswith('#'):
    anchor=v[1:]
    if anchor=='codigo':e[name]='#codigo';continue
    if anchor in id_map:
     target=id_map[anchor]
     e[name]='#'+anchor if target==dest_rel else posixpath.relpath(target,posixpath.dirname(dest_rel))+'#'+anchor
    elif anchor not in ('','top'):
     # Legacy sections might use anchors no longer present on this page. Link back to module hub.
     e[name]=posixpath.relpath(src_rel,posixpath.dirname(dest_rel))+'#'+anchor
    continue
   path,sep,hashval=v.partition('#')
   if path.startswith('/'):continue
   target=posixpath.normpath(posixpath.join(posixpath.dirname(src_rel),path))
   e[name]=posixpath.relpath(target,posixpath.dirname(dest_rel))+(('#'+hashval) if sep else '')
 return str(s)

HEAD='''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><meta name="description" content="{description}"><script>try{{var t=localStorage.getItem('cuaderno-ia:tema');if(t)document.documentElement.setAttribute('data-theme',t)}}catch(e){{}}</script><link rel="stylesheet" href="../../assets/css/style.css"><script src="../../assets/js/curriculum.js"></script><script src="../../assets/js/lab.js"></script><script src="../../assets/js/app.js" defer></script></head><body data-root="../../" data-course="{c}" data-module="{m}" data-lesson="{l}"><main><div class="page">'''
TAIL='</div></main></body></html>'

def generate_mod(c,m,src):
 src_rel=f'curso-{c}/modulo-{m}.html'
 old=soup(src.read_text(encoding='utf-8'))
 page=old.select_one('.page')
 if not page:raise Exception(src)
 sections,code,quiz,resumen=top_sections(page)
 if not sections: return None
 groups=group_sections(sections)
 codes=matched_snippets(groups,code)
 destdir=ROOT/f'curso-{c}'/f'modulo-{m}'
 destdir.mkdir(exist_ok=True)
 titles=[lesson_title(g) for g in groups]
 ids={}
 for i,g in enumerate(groups,1):
  dest=f'curso-{c}/modulo-{m}/leccion-{i}.html'
  for sec in g:
   for e in sec.find_all(attrs={'id':True}):ids[e['id']]=dest
 if code:
  # Map each original code fragment to its actual destination lesson.
  for lesson_number, assigned in enumerate(codes,1):
   dest=f'curso-{c}/modulo-{m}/leccion-{lesson_number}.html'
   for sn in assigned:
    for e in [sn]+sn.find_all(attrs={'id':True}):
     if e.get('id'): ids[e['id']]=dest
 lessons=[]
 for i,g in enumerate(groups,1):
  title=titles[i-1]; descr=first_thesis(g)
  dest_rel=f'curso-{c}/modulo-{m}/leccion-{i}.html'
  lead=descr
  prediction=intro_question(g,title)
  # For the prediction, answer comes from source text, not speculation.
  pred=f'<details class="predice"><summary>{html.escape(prediction)}<span class="hint"></span></summary><div><p>{html.escape(descr)}</p></div></details>'
  main=main_fragments(g)
  # move one demo into visible part; preserve others in Profundizar
  deep=soup(''.join(str(s) for s in g))
  deep_demo=deep.select_one('figure.demo[data-demo]')
  demo_html=str(deep_demo) if deep_demo else ''
  if deep_demo:deep_demo.decompose()
  # Deep sections keep headings and original paragraphs, tables etc.
  for h in deep.select('h2'):
   h.attrs.pop('class',None) if h.get('class')==['sin-num'] else None
  deep_html=fix_urls(str(deep),src_rel,dest_rel,ids)
  main=fix_urls(main,src_rel,dest_rel,ids)
  demo_html=fix_urls(demo_html,src_rel,dest_rel,ids)
  # Code is never discarded, and keeps the original line-by-line annotation.
  snippet_html=''.join(str(sn) for sn in codes[i-1])
  snippet_html=fix_urls(snippet_html,src_rel,dest_rel,ids)
  code_details=f'<details class="profundizar" id="codigo"><summary><span>Ver código explicado paso a paso<small>{len(codes[i-1])} fragmento(s) original(es), con cada línea comentada y salida esperada.</small></span></summary><div class="prof-body">{snippet_html or "<p>Esta lección se centra en la idea y la demo; no requiere código adicional.</p>"}</div></details>'
  rec=[]
  for sect in g:
   t=text(sect.find('h2')) if sect.find('h2') else title
   p=next((x for x in extract_intro(sect)),None)
   rec.append(f'<li><strong>{html.escape(cut(t,70))}:</strong> {html.escape(sentence(text(p),135) if p else "Revisa el ejemplo de esta sección.")}</li>')
  rec.append('<li>Antes de continuar, intenta explicar la demo sin mirar su resultado.</li>')
  recap='<div class="resumen"><h2 class="sin-num sin-toc">En pocas líneas</h2><ul>'+''.join(rec)+'</ul></div>'
  quiz_html=make_quiz(g,groups,i-1)
  deep_details='<details class="profundizar"><summary><span>Profundizar: explicación completa<small>Matices, fórmulas, tablas, otros ejemplos y experimentos del módulo original.</small></span></summary><div class="prof-body">'+deep_html+'</div></details>'
  content=(HEAD.format(title=html.escape(f'Lección {i} · {title} · Curso {c} · Cuaderno de IA',quote=True),description=html.escape(descr,quote=True),c=c,m=m,l=i)
   +f'<header class="hero leccion"><div class="hero-grid"><div><p class="eyebrow">Curso {c} · Módulo {m} · Lección {i} de {len(groups)}</p><h1>{html.escape(title)}</h1><p class="lead">{html.escape(lead)}</p><p class="meta-line"><span class="read-time" data-render="read-time"></span><a href="../modulo-{m}.html">Índice del módulo</a></p></div><div class="hero-tile" aria-hidden="true"></div></div></header>'
  +pred+'<section>'+main+'</section>'+(demo_html or '')+recap+quiz_html+deep_details+code_details+TAIL)
  (destdir/f'leccion-{i}.html').write_text(content,encoding='utf-8')
  lessons.append({'n':i,'slug':f'leccion-{i}','title':title,'blurb':descr,'min':min(4,max(2,round((words(BeautifulSoup(content,'html.parser').select_one('.page').get_text(' ',strip=True))-words(text(deep))-words(text(soup(snippet_html))))/200)))})
 # Full original module quiz and summary: an optional practice page; normal <=5min.
 if quiz or resumen:
  i=len(groups)+1;title='Repaso activo y evaluación del módulo'
  dest_rel=f'curso-{c}/modulo-{m}/leccion-{i}.html'
  quiz_html=fix_urls(str(quiz) if quiz else '',src_rel,dest_rel,ids)
  recap_html=fix_urls(str(resumen) if resumen else '',src_rel,dest_rel,ids)
  content=(HEAD.format(title=html.escape(f'Lección {i} · Repaso · Curso {c} · Cuaderno de IA',quote=True),description='Comprueba lo aprendido con preguntas del módulo y repasa las ideas esenciales.',c=c,m=m,l=i)
   +f'<header class="hero leccion"><div class="hero-grid"><div><p class="eyebrow">Curso {c} · Módulo {m} · Lección {i} de {i}</p><h1>{title}</h1><p class="lead">Recupera de memoria los conceptos importantes y pon a prueba tu comprensión antes de pasar al siguiente módulo.</p><p class="meta-line"><span class="read-time" data-render="read-time"></span><a href="../modulo-{m}.html">Índice del módulo</a></p></div><div class="hero-tile" aria-hidden="true"></div></div></header>'
   +'<details class="predice"><summary>Sin mirar tus apuntes, ¿qué tres conceptos puedes explicar con un ejemplo?<span class="hint"></span></summary><div><p>Si un concepto solo te suena, repite su demo y explica qué produce cada número. Después abre el repaso completo.</p></div></details>'
   +'<section><h2>Conecta las ideas</h2><p>Lo importante no es recordar todas las palabras, sino saber cuándo utilizar cada técnica, qué datos necesita, qué resultado produce y cómo comprobar si ha funcionado.</p><ul class="flow"><li class="a">IDEA<small>explícala de memoria</small></li><li class="b">EJEMPLO<small>haz un cálculo o prueba</small></li><li class="c">VALIDACIÓN<small>comprueba si acertaste</small></li></ul></section>'
   +'<details class="profundizar"><summary><span>Repaso completo y cuestionario del módulo<small>Preguntas originales, resultados y resumen íntegro; sin límite de tiempo.</small></span></summary><div class="prof-body">'+quiz_html+recap_html+'</div></details>'
   +make_quiz(groups[-1],groups,len(groups)-1)+TAIL)
  (destdir/f'leccion-{i}.html').write_text(content,encoding='utf-8')
  lessons.append({'n':i,'slug':f'leccion-{i}','title':title,'blurb':'Repasa los conceptos y resuelve el cuestionario completo del módulo.','min':3})
 # Hub, redirect old deep links, keep visual formatting.
 title=text(page.select_one('.hero h1')) if page.select_one('.hero h1') else f'Módulo {m}'
 lead=text(page.select_one('.hero .lead')) if page.select_one('.hero .lead') else ''
 summary=text(page.select_one('.hero .goals')) if page.select_one('.hero .goals') else ''
 redirect={k:posixpath.relpath(v,posixpath.dirname(src_rel)) for k,v in ids.items()}
 head=soup(str(old.head));head.title.string=f'Módulo {m} · {title} · Curso {c} · Cuaderno de IA'
 h='<header class="hero"><div class="hero-grid"><div>'
 h+=f'<p class="eyebrow">Curso {c} · Módulo {m} · {len(lessons)} lecciones</p><h1>{html.escape(title)}</h1><p class="lead">{html.escape(cut(lead,320))}</p></div><div class="hero-tile" aria-hidden="true"></div></div>'
 h+='<div class="goals"><h2 class="sin-num sin-toc">En este módulo aprenderás</h2><p>'+html.escape(cut(summary,390))+'</p></div></header>'
 h+='<h2 id="lecciones" class="sin-num">Lecciones</h2><p>Cada lección tiene una lectura principal de menos de 5 minutos; las explicaciones extensas y el código son opcionales.</p><div data-render="lesson-list"></div>'
 h+='<script>try{var map='+json.dumps(redirect,ensure_ascii=False).replace('</','<\\/')+';var k=decodeURIComponent(location.hash.slice(1));if(k&&map[k])location.replace(map[k]+location.hash)}catch(e){}</script>'
 doc='<!doctype html><html lang="es">'+str(head)+f'<body data-root="../" data-course="{c}" data-module="{m}"><main><div class="page">'+h+'</div></main></body></html>'
 (ROOT/src_rel).write_text(doc,encoding='utf-8')
 return lessons

def insert_curriculum(lessons_map):
 p=ROOT/'assets/js/curriculum.js'
 source=p.read_text(encoding='utf-8')
 # Original modules don't have lessons, insert objects after tags arrays; easiest: locate
 # nested JS using brace parsing, then injection at the module closing position.
 for (c,m),lessons in sorted(lessons_map.items(),reverse=True):
  # find course id by a positive block before module; module n+ slug
  course_start=re.search(r'\bid:\s*'+str(c)+r'\s*,\s*slug:\s*["\']curso-'+str(c),source)
  if not course_start: raise RuntimeError(f'Course {c} missing')
  sub=source[course_start.end():]
  mo=re.search(r'\bn:\s*'+str(m)+r'\s*,\s*slug:\s*["\']modulo-'+str(m),sub)
  if not mo:raise RuntimeError(f'Module {c}.{m} missing')
  # Find closing brace of module by brace balance; nested tags arrays are ignored.
  start=course_start.end()+mo.start(); brace=source.rfind('{',0,start); depth=0; end=None
  instring=False;quote='';escaped=False
  for j in range(brace,len(source)):
   char=source[j]
   if instring:
    if escaped:escaped=False
    elif char=='\\':escaped=True
    elif char==quote:instring=False
   elif char in "'\"`":instring=True;quote=char
   elif char=='{':depth+=1
   elif char=='}':
    depth-=1
    if depth==0:end=j;break
  if end is None:raise RuntimeError('unbalanced')
  modbody=source[brace:end+1]
  if re.search(r'\blessons\s*:',modbody):continue
  insert=',\n          lessons: '+json.dumps(lessons,ensure_ascii=False,indent=12)
  source=source[:end]+insert+source[end:]
 p.write_text(source,encoding='utf-8')


def main():
 lessons_map={}
 for c in range(1,6):
  for p in sorted((ROOT/f'curso-{c}').glob('modulo-*.html')):
   m=int(p.stem.split('-')[-1]);
   if (c,m)==(1,1):continue
   src=ORIG/f'curso-{c}'/p.name
   src.parent.mkdir(parents=True,exist_ok=True)
   if not src.exists():shutil.copy2(p,src)
   lessons=generate_mod(c,m,src)
   if lessons:lessons_map[c,m]=lessons;print(f'Curso {c} Módulo {m}: {len(lessons)} lecciones',flush=True)
 insert_curriculum(lessons_map)
 print('Total lecciones nuevas:',sum(map(len,lessons_map.values())))

if __name__=='__main__': main()

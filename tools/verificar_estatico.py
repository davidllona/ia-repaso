#!/usr/bin/env python3
"""Rapid HTML static QA: links, anchors, demo assets, mini quizzes, annotated code, reading length."""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
pages=[ROOT/'index.html'] + sorted(ROOT.glob('curso-*/index.html')) + sorted(ROOT.glob('curso-*/modulo-*.html'))+sorted(ROOT.glob('curso-*/modulo-*/leccion-*.html'))
issues=[];reads=[];quizzes=0;demos=0;snippets=0
for file in pages:
 s=BeautifulSoup(file.read_text(encoding='utf-8'),'html.parser')
 for a in s.select('a[href]'):
  href=a['href'];base,_,anc=href.partition('#')
  if href.startswith(('https:','http:','mailto:','tel:','data:','javascript:','//')):continue
  if base:
   resolved=(file.parent/unquote(base)).resolve()
   if resolved.is_dir():resolved=resolved/'index.html'
   if not resolved.exists():issues.append((str(file.relative_to(ROOT)), 'Missing link: '+href))
  elif anc and not s.find(id=anc):issues.append((str(file.relative_to(ROOT)),'Missing anchor: '+href))
 for f in s.select('figure.demo[data-demo]'):
  demos+=1
  if not (ROOT/'assets/js/demos'/ (f['data-demo']+'.js')).exists():issues.append((str(file.relative_to(ROOT)),'Missing demo: '+f['data-demo']))
 for block in s.select('script.quiz-data'):
  quizzes+=1
  try:
   q=json.loads(block.string or block.get_text())
   for question in q['preguntas']:
    if not (0<=question['correcta']<len(question['opciones'])):raise ValueError('Answer index invalid')
  except Exception as e:issues.append((str(file.relative_to(ROOT)),'Invalid quiz: '+repr(e)))
 for sn in s.select('article.snippet'):
  snippets+=1;code=sn.select_one('pre.code code')
  if not code:issues.append((str(file.relative_to(ROOT)),'Code is missing')) ;continue
  lines=code.get_text().splitlines();indices=set()
  for tr in sn.select('table.lineas tr[data-lines]'):
   for part in tr['data-lines'].split(','):
    nums=part.strip().split('-')
    if all(x.isdigit() for x in nums):indices.update(range(int(nums[0]),int(nums[-1])+1))
  unannotated=[i for i,line in enumerate(lines,1) if line.strip() and i not in indices]
  if unannotated:issues.append((str(file.relative_to(ROOT)),f'Unannotated code: lines {unannotated[:8]}'))
 if file.parent.name.startswith('modulo-'):
  pa=s.select_one('.page')
  if pa:
   for tag in pa.select('.profundizar,.snippet,pre,.quiz,.demo,.done-bar,.modnav,script,style'):tag.decompose()
   n=len(pa.get_text(' ',strip=True).split());reads.append((n,file))
   if n>840:issues.append((str(file.relative_to(ROOT)),f'Reading beyond 5 minutes for 170 words/min: {n} words'))
print(f'HTML pages: {len(pages)} | Lessons: {len(reads)} | Demos: {demos} | Quizzes: {quizzes} | Code snippets: {snippets}')
print(f'Primary reading words: maximum {max(reads)[0]}, median {sorted(x for x,p in reads)[len(reads)//2]}')
for fp,why in issues[:100]:print('ERROR:',fp,why)
print('ISSUES:',len(issues))
sys.exit(1 if issues else 0)

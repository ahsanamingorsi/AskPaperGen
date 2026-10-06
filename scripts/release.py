#!/usr/bin/env python3
"""Run before every deploy:  python3 scripts/release.py
Hashes the site, rewrites the cache name + precache list in sw.js and writes version.json.
Because sw.js changes whenever any site file changes, installed apps detect the update and show "Update available"."""
import hashlib,json,os,re,datetime
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SKIP=('sw.js','version.json','SEO-AUDIT.md','README.md')
files=sorted(os.path.join(r,f)[2:] for r,_,fs in os.walk('.') for f in fs if not r.startswith(('./scripts','./server','./.git','./vendor')) and f not in SKIP and not f.endswith('.zip'))
h=hashlib.sha1()
for f in files:h.update(f.encode());h.update(open(f,'rb').read())
build=h.hexdigest()[:8];core=['./']+files
sw=open('sw.js').read();sw=re.sub(r"V='[^']*'","V='askpapergen-"+build+"'",sw,1);sw=re.sub(r"CORE=\[.*?\];","CORE="+json.dumps(core)+";",sw,1,flags=re.S);open('sw.js','w').write(sw)
json.dump({'version':datetime.date.today().strftime('%Y.%m.%d'),'build':build},open('version.json','w'))
print('release',build,'-',len(core),'files precached')

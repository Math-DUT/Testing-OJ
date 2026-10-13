"""Import the 2025 Shenyang and Shanghai regional statements and public samples.

Shenyang uses the native Codeforces statement; Shanghai uses QOJ's Chinese
translation, checked against the original English PDF. Source PDFs are retained.
Existing contests and generated pressure data are never overwritten.
"""
import concurrent.futures, json, pathlib, re, runpy, time
from urllib.parse import urljoin
import pymupdf
from bs4 import BeautifulSoup
from curl_cffi import requests
from markdownify import markdownify

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'tmp/sources/regional-2025'
CACHE.mkdir(parents=True, exist_ok=True)
pdf_samples=runpy.run_path(str(ROOT/'scripts/import-online.py'))['pdf_samples']

TITLES = {
 'shenyang': ['Square Kingdom','Buggy Painting Software I','Buggy Painting Software II',
 'LED Display Renovation','Play It by Ear','The Bond Beyond Time','Collision Damage',
 'Cute Young Diagram Counting','Volunteer Simulator','The Echoes of Chronos','Relay Jump','Leo','The End?'],
 'shanghai': ['Menji, we miss you!','Hamu','Singularity','Not a subset sum',"Flower's land 3",
 "Flower's land 4",'Gemcrate','AGI','Round screws','Yet another mailbox problem',
 'No more regrets','Yet another permutation problem','Yet another 01 problem']}

def fetch(url, name, required=True):
    target=CACHE/name
    if target.exists():return target.read_bytes()
    for attempt in range(5):
        response=requests.get(url,proxy='http://127.0.0.1:7890',impersonate='chrome',timeout=60)
        if response.status_code==404 and not required:return None
        if response.status_code==429:
            print('Source rate limit; retrying after backoff:',name,flush=True)
            time.sleep(15*(attempt+1));continue
        response.raise_for_status();target.write_bytes(response.content)
        return response.content
    response.raise_for_status()

def native_html(article, source, cid, letter):
    for image in article.find_all('img'):
        url=urljoin(source,image['src']);filename=f'{cid}-{letter}-{pathlib.Path(url.split("?")[0]).name}'
        target=ROOT/'public/images'/filename
        if not target.exists():target.write_bytes(requests.get(url,proxy='http://127.0.0.1:7890',impersonate='chrome',timeout=60).content)
        image['src']='./images/'+filename
    for section in article.select('.section-title'):
        section.name='h2';section.attrs={}
    for tag in article.select('.tex-font-style-bf'):tag.name='strong';tag.attrs={}
    for tag in article.select('.tex-font-style-it'):tag.name='em';tag.attrs={}
    text=markdownify(str(article),heading_style='ATX',escape_underscores=False,
        escape_asterisks=False,escape_misc=False)
    # CF's $$$ inline / $$$$$$ display delimiters are not KaTeX Markdown.
    text=re.sub(r'\${6}(.*?)\${6}',lambda m:'\n\n$$\n'+m[1].strip()+'\n$$\n\n',text,flags=re.S)
    text=re.sub(r'\${3}(.*?)\${3}',lambda m:'$'+m[1].strip()+'$',text,flags=re.S)
    text=re.sub(r'\$\$(.*?)\$\$',lambda m:'$$\n'+m[1].strip()+'\n$$',text,flags=re.S)
    return text.strip().replace('\n\n## 说明\n\n','\n\n## Note\n\n')

def import_problem(task):
    city,index,title=task;cid=f'icpc-{city}-2025';letter=chr(65+index)
    pid=(14940 if city=='shenyang' else 15314)+index;source=f'https://qoj.ac/problem/{pid}'
    page=BeautifulSoup(fetch(source,f'{city}-{letter}.html'),'html.parser')
    limits=page.get_text(' ',strip=True)
    seconds=float(re.search(r'Time Limit:\s*([\d.]+)\s*s',limits)[1]);memory=int(re.search(r'Memory Limit:\s*(\d+)\s*MB',limits)[1])
    pdf=fetch(f'https://qoj.ac/download.php?id={pid}&type=statement',f'{city}-{letter}.pdf')
    assert pdf.startswith(b'%PDF')
    folder=ROOT/f'public/pdf/{cid}';folder.mkdir(parents=True,exist_ok=True);(folder/f'{letter}.pdf').write_bytes(pdf)
    doc=pymupdf.open(stream=pdf,filetype='pdf')
    (CACHE/f'{city}-{letter}.txt').write_text('\n'.join(p.get_text() for p in doc),encoding='utf8')
    if city=='shenyang':
        statements=BeautifulSoup((CACHE/'shenyang-problems.html').read_text(encoding='utf8'),'html.parser').select('.problem-statement')
        article=statements[index]
        def sample_text(pre):
            lines=pre.select('.test-example-line')
            if lines:return '\n'.join(line.get_text() for line in lines).strip()+'\n'
            for br in pre.find_all('br'):br.replace_with('\n')
            return pre.get_text().strip()+'\n'
        samples=[dict(input=sample_text(a),output=sample_text(b)) for a,b in zip(article.select('.sample-test .input pre'),article.select('.sample-test .output pre'))]
        assert samples
        article.select_one('.header').decompose()
        sample_section=article.select_one('.sample-tests')
        if sample_section:sample_section.decompose()
        markdown=native_html(article,f'https://codeforces.com/gym/106252/problem/{letter}',cid,letter)
        language='en'
    else:
        samples=pdf_samples(pdf)
        raw=fetch(source+'/statement/zh_cn',f'{city}-{letter}-zh.html',required=False)
        article=BeautifulSoup(raw,'html.parser').select_one('article.uoj-article') if raw else None
        if article:
            headings=article.find_all(['h2','h3','h4'])
            sample_heading=next((h for h in headings if h.get_text(strip=True) in ['样例','Examples','Example']),None)
            if sample_heading:
                cursor=sample_heading.next_sibling
                while cursor and not (getattr(cursor,'name',None) in ['h2','h3','h4'] and cursor.get_text(strip=True) in ['说明','Note','样例解释','样例说明']):
                    next_=cursor.next_sibling;cursor.extract();cursor=next_
                sample_heading.extract()
            for heading in article.find_all(['h3','h4']):heading.name='h2' if heading.name=='h3' else 'h3'
            markdown=native_html(article,source,cid,letter)
            if letter=='H':
                markdown=markdown.replace('一个 AGI（通用人工智能）','一个 AGI（Artificial Game Intelligence，人工游戏智能）')
            if letter=='K':
                # Original Note has two misprinted arrays. Correct them using
                # its actual sample operations; sample answers are unchanged.
                markdown=markdown.replace('`2 3 2 2 1`','`2 3 5 2 2`').replace('`7 8 7 7 6`','`7 8 5 2 2`')
            language='zh-CN'
        else:
            markdown=(ROOT/f'statements/{cid}/{letter}.md').read_text(encoding='utf8').split('\n\n',1)[1].strip()
            language='en'
    checker={'shenyang':{'C':'painting-communication','L':'leo','M':'float-1e-6'},
             'shanghai':{'A':'menji','B':'hamu','C':'fake-sort'}}[city].get(letter,'tokens')
    result=dict(id=letter,title=title,englishTitle=title,timeLimit=round(seconds*1000),memoryLimit=memory,
        source=source,qoj=source,codeforces=f'https://codeforces.com/gym/106252/problem/{letter}' if city=='shenyang' else '',
        markdown=markdown,samples=samples,checker=checker,pdf=f'./pdf/{cid}/{letter}.pdf',
        statementFormat='markdown',statementLanguage=language,testScope='samples',
        tests=[dict(input=s['input'],output=s['output'],kind='sample',label=f'公开样例 {i+1}') for i,s in enumerate(samples)])
    draft=ROOT/f'statements/{cid}/{letter}.md';draft.parent.mkdir(parents=True,exist_ok=True)
    draft.write_text(f'# {letter}. {title}\n\n{markdown}\n',encoding='utf8')
    print(cid,letter,len(samples),'samples',len(markdown),'characters',flush=True)
    return city,index,result

if __name__=='__main__':
    tasks=[(city,i,title) for city,titles in TITLES.items() for i,title in enumerate(titles)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:results=list(ex.map(import_problem,tasks))
    for city in TITLES:
        data=[p for c,i,p in sorted(results,key=lambda r:r[1]) if c==city]
        (ROOT/f'src/data/icpc-{city}-2025.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

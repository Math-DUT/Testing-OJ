"""Import official 2026 ICPC EC online statements and public samples from QOJ."""
import concurrent.futures, json, os, pathlib, re, time
import pymupdf
from bs4 import BeautifulSoup
from curl_cffi import requests
from markdownify import markdownify

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'tmp/sources/online-2026'
CACHE.mkdir(parents=True, exist_ok=True)
PROXY = os.environ.get('HTTPS_PROXY', 'http://127.0.0.1:7890')
TITLES = [
    ['Recall', 'Mod', 'Permutation Inversions', 'Sequence', 'LCM Permutation',
     '50 Years of Excellence', 'Toll Gates on a Tight Schedule', 'The First Problem',
     'A Lamp of Moon', 'String', 'Wolf Game', 'Longest Common Prefix', 'Check In', 'Red Sequence'],
    ['All Closed', 'Bread', 'Cut Tree', 'Divide and Conquer', 'Exponent',
     'Folding Game of Ohto Ai', 'Ghost of Tsushima', 'Hidden Track (Easy Version)',
     'Island', 'Joker or Judger', 'K-MEX', 'Loop'],
]

def fetch(url, target):
    if target.exists(): return target.read_bytes()
    for attempt in range(4):
        r = requests.get(url, impersonate='chrome', proxy=PROXY, timeout=45)
        if r.status_code == 200:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(r.content)
            return r.content
        if attempt < 3: time.sleep(10 if r.status_code == 429 else 3)
    raise RuntimeError(f'{url}: HTTP {r.status_code}')

def pdf_samples(pdf):
    pairs = []
    # Read each two-column sample table independently, keeping line breaks.
    for page in pymupdf.open(stream=pdf, filetype='pdf'):
        words = page.get_text('words')
        headers = [w for w in words if w[4] == 'standard']
        for w in headers:
            following = [v for v in words if abs(v[1]-w[1]) < 2 and v[0] > w[2] and v[0]-w[2] < 15]
            if not following or following[0][4] != 'input': continue
            output = next((v for v in headers if abs(v[1]-w[1]) < 2 and v[0] > w[0]+100), None)
            if not output: continue
            lines = [line['rect'] for line in page.get_drawings() if line['rect'].height < 2 and line['rect'].width > 300]
            top = max((line for line in lines if line.y0 <= w[1] and w[1]-line.y0 < 20), key=lambda r:r.y0)
            boundaries = sorted(set(round(line.y0,3) for line in lines if
                abs(line.x0-top.x0)<1 and abs(line.x1-top.x1)<1 and line.y0 > w[3]-2))
            verticals = [d['rect'].x0 for d in page.get_drawings() if d['rect'].width < 2 and
                d['rect'].height > 5 and w[2] < d['rect'].x0 < output[0] and d['rect'].y0 <= w[3]]
            divider = min(verticals, default=page.rect.width/2)
            for start,bottom in zip(boundaries,boundaries[1:]):
                left = page.get_text('text', clip=pymupdf.Rect(top.x0+1,start+1,divider-1,bottom-1)).strip()
                right = page.get_text('text', clip=pymupdf.Rect(divider+1,start+1,top.x1-1,bottom-1)).strip()
                if left and right: pairs.append({'input':left+'\n','output':right+'\n'})
    if not pairs: raise RuntimeError('No PDF samples found')
    return pairs

def import_problem(item):
    stage, i, title = item
    cid = f'icpc-online-2026-{stage}'
    pid = (20016 if stage == 1 else 20236) + i
    letter = chr(65+i)
    source = f'https://qoj.ac/problem/{pid}'
    page = fetch(source, CACHE/f'{pid}.html').decode()
    soup = BeautifulSoup(page, 'html.parser')
    text = soup.get_text(' ', strip=True)
    time_limit = round(float(re.search(r'Time Limit:\s*([\d.]+)\s*s',text)[1])*1000)
    memory = int(re.search(r'Memory Limit:\s*(\d+)\s*MB',text)[1])
    pdf_path = ROOT/f'public/pdf/{cid}/{letter}.pdf'
    if stage == 1:
        pdf = fetch(f'https://qoj.ac/download.php?id={pid}&type=statement', CACHE/f'{pid}.pdf')
        if not pdf.startswith(b'%PDF'): raise RuntimeError(f'{pid}: not a PDF')
        pdf_path.parent.mkdir(parents=True, exist_ok=True)
        pdf_path.write_bytes(pdf)
        samples = pdf_samples(pdf)
        # Keep the original mathematical typesetting in the PDF viewer.
        markdown = ''
        format_ = 'pdf'
    else:
        article = soup.select_one('article.uoj-article')
        if not article: raise RuntimeError(f'{pid}: statement missing')
        samples = []
        for h in article.find_all(['h3','h4']):
            if re.fullmatch(r'Input \d+', h.get_text(strip=True)):
                pre = h.find_next('pre')
                out_heading = h.find_next(['h3','h4'])
                assert out_heading and out_heading.get_text(strip=True).startswith('Output ')
                samples.append({'input':pre.get_text().strip()+'\n', 'output':out_heading.find_next('pre').get_text().strip()+'\n'})
        if not samples: raise RuntimeError(f'{pid}: samples missing')
        # Samples are rendered separately by the application and PDF builder.
        example_heading = next(h for h in article.find_all(['h3','h4']) if h.get_text(strip=True) == 'Examples')
        cursor = example_heading.next_sibling
        while cursor and not (getattr(cursor,'name',None) in ['h3','h4'] and cursor.get_text(strip=True) == 'Note'):
            next_ = cursor.next_sibling; cursor.extract(); cursor=next_
        example_heading.extract()
        for h in article.find_all(['h3','h4']): h.name='h2' if h.name=='h3' else 'h3'
        markdown = markdownify(str(article), heading_style='ATX', escape_underscores=False, escape_asterisks=False, escape_misc=False).strip()
        markdown = re.sub(r'\$\$(.*?)\$\$',lambda m:'$$\n'+m[1].strip()+'\n$$',markdown,flags=re.S)
        for image in article.find_all('img'):
            asset_url = image.get('src','')
            if asset_url:
                from urllib.parse import urljoin
                asset_url = urljoin(source, asset_url)
                filename=f'{cid}-{letter}-{pathlib.Path(asset_url.split("?")[0]).name}'
                fetch(asset_url,ROOT/'public/images'/filename)
                markdown=markdown.replace(image['src'],'./images/'+filename)
        format_='markdown'
    result = dict(id=letter,title=title,englishTitle=title,timeLimit=time_limit,memoryLimit=memory,
        source=source,qoj=source,codeforces='',markdown=markdown,samples=samples,checker='tokens',
        pdf=f'./pdf/{cid}/{letter}.pdf',statementFormat=format_)
    draft=ROOT/f'statements/{cid}/{letter}.md';draft.parent.mkdir(parents=True,exist_ok=True)
    if markdown:draft.write_text(f'# {letter}. {title}\n\n{markdown}\n',encoding='utf-8')
    if stage == 1:
        doc=pymupdf.open(stream=pdf,filetype='pdf')
        (CACHE/f'{pid}.txt').write_text('\n'.join(p.get_text() for p in doc),encoding='utf-8')
    print(cid,letter,title,len(samples),'samples',flush=True)
    return stage,i,result

if __name__ == '__main__':
    tasks=[(stage,i,t) for stage,titles in enumerate(TITLES,1) for i,t in enumerate(titles)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:results=list(ex.map(import_problem,tasks))
    for stage in [1,2]:
        data=[p for st,i,p in sorted(results,key=lambda r:(r[0],r[1])) if st==stage]
        target=ROOT/f'src/data/icpc-online-2026-{stage}.json';target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

"""Import the public LNCPC 2025 statements and samples; never claim samples are full data."""
import concurrent.futures, http.cookiejar, json, pathlib, re, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
TITLES = ['Adventure of gulls','Be knocked off','Colorful logo','Do you play Ballance?','Entering the unknown','Front and back stone-taking','Generalized star graphs','Homeland rescue','I take from the richer','Just reseat!','Kanon','Leak','Many CF Rounds vs Capoo']

def read_problem(i):
    pid = 14581 + i
    cache = ROOT / f'tmp/sources/P{pid}.html'
    if cache.exists():
        page = cache.read_text(encoding='utf-8')
    else:
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        request = urllib.request.Request(f'https://www.luogu.com.cn/problem/P{pid}?_contentOnly=1', headers={'User-Agent':'Mozilla/5.0'})
        page = opener.open(request, timeout=45).read().decode('utf-8')
    context = json.loads(re.search(r'<script id="lentille-context" type="application/json">(.*?)</script>', page, re.S).group(1))
    p = context['data']['problem']
    sections = []
    for key, title in [('background',''),('description',''),('formatI','Input'),('formatO','Output'),('hint','Note')]:
        body = p['content'][key].strip()
        # Luogu uses a single backslash as a paragraph break outside math.
        body = re.sub(r'：\\\s*\n', '：\n\n', body)
        body = re.sub(r'。\\\s*\n', '。\n\n', body)
        if body:
            sections.append((f'## {title}\n\n' if title else '') + body)
    markdown = '\n\n'.join(sections)
    # Display math delimiters must occupy their own lines for CommonMark.
    markdown = re.sub(r'\$\$(.*?)\$\$', lambda m:'$$\n'+m.group(1).strip()+'\n$$', markdown, flags=re.S)
    markdown = markdown.replace('$ put_', '$put_')
    assets = ROOT / 'public/images'
    assets.mkdir(parents=True, exist_ok=True)
    for url in set(re.findall(r'!\[.*?\]\((https://[^ )]+)\)', markdown)):
        filename = url.rsplit('/',1)[1]
        target = assets / filename
        if not target.exists():
            target.write_bytes(urllib.request.urlopen(url,timeout=30).read())
        markdown = markdown.replace(url, './images/'+filename)
    time_ms = max(p['limits']['time'])
    memory_mb = max(p['limits']['memory'])//1024
    result = {'id':chr(65+i),'title':re.sub(r'^\[LNCPC 2025\]\s*','',p['name']),'englishTitle':TITLES[i], 'timeLimit':time_ms,'memoryLimit':memory_mb,'source':f'https://www.luogu.com.cn/problem/P{pid}', 'qoj':f'https://qoj.ac/problem/{14742+i}', 'codeforces':f'https://codeforces.com/gym/106380/problem/{chr(65+i)}','markdown':markdown,'samples':[{'input':s[0],'output':s[1]} for s in p['samples']], 'checker':'gulls' if i==0 else 'keyboard' if i==1 else 'mex' if i==11 else 'tokens'}
    assert result['samples'] and result['markdown'] and '\ufffd' not in result['markdown']
    return result

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        problems = list(ex.map(read_problem,range(13)))
    (ROOT/'src').mkdir(exist_ok=True)
    (ROOT/'src/problems.json').write_text(json.dumps(problems,ensure_ascii=False,indent=2),encoding='utf-8')
    for p in problems:
        target=ROOT/'statements'/f'{p["id"]}.md'
        target.parent.mkdir(exist_ok=True)
        target.write_text(f'# Problem {p["id"]}. {p["title"]}\n\n'+p['markdown'],encoding='utf-8')
    print('Imported', len(problems), 'problems;',sum(len(p['samples']) for p in problems),'sample pairs')

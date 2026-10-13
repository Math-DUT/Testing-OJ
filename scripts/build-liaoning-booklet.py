"""Make a printable A4 teammate booklet with contents, links and bookmarks."""
import io,json,pathlib,shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader,PdfWriter
from pypdf.annotations import Link

ROOT=pathlib.Path(__file__).resolve().parents[1]
problems=json.loads((ROOT/'src/problems.json').read_text(encoding='utf8'))
pdfmetrics.registerFont(TTFont('SimSun','C:/Windows/Fonts/simsun.ttc',subfontIndex=0))
width,height=A4
documents=[PdfReader(ROOT/f'public/pdf/{p["id"]}.pdf') for p in problems]
starts=[];total=1
for doc in documents:starts.append(total);total+=len(doc.pages)
def footer(c,page,letter=None):
    c.setFillColorRGB(.4,.4,.4);c.setFont('Times-Roman',8)
    c.drawString(54,22,'LNCPC 2025'+(f' / Problem {letter}' if letter else ' / Problem Set'))
    c.drawRightString(width-54,22,f'{page} / {total}')

cover=io.BytesIO();c=canvas.Canvas(cover,pagesize=A4)
c.setFont('Times-Roman',10);c.setFillColorRGB(.35,.35,.35);c.drawCentredString(width/2,height-94,'PROBLEM SET')
c.setFillColorRGB(0,0,0);c.setFont('SimSun',25)
c.drawCentredString(width/2,height-145,'第六届辽宁省')
c.drawCentredString(width/2,height-184,'大学生程序设计竞赛（沈阳）')
c.setFont('Times-Roman',13)
c.drawCentredString(width/2,height-220,'The 6th Liaoning Provincial Collegiate Programming Contest')
c.setFont('SimSun',11);c.drawCentredString(width/2,height-251,'2025 年 11 月 15 日  ·  A-M 共 13 题  ·  比赛时长 5 小时')
c.setLineWidth(.5);c.line(54,height-280,width-54,height-280)
c.setFont('SimSun',11);c.drawString(60,height-308,'题号 / 题目');c.drawRightString(width-60,height-308,'页码')
links=[]
for p,start,index in zip(problems,starts,range(len(problems))):
    y=height-340-index*24
    c.setFont('Times-Roman',11);c.drawString(62,y,p['id'])
    c.setFont('SimSun',11);c.drawString(92,y,p['title'])
    c.setFont('Times-Roman',11);c.drawRightString(width-62,y,str(start+1))
    links.append(((54,y-5,width-54,y+16),start))
c.setFont('SimSun',9);c.setFillColorRGB(.4,.4,.4)
c.drawCentredString(width/2,103,'完整题面、数据范围、公开样例及说明；不含题解。')
c.drawCentredString(width/2,83,'题目版权归原命题组；题面来源：官方重现赛 / 洛谷。')
footer(c,1);c.showPage();c.save()
writer=PdfWriter();writer.add_page(PdfReader(cover).pages[0]);page_number=2
for p,doc,start in zip(problems,documents,starts):
    writer.add_outline_item(f'{p["id"]}. {p["title"]}',start)
    for page in doc.pages:
        overlay=io.BytesIO();stamp=canvas.Canvas(overlay,pagesize=A4)
        stamp.setFillColorRGB(1,1,1);stamp.rect(0,0,width,35,fill=1,stroke=0)
        footer(stamp,page_number,p['id']);stamp.showPage();stamp.save()
        page.merge_page(PdfReader(overlay).pages[0]);writer.add_page(page);page_number+=1
for rect,start in links:writer.add_annotation(0,Link(rect=rect,target_page_index=start))
writer.add_metadata({'/Title':'第六届辽宁省大学生程序设计竞赛（沈阳）- 完整题面册',
 '/Author':'原命题组；Testing OJ 排版','/Subject':'2025-11-15 / 13 problems / Chinese statements / No solutions'})
output=ROOT/'output/pdf/第六届辽宁省ICPC省赛-完整题面册.pdf';output.parent.mkdir(parents=True,exist_ok=True)
with output.open('wb') as stream:writer.write(stream)
shutil.copyfile(output,ROOT/'public/pdf/LNCPC-2025.pdf')
check=PdfReader(output);assert len(check.pages)==total and len(check.outline)==13
print(f'Booklet: {total} A4 pages; 13 linked contents entries and bookmarks; {output}')

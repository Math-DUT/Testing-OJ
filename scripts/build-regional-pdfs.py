"""Retain original regional statement layouts; add letters and a linked cover."""
import io,json,pathlib
import pymupdf
from pypdf import PdfReader,PdfWriter
from pypdf.annotations import Link
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
ROOT=pathlib.Path(__file__).resolve().parents[1]
for city,date in [('shenyang','November 16, 2025'),('shanghai','November 23, 2025')]:
    cid=f'icpc-{city}-2025';problems=json.loads((ROOT/f'src/data/{cid}.json').read_text(encoding='utf8'))
    folder=ROOT/f'public/pdf/{cid}';documents=[];starts=[];total=1
    for p in problems:
        doc=pymupdf.open(ROOT/f'tmp/sources/regional-2025/{city}-{p["id"]}.pdf');page=doc[0]
        title=f'Problem {p["id"]}. {p["title"]}'
        matches=[r for variant in [p['title'],p['title'].replace("'",'’')] for r in page.search_for(variant) if r.y0<80]
        assert matches,(cid,p['id'],'title missing')
        rect=matches[0];page.add_redact_annot(rect,fill=(1,1,1));page.apply_redactions(images=0)
        font=pymupdf.Font('tibo');size=min(18,(page.rect.width-96)/font.text_length(title,fontsize=1))
        box=pymupdf.Rect(48,rect.y0-2,page.rect.width-48,rect.y1+15)
        assert page.insert_textbox(box,title,fontname='tibo',fontsize=size,align=1)>=0
        doc.set_metadata({'title':title,'subject':p['source'],'author':'Original ICPC problem setters'})
        data=doc.tobytes(garbage=4,deflate=True);(folder/f'{p["id"]}.pdf').write_bytes(data)
        reader=PdfReader(io.BytesIO(data));starts.append(total);total+=len(reader.pages);documents.append(reader)
    cover=io.BytesIO();c=canvas.Canvas(cover,pagesize=A4);w,h=A4
    c.setFont('Times-Roman',11);c.drawCentredString(w/2,h-100,'PROBLEM SET')
    c.setFont('Times-Bold',27);c.drawCentredString(w/2,h-153,'The 2025 ICPC Asia')
    c.drawCentredString(w/2,h-192,f'{city.title()} Regional Contest')
    c.setFont('Times-Roman',13);c.drawCentredString(w/2,h-227,date+' / 13 Problems / 5 Hours')
    c.setLineWidth(.5);c.line(54,h-263,w-54,h-263)
    links=[]
    for index,(p,start) in enumerate(zip(problems,starts)):
        y=h-300-index*26;c.setFont('Times-Bold',11);c.drawString(60,y,p['id'])
        c.setFont('Times-Roman',11);c.drawString(91,y,p['title']);c.drawRightString(w-61,y,str(start+1))
        links.append(((54,y-5,w-54,y+17),start))
    c.setFont('Times-Roman',9);c.drawCentredString(w/2,83,'Original English statements / No solutions / Testing OJ')
    c.showPage();c.save();writer=PdfWriter();writer.add_page(PdfReader(cover).pages[0])
    for p,start,doc in zip(problems,starts,documents):
        writer.add_outline_item(f'{p["id"]}. {p["title"]}',start)
        for page in doc.pages:writer.add_page(page)
    for rect,start in links:writer.add_annotation(0,Link(rect=rect,target_page_index=start))
    writer.add_metadata({'/Title':f'The 2025 ICPC Asia {city.title()} Regional Contest - Problem Set'})
    with (folder/'problemset.pdf').open('wb') as stream:writer.write(stream)
    print(cid,total,'pages; original English statements with letter titles and bookmarks')

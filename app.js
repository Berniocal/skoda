"use strict";
(function(){
const KEY="skoda-admin-data-v1";
const defaults=()=>JSON.parse(JSON.stringify(window.SKODA_DEFAULT_DATA||{version:1,models:[]}));
const normal=d=>({version:1,updatedAt:d.updatedAt||new Date().toISOString(),models:Array.isArray(d.models)?d.models:[]});
function read(){try{const s=localStorage.getItem(KEY);return s?normal(JSON.parse(s)):defaults();}catch(e){return defaults();}}
function store(d){d.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(normal(d)));}
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
const safeUrl=s=>{try{const u=new URL(s,location.href);return /^https?:$/.test(u.protocol)?u.href:"";}catch(e){return "";}}
const label={front:"Zepředu",rear:"Zezadu",side:"Z boku"};
let data=read();
function main(){
const grid=document.getElementById("grid");if(!grid)return;
const chooser=document.getElementById("choose"),fam=document.getElementById("family"),view=document.getElementById("view"),col=document.getElementById("columns"),count=document.getElementById("count");
let selected=new Set(data.models.map(m=>m.id));
const zoom=document.getElementById("zoom");
document.getElementById("closezoom").onclick=()=>zoom.close();
zoom.addEventListener("click",e=>{if(e.target===zoom)zoom.close();});
let ids=[...new Set(data.models.map(m=>m.family))].filter(Boolean).sort((a,b)=>a.localeCompare(b,"cs"));
ids.forEach(x=>{const opt=make("option","",x);opt.value=x;fam.add(opt);});
function photo(m,k){const f=make("figure","photo"),src=safeUrl(m.images&&m.images[k]),source=safeUrl(m.sources&&m.sources[k])||src;
if(src){const im=make("img");im.src=src;im.loading="lazy";im.alt=m.family+" "+m.generation+" "+m.variant+" "+label[k];im.onerror=()=>{im.style.display="none";f.insertBefore(make("p","note","Fotografie se nepodařila načíst – otevři zdroj."),f.firstChild);};
im.onclick=()=>{document.getElementById("zoomimg").src=src;document.getElementById("zoomtitle").textContent=im.alt;document.getElementById("zoomsource").href=source;if(zoom.showModal)zoom.showModal();else window.open(src,"_blank","noopener");};f.append(im);}
else f.append(make("p","empty","Fotografie dosud není vyplněná."));
const cap=make("figcaption");cap.append(make("strong","",label[k]));if(source){const a=make("a","","Zdroj ↗");a.href=source;a.target="_blank";a.rel="noopener noreferrer";cap.append(a);}f.append(cap);return f;}
function card(m){const a=make("article","card"),top=make("div","card-head"),h=make("div"),headline=make("h3","",m.family+" "+m.generation+" · "+m.variant);
h.append(headline,make("div","muted",m.years+" · "+m.bodyStyle));top.append(h,make("span","tag",m.badge||m.variant));
const ph=make("div","photos"+(view.value==="all"?" multi":""));const keys=view.value==="all"?["front","rear","side"]:[view.value];ph.style.setProperty("--photos",keys.length);keys.forEach(k=>ph.append(photo(m,k)));
const det=make("details");det.append(make("summary","","Jak ji poznat?"),make("p","",m.description||"Popis není vyplněn."));
a.append(top,ph,det);return a;}
function draw(){chooser.replaceChildren();data.models.forEach(m=>{const b=make("button","pill"+(selected.has(m.id)?" active":""),m.family+" "+m.generation+(m.variant==="Facelift"?" FL":""));b.setAttribute("aria-pressed",String(selected.has(m.id)));b.onclick=()=>{selected.has(m.id)?selected.delete(m.id):selected.add(m.id);draw();};chooser.append(b);});
grid.style.setProperty("--columns",col.value);grid.replaceChildren();
const ms=data.models.filter(m=>selected.has(m.id)&&(!fam.value||m.family===fam.value));count.textContent="Vybráno "+ms.length+" z "+data.models.length+" verzí";if(!ms.length)grid.append(make("div","empty","Vyber alespoň jednu verzi nahoře."));else ms.forEach(m=>grid.append(card(m)));}
document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{const p=b.dataset.preset;selected=new Set(data.models.filter(m=>p==="all"||(p==="orig"&&m.variant!=="Facelift")||(p==="fl"&&m.variant==="Facelift")).map(m=>m.id));draw();});
[view,col,fam].forEach(x=>x.onchange=draw);draw();
}
function admin(){
const list=document.getElementById("admin-list");if(!list)return;
const status=document.getElementById("status");
function report(t){status.textContent=t;}
function field(name,initial,cb,big){const lab=make("label","field"+(big?" wide":"")),txt=make("span","",name),f=make(big?"textarea":"input");if(!big)f.type="text";f.value=initial||"";f.oninput=()=>cb(f.value);lab.append(txt,f);return lab;}
function render(){list.replaceChildren();document.getElementById("admin-count").textContent=data.models.length;
data.models.forEach((m,i)=>{const card=make("article","admin-record"),head=make("div","admin-header"),name=make("h3","",m.family+" "+m.generation+" "+m.variant),actions=make("div","buttons");
const up=make("button","","↑"),down=make("button","","↓"),del=make("button","danger","Smazat");up.disabled=i===0;down.disabled=i===data.models.length-1;
up.onclick=()=>{[data.models[i-1],data.models[i]]=[data.models[i],data.models[i-1]];render();};down.onclick=()=>{[data.models[i+1],data.models[i]]=[data.models[i],data.models[i+1]];render();};del.onclick=()=>{if(confirm("Smazat model "+m.family+" "+m.generation+"?")){data.models.splice(i,1);render();}};
actions.append(up,down,del);head.append(name,actions);const fields=make("div","admin-grid");
for(const [title,key] of [["ID","id"],["Modelová řada","family"],["Generace","generation"],["Verze (Původní / Facelift)","variant"],["Roky","years"],["Karoserie","bodyStyle"],["Štítek","badge"],["Popisek","description"]])fields.append(field(title,m[key],v=>m[key]=v,key==="description"));
for(const [k,t] of [["front","zepředu"],["rear","zezadu"],["side","z boku"]]){
if(!m.images)m.images={};if(!m.sources)m.sources={};
fields.append(field("Odkaz na fotku "+t,m.images[k],v=>m.images[k]=v,true),field("Zdroj / autor fotografie "+t,m.sources[k],v=>m.sources[k]=v,true));
}
card.append(head,fields);list.append(card);});}
document.getElementById("add").onclick=()=>{data.models.push({id:"model-"+Date.now(),family:"Nový model",generation:"",variant:"Původní",years:"",bodyStyle:"",badge:"",description:"",images:{front:"",rear:"",side:""},sources:{front:"",rear:"",side:""}});render();report("Položka přidána. Změny je třeba uložit.");};
document.getElementById("save").onclick=()=>{try{store(data);report("Uloženo do tohoto prohlížeče. Pro zveřejnění všem stáhni data.js a nahraj ho na GitHub.");}catch(e){report("Nepodařilo se uložit: "+e.message);}};
document.getElementById("reset").onclick=()=>{if(confirm("Smazat místní úpravy a obnovit výchozí soubor?")){localStorage.removeItem(KEY);data=defaults();render();report("Obnovena původní data.");}};
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(JSON.stringify(data,null,2)).then(()=>report("Zkopírován JSON."),()=>report("Kopírování nebylo povoleno."));
document.getElementById("download").onclick=()=>{const file="window.SKODA_DEFAULT_DATA = "+JSON.stringify(normal(data),null,2)+";\n";const b=new Blob([file],{type:"text/javascript;charset=utf-8"}),a=make("a");a.href=URL.createObjectURL(b);a.download="data.js";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);report("Stažen data.js pro výměnu v repozitáři.");};
document.getElementById("importfile").onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!Array.isArray(j.models))throw Error("Chybí pole models.");data=normal(j);render();report("Importováno "+j.models.length+" verzí. Pro zachování ještě klikni na Uložit.");}catch(err){report("Chyba importu: "+err.message);}};
render();
}
document.addEventListener("DOMContentLoaded",()=>{main();admin();});
})();
'use strict';
const STORAGE_KEY='skoda-atlas-admin-data-v1';
let rows=[];
const $=s=>document.querySelector(s);
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=[
 ['id','Jedinečné ID'],['model','Modelová řada'],['generation','Generace'],['group','Skupina (Evropa / Historické / Mimo Evropu)'],
 ['start','Rok od'],['end','Rok do (prázdné = dosud)'],['body','Karoserie'],['description','Jak ji poznat'],['note','Doplňující poznámka']
];
const photoFields=[['url','URL fotografie'],['original','URL originálu'],['source','URL zdroje'],['author','Autor / zdroj'],['license','Licence / údaj o právech']];
function status(t){$('#status').textContent=t}
function valid(x){return Array.isArray(x)&&x.every(d=>d&&typeof d==='object'&&typeof d.id==='string'&&typeof d.model==='string'&&typeof d.body==='string'&&typeof d.facelift==='boolean')}
function clone(obj){return JSON.parse(JSON.stringify(obj))}
function field(label,value,onchange,textarea=false){const wrap=document.createElement('label');wrap.className=textarea?'wide':'';wrap.append(document.createTextNode(label));const input=document.createElement(textarea?'textarea':'input');if(!textarea)input.type='text';input.value=value??'';input.addEventListener('input',()=>onchange(input.value));wrap.append(input);return wrap}
function draw(){
 const search=$('#searchAdmin').value.trim().toLowerCase();
 const target=$('#records');target.replaceChildren();
 rows.forEach((r,i)=>{
  const title=[r.model,r.generation,r.facelift?'FL':'původní',r.body].filter(Boolean).join(' · ');
  if(search&&!`${title} ${r.id}`.toLowerCase().includes(search))return;
  const card=document.createElement('details');card.className='admin-card';
  const head=document.createElement('summary');const strong=document.createElement('strong');strong.textContent=`${i+1}. ${title}`;const hint=document.createElement('small');hint.textContent=`${r.start||''}–${r.end||'dosud'} · ${r.id}`;head.append(strong,hint);card.append(head);
  const contents=document.createElement('div');const grid=document.createElement('div');grid.className='admin-fields';
  fields.forEach(([key,label])=>grid.append(field(label,r[key],v=>{r[key]=v},key==='description'||key==='note')));
  const fl=document.createElement('label');fl.textContent='Provedení';const select=document.createElement('select');select.innerHTML='<option value="false">Před faceliftem / původní</option><option value="true">Po faceliftu</option>';select.value=String(!!r.facelift);select.addEventListener('change',()=>r.facelift=select.value==='true');fl.append(select);grid.append(fl);
  ['front','rear'].forEach(angle=>{
   r[angle]??={url:'',original:'',source:'',author:'',license:''};
   const label=document.createElement('div');label.className='photo-fields';label.textContent=angle==='front'?'Fotografie zepředu':'Fotografie zezadu';grid.append(label);
   photoFields.forEach(([key,label])=>grid.append(field(label,r[angle][key],v=>r[angle][key]=v)));
  });
  const actions=document.createElement('div');actions.className='admin-small-actions';
  const del=document.createElement('button');del.className='admin-btn danger';del.textContent='Smazat';del.addEventListener('click',()=>{if(confirm('Opravdu smazat '+title+'?')){rows.splice(i,1);draw();}});
  const up=document.createElement('button');up.className='admin-btn secondary';up.textContent='↑ Nahoru';up.disabled=i===0;up.addEventListener('click',()=>{[rows[i-1],rows[i]]=[rows[i],rows[i-1]];draw()});
  const down=document.createElement('button');down.className='admin-btn secondary';down.textContent='↓ Dolů';down.disabled=i===rows.length-1;down.addEventListener('click',()=>{[rows[i+1],rows[i]]=[rows[i],rows[i+1]];draw()});
  actions.append(up,down,del);contents.append(grid,actions);card.append(contents);target.append(card);
 });
 $('#total').textContent=`${rows.length} položek v katalogu`;
}
function snapshot(){const ids=rows.map(x=>x.id);if(ids.length!==new Set(ids).size)throw Error('Některá ID se opakují. Každá položka musí mít jedinečné ID.');if(!valid(rows))throw Error('Chybí povinné údaje nebo správný formát modelu.');return clone(rows)}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot()));status('Uloženo v tomto prohlížeči. Pro zveřejnění všech změn stáhni data.json.')}catch(e){status('Chyba: '+e.message)}}
function download(){try{const json=JSON.stringify(snapshot(),null,2)+'\n';const blob=new Blob([json],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Exportován celý aktuální katalog. Nahraj soubor data.json na GitHub.')}catch(e){status('Chyba: '+e.message)}}
$('#save').onclick=save;$('#download').onclick=download;$('#searchAdmin').oninput=draw;
$('#add').onclick=()=>{const r={id:'novy-'+Date.now(),model:'Nový model',generation:'',facelift:false,start:'',end:'',body:'Liftback',group:'Evropa',description:'',note:'',front:{url:'',original:'',source:'',author:'',license:''},rear:{url:'',original:'',source:'',author:'',license:''}};rows.push(r);$('#searchAdmin').value='';draw();const cards=document.querySelectorAll('.admin-card');const last=cards[cards.length-1];last.open=true;last.scrollIntoView({behavior:'smooth',block:'center'});status('Model přidán. Po úpravě ho ulož.');};
$('#reset').onclick=()=>{if(confirm('Zahodit všechny lokální úpravy a načíst data z GitHubu?')){localStorage.removeItem(STORAGE_KEY);location.reload()}};
$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!valid(parsed))throw Error('Soubor neobsahuje očekávané pole modelů.');rows=parsed;draw();status('Načteno '+rows.length+' modelů. Pro trvalé převzetí klikni na Uložit lokálně.')}catch(e){status('Import selhal: '+e.message)}e.target.value=''};
(async()=>{try{const r=await fetch('data.json',{cache:'no-cache'});if(!r.ok)throw Error('Soubor data.json chybí.');const original=await r.json();const saved=localStorage.getItem(STORAGE_KEY);rows=saved?JSON.parse(saved):original;if(!valid(rows))throw Error('Neočekávaný formát dat.');draw();status('Načteno '+rows.length+' položek. Admin upravuje stejná data jako původní Atlas.')}catch(e){status('Katalog nelze načíst: '+e.message)}})();
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

// Wikimedia Commons: přímé načtení autora a licence pomocí MediaWiki imageinfo API.
// Není potřeba GitHub token; záznam se upraví až po potvrzení a publikace se provádí zvlášť.
function wikimediaFileTitle(photo){
 if(!photo||!photo.url)return null;
 let mediaUrl;
 try{mediaUrl=new URL(photo.url)}catch{return null}
 // Odmítnout cizí fotku, i když po staré fotce zůstal odkaz na Commons.
 if(mediaUrl.protocol!=='https:'||!['upload.wikimedia.org','commons.wikimedia.org'].includes(mediaUrl.hostname))return null;
 if(mediaUrl.hostname==='upload.wikimedia.org'&&!mediaUrl.pathname.startsWith('/wikipedia/commons/'))return null;
 const candidates=[photo.source,photo.original,photo.url];
 for(const address of candidates){
  if(!address)continue;
  try{
   const uri=new URL(address);
   if(uri.protocol!=='https:')continue;
   if(uri.hostname==='commons.wikimedia.org'){
    const raw=uri.searchParams.get('title')||(uri.pathname.startsWith('/wiki/')?decodeURIComponent(uri.pathname.slice(6)):null);
    if(raw&&/^(File|Image):/i.test(raw))return 'File:'+raw.replace(/^(File|Image):/i,'').replace(/_/g,' ');
   }
  }catch{}
 }
 // V katalogu Commons bývá originální název dostupný v poli "file".
 if(photo.file&&typeof photo.file==='string')return 'File:'+photo.file;
 for(const address of [photo.original,photo.url]){
  if(!address)continue;
  try{
   const uri=new URL(address);
   if(uri.hostname!=='upload.wikimedia.org'||!uri.pathname.startsWith('/wikipedia/commons/'))continue;
   const parts=uri.pathname.split('/');
   let filename=decodeURIComponent(parts.at(-1)||'');
   if(uri.pathname.includes('/thumb/'))filename=decodeURIComponent(parts.at(-2)||'');
   if(filename)return 'File:'+filename.replace(/_/g,' ');
  }catch{}
 }
 return null;
}
function wikimediaPlainText(html){
 if(!html)return '';
 const doc=new DOMParser().parseFromString(String(html),'text/html');
 return (doc.body.textContent||'').replace(/\s+/g,' ').trim().slice(0,800);
}
async function fetchWikimediaMetadata(photo,inputs,button,row,recordTitle){
 const fileTitle=wikimediaFileTitle(photo);
 if(!fileTitle){status('Pro tento snímek nelze načíst Wikimedia metadata: není z Wikimedia Commons.');return;}
 const prev=button.textContent;
 button.disabled=true;button.textContent='Načítám z Wikimedia…';
 try{
  const params=new URLSearchParams({
   action:'query',format:'json',formatversion:'2',
   prop:'imageinfo',iiprop:'url|extmetadata',
   iiextmetadatamultilang:'0',iiextmetadatalanguage:'en',
   titles:fileTitle,origin:'*'
  });
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params.toString(),{mode:'cors',cache:'no-store'});
  if(!response.ok)throw Error('Wikimedia odpověděla chybou HTTP '+response.status+'.');
  const result=await response.json();
  if(result.error)throw Error(String(result.error.info||'Wikimedia API vrátilo chybu.'));
  const page=result.query?.pages?.[0];
  if(!page||page.missing||!page.imageinfo?.length)throw Error('Soubor nebyl na Wikimedia Commons nalezen: '+fileTitle);
  const info=page.imageinfo[0],metadata=info.extmetadata||{};
  const author=wikimediaPlainText(metadata.Artist?.value);
  const license=wikimediaPlainText(metadata.LicenseShortName?.value||metadata.UsageTerms?.value);
  const licenseUrl=String(metadata.LicenseUrl?.value||'');
  const source=info.descriptionurl||'https://commons.wikimedia.org/wiki/'+encodeURIComponent(page.title).replace(/%3A/gi,':');
  if(!author&&!license)throw Error('Wikimedia pro tuto fotografii neposkytla čitelné údaje o autorovi ani licenci. Zkontroluj stránku souboru ručně.');
  if(!rows.includes(row))throw Error('Mezitím se změnil seznam modelů. Otevři položku znovu.');
  if(wikimediaFileTitle(photo)!==fileTitle)throw Error('Mezitím se změnila fotografie. Načti údaje znovu.');
  const preview=[
   'Fotografie: '+recordTitle,
   'Pohled: '+(photo===row.front?'zepředu':'zezadu'),
   'Soubor: '+page.title,
   'Autor: '+(author||'nezjištěn – ponechá se dosavadní'),
   'Licence: '+(license||'nezjištěna – ponechá se dosavadní'),
   'Zdroj: '+source,
   licenseUrl?'Odkaz na licenci: '+licenseUrl:'',
   '',
   'Převzít nalezené údaje do formuláře? Fotografie samotná se nezmění.'
  ].filter(Boolean).join('\n');
  if(!confirm(preview)){status('Převzetí metadat Wikimedia bylo zrušeno.');return;}
  if(author){photo.author=author;if(inputs.author)inputs.author.value=author;}
  if(license){photo.license=license;if(inputs.license)inputs.license.value=license;}
  photo.source=source;if(inputs.source)inputs.source.value=source;
  if(/^https:\/\/(creativecommons\.org|commons\.wikimedia\.org)\//.test(licenseUrl))photo.licenseUrl=licenseUrl;
  status('Metadata Wikimedia načtena pro '+recordTitle+'. Ulož změny lokálně nebo klikni na „Zveřejnit katalog na GitHubu“. Zkontroluj také konkrétní podmínky licence.');
 }catch(e){
  status('Wikimedia: '+e.message);
 }finally{
  button.textContent=prev;button.disabled=!wikimediaFileTitle(photo);
 }
}

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
   const photo=r[angle];
   const section=document.createElement('div');section.className='photo-fields';
   const label=document.createElement('strong');label.textContent=angle==='front'?'Fotografie zepředu':'Fotografie zezadu';
   const wikiButton=document.createElement('button');wikiButton.className='admin-btn secondary wiki-fetch';wikiButton.type='button';wikiButton.textContent='↻ Načíst autora a licenci z Wikimedia';
   wikiButton.title='Dostupné jen u fotografií z Wikimedia Commons';
   const photoInputs={};
   const refreshWikiButton=()=>{
    wikiButton.disabled=!wikimediaFileTitle(photo);
    wikiButton.title=wikiButton.disabled?'Nejprve vlož adresu fotografie z Wikimedia Commons':'Načíst metadata původního souboru z Wikimedia Commons';
   };
   wikiButton.addEventListener('click',()=>fetchWikimediaMetadata(photo,photoInputs,wikiButton,r,title));
   section.append(label,wikiButton);grid.append(section);
   photoFields.forEach(([key,fieldLabel])=>{
    const wrapper=field(fieldLabel,photo[key],v=>{
     photo[key]=v;
     if(key==='url'||key==='original'||key==='source')refreshWikiButton();
    });
    photoInputs[key]=wrapper.querySelector('input');
    grid.append(wrapper);
   });
   refreshWikiButton();
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

// GitHub REST API — jediným uloženým přihlašovacím údajem je proměnná v paměti stránky.
// Token se neukládá do localStorage, sessionStorage, souborů ani do URL.
const GITHUB_OWNER='Berniocal';
const GITHUB_REPO='skoda';
const GITHUB_BRANCH='main';
const GITHUB_CONTENTS='https://api.github.com/repos/'+GITHUB_OWNER+'/'+GITHUB_REPO+'/contents/';
let githubToken='';
let githubDataSHA=null;
let githubEditorSHA=null;
let githubEditorPath='';
let githubBusy=false;
const githubElm=id=>document.getElementById(id);
function githubStatus(text,isError=false){
 const node=githubElm('ghStatus');node.textContent=text;
 node.classList.toggle('error',isError);
}
function githubFileStatus(text,isError=false){
 const node=githubElm('ghFileStatus');node.textContent=text;
 node.style.color=isError?'#ba3535':'';
}
function githubButtons(){
 const connected=!!githubToken;
 githubElm('disconnectGithub').disabled=!connected||githubBusy;
 githubElm('reloadGithub').disabled=!connected||githubBusy;
 githubElm('ghReadFile').disabled=!connected||githubBusy;
 githubElm('publishGithub').disabled=!connected||!githubDataSHA||githubBusy;
 githubElm('ghSaveFile').disabled=!connected||!githubEditorSHA||githubBusy;
 githubElm('connectGithub').disabled=githubBusy;
}
function githubEncode(text){
 const bytes=new TextEncoder().encode(text);
 let binary='';
 for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
 return btoa(binary);
}
function githubDecode(base64){
 const str=atob(String(base64||'').replace(/\s/g,''));
 const bytes=new Uint8Array(str.length);
 for(let i=0;i<str.length;i++)bytes[i]=str.charCodeAt(i);
 return new TextDecoder().decode(bytes);
}
async function githubRequest(method,path,body){
 if(!githubToken)throw Error('Nejprve připoj GitHub token.');
 const url=GITHUB_CONTENTS+path+(method==='GET'?'?ref='+encodeURIComponent(GITHUB_BRANCH):'');
 let response;
 try{
  response=await fetch(url,{
   method,
   headers:{
    'Accept':'application/vnd.github+json',
    'Authorization':'Bearer '+githubToken,
    // Verze REST API je výchozí 2022-11-28; vlastní hlavička může blokovat browser CORS.
    ...(method!=='GET'?{'Content-Type':'application/json'}:{})
   },
   ...(method!=='GET'?{body:JSON.stringify(body)}:{}),
   cache:'no-store'
  });
 }catch(e){
  throw Error('Nepodařilo se spojit s api.github.com. Zkontroluj internet, HTTPS a blokování požadavků. '+e.message);
 }
 const responseData=await response.json().catch(()=>({}));
 if(!response.ok){
  if(response.status===401)throw Error('Token je neplatný nebo vypršel (401).');
  if(response.status===403)throw Error('Přístup zamítnut (403). Zkontroluj oprávnění Contents: Read and write, přístup k repozitáři a případné limity GitHubu.');
  if(response.status===404)throw Error('Soubor nebo repozitář není dostupný (404). Zkontroluj přístup tokenu k Berniocal/skoda.');
  if(response.status===409)throw Error('Konflikt změn (409). Soubor na GitHubu mezitím někdo upravil. Znovu načti aktuální verzi, jinak bys cizí změny přepsal.');
  throw Error('GitHub '+response.status+': '+String(responseData.message||'požadavek selhal'));
 }
 return responseData;
}
async function githubGetFile(path){
 const data=await githubRequest('GET',path);
 if(data.type!=='file'||!data.sha||!data.content)throw Error('GitHub nevrátil obsah souboru '+path+'.');
 return {sha:data.sha,text:githubDecode(data.content)};
}
async function githubWriteFile(path,sha,text,message){
 return githubRequest('PUT',path,{
  message:message,
  branch:GITHUB_BRANCH,
  sha,
  content:githubEncode(text)
 });
}
function githubSetBusy(busy){githubBusy=busy;githubButtons();}
githubElm('connectGithub').addEventListener('click',async()=>{
 const incoming=githubElm('ghToken').value.trim();
 if(!incoming){githubStatus('Vlož Fine-grained GitHub token.',true);return;}
 githubToken=incoming;githubDataSHA=null;githubEditorSHA=null;githubEditorPath='';
 githubElm('ghToken').value='';
 githubSetBusy(true);
 githubStatus('Ověřuji přístup k repozitáři Berniocal/skoda…');
 try{
  const result=await githubGetFile('data.json');
  const data=JSON.parse(result.text);
  if(!valid(data))throw Error('Na GitHubu je neplatný formát data.json.');
  // Záměrně nenastavujeme githubDataSHA: pro bezpečné publikování je potřeba
  // nejprve explicitně načíst veřejná data (aby se nepřepsala stará lokální kopie).
  githubStatus('Připojeno ke GitHubu. Nalezeno '+data.length+' položek. Klikni na „Načíst z GitHubu“, pak můžeš zveřejňovat změny.');
 }catch(e){githubToken='';githubStatus('Připojení selhalo: '+e.message,true);}
 finally{githubSetBusy(false);}
});
githubElm('disconnectGithub').addEventListener('click',()=>{
 githubToken='';githubDataSHA=null;githubEditorSHA=null;githubEditorPath='';
 githubElm('ghToken').value='';
 githubElm('ghSourceText').value='';githubElm('ghSourceText').disabled=true;
 githubElm('ghCommitMessage').value='';
 githubStatus('Odpojeno. Token byl odstraněn z paměti administrace.');
 githubFileStatus('Odpojeno.');githubButtons();
});
githubElm('reloadGithub').addEventListener('click',async()=>{
 if(!confirm('Načíst aktuální katalog přímo z GitHubu? Dosud nezveřejněné úpravy v editoru budou nahrazeny.'))return;
 githubSetBusy(true);
 try{
  const result=await githubGetFile('data.json');
  const fresh=JSON.parse(result.text);
  if(!valid(fresh))throw Error('data.json nemá správný formát.');
  rows=fresh;
  githubDataSHA=result.sha;
  localStorage.removeItem(STORAGE_KEY);
  githubElm('searchAdmin').value='';
  draw();
  githubStatus('Načten aktuální katalog z GitHubu ('+rows.length+' položek). Nyní můžeš upravovat a publikovat přímo online.');
  status('Načtena veřejná data z GitHubu. Po úpravách klikni na „Zveřejnit katalog na GitHubu“.');
 }catch(e){githubStatus('Nelze načíst katalog: '+e.message,true);}
 finally{githubSetBusy(false);}
});
githubElm('publishGithub').addEventListener('click',async()=>{
 if(!githubDataSHA){githubStatus('Nejprve klikni na „Načíst z GitHubu“.',true);return;}
 let text;
 try{text=JSON.stringify(snapshot(),null,2)+'\n';}
 catch(e){githubStatus('Neplatná data: '+e.message,true);return;}
 if(!confirm('Zveřejnit všech '+rows.length+' položek katalogu na GitHubu (main)? Změna bude viditelná všem po nasazení GitHub Pages.'))return;
 githubSetBusy(true);githubStatus('Zapisuji data.json na GitHub…');
 try{
  const response=await githubWriteFile('data.json',githubDataSHA,text,'Aktualizovat Atlas škodovek přes online administraci');
  githubDataSHA=response.content.sha;
  if(githubEditorPath==='data.json')githubEditorSHA=null;
  localStorage.removeItem(STORAGE_KEY);
  githubStatus('Úspěšně zveřejněno! GitHub commit: '+response.commit.sha.slice(0,10)+'. Změny se na webu objeví po nasazení GitHub Pages.');
  status('Publikováno na GitHub. Lokální kopie byla vymazána, aby nepřekrývala nová veřejná data.');
 }catch(e){githubStatus('Ukládání selhalo: '+e.message,true);}
 finally{githubSetBusy(false);}
});
githubElm('ghFileName').addEventListener('change',()=>{
 githubEditorSHA=null;githubEditorPath='';
 githubElm('ghSourceText').value='';githubElm('ghSourceText').disabled=true;
 githubElm('ghCommitMessage').value='';
 githubFileStatus('Soubor změněn. Klikni na „Otevřít z GitHubu“.');
 githubButtons();
});
githubElm('ghReadFile').addEventListener('click',async()=>{
 const path=githubElm('ghFileName').value;
 githubEditorSHA=null;githubEditorPath='';
 githubElm('ghSourceText').value='';githubElm('ghSourceText').disabled=true;
 githubSetBusy(true);githubFileStatus('Načítám '+path+' z GitHubu…');
 try{
  const result=await githubGetFile(path);
  githubEditorPath=path;githubEditorSHA=result.sha;
  githubElm('ghSourceText').value=result.text;
  githubElm('ghSourceText').disabled=false;
  githubElm('ghCommitMessage').value='Upravit '+path+' v online administraci Atlasu';
  githubFileStatus('Načten '+path+' · délka '+result.text.length+' znaků. Provedeš-li změnu, můžeš ji uložit přímo na GitHub.');
 }catch(e){githubFileStatus('Načtení selhalo: '+e.message,true);}
 finally{githubSetBusy(false);}
});
githubElm('ghSaveFile').addEventListener('click',async()=>{
 const path=githubEditorPath,sha=githubEditorSHA;
 if(!path||!sha||path!==githubElm('ghFileName').value){
  githubFileStatus('Nejprve načti soubor z GitHubu.',true);return;
 }
 const text=githubElm('ghSourceText').value;
 if(path==='data.json'){
  let parsed;
  try{parsed=JSON.parse(text);if(!valid(parsed))throw Error('Pole dat je neplatné.');}
  catch(e){githubFileStatus('Nelze uložit neplatný JSON: '+e.message,true);return;}
 }
 const message=githubElm('ghCommitMessage').value.trim()||'Upravit '+path+' v online administraci Atlasu';
 if(!confirm('Opravdu uložit soubor '+path+' na větev main? Chyba ve zdrojovém kódu může způsobit nefunkčnost webu.'))return;
 githubSetBusy(true);githubFileStatus('Ukládám '+path+' na GitHub…');
 try{
  const response=await githubWriteFile(path,sha,text,message);
  githubEditorSHA=response.content.sha;
  if(path==='data.json'){
   rows=JSON.parse(text);
   githubDataSHA=response.content.sha;
   localStorage.removeItem(STORAGE_KEY);
   draw();
  }
  githubFileStatus('Uloženo na GitHub! Commit: '+response.commit.sha.slice(0,10)+'. GitHub Pages zpracuje změnu.');
 }catch(e){githubFileStatus('Ukládání selhalo: '+e.message,true);}
 finally{githubSetBusy(false);}
});
githubButtons();

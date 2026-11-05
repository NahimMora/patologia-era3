/* Patología ERA 3 — centro de estudio. Vanilla JS, sin backend, progreso en localStorage. */
(function(){
'use strict';
var IMG=window.PATO_IMG||{}, CAT=window.PATO_CATALOG||[];
window.PATO_MOD=window.PATO_MOD||{};
var $app=document.getElementById('app');
var SYS={Femenino:'#e8467c',Masculino:'#3b82f6',Piel:'#e08a1e','Linfomas y tiroides':'#14a38b'};

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pct(a,b){return b?Math.round(100*a/b):0;}
function meta(id){for(var i=0;i<CAT.length;i++)if(CAT[i].id===id)return CAT[i];return null;}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seeded(arr,seed){var a=arr.slice(),x=seed||1;for(var i=a.length-1;i>0;i--){x=(Math.imul(x,1103515245)+12345)>>>0;var j=x%(i+1);var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function fmtT(s){s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
var I={
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',img:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',q:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14"/><circle cx="12" cy="17.5" r=".6" fill="currentColor"/>',
 play:'<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',route:'<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
 film:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M10 9v6l5-3z" fill="currentColor"/>',pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 chev:'<path d="m9 6 6 6-6 6"/>',back:'<path d="m15 6-6 6 6 6"/>',zoom:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/>',flag:'<path d="M5 21V4h11l-2 4 2 4H5"/>',micro:'<path d="M6 21h12M9 17h6M12 17V8M9 4l6 0M10 4v4h4V4M14 11a4 4 0 0 1 3 6"/>',
 refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'};
function ic(n,cls){return '<svg class="ic '+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+I[n]+'</svg>';}
function ring(p,col,size,stroke){size=size||58;stroke=stroke||7;var r=(size-stroke)/2,c=2*Math.PI*r;return '<svg class="ring" viewBox="0 0 '+size+' '+size+'" style="width:'+size+'px;height:'+size+'px"><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="rgba(127,120,140,.22)" stroke-width="'+stroke+'"/><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+stroke+'" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+c*(1-p/100)+'" transform="rotate(-90 '+size/2+' '+size/2+')"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="'+size*0.26+'" font-weight="800" fill="currentColor">'+p+'%</text></svg>';}

/* ---------- progreso local ---------- */
var KEY='pato3.progress.v1', S={ans:{},vid:{},seen:{},last:null};
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);if(o&&o.ans)S=o;S.vid=S.vid||{};S.seen=S.seen||{};}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function record(q,mod,kind,ch){var ok=ch===q.a;var r=S.ans[q.id]||{n:0,w:0};r.n++;if(!ok)r.w++;r.ok=ok;r.ch=ch;r.t=Date.now();r.m=mod;r.k=kind;S.ans[q.id]=r;save();return ok;}

/* ---------- carga diferida ---------- */
var loading={};
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
function loadMod(id){
  if(window.PATO_MOD[id])return Promise.resolve(window.PATO_MOD[id]);
  if(loading[id])return loading[id];
  var m=meta(id);
  loading[id]=loadScript('data/'+id+'.js?v='+(m&&m.v||1)).then(function(){if(!window.PATO_MOD[id])throw new Error('sin datos');return window.PATO_MOD[id];}).catch(function(){delete loading[id];throw new Error('No se pudo cargar el capítulo. Revisá tu conexión.');});
  return loading[id];
}
var vmetaP=null;function loadVmeta(){if(!vmetaP)vmetaP=loadScript('data/vmeta.js?v='+Date.now()).then(function(){return window.PATO_VMETA||{};}).catch(function(){vmetaP=null;return {};});return vmetaP;}

/* ---------- estadísticas ---------- */
function stats(mod){
  function st(list){var a=0,c=0,n=0;(list||[]).forEach(function(q){var r=S.ans[q.id];n++;if(r){a++;if(r.ok)c++;}});return {total:n,answered:a,correct:c};}
  var t=st(mod.theory),v=st(mod.visual),vid=S.vid[mod.id],vp=vid?Math.min(1,vid.p||0):0;
  var qT=t.total+v.total,qA=t.answered+v.answered;
  return {t:t,v:v,vp:vp,progress:Math.round(100*(0.2*vp+0.8*(qT?qA/qT:0))),acc:pct(t.correct+v.correct,qA),qT:qT,qA:qA};
}
function status(m,mod){
  if(m.status!=='ready')return {k:'prep',l:'En preparación'};
  if(!mod){var s=S.seen[m.id];return s?{k:s.k,l:s.l}:{k:'ok',l:'Disponible'};}
  var x=stats(mod),r;
  if(x.qA>=x.qT*0.5&&x.acc<60)r={k:'rev',l:'Necesita repaso'};else if(x.qA>=x.qT*0.9&&x.acc>=70)r={k:'done',l:'Completado'};else r={k:'ok',l:'Disponible'};
  S.seen[m.id]={k:r.k,l:r.l,p:x.progress,t:pct(x.t.correct,x.t.answered),v:pct(x.v.correct,x.v.answered),ta:x.t.answered,va:x.v.answered};save();return r;
}
function errCount(){var n=0;for(var k in S.ans)if(!S.ans[k].ok)n++;return n;}

/* ---------- imágenes anotadas ---------- */
function annSVG(W,H,anns,fs){
  var out='',sw='vector-effect="non-scaling-stroke"';
  (anns||[]).forEach(function(a,i){
    var col=a.c||'#ffd23f',d='';
    if(a.t==='c')d='<circle cx="'+a.x*W+'" cy="'+a.y*H+'" r="'+a.r*W+'" pathLength="1" stroke-dasharray="1" class="draw" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="7" '+sw+'/><circle cx="'+a.x*W+'" cy="'+a.y*H+'" r="'+a.r*W+'" pathLength="1" stroke-dasharray="1" class="draw" fill="none" stroke="'+col+'" stroke-width="3.5" '+sw+'/>';
    else if(a.t==='e')d='<ellipse cx="'+a.x*W+'" cy="'+a.y*H+'" rx="'+a.rx*W+'" ry="'+a.ry*H+'" pathLength="1" stroke-dasharray="1" class="draw" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="7" '+sw+'/><ellipse cx="'+a.x*W+'" cy="'+a.y*H+'" rx="'+a.rx*W+'" ry="'+a.ry*H+'" pathLength="1" stroke-dasharray="1" class="draw" fill="none" stroke="'+col+'" stroke-width="3.5" '+sw+'/>';
    else if(a.t==='r')d='<rect x="'+a.x*W+'" y="'+a.y*H+'" width="'+a.w*W+'" height="'+a.h*H+'" fill="'+col+'" fill-opacity=".12" pathLength="1" stroke-dasharray="1" class="draw" stroke="'+col+'" stroke-width="3.5" '+sw+'/>';
    else if(a.t==='a'||a.t==='l'){var x1=a.x1*W,y1=a.y1*H,x2=a.x2*W,y2=a.y2*H;d='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#000" stroke-opacity=".5" stroke-width="7" '+sw+'/><line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width="3.5" '+sw+(a.dash?' stroke-dasharray="7 6"':'')+'/>';
      if(a.t==='a'){var ang=Math.atan2(y2-y1,x2-x1),L=Math.max(W,H)*0.035;d+='<polygon points="'+x2+','+y2+' '+(x2-L*Math.cos(ang-0.45))+','+(y2-L*Math.sin(ang-0.45))+' '+(x2-L*Math.cos(ang+0.45))+','+(y2-L*Math.sin(ang+0.45))+'" fill="'+col+'" stroke="#000" stroke-width="1.2" '+sw+'/>';}}
    if(a.label){var lx=(a.lx!=null?a.lx:(a.t==='a'?a.x1:(a.x!=null?a.x:a.x1)))*W,ly=(a.ly!=null?a.ly:(a.t==='a'?a.y1:(a.y!=null?a.y-(a.r||a.ry||0.04)-0.025:a.y1)))*H,anc=a.anchor||'middle';
      if(!a.anchor){if(lx<0.16*W){anc='start';lx=Math.max(lx-0.04*W,0.015*W);}else if(lx>0.84*W){anc='end';lx=Math.min(lx+0.04*W,0.985*W);}}
      if(ly<fs*1.25)ly=fs*1.25;if(ly>H-4)ly=H-4;
      d+='<text x="'+lx+'" y="'+ly+'" text-anchor="'+anc+'" class="annl" style="font-size:'+fs+'px;stroke-width:'+fs*0.28+'px">'+esc(a.label)+'</text>';}
    out+='<g class="ag" style="animation-delay:'+(i*0.22)+'s">'+d+'</g>';
  });return out;
}
function fit(id,anns,maxH,alt){ /* img contain + SVG meet: la capa coincide exacto con la foto */
  var m=IMG[id];if(!m)return '';var fs=Math.max(m.w,m.h*1.25)/22;
  return '<span class="ov"><img src="'+m.f+'" width="'+m.w+'" height="'+m.h+'" alt="'+esc(alt||'Imagen de estudio')+'" decoding="async"><svg viewBox="0 0 '+m.w+' '+m.h+'" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+annSVG(m.w,m.h,anns,fs)+'</svg></span>';
}
function zoomAttr(id,anns,cap){return " data-zoom='"+esc(JSON.stringify({id:id,ann:anns||null,cap:cap||''}))+"'";}
function fig(id,cap,anns){return '<figure class="fig"><div class="frame"'+zoomAttr(id,anns,cap)+'><span class="aimg">'+fit(id,anns,'100%')+'</span><span class="zoomhint">'+ic('zoom')+'</span></div>'+(cap?'<figcaption>'+cap+'</figcaption>':'')+'</figure>';}
function figs(list){return '<div class="figs'+(list.length===1?' one':'')+'">'+list.map(function(v){return fig(v.img,v.cap,v.ann);}).join('')+'</div>';}
function richHTML(html){
  html=String(html).replace(/<div class="figs">([\s\S]*?)<\/div>/g,function(_,inner){return '§FIGS'+inner+'§END';});
  function one(at){var g=function(n){var r=new RegExp(n+"=(\"([^\"]*)\"|'([^']*)')").exec(at);return r?(r[2]!=null?r[2]:r[3]):null;};var a=g('ann');return {img:g('id'),cap:g('cap'),ann:a?JSON.parse(a):null};}
  html=html.replace(/§FIGS([\s\S]*?)§END/g,function(_,inner){var L=[];inner.replace(/<x-img([^>]*)><\/x-img>/g,function(__,at){L.push(one(at));});return figs(L);});
  return html.replace(/<x-img([^>]*)><\/x-img>/g,function(_,at){return figs([one(at)]);});
}
var LB=document.getElementById('lightbox');
function openLB(id,anns,cap){
  var m=IMG[id];if(!m)return;var z=1,fs=Math.max(m.w,m.h*1.25)/26;
  LB.innerHTML='<div class="lbbar"><button data-z="-1" aria-label="Alejar">−</button><button data-z="1" aria-label="Acercar">+</button><button data-x="1" aria-label="Cerrar">✕</button></div><div class="lbview"><div class="lbin"><img src="'+m.f+'" alt=""><svg viewBox="0 0 '+m.w+' '+m.h+'" preserveAspectRatio="none">'+annSVG(m.w,m.h,anns,fs)+'</svg></div></div>'+(cap?'<div class="lbcap">'+cap+'</div>':'');
  LB.hidden=false;document.body.style.overflow='hidden';
  var inn=LB.querySelector('.lbin'),view=LB.querySelector('.lbview');
  function apply(){var b=Math.min((view.clientWidth-16)/m.w,(view.clientHeight-16)/m.h);inn.style.width=(m.w*b*z)+'px';}apply();
  LB.onclick=function(e){var b=e.target.closest('button');if(!b){if(e.target===view)closeLB();return;}if(b.dataset.x){closeLB();return;}z=Math.max(1,Math.min(5,z+(+b.dataset.z)*0.75));apply();};
}
function closeLB(){LB.hidden=true;LB.innerHTML='';document.body.style.overflow='';}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!LB.hidden)closeLB();});
document.addEventListener('click',function(e){var z=e.target.closest('[data-zoom]');if(z){e.preventDefault();var d=JSON.parse(z.getAttribute('data-zoom'));openLB(d.id,d.ann,d.cap);}});

/* ---------- HOME ---------- */
function renderHome(){
  document.documentElement.style.setProperty('--sys','#e8467c');
  var tA=0,tC=0,vA=0,vC=0,prog=0,done=0;
  CAT.forEach(function(m){var s=S.seen[m.id];if(s){prog+=s.p||0;if(s.k==='done')done++;}});
  for(var k in S.ans){var r=S.ans[k];if(r.k==='t'){tA++;if(r.ok)tC++;}else{vA++;if(r.ok)vC++;}}
  var P=Math.round(prog/CAT.length);
  var h='<section class="hero"><span class="examchip">📅 Examen: jueves 5/11</span><h1>Patología <em>ERA 3</em></h1><p>Aprendé a reconocer las imágenes que necesitás para rendir.</p>'+
   '<div class="hero-row"><div class="ringwrap">'+ring(P,'#ffd23f')+'<div><b>Progreso total</b><span>'+done+' de '+CAT.length+' capítulos completos</span></div></div>'+
   '<div class="minis"><div class="mini"><b>'+(tA?pct(tC,tA)+'%':'—')+'</b><span>Teoría · '+tA+' resp.</span></div><div class="mini"><b>'+(vA?pct(vC,vA)+'%':'—')+'</b><span>Imágenes · '+vA+' resp.</span></div></div></div></section>';
  if(S.last&&meta(S.last.m)&&meta(S.last.m).status==='ready'){var lm=meta(S.last.m);h+='<a class="cont" href="#/m/'+lm.id+'/'+(S.last.s||'recorrido')+'" style="--sys:'+SYS[lm.sys]+'">'+(IMG[lm.cover]?'<img src="'+IMG[lm.cover].f+'" alt="">':'')+'<div><small>Continuar</small><b>Cap. '+lm.num+' · '+esc(lm.title)+'</b></div><span class="go">'+ic('chev')+'</span></a>';}
  var groups=[];CAT.forEach(function(m){var g=groups.filter(function(x){return x.sys===m.sys;})[0];if(!g){g={sys:m.sys,list:[]};groups.push(g);}g.list.push(m);});
  groups.forEach(function(g){
    h+='<div class="syshead" style="--sys:'+SYS[g.sys]+'"><span class="dot"></span><h2>'+esc(g.sys)+'</h2><span>'+g.list.length+' capítulo'+(g.list.length>1?'s':'')+'</span></div><div class="cgrid">';
    g.list.forEach(function(m){
      var st=status(m,window.PATO_MOD[m.id]),s=S.seen[m.id]||{},ready=m.status==='ready';
      var inner='<div class="ccover">'+(IMG[m.cover]?'<img src="'+IMG[m.cover].f+'" alt="" loading="lazy">':'')+'<div class="cnum"><small>Capítulo</small>'+String(m.num).padStart(2,'0')+'</div><span class="pill '+st.k+'">'+st.l+'</span></div>'+
       '<div class="cbody"><h3>'+esc(m.title)+'</h3><p>'+esc(m.desc)+'</p><div class="metas"><span>'+ic('clock')+'~'+m.study+' min</span>'+(ready?'<span>'+ic('img')+m.nImg+' imágenes</span><span>'+ic('q')+(m.nT+m.nV)+' preguntas</span>':'<span>'+ic('film')+'en producción</span>')+'</div><div class="pbar"><i style="width:'+(s.p||0)+'%"></i></div></div>';
      h+=ready?'<a class="ccard" style="--sys:'+SYS[m.sys]+'" href="#/m/'+m.id+'/recorrido">'+inner+'</a>':'<div class="ccard prep" style="--sys:'+SYS[m.sys]+'" aria-disabled="true">'+inner+'</div>';
    });h+='</div>';
  });
  var ec=errCount();
  h+='<a class="errcta" href="#/errores"><span class="bub">'+ic('flag')+'</span><div><b>Repasar mis errores</b><div style="color:var(--muted);font-size:.85rem">'+(ec?ec+' preguntas para repasar de todos los capítulos':'Cuando falles una pregunta, aparece acá')+'</div></div>'+ic('chev')+'</a>';
  h+='<p class="footer">Imágenes de los materiales de la cátedra (Foto.pdf, PATO-REPASO.pdf, flashcards), solo para estudio.<br>El progreso se guarda en este dispositivo · <a href="#/progreso">exportar / importar</a></p>';
  $app.innerHTML=h;
}

/* ---------- CAPÍTULO ---------- */
var SECS=[['recorrido','Recorrido','route'],['teoria','Teoría','book'],['video','Video','film'],['describir','Describí la imagen','pen'],['extra','Explicación extra','bulb'],['choice','Choice teórico','list'],['imagenes','Choice de imágenes','eye'],['resultado','Resultado','chart']];
function renderModule(id,sec,arg){
  var m=meta(id);if(!m){renderHome();return;}
  document.documentElement.style.setProperty('--sys',SYS[m.sys]);
  if(m.status!=='ready'){$app.innerHTML='<div class="blk"><div class="eyebrow">'+esc(m.sys)+' · Capítulo '+m.num+'</div><h3>'+esc(m.title)+'</h3><p>Este capítulo todavía está en preparación. Se publica apenas esté completo y verificado.</p><a class="btn" href="#/">Volver</a></div>';return;}
  $app.innerHTML='<p class="loading">Cargando capítulo…</p>';
  loadMod(id).then(function(mod){
    sec=sec||'recorrido';S.last={m:id,s:sec};save();
    var x=stats(mod);
    var nav='<nav class="snav" aria-label="Secciones">'+SECS.map(function(s,i){var done=(s[0]==='video'&&x.vp>=0.8)||(s[0]==='choice'&&x.t.total&&x.t.answered===x.t.total)||(s[0]==='imagenes'&&x.v.total&&x.v.answered===x.v.total);return '<a class="stab" href="#/m/'+id+'/'+s[0]+'" aria-current="'+(s[0]===sec)+'">'+ic(s[2])+(i+1)+'. '+s[1]+(done?' <span class="done">✓</span>':'')+'</a>';}).join('')+'</nav>';
    $app.innerHTML='<header class="mhero">'+(IMG[m.cover]?'<img class="bg" src="'+IMG[m.cover].f+'" alt="">':'')+'<a class="back" href="#/">'+ic('back')+'Capítulos</a><span class="syschip">'+esc(m.sys)+' · Capítulo '+m.num+'</span><h1>'+esc(m.title)+'</h1><div class="mprog"><div class="pbar"><i style="width:'+x.progress+'%"></i></div>'+x.progress+'% completado</div></header>'+nav+'<div id="sec"></div>';
    var cur=$app.querySelector('.stab[aria-current="true"]');if(cur&&cur.scrollIntoView)cur.scrollIntoView({inline:'center',block:'nearest'});
    var b=document.getElementById('sec');
    ({recorrido:secRecorrido,teoria:secTeoria,video:secVideo,describir:secDescribir,extra:secExtra,choice:function(b,mo){secQuiz(b,mo,'t',arg);},imagenes:function(b,mo){secQuiz(b,mo,'v',arg);},resultado:secResultado}[sec]||secRecorrido)(b,mod,m);
    window.scrollTo(0,0);
  }).catch(function(e){$app.innerHTML='<div class="blk"><h3>No se pudo abrir el capítulo</h3><p>'+esc(e.message)+'</p><button class="btn" onclick="location.reload()">Reintentar</button></div>';});
}
function nextBtn(id,sec,label){return '<div class="cta" style="margin-top:18px;justify-content:flex-end"><a class="btn sys" href="#/m/'+id+'/'+sec+'">'+label+' '+ic('chev')+'</a></div>';}
function secHead(t,p){return '<div class="sh"><div><h2>'+t+'</h2>'+(p?'<p>'+p+'</p>':'')+'</div></div>';}

function secRecorrido(b,mod,m){
  var r=mod.recorrido,x=stats(mod),id=mod.id;
  var steps=[['teoria','Teoría orientativa','~5 min · lo mínimo para entender',0],['video','Video-lección','narrado por Tomás',x.vp>=0.8],['describir','Describí la imagen','macro y micro como pide la profe',0],['extra','Explicación extra','si algo no cerró',0],['choice','Choice teórico',m.nT+' preguntas',x.t.total&&x.t.answered===x.t.total],['imagenes','Choice de imágenes',m.nV+' preguntas',x.v.total&&x.v.answered===x.v.total],['resultado','Resultado','tus errores para repetir',0]];
  var h='<div class="tiles"><div class="tile">'+ic('clock')+'<b>~'+m.study+'</b><span>minutos (video + práctica)</span></div><div class="tile">'+ic('micro')+'<b>'+r.nPat+'</b><span>patologías</span></div><div class="tile">'+ic('img')+'<b>'+m.nImg+'</b><span>imágenes reales</span></div><div class="tile">'+ic('q')+'<b>'+(m.nT+m.nV)+'</b><span>preguntas</span></div></div>';
  h+='<div class="blk"><div class="eyebrow">De qué se trata · dificultad '+esc(m.diff).toLowerCase()+'</div><p class="intro" style="margin:0">'+r.intro+'</p></div>';
  h+='<div class="blk"><h3>Tu ruta</h3><div class="route">'+steps.map(function(s,i){return '<a class="rstep'+(s[3]?' ok':'')+'" href="#/m/'+id+'/'+s[0]+'"><span class="rn">'+(s[3]?'✓':i+1)+'</span><div><b>'+s[1]+'</b><small>'+s[2]+'</small></div>'+ic('chev','chev')+'</a>';}).join('')+'</div></div>';
  if(r.pats)h+='<div class="blk"><h3>Lo que vas a reconocer</h3><div class="pats">'+r.pats.map(function(p){return '<div class="pat"><div class="th"'+zoomAttr(p.img,null,esc(p.n))+'>'+(IMG[p.img]?'<img src="'+IMG[p.img].f+'" alt="">':'')+'</div><div><span class="prio '+p.p+'">'+({P0:'IMPRESCINDIBLE',P1:'ALTA',P2:'COMPLEMENTARIA'}[p.p])+'</span><b>'+p.n+'</b><small>'+p.hint+'</small></div></div>';}).join('')+'</div></div>';
  if(r.quotes)h+='<div class="blk"><h3>La profe dijo</h3><div class="quotes">'+r.quotes.map(function(q){return '<div class="quote"><p>'+q.q+'</p><span class="ts">'+q.t+'</span></div>';}).join('')+'</div></div>';
  h+='<div class="blk"><h3>Al terminar vas a poder</h3><ul class="checks">'+r.outcomes.map(function(o){return '<li>'+o+'</li>';}).join('')+'</ul></div>';
  h+='<div class="cta"><a class="btn sys" href="#/m/'+id+'/teoria">Empezar '+ic('chev')+'</a><a class="btn ghost" href="#/m/'+id+'/video">'+ic('play')+' Ver el video</a></div>';
  b.innerHTML=h;
}
function secTeoria(b,mod){
  b.innerHTML=secHead('Teoría orientativa','Lo justo para entender el video y las imágenes. Tocá una imagen para ampliarla.')+mod.teoria.map(function(t,i){return '<section class="topic"><div class="th"><span class="tn">'+(i+1)+'</span><h3>'+t.h.replace(/^\d+\.\s*/,'')+'</h3></div><div class="prose">'+richHTML(t.html)+'</div></section>';}).join('')+nextBtn(mod.id,'video','Ver el video');
}
function secVideo(b,mod){
  b.innerHTML=secHead('Video-lección','Narrado por Tomás · fotos del material, esquemas animados y marcas sincronizadas')+'<div id="vbox"><p class="loading">Cargando…</p></div>'+nextBtn(mod.id,'describir','Describí la imagen');
  loadVmeta().then(function(VM){
    var vm=VM[mod.id],box=document.getElementById('vbox');if(!box)return;
    if(!vm){box.innerHTML='<div class="vwait"><div class="spin"></div><b>Estoy renderizando este video con la voz de Tomás</b><span style="opacity:.85;font-size:.9rem">Aparece acá apenas esté listo. Mientras tanto podés hacer «Describí la imagen» y los choice.</span></div>';return;}
    box.innerHTML='<div class="vwrap"><video id="vid" controls playsinline preload="metadata" src="v/'+mod.id+'.mp4?v='+vm.v+'"><track kind="subtitles" srclang="es" label="Español" src="v/'+mod.id+'.vtt?v='+vm.v+'"></video></div>'+
      '<div class="vbar"><div class="speed" role="group" aria-label="Velocidad">'+[1,1.25,1.5,1.75].map(function(r){return '<button data-r="'+r+'" class="'+(r===1?'on':'')+'">'+r+'×</button>';}).join('')+'</div><span style="color:var(--muted);font-size:.84rem">'+fmtT(vm.dur)+' · subtítulos con el botón CC</span></div>'+
      '<h3 style="font:600 1.1rem var(--serif);margin:16px 2px 10px">Capítulos del video</h3><div class="chaps">'+vm.chapters.map(function(c){return '<button class="chap" data-t="'+c.t+'"><span class="tt">'+fmtT(c.t)+'</span><b>'+esc(c.title)+'</b></button>';}).join('')+'</div>';
    var v=document.getElementById('vid'),saved=S.vid[mod.id]||{};
    v.addEventListener('loadedmetadata',function(){if(saved.pos&&saved.pos<v.duration-5)v.currentTime=saved.pos;});
    var last=0;v.addEventListener('timeupdate',function(){var on=-1;vm.chapters.forEach(function(ch,i){if(v.currentTime>=ch.t-0.2)on=i;});box.querySelectorAll('.chap').forEach(function(e,i){e.classList.toggle('on',i===on);});
      if(Date.now()-last>3000){last=Date.now();var o=S.vid[mod.id]||{};o.pos=v.currentTime;o.p=Math.max(o.p||0,v.currentTime/(v.duration||vm.dur));S.vid[mod.id]=o;save();}});
    box.querySelectorAll('.chap').forEach(function(e){e.onclick=function(){v.currentTime=+e.dataset.t;v.play();};});
    box.querySelectorAll('.speed button').forEach(function(e){e.onclick=function(){v.playbackRate=+e.dataset.r;box.querySelectorAll('.speed button').forEach(function(z){z.classList.toggle('on',z===e);});};});
  });
}
function secDescribir(b,mod){
  var A=mod.atlas||[],filt='all';
  if(!A.length){b.innerHTML=secHead('Describí la imagen','')+'<div class="blk empty">Próximamente.</div>';return;}
  var LAB={macro:'Macroscopía',micro:'Microscopía',cito:'Citología (PAP)'};
  function draw(){
    var L=A.filter(function(a){return filt==='all'||a.tipo===filt;});
    b.innerHTML=secHead('Describí la imagen','Así se describe cada foto en los casos del examen. Primero intentá describirla vos y después tocá «Ver descripción».')+
     '<div class="filters" style="margin-bottom:14px">'+[['all','Todas'],['macro','Macroscopía'],['micro','Microscopía'],['cito','Citología']].filter(function(f){return f[0]==='all'||A.some(function(a){return a.tipo===f[0];});}).map(function(f){return '<button class="fbtn'+(filt===f[0]?' on':'')+'" data-f="'+f[0]+'">'+f[1]+'</button>';}).join('')+'</div>'+
     '<div class="qlist vis">'+L.map(function(a,i){return '<article class="qcard"><div class="qmeta"><span class="qno">'+(i+1)+'</span><span class="lv">'+LAB[a.tipo]+'</span></div><div class="qimg" id="at'+i+'"'+zoomAttr(a.img,null,'')+'>'+fit(a.img,null,'250px')+'<span class="zoomhint">'+ic('zoom')+'</span></div><div class="qt">¿Cómo describirías esta imagen?</div><button class="btn ghost sm" data-show="'+i+'">'+ic('eye')+' Ver descripción</button><div id="ad'+i+'" hidden></div></article>';}).join('')+'</div>'+nextBtn(mod.id,'extra','Explicación extra');
    b.querySelectorAll('[data-f]').forEach(function(e){e.onclick=function(){filt=e.dataset.f;draw();};});
    b.querySelectorAll('[data-show]').forEach(function(e){e.onclick=function(){var i=+e.dataset.show,a=L[i],d=document.getElementById('ad'+i);e.hidden=true;d.hidden=false;
      d.innerHTML='<div class="fb" style="background:color-mix(in srgb,var(--sys) 8%,var(--card));border:1px solid color-mix(in srgb,var(--sys) 25%,transparent)"><div class="eyebrow">Diagnóstico</div><h4 style="font:600 1.12rem var(--serif)">'+a.dx+'</h4><p style="margin-top:10px"><b>'+LAB[a.tipo]+':</b> '+a.desc+'</p>'+(a.extra?'<p>'+a.extra+'</p>':'')+(a.profe?'<div class="key">🎙️ <span><b>La profe:</b> '+a.profe+'</span></div>':'')+'<p class="src">'+esc(a.src||'')+'</p></div>';
      var z=document.getElementById('at'+i);z.innerHTML=fit(a.img,a.ann,'250px')+'<span class="zoomhint">'+ic('zoom')+'</span>';z.setAttribute('data-zoom',JSON.stringify({id:a.img,ann:a.ann||null,cap:a.dx}));};});
  }
  draw();
}
function secExtra(b,mod){
  var X=mod.extra,cur=0,tab='simple';
  function draw(){
    var x=X[cur],tabs=[['simple','💬','Simple'],['foto','🔬','En la foto'],['comp','⚖️','Comparar'],['nunca','🚫','No confundas']],body='';
    if(tab==='simple')body='<p class="simple">'+x.simple+'</p>'+(x.points?'<ol class="steps">'+x.points.map(function(p){return '<li>'+p+'</li>';}).join('')+'</ol>':'');
    else if(tab==='foto')body=x.visual?figs(x.visual)+'<p class="src">Tocá una imagen para verla grande con las marcas.</p>':'<p class="empty">Sin imagen para este tema.</p>';
    else if(tab==='comp'){body=x.vs?'<p class="simple" style="font-size:1rem">'+x.vs+'</p>':'';if(x.cmp){var hd=x.cmp.head;body+='<div class="vs">'+x.cmp.rows.map(function(r){return '<div class="vsrow"><div class="lbl">'+r[0]+'</div><div class="cols">'+r.slice(1).map(function(c,j){return '<div><b>'+hd[j+1]+'</b>'+c+'</div>';}).join('')+'</div></div>';}).join('')+'</div>';}if(!body)body='<p class="empty">Sin comparación para este tema.</p>';}
    else body=x.never?'<div class="nc">'+x.never.map(function(n){return '<div class="ncard"><span class="x">✕</span><span>'+n+'</span></div>';}).join('')+'</div>':'<p class="empty">—</p>';
    b.innerHTML=secHead('Explicación extra','«No lo entendí: explicámelo de otra manera». Elegí el tema y recorré las pestañas.')+
     '<div class="xchips">'+X.map(function(t,i){return '<button class="xchip'+(i===cur?' on':'')+'" data-i="'+i+'">'+t.t+'</button>';}).join('')+'</div>'+
     '<div class="blk"><div class="eyebrow">Tema '+(cur+1)+' de '+X.length+'</div><h3 style="font-size:1.35rem">'+x.t+'</h3><div class="seg">'+tabs.map(function(t){return '<button data-t="'+t[0]+'" class="'+(tab===t[0]?'on':'')+'"><span class="em">'+t[1]+'</span>'+t[2]+'</button>';}).join('')+'</div><div class="prose">'+body+'</div>'+
     '<div class="cta" style="justify-content:space-between;margin-top:16px"><button class="btn ghost sm" data-nav="-1" '+(cur===0?'disabled':'')+'>'+ic('back')+' Anterior</button><button class="btn sm" data-nav="1" '+(cur===X.length-1?'disabled':'')+'>Siguiente '+ic('chev')+'</button></div></div>'+nextBtn(mod.id,'choice','Ir al choice');
    b.querySelectorAll('[data-i]').forEach(function(e){e.onclick=function(){cur=+e.dataset.i;tab='simple';draw();};});
    b.querySelectorAll('[data-t]').forEach(function(e){e.onclick=function(){tab=e.dataset.t;draw();};});
    b.querySelectorAll('[data-nav]').forEach(function(e){e.onclick=function(){cur=Math.max(0,Math.min(X.length-1,cur+(+e.dataset.nav)));tab='simple';draw();var c=b.querySelector('.xchip.on');if(c&&c.scrollIntoView)c.scrollIntoView({inline:'center',block:'nearest'});};});
  }
  draw();
}
/* ---------- CHOICE: todas las preguntas a la vista ---------- */
function secQuiz(b,mod,kind,arg){
  var all=(kind==='t'?mod.theory:mod.visual)||[],filt=arg==='errores'?'wrong':'all',retry={};
  var F=[['all','Todas'],['new','Sin responder'],['wrong','Mis errores'],['1','Nivel 1'],['2','Nivel 2'],['3','Nivel 3'],['4','Confusiones']];
  function list(){return all.filter(function(q){var r=S.ans[q.id];if(filt==='new')return !r;if(filt==='wrong')return r&&!r.ok;if(/^\d$/.test(filt))return String(q.lvl)===filt;return true;});}
  function head(){var a=0,c=0;all.forEach(function(q){var r=S.ans[q.id];if(r){a++;if(r.ok)c++;}});
    return '<div class="qhead"><div class="qstats"><span>'+a+'/'+all.length+' respondidas</span><div class="pbar"><i style="width:'+pct(a,all.length)+'%"></i></div><span style="color:var(--ok)">'+(a?pct(c,a)+'% bien':'')+'</span></div><div class="filters">'+F.map(function(f){return '<button class="fbtn'+(filt===f[0]?' on':'')+'" data-f="'+f[0]+'">'+f[1]+'</button>';}).join('')+'</div></div>';}
  function card(q,i){
    var r=retry[q.id]?null:S.ans[q.id],opts=seeded(q.o.map(function(t,k){return {t:t,k:k};}),hash(q.id)),L='ABCD';
    var done=!!r,ch=r?r.ch:null,cls=done?(r.ok?' ok':' bad'):'';
    var img=kind==='v'?'<div class="qimg"'+zoomAttr(q.img,done?q.ann:(q.pre||null),done?esc(q.o[q.a]):'')+'>'+fit(q.img,done?q.ann:(q.pre||null),'250px','Imagen de la pregunta')+'<span class="zoomhint">'+ic('zoom')+'</span></div>':'';
    return '<article class="qcard'+cls+'" id="q_'+q.id+'"><div class="qmeta"><span class="qno">'+(i+1)+'</span><span class="lv">'+(q.lvl===4?'Confusión':'Nivel '+q.lvl)+'</span>'+(q.topic?'<span class="lv">'+esc(q.topic)+'</span>':'')+'</div>'+img+'<div class="qt">'+q.q+'</div><div class="opts">'+opts.map(function(o,j){var c='';if(done){if(o.k===q.a)c=' ok';else if(o.k===ch)c=' bad';else c=' dim';}return '<button class="opt'+c+'" data-q="'+q.id+'" data-k="'+o.k+'" '+(done?'disabled':'')+'><span class="L">'+L[j]+'</span><span>'+o.t+'</span></button>';}).join('')+'</div>'+(done?fb(q,ch):'')+'</article>';
  }
  function fb(q,ch){
    var ok=ch===q.a,h='<div class="fb '+(ok?'ok':'bad')+'"><h4>'+(ok?'✔ ¡Correcto!':'✘ La correcta es: '+q.o[q.a])+'</h4>';
    if(!ok&&ch!=null)h+='<p><b>Por qué no «'+q.o[ch]+'»:</b> '+((q.wr&&q.wr[ch])||'no corresponde a lo que se ve.')+'</p>';
    if(kind==='t')h+='<p>'+q.why+'</p>';
    else h+=(q.obs?'<p><b>Qué se ve:</b> '+q.obs+'</p>':'')+(q.where?'<p><b>Dónde:</b> '+q.where+'</p>':'')+(q.conf?'<p><b>Lo confirma:</b> '+q.conf+'</p>':'')+(q.others?'<details><summary>Por qué no las otras</summary><p>'+q.others+'</p></details>':'');
    if(q.key)h+='<div class="key">🔑 <span>'+q.key+'</span></div>';
    return h+'<p class="src">Fuente: '+esc(q.src||'material de la cátedra')+'</p><button class="btn ghost sm" data-retry="'+q.id+'" style="margin-top:6px">'+ic('refresh')+' Reintentar</button></div>';
  }
  function replace(q){var c=document.getElementById('q_'+q.id);if(!c)return;var t=document.createElement('div');t.innerHTML=card(q,all.indexOf(q));c.replaceWith(t.firstChild);var hd=b.querySelector('.qhead'),nh=document.createElement('div');nh.innerHTML=head();hd.replaceWith(nh.firstChild);bind();}
  function draw(){
    var L=list();
    b.innerHTML=secHead(kind==='t'?'Choice teórico':'Choice de imágenes',kind==='t'?'Todas las preguntas a la vista. Tocá una opción y se corrige al instante.':'Imágenes reales del material. Al responder aparecen las marcas sobre los hallazgos.')+head()+
     (L.length?'<div class="qlist'+(kind==='v'?' vis':'')+'">'+L.map(function(q){return card(q,all.indexOf(q));}).join('')+'</div>':'<div class="blk empty">'+(filt==='wrong'?'¡No tenés errores pendientes acá! 🎉':filt==='new'?'Respondiste todas. 💪':'No hay preguntas con este filtro.')+'</div>')+
     '<div class="reset"><button class="btn ghost sm" id="rst">'+ic('refresh')+' Reiniciar respuestas de esta sección</button></div>'+nextBtn(mod.id,kind==='t'?'imagenes':'resultado',kind==='t'?'Choice de imágenes':'Ver resultado');
    bind();
  }
  function bind(){
    b.querySelectorAll('[data-f]').forEach(function(e){e.onclick=function(){filt=e.dataset.f;retry={};draw();};});
    b.querySelectorAll('.opt:not(:disabled)').forEach(function(e){e.onclick=function(){var q=all.filter(function(z){return z.id===e.dataset.q;})[0];delete retry[q.id];record(q,mod.id,kind,+e.dataset.k);replace(q);var f=document.querySelector('#q_'+q.id+' .fb');if(f&&f.scrollIntoView)setTimeout(function(){f.scrollIntoView({behavior:'smooth',block:'nearest'});},60);};});
    b.querySelectorAll('[data-retry]').forEach(function(e){e.onclick=function(){var q=all.filter(function(z){return z.id===e.dataset.retry;})[0];retry[q.id]=1;replace(q);};});
    var rs=document.getElementById('rst');if(rs)rs.onclick=function(){if(!window.confirm('¿Borrar tus respuestas de esta sección?'))return;all.forEach(function(q){delete S.ans[q.id];});save();draw();};
  }
  draw();
}
/* ---------- RESULTADO ---------- */
function secResultado(b,mod,m){
  var x=stats(mod);status(m,mod);var col=SYS[m.sys];
  var wT=(mod.theory||[]).filter(function(q){var r=S.ans[q.id];return r&&!r.ok;}),wV=(mod.visual||[]).filter(function(q){var r=S.ans[q.id];return r&&!r.ok;});
  var tp={};(mod.theory||[]).concat(mod.visual||[]).forEach(function(q){var r=S.ans[q.id];if(!r)return;var t=q.topic||'General';tp[t]=tp[t]||{n:0,w:0};tp[t].n++;if(!r.ok)tp[t].w++;});
  var weak=Object.keys(tp).filter(function(t){return tp[t].w;}).sort(function(a,c){return tp[c].w/tp[c].n-tp[a].w/tp[a].n;});
  b.innerHTML=secHead('Resultado','Tu desempeño en este capítulo. Lo que falles queda en «Mis errores» hasta que lo respondas bien.')+
   '<div class="rings"><div class="rcard">'+ring(x.progress,col,76,8)+'<b>Progreso</b><span>del capítulo</span></div><div class="rcard">'+ring(pct(x.t.correct,x.t.answered),'#7c6cf2',76,8)+'<b>Teoría</b><span>'+x.t.answered+'/'+x.t.total+' resp.</span></div><div class="rcard">'+ring(pct(x.v.correct,x.v.answered),'#16a34a',76,8)+'<b>Imágenes</b><span>'+x.v.answered+'/'+x.v.total+' resp.</span></div></div>'+
   '<div class="blk"><h3>Conceptos débiles</h3>'+(weak.length?'<div class="weak">'+weak.map(function(t){return '<div class="w"><span>'+esc(t)+'</span><span style="color:var(--bad)">'+tp[t].w+'/'+tp[t].n+'</span><div class="pbar"><i style="width:'+pct(tp[t].w,tp[t].n)+'%"></i></div></div>';}).join('')+'</div>':'<p class="empty" style="padding:6px">Todavía no hay errores registrados.</p>')+'</div>'+
   '<div class="blk"><h3>Imágenes que no reconociste ('+wV.length+')</h3>'+(wV.length?'<div class="thumbs">'+wV.map(function(q){return '<div class="t"'+zoomAttr(q.img,q.ann,esc(q.o[q.a]))+'><img src="'+IMG[q.img].f+'" alt=""><span>'+esc(q.o[q.a])+'</span></div>';}).join('')+'</div>':'<p class="empty" style="padding:6px">Ninguna por ahora.</p>')+'</div>'+
   '<div class="blk"><h3>Errores de teoría ('+wT.length+')</h3>'+(wT.length?'<ul class="checks">'+wT.map(function(q){return '<li style="display:block"><b>'+q.q+'</b><br><span style="color:var(--ok);font-size:.9rem">✔ '+q.o[q.a]+'</span></li>';}).join('')+'</ul>':'<p class="empty" style="padding:6px">Ninguno por ahora.</p>')+'</div>'+
   '<div class="cta"><a class="btn sys" href="#/m/'+mod.id+'/choice/errores">Repetir teoría incorrecta</a><a class="btn sys" href="#/m/'+mod.id+'/imagenes/errores">Repetir imágenes falladas</a><a class="btn ghost" href="#/">Volver a capítulos</a></div>';
}
/* ---------- MIS ERRORES ---------- */
function renderErrores(){
  document.documentElement.style.setProperty('--sys','#e8467c');
  var ready=CAT.filter(function(m){return m.status==='ready';});$app.innerHTML='<p class="loading">Reuniendo tus errores…</p>';
  Promise.all(ready.map(function(m){return loadMod(m.id).catch(function(){return null;});})).then(function(mods){
    var by=[];mods.forEach(function(mod){if(!mod)return;var mm=meta(mod.id),t=0,v=0,imgs=[];(mod.theory||[]).forEach(function(q){var r=S.ans[q.id];if(r&&!r.ok)t++;});(mod.visual||[]).forEach(function(q){var r=S.ans[q.id];if(r&&!r.ok){v++;imgs.push(q);}});if(t+v)by.push({m:mm,t:t,v:v,imgs:imgs});});
    var h='<div class="sh"><div><h2 style="font-size:1.7rem">Repasar mis errores</h2><p>Todo lo que fallaste, de todos los capítulos. Desaparece cuando lo respondés bien.</p></div></div>';
    if(!by.length){$app.innerHTML=h+'<div class="blk empty">No tenés errores pendientes. 🎉<br><br><a class="btn" href="#/">Ir a los capítulos</a></div>';return;}
    $app.innerHTML=h+by.map(function(o){var c=SYS[o.m.sys];return '<div class="blk" style="--sys:'+c+'"><div class="eyebrow">'+esc(o.m.sys)+' · Capítulo '+o.m.num+'</div><h3>'+esc(o.m.title)+'</h3>'+(o.imgs.length?'<div class="thumbs" style="margin-bottom:12px">'+o.imgs.map(function(q){return '<div class="t"'+zoomAttr(q.img,q.ann,esc(q.o[q.a]))+'><img src="'+IMG[q.img].f+'" alt=""><span>'+esc(q.o[q.a])+'</span></div>';}).join('')+'</div>':'')+'<div class="cta">'+(o.t?'<a class="btn sys sm" href="#/m/'+o.m.id+'/choice/errores">Teoría ('+o.t+')</a>':'')+(o.v?'<a class="btn sys sm" href="#/m/'+o.m.id+'/imagenes/errores">Imágenes ('+o.v+')</a>':'')+'</div></div>';}).join('');
  });
}
/* ---------- PROGRESO ---------- */
function renderProgreso(){
  document.documentElement.style.setProperty('--sys','#5b3fd0');
  var rows=CAT.map(function(m){var s=S.seen[m.id]||{};return '<tr><td><b>'+m.num+'.</b> '+esc(m.title)+'</td><td>'+(m.status==='ready'?(s.p||0)+'%':'—')+'</td><td>'+(s.ta?s.t+'%':'—')+'</td><td>'+(s.va?s.v+'%':'—')+'</td></tr>';}).join('');
  $app.innerHTML='<div class="sh"><div><h2 style="font-size:1.7rem">Mi progreso</h2></div></div><div class="tblwrap" style="background:var(--card)"><table class="tbl"><thead><tr><th>Capítulo</th><th>Avance</th><th>Teoría</th><th>Imágenes</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
  '<div class="blk" style="margin-top:16px"><h3>Pasar el progreso a otro dispositivo</h3><p class="prose">Se guarda solo en este navegador (no hay cuentas ni sincronización). Exportá el archivo acá e importalo en la tablet o el celular.</p><div class="cta"><button class="btn" id="exp">Exportar (.json)</button><label class="btn ghost" for="imp">Importar</label><input type="file" id="imp" accept="application/json,.json" class="vh"></div><p id="msg" class="src"></p><hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><button class="btn ghost sm" id="rst">Borrar todo mi progreso</button></div>';
  document.getElementById('exp').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='progreso-patologia-era3.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);};
  document.getElementById('imp').onchange=function(e){var f=e.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){try{var o=JSON.parse(rd.result);if(!o||typeof o.ans!=='object')throw 0;var n=0;for(var k in o.ans){var a=o.ans[k],c=S.ans[k];if(!c||(a.t||0)>(c.t||0)){S.ans[k]=a;n++;}}for(var k2 in (o.vid||{})){var a2=o.vid[k2],c2=S.vid[k2];if(!c2||(a2.p||0)>(c2.p||0))S.vid[k2]=a2;}save();renderProgreso();document.getElementById('msg').textContent='Listo: '+n+' respuestas importadas.';}catch(err){document.getElementById('msg').textContent='Ese archivo no es un progreso válido.';}};rd.readAsText(f);};
  document.getElementById('rst').onclick=function(){if(window.confirm('¿Seguro? Se borran todas tus respuestas en este dispositivo.')){S={ans:{},vid:{},seen:{},last:null};save();renderProgreso();}};
}
/* ---------- router ---------- */
function updateBadge(){var e=document.getElementById('errbadge');if(e){var n=errCount();e.textContent=n;e.hidden=!n;}}
function route(){
  closeLB();var p=(location.hash.replace(/^#\/?/,'')||'').split('/');
  if(p[0]==='m'&&p[1])renderModule(p[1],p[2],p[3]);else if(p[0]==='errores')renderErrores();else if(p[0]==='progreso')renderProgreso();else renderHome();
  updateBadge();
}
window.addEventListener('hashchange',route);
document.addEventListener('click',function(e){if(e.target.closest('.opt'))setTimeout(updateBadge,60);});
route();
})();

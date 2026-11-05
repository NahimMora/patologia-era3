/* Patología ERA 3 — plataforma de repaso. Vanilla JS, sin backend. */
(function(){
'use strict';
var IMG = window.PATO_IMG || {};
var CAT = window.PATO_CATALOG || [];
window.PATO_MOD = window.PATO_MOD || {};
var $app = document.getElementById('app');
var VER = '1';

/* ---------- utilidades ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function h(tag,attrs,html){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==='class')e.className=attrs[k];else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),attrs[k]);else e.setAttribute(k,attrs[k]);}if(html!=null)e.innerHTML=html;return e;}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pct(a,b){return b?Math.round(100*a/b):0;}
function modMeta(id){for(var i=0;i<CAT.length;i++)if(CAT[i].id===id)return CAT[i];return null;}

/* ---------- almacenamiento local ---------- */
var KEY='pato3.progress.v1';
var S={ans:{},vid:{},seen:{}};
try{var raw=localStorage.getItem(KEY);if(raw){var o=JSON.parse(raw);if(o&&o.ans)S=o;S.vid=S.vid||{};S.seen=S.seen||{};}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function record(q,mod,kind,ok){var r=S.ans[q.id]||{n:0,w:0};r.n++;if(!ok)r.w++;r.ok=ok;r.t=Date.now();r.m=mod;r.k=kind;S.ans[q.id]=r;save();}

/* ---------- carga diferida de módulos ---------- */
var loading={};
function loadMod(id){
  if(window.PATO_MOD[id])return Promise.resolve(window.PATO_MOD[id]);
  if(loading[id])return loading[id];
  loading[id]=new Promise(function(res,rej){
    var m=modMeta(id); var s=document.createElement('script');
    s.src='data/'+id+'.js?v='+(m&&m.v||VER);
    s.onload=function(){window.PATO_MOD[id]?res(window.PATO_MOD[id]):rej(new Error('sin datos'));};
    s.onerror=function(){delete loading[id];rej(new Error('No se pudo cargar el módulo. Revisá tu conexión.'));};
    document.head.appendChild(s);
  });
  return loading[id];
}

/* ---------- estadísticas ---------- */
function modStats(mod){
  var th=mod.theory||[],vi=mod.visual||[];
  function st(list){var a=0,c=0,ans=0;list.forEach(function(q){var r=S.ans[q.id];if(r){ans++;if(r.ok)c++;}a++;});return {total:a,answered:ans,correct:c};}
  var t=st(th),v=st(vi);
  var vid=S.vid[mod.id]||{max:0,total:1};
  var vp=Math.min(1,(vid.max+1)/(vid.total||1)); if(!S.vid[mod.id])vp=0;
  var qTot=t.total+v.total, qAns=t.answered+v.answered;
  var progress=Math.round(100*(0.2*vp+0.8*(qTot?qAns/qTot:0)));
  return {t:t,v:v,vp:vp,progress:progress,acc:pct(t.correct+v.correct,qAns)};
}
function modStatus(meta,mod){
  if(meta.status!=='ready')return {k:'prep',l:'En preparación',c:'st-prep'};
  if(!mod){var c=S.seen[meta.id];return c?{k:c.k,l:c.l,c:c.c}:{k:'ok',l:'Disponible',c:'st-ok'};}
  var s=modStats(mod),qTot=s.t.total+s.v.total,qAns=s.t.answered+s.v.answered;
  var r;
  if(qAns>=qTot*0.5 && s.acc<60) r={k:'rev',l:'Necesita repaso',c:'st-rev'};
  else if(qAns>=qTot*0.9 && s.acc>=70) r={k:'done',l:'Completado',c:'st-done'};
  else r={k:'ok',l:'Disponible',c:'st-ok'};
  S.seen[meta.id]={k:r.k,l:r.l,c:r.c,p:s.progress,t:pct(s.t.correct,s.t.answered),v:pct(s.v.correct,s.v.answered),ta:s.t.answered,va:s.v.answered};save();
  return r;
}

/* ---------- imagen con anotaciones (SVG) ---------- */
function annSVG(W,H,anns,scale){
  // anns: coords en fracción de la imagen. scale: factor px pantalla por unidad viewBox (para tamaño de texto)
  var fs=Math.max(11,Math.round(15/(scale||1))), out='';
  (anns||[]).forEach(function(a,i){
    var col=a.c||'#ffd400', d='';
    var sw='vector-effect="non-scaling-stroke"';
    if(a.t==='c'){var r=a.r*W;d='<circle cx="'+a.x*W+'" cy="'+a.y*H+'" r="'+r+'" pathLength="1" class="draw" fill="none" stroke="#000" stroke-width="6" '+sw+' opacity=".55"/><circle cx="'+a.x*W+'" cy="'+a.y*H+'" r="'+r+'" pathLength="1" class="draw" fill="none" stroke="'+col+'" stroke-width="3.5" '+sw+'/>';}
    else if(a.t==='e'){d='<ellipse cx="'+a.x*W+'" cy="'+a.y*H+'" rx="'+a.rx*W+'" ry="'+a.ry*H+'" pathLength="1" class="draw" fill="none" stroke="#000" stroke-width="6" '+sw+' opacity=".55"/><ellipse cx="'+a.x*W+'" cy="'+a.y*H+'" rx="'+a.rx*W+'" ry="'+a.ry*H+'" pathLength="1" class="draw" fill="none" stroke="'+col+'" stroke-width="3.5" '+sw+'/>';}
    else if(a.t==='r'){d='<rect x="'+a.x*W+'" y="'+a.y*H+'" width="'+a.w*W+'" height="'+a.h*H+'" pathLength="1" class="draw" fill="'+(a.fill||'none')+'" stroke="#000" stroke-width="6" '+sw+' opacity=".55"/><rect x="'+a.x*W+'" y="'+a.y*H+'" width="'+a.w*W+'" height="'+a.h*H+'" pathLength="1" class="draw" fill="none" stroke="'+col+'" stroke-width="3.5" '+sw+(a.dash?' stroke-dasharray="6 5"':'')+'/>';}
    else if(a.t==='a'){var x1=a.x1*W,y1=a.y1*H,x2=a.x2*W,y2=a.y2*H,ang=Math.atan2(y2-y1,x2-x1),L=Math.max(W,H)*0.035;
      var p1=(x2-L*Math.cos(ang-0.45))+','+(y2-L*Math.sin(ang-0.45)),p2=(x2-L*Math.cos(ang+0.45))+','+(y2-L*Math.sin(ang+0.45));
      d='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#000" stroke-width="7" '+sw+' opacity=".55"/><line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width="4" '+sw+'/><polygon points="'+x2+','+y2+' '+p1+' '+p2+'" fill="'+col+'" stroke="#000" stroke-width="1.5" '+sw+'/>';}
    else if(a.t==='l'){d='<line x1="'+a.x1*W+'" y1="'+a.y1*H+'" x2="'+a.x2*W+'" y2="'+a.y2*H+'" stroke="#000" stroke-width="6" '+sw+' opacity=".55"/><line x1="'+a.x1*W+'" y1="'+a.y1*H+'" x2="'+a.x2*W+'" y2="'+a.y2*H+'" stroke="'+col+'" stroke-width="3.5" '+sw+(a.dash?' stroke-dasharray="7 6"':'')+'/>';}
    if(a.label){var lx=(a.lx!=null?a.lx:(a.t==='a'?a.x1:(a.x!=null?a.x:a.x1)))*W, ly=(a.ly!=null?a.ly:(a.t==='a'?a.y1:(a.y!=null?a.y-(a.r||a.ry||0.04)-0.02:a.y1)))*H;
      var anc=a.anchor||'middle';
      if(!a.anchor){if(lx<0.16*W){anc='start';lx=Math.max(lx-0.04*W,0.015*W);}else if(lx>0.84*W){anc='end';lx=Math.min(lx+0.04*W,0.985*W);}}
      if(ly<fs*1.3)ly=fs*1.3; if(ly>H-4)ly=H-4;
      d+='<text x="'+lx+'" y="'+ly+'" text-anchor="'+anc+'" class="annl" style="font-size:'+fs+'px">'+esc(a.label)+'</text>';}
    out+='<g class="ag" style="animation-delay:'+(i*0.25)+'s">'+d+'</g>';
  });
  return out;
}
var styleOnce=document.createElement('style');
styleOnce.textContent='.draw{stroke-dasharray:1;stroke-dashoffset:1;animation:drw .9s ease forwards}.ag{opacity:0;animation:fadein .35s ease forwards}@keyframes drw{to{stroke-dashoffset:0}}@keyframes fadein{to{opacity:1}}';
document.head.appendChild(styleOnce);
function aimg(id,anns,opt){
  opt=opt||{}; var m=IMG[id]; if(!m)return '<div class="note">[imagen no disponible]</div>';
  var sc=opt.scale||(Math.min(m.w,700)/m.w);
  var st=opt.fit?' style="width:min(100%,calc('+opt.fit+'vh*'+(m.w/m.h).toFixed(4)+'));margin:0 auto"':'';
  return '<span class="aimg" data-img="'+esc(id)+'"'+st+'><img src="'+m.f+'" width="'+m.w+'" height="'+m.h+'" alt="'+esc(opt.alt||'Imagen de estudio')+'" loading="lazy" decoding="async"><svg viewBox="0 0 '+m.w+' '+m.h+'" preserveAspectRatio="none" aria-hidden="true">'+(anns?annSVG(m.w,m.h,anns,sc):'')+'</svg></span>';
}

/* ---------- lightbox con zoom ---------- */
var LB=document.getElementById('lightbox');
function openLB(id,anns,cap){
  var m=IMG[id];if(!m)return; var z=1;
  LB.innerHTML='<div class="lbbar"><button data-z="-1" aria-label="Alejar">−</button><button data-z="1" aria-label="Acercar">+</button><button data-x="1" aria-label="Cerrar">✕</button></div><div class="lbview"><div class="lbin">'+aimg(id,anns,{scale:1})+'</div></div>'+(cap?'<div class="lbcap">'+cap+'</div>':'');
  LB.hidden=false; document.body.style.overflow='hidden';
  var inn=LB.querySelector('.lbin'),view=LB.querySelector('.lbview');
  function apply(){var vw=view.clientWidth,vh=view.clientHeight;var base=Math.min(vw/m.w,vh/m.h);inn.style.width=(m.w*base*z)+'px';}
  apply();
  LB.onclick=function(e){var b=e.target.closest('button');if(!b){return;}if(b.dataset.x){closeLB();return;}z=Math.max(1,Math.min(5,z+(+b.dataset.z)*0.75));apply();};
}
function closeLB(){LB.hidden=true;LB.innerHTML='';document.body.style.overflow='';}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!LB.hidden)closeLB();});
document.addEventListener('click',function(e){var z=e.target.closest('[data-zoom]');if(z){var d=JSON.parse(z.getAttribute('data-zoom'));openLB(d.id,d.ann,d.cap);}});
function zoomAttr(id,anns,cap){return " data-zoom='"+esc(JSON.stringify({id:id,ann:anns||null,cap:cap||''}))+"'";}
function fig(id,cap,anns){return '<figure class="fig"><div class="zoomable"'+zoomAttr(id,anns,cap)+'>'+aimg(id,anns)+'</div>'+(cap?'<figcaption>'+cap+'</figcaption>':'')+'</figure>';}
function richHTML(html){ // <x-img id="" cap="" ann='json'></x-img>
  return String(html).replace(/<x-img([^>]*)><\/x-img>/g,function(_,at){
    var g=function(n){var r=new RegExp(n+"=(\"([^\"]*)\"|'([^']*)')").exec(at);return r?(r[2]!=null?r[2]:r[3]):null;};
    var ann=g('ann');return fig(g('id'),g('cap'),ann?JSON.parse(ann):null);});
}

/* ---------- HOME ---------- */
function renderHome(){
  var ready=CAT.filter(function(m){return m.status==='ready';});
  var tA=0,tC=0,vA=0,vC=0,done=0,prog=0;
  CAT.forEach(function(m){var s=S.seen[m.id];if(s){prog+=s.p||0;if(s.k==='done')done++;}});
  Object.keys(S.ans).forEach(function(k){var r=S.ans[k];if(r.k==='t'){tA++;if(r.ok)tC++;}else{vA++;if(r.ok)vC++;}});
  var html='<section class="hero"><h1>PATOLOGÍA ERA 3 — REPASO INTENSIVO</h1><p>Aprendé a reconocer las imágenes que necesitás para rendir.</p></section>'+
  '<div class="stats"><div class="stat"><b>'+done+'/'+CAT.length+'</b><span>Módulos completados</span></div><div class="stat"><b>'+Math.round(prog/CAT.length)+'%</b><span>Progreso total</span></div><div class="stat"><b>'+(tA?pct(tC,tA)+'%':'—')+'</b><span>Teoría ('+tA+' resp.)</span></div><div class="stat"><b>'+(vA?pct(vC,vA)+'%':'—')+'</b><span>Imágenes ('+vA+' resp.)</span></div></div>'+
  '<div class="grid cols2">';
  CAT.forEach(function(m){
    var st=modStatus(m,window.PATO_MOD[m.id]); var s=S.seen[m.id]||{};
    var inner='<div class="mhead"><div class="mnum">'+m.num+'</div><div style="flex:1;min-width:0"><div class="row" style="justify-content:space-between"><h3>'+esc(m.title)+'</h3><span class="status '+st.c+'">'+st.l+'</span></div><p>'+esc(m.desc)+'</p></div></div>'+
      '<div class="meta"><span class="chip">Dificultad: '+esc(m.diff)+'</span><span class="chip">Estudio: ~'+m.study+' min</span><span class="chip">Video: '+(m.status==='ready'?m.video:'~'+m.video)+' min</span><span class="chip">'+(m.status==='ready'?m.nImg+' imágenes':'Imágenes: en revisión')+'</span><span class="chip">'+(m.status==='ready'?(m.nT+m.nV)+' preguntas':'Preguntas: en preparación')+'</span></div>'+
      '<div class="bar" aria-label="Avance"><i style="width:'+(s.p||0)+'%"></i></div><div class="small muted">Avance '+(s.p||0)+'%</div>';
    html+= m.status==='ready' ? '<a class="card mcard" href="#/m/'+m.id+'/recorrido">'+inner+'</a>' : '<div class="card mcard dis" aria-disabled="true">'+inner+'</div>';
  });
  html+='</div><p class="footer">Las imágenes provienen de los materiales de la cátedra (Foto.pdf, PATO-REPASO.pdf, flashcards). Uso de estudio. El progreso se guarda solo en este dispositivo: para pasarlo a otro, usá <a href="#/progreso">Progreso → Exportar</a>.</p>';
  $app.innerHTML=html;
}

/* ---------- MÓDULO ---------- */
var SECS=[['recorrido','1. Recorrido'],['teoria','2. Teoría'],['video','3. Video'],['extra','4. Explicación extra'],['choice','5. Choice teórico'],['imagenes','6. Choice de imágenes'],['resultado','7. Resultado']];
function renderModule(id,sec,arg){
  var meta=modMeta(id); if(!meta){renderHome();return;}
  if(meta.status!=='ready'){$app.innerHTML='<div class="card"><h2>'+esc(meta.title)+'</h2><p>Este módulo todavía está en preparación. Se publica apenas esté completo y verificado.</p><a class="btn" href="#/">Volver al catálogo</a></div>';return;}
  $app.innerHTML='<p class="loading">Cargando módulo…</p>';
  loadMod(id).then(function(mod){
    sec=sec||'recorrido';
    var tabs='<nav class="tabs" aria-label="Secciones">'+SECS.map(function(s){return '<a class="tab" href="#/m/'+id+'/'+s[0]+'" aria-current="'+(s[0]===sec)+'">'+s[1]+'</a>';}).join('')+'</nav>';
    $app.innerHTML='<div class="crumb"><a href="#/">← Catálogo</a> · Módulo '+meta.num+'</div><h1>'+esc(meta.title)+'</h1>'+tabs+'<div id="secbody"></div>';
    var body=document.getElementById('secbody');
    var cur=$app.querySelector('.tab[aria-current="true"]');if(cur&&cur.scrollIntoView)cur.scrollIntoView({inline:'center',block:'nearest'});
    ({recorrido:secRecorrido,teoria:secTeoria,video:secVideo,extra:secExtra,choice:function(b,m){secQuiz(b,m,'t',arg);},imagenes:function(b,m){secQuiz(b,m,'v',arg);},resultado:secResultado}[sec]||secRecorrido)(body,mod,meta);
    window.scrollTo(0,0);
  }).catch(function(e){$app.innerHTML='<div class="card"><h2>No se pudo abrir el módulo</h2><p>'+esc(e.message)+'</p><button class="btn" onclick="location.reload()">Reintentar</button></div>';});
}
function secRecorrido(b,mod,meta){
  var r=mod.recorrido;
  b.innerHTML='<div class="card prose"><p>'+r.intro+'</p><div class="meta" style="margin:10px 0"><span class="chip">'+r.nPat+' patologías</span><span class="chip">~'+meta.study+' min (video + práctica)</span><span class="chip">Dificultad: '+esc(meta.diff)+'</span><span class="chip">'+meta.nImg+' imágenes verificadas</span><span class="chip">'+meta.nT+' preguntas teóricas</span><span class="chip">'+meta.nV+' preguntas de imágenes</span></div>'+
  '<h3>Qué vas a aprender</h3><ul>'+r.learn.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>'+
  '<h3>Lo prioritario (lo que la profe marcó)</h3><ul>'+r.prio.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>'+
  '<h3>Cómo está armado el capítulo</h3><p>'+r.structure+'</p>'+
  '<h3>Al terminar vas a poder…</h3><ul>'+r.outcomes.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>'+
  '<div class="next"><a class="btn" href="#/m/'+mod.id+'/teoria">Empezar por la teoría →</a><a class="btn sec2" href="#/m/'+mod.id+'/video">Ir directo al video</a></div></div>';
}
function secTeoria(b,mod){
  b.innerHTML=mod.teoria.map(function(t){return '<section class="card prose sec"><h2>'+t.h+'</h2>'+richHTML(t.html)+'</section>';}).join('')+'<div class="next"><a class="btn" href="#/m/'+mod.id+'/video">Ver el video →</a></div>';
}
function secExtra(b,mod){
  b.innerHTML='<div class="card prose sec"><h2>«No lo entendí: explicámelo de otra manera»</h2><p class="muted">Tocá cada tema. Explicación más simple, comparación, tabla corta y lo que nunca hay que confundir.</p></div>'+
  mod.extra.map(function(x){
    var cmp=x.cmp?'<div class="tblwrap"><table class="tbl"><thead><tr>'+x.cmp.head.map(function(c){return '<th>'+c+'</th>';}).join('')+'</tr></thead><tbody>'+x.cmp.rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>':'';
    var vis=x.visual?'<div class="figs">'+x.visual.map(function(v){return fig(v.img,v.cap,v.ann);}).join('')+'</div>':'';
    return '<details class="acc"><summary>'+x.t+'</summary><div class="prose"><p><b>Más simple:</b> '+x.simple+'</p>'+(x.points?'<p><b>Puntos para mirar:</b></p><ul>'+x.points.map(function(p){return '<li>'+p+'</li>';}).join('')+'</ul>':'')+vis+(x.vs?'<p><b>Comparación:</b> '+x.vs+'</p>':'')+cmp+(x.never?'<p><b>Nunca confundas:</b></p><ul class="never">'+x.never.map(function(p){return '<li>'+p+'</li>';}).join('')+'</ul>':'')+'</div></details>';
  }).join('');
}

/* ---------- QUIZ ---------- */
function secQuiz(b,mod,kind,arg){
  var all=(kind==='t'?mod.theory:mod.visual)||[];
  var lvl='all', onlyWrong=(arg==='errores');
  var LV=kind==='t'?[['all','Todas'],['1','N1 Básico'],['2','N2 Intermedio'],['3','N3 Examen'],['4','N4 Confusiones']]:[['all','Todas'],['1','N1'],['2','N2'],['3','N3'],['4','N4']];
  function list(){return all.filter(function(q){if(lvl!=='all'&&String(q.lvl)!==lvl)return false;if(onlyWrong){var r=S.ans[q.id];return r&&!r.ok;}return true;});}
  function start(){
    var L=list(); var sess={i:0,ok:0,done:0,order:L};
    if(!L.length){b.innerHTML=head()+'<div class="card"><p>'+(onlyWrong?'¡No tenés errores pendientes en esta sección! 🎉':'No hay preguntas en este nivel.')+'</p><div class="next"><button class="btn sec2" data-act="all">Ver todas las preguntas</button></div></div>';bindHead();return;}
    showQ(sess);
  }
  function head(){
    return '<div class="qtop"><div class="lvls">'+LV.map(function(l){return '<button data-l="'+l[0]+'" class="'+(lvl===l[0]?'on':'')+'">'+l[1]+'</button>';}).join('')+'</div><div class="lvls"><button data-act="wrong" class="'+(onlyWrong?'on':'')+'">Solo mis errores</button></div></div>';
  }
  function bindHead(){
    b.querySelectorAll('.qtop [data-l]').forEach(function(x){x.onclick=function(){lvl=x.dataset.l;start();};});
    var w=b.querySelector('[data-act="wrong"]');if(w)w.onclick=function(){onlyWrong=!onlyWrong;start();};
    var a=b.querySelector('[data-act="all"]');if(a)a.onclick=function(){onlyWrong=false;lvl='all';start();};
  }
  function showQ(sess){
    var q=sess.order[sess.i]; var opts=shuffle(q.o.map(function(t,i){return {t:t,i:i};}));
    var letters='ABCD';
    var img=kind==='v'?'<div class="qimg"><div class="zoomable" id="qz"'+zoomAttr(q.img,q.pre||null,'')+'>'+aimg(q.img,q.pre||null,{alt:'Imagen de la pregunta',fit:60})+'</div></div><p class="small muted" style="margin-top:-6px">Tocá la imagen para ampliarla.</p>':'';
    b.innerHTML=head()+'<div class="card"><div class="row" style="justify-content:space-between"><span class="tag">Nivel '+q.lvl+(q.topic?' · '+esc(q.topic):'')+'</span><span class="qcount">'+(sess.i+1)+' / '+sess.order.length+'</span></div>'+img+'<div class="qtext">'+q.q+'</div><div class="opts">'+opts.map(function(o,k){return '<button class="opt" data-i="'+o.i+'"><span class="L">'+letters[k]+'</span><span>'+o.t+'</span></button>';}).join('')+'</div><div id="fb"></div></div>';
    bindHead();
    b.querySelectorAll('.opt').forEach(function(btn){btn.onclick=function(){answer(sess,q,+btn.dataset.i,opts);};});
  }
  function answer(sess,q,ch,opts){
    var ok=ch===q.a; record(q,mod.id,kind,ok); sess.done++; if(ok)sess.ok++;
    b.querySelectorAll('.opt').forEach(function(x){x.disabled=true;var i=+x.dataset.i;if(i===q.a)x.classList.add('ok');else if(i===ch)x.classList.add('bad');});
    var fb='<div class="fb '+(ok?'ok':'bad')+'"><h4>'+(ok?'✔ Correcto':'✘ Incorrecto — la respuesta es: '+q.o[q.a])+'</h4>';
    if(!ok){fb+='<p><b>Por qué te equivocaste:</b> '+((q.wr&&q.wr[ch])||('«'+q.o[ch]+'» no corresponde.'))+'</p>';}
    if(kind==='t'){fb+='<p>'+q.why+'</p>';}
    else{
      fb+=(q.obs?'<p><b>Qué se observa:</b> '+q.obs+'</p>':'')+(q.where?'<p><b>Dónde:</b> '+q.where+'</p>':'')+(q.conf?'<p><b>Qué lo confirma:</b> '+q.conf+'</p>':'')+(q.others?'<p><b>Por qué no las otras:</b> '+q.others+'</p>':'')+'<p class="src">Fuente de validación: '+esc(q.src||'')+'</p>';
      var z=document.getElementById('qz'); if(z){z.innerHTML=aimg(q.img,q.ann,{alt:'Imagen con anotaciones',fit:60});z.setAttribute('data-zoom',JSON.stringify({id:q.img,ann:q.ann||null,cap:q.o[q.a]}));}
    }
    if(q.key)fb+='<p class="key">🔑 '+q.key+'</p>';
    fb+='</div><div class="next">'+(sess.i+1<sess.order.length?'<button class="btn" id="nx">Siguiente pregunta →</button>':'<button class="btn" id="fin">Ver resultado</button>')+'</div>';
    var F=document.getElementById('fb');F.innerHTML=fb;
    var nx=document.getElementById('nx');if(nx)nx.onclick=function(){sess.i++;showQ(sess);window.scrollTo({top:b.offsetTop-70,behavior:'smooth'});};
    var fin=document.getElementById('fin');if(fin)fin.onclick=function(){
      b.innerHTML=head()+'<div class="card"><h2>Terminaste esta tanda</h2><p style="font-size:1.4rem;font-weight:800">'+sess.ok+' / '+sess.done+' ('+pct(sess.ok,sess.done)+'%)</p><div class="next"><button class="btn" id="again">Repetir</button><button class="btn sec2" id="wr">Repetir solo incorrectas</button><a class="btn sec2" href="#/m/'+mod.id+'/resultado">Ver resultado del módulo</a></div></div>';
      bindHead();document.getElementById('again').onclick=function(){onlyWrong=false;start();};document.getElementById('wr').onclick=function(){onlyWrong=true;start();};
    };
    if(F.scrollIntoView)setTimeout(function(){F.scrollIntoView({behavior:'smooth',block:'nearest'});},60);
  }
  start();
}

/* ---------- RESULTADO ---------- */
function secResultado(b,mod,meta){
  var s=modStats(mod); modStatus(meta,mod);
  var wrongT=(mod.theory||[]).filter(function(q){var r=S.ans[q.id];return r&&!r.ok;});
  var wrongV=(mod.visual||[]).filter(function(q){var r=S.ans[q.id];return r&&!r.ok;});
  var topics={};
  (mod.theory||[]).concat(mod.visual||[]).forEach(function(q){var r=S.ans[q.id];if(!r)return;var t=q.topic||'General';topics[t]=topics[t]||{n:0,w:0};topics[t].n++;if(!r.ok)topics[t].w++;});
  var weak=Object.keys(topics).filter(function(t){return topics[t].w>0;}).sort(function(a,c){return topics[c].w/topics[c].n-topics[a].w/topics[a].n;});
  b.innerHTML='<div class="stats"><div class="stat"><b>'+s.progress+'%</b><span>Progreso del módulo</span></div><div class="stat"><b>'+(s.t.answered?pct(s.t.correct,s.t.answered)+'%':'—')+'</b><span>Teoría: '+s.t.answered+'/'+s.t.total+' respondidas</span></div><div class="stat"><b>'+(s.v.answered?pct(s.v.correct,s.v.answered)+'%':'—')+'</b><span>Imágenes: '+s.v.answered+'/'+s.v.total+' respondidas</span></div><div class="stat"><b>'+Math.round(s.vp*100)+'%</b><span>Video visto</span></div></div>'+
  '<div class="card sec"><h2>Conceptos débiles</h2>'+(weak.length?'<ul>'+weak.map(function(t){return '<li><b>'+esc(t)+'</b> — '+topics[t].w+' error(es) de '+topics[t].n+'</li>';}).join('')+'</ul>':'<p class="muted">Todavía no hay errores registrados (o no respondiste preguntas).</p>')+'</div>'+
  '<div class="card sec"><h2>Imágenes no reconocidas ('+wrongV.length+')</h2>'+(wrongV.length?'<div class="figs">'+wrongV.map(function(q){return fig(q.img,esc(q.o[q.a]),q.ann);}).join('')+'</div>':'<p class="muted">Ninguna por ahora.</p>')+'</div>'+
  '<div class="card sec"><h2>Errores de teoría ('+wrongT.length+')</h2>'+(wrongT.length?'<ul>'+wrongT.map(function(q){return '<li>'+q.q+'<br><span class="small" style="color:var(--ok)">✔ '+q.o[q.a]+'</span></li>';}).join('')+'</ul>':'<p class="muted">Ninguno por ahora.</p>')+'</div>'+
  '<div class="next"><a class="btn" href="#/m/'+mod.id+'/choice/errores">Repetir teoría incorrecta</a><a class="btn" href="#/m/'+mod.id+'/imagenes/errores">Repetir imágenes falladas</a><a class="btn sec2" href="#/">Volver al catálogo</a></div>';
}

/* ---------- MIS ERRORES (todos los módulos) ---------- */
function renderErrores(){
  var ready=CAT.filter(function(m){return m.status==='ready';});
  $app.innerHTML='<p class="loading">Reuniendo tus errores…</p>';
  Promise.all(ready.map(function(m){return loadMod(m.id).catch(function(){return null;});})).then(function(mods){
    var qs=[];
    mods.forEach(function(mod){if(!mod)return;['t','v'].forEach(function(k){((k==='t'?mod.theory:mod.visual)||[]).forEach(function(q){var r=S.ans[q.id];if(r&&!r.ok)qs.push({q:q,k:k,m:mod});});});});
    var html='<div class="crumb"><a href="#/">← Catálogo</a></div><h1>Repasar mis errores</h1>';
    if(!qs.length){$app.innerHTML=html+'<div class="card"><p>No tenés errores pendientes. Cuando falles una pregunta aparece acá hasta que la respondas bien.</p><a class="btn" href="#/">Ir al catálogo</a></div>';return;}
    var byMod={};qs.forEach(function(x){var k=x.m.id;byMod[k]=byMod[k]||{t:0,v:0,mod:x.m};byMod[k][x.k]++;});
    html+='<div class="card sec"><p>Tenés <b>'+qs.length+'</b> preguntas pendientes. Se borran de esta lista cuando las respondés bien.</p>'+Object.keys(byMod).map(function(k){var o=byMod[k],mm=modMeta(k);return '<div class="row" style="margin:8px 0"><b style="flex:1">'+mm.num+'. '+esc(mm.title)+'</b>'+(o.t?'<a class="btn sec2" href="#/m/'+k+'/choice/errores">Teoría ('+o.t+')</a>':'')+(o.v?'<a class="btn sec2" href="#/m/'+k+'/imagenes/errores">Imágenes ('+o.v+')</a>':'')+'</div>';}).join('')+'</div>';
    html+='<div class="card"><h2>Lista</h2><div class="errlist">'+qs.map(function(x){var q=x.q;return '<div class="erritem">'+(x.k==='v'&&IMG[q.img]?'<img src="'+IMG[q.img].f+'" alt="">':'<span class="chip">Teoría</span>')+'<div class="small">'+(x.k==='v'?q.q:q.q)+'<br><span style="color:var(--ok)">✔ '+q.o[q.a]+'</span></div></div>';}).join('')+'</div></div>';
    $app.innerHTML=html;
  });
}

/* ---------- PROGRESO / exportar ---------- */
function renderProgreso(){
  var rows=CAT.map(function(m){var s=S.seen[m.id]||{};return '<tr><td>'+m.num+'. '+esc(m.title)+'</td><td>'+(m.status==='ready'?(s.p||0)+'%':'—')+'</td><td>'+(s.ta?s.t+'% ('+s.ta+')':'—')+'</td><td>'+(s.va?s.v+'% ('+s.va+')':'—')+'</td></tr>';}).join('');
  $app.innerHTML='<div class="crumb"><a href="#/">← Catálogo</a></div><h1>Mi progreso</h1><div class="card sec"><div class="tblwrap"><table class="tbl"><thead><tr><th>Módulo</th><th>Avance</th><th>Teoría</th><th>Imágenes</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
  '<div class="card sec prose"><h2>Pasar el progreso a otro dispositivo</h2><p>El progreso se guarda solo en este navegador (no hay cuentas ni sincronización). Para llevarlo del celular a la tablet: exportá el archivo acá e importalo allá.</p><div class="next"><button class="btn" id="exp">Exportar progreso (.json)</button><label class="btn sec2" for="imp">Importar progreso</label><input type="file" id="imp" accept="application/json,.json" class="vh"></div><p id="impmsg" class="small"></p><p class="small muted">Al importar se combinan los resultados: se conserva la respuesta más reciente de cada pregunta.</p><hr style="border:0;border-top:1px solid var(--line)"><button class="btn sec2" id="rst">Borrar todo mi progreso</button></div>';
  document.getElementById('exp').onclick=function(){var blob=new Blob([JSON.stringify(S)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='progreso-patologia-era3.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);};
  document.getElementById('imp').onchange=function(e){var f=e.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){var msg=document.getElementById('impmsg');try{var o=JSON.parse(rd.result);if(!o||typeof o.ans!=='object')throw 0;var n=0;Object.keys(o.ans).forEach(function(k){var a=o.ans[k],b=S.ans[k];if(!b||(a.t||0)>(b.t||0)){S.ans[k]=a;n++;}});Object.keys(o.vid||{}).forEach(function(k){var a=o.vid[k],b=S.vid[k];if(!b||a.max>b.max)S.vid[k]=a;});save();msg.textContent='Listo: se importaron '+n+' respuestas.';renderProgreso();}catch(err){msg.textContent='Ese archivo no parece un progreso válido.';}};rd.readAsText(f);};
  document.getElementById('rst').onclick=function(){if(window.confirm('¿Seguro? Se borran todas tus respuestas en este dispositivo.')){S={ans:{},vid:{},seen:{}};save();renderProgreso();}};
}

/* ---------- VIDEO-LECCIÓN NARRADA ---------- */
var PLAYER=null;
function secVideo(b,mod){
  var L=mod.lesson;
  b.innerHTML='<div class="player" id="pl"><div class="stage" id="stg"><div class="world" id="wld"></div><div class="ttl" id="ttl"></div><div class="cards" id="cards"></div><button class="startov" id="sov" aria-label="Reproducir"><span class="bigplay">▶</span><span>Reproducir video-lección ('+L.min+' min aprox.)</span></button></div><div class="prog"><i id="pbar"></i></div><div class="subs" id="subs" aria-live="polite">Tocá reproducir. La narración usa la voz en español de tu dispositivo.</div>'+
  '<div class="ctrl"><button id="bprev" aria-label="Paso anterior">⏮</button><button id="bplay" aria-label="Reproducir o pausar">▶</button><button id="bnext" aria-label="Paso siguiente">⏭</button><select id="rate" aria-label="Velocidad"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option><option value="1.5">1.5×</option></select><button id="bmute" aria-label="Voz">🔊</button><span class="grow"></span><button id="bfs" aria-label="Pantalla completa">⛶</button></div>'+
  '<div class="chapters" id="chap">'+L.scenes.map(function(s,i){return '<button data-s="'+i+'">'+(i+1)+'. '+esc(s.title)+'</button>';}).join('')+'</div></div>'+
  '<div class="row" style="margin-top:8px"><label class="small muted" for="voice">Voz:</label><select id="voice" style="min-height:38px;max-width:100%;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink)"></select></div>'+
  '<p class="note">Este video se genera en tu pantalla: fotos reales del material, zoom y marcas sincronizadas con la narración. Si tu dispositivo no tiene voz en español, se reproduce con subtítulos temporizados. Tocá ⏮ ⏭ para repasar un paso, o elegí un capítulo.</p>'+
  '<div class="next"><a class="btn" href="#/m/'+mod.id+'/extra">¿No entendiste algo? Explicación extra →</a><a class="btn sec2" href="#/m/'+mod.id+'/choice">Ir al choice</a></div>';
  if(PLAYER)PLAYER.destroy();
  PLAYER=makePlayer(mod);
}
function makePlayer(mod){
  var L=mod.lesson, steps=[]; L.scenes.forEach(function(sc,si){sc.steps.forEach(function(st,k){steps.push({s:si,k:k,st:st});});});
  var stg=document.getElementById('stg'),wld=document.getElementById('wld'),ttl=document.getElementById('ttl'),cards=document.getElementById('cards'),subs=document.getElementById('subs'),pbar=document.getElementById('pbar'),sov=document.getElementById('sov'),bplay=document.getElementById('bplay');
  var idx=0,playing=false,timer=null,curScene=-1,geo=null,rate=1,muted=false,dead=false,token=0;
  var synth=window.speechSynthesis, voice=null, vsel=document.getElementById('voice');
  function pickVoices(){
    if(!synth){vsel.innerHTML='<option>Sin voz disponible (subtítulos)</option>';muted=true;return;}
    var vs=synth.getVoices().filter(function(v){return /^es/i.test(v.lang);});
    var pref=['es-AR','es-419','es-US','es-MX','es-CO','es-ES'];
    vs.sort(function(a,b){var ia=pref.indexOf(a.lang.replace('_','-')),ib=pref.indexOf(b.lang.replace('_','-'));ia=ia<0?9:ia;ib=ib<0?9:ib;if(ia!==ib)return ia-ib;return (b.localService?1:0)-(a.localService?1:0);});
    var saved=null;try{saved=localStorage.getItem('pato3.voice');}catch(e){}
    vsel.innerHTML=vs.length?vs.map(function(v,i){return '<option value="'+i+'">'+esc(v.name+' ('+v.lang+')')+'</option>';}).join(''):'<option>No hay voz en español: se usan subtítulos</option>';
    if(vs.length){var si=0;vs.forEach(function(v,i){if(v.name===saved)si=i;});vsel.value=si;voice=vs[si];}
    else {voice=null;}
    vsel.onchange=function(){voice=vs[+vsel.value];try{localStorage.setItem('pato3.voice',voice.name);}catch(e){}};
  }
  pickVoices(); if(synth&&synth.onvoiceschanged!==undefined)synth.onvoiceschanged=pickVoices;
  function layoutScene(si){
    var sc=L.scenes[si]; var ids=sc.imgs||[sc.img]; var H0=1000, x=0, panels=[];
    ids.forEach(function(id){var m=IMG[id];var w=H0*m.w/m.h;panels.push({id:id,x:x,w:w});x+=w+(ids.length>1?30:0);});
    var WW=x-(ids.length>1?30:0),WH=H0;
    var SW=stg.clientWidth,SH=stg.clientHeight; var s0=Math.min(SW/WW,SH/WH);
    wld.style.width=(WW*s0)+'px';wld.style.height=(WH*s0)+'px';
    wld.innerHTML=panels.map(function(p){return '<img src="'+IMG[p.id].f+'" alt="" style="position:absolute;left:'+(p.x*s0)+'px;top:0;width:'+(p.w*s0)+'px;height:'+(WH*s0)+'px">';}).join('')+'<svg id="asvg" viewBox="0 0 '+WW+' '+WH+'" preserveAspectRatio="none"></svg>';
    geo={WW:WW,WH:WH,s0:s0,panels:panels,SW:SW,SH:SH};
  }
  function mapAnn(a){ // de coords por panel a coords del mundo (fracciones)
    var p=geo.panels[a.p||0]; var o={}; for(var k in a)o[k]=a[k];
    function X(v){return (p.x+v*p.w)/geo.WW;} function Y(v){return v;}
    ['x','x1','x2','lx'].forEach(function(k){if(o[k]!=null)o[k]=X(o[k]);});
    if(o.r!=null)o.r=o.r*p.w/geo.WW; if(o.rx!=null)o.rx=o.rx*p.w/geo.WW; if(o.w!=null)o.w=o.w*p.w/geo.WW;
    return o;
  }
  function cam(c,instant){
    c=c||{}; var z=c.z||1, cx=c.x!=null?c.x:0.5, cy=c.y!=null?c.y:0.5;
    if(c.p!=null){var p=geo.panels[c.p];cx=(p.x+cx*p.w)/geo.WW;}
    var w=geo.WW*geo.s0,hh=geo.WH*geo.s0;
    var tx=geo.SW/2-cx*w*z, ty=geo.SH/2-cy*hh*z;
    // no dejar bordes negros innecesarios
    if(w*z>=geo.SW){tx=Math.min(0,Math.max(geo.SW-w*z,tx));}else tx=(geo.SW-w*z)/2;
    if(hh*z>=geo.SH){ty=Math.min(0,Math.max(geo.SH-hh*z,ty));}else ty=(geo.SH-hh*z)/2;
    wld.style.transition=instant?'none':'transform 1.3s cubic-bezier(.4,0,.2,1)';
    wld.style.transform='translate('+tx+'px,'+ty+'px) scale('+z+')';
    return z;
  }
  function annsFor(i){
    var cur=steps[i],sc=L.scenes[cur.s],acc=[];
    for(var k=0;k<=cur.k;k++){var st=sc.steps[k];if(!st.keep)acc=[];acc=acc.concat(st.ann||[]);}
    return acc;
  }
  function render(i,instant){
    var cur=steps[i],sc=L.scenes[cur.s],st=cur.st;
    if(cur.s!==curScene){layoutScene(cur.s);curScene=cur.s;cam(st.cam||sc.cam,true);}
    ttl.textContent=sc.title; var z=cam(st.cam||sc.cam,instant);
    var an=annsFor(i).map(mapAnn);
    document.getElementById('asvg').innerHTML=annSVG(geo.WW,geo.WH,an,geo.s0*z);
    if(st.cards){cards.innerHTML='<div><h4>'+esc(st.cards.h)+'</h4><ol>'+st.cards.items.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ol></div>';cards.classList.add('on');}else cards.classList.remove('on');
    subs.innerHTML=st.sub||st.say;
    pbar.style.width=pct(i+1,steps.length)+'%';
    document.querySelectorAll('#chap button').forEach(function(bb){bb.classList.toggle('on',+bb.dataset.s===cur.s);});
    var v=S.vid[mod.id]||{max:-1,total:steps.length};v.total=steps.length;if(i>v.max)v.max=i;S.vid[mod.id]=v;save();
  }
  function speakText(st){return (st.say||st.sub||'').replace(/<[^>]+>/g,'');}
  function advance(){if(!playing||dead)return; if(idx<steps.length-1){idx++;render(idx);play();}else{playing=false;bplay.textContent='▶';subs.innerHTML='<b>Fin de la video-lección.</b> Seguí con la explicación extra o el choice.';}}
  function play(){
    clearTimeout(timer); var my=++token; var st=steps[idx].st; var txt=speakText(st);
    var minT=(st.hold||0)*1000;
    if(!muted&&synth&&voice!==null){
      try{synth.cancel();}catch(e){}
      var u=new SpeechSynthesisUtterance(txt); if(voice)u.voice=voice; u.lang=voice?voice.lang:'es-AR'; u.rate=rate;
      var t0=Date.now();
      u.onend=function(){if(my!==token)return;var rest=Math.max(350,minT-(Date.now()-t0));timer=setTimeout(advance,rest);};
      u.onerror=function(ev){if(my!==token)return; if(ev&&ev.error==='interrupted')return; timer=setTimeout(advance,dur(txt));};
      synth.speak(u);
      // salvavidas si onend no llega (algunos Android)
      var guard=setTimeout(function(){if(my===token&&playing&&!synth.speaking){advance();}},dur(txt)+4000);
      timer=guard;
    } else { timer=setTimeout(advance,Math.max(minT,dur(txt))); }
  }
  function dur(t){var w=t.split(/\s+/).length;return Math.max(2600,(w/2.6)*1000/rate);}
  function stop(){playing=false;token++;clearTimeout(timer);try{synth&&synth.cancel();}catch(e){}bplay.textContent='▶';}
  function start(){if(sov)sov.style.display='none';playing=true;bplay.textContent='⏸';render(idx);play();}
  sov.onclick=start;
  bplay.onclick=function(){if(playing)stop();else start();};
  document.getElementById('bnext').onclick=function(){if(idx<steps.length-1){idx++;sov.style.display='none';render(idx);if(playing)play();}};
  document.getElementById('bprev').onclick=function(){if(idx>0){idx--;sov.style.display='none';render(idx);if(playing)play();}};
  document.getElementById('rate').onchange=function(e){rate=+e.target.value;if(playing)play();};
  document.getElementById('bmute').onclick=function(e){muted=!muted;e.target.textContent=muted?'🔇':'🔊';if(playing)play();};
  document.querySelectorAll('#chap button').forEach(function(bb){bb.onclick=function(){var s=+bb.dataset.s;for(var i=0;i<steps.length;i++)if(steps[i].s===s){idx=i;break;}sov.style.display='none';render(idx,false);if(playing)play();};});
  var pl=document.getElementById('pl');
  document.getElementById('bfs').onclick=function(){
    if(document.fullscreenElement){document.exitFullscreen();return;}
    if(pl.classList.contains('pseudo-fs')){pl.classList.remove('pseudo-fs');document.body.style.overflow='';relayout();return;}
    if(pl.requestFullscreen){pl.requestFullscreen().catch(function(){pl.classList.add('pseudo-fs');document.body.style.overflow='hidden';relayout();});}
    else{pl.classList.add('pseudo-fs');document.body.style.overflow='hidden';relayout();}
  };
  function relayout(){setTimeout(function(){curScene=-1;render(idx,true);},120);}
  var onres=function(){if(!dead)relayout();};
  window.addEventListener('resize',onres); document.addEventListener('fullscreenchange',onres);
  layoutScene(0);curScene=0;render(0,true);
  return {destroy:function(){dead=true;stop();window.removeEventListener('resize',onres);document.removeEventListener('fullscreenchange',onres);document.body.style.overflow='';}};
}

/* ---------- router ---------- */
function route(){
  if(PLAYER&&!/\/video/.test(location.hash)){PLAYER.destroy();PLAYER=null;}
  var p=(location.hash.replace(/^#\/?/,'')||'').split('/');
  closeLB();
  if(p[0]==='m'&&p[1])renderModule(p[1],p[2],p[3]);
  else if(p[0]==='errores')renderErrores();
  else if(p[0]==='progreso')renderProgreso();
  else renderHome();
}
window.addEventListener('hashchange',route);
window.addEventListener('pagehide',function(){try{window.speechSynthesis&&window.speechSynthesis.cancel();}catch(e){}});
route();
})();

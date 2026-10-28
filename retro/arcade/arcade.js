(() => {
  'use strict';
  const $=id=>document.getElementById(id), canvas=$('screen'), ctx=canvas.getContext('2d');
  const game=new PacketEngine(); let mode='ready', best=0, last=0, frame=0, swipeX=null;
  try { best=Number(localStorage.getItem('packet-run-best'))||0; } catch {}
  const pad=n=>String(n).padStart(4,'0');
  $('best').textContent=pad(best);
  function updateScore() { $('score').textContent=pad(game.score); $('lives').textContent=game.lives; }
  function saveBest() { if(game.score>best) { best=game.score; try {localStorage.setItem('packet-run-best',String(best));}catch{} $('best').textContent=pad(best); } }
  function overlay(title,copy,button) { $('overlay-title').textContent=title; $('overlay-copy').textContent=copy; $('start').textContent=button; $('overlay').hidden=false; }
  function start() {
    if(mode!=='paused') game.reset();
    mode='playing'; $('overlay').hidden=true; $('pause').disabled=false; $('pause').textContent='Pause';
    $('status').textContent='Run started. Collect + packets; avoid × bugs.'; updateScore(); canvas.focus({preventScroll:true});
    canvas.scrollIntoView({block:'start',behavior:'instant'});
    last=performance.now(); cancelAnimationFrame(frame); frame=requestAnimationFrame(loop);
  }
  function pause() {
    if(mode==='paused') return start();
    if(mode!=='playing') return;
    mode='paused'; cancelAnimationFrame(frame); saveBest(); $('pause').textContent='Resume';
    overlay('CONNECTION PAUSED','Your run is safe. Pick up where you left off.','Resume game'); $('status').textContent='Paused.';
  }
  function finish() {
    mode='over'; saveBest(); $('pause').disabled=true;
    overlay('CONNECTION LOST', 'Score: '+game.score+' · Best: '+best+'. Ready for another run?', 'Play again');
    $('status').textContent='Game over. Score '+game.score+'. Best '+best+'.'; $('start').focus({preventScroll:true});
  }
  function move(d) { if(mode==='playing') { game.move(d); draw(); } }
  $('start').addEventListener('click',start); $('pause').addEventListener('click',pause);
  $('left').addEventListener('click',()=>move(-1)); $('right').addEventListener('click',()=>move(1));
  document.addEventListener('keydown',e=> {
    if(e.altKey||e.ctrlKey||e.metaKey) return;
    const key=e.key.toLowerCase();
    if(['arrowleft','arrowright','a','d'].includes(key) && mode==='playing') { e.preventDefault(); move(['arrowleft','a'].includes(key)?-1:1); }
    if(['p','escape'].includes(key)&&['playing','paused'].includes(mode)) { e.preventDefault(); if(!e.repeat) pause(); }
  });
  canvas.addEventListener('pointerdown',e=> {swipeX=e.clientX;});
  canvas.addEventListener('pointerup',e=> {if(swipeX!==null && Math.abs(e.clientX-swipeX)>20) move(e.clientX>swipeX?1:-1); swipeX=null;});
  canvas.addEventListener('pointercancel',()=>swipeX=null);
  document.addEventListener('visibilitychange',()=> {if(document.hidden&&mode==='playing') pause();});
  window.addEventListener('blur',()=> {if(mode==='playing') pause();});
  window.addEventListener('pagehide',saveBest);
  function draw() {
    ctx.fillStyle='#292219'; ctx.fillRect(0,0,360,480);
    ctx.fillStyle='#352d20'; for(let i=0;i<3;i++)ctx.fillRect(12+i*116,0,104,480);
    ctx.fillStyle='#8f8261';
    for(let y=(game.time*85)%32-32;y<480;y+=32) {ctx.fillRect(120,y,2,14);ctx.fillRect(236,y,2,14);}
    for(const o of game.objects) {
      if(o.collected) continue;
      const x=64+o.lane*116;
      ctx.fillStyle=o.type==='gold'?'#ffdf59':'#ff8796'; ctx.fillRect(x-17,o.y-17,34,34);
      ctx.fillStyle='#292219'; ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(o.type==='gold'?'+':'×',x,o.y+1);
    }
    const x=64+game.lane*116;
    if(game.shield>0) {ctx.strokeStyle='#c5ffff';ctx.lineWidth=3;ctx.strokeRect(x-25,391,50,48);}
    ctx.fillStyle='#9dffce';ctx.fillRect(x-18,399,36,27);ctx.fillRect(x-23,428,46,6);
    ctx.fillStyle='#292219';ctx.fillRect(x-13,404,26,16);ctx.fillStyle='#9dffce';ctx.fillRect(x-9,411,7,3);
    ctx.fillStyle='#fffef7';ctx.font='bold 13px monospace';ctx.textAlign='left';ctx.fillText('MULTIPLIER ×'+Math.min(5,1+Math.floor(game.streak/5)),12,465);
    ctx.textAlign='right';ctx.fillText('LEVEL '+(1+Math.floor(game.time/8)),348,465);
  }
  function loop(now) {
    if(mode!=='playing') return;
    game.tick((now-last)/1000);last=now;updateScore();draw();
    if(game.lastEvent && $('status').textContent!==game.lastEvent) $('status').textContent=game.lastEvent;
    if(game.over) finish(); else frame=requestAnimationFrame(loop);
  }
  draw();
})();

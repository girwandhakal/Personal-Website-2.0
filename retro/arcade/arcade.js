(() => {
  'use strict';
  const $=id=>document.getElementById(id), canvas=$('screen'), ctx=canvas.getContext('2d');
  let game=new PacketEngine(); let mode='ready', best=0, last=0, frame=0, swipeX=null;
  let ticket=null, ticks=0, moves=[], accumulator=0, generation=0, leaderboardEntries=[];
  const STEP=1/60;
  try { best=Number(localStorage.getItem('packet-run-best'))||0; } catch {}
  const pad=n=>String(n).padStart(4,'0');
  $('best').textContent=pad(best);
  function updateScore() { $('score').textContent=pad(game.score); $('lives').textContent=game.lives; }
  function saveBest() { if(game.score>best) { best=game.score; try {localStorage.setItem('packet-run-best',String(best));}catch{} $('best').textContent=pad(best); } }
  function overlay(title,copy,button) { $('overlay-title').textContent=title; $('overlay-copy').textContent=copy; $('start').textContent=button; $('overlay').hidden=false; }
  async function api(data) {
    const response=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(12000)});
    const body=await response.json();
    if(!response.ok)throw new Error(body.error||'Leaderboard is temporarily unavailable.');
    return body;
  }
  function displayScores(entries) {
    leaderboardEntries=entries;
    $('leaderboard-rows').replaceChildren();
    for(const entry of entries) {
      const row=document.createElement('tr');
      for(const value of [entry.rank,entry.nickname,entry.score]) {const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
      $('leaderboard-rows').append(row);
    }
    $('leaderboard-table').hidden=!entries.length;
    $('leaderboard-status').textContent=entries.length?'Tied scores share a rank.':'No scores yet. Set the first record!';
    const runRows=$('run-leaderboard-rows');
    if(runRows) {
      runRows.replaceChildren();
      for(const entry of entries) { const row=document.createElement('tr'); for(const value of [entry.rank,entry.nickname,entry.score]) { const cell=document.createElement('td'); cell.textContent=value; row.append(cell); } runRows.append(row); }
      $('run-leaderboard-table').hidden=!entries.length;
      $('run-leaderboard-status').textContent=entries.length?'Tied scores share a rank.':'No scores yet.';
    }
  }
  function showRunLeaderboard() {
    if($('run-leaderboard')) return;
    const box=document.createElement('div'); box.id='run-leaderboard'; box.className='run-leaderboard';
    box.innerHTML='<h3>Current leaderboard</h3><p id="run-leaderboard-status">Loading scores…</p><table id="run-leaderboard-table" hidden><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th></tr></thead><tbody id="run-leaderboard-rows"></tbody></table>';
    $('run-result').append(box);
    displayScores(leaderboardEntries);
  }
  async function loadScores() {
    $('refresh-scores').disabled=true;
    try {
      const response=await fetch('/api/leaderboard',{signal:AbortSignal.timeout(12000)});
      const body=await response.json();if(!response.ok)throw new Error(body.error);
      displayScores(body.entries);
    } catch { $('leaderboard-status').textContent='Scores are unavailable right now. Try refreshing in a moment.'; }
    finally { $('refresh-scores').disabled=false; }
  }
  async function start() {
    if(mode==='starting'||mode==='playing')return;
    const resume=mode==='paused';
    let practice=false;
    if(!resume) {
      generation++;mode='starting';$('start').disabled=true;$('start').textContent='Starting…';
      $('run-result').hidden=true;$('score-form').hidden=true;$('submit-status').textContent='';
      try {const run=await api({action:'start'});ticket=run.ticket;game=new PacketEngine(PacketEngine.random(run.seed));}
      catch {ticket=null;practice=true;game=new PacketEngine();}
      ticks=0;moves=[];accumulator=0;
    }
    mode='playing'; $('overlay').hidden=true; $('start').disabled=false; $('pause').disabled=false; $('pause').textContent='Pause';
    $('status').textContent=practice?'Practice run: leaderboard unavailable.':'Run started. Collect + packets; avoid × bugs.';
    updateScore(); canvas.focus({preventScroll:true});
    last=performance.now(); cancelAnimationFrame(frame); frame=requestAnimationFrame(loop);
  }
  function pause() {
    if(mode==='paused') return start();
    if(mode!=='playing') return;
    mode='paused'; cancelAnimationFrame(frame); saveBest(); $('pause').textContent='Resume';
    overlay('CONNECTION PAUSED','Your run is safe. Pick up where you left off.','Resume game'); $('status').textContent='Paused.';
  }
  async function finish() {
    mode='over'; saveBest(); $('pause').disabled=true;
    overlay('CONNECTION LOST', 'Score: '+game.score+' · Best: '+best, 'Play again');
    $('status').textContent='Game over. Score '+game.score+'.';
    $('run-result').hidden=false;$('score-form').hidden=true;
    showRunLeaderboard();
    const current=generation;
    if(!ticket) {$('run-rank').textContent='Practice run. Play again to try the leaderboard.';return;}
    $('run-rank').textContent='Checking your rank…';
    try {
      const result=await api({action:'finish',ticket,ticks,moves});
      if(generation!==current||mode!=='over')return;
      $('run-rank').textContent='Your score would place #'+result.rank+'.';
      $('score-form').hidden=false;$('submit-score').disabled=false;
      try {$('nickname').value=localStorage.getItem('packet-run-nickname')||'';}catch{}
    } catch(error) {if(generation===current)$('run-rank').textContent=error.message||'Could not check this score. Try another run.';}
  }
  function move(d) { if(mode==='playing') {moves.push([ticks,d]);game.move(d);draw();} }
  $('refresh-scores').addEventListener('click',loadScores);
  $('open-info').addEventListener('click',()=>$('info-dialog').showModal());
  document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  $('score-form').addEventListener('submit',async event=> {
    event.preventDefault();if(mode!=='over'||!ticket)return;
    const current=generation;$('submit-score').disabled=true;$('submit-status').textContent='Saving…';
    try {
      const result=await api({action:'submit',ticket,nickname:$('nickname').value});
      if(current!==generation)return;
      $('run-rank').textContent='You’re #'+result.rank+' on the leaderboard!';
      $('submit-status').textContent='Added as '+result.nickname+'.';$('score-form').hidden=true;
      try{localStorage.setItem('packet-run-nickname',result.nickname);}catch{}
      displayScores(result.entries);
    } catch(error) {if(current===generation){$('submit-status').textContent=error.message||'Could not save. Try again.';$('submit-score').disabled=false;}}
  });
  $('start').addEventListener('click',start); $('pause').addEventListener('click',pause);
  $('left').addEventListener('click',()=>move(-1)); $('right').addEventListener('click',()=>move(1));
  document.addEventListener('keydown',e=> {
    if(e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,textarea,select')) return;
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
    accumulator+=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
    while(accumulator>=STEP&&!game.over){game.tick(STEP);ticks++;accumulator-=STEP;}
    updateScore();draw();
    if(game.lastEvent && $('status').textContent!==game.lastEvent) $('status').textContent=game.lastEvent;
    if(game.over) finish(); else frame=requestAnimationFrame(loop);
  }
  draw();loadScores();
})();

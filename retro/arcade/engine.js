/* Time-based simulation, independent of rendering and input devices. */
class PacketEngine {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() { this.lane=1; this.lives=3; this.score=0; this.streak=0; this.time=0; this.spawnIn=.8; this.objects=[]; this.shield=0; this.over=false; this.lastEvent=''; }
  move(direction) { if (!this.over) this.lane=Math.max(0,Math.min(2,this.lane+direction)); }
  tick(dt) {
    if(this.over) return;
    dt=Math.min(.05,Math.max(0,dt)); this.time+=dt; this.shield=Math.max(0,this.shield-dt); this.spawnIn-=dt;
    const speed=135+Math.min(200,this.time*6);
    if(this.spawnIn<=0) {
      const bug=Math.floor(this.random()*3), gold=(bug+1+Math.floor(this.random()*2))%3;
      this.objects.push({lane:bug,y:-24,type:'bug'},{lane:gold,y:-24,type:'gold'});
      this.spawnIn=Math.max(.55,1.2-this.time*.022);
    }
    for(const o of this.objects) {
      const previous=o.y; o.y+=speed*dt;
      if(!o.checked && previous<414 && o.y>=414) {
        o.checked=true;
        if(o.lane===this.lane) {
          if(o.type==='gold') { this.streak++; const mult=Math.min(5,1+Math.floor(this.streak/5)); this.score+=10*mult; o.collected=true; this.lastEvent='Packet collected! ×'+mult; }
          else if(this.shield<=0) { this.lives--; this.streak=0; this.shield=1.4; this.lastEvent='Bug hit. '+this.lives+' lives left.'; if(!this.lives) { this.over=true; break; } }
        } else if(o.type==='gold') this.streak=0;
      }
      if(o.type==='bug' && !o.scored && o.y>450) { o.scored=true; this.score++; }
    }
    this.objects=this.objects.filter(o=>o.y<510 && !o.collected);
  }
}
// Seeded generator shared by the browser and server replay verifier.
PacketEngine.random = function(seed) {
  let state=seed>>>0;
  return function() {
    state=(state+0x6D2B79F5)|0;
    let t=Math.imul(state^(state>>>15),1|state);
    t^=t+Math.imul(t^(t>>>7),61|t);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
};
if(typeof module!=='undefined') module.exports=PacketEngine;

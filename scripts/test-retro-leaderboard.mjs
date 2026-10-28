import assert from 'node:assert/strict';
import Engine from '../retro/arcade/engine.js';
import endpoint,{issueTicket,verifyTicket,nickname,replay} from '../retro/api/leaderboard.mjs';
process.env.IP_SALT='test-only-leaderboard-key';
const now=Date.now();const issued=issueTicket('test-ip',now);const run=verifyTicket(issued.ticket,'test-ip',now);
assert.equal(run.seed,issued.seed);
assert.throws(()=>verifyTicket(issued.ticket+'x','test-ip',now));
assert.throws(()=>verifyTicket(issued.ticket,'other-ip',now));
assert.throws(()=>verifyTicket(issued.ticket,'test-ip',now+7200001));
assert.equal(nickname('  pixel7 '),'PIXEL7');
for(const bad of ['x','x'.repeat(19),'<script>','😀','a_b','pixel 7'])assert.throws(()=>nickname(bad));
const game=new Engine(Engine.random(run.seed));let ticks=0;
while(!game.over&&ticks<216000){game.tick(1/60);ticks++;}
assert.ok(game.over);
const verified=replay(run,ticks,[],now+ticks/60*1000+5000);
assert.equal(verified,game.score,'server reproduces exact score');
assert.throws(()=>replay(run,ticks-1,[],now+ticks/60*1000+5000),'truncated run rejected');
assert.throws(()=>replay(run,ticks+1,[],now+ticks/60*1000+5000),'padded run rejected');
assert.throws(()=>replay(run,ticks,[],now),'impossible wall-clock duration rejected');
assert.throws(()=>replay(run,ticks,[[2,1],[1,-1]],now+600000),'unsorted moves rejected');
assert.throws(()=>replay(run,ticks,[[0,2]],now+600000),'invalid direction rejected');
assert.throws(()=>replay(run,216001,[],now+7200000),'bounded replay cost');
// Exercise movement changes against the exact shared browser simulation.
const seed=42,moves=[];const moved=new Engine(Engine.random(seed));let frames=0;
while(!moved.over&&frames<216000){if(frames%100===0){const d=(frames%200===0?1:-1);moves.push([frames,d]);moved.move(d);}moved.tick(1/60);frames++;}
assert.equal(replay({...run,seed},frames,moves,now+frames/60*1000+1000),moved.score);
const wrongMethod=await endpoint.fetch(new Request('https://example.com/api/leaderboard',{method:'DELETE'}));assert.equal(wrongMethod.status,405);
const crossOrigin=await endpoint.fetch(new Request('https://example.com/api/leaderboard',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{}'}));assert.equal(crossOrigin.status,403);
const invalidJSON=await endpoint.fetch(new Request('https://example.com/api/leaderboard',{method:'POST',headers:{'content-type':'application/json'},body:'{'}));assert.equal(invalidJSON.status,400);
console.log('PASS: signed run tickets, expiry, nickname validation, deterministic scoring, movement replay, forged-run rejection, method and origin checks.');

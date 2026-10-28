import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import crypto from 'node:crypto';
import postgres from '../retro/node_modules/postgres/src/index.js';
import Engine from '../retro/arcade/engine.js';
import endpoint,{issueTicket,verifyTicket} from '../retro/api/leaderboard.mjs';
const require=createRequire(import.meta.url);require('dotenv').config({path:'.env.local',quiet:true});
const sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,ssl:'require',connect_timeout:15});
const address='integration-'+crypto.randomUUID();
const ip=crypto.createHmac('sha256',process.env.IP_SALT).update('packet-run-v1:'+address).digest('base64url');
const issued=issueTicket(ip,Date.now()-300000),run=verifyTicket(issued.ticket,ip);
const game=new Engine(Engine.random(issued.seed));let ticks=0;
while(!game.over&&ticks<216000){game.tick(1/60);ticks++;}
async function post(body) {
 const response=await endpoint.fetch(new Request('https://girwan.com/api/leaderboard',{method:'POST',headers:{'content-type':'application/json',origin:'https://girwan.com','x-forwarded-for':address},body:JSON.stringify(body)}));
 return {status:response.status,body:await response.json()};
}
try {
 const started=await post({action:'start'});assert.equal(started.status,200);assert.ok(started.body.ticket);
 const finished=await post({action:'finish',ticket:issued.ticket,ticks,moves:[]});assert.equal(finished.status,200,JSON.stringify(finished.body));assert.equal(finished.body.score,game.score);assert.ok(finished.body.rank>=1);
 const hidden=await sql`select nickname from arcade.runs where id=${run.id}`;assert.equal(hidden[0].nickname,null);
 const bad=await post({action:'submit',ticket:issued.ticket,nickname:'<script>'});assert.equal(bad.status,400);
 const name='QA_'+crypto.randomBytes(3).toString('hex');
 const saved=await post({action:'submit',ticket:issued.ticket,nickname:name});assert.equal(saved.status,200);assert.equal(saved.body.nickname,name);assert.ok(saved.body.rank>=1);
 const again=await post({action:'submit',ticket:issued.ticket,nickname:'ChangedName'});assert.equal(again.status,200);assert.equal(again.body.nickname,name);
 const rows=await sql`select count(*)::int as count from arcade.runs where id=${run.id}`;assert.equal(rows[0].count,1);
 const list=await endpoint.fetch(new Request('https://girwan.com/api/leaderboard'));assert.equal(list.status,200);const result=await list.json();assert.ok(result.entries.some(e=>e.nickname===name));
 assert.ok(result.entries.every(e=>Object.keys(e).sort().join(',')==='nickname,rank,score'));
 console.log('PASS: real database start, verified finish/rank, pending-score privacy, nickname rejection, publication, idempotent retries, public score list.');
} catch(e) {console.error('Integration failed:',e.message);process.exitCode=1;}
finally {
 try{await sql`delete from arcade.runs where id=${run.id}`;await sql`delete from arcade.rate_limits where key like ${ip+':%'}`;}catch{}
 await sql.end();
 // Close the lazily-created endpoint connection too, without touching production data.
 setTimeout(()=>process.exit(process.exitCode||0),100).unref();
}

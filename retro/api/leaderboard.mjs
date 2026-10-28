import crypto from 'node:crypto';
import postgres from 'postgres';
import PacketEngine from '../arcade/engine.js';

const STEP=1/60, MAX_TICKS=216000, VERSION=1;
let database;
function db() {
  if(!process.env.DATABASE_URL) throw new Error('Database unavailable');
  return database ||= postgres(process.env.DATABASE_URL,{max:1,prepare:false,idle_timeout:20,connect_timeout:10,ssl:'require'});
}
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
function secret() { if(!process.env.IP_SALT) throw new Error('Signing unavailable'); return process.env.IP_SALT; }
function digest(value) {return crypto.createHmac('sha256',secret()).update('packet-run-v1:'+value).digest('base64url');}
function identity(request) {
  const ip=(request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'local').split(',')[0].trim();
  return digest(ip);
}
export function issueTicket(ip, now=Date.now()) {
  const run={v:VERSION,id:crypto.randomUUID(),seed:crypto.randomBytes(4).readUInt32LE(),iat:now,ip};
  const payload=Buffer.from(JSON.stringify(run)).toString('base64url');
  return {ticket:payload+'.'+digest(payload),seed:run.seed};
}
export function verifyTicket(ticket,ip,now=Date.now()) {
  if(typeof ticket!=='string'||ticket.length>1024) throw fail('Start a new run to submit a score.');
  const [payload,sig,...extra]=ticket.split('.');
  const expected=Buffer.from(digest(payload||''));const actual=Buffer.from(sig||'');
  if(extra.length||expected.length!==actual.length||!crypto.timingSafeEqual(expected,actual)) throw fail('Invalid run. Start a new game.');
  let run;try{run=JSON.parse(Buffer.from(payload,'base64url').toString());}catch{throw fail('Invalid run.');}
  if(run.v!==VERSION||run.ip!==ip||!Number.isInteger(run.iat)||now-run.iat>7200000||run.iat>now+5000)throw fail('This run expired. Start a new game.');
  return run;
}
export function nickname(value) {
  if(typeof value!=='string')throw fail('Enter a nickname.');
  const name=value.normalize('NFKC').trim().toUpperCase();
  if(!/^[A-Z0-9]+$/.test(name)||name.length<2||name.length>18)throw fail('Use 2–18 letters or numbers only.');
  return name;
}
export function replay(run,ticks,moves,now=Date.now()) {
  if(!Number.isInteger(ticks)||ticks<1||ticks>MAX_TICKS||!Array.isArray(moves)||moves.length>12000)throw fail('Invalid replay.');
  if(ticks*STEP>(now-run.iat)/1000+2)throw fail('Run timing could not be verified.');
  let previous=-1;
  for(const move of moves) {
    if(!Array.isArray(move)||move.length!==2||!Number.isInteger(move[0])||move[0]<0||move[0]>=ticks||move[0]<previous||![1,-1].includes(move[1]))throw fail('Invalid replay moves.');
    previous=move[0];
  }
  const game=new PacketEngine(PacketEngine.random(run.seed));let index=0;
  for(let tick=0;tick<ticks;tick++) {
    while(index<moves.length&&moves[index][0]===tick)game.move(moves[index++][1]);
    game.tick(STEP);
    if(game.over&&tick!==ticks-1)throw fail('Run ended before the submitted replay.');
  }
  if(!game.over)throw fail('Finish the run before submitting.');
  return game.score;
}
async function limit(ip,action) {
  const sql=db();const key=ip+':'+action;
  const [row]=await sql`insert into arcade.rate_limits (key,window_start,requests) values (${key},now(),1)
    on conflict (key) do update set
    requests=case when arcade.rate_limits.window_start < now()-interval '10 minutes' then 1 else arcade.rate_limits.requests+1 end,
    window_start=case when arcade.rate_limits.window_start < now()-interval '10 minutes' then now() else arcade.rate_limits.window_start end
    returning requests`;
  if(row.requests>(action==='start'?40:100))throw fail('Too many requests. Try again in a few minutes.',429);
}
async function topScores(sql) {
  return sql`select nickname,score,(rank() over(order by score desc))::int as rank
    from arcade.runs where nickname is not null order by score desc,submitted_at asc,id asc limit 5`;
}
async function position(sql,score) {
  const [row]=await sql`select (count(*)+1)::int as rank from arcade.runs where nickname is not null and score>${score}`;
  return row.rank;
}
async function handle(request) {
  if(!['GET','POST'].includes(request.method))throw fail('Method not allowed.',405);
  if(request.method==='GET')return {entries:await topScores(db())};
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)throw fail('Request origin is not allowed.',403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw fail('Send JSON.',415);
  if(Number(request.headers.get('content-length')||0)>150000)throw fail('Replay too large.',413);
  const reader=request.body?.getReader();const chunks=[];let size=0;
  if(!reader)throw fail('Missing request.');
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>150000){await reader.cancel();throw fail('Replay too large.',413);}chunks.push(Buffer.from(value));}
  let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail('Invalid JSON.');}
  if(!data||!['start','finish','submit'].includes(data.action))throw fail('Invalid action.');
  const ip=identity(request);await limit(ip,data.action);
  if(data.action==='start')return issueTicket(ip);
  const run=verifyTicket(data.ticket,ip);const sql=db();
  if(data.action==='finish') {
    const score=replay(run,data.ticks,data.moves);
    await sql`insert into arcade.runs(id,score,ip_hash) values (${run.id},${score},${ip}) on conflict(id) do nothing`;
    // Cleanup only private, unclaimed runs and expired rate counters.
    await sql`delete from arcade.runs where nickname is null and created_at < now()-interval '1 day'`;
    await sql`delete from arcade.rate_limits where window_start < now()-interval '1 day'`;
    const [stored]=await sql`select score from arcade.runs where id=${run.id} and ip_hash=${ip}`;
    return {score:stored.score,rank:await position(sql,stored.score)};
  }
  const name=nickname(data.nickname);
  const [saved]=await sql`update arcade.runs set nickname=${name},submitted_at=now() where id=${run.id} and ip_hash=${ip} and nickname is null and not exists (select 1 from arcade.runs other where lower(other.nickname)=lower(${name})) returning score,nickname`;
  if(!saved) {
    const [duplicate]=await sql`select 1 from arcade.runs where lower(nickname)=lower(${name}) limit 1`;
    if(duplicate)throw fail('That nickname is already taken. Choose another.');
  }
  const existing=saved||(await sql`select score,nickname from arcade.runs where id=${run.id} and ip_hash=${ip} and nickname is not null`)[0];
  if(!existing)throw fail('Finish a run before adding it to the leaderboard.');
  return {...existing,rank:await position(sql,existing.score),entries:await topScores(sql)};
}
export default {
  async fetch(request) {
    try { return Response.json(await handle(request),{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); }
    catch(error) {
      const status=error.status||503;
      if(!error.status)console.error('Leaderboard unavailable:',error.code||error.name);
      return Response.json({error:error.status?error.message:'Leaderboard is temporarily unavailable. You can still play.'},{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'600'}:{})}});
    }
  }
};

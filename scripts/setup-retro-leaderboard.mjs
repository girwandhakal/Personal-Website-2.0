import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import postgres from '../retro/node_modules/postgres/src/index.js';
const require=createRequire(import.meta.url);require('dotenv').config({path:'.env.local',quiet:true});
const sql=postgres(process.env.DATABASE_URL,{ssl:'require',max:1,prepare:false,connect_timeout:15,onnotice:()=>{}});
try {
 await sql.unsafe(await fs.readFile(new URL('./sql/retro-leaderboard.sql',import.meta.url),'utf8'));
 const tables=await sql`select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='arcade' and c.relkind='r' order by c.relname`;
 console.log('Leaderboard schema ready:',JSON.stringify(tables));
 const grants=await sql`select grantee,table_name,privilege_type from information_schema.role_table_grants where table_schema='arcade' and grantee in ('anon','authenticated','PUBLIC')`;
 if(grants.length)throw new Error('Unexpected public grants');
 console.log('Verified: RLS enabled; no public, anon, or authenticated table grants.');
} catch(e) {console.error('Schema setup failed:',e.code||e.name, e.message);process.exitCode=1;} finally{await sql.end();}

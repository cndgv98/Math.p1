import fs from 'node:fs';import assert from 'node:assert/strict';
const {PGlite}=await import('@electric-sql/pglite').catch(()=>import('../test-deps/package/dist/index.js'));
const pg=new PGlite();let checks=0;
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
async function run(sql,params=[]){return pg.query(sql,params)}
async function login(n){await pg.exec('reset role');await run("select set_config('request.jwt.claim.sub',$1,false)",[id(n)]);await pg.exec('set role authenticated');}
async function rejects(fn){let threw=false;try{await fn()}catch{threw=true}assert(threw,'Expected database to reject operation');checks++;}
try{
 await pg.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;`);
 await pg.exec(fs.readFileSync(new URL('../backend/schema.sql',import.meta.url),'utf8'));console.log('PASS schema compiles in PostgreSQL');checks++;
 await pg.exec(`insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}');
 insert into students(id,code,name) values('${id(11)}','001','A'),('${id(12)}','002','B'),('${id(13)}','003','C');
 insert into profiles(id,name,email,role,student_id) values('${id(1)}','Admin','a@example.test','admin',null),('${id(2)}','GV','t@example.test','teacher',null),('${id(3)}','HS','s@example.test','student','${id(11)}');
 insert into classes(id,year_id,name,grade) values('${id(21)}','2026-2027','10A1',10),('${id(22)}','2026-2027','10A2',10);
 insert into enrollments(class_id,student_id) values('${id(21)}','${id(11)}'),('${id(21)}','${id(12)}'),('${id(22)}','${id(13)}');
 insert into assignments(class_id,teacher_id) values('${id(21)}','${id(2)}');
 insert into assessments(id,year_id,semester,grade,name,date,kind,class_id,created_by) values('${id(31)}','2026-2027',1,10,'Chung','2026-11-01','common',null,'${id(1)}'),('${id(32)}','2026-2027',1,10,'TX','2026-11-02','regular','${id(21)}','${id(2)}');`);
 await login(1);
 const rows=[11,12,13].map((n,i)=>({student_id:id(n),value:[0,10,6][i],status:'scored',version:0,note:''}));
 await run('select save_scores($1,$2)',[id(31),JSON.stringify(rows)]);assert.equal((await run('select * from scores')).rows.length,3);checks++;console.log('PASS admin bulk import, zero retained');
 await login(2);assert.equal((await run('select * from scores')).rows.length,2);assert.equal((await run('select * from students')).rows.length,2);checks++;console.log('PASS teacher cannot read another class student/score');
 const metrics=(await run('select class_metrics($1,$2) result',['2026-2027',1])).rows[0].result;assert.equal(metrics.filter(r=>r.assessment_id===id(31)).length,2);assert.equal(Number(metrics.find(r=>r.class_id===id(21)&&r.assessment_id===id(31)).avg),5);checks++;console.log('PASS teacher receives aggregated comparison for other classes');
 await rejects(()=>run('select save_scores($1,$2)',[id(31),JSON.stringify(rows)]));
 await rejects(()=>run('update scores set value=9 where student_id=$1',[id(11)]));
 await run('update profiles set role=$1 where id=$2',['admin',id(2)]);assert.equal((await run('select role from profiles where id=$1',[id(2)])).rows[0].role,'teacher');checks++;
 await run('select save_scores($1,$2)',[id(32),JSON.stringify([{student_id:id(11),value:8,status:'scored',version:0,note:'First'}])]);checks++;console.log('PASS teacher writes only assigned regular assessment');
 await rejects(()=>run('select save_scores($1,$2)',[id(32),JSON.stringify([{student_id:id(13),value:8,status:'scored',version:0}])]));
 await rejects(()=>run('select save_scores($1,$2)',[id(32),JSON.stringify([{student_id:id(11),value:9,status:'scored',version:0}])]));
 await run('select save_scores($1,$2)',[id(32),JSON.stringify([{student_id:id(11),value:null,status:'missing',version:1,note:'Blank'}])]);assert.equal((await run('select value,status from scores where assessment_id=$1',[id(32)])).rows[0].value,null);checks++;
 await login(3);assert.equal((await run('select * from scores')).rows.length,2);assert.equal((await run('select * from students')).rows.length,1);assert.deepEqual((await run("select class_metrics('2026-2027',1) result")).rows[0].result,[]);checks++;console.log('PASS student only sees own history, no class aggregates');
 await login(1);await run('insert into thresholds(assessment_id,class_id,value) values($1,$2,6)',[id(32),id(21)]);await run('update assessments set locked=true where id=$1',[id(32)]);await login(2);await rejects(()=>run('select save_scores($1,$2)',[id(32),JSON.stringify([{student_id:id(11),value:7,status:'scored',version:2}])]));
 await login(1);assert.equal((await run('select count(*) n from audit')).rows[0].n,5);checks++;
 await rejects(()=>run('delete from audit'));
 await rejects(()=>run('insert into enrollments(class_id,student_id) values($1,$2)',[id(22),id(11)]));
 await rejects(()=>run('select save_scores($1,$2)',[id(31),JSON.stringify([{student_id:id(11),value:10.001,status:'scored',version:1}])]));
 // Entire import rolls back when a later row is invalid.
 await rejects(()=>run('select save_scores($1,$2)',[id(31),JSON.stringify([{student_id:id(11),value:5,status:'scored',version:1},{student_id:id(12),value:11,status:'scored',version:1}])]));assert.equal(Number((await run('select value from scores where assessment_id=$1 and student_id=$2',[id(31),id(11)])).rows[0].value),0);checks++;console.log('PASS invalid batch rolls back all changes');
 // Round-trip backup in same database, without deleting audit history.
 const backup={};for(const t of ['years','classes','students','profiles','enrollments','assignments','assessments','thresholds','scores','supports','audit'])backup[t]=(await run(`select * from ${t}`)).rows;
 await run('select restore_backup($1)',[JSON.stringify(backup)]);assert.equal((await run('select locked from assessments where id=$1',[id(32)])).rows[0].locked,true);checks++;console.log('PASS backup round trip including locked assessment thresholds');
 await run("select rollover_year('2026-2027','2027-2028')");assert.equal((await run("select count(*) n from enrollments en join classes c on c.id=en.class_id where c.year_id='2027-2028'")).rows[0].n,3);assert.equal((await run("select count(*) n from assignments a join classes c on c.id=a.class_id where c.year_id='2027-2028'")).rows[0].n,0);checks++;console.log('PASS year rollover retains old history and does not copy teacher access');
 // Thu hồi phân công có hiệu lực tại API, không chỉ ẩn giao diện.
 await run('update assignments set active=false where teacher_id=$1',[id(2)]);await login(2);assert.equal((await run('select * from scores')).rows.length,0);checks++;await login(1);
 // Mô phỏng quy mô yêu cầu: 25 giáo viên, 50 lớp, 2000 học sinh.
 await pg.exec('reset role');await pg.exec(`insert into years(id) values('2028-2029');
 insert into auth.users select gen_random_uuid() from generate_series(1,25);
 insert into profiles(id,name,email,role) select id,'GV tải thử',id::text||'@load.test','teacher' from auth.users where id not in(select id from profiles);
 insert into classes(year_id,name,grade) select '2028-2029','10T'||i,10 from generate_series(1,50) i;
 insert into students(code,name) select 'LOAD'||i,'HS tải thử '||i from generate_series(1,2000) i;
 insert into enrollments(class_id,student_id) select c.id,s.id from students s join classes c on c.year_id='2028-2029' and c.name='10T'||ceil(substring(s.code from 5)::numeric/40)::int::text where s.code like 'LOAD%';
 insert into assessments(id,year_id,semester,grade,name,date,kind,created_by) values('${id(99)}','2028-2029',1,10,'Khảo sát tải thử','2028-10-01','common','${id(1)}');`);
 await login(1);const loadRows=(await run("select id from students where code like 'LOAD%' order by code")).rows.map((s,i)=>({student_id:s.id,value:(i%101)/10,status:'scored',version:0,note:''}));const started=Date.now();await run('select save_scores($1,$2)',[id(99),JSON.stringify(loadRows)]);const loadMetrics=(await run("select class_metrics('2028-2029',1) result")).rows[0].result;assert.equal(loadMetrics.length,50);assert.equal(loadMetrics.reduce((s,r)=>s+Number(r.n),0),2000);checks++;console.log(`PASS 25 teachers / 50 classes / 2000 scores; local PostgreSQL simulation ${Date.now()-started} ms (not production benchmark)`);
 console.log(`PASS ${checks} backend checks`);
}finally{await pg.close()}

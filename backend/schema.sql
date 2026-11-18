-- Chạy MỘT LẦN trong SQL Editor của một dự án Supabase mới.
-- Không đưa dữ liệu học sinh hoặc khóa dịch vụ vào kho GitHub.
begin;
create table public.years(id text primary key check(id ~ '^\d{4}-\d{4}$'), status text not null default 'active' check(status in ('active','archived')));
create table public.classes(id uuid primary key default gen_random_uuid(),year_id text not null references public.years(id),name text not null,grade smallint not null check(grade between 10 and 12),unique(year_id,name));
create table public.students(id uuid primary key default gen_random_uuid(),code text not null unique check(length(trim(code))>0),name text not null);
create table public.profiles(id uuid primary key references auth.users(id),name text not null,email text not null unique,role text not null check(role in ('admin','teacher','student')),active boolean not null default true,student_id uuid references public.students(id),check(role<>'student' or student_id is not null));
create unique index one_student_account on public.profiles(student_id) where role='student';
create table public.enrollments(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id),student_id uuid not null references public.students(id),unique(class_id,student_id));
create table public.assignments(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id),teacher_id uuid not null references public.profiles(id),active boolean not null default true,unique(class_id,teacher_id));
create table public.assessments(id uuid primary key default gen_random_uuid(),year_id text not null references public.years(id),semester smallint not null check(semester in (1,2)),grade smallint not null check(grade between 10 and 12),name text not null,date date not null,kind text not null check(kind in ('regular','common')),class_id uuid references public.classes(id),threshold numeric(4,2) not null default 5 check(threshold between 0 and 10),comparison_group text not null default '',topic text not null default '',locked boolean not null default false,created_by uuid not null references public.profiles(id),check((kind='common' and class_id is null) or (kind='regular' and class_id is not null)));
create table public.thresholds(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.assessments(id),class_id uuid not null references public.classes(id),value numeric(4,2) not null check(value between 0 and 10),unique(assessment_id,class_id));
create table public.scores(id uuid not null unique default gen_random_uuid(),assessment_id uuid not null references public.assessments(id),student_id uuid not null references public.students(id),value numeric(4,2),status text not null check(status in ('scored','missing','absent','exempt','makeup')),note text not null default '',version integer not null default 1 check(version>0),updated_at timestamptz not null default now(),primary key(assessment_id,student_id),check((status='scored' and value is not null and value between 0 and 10) or (status<>'scored' and value is null)));
create table public.supports(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),assessment_id uuid not null references public.assessments(id),author_id uuid not null references public.profiles(id),state text not null check(state in ('watch','support','dismissed','done')),plan text not null,result text not null default '',review_date date,updated_at timestamptz not null default now(),unique(student_id,assessment_id));
create table public.audit(id uuid primary key default gen_random_uuid(),operation text not null default 'update' check(operation in ('insert','update')),actor_id uuid references public.profiles(id),actor_name text,at timestamptz not null default now(),assessment_id uuid not null references public.assessments(id),student_id uuid not null references public.students(id),old_value numeric,new_value numeric,old_status text,new_status text,old_note text,new_note text);
create index scores_student on public.scores(student_id);
create index enrollment_student on public.enrollments(student_id);
create index assignment_teacher on public.assignments(teacher_id);
create index assessment_scope on public.assessments(year_id,semester,grade);
create index audit_assessment on public.audit(assessment_id,at);

create function public.app_role() returns text language sql stable security definer set search_path=public,pg_temp as $$select role from public.profiles where id=auth.uid() and active$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$select coalesce(public.app_role()='admin',false)$$;
create function public.can_class(p_class uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select public.is_admin() or (public.app_role()='teacher' and exists(select 1 from public.assignments where class_id=p_class and teacher_id=auth.uid() and active))$$;
create function public.can_student(p_student uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select public.is_admin() or exists(select 1 from public.profiles where id=auth.uid() and active and role='student' and student_id=p_student) or (public.app_role()='teacher' and exists(select 1 from public.enrollments en join public.assignments a on a.class_id=en.class_id where en.student_id=p_student and a.teacher_id=auth.uid() and a.active))$$;
create function public.can_read_score(p_exam uuid,p_student uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select public.is_admin() or exists(select 1 from public.assessments x join public.classes c on c.year_id=x.year_id and c.grade=x.grade and (x.class_id is null or x.class_id=c.id) join public.enrollments en on en.class_id=c.id where x.id=p_exam and en.student_id=p_student and (public.can_class(c.id) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and p.role='student' and p.student_id=p_student)))
$$;
create function public.can_write_exam(p_exam uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.assessments x where x.id=p_exam and not x.locked and (public.is_admin() or (public.app_role()='teacher' and x.kind='regular' and public.can_class(x.class_id) and exists(select 1 from public.years y where y.id=x.year_id and y.status='active'))))$$;

-- Không cho một học sinh thuộc hai lớp trong cùng năm học.
create function public.check_enrollment() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if exists(select 1 from public.enrollments en join public.classes c on c.id=en.class_id where en.student_id=new.student_id and en.id<>new.id and c.year_id=(select year_id from public.classes where id=new.class_id)) then raise exception 'Học sinh đã thuộc một lớp trong năm học này';end if;return new;end$$;
create trigger enrollment_guard before insert or update on public.enrollments for each row execute function public.check_enrollment();
create function public.check_assessment() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if new.class_id is not null and not exists(select 1 from public.classes where id=new.class_id and year_id=new.year_id and grade=new.grade) then raise exception 'Lớp không khớp khối hoặc năm học';end if;
 if tg_op='UPDATE' and exists(select 1 from public.scores where assessment_id=old.id) and (new.kind<>old.kind or new.class_id is distinct from old.class_id or new.year_id<>old.year_id or new.grade<>old.grade or new.semester<>old.semester) then raise exception 'Không đổi phạm vi bài đã có điểm';end if;
 if auth.uid() is not null and not public.is_admin() then
   if new.created_by<>auth.uid() or new.kind<>'regular' or not public.can_class(new.class_id) or new.locked then raise exception 'Không có quyền tạo/sửa bài kiểm tra';end if;
   if tg_op='UPDATE' and old.locked then raise exception 'Bài đã khóa';end if;
 end if; return new;end$$;
create trigger assessment_guard before insert or update on public.assessments for each row execute function public.check_assessment();
create function public.check_threshold() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if not exists(select 1 from public.assessments x join public.classes c on c.year_id=x.year_id and c.grade=x.grade and (x.class_id is null or x.class_id=c.id) where x.id=new.assessment_id and c.id=new.class_id) then raise exception 'Ngưỡng không khớp lớp và bài';end if;
 if not public.can_write_exam(new.assessment_id) then raise exception 'Không có quyền thay đổi ngưỡng hoặc bài đã khóa';end if;return new;end$$;
create trigger threshold_guard before insert or update on public.thresholds for each row execute function public.check_threshold();
create function public.protect_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if tg_op='UPDATE' and old.id=auth.uid() and (new.role<>old.role or not new.active) then raise exception 'Không tự hạ quyền hoặc khóa tài khoản hiện tại';end if;
 return new;end$$;
create trigger profile_guard before update on public.profiles for each row execute function public.protect_profile();

-- Nhật ký do máy chủ tạo; trình duyệt không được sửa/xóa nhật ký.
create function public.log_score_change() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 if tg_op='INSERT' then
 insert into public.audit(operation,actor_id,actor_name,assessment_id,student_id,old_value,new_value,old_status,new_status,old_note,new_note) values('insert',auth.uid(),(select name from public.profiles where id=auth.uid()),new.assessment_id,new.student_id,null,new.value,'missing',new.status,'',new.note);
 elsif (old.value,old.status,old.note) is distinct from (new.value,new.status,new.note) then
 insert into public.audit(actor_id,actor_name,assessment_id,student_id,old_value,new_value,old_status,new_status,old_note,new_note) values(auth.uid(),(select name from public.profiles where id=auth.uid()),new.assessment_id,new.student_id,old.value,new.value,old.status,new.status,old.note,new.note);
 end if;return new;end$$;
create trigger score_audit after insert or update on public.scores for each row execute function public.log_score_change();

do $$declare t text;begin foreach t in array array['years','classes','students','profiles','enrollments','assignments','assessments','thresholds','scores','supports','audit'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);end loop;end$$;
grant insert,update on public.years,public.classes,public.students,public.profiles,public.enrollments,public.assignments,public.assessments,public.thresholds,public.supports to authenticated;
create policy years_read on public.years for select to authenticated using(public.app_role() is not null);
create policy years_write on public.years for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy classes_read on public.classes for select to authenticated using(public.app_role() is not null);
create policy classes_write on public.classes for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy students_read on public.students for select to authenticated using(public.can_student(id));
create policy students_write on public.students for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profiles_write on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy enrollments_read on public.enrollments for select to authenticated using(public.can_class(class_id) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.active and p.role='student' and p.student_id=enrollments.student_id));
create policy enrollments_write on public.enrollments for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy assignments_read on public.assignments for select to authenticated using(public.is_admin() or (teacher_id=auth.uid() and public.app_role()='teacher'));
create policy assignments_write on public.assignments for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy assessments_read on public.assessments for select to authenticated using(public.is_admin() or (public.app_role()='teacher' and (kind='common' or public.can_class(class_id))) or (public.app_role()='student' and exists(select 1 from public.enrollments en join public.classes c on c.id=en.class_id join public.profiles p on p.student_id=en.student_id where p.id=auth.uid() and p.active and c.year_id=assessments.year_id and c.grade=assessments.grade and (assessments.class_id is null or assessments.class_id=c.id))));
create policy assessments_insert on public.assessments for insert to authenticated with check(public.is_admin() or (public.app_role()='teacher' and kind='regular' and public.can_class(class_id) and created_by=auth.uid() and exists(select 1 from public.years where id=year_id and status='active')));
create policy assessments_update on public.assessments for update to authenticated using(public.can_write_exam(id) or public.is_admin()) with check(public.is_admin() or (kind='regular' and public.can_class(class_id) and created_by=auth.uid()));
create policy thresholds_read on public.thresholds for select to authenticated using(public.app_role() is not null);
create policy thresholds_write on public.thresholds for all to authenticated using(public.can_write_exam(assessment_id)) with check(public.can_write_exam(assessment_id));
create policy scores_read on public.scores for select to authenticated using(public.can_read_score(assessment_id,student_id));
create policy supports_read on public.supports for select to authenticated using(public.app_role() in ('admin','teacher') and public.can_read_score(assessment_id,student_id));
create policy supports_insert on public.supports for insert to authenticated with check(public.app_role() in ('admin','teacher') and author_id=auth.uid() and public.can_read_score(assessment_id,student_id));
create policy supports_update on public.supports for update to authenticated using(public.app_role() in ('admin','teacher') and public.can_read_score(assessment_id,student_id)) with check(author_id=auth.uid() and public.can_read_score(assessment_id,student_id));
create policy audit_read on public.audit for select to authenticated using(public.app_role() in ('admin','teacher') and public.can_read_score(assessment_id,student_id));

-- Ghi một lô trong giao dịch, kiểm tra quyền và phiên bản chống ghi đè đồng thời.
create function public.save_scores(p_assessment uuid,p_rows jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare x public.assessments; r jsonb; st uuid; v numeric; s text; old_version integer;begin
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>10000 then raise exception 'Lô điểm không hợp lệ';end if;
 -- Khóa theo bài kiểm tra để hai lô nhập không thể cùng ghi bản mới.
 select * into x from public.assessments where id=p_assessment for update;
 if not found or not public.can_write_exam(p_assessment) then raise exception 'Không có quyền ghi điểm hoặc bảng điểm đã khóa';end if;
 if not public.is_admin() and x.kind='common' then raise exception 'Chỉ tổ trưởng nhập bài chung';end if;
 if exists(select 1 from jsonb_array_elements(p_rows) a group by a->>'student_id' having count(*)>1) then raise exception 'Trùng học sinh trong lô';end if;
 for r in select * from jsonb_array_elements(p_rows) loop
  st=(r->>'student_id')::uuid;s=r->>'status';v=nullif(r->>'value','')::numeric;
  if v is not null and (v<0 or v>10 or v<>round(v,2)) then raise exception 'Điểm phải từ 0 đến 10, tối đa hai chữ số thập phân';end if;
  if not exists(select 1 from public.enrollments en join public.classes c on c.id=en.class_id where en.student_id=st and c.year_id=x.year_id and c.grade=x.grade and (x.class_id is null or c.id=x.class_id)) then raise exception 'Học sinh không thuộc phạm vi bài';end if;
  select version into old_version from public.scores where assessment_id=x.id and student_id=st;
  if coalesce(old_version,0)<>coalesce((r->>'version')::integer,0) then raise exception 'Điểm đã thay đổi bởi người khác. Tải lại trước khi lưu.';end if;
  insert into public.scores(assessment_id,student_id,value,status,note) values(x.id,st,v,s,coalesce(r->>'note','')) on conflict(assessment_id,student_id) do update set value=excluded.value,status=excluded.status,note=excluded.note,version=scores.version+1,updated_at=now() where (scores.value,scores.status,scores.note) is distinct from (excluded.value,excluded.status,excluded.note);
 end loop;
end$$;

-- Chỉ trả số liệu tổng hợp, không trả tên/mã/điểm cá nhân lớp khác.
create function public.class_metrics(p_year text,p_semester integer) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$declare result jsonb;begin
 if public.app_role() not in ('admin','teacher') or public.app_role() is null then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from (
  select x.id assessment_id,c.id class_id,c.name class_name,c.grade,count(en.student_id) total,count(s.value) n,avg(s.value) avg,percentile_cont(.5) within group(order by s.value) median,stddev_pop(s.value) sd,
   count(s.value) filter(where s.value>=coalesce(th.value,x.threshold))*100.0/nullif(count(s.value),0) pass,
   count(s.value)*100.0/nullif(count(en.student_id),0) attendance,
   jsonb_build_array(count(s.value) filter(where s.value<5),count(s.value) filter(where s.value>=5 and s.value<6.5),count(s.value) filter(where s.value>=6.5 and s.value<8),count(s.value) filter(where s.value>=8)) bands
  from public.assessments x join public.classes c on c.year_id=x.year_id and c.grade=x.grade and (x.class_id is null or x.class_id=c.id)
  left join public.enrollments en on en.class_id=c.id left join public.scores s on s.assessment_id=x.id and s.student_id=en.student_id and s.status='scored'
  left join public.thresholds th on th.assessment_id=x.id and th.class_id=c.id
  where x.year_id=p_year and x.semester=p_semester and (x.kind='common' or public.can_class(c.id)) group by x.id,c.id,th.value
 ) t;return result;end$$;

create function public.import_roster(p_rows jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare r jsonb;st uuid;cl public.classes;old_en uuid;begin
 if not public.is_admin() then raise exception 'Chỉ tổ trưởng được nhập danh sách';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>10000 then raise exception 'Lô dữ liệu không hợp lệ';end if;
 if exists(select 1 from jsonb_array_elements(p_rows) a group by a->>'code' having count(*)>1) then raise exception 'Mã bị trùng trong tệp';end if;
 for r in select * from jsonb_array_elements(p_rows) loop
  if length(trim(coalesce(r->>'code','')))=0 or length(trim(coalesce(r->>'name','')))=0 then raise exception 'Thiếu mã hoặc tên';end if;
  select * into cl from public.classes where id=(r->>'class_id')::uuid;if not found then raise exception 'Lớp chưa tồn tại';end if;
  insert into public.students(code,name) values(trim(r->>'code'),trim(r->>'name')) on conflict(code) do update set name=excluded.name returning id into st;
  select en.id into old_en from public.enrollments en join public.classes c on c.id=en.class_id where en.student_id=st and c.year_id=cl.year_id;
  if old_en is null then insert into public.enrollments(class_id,student_id) values(cl.id,st);else update public.enrollments set class_id=cl.id where id=old_en;end if;
 end loop;end$$;

create function public.rollover_year(p_old text,p_new text) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare c public.classes;next_id uuid;begin
 if not public.is_admin() then raise exception 'Không có quyền';end if;
 if p_new !~ '^\d{4}-\d{4}$' or right(p_new,4)::int<>left(p_new,4)::int+1 or left(p_new,4)::int<=left(p_old,4)::int then raise exception 'Năm học không hợp lệ';end if;
 perform 1 from public.years where id=p_old and status='active' for update;if not found then raise exception 'Năm nguồn không tồn tại hoặc đã lưu trữ';end if;
 insert into public.years(id) values(p_new);
 for c in select * from public.classes where year_id=p_old and grade<12 loop
  insert into public.classes(year_id,name,grade) values(p_new,(c.grade+1)::text||regexp_replace(c.name,'^\d+',''),c.grade+1) returning id into next_id;
  insert into public.enrollments(class_id,student_id) select next_id,student_id from public.enrollments where class_id=c.id;
 end loop;
 update public.years set status='archived' where id=p_old;
end$$;

-- Phục hồi cùng dự án, không phải nhập dữ liệu không rõ nguồn gốc.
-- Giữ dữ liệu ngoài bản sao lưu, giữ nhật ký hiện tại, ghi thêm nhật ký thay đổi điểm.
create function public.restore_backup(p_backup jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare t text;cols text;updates text;conflict_cols text;payload jsonb;begin
 if not public.is_admin() then raise exception 'Không có quyền';end if;
 if jsonb_typeof(p_backup->'years')<>'array' then raise exception 'Bản sao lưu không hợp lệ';end if;
 for t in select unnest(array['years','classes','students','profiles','enrollments','assignments','assessments','thresholds','scores','supports','audit']) loop
  if jsonb_typeof(p_backup->t)<>'array' then raise exception 'Thiếu bảng %',t;end if;
  select string_agg(quote_ident(column_name),',' order by ordinal_position),string_agg(format('%I=excluded.%I',column_name,column_name),',' order by ordinal_position) filter(where column_name<>'id' and not(t='scores' and column_name in ('assessment_id','student_id'))) into cols,updates from information_schema.columns where table_schema='public' and table_name=t;
  conflict_cols=case when t='scores' then 'assessment_id,student_id' else 'id' end;
  if t='scores' then updates=replace(replace(updates,'version=excluded.version','version=scores.version+1'),'updated_at=excluded.updated_at','updated_at=now()');end if;
  payload=p_backup->t;
  -- Mở khóa nội bộ trong cùng giao dịch để phục hồi ngưỡng của bài đã khóa.
  if t='assessments' then select coalesce(jsonb_agg(j||'{"locked":false}'::jsonb),'[]'::jsonb) into payload from jsonb_array_elements(payload) j;end if;
  if t='audit' then execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I,$1) on conflict(id) do nothing',t,cols,cols,t) using payload;
  else execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I,$1) on conflict(%s) do update set %s',t,cols,cols,t,conflict_cols,updates) using payload;end if;
 end loop;
 update public.assessments x set locked=(j->>'locked')::boolean from jsonb_array_elements(p_backup->'assessments') j where x.id=(j->>'id')::uuid;
end$$;

-- Các helper nội bộ chỉ cấp những hàm cần thiết, không mở mặc định cho anon.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.app_role(),public.is_admin(),public.can_class(uuid),public.can_student(uuid),public.can_read_score(uuid,uuid),public.can_write_exam(uuid),public.save_scores(uuid,jsonb),public.class_metrics(text,integer),public.import_roster(jsonb),public.rollover_year(text,text),public.restore_backup(jsonb) to authenticated;
insert into public.years(id) values('2026-2027');
commit;

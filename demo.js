const uuid = (prefix,n) => `${prefix}-${n}`;
export function makeDemo() {
 const years=[{id:'2026-2027',status:'active'},{id:'2025-2026',status:'archived'}];
 const profiles=[{id:'admin',name:'Tổ trưởng Tổ Toán',email:'totruong@demo.local',role:'admin',active:true},{id:'gv1',name:'Nguyễn Minh Anh',email:'giaovien@demo.local',role:'teacher',active:true},{id:'hs1',name:'Học sinh mẫu',email:'hocsinh@demo.local',role:'student',active:true,student_id:'s-1'}];
 const classes=[],students=[],enrollments=[],assignments=[],assessments=[],scores=[],thresholds=[];
 let sid=0,eid=0;
 for(const grade of [10,11,12])for(let c=1;c<=3;c++){
   const cl={id:uuid('c',`${grade}-${c}`),name:`${grade}A${c}`,grade,year_id:'2026-2027'};classes.push(cl);
   assignments.push({id:`a-${cl.id}`,class_id:cl.id,teacher_id:c===1?'gv1':'admin'});
   for(let n=1;n<=24;n++){sid++;const s={id:uuid('s',sid),code:`DTD${String(sid).padStart(5,'0')}`,name:['Nguyễn','Trần','Lê','Phạm','Hoàng'][sid%5]+' '+['Minh Anh','Quang Huy','Hà Linh','Đức Minh','Ngọc Hà','Tuấn Anh','Phương Thảo','Gia Bảo'][sid%8]+` ${String(n).padStart(2,'0')}`};students.push(s);enrollments.push({id:`en-${sid}`,class_id:cl.id,student_id:s.id});}
 }
 for(const grade of [10,11,12])for(let t=1;t<=3;t++)assessments.push({id:`exam-${++eid}`,name:['Khảo sát đầu năm','Khảo sát tháng 10','Giữa học kỳ I'][t-1],kind:'common',grade,year_id:'2026-2027',semester:1,date:['2026-09-10','2026-10-12','2026-11-05'][t-1],threshold:5,class_id:null,locked:false,comparison_group:`KS-${grade}`,topic:'Đánh giá chung',created_by:'admin'});
 for(const cl of classes)for(let t=1;t<=2;t++)assessments.push({id:`exam-${++eid}`,name:`KTTX số ${t} · ${cl.name}`,kind:'regular',grade:cl.grade,year_id:'2026-2027',semester:1,date:t===1?'2026-10-01':'2026-11-01',threshold:5,class_id:cl.id,locked:false,comparison_group:'',topic:cl.grade===10?'Hàm số':cl.grade===11?'Dãy số':'Ứng dụng đạo hàm',created_by:'gv1'});
 for(const ex of assessments){const cls=classes.filter(c=>c.grade===ex.grade&&(!ex.class_id||c.id===ex.class_id));for(const en of enrollments.filter(en=>cls.some(c=>c.id===en.class_id))){const index=Number(en.student_id.split('-')[1]);const tick=ex.date.includes('11')?1:0;let value=Math.min(10,Math.max(0,Math.round((3.2+((index*17+Number(ex.id.split('-')[1])*3)%61)/10+tick*.3)*10)/10));const status=index%31===0?'absent':index%47===0?'makeup':'scored';scores.push({assessment_id:ex.id,student_id:en.student_id,status,value:status==='scored'?value:null,note:'',version:1,updated_at:ex.date+'T09:00:00Z'});}}
 return {years,profiles,classes,students,enrollments,assignments,assessments,scores,thresholds,supports:[],audit:[]};
}

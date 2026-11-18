export const STATUS = { scored:'Có điểm', missing:'Chưa nhập', absent:'Vắng thi', exempt:'Miễn kiểm tra', makeup:'Chờ kiểm tra bù' };
export const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num = (n,d=2) => n==null?'—':Number(n).toLocaleString('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d});
export function parseScore(value,status='scored') {
  if(status!=='scored') { if(!Object.hasOwn(STATUS,status)) throw Error('Trạng thái không hợp lệ'); return {value:null,status}; }
  const s=String(value??'').trim();
  if(!s) return {value:null,status:'missing'};
  if(!/^\d{1,2}([.,]\d{1,2})?$/.test(s)) throw Error('Điểm phải là số, tối đa 2 chữ số thập phân');
  const n=Number(s.replace(',','.')); if(n<0||n>10) throw Error('Điểm phải từ 0 đến 10');
  return {value:n,status:'scored'};
}
export function stats(rows,threshold=5,total=rows.length) {
  const a=rows.filter(r=>r.status==='scored'&&Number.isFinite(r.value)).map(r=>r.value).sort((a,b)=>a-b);
  const n=a.length,avg=n?a.reduce((s,x)=>s+x,0)/n:null;
  return {n,total,avg,median:n?(a[Math.floor((n-1)/2)]+a[Math.floor(n/2)])/2:null,sd:n?Math.sqrt(a.reduce((s,x)=>s+(x-avg)**2,0)/n):null,pass:n?a.filter(x=>x>=threshold).length/n*100:null,attendance:total?n/total*100:0,bins:[0,0,0,0,0].map((_,i)=>a.filter(x=>Math.min(4,Math.floor(x/2))===i).length)};
}
export function rankRows(rows) {
  const sorted=[...rows].sort((a,b)=>(b.avg??-1)-(a.avg??-1));
  return sorted.map((r,i)=>({...r,rank:r.avg==null?null:(i&&r.avg===sorted[i-1].avg?sorted.slice(0,i).findIndex(x=>x.avg===r.avg)+1:i+1)}));
}
export function quartiles(values) {
  const a=values.filter(Number.isFinite).sort((x,y)=>x-y);
  const q=p=>{if(!a.length)return null;const k=(a.length-1)*p,lo=Math.floor(k);return a[lo]+(a[Math.ceil(k)]-a[lo])*(k-lo)};
  return [q(.25),q(.5),q(.75)];
}
export function quartileGroup(value,qs) { if(value==null||qs[0]==null)return null;return value<qs[0]?1:value<qs[1]?2:value<qs[2]?3:4; }
export function groupedQuartiles(values) {
  const a=values.filter(v=>Number.isFinite(v)&&v>=0&&v<=10),n=a.length;
  if(!n)return [null,null,null];
  const counts=[0,0,0,0,0];a.forEach(v=>counts[Math.min(4,Math.floor(v/2))]++);
  return [.25,.5,.75].map(p=>{let cumulative=0;for(let i=0;i<5;i++){if(counts[i]&&cumulative+counts[i]>=p*n)return i*2+(p*n-cumulative)/counts[i]*2;cumulative+=counts[i]}return 10});
}
export function correlation(pairs) {
  const a=pairs.filter(p=>p.every(Number.isFinite));if(a.length<3)return null;
  const mx=a.reduce((s,p)=>s+p[0],0)/a.length,my=a.reduce((s,p)=>s+p[1],0)/a.length;
  const xx=a.reduce((s,p)=>s+(p[0]-mx)**2,0),yy=a.reduce((s,p)=>s+(p[1]-my)**2,0);
  return xx&&yy?a.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/Math.sqrt(xx*yy):null;
}
export function previewImport(rows,students,existing=[]) {
  const seen=new Set(), errors=[],changes=[];
  rows.forEach((row,i)=>{const code=String(row.MaHS??'').trim();const st=students.find(s=>s.code===code);
    try {if(!code)throw Error('Thiếu MaHS');if(seen.has(code))throw Error('Trùng MaHS trong tệp');seen.add(code);if(!st)throw Error('Mã học sinh không thuộc phạm vi bài/lớp hoặc chưa có danh sách');
      const score=parseScore(row.Diem,row.TrangThai?String(row.TrangThai).trim():'scored');
      const old=existing.find(r=>r.student_id===st.id);changes.push({student_id:st.id,code,name:st.name,...score,note:String(row.NhanXet??''),version:old?.version??0,old:old?.value??null,oldStatus:old?.status??'missing'});
    }catch(e){errors.push({line:i+2,code,message:e.message})}
  });return {errors,changes};
}
export function csvParse(text) {
  const delimiter=text.split(/\r?\n/)[0].includes('\t')?'\t':text.split(/\r?\n/)[0].includes(';')?';':',';
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
    else if(c===delimiter&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c;
  }if(quoted)throw Error('Dấu ngoặc kép trong CSV chưa đóng');row.push(cell);if(row.some(Boolean))rows.push(row);
  const headers=(rows.shift()??[]).map(x=>x.replace(/^\uFEFF/,'').trim());return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
}

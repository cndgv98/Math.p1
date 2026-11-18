// Supabase Edge Function. Service role chỉ có trên máy chủ, không đưa vào config.js.
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
Deno.serve(async(req:Request)=>{
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const scoped=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('Authorization')??''}},auth:{persistSession:false}});
 const {data:{user},error}=await scoped.auth.getUser();if(error||!user)return reply({error:'Chưa đăng nhập'},401);
 const server=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:profile}=await server.from('profiles').select('role,active').eq('id',user.id).single();if(!profile?.active||profile.role!=='admin')return reply({error:'Chỉ tổ trưởng được cấp tài khoản'},403);
 try{
  const {email,password,name,role,student_id}=await req.json();
  if(typeof email!=='string'||typeof name!=='string'||!name.trim()||typeof password!=='string'||password.length<10||!['teacher','student','admin'].includes(role))return reply({error:'Thông tin không hợp lệ; mật khẩu tối thiểu 10 ký tự'},400);
  if(role==='student') {const {data:s}=await server.from('students').select('id').eq('id',student_id).single();if(!s)return reply({error:'Cần mã học sinh hợp lệ'},400)}
  const {data:created,error:ce}=await server.auth.admin.createUser({email,password,email_confirm:true});if(ce)return reply({error:ce.message},400);
  const {error:pe}=await server.from('profiles').insert({id:created.user.id,email,name:name.trim(),role,student_id:role==='student'?student_id:null,active:true});
  if(pe){await server.auth.admin.deleteUser(created.user.id);return reply({error:pe.message},400)}
  return reply({id:created.user.id});
 }catch{return reply({error:'Không thể tạo tài khoản. Kiểm tra dữ liệu và cấu hình hàm.'},400)}
});

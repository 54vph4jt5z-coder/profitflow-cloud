import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabaseClient";
import { BarChart3, Boxes, Download, Home, LogOut, PlusCircle, Receipt, Settings, ShoppingCart, Trash2, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import "./styles.css";

function today(offset=0){ const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); }
function money(n,currency="GBP"){ const s=currency==="USD"?"$":currency==="EUR"?"€":"£"; return s+Number(n||0).toFixed(2); }
const canAddRole = r => ["owner","admin","staff"].includes(r);
const canDeleteRole = r => ["owner","admin"].includes(r);

function App(){
  const [session,setSession]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false);}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return()=>subscription.unsubscribe(); },[]);
  if(loading) return <main><p>Loading...</p></main>;
  if(!session) return <Auth/>;
  return <DashboardApp user={session.user}/>;
}

function Auth(){
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[msg,setMsg]=useState(""),[err,setErr]=useState("");
  async function signUp(){ setErr(""); setMsg(""); const {error}=await supabase.auth.signUp({email,password}); error?setErr(error.message):setMsg("Account created. Check your email if Supabase asks you to confirm it."); }
  async function signIn(){ setErr(""); setMsg(""); const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)setErr(error.message); }
  return <section className="auth"><h1>ProfitFlow Cloud</h1><p>Login to your business dashboard.</p>{err&&<p className="error">{err}</p>}{msg&&<p className="success">{msg}</p>}<input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/><button onClick={signIn}>Log in</button><button className="secondary" onClick={signUp}>Create account</button></section>;
}

function DashboardApp({user}){
  const [page,setPage]=useState("dashboard"),[products,setProducts]=useState([]),[orders,setOrders]=useState([]),[costs,setCosts]=useState([]),[activity,setActivity]=useState([]),[business,setBusiness]=useState(null),[myRole,setMyRole]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState("");
  async function writeActivity(action,details){ if(!business?.id)return; await supabase.rpc("log_activity",{target_business_id:business.id,action_text:action,details_text:details}); }
  async function loadData(){
    setLoading(true); setError("");
    const membership=await supabase.from("business_members").select("business_id,role").eq("user_id",user.id).limit(1).maybeSingle();
    if(membership.error){ console.error("Membership error:",membership.error); setError("Could not load your business membership."); setLoading(false); return; }
    if(!membership.data?.business_id){ setBusiness(null); setProducts([]); setOrders([]); setCosts([]); setActivity([]); setError("You are not part of a business yet. Create your own business to start using ProfitFlow."); setLoading(false); return; }
    setMyRole(membership.data.role);
    const b=await supabase.from("businesses").select("id,name,currency,logo_url,description").eq("id",membership.data.business_id).maybeSingle();
    if(b.error){ console.error("Business error:",b.error); setError("Could not load your business."); setLoading(false); return; }
    if(!b.data){ setBusiness(null); setError("Business not found. Create a new business to continue."); setLoading(false); return; }
    setBusiness(b.data);
    const [p,o,c,a]=await Promise.all([
      supabase.from("products").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("orders").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("costs").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("activity_log").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}).limit(10)
    ]);
    if(p.error)console.error("Products error:",p.error); if(o.error)console.error("Orders error:",o.error); if(c.error)console.error("Costs error:",c.error); if(a.error)console.error("Activity error:",a.error);
    setProducts(p.data||[]); setOrders(o.data||[]); setCosts(c.data||[]); setActivity(a.data||[]); setLoading(false);
  }
  useEffect(()=>{loadData();},[]);
  const stats=useMemo(()=>{ const revenue=orders.reduce((s,o)=>s+Number(o.sale_price||0),0), fees=orders.reduce((s,o)=>s+Number(o.fees||0)+Number(o.shipping||0),0), costTotal=costs.reduce((s,c)=>s+Number(c.amount||0),0); const weekAgo=new Date(); weekAgo.setDate(weekAgo.getDate()-7); const weeklyRevenue=orders.filter(o=>new Date(o.order_date)>=weekAgo).reduce((s,o)=>s+Number(o.sale_price||0),0), weeklyFees=orders.filter(o=>new Date(o.order_date)>=weekAgo).reduce((s,o)=>s+Number(o.fees||0)+Number(o.shipping||0),0), weeklyCosts=costs.filter(c=>new Date(c.cost_date)>=weekAgo).reduce((s,c)=>s+Number(c.amount||0),0); const inventoryValue=products.reduce((s,p)=>s+(Number(p.stock||0)*Number(p.buy_price||0)),0), lowStock=products.filter(p=>Number(p.stock||0)>0&&Number(p.stock||0)<=3), outOfStock=products.filter(p=>Number(p.stock||0)<=0); return {revenue,fees,costTotal,profit:revenue-fees-costTotal,weeklyProfit:weeklyRevenue-weeklyFees-weeklyCosts,inventoryValue,lowStock,outOfStock,totalOrders:orders.length}; },[orders,costs,products]);
  const chartData=useMemo(()=>{ const map={}; for(const o of orders){ map[o.order_date]??={date:o.order_date,revenue:0,costs:0,profit:0}; map[o.order_date].revenue+=Number(o.sale_price||0); map[o.order_date].profit+=Number(o.sale_price||0)-Number(o.fees||0)-Number(o.shipping||0); } for(const c of costs){ map[c.cost_date]??={date:c.cost_date,revenue:0,costs:0,profit:0}; map[c.cost_date].costs+=Number(c.amount||0); map[c.cost_date].profit-=Number(c.amount||0); } return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)); },[orders,costs]);
  const platformData=useMemo(()=>Object.values(orders.reduce((m,o)=>{ const k=o.platform||"Unknown"; m[k]??={platform:k,revenue:0}; m[k].revenue+=Number(o.sale_price||0); return m; },{})),[orders]);
  async function signOut(){ await supabase.auth.signOut(); }
  return <div className="app"><aside><h1>ProfitFlow</h1><p>{business?business.name:user.email}</p>{business&&<p>Role: {myRole||"loading..."}</p>}<Nav page={page} setPage={setPage} id="dashboard" icon={<Home/>} label="Dashboard"/><Nav page={page} setPage={setPage} id="orders" icon={<ShoppingCart/>} label="Sales / Orders"/><Nav page={page} setPage={setPage} id="costs" icon={<Receipt/>} label="Costs"/><Nav page={page} setPage={setPage} id="products" icon={<Boxes/>} label="Inventory"/><Nav page={page} setPage={setPage} id="reports" icon={<BarChart3/>} label="Reports"/><Nav page={page} setPage={setPage} id="team" icon={<Users/>} label="Team"/><Nav page={page} setPage={setPage} id="settings" icon={<Settings/>} label="Settings"/><button className="secondary" onClick={signOut}><LogOut size={16}/> Sign out</button></aside><main>{loading?<p>Loading your data...</p>:error?<CreateBusiness user={user} reload={loadData} message={error}/>:<>{page==="dashboard"&&<HomePage stats={stats} chartData={chartData} platformData={platformData} products={products} activity={activity} business={business}/>} {page==="orders"&&<Orders user={user} business={business} myRole={myRole} orders={orders} products={products} reload={loadData} writeActivity={writeActivity}/>} {page==="costs"&&<Costs user={user} business={business} myRole={myRole} costs={costs} reload={loadData} writeActivity={writeActivity}/>} {page==="products"&&<Products user={user} business={business} myRole={myRole} products={products} reload={loadData} writeActivity={writeActivity}/>} {page==="reports"&&<Reports orders={orders} costs={costs} products={products} stats={stats} business={business}/>} {page==="team"&&<Team business={business}/>} {page==="settings"&&<BusinessSettings business={business} myRole={myRole} reload={loadData} writeActivity={writeActivity}/>}</>}</main></div>;
}

function CreateBusiness({user,reload,message}){ const [name,setName]=useState(""),[err,setErr]=useState(""); async function createBusiness(){ setErr(""); if(!name.trim()){setErr("Enter a business name."); return;} const result=await supabase.rpc("create_business_for_current_user",{business_name:name.trim()}); if(result.error){setErr(result.error.message); return;} setName(""); reload(); } return <section className="card"><h2>Create your own business</h2><p>{message||"You are not currently part of a business."}</p>{err&&<p className="error">{err}</p>}<div className="form"><input placeholder="Business name" value={name} onChange={e=>setName(e.target.value)}/><button onClick={createBusiness}>Create business</button></div></section>; }
function Nav({page,setPage,id,icon,label}){ return <button className={page===id?"nav active":"nav"} onClick={()=>setPage(id)}>{icon}{label}</button>; }
function Header({title,note}){ return <header><h1>{title}</h1><p>{note}</p></header>; }
function Stat({label,value}){ return <section className="stat"><span>{label}</span><strong>{value}</strong></section>; }

function HomePage({stats,chartData,platformData,products,activity,business}){ return <><Header title="Dashboard" note="Live sales, costs, inventory, and weekly profit."/><div className="grid"><Stat label="Revenue" value={money(stats.revenue,business.currency)}/><Stat label="Total Profit" value={money(stats.profit,business.currency)}/><Stat label="Weekly Profit" value={money(stats.weeklyProfit,business.currency)}/><Stat label="Inventory Value" value={money(stats.inventoryValue,business.currency)}/></div><div className="grid"><Stat label="Total Orders" value={stats.totalOrders}/><Stat label="Low Stock" value={stats.lowStock.length}/><Stat label="Out of Stock" value={stats.outOfStock.length}/><Stat label="Products" value={products.length}/></div>{(stats.lowStock.length>0||stats.outOfStock.length>0)&&<section className="card"><h2>Stock Alerts</h2>{stats.outOfStock.length>0&&<p><b>Out of stock:</b> {stats.outOfStock.map(p=>p.name).join(", ")}</p>}{stats.lowStock.length>0&&<p><b>Low stock:</b> {stats.lowStock.map(p=>`${p.name} (${p.stock})`).join(", ")}</p>}</section>}<section className="card"><h2>Profit over time</h2><ResponsiveContainer width="100%" height={260}><LineChart data={chartData}><XAxis dataKey="date"/><YAxis/><Tooltip formatter={v=>money(v,business.currency)}/><Line type="monotone" dataKey="profit" strokeWidth={3}/></LineChart></ResponsiveContainer></section><section className="card"><h2>Sales by platform</h2><ResponsiveContainer width="100%" height={240}><BarChart data={platformData}><XAxis dataKey="platform"/><YAxis/><Tooltip formatter={v=>money(v,business.currency)}/><Bar dataKey="revenue"/></BarChart></ResponsiveContainer></section><section className="card"><h2>Recent Activity</h2>{activity.length===0?<p>No recent activity yet.</p>:<table><thead><tr><th>Time</th><th>Action</th><th>Details</th></tr></thead><tbody>{activity.map(a=><tr key={a.id}><td>{new Date(a.created_at).toLocaleString()}</td><td>{a.action}</td><td>{a.details}</td></tr>)}</tbody></table>}</section></>; }

function Orders({user,business,myRole,orders,products,reload,writeActivity}){ const [editing,setEditing]=useState(null); const [f,setF]=useState({order_date:today(),product:"",platform:"",quantity:1,sale_price:"",fees:"",shipping:""}); const canAdd=canAddRole(myRole), canDelete=canDeleteRole(myRole), canEdit=canAddRole(myRole); function startEdit(row){setEditing(row.id);setF({order_date:row.order_date||today(),product:row.product||"",platform:row.platform||"",quantity:row.quantity||1,sale_price:row.sale_price||"",fees:row.fees||"",shipping:row.shipping||""});} function resetForm(){setEditing(null);setF({order_date:today(),product:"",platform:"",quantity:1,sale_price:"",fees:"",shipping:""});} async function save(){ if(!business||!canAdd)return; const qtySold=Number(f.quantity||1); const selectedProduct=products.find(p=>p.name===f.product); if(!editing&&selectedProduct&&qtySold>Number(selectedProduct.stock||0)){alert("Not enough stock available.");return;} if(editing){const result=await supabase.from("orders").update(f).eq("id",editing); if(result.error){alert(result.error.message);return;} await writeActivity("Updated order",`${f.product||"Order"} was edited`);} else {const orderResult=await supabase.from("orders").insert({...f,user_id:user.id,business_id:business.id}); if(orderResult.error){alert(orderResult.error.message);return;} if(selectedProduct){const newStock=Number(selectedProduct.stock||0)-qtySold; const stockResult=await supabase.from("products").update({stock:newStock}).eq("id",selectedProduct.id); if(stockResult.error)alert("Order saved, but stock could not update: "+stockResult.error.message);} await writeActivity("Added sale",`${f.product||"Product"} sold x${qtySold}`);} resetForm(); reload(); } async function del(id){ if(!canDelete)return; await supabase.from("orders").delete().eq("id",id); await writeActivity("Deleted order",`Order ${id} was deleted`); reload(); } return <><Header title="Sales / Orders" note={canAdd?"Add and edit sales. New sales automatically reduce stock.":"Read-only access. You can view orders but cannot add or delete them."}/>{canAdd&&<section className="card form"><input type="date" value={f.order_date} onChange={e=>setF({...f,order_date:e.target.value})}/><select value={f.product} onChange={e=>setF({...f,product:e.target.value})}><option value="">Product</option>{products.map(p=><option key={p.id} value={p.name}>{p.name} — Stock: {p.stock}</option>)}</select><input placeholder="Platform" value={f.platform} onChange={e=>setF({...f,platform:e.target.value})}/><input type="number" placeholder="Qty" value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/><input type="number" placeholder="Sale price" value={f.sale_price} onChange={e=>setF({...f,sale_price:e.target.value})}/><input type="number" placeholder="Fees" value={f.fees} onChange={e=>setF({...f,fees:e.target.value})}/><input type="number" placeholder="Shipping" value={f.shipping} onChange={e=>setF({...f,shipping:e.target.value})}/><button onClick={save}><PlusCircle size={16}/>{editing?"Save order":"Add sale"}</button>{editing&&<button className="secondary" onClick={resetForm}>Cancel edit</button>}</section>}<EditableTable rows={orders} cols={["order_date","product","platform","quantity","sale_price","fees","shipping"]} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/></>; }

function Costs({user,business,myRole,costs,reload,writeActivity}){ const [editing,setEditing]=useState(null); const [f,setF]=useState({cost_date:today(),website:"",category:"",description:"",amount:""}); const canAdd=canAddRole(myRole), canDelete=canDeleteRole(myRole), canEdit=canAddRole(myRole); function startEdit(row){setEditing(row.id);setF({cost_date:row.cost_date||today(),website:row.website||"",category:row.category||"",description:row.description||"",amount:row.amount||""});} function resetForm(){setEditing(null);setF({cost_date:today(),website:"",category:"",description:"",amount:""});} async function save(){ if(!business||!canAdd)return; if(editing){const result=await supabase.from("costs").update(f).eq("id",editing); if(result.error){alert(result.error.message);return;} await writeActivity("Updated cost",`${f.description||f.category||"Cost"} was edited`);} else {const result=await supabase.from("costs").insert({...f,user_id:user.id,business_id:business.id}); if(result.error){alert(result.error.message);return;} await writeActivity("Added cost",`${f.description||f.category||"Cost"}: ${money(f.amount,business.currency)}`);} resetForm(); reload(); } async function del(id){ if(!canDelete)return; await supabase.from("costs").delete().eq("id",id); await writeActivity("Deleted cost",`Cost ${id} was deleted`); reload(); } return <><Header title="Costs" note={canAdd?"Track purchases, stock, postage, packaging, ads, and website costs.":"Read-only access. You can view costs but cannot add or delete them."}/>{canAdd&&<section className="card form"><input type="date" value={f.cost_date} onChange={e=>setF({...f,cost_date:e.target.value})}/><input placeholder="Website" value={f.website} onChange={e=>setF({...f,website:e.target.value})}/><input placeholder="Category" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/><input placeholder="Description" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/><input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/><button onClick={save}><PlusCircle size={16}/>{editing?"Save cost":"Add cost"}</button>{editing&&<button className="secondary" onClick={resetForm}>Cancel edit</button>}</section>}<EditableTable rows={costs} cols={["cost_date","website","category","description","amount"]} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/></>; }

function Products({user,business,myRole,products,reload,writeActivity}){
  const [editing,setEditing]=useState(null);
  const [imageFile,setImageFile]=useState(null);
  const [f,setF]=useState({name:"",sku:"",stock:"",buy_price:"",sell_price:"",supplier:"",image_url:""});
  const canAdd=canAddRole(myRole), canDelete=canDeleteRole(myRole), canEdit=canAddRole(myRole);

  function startEdit(row){
    setEditing(row.id);
    setImageFile(null);
    setF({
      name:row.name||"",
      sku:row.sku||"",
      stock:row.stock||"",
      buy_price:row.buy_price||"",
      sell_price:row.sell_price||"",
      supplier:row.supplier||"",
      image_url:row.image_url||""
    });
  }

  function resetForm(){
    setEditing(null);
    setImageFile(null);
    setF({name:"",sku:"",stock:"",buy_price:"",sell_price:"",supplier:"",image_url:""});
  }

  async function uploadImage(){
    if(!imageFile) return f.image_url;

    const safeName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g,"_");
    const filePath = `${business.id}/${Date.now()}-${safeName}`;

    const uploadResult = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile);

    if(uploadResult.error){
      alert(uploadResult.error.message);
      return f.image_url;
    }

    const publicUrlResult = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return publicUrlResult.data.publicUrl;
  }

  async function save(){
    if(!business||!canAdd)return;

    const finalImageUrl = await uploadImage();

    const productData = {
      ...f,
      image_url: finalImageUrl
    };

    if(editing){
      const result=await supabase.from("products").update(productData).eq("id",editing);
      if(result.error){alert(result.error.message);return;}
      await writeActivity("Updated product",`${f.name||"Product"} was edited`);
    } else {
      const result=await supabase.from("products").insert({...productData,user_id:user.id,business_id:business.id});
      if(result.error){alert(result.error.message);return;}
      await writeActivity("Added product",`${f.name||"Product"} added to inventory`);
    }

    resetForm();
    reload();
  }

  async function del(id){
    if(!canDelete)return;
    await supabase.from("products").delete().eq("id",id);
    await writeActivity("Deleted product",`Product ${id} was deleted`);
    reload();
  }

  return <>
    <Header title="Inventory" note={canAdd?"Add products, stock, upload photos, suppliers, prices, and profit margins.":"Read-only access. You can view inventory but cannot add or delete products."}/>
    {canAdd&&
      <section className="card form">
        <input placeholder="Product name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
        <input placeholder="SKU" value={f.sku} onChange={e=>setF({...f,sku:e.target.value})}/>
        <input type="number" placeholder="Stock" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}/>
        <input type="number" placeholder="Buy price" value={f.buy_price} onChange={e=>setF({...f,buy_price:e.target.value})}/>
        <input type="number" placeholder="Sell price" value={f.sell_price} onChange={e=>setF({...f,sell_price:e.target.value})}/>
        <input placeholder="Supplier" value={f.supplier} onChange={e=>setF({...f,supplier:e.target.value})}/>

        <input
          type="file"
          accept="image/*"
          onChange={e=>setImageFile(e.target.files?.[0] || null)}
        />

        {f.image_url && !imageFile && (
          <p>Current image saved.</p>
        )}

        {imageFile && (
          <p>Selected image: {imageFile.name}</p>
        )}

        <button onClick={save}><PlusCircle size={16}/>{editing?"Save product":"Add product"}</button>
        {editing&&<button className="secondary" onClick={resetForm}>Cancel edit</button>}
      </section>
    }
    <ProductTable products={products} currency={business.currency} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/>
  </>;
}

function ProductTable({products,currency,onEdit,onDelete}){ return <section className="card"><table><thead><tr><th>Image</th><th>Name</th><th>SKU</th><th>Stock</th><th>Buy</th><th>Sell</th><th>Profit</th><th>Margin</th><th>Supplier</th>{(onEdit||onDelete)&&<th>Actions</th>}</tr></thead><tbody>{products.map(p=>{const profit=Number(p.sell_price||0)-Number(p.buy_price||0); const margin=Number(p.sell_price||0)>0?((profit/Number(p.sell_price))*100).toFixed(1):"0.0"; const stock=Number(p.stock||0); return <tr key={p.id}><td>{p.image_url?<img src={p.image_url} alt={p.name} style={{width:44,height:44,objectFit:"cover",borderRadius:8}}/>:"—"}</td><td>{p.name}</td><td>{p.sku}</td><td>{stock<=0?"Out of stock":stock<=3?`Low: ${stock}`:stock}</td><td>{money(p.buy_price,currency)}</td><td>{money(p.sell_price,currency)}</td><td>{money(profit,currency)}</td><td>{margin}%</td><td>{p.supplier}</td>{(onEdit||onDelete)&&<td>{onEdit&&<button className="secondary" onClick={()=>onEdit(p)}>Edit</button>} {onDelete&&<button className="danger" onClick={()=>onDelete(p.id)}><Trash2 size={14}/>Delete</button>}</td>}</tr>;})}</tbody></table></section>; }
function EditableTable({rows,cols,onEdit,onDelete}){ return <section className="card"><table><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}{(onEdit||onDelete)&&<th>Actions</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c}>{String(r[c]??"")}</td>)}{(onEdit||onDelete)&&<td>{onEdit&&<button className="secondary" onClick={()=>onEdit(r)}>Edit</button>} {onDelete&&<button className="danger" onClick={()=>onDelete(r.id)}><Trash2 size={14}/>Delete</button>}</td>}</tr>)}</tbody></table></section>; }

function Team({business}){ const [email,setEmail]=useState(""),[members,setMembers]=useState([]),[msg,setMsg]=useState(""),[err,setErr]=useState(""); async function leaveBusiness(){ const confirmed=confirm("Are you sure you want to leave this business? You will lose access unless someone adds you again."); if(!confirmed)return; const result=await supabase.rpc("leave_current_business",{target_business_id:business.id}); if(result.error){setErr(result.error.message);return;} alert(result.data); window.location.reload(); } async function loadMembers(){ if(!business)return; setErr(""); const result=await supabase.rpc("get_business_members",{target_business_id:business.id}); if(result.error){console.error("Members error:",result.error); setErr("Could not load team members."); return;} setMembers(result.data||[]); } useEffect(()=>{loadMembers();},[business?.id]); async function addMember(){ setMsg(""); setErr(""); if(!email.trim()){setErr("Enter your friend's email address."); return;} const result=await supabase.rpc("add_business_member_by_email",{target_email:email.trim(),target_business_id:business.id}); if(result.error){setErr(result.error.message); return;} if(typeof result.data==="string"&&result.data.toLowerCase().includes("not found")){setErr(result.data); return;} setMsg(result.data||"Member added successfully."); setEmail(""); loadMembers(); } async function changeRole(memberId,newRole){ setMsg(""); setErr(""); const result=await supabase.rpc("update_business_member_role",{target_member_id:memberId,new_role:newRole}); if(result.error){setErr(result.error.message); return;} setMsg(result.data||"Role updated."); loadMembers(); } async function removeMember(memberId){ setMsg(""); setErr(""); const confirmed=confirm("Remove this member from the business?"); if(!confirmed)return; const result=await supabase.rpc("remove_business_member",{target_member_id:memberId}); if(result.error){setErr(result.error.message); return;} if(typeof result.data==="string"&&result.data.toLowerCase().includes("cannot")){setErr(result.data); return;} setMsg(result.data||"Member removed."); loadMembers(); } return <><Header title="Team" note="Manage roles and access for your business."/><section className="card form"><input placeholder="Friend's email" value={email} onChange={e=>setEmail(e.target.value)}/><button onClick={addMember}>Add member</button></section>{err&&<p className="error">{err}</p>}{msg&&<p className="success">{msg}</p>}<section className="card"><h2>Members</h2><table><thead><tr><th>Email</th><th>User ID</th><th>Role</th><th>Actions</th></tr></thead><tbody>{members.map(m=><tr key={m.member_id}><td>{m.email||"No email found"}</td><td>{m.user_id}</td><td><select value={m.role} onChange={e=>changeRole(m.member_id,e.target.value)} disabled={m.role==="owner"}><option value="owner">Owner</option><option value="admin">Admin</option><option value="staff">Staff</option><option value="viewer">Viewer</option></select></td><td>{m.role!=="owner"?<button className="danger" onClick={()=>removeMember(m.member_id)}>Remove</button>:"Protected"}</td></tr>)}</tbody></table></section><section className="card"><h2>Leave Business</h2><p>Leave this business and remove your access to all its sales, costs, products, and reports.</p><button className="danger" onClick={leaveBusiness}>Leave Business</button></section></>; }

function BusinessSettings({business,myRole,reload,writeActivity}){ const [name,setName]=useState(business.name||""),[currency,setCurrency]=useState(business.currency||"GBP"),[logoUrl,setLogoUrl]=useState(business.logo_url||""),[description,setDescription]=useState(business.description||""),[msg,setMsg]=useState(""),[err,setErr]=useState(""); const canEdit=myRole==="owner"; async function saveSettings(){ setMsg(""); setErr(""); if(!canEdit){setErr("Only the business owner can change settings."); return;} const result=await supabase.from("businesses").update({name,currency,logo_url:logoUrl,description}).eq("id",business.id); if(result.error){setErr(result.error.message);return;} await writeActivity("Updated settings","Business settings were changed"); setMsg("Settings saved."); reload(); } return <><Header title="Settings" note="Manage your business name, logo, currency, and description."/><section className="card form"><input disabled={!canEdit} placeholder="Business name" value={name} onChange={e=>setName(e.target.value)}/><select disabled={!canEdit} value={currency} onChange={e=>setCurrency(e.target.value)}><option value="GBP">GBP (£)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select><input disabled={!canEdit} placeholder="Logo URL" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)}/><input disabled={!canEdit} placeholder="Business description" value={description} onChange={e=>setDescription(e.target.value)}/><button disabled={!canEdit} onClick={saveSettings}>Save settings</button></section>{!canEdit&&<p className="error">Only the owner can edit business settings.</p>}{err&&<p className="error">{err}</p>}{msg&&<p className="success">{msg}</p>}{logoUrl&&<section className="card"><h2>Logo Preview</h2><img src={logoUrl} alt="Business logo" style={{maxWidth:160,borderRadius:12}}/></section>}</>; }
function Reports({orders,costs,products,stats,business}){ function exportCSV(){ const lines=["Type,Date,Name,Website/Platform,Qty/Category,Amount,Fees,Shipping"]; orders.forEach(o=>lines.push(`ORDER,${o.order_date},${o.product},${o.platform},${o.quantity},${o.sale_price},${o.fees},${o.shipping}`)); costs.forEach(c=>lines.push(`COST,${c.cost_date},${c.description},${c.website},${c.category},${c.amount},,`)); products.forEach(p=>lines.push(`PRODUCT,,${p.name},${p.supplier},${p.stock},${p.sell_price},${p.buy_price},`)); const blob=new Blob([lines.join("\n")],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="profitflow-report.csv"; a.click(); } return <><Header title="Reports" note="Export your records and review total profit."/><div className="grid"><Stat label="Revenue" value={money(stats.revenue,business.currency)}/><Stat label="Costs" value={money(stats.costTotal,business.currency)}/><Stat label="Fees + Shipping" value={money(stats.fees,business.currency)}/><Stat label="Profit" value={money(stats.profit,business.currency)}/></div><section className="card"><button onClick={exportCSV}><Download size={16}/>Export CSV</button></section></>; }

createRoot(document.getElementById("root")).render(<App/>);

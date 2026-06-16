import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabaseClient";
import {
  BarChart3,
  Boxes,
  Download,
  Home,
  Link as LinkIcon,
  LogOut,
  Moon,
  PlusCircle,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Trash2,
  TrendingUp,
  Users
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import "./styles.css";

function today(offset = 0){
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0,10);
}

function money(n, currency = "GBP"){
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return symbol + Number(n || 0).toFixed(2);
}

function initials(name = "ProfitFlow"){
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0,2)
    .map(w => w[0]?.toUpperCase())
    .join("") || "PF";
}

const canAddRole = role => ["owner","admin","staff"].includes(role);
const canDeleteRole = role => ["owner","admin"].includes(role);

function App(){
  const [session,setSession] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setSession(data.session);
      setLoading(false);
    });

    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>{
      setSession(session);
    });

    return ()=>subscription.unsubscribe();
  },[]);

  if(loading) return <main className="loading-screen"><p>Loading...</p></main>;
  if(!session) return <Auth />;
  return <DashboardApp user={session.user} />;
}

function Auth(){
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [msg,setMsg] = useState("");
  const [err,setErr] = useState("");

  async function signUp(){
    setErr("");
    setMsg("");

    const {error} = await supabase.auth.signUp({email,password});

    if(error) setErr(error.message);
    else setMsg("Account created. Check your email if Supabase asks you to confirm it.");
  }

  async function signIn(){
    setErr("");
    setMsg("");

    const {error} = await supabase.auth.signInWithPassword({email,password});

    if(error) setErr(error.message);
  }

  return (
    <section className="auth">
      <div className="brand-mark">PF</div>
      <h1>ProfitFlow Cloud</h1>
      <p>Login to your business dashboard.</p>

      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}

      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />

      <button onClick={signIn}>Log in</button>
      <button className="secondary" onClick={signUp}>Create account</button>
    </section>
  );
}

function DashboardApp({user}){
  const [page,setPage] = useState("dashboard");
  const [products,setProducts] = useState([]);
  const [orders,setOrders] = useState([]);
  const [costs,setCosts] = useState([]);
  const [activity,setActivity] = useState([]);
  const [business,setBusiness] = useState(null);
  const [myRole,setMyRole] = useState("");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [theme,setTheme] = useState(localStorage.getItem("profitflow-theme") || "light");
  const [toasts,setToasts] = useState([]);

  useEffect(()=>{
    document.body.dataset.theme = theme;
    localStorage.setItem("profitflow-theme", theme);
  },[theme]);

  function notify(message,type="success"){
    const id = crypto.randomUUID();
    setToasts(t=>[...t,{id,message,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  }

  async function writeActivity(action,details){
    if(!business?.id) return;

    await supabase.rpc("log_activity", {
      target_business_id: business.id,
      action_text: action,
      details_text: details
    });
  }

  async function loadData(){
    setLoading(true);
    setError("");

    const membership = await supabase
      .from("business_members")
      .select("business_id,role")
      .eq("user_id",user.id)
      .limit(1)
      .maybeSingle();

    if(membership.error){
      console.error("Membership error:", membership.error);
      setError("Could not load your business membership.");
      setLoading(false);
      return;
    }

    if(!membership.data?.business_id){
      setBusiness(null);
      setProducts([]);
      setOrders([]);
      setCosts([]);
      setActivity([]);
      setError("You are not part of a business yet. Create your own business to start using ProfitFlow.");
      setLoading(false);
      return;
    }

    setMyRole(membership.data.role);

    const businessResult = await supabase
      .from("businesses")
      .select("id,name,currency,logo_url,description")
      .eq("id",membership.data.business_id)
      .maybeSingle();

    if(businessResult.error){
      console.error("Business error:", businessResult.error);
      setError("Could not load your business.");
      setLoading(false);
      return;
    }

    if(!businessResult.data){
      setBusiness(null);
      setError("Business not found. Create a new business to continue.");
      setLoading(false);
      return;
    }

    const currentBusiness = businessResult.data;
    setBusiness(currentBusiness);

    const [p,o,c,a] = await Promise.all([
      supabase.from("products").select("*").eq("business_id",currentBusiness.id).order("created_at",{ascending:false}),
      supabase.from("orders").select("*").eq("business_id",currentBusiness.id).order("created_at",{ascending:false}),
      supabase.from("costs").select("*").eq("business_id",currentBusiness.id).order("created_at",{ascending:false}),
      supabase.from("activity_log").select("*").eq("business_id",currentBusiness.id).order("created_at",{ascending:false}).limit(10)
    ]);

    if(p.error) console.error("Products error:", p.error);
    if(o.error) console.error("Orders error:", o.error);
    if(c.error) console.error("Costs error:", c.error);
    if(a.error) console.error("Activity error:", a.error);

    setProducts(p.data || []);
    setOrders(o.data || []);
    setCosts(c.data || []);
    setActivity(a.data || []);
    setLoading(false);
  }

  useEffect(()=>{ loadData(); },[]);

  const stats = useMemo(()=>{
    const revenue = orders.reduce((s,o)=>s+Number(o.sale_price||0),0);
    const fees = orders.reduce((s,o)=>s+Number(o.fees||0)+Number(o.shipping||0),0);
    const costTotal = costs.reduce((s,c)=>s+Number(c.amount||0),0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate()-7);

    const weeklyRevenue = orders
      .filter(o=>new Date(o.order_date)>=weekAgo)
      .reduce((s,o)=>s+Number(o.sale_price||0),0);

    const weeklyFees = orders
      .filter(o=>new Date(o.order_date)>=weekAgo)
      .reduce((s,o)=>s+Number(o.fees||0)+Number(o.shipping||0),0);

    const weeklyCosts = costs
      .filter(c=>new Date(c.cost_date)>=weekAgo)
      .reduce((s,c)=>s+Number(c.amount||0),0);

    const inventoryValue = products.reduce((s,p)=>s+(Number(p.stock||0)*Number(p.buy_price||0)),0);
    const lowStock = products.filter(p=>Number(p.stock||0)>0 && Number(p.stock||0)<=3);
    const outOfStock = products.filter(p=>Number(p.stock||0)<=0);
    const averageOrder = orders.length ? revenue / orders.length : 0;
    const margin = revenue > 0 ? ((revenue-fees-costTotal)/revenue)*100 : 0;

    return {
      revenue,
      fees,
      costTotal,
      profit: revenue-fees-costTotal,
      weeklyProfit: weeklyRevenue-weeklyFees-weeklyCosts,
      inventoryValue,
      lowStock,
      outOfStock,
      totalOrders: orders.length,
      averageOrder,
      margin
    };
  },[orders,costs,products]);

  const chartData = useMemo(()=>{
    const map = {};

    for(const o of orders){
      map[o.order_date] ??= {date:o.order_date,revenue:0,costs:0,profit:0};
      map[o.order_date].revenue += Number(o.sale_price||0);
      map[o.order_date].profit += Number(o.sale_price||0)-Number(o.fees||0)-Number(o.shipping||0);
    }

    for(const c of costs){
      map[c.cost_date] ??= {date:c.cost_date,revenue:0,costs:0,profit:0};
      map[c.cost_date].costs += Number(c.amount||0);
      map[c.cost_date].profit -= Number(c.amount||0);
    }

    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
  },[orders,costs]);

  const platformData = useMemo(()=>Object.values(orders.reduce((m,o)=>{
    const key = o.platform || "Unknown";
    m[key] ??= {platform:key,revenue:0};
    m[key].revenue += Number(o.sale_price||0);
    return m;
  },{})),[orders]);

  async function signOut(){
    await supabase.auth.signOut();
  }

  return (
    <div className="app">
      <ToastStack toasts={toasts} />

      <aside>
        <div className="business-profile">
          {business?.logo_url ? (
            <img className="business-logo" src={business.logo_url} alt={business.name} />
          ) : (
            <div className="business-logo-fallback">{initials(business?.name || "ProfitFlow")}</div>
          )}

          <div>
            <h1>{business ? business.name : "ProfitFlow"}</h1>
            <p className="role-badge">{myRole || user.email}</p>
          </div>
        </div>

        <Nav page={page} setPage={setPage} id="dashboard" icon={<Home/>} label="Dashboard"/>
        <Nav page={page} setPage={setPage} id="orders" icon={<ShoppingCart/>} label="Sales / Orders"/>
        <Nav page={page} setPage={setPage} id="costs" icon={<Receipt/>} label="Costs"/>
        <Nav page={page} setPage={setPage} id="products" icon={<Boxes/>} label="Inventory"/>
        <Nav page={page} setPage={setPage} id="analytics" icon={<TrendingUp/>} label="Analytics"/>
        <Nav page={page} setPage={setPage} id="reports" icon={<BarChart3/>} label="Reports"/>
        <Nav page={page} setPage={setPage} id="team" icon={<Users/>} label="Team"/>
        <Nav page={page} setPage={setPage} id="settings" icon={<Settings/>} label="Settings"/>

        <button className="nav theme-toggle" onClick={()=>setTheme(theme==="dark" ? "light" : "dark")}>
          {theme==="dark" ? <Sun/> : <Moon/>}
          {theme==="dark" ? "Light mode" : "Dark mode"}
        </button>

        <button className="secondary signout" onClick={signOut}><LogOut size={16}/> Sign out</button>
      </aside>

      <main>
        {loading ? (
          <p>Loading your data...</p>
        ) : error ? (
          <CreateBusiness user={user} reload={loadData} message={error} />
        ) : (
          <>
            {page==="dashboard" && <HomePage stats={stats} chartData={chartData} platformData={platformData} products={products} activity={activity} business={business}/>}
            {page==="orders" && <Orders user={user} business={business} myRole={myRole} orders={orders} products={products} reload={loadData} writeActivity={writeActivity} notify={notify}/>}
            {page==="costs" && <Costs user={user} business={business} myRole={myRole} costs={costs} reload={loadData} writeActivity={writeActivity} notify={notify}/>}
            {page==="products" && <Products user={user} business={business} myRole={myRole} products={products} reload={loadData} writeActivity={writeActivity} notify={notify}/>}
            {page==="analytics" && <Analytics products={products} orders={orders} costs={costs} stats={stats} business={business}/>}
            {page==="reports" && <Reports orders={orders} costs={costs} products={products} stats={stats} business={business} notify={notify}/>}
            {page==="team" && <Team business={business} notify={notify}/>}
            {page==="settings" && <BusinessSettings business={business} myRole={myRole} reload={loadData} writeActivity={writeActivity} notify={notify}/>}
          </>
        )}
      </main>
    </div>
  );
}

function ToastStack({toasts}){
  return (
    <div className="toast-stack">
      {toasts.map(t=>(
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function CreateBusiness({user,reload,message}){
  const [name,setName] = useState("");
  const [err,setErr] = useState("");

  async function createBusiness(){
    setErr("");

    if(!name.trim()){
      setErr("Enter a business name.");
      return;
    }

    const result = await supabase.rpc("create_business_for_current_user", {
      business_name:name.trim()
    });

    if(result.error){
      setErr(result.error.message);
      return;
    }

    setName("");
    reload();
  }

  return (
    <section className="card">
      <h2>Create your own business</h2>
      <p>{message || "You are not currently part of a business."}</p>
      {err && <p className="error">{err}</p>}

      <div className="form">
        <input placeholder="Business name" value={name} onChange={e=>setName(e.target.value)}/>
        <button onClick={createBusiness}>Create business</button>
      </div>
    </section>
  );
}

function Nav({page,setPage,id,icon,label}){
  return (
    <button className={page===id?"nav active":"nav"} onClick={()=>setPage(id)}>
      {icon}
      {label}
    </button>
  );
}

function Header({title,note}){
  return (
    <header>
      <h1>{title}</h1>
      <p>{note}</p>
    </header>
  );
}

function Stat({label,value,icon,trend}){
  return (
    <section className="stat">
      <div className="stat-top">
        <span>{label}</span>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
      <strong>{value}</strong>
      {trend && <small>{trend}</small>}
    </section>
  );
}

function HomePage({stats,chartData,platformData,products,activity,business}){
  return (
    <>
      <Header title="Dashboard" note="Live sales, costs, inventory, alerts, and team activity."/>

      <div className="grid">
        <Stat label="Revenue" value={money(stats.revenue,business.currency)} trend="All-time sales"/>
        <Stat label="Total Profit" value={money(stats.profit,business.currency)} trend={`${stats.margin.toFixed(1)}% margin`}/>
        <Stat label="Weekly Profit" value={money(stats.weeklyProfit,business.currency)} trend="Last 7 days"/>
        <Stat label="Inventory Value" value={money(stats.inventoryValue,business.currency)} trend={`${products.length} products`}/>
      </div>

      <div className="grid">
        <Stat label="Total Orders" value={stats.totalOrders}/>
        <Stat label="Average Order" value={money(stats.averageOrder,business.currency)}/>
        <Stat label="Low Stock" value={stats.lowStock.length}/>
        <Stat label="Out of Stock" value={stats.outOfStock.length}/>
      </div>

      {(stats.lowStock.length>0 || stats.outOfStock.length>0) && (
        <section className="card alert-card">
          <h2>Stock Alerts</h2>
          {stats.outOfStock.length>0 && <p><b>Out of stock:</b> {stats.outOfStock.map(p=>p.name).join(", ")}</p>}
          {stats.lowStock.length>0 && <p><b>Low stock:</b> {stats.lowStock.map(p=>`${p.name} (${p.stock})`).join(", ")}</p>}
        </section>
      )}

      <section className="card">
        <h2>Profit over time</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip formatter={v=>money(v,business.currency)}/>
            <Line type="monotone" dataKey="profit" strokeWidth={3}/>
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="card">
        <h2>Sales by platform</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={platformData}>
            <XAxis dataKey="platform"/>
            <YAxis/>
            <Tooltip formatter={v=>money(v,business.currency)}/>
            <Bar dataKey="revenue"/>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <ActivityFeed activity={activity}/>
    </>
  );
}

function ActivityFeed({activity}){
  return (
    <section className="card">
      <h2>Recent Activity</h2>
      {activity.length === 0 ? (
        <p>No recent activity yet.</p>
      ) : (
        <div className="activity-feed">
          {activity.map(a=>(
            <div className="activity-item" key={a.id}>
              <div className="activity-dot"/>
              <div>
                <strong>{a.action}</strong>
                <p>{a.details}</p>
                <small>{new Date(a.created_at).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Orders({user,business,myRole,orders,products,reload,writeActivity,notify}){
  const [editing,setEditing] = useState(null);
  const [f,setF] = useState({order_date:today(),product:"",platform:"",quantity:1,sale_price:"",fees:"",shipping:""});
  const canAdd = canAddRole(myRole);
  const canDelete = canDeleteRole(myRole);
  const canEdit = canAddRole(myRole);

  function startEdit(row){
    setEditing(row.id);
    setF({
      order_date:row.order_date || today(),
      product:row.product || "",
      platform:row.platform || "",
      quantity:row.quantity || 1,
      sale_price:row.sale_price || "",
      fees:row.fees || "",
      shipping:row.shipping || ""
    });
  }

  function resetForm(){
    setEditing(null);
    setF({order_date:today(),product:"",platform:"",quantity:1,sale_price:"",fees:"",shipping:""});
  }

  async function save(){
    if(!business || !canAdd) return;

    const qtySold = Number(f.quantity || 1);
    const selectedProduct = products.find(p=>p.name===f.product);

    if(!editing && selectedProduct && qtySold > Number(selectedProduct.stock || 0)){
      notify("Not enough stock available.","error");
      return;
    }

    if(editing){
      const result = await supabase.from("orders").update(f).eq("id",editing);

      if(result.error){
        notify(result.error.message,"error");
        return;
      }

      await writeActivity("Updated order",`${f.product || "Order"} was edited`);
      notify("Order updated.");
    } else {
      const orderResult = await supabase.from("orders").insert({
        ...f,
        user_id:user.id,
        business_id:business.id
      });

      if(orderResult.error){
        notify(orderResult.error.message,"error");
        return;
      }

      if(selectedProduct){
        const newStock = Number(selectedProduct.stock || 0) - qtySold;
        const stockResult = await supabase.from("products").update({stock:newStock}).eq("id",selectedProduct.id);

        if(stockResult.error) notify("Order saved, but stock could not update.","error");
      }

      await writeActivity("Added sale",`${f.product || "Product"} sold x${qtySold}`);
      notify("Sale added and stock updated.");
    }

    resetForm();
    reload();
  }

  async function del(id){
    if(!canDelete) return;

    await supabase.from("orders").delete().eq("id",id);
    await writeActivity("Deleted order",`Order ${id} was deleted`);
    notify("Order deleted.");
    reload();
  }

  return (
    <>
      <Header title="Sales / Orders" note={canAdd ? "Add and edit sales. New sales automatically reduce stock." : "Read-only access."}/>

      {canAdd && (
        <section className="card form">
          <input type="date" value={f.order_date} onChange={e=>setF({...f,order_date:e.target.value})}/>
          <select value={f.product} onChange={e=>setF({...f,product:e.target.value})}>
            <option value="">Product</option>
            {products.map(p=><option key={p.id} value={p.name}>{p.name} — Stock: {p.stock}</option>)}
          </select>
          <input placeholder="Platform" value={f.platform} onChange={e=>setF({...f,platform:e.target.value})}/>
          <input type="number" placeholder="Qty" value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/>
          <input type="number" placeholder="Sale price" value={f.sale_price} onChange={e=>setF({...f,sale_price:e.target.value})}/>
          <input type="number" placeholder="Fees" value={f.fees} onChange={e=>setF({...f,fees:e.target.value})}/>
          <input type="number" placeholder="Shipping" value={f.shipping} onChange={e=>setF({...f,shipping:e.target.value})}/>
          <button onClick={save}><PlusCircle size={16}/>{editing ? "Save order" : "Add sale"}</button>
          {editing && <button className="secondary" onClick={resetForm}>Cancel edit</button>}
        </section>
      )}

      <EditableTable rows={orders} cols={["order_date","product","platform","quantity","sale_price","fees","shipping"]} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/>
    </>
  );
}

function Costs({user,business,myRole,costs,reload,writeActivity,notify}){
  const [editing,setEditing] = useState(null);
  const [f,setF] = useState({cost_date:today(),website:"",category:"",description:"",amount:""});
  const canAdd = canAddRole(myRole);
  const canDelete = canDeleteRole(myRole);
  const canEdit = canAddRole(myRole);

  function startEdit(row){
    setEditing(row.id);
    setF({
      cost_date:row.cost_date || today(),
      website:row.website || "",
      category:row.category || "",
      description:row.description || "",
      amount:row.amount || ""
    });
  }

  function resetForm(){
    setEditing(null);
    setF({cost_date:today(),website:"",category:"",description:"",amount:""});
  }

  async function save(){
    if(!business || !canAdd) return;

    const costData = {
      ...f,
      amount: f.amount === "" ? 0 : Number(f.amount)
    };

    if(editing){
      const result = await supabase.from("costs").update(costData).eq("id",editing);

      if(result.error){
        notify(result.error.message,"error");
        return;
      }

      await writeActivity("Updated cost",`${f.description || f.category || "Cost"} was edited`);
      notify("Cost updated.");
    } else {
      const result = await supabase.from("costs").insert({
        ...costData,
        user_id:user.id,
        business_id:business.id
      });

      if(result.error){
        notify(result.error.message,"error");
        return;
      }

      await writeActivity("Added cost",`${f.description || f.category || "Cost"}: ${money(f.amount,business.currency)}`);
      notify("Cost added.");
    }

    resetForm();
    reload();
  }

  async function del(id){
    if(!canDelete) return;

    await supabase.from("costs").delete().eq("id",id);
    await writeActivity("Deleted cost",`Cost ${id} was deleted`);
    notify("Cost deleted.");
    reload();
  }

  return (
    <>
      <Header title="Costs" note={canAdd ? "Track purchases, stock, postage, packaging, ads, and website costs." : "Read-only access."}/>

      {canAdd && (
        <section className="card form">
          <input type="date" value={f.cost_date} onChange={e=>setF({...f,cost_date:e.target.value})}/>
          <input placeholder="Website" value={f.website} onChange={e=>setF({...f,website:e.target.value})}/>
          <input placeholder="Category" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/>
          <input placeholder="Description" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
          <input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
          <button onClick={save}><PlusCircle size={16}/>{editing ? "Save cost" : "Add cost"}</button>
          {editing && <button className="secondary" onClick={resetForm}>Cancel edit</button>}
        </section>
      )}

      <EditableTable rows={costs} cols={["cost_date","website","category","description","amount"]} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/>
    </>
  );
}

function Products({user,business,myRole,products,reload,writeActivity,notify}){
  const [editing,setEditing] = useState(null);
  const [imageFile,setImageFile] = useState(null);
  const [search,setSearch] = useState("");
  const [f,setF] = useState({name:"",sku:"",stock:"",buy_price:"",sell_price:"",supplier:"",image_url:""});
  const canAdd = canAddRole(myRole);
  const canDelete = canDeleteRole(myRole);
  const canEdit = canAddRole(myRole);

  const filteredProducts = useMemo(()=>{
    const q = search.toLowerCase();
    return products.filter(p =>
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.sku || "").toLowerCase().includes(q) ||
      String(p.supplier || "").toLowerCase().includes(q)
    );
  },[products,search]);

  function startEdit(row){
    setEditing(row.id);
    setImageFile(null);
    setF({
      name:row.name || "",
      sku:row.sku || "",
      stock:row.stock || "",
      buy_price:row.buy_price || "",
      sell_price:row.sell_price || "",
      supplier:row.supplier || "",
      image_url:row.image_url || ""
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

    const uploadResult = await supabase.storage.from("product-images").upload(filePath,imageFile);

    if(uploadResult.error){
      notify(uploadResult.error.message,"error");
      return f.image_url;
    }

    const publicUrlResult = supabase.storage.from("product-images").getPublicUrl(filePath);
    return publicUrlResult.data.publicUrl;
  }

  async function save(){
    if(!business || !canAdd) return;

    const finalImageUrl = await uploadImage();

    const productData = {
      ...f,
      stock: f.stock === "" ? 0 : Number(f.stock),
      buy_price: f.buy_price === "" ? 0 : Number(f.buy_price),
      sell_price: f.sell_price === "" ? 0 : Number(f.sell_price),
      image_url: finalImageUrl
    };

    if(editing){
      const result = await supabase.from("products").update(productData).eq("id",editing);

      if(result.error){
        notify(result.error.message,"error");
        return;
      }

      await writeActivity("Updated product",`${f.name || "Product"} was edited`);
      notify("Product updated.");
    } else {
      const result = await supabase.from("products").insert({
        ...productData,
        user_id:user.id,
        business_id:business.id
      });

      if(result.error){
        notify(result.error.message,"error");
        return;
      }

      await writeActivity("Added product",`${f.name || "Product"} added to inventory`);
      notify("Product added.");
    }

    resetForm();
    reload();
  }

  async function del(id){
    if(!canDelete) return;

    await supabase.from("products").delete().eq("id",id);
    await writeActivity("Deleted product",`Product ${id} was deleted`);
    notify("Product deleted.");
    reload();
  }

  return (
    <>
      <Header title="Inventory" note={canAdd ? "Add products, stock, upload photos, suppliers, prices, and profit margins." : "Read-only access."}/>

      {canAdd && (
        <section className="card form">
          <input placeholder="Product name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
          <input placeholder="SKU" value={f.sku} onChange={e=>setF({...f,sku:e.target.value})}/>
          <input type="number" placeholder="Stock" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}/>
          <input type="number" placeholder="Buy price" value={f.buy_price} onChange={e=>setF({...f,buy_price:e.target.value})}/>
          <input type="number" placeholder="Sell price" value={f.sell_price} onChange={e=>setF({...f,sell_price:e.target.value})}/>
          <input placeholder="Supplier" value={f.supplier} onChange={e=>setF({...f,supplier:e.target.value})}/>
          <input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files?.[0] || null)}/>

          {f.image_url && !imageFile && <p>Current image saved.</p>}
          {imageFile && <p>Selected image: {imageFile.name}</p>}

          <button onClick={save}><PlusCircle size={16}/>{editing ? "Save product" : "Add product"}</button>
          {editing && <button className="secondary" onClick={resetForm}>Cancel edit</button>}
        </section>
      )}

      <section className="table-toolbar">
        <div className="searchbox">
          <Search size={16}/>
          <input placeholder="Search products, SKU, supplier..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </section>

      <ProductTable products={filteredProducts} currency={business.currency} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/>
    </>
  );
}

function ProductTable({products,currency,onEdit,onDelete}){
  return (
    <section className="card table-card">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Stock</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Profit</th>
            <th>Margin</th>
            <th>Supplier</th>
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {products.map(p=>{
            const profit = Number(p.sell_price||0)-Number(p.buy_price||0);
            const margin = Number(p.sell_price||0)>0 ? ((profit/Number(p.sell_price))*100).toFixed(1) : "0.0";
            const stock = Number(p.stock||0);

            return (
              <tr key={p.id}>
                <td>{p.image_url ? <img className="thumb" src={p.image_url} alt={p.name}/> : <span className="empty-thumb">—</span>}</td>
                <td><strong>{p.name}</strong></td>
                <td>{p.sku}</td>
                <td>
                  <span className={stock<=0 ? "stock out" : stock<=3 ? "stock low" : "stock ok"}>
                    {stock<=0 ? "Out" : stock<=3 ? `Low: ${stock}` : stock}
                  </span>
                </td>
                <td>{money(p.buy_price,currency)}</td>
                <td>{money(p.sell_price,currency)}</td>
                <td>{money(profit,currency)}</td>
                <td>{margin}%</td>
                <td>{p.supplier}</td>
                {(onEdit || onDelete) && (
                  <td className="actions">
                    {onEdit && <button className="secondary" onClick={()=>onEdit(p)}>Edit</button>}
                    {onDelete && <button className="danger" onClick={()=>onDelete(p.id)}><Trash2 size={14}/>Delete</button>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function EditableTable({rows,cols,onEdit,onDelete}){
  return (
    <section className="card table-card">
      <table>
        <thead>
          <tr>
            {cols.map(c=><th key={c}>{c}</th>)}
            {(onEdit || onDelete) && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              {cols.map(c=><td key={c}>{String(r[c] ?? "")}</td>)}
              {(onEdit || onDelete) && (
                <td className="actions">
                  {onEdit && <button className="secondary" onClick={()=>onEdit(r)}>Edit</button>}
                  {onDelete && <button className="danger" onClick={()=>onDelete(r.id)}><Trash2 size={14}/>Delete</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Analytics({products,orders,costs,stats,business}){
  const bestProducts = useMemo(()=>{
    const map = {};

    for(const order of orders){
      const key = order.product || "Unknown";
      map[key] ??= {name:key,quantity:0,revenue:0};
      map[key].quantity += Number(order.quantity || 0);
      map[key].revenue += Number(order.sale_price || 0);
    }

    return Object.values(map).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
  },[orders]);

  const topProfitProducts = useMemo(()=>{
    return [...products]
      .map(p=>({
        ...p,
        unitProfit:Number(p.sell_price||0)-Number(p.buy_price||0)
      }))
      .sort((a,b)=>b.unitProfit-a.unitProfit)
      .slice(0,5);
  },[products]);

  return (
    <>
      <Header title="Analytics" note="See best-selling products, profit margins, and business performance."/>

      <div className="grid">
        <Stat label="Net Profit" value={money(stats.profit,business.currency)}/>
        <Stat label="Profit Margin" value={`${stats.margin.toFixed(1)}%`}/>
        <Stat label="Average Order" value={money(stats.averageOrder,business.currency)}/>
        <Stat label="Inventory Value" value={money(stats.inventoryValue,business.currency)}/>
      </div>

      <section className="card">
        <h2>Best-selling products</h2>
        {bestProducts.length === 0 ? <p>No sales yet.</p> : (
          <table>
            <thead><tr><th>Product</th><th>Qty sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {bestProducts.map(p=>(
                <tr key={p.name}><td>{p.name}</td><td>{p.quantity}</td><td>{money(p.revenue,business.currency)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Highest unit profit</h2>
        {topProfitProducts.length === 0 ? <p>No products yet.</p> : (
          <table>
            <thead><tr><th>Product</th><th>Buy</th><th>Sell</th><th>Unit profit</th></tr></thead>
            <tbody>
              {topProfitProducts.map(p=>(
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{money(p.buy_price,business.currency)}</td>
                  <td>{money(p.sell_price,business.currency)}</td>
                  <td>{money(p.unitProfit,business.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function Team({business,notify}){
  const [email,setEmail] = useState("");
  const [members,setMembers] = useState([]);
  const [msg,setMsg] = useState("");
  const [err,setErr] = useState("");

  async function leaveBusiness(){
    const confirmed = confirm("Are you sure you want to leave this business? You will lose access unless someone adds you again.");
    if(!confirmed) return;

    const result = await supabase.rpc("leave_current_business", {
      target_business_id:business.id
    });

    if(result.error){
      setErr(result.error.message);
      return;
    }

    alert(result.data);
    window.location.reload();
  }

  async function loadMembers(){
    if(!business) return;

    setErr("");

    const result = await supabase.rpc("get_business_members", {
      target_business_id:business.id
    });

    if(result.error){
      console.error("Members error:", result.error);
      setErr("Could not load team members.");
      return;
    }

    setMembers(result.data || []);
  }

  useEffect(()=>{ loadMembers(); },[business?.id]);

  async function addMember(){
    setMsg("");
    setErr("");

    if(!email.trim()){
      setErr("Enter your friend's email address.");
      return;
    }

    const result = await supabase.rpc("add_business_member_by_email", {
      target_email:email.trim(),
      target_business_id:business.id
    });

    if(result.error){
      setErr(result.error.message);
      return;
    }

    if(typeof result.data === "string" && result.data.toLowerCase().includes("not found")){
      setErr(result.data);
      return;
    }

    setMsg(result.data || "Member added successfully.");
    notify?.("Member added.");
    setEmail("");
    loadMembers();
  }

  async function changeRole(memberId,newRole){
    setMsg("");
    setErr("");

    const result = await supabase.rpc("update_business_member_role", {
      target_member_id:memberId,
      new_role:newRole
    });

    if(result.error){
      setErr(result.error.message);
      return;
    }

    setMsg(result.data || "Role updated.");
    notify?.("Role updated.");
    loadMembers();
  }

  async function removeMember(memberId){
    setMsg("");
    setErr("");

    const confirmed = confirm("Remove this member from the business?");
    if(!confirmed) return;

    const result = await supabase.rpc("remove_business_member", {
      target_member_id:memberId
    });

    if(result.error){
      setErr(result.error.message);
      return;
    }

    if(typeof result.data === "string" && result.data.toLowerCase().includes("cannot")){
      setErr(result.data);
      return;
    }

    setMsg(result.data || "Member removed.");
    notify?.("Member removed.");
    loadMembers();
  }

  return (
    <>
      <Header title="Team" note="Manage roles and access for your business."/>

      <section className="card form">
        <input placeholder="Friend's email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <button onClick={addMember}>Add member</button>
      </section>

      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}

      <section className="card">
        <h2>Members</h2>

        <table>
          <thead>
            <tr><th>Email</th><th>User ID</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {members.map(m=>(
              <tr key={m.member_id}>
                <td>{m.email || "No email found"}</td>
                <td>{m.user_id}</td>
                <td>
                  <select value={m.role} onChange={e=>changeRole(m.member_id,e.target.value)} disabled={m.role==="owner"}>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td>
                  {m.role !== "owner" ? <button className="danger" onClick={()=>removeMember(m.member_id)}>Remove</button> : "Protected"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Leave Business</h2>
        <p>Leave this business and remove your access to all its sales, costs, products, and reports.</p>
        <button className="danger" onClick={leaveBusiness}>Leave Business</button>
      </section>
    </>
  );
}

function BusinessSettings({business,myRole,reload,writeActivity,notify}){
  const [name,setName] = useState(business.name || "");
  const [currency,setCurrency] = useState(business.currency || "GBP");
  const [logoUrl,setLogoUrl] = useState(business.logo_url || "");
  const [logoFile,setLogoFile] = useState(null);
  const [description,setDescription] = useState(business.description || "");
  const [msg,setMsg] = useState("");
  const [err,setErr] = useState("");
  const [shareLink,setShareLink] = useState("");

  const canEdit = myRole === "owner";

  useEffect(()=>{
    setShareLink(window.location.origin);
  },[]);

  async function uploadLogo(){
    if(!logoFile) return logoUrl;

    const safeName = logoFile.name.replace(/[^a-zA-Z0-9.-]/g,"_");
    const filePath = `${business.id}/${Date.now()}-${safeName}`;

    const uploadResult = await supabase.storage
      .from("business-logos")
      .upload(filePath,logoFile);

    if(uploadResult.error){
      setErr(uploadResult.error.message);
      notify?.(uploadResult.error.message,"error");
      return logoUrl;
    }

    const publicUrlResult = supabase.storage.from("business-logos").getPublicUrl(filePath);
    return publicUrlResult.data.publicUrl;
  }

  async function saveSettings(){
    setMsg("");
    setErr("");

    if(!canEdit){
      setErr("Only the business owner can change settings.");
      return;
    }

    const finalLogoUrl = await uploadLogo();

    const result = await supabase
      .from("businesses")
      .update({
        name,
        currency,
        logo_url:finalLogoUrl,
        description
      })
      .eq("id",business.id);

    if(result.error){
      setErr(result.error.message);
      notify?.(result.error.message,"error");
      return;
    }

    await writeActivity("Updated settings","Business settings were changed");
    setLogoUrl(finalLogoUrl);
    setLogoFile(null);
    setMsg("Settings saved.");
    notify?.("Settings saved.");
    reload();
  }

  async function copyShareLink(){
    await navigator.clipboard.writeText(shareLink);
    notify?.("App link copied.");
  }

  return (
    <>
      <Header title="Settings" note="Manage your business name, logo, currency, description, and share link."/>

      <section className="card form">
        <input disabled={!canEdit} placeholder="Business name" value={name} onChange={e=>setName(e.target.value)}/>

        <select disabled={!canEdit} value={currency} onChange={e=>setCurrency(e.target.value)}>
          <option value="GBP">GBP (£)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
        </select>

        <input disabled={!canEdit} type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0] || null)}/>

        <input disabled={!canEdit} placeholder="Business description" value={description} onChange={e=>setDescription(e.target.value)}/>

        <button disabled={!canEdit} onClick={saveSettings}>Save settings</button>
      </section>

      {logoFile && <p className="success">Selected logo: {logoFile.name}</p>}
      {!canEdit && <p className="error">Only the owner can edit business settings.</p>}
      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}

      <section className="card">
        <h2>Accessible App Link</h2>
        <p>Use this link to open your app directly. For a nicer searchable address, connect a custom domain in Vercel.</p>
        <div className="share-link">
          <LinkIcon size={16}/>
          <input readOnly value={shareLink}/>
          <button onClick={copyShareLink}>Copy link</button>
        </div>
      </section>

      {logoUrl && (
        <section className="card">
          <h2>Logo Preview</h2>
          <img className="logo-preview" src={logoUrl} alt="Business logo"/>
        </section>
      )}
    </>
  );
}

function Reports({orders,costs,products,stats,business,notify}){
  function exportCSV(){
    const lines = ["Type,Date,Name,Website/Platform,Qty/Category,Amount,Fees,Shipping"];

    orders.forEach(o=>lines.push(`ORDER,${o.order_date},${o.product},${o.platform},${o.quantity},${o.sale_price},${o.fees},${o.shipping}`));
    costs.forEach(c=>lines.push(`COST,${c.cost_date},${c.description},${c.website},${c.category},${c.amount},,`));
    products.forEach(p=>lines.push(`PRODUCT,,${p.name},${p.supplier},${p.stock},${p.sell_price},${p.buy_price},`));

    const blob = new Blob([lines.join("\n")],{type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "profitflow-report.csv";
    a.click();

    notify?.("CSV exported.");
  }

  return (
    <>
      <Header title="Reports" note="Export your records and review total profit."/>

      <div className="grid">
        <Stat label="Revenue" value={money(stats.revenue,business.currency)}/>
        <Stat label="Costs" value={money(stats.costTotal,business.currency)}/>
        <Stat label="Fees + Shipping" value={money(stats.fees,business.currency)}/>
        <Stat label="Profit" value={money(stats.profit,business.currency)}/>
      </div>

      <section className="card">
        <button onClick={exportCSV}><Download size={16}/>Export CSV</button>
      </section>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App/>);

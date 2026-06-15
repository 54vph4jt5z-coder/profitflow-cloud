import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabaseClient";
import { BarChart3, Boxes, Home, PlusCircle, Receipt, ShoppingCart, Trash2, Download, LogOut, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import "./styles.css";

function today(offset=0){
  const d = new Date();
  d.setDate(d.getDate()+offset);
  return d.toISOString().slice(0,10);
}

function money(n){
  return "£" + Number(n || 0).toFixed(2);
}

function App(){
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);

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

  if(loading) return <main><p>Loading...</p></main>;
  if(!session) return <Auth />;
  return <DashboardApp user={session.user} />;
}

function Auth(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [msg,setMsg]=useState("");
  const [err,setErr]=useState("");

  async function signUp(){
    setErr("");
    setMsg("");

    const {error}=await supabase.auth.signUp({email,password});

    if(error) setErr(error.message);
    else setMsg("Account created. Check your email if Supabase asks you to confirm it.");
  }

  async function signIn(){
    setErr("");
    setMsg("");

    const {error}=await supabase.auth.signInWithPassword({email,password});

    if(error) setErr(error.message);
  }

  return (
    <section className="auth">
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
  const [page,setPage]=useState("dashboard");
  const [products,setProducts]=useState([]);
  const [orders,setOrders]=useState([]);
  const [costs,setCosts]=useState([]);
  const [business,setBusiness]=useState(null);
  const [myRole,setMyRole]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  async function loadData(){
    setLoading(true);
    setError("");

    const membership = await supabase
      .from("business_members")
      .select("business_id,role")
      .eq("user_id", user.id)
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
      setError("You are not part of a business yet. Create your own business to start using ProfitFlow.");
      setLoading(false);
      return;
    }

    setMyRole(membership.data.role);

    const businessResult = await supabase
      .from("businesses")
      .select("id,name")
      .eq("id", membership.data.business_id)
      .maybeSingle();

    if(businessResult.error){
      console.error("Business error:", businessResult.error);
      setError("Could not load your business.");
      setLoading(false);
      return;
    }

    const currentBusiness = businessResult.data;

    if(!currentBusiness){
      setBusiness(null);
      setError("Business not found. Create a new business to continue.");
      setLoading(false);
      return;
    }

    setBusiness(currentBusiness);

    const [p,o,c] = await Promise.all([
      supabase.from("products").select("*").eq("business_id", currentBusiness.id).order("created_at",{ascending:false}),
      supabase.from("orders").select("*").eq("business_id", currentBusiness.id).order("created_at",{ascending:false}),
      supabase.from("costs").select("*").eq("business_id", currentBusiness.id).order("created_at",{ascending:false})
    ]);

    if(p.error) console.error("Products error:", p.error);
    if(o.error) console.error("Orders error:", o.error);
    if(c.error) console.error("Costs error:", c.error);

    setProducts(p.data || []);
    setOrders(o.data || []);
    setCosts(c.data || []);
    setLoading(false);
  }

  useEffect(()=>{
    loadData();
  },[]);

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

    return {
      revenue,
      fees,
      costTotal,
      profit: revenue - fees - costTotal,
      weeklyProfit: weeklyRevenue - weeklyFees - weeklyCosts
    };
  },[orders,costs]);

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

  const platformData = useMemo(()=>{
    const map={};

    for(const o of orders){
      const key=o.platform||"Unknown";
      map[key] ??= {platform:key,revenue:0};
      map[key].revenue += Number(o.sale_price||0);
    }

    return Object.values(map);
  },[orders]);

  async function signOut(){
    await supabase.auth.signOut();
  }

  return (
    <div className="app">
      <aside>
        <h1>ProfitFlow</h1>
        <p>{business ? business.name : user.email}</p>
        {business && <p>Role: {myRole || "loading..."}</p>}

        <Nav page={page} setPage={setPage} id="dashboard" icon={<Home/>} label="Dashboard"/>
        <Nav page={page} setPage={setPage} id="orders" icon={<ShoppingCart/>} label="Sales / Orders"/>
        <Nav page={page} setPage={setPage} id="costs" icon={<Receipt/>} label="Costs"/>
        <Nav page={page} setPage={setPage} id="products" icon={<Boxes/>} label="Inventory"/>
        <Nav page={page} setPage={setPage} id="reports" icon={<BarChart3/>} label="Reports"/>
        <Nav page={page} setPage={setPage} id="team" icon={<Users/>} label="Team"/>

        <button className="secondary" onClick={signOut}><LogOut size={16}/> Sign out</button>
      </aside>

      <main>
        {loading ? (
          <p>Loading your data...</p>
        ) : error ? (
          <CreateBusiness user={user} reload={loadData} message={error} />
        ) : (
          <>
            {page==="dashboard" && <HomePage stats={stats} chartData={chartData} platformData={platformData} products={products}/>}
            {page==="orders" && <Orders user={user} business={business} myRole={myRole} orders={orders} products={products} reload={loadData}/>}
            {page==="costs" && <Costs user={user} business={business} myRole={myRole} costs={costs} reload={loadData}/>}
            {page==="products" && <Products user={user} business={business} myRole={myRole} products={products} reload={loadData}/>}
            {page==="reports" && <Reports orders={orders} costs={costs} stats={stats}/>}
            {page==="team" && <Team business={business}/>}
          </>
        )}
      </main>
    </div>
  );
}

function CreateBusiness({user,reload,message}){
  const [name,setName]=useState("");
  const [err,setErr]=useState("");

async function createBusiness(){
  setErr("");

  if(!name.trim()){
    setErr("Enter a business name.");
    return;
  }

  const result = await supabase.rpc(
    "create_business_for_current_user",
    {
      business_name: name.trim()
    }
  );

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
        <input
          placeholder="Business name"
          value={name}
          onChange={e=>setName(e.target.value)}
        />
        <button onClick={createBusiness}>Create business</button>
      </div>
    </section>
  );
}

function Nav({page,setPage,id,icon,label}){
  return <button className={page===id?"nav active":"nav"} onClick={()=>setPage(id)}>{icon}{label}</button>;
}

function Header({title,note}){
  return <header><h1>{title}</h1><p>{note}</p></header>;
}

function Stat({label,value}){
  return <section className="stat"><span>{label}</span><strong>{value}</strong></section>;
}

function HomePage({stats,chartData,platformData,products}){
  const lowStock=products.filter(p=>Number(p.stock)<=3);

  return (
    <>
      <Header title="Dashboard" note="Live sales, costs, inventory, and weekly profit."/>

      <div className="grid">
        <Stat label="Revenue" value={money(stats.revenue)}/>
        <Stat label="Costs" value={money(stats.costTotal)}/>
        <Stat label="Fees + Shipping" value={money(stats.fees)}/>
        <Stat label="Weekly Profit" value={money(stats.weeklyProfit)}/>
      </div>

      <section className="card">
        <h2>Profit over time</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip formatter={v=>money(v)}/>
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
            <Tooltip formatter={v=>money(v)}/>
            <Bar dataKey="revenue"/>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {lowStock.length>0 && (
        <section className="card">
          <b>Low stock:</b> {lowStock.map(p=>p.name).join(", ")}
        </section>
      )}
    </>
  );
}

function Orders({user,business,myRole,orders,products,reload}){
  const [f,setF]=useState({
    order_date:today(),
    product:"",
    platform:"",
    quantity:1,
    sale_price:"",
    fees:"",
    shipping:""
  });

  const canEdit = myRole !== "viewer";

  async function add(){
    if(!business || !canEdit) return;

    await supabase.from("orders").insert({
      ...f,
      user_id:user.id,
      business_id:business.id
    });

    setF({
      order_date:today(),
      product:"",
      platform:"",
      quantity:1,
      sale_price:"",
      fees:"",
      shipping:""
    });

    reload();
  }

  async function del(id){
    if(!canEdit) return;
    await supabase.from("orders").delete().eq("id",id);
    reload();
  }

  return (
    <>
      <Header title="Sales / Orders" note={canEdit ? "Add each sale, including fees and shipping." : "Read-only access. You can view orders but cannot add or delete them."}/>

      {canEdit && (
        <section className="card form">
          <input type="date" value={f.order_date} onChange={e=>setF({...f,order_date:e.target.value})}/>
          <select value={f.product} onChange={e=>setF({...f,product:e.target.value})}>
            <option value="">Product</option>
            {products.map(p=><option key={p.id}>{p.name}</option>)}
          </select>
          <input placeholder="Platform" value={f.platform} onChange={e=>setF({...f,platform:e.target.value})}/>
          <input type="number" placeholder="Qty" value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/>
          <input type="number" placeholder="Sale price" value={f.sale_price} onChange={e=>setF({...f,sale_price:e.target.value})}/>
          <input type="number" placeholder="Fees" value={f.fees} onChange={e=>setF({...f,fees:e.target.value})}/>
          <input type="number" placeholder="Shipping" value={f.shipping} onChange={e=>setF({...f,shipping:e.target.value})}/>
          <button onClick={add}><PlusCircle size={16}/>Add sale</button>
        </section>
      )}

      <Table rows={orders} cols={["order_date","product","platform","quantity","sale_price","fees","shipping"]} del={canEdit ? del : null}/>
    </>
  );
}

function Costs({user,business,myRole,costs,reload}){
  const [f,setF]=useState({
    cost_date:today(),
    website:"",
    category:"",
    description:"",
    amount:""
  });

  const canEdit = myRole !== "viewer";

  async function add(){
    if(!business || !canEdit) return;

    await supabase.from("costs").insert({
      ...f,
      user_id:user.id,
      business_id:business.id
    });

    setF({
      cost_date:today(),
      website:"",
      category:"",
      description:"",
      amount:""
    });

    reload();
  }

  async function del(id){
    if(!canEdit) return;
    await supabase.from("costs").delete().eq("id",id);
    reload();
  }

  return (
    <>
      <Header title="Costs" note={canEdit ? "Track purchases, stock, postage, packaging, ads, and website costs." : "Read-only access. You can view costs but cannot add or delete them."}/>

      {canEdit && (
        <section className="card form">
          <input type="date" value={f.cost_date} onChange={e=>setF({...f,cost_date:e.target.value})}/>
          <input placeholder="Website" value={f.website} onChange={e=>setF({...f,website:e.target.value})}/>
          <input placeholder="Category" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/>
          <input placeholder="Description" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
          <input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
          <button onClick={add}><PlusCircle size={16}/>Add cost</button>
        </section>
      )}

      <Table rows={costs} cols={["cost_date","website","category","description","amount"]} del={canEdit ? del : null}/>
    </>
  );
}

function Products({user,business,myRole,products,reload}){
  const [f,setF]=useState({
    name:"",
    sku:"",
    stock:"",
    buy_price:"",
    sell_price:"",
    supplier:""
  });

  const canEdit = myRole !== "viewer";

  async function add(){
    if(!business || !canEdit) return;

    await supabase.from("products").insert({
      ...f,
      user_id:user.id,
      business_id:business.id
    });

    setF({
      name:"",
      sku:"",
      stock:"",
      buy_price:"",
      sell_price:"",
      supplier:""
    });

    reload();
  }

  async function del(id){
    if(!canEdit) return;
    await supabase.from("products").delete().eq("id",id);
    reload();
  }

  return (
    <>
      <Header title="Inventory" note={canEdit ? "Add products, stock, suppliers, and prices." : "Read-only access. You can view inventory but cannot add or delete products."}/>

      {canEdit && (
        <section className="card form">
          <input placeholder="Product name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
          <input placeholder="SKU" value={f.sku} onChange={e=>setF({...f,sku:e.target.value})}/>
          <input type="number" placeholder="Stock" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}/>
          <input type="number" placeholder="Buy price" value={f.buy_price} onChange={e=>setF({...f,buy_price:e.target.value})}/>
          <input type="number" placeholder="Sell price" value={f.sell_price} onChange={e=>setF({...f,sell_price:e.target.value})}/>
          <input placeholder="Supplier" value={f.supplier} onChange={e=>setF({...f,supplier:e.target.value})}/>
          <button onClick={add}><PlusCircle size={16}/>Add product</button>
        </section>
      )}

      <Table rows={products} cols={["name","sku","stock","buy_price","sell_price","supplier"]} del={canEdit ? del : null}/>
    </>
  );
}

function Team({business}){
  const [email,setEmail]=useState("");
  const [members,setMembers]=useState([]);
  const [msg,setMsg]=useState("");
  const [err,setErr]=useState("");

  <button className="danger" onClick={leaveBusiness}>
  Leave business
</button>

  async function leaveBusiness(){
  const confirmed = confirm("Are you sure you want to leave this business? You will lose access unless someone adds you again.");
  if(!confirmed) return;

  const result = await supabase.rpc("leave_current_business", {
    target_business_id: business.id
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
      target_business_id: business.id
    });

    if(result.error){
      console.error("Members error:", result.error);
      setErr("Could not load team members.");
      return;
    }

    setMembers(result.data || []);
  }

  useEffect(()=>{
    loadMembers();
  },[business?.id]);

  async function addMember(){
    setMsg("");
    setErr("");

    if(!email.trim()){
      setErr("Enter your friend's email address.");
      return;
    }

    const result = await supabase.rpc("add_business_member_by_email", {
      target_email: email.trim(),
      target_business_id: business.id
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
    setEmail("");
    loadMembers();
  }

<section className="card">
  <h2>Leave business</h2>
  <p>You can leave this business at any time. If you leave, you will lose access to its sales, costs, products, and reports.</p>
  <button className="danger" onClick={leaveBusiness}>
    Leave business
  </button>
</section>
  
  async function changeRole(memberId,newRole){
    setMsg("");
    setErr("");

    const result = await supabase.rpc("update_business_member_role", {
      target_member_id: memberId,
      new_role: newRole
    });

    if(result.error){
      setErr(result.error.message);
      return;
    }

    setMsg(result.data || "Role updated.");
    loadMembers();
  }

  async function removeMember(memberId){
    setMsg("");
    setErr("");

    const confirmed = confirm("Remove this member from the business?");
    if(!confirmed) return;

    const result = await supabase.rpc("remove_business_member", {
      target_member_id: memberId
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
    loadMembers();
  }

  return (
    <>
      <Header title="Team" note="Manage roles and access for your business." />

      <section className="card form">
        <input
          placeholder="Friend's email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <button onClick={addMember}>Add member</button>
      </section>

      {err && <p className="error">{err}</p>}
      {msg && <p className="success">{msg}</p>}

      <section className="card">
        <h2>Members</h2>

        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>User ID</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {members.map(m=>(
              <tr key={m.member_id}>
                <td>{m.email || "No email found"}</td>
                <td>{m.user_id}</td>
                <td>
                  <select
                    value={m.role}
                    onChange={e=>changeRole(m.member_id,e.target.value)}
                    disabled={m.role === "owner"}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td>
                  {m.role !== "owner" ? (
                    <button className="danger" onClick={()=>removeMember(m.member_id)}>
                      Remove
                    </button>
                  ) : (
                    "Protected"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Reports({orders,costs,stats}){
  function exportCSV(){
    const lines=["Type,Date,Name,Website/Platform,Qty/Category,Amount,Fees,Shipping"];

    orders.forEach(o=>{
      lines.push(`ORDER,${o.order_date},${o.product},${o.platform},${o.quantity},${o.sale_price},${o.fees},${o.shipping}`);
    });

    costs.forEach(c=>{
      lines.push(`COST,${c.cost_date},${c.description},${c.website},${c.category},${c.amount},,`);
    });

    const blob=new Blob([lines.join("\n")],{type:"text/csv"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="profitflow-cloud-report.csv";
    a.click();
  }

  return (
    <>
      <Header title="Reports" note="Export your records and review total profit."/>

      <div className="grid">
        <Stat label="Revenue" value={money(stats.revenue)}/>
        <Stat label="Costs" value={money(stats.costTotal)}/>
        <Stat label="Fees + Shipping" value={money(stats.fees)}/>
        <Stat label="Profit" value={money(stats.profit)}/>
      </div>

      <section className="card">
        <button onClick={exportCSV}><Download size={16}/>Export CSV</button>
      </section>
    </>
  );
}

function Table({rows,cols,del}){
  return (
    <section className="card">
      <table>
        <thead>
          <tr>
            {cols.map(c=><th key={c}>{c}</th>)}
            {del && <th>Action</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              {cols.map(c=><td key={c}>{String(r[c] ?? "")}</td>)}
              {del && (
                <td>
                  <button className="danger" onClick={()=>del(r.id)}>
                    <Trash2 size={14}/>Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App/>);

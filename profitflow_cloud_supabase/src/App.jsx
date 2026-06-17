import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabaseClient";
import {
  BarChart3, Boxes, Clipboard, Download, Home, Link as LinkIcon, LogOut,
  Minus, Moon, Plus, PlusCircle, Receipt, Search, Settings, ShoppingCart,
  Sun, Trash2, TrendingUp, Users, Crown, Sparkles, FileText, PackageSearch, Store, Barcode, BrainCircuit, FileSignature, Mail, PlugZap, Truck, Building2, Smartphone, Camera, CreditCard, ShieldCheck, Wand2, Bell, CalendarClock, DatabaseBackup, CheckCircle2, XCircle, Banknote, WalletCards, Upload, ExternalLink, AlertCircle, Lock, Bot, BadgeCheck, AlertTriangle, ArrowRight, RefreshCcw, Eye, EyeOff} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import "./styles.css";

const BRAND = "ProfitsPilot";
const OWNER_EMAIL = "bakerjubahji@outlook.com";

function today(offset = 0){ const d = new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); }
function money(n, currency = "GBP"){ const s = currency==="USD" ? "$" : currency==="EUR" ? "€" : "£"; return s + Number(n||0).toFixed(2); }
function initials(name = "ProfitsPilot"){ return String(name).split(" ").filter(Boolean).slice(0,2).map(w=>w[0]?.toUpperCase()).join("") || "PP"; }
function titleCase(v=""){ return String(v).charAt(0).toUpperCase() + String(v).slice(1).toLowerCase(); }
function makeToastId(){ return window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()) + Math.random(); }
const canAddRole = role => ["owner","admin","staff"].includes(role);
const canDeleteRole = role => ["owner","admin"].includes(role);
const canManageTeamRole = role => ["owner","admin"].includes(role);

const PLAN_LIMITS = {
  free: { label:"Free", maxProducts:25, maxMembers:3, analytics:false, pdf:false, customers:false, store:false, integrations:false, ai:false },
  pro: { label:"Pro", maxProducts:500, maxMembers:10, analytics:true, pdf:true, customers:true, store:true, integrations:true, ai:false },
  business: { label:"Business", maxProducts:99999, maxMembers:99999, analytics:true, pdf:true, customers:true, store:true, integrations:true, ai:true }
};

function App(){
  const [session,setSession] = useState(null);
  const [loading,setLoading] = useState(true);
  const [showLanding,setShowLanding] = useState(true);
  const [storeSlug,setStoreSlug] = useState("");

  useEffect(()=>{
    document.title = BRAND;
    const parts = window.location.pathname.split("/").filter(Boolean);
    if(parts[0] === "store" && parts[1]) setStoreSlug(parts[1]);

    supabase.auth.getSession().then(({data})=>{ setSession(data.session); setLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session)=>setSession(session));
    return ()=>subscription.unsubscribe();
  },[]);

  if(storeSlug) return <PublicStore slug={storeSlug}/>;
  if(loading) return <main className="loading-screen"><p>Loading {BRAND}...</p></main>;
  if(!session) return showLanding ? <LandingPage onLogin={()=>setShowLanding(false)}/> : <Auth onBack={()=>setShowLanding(true)}/>;
  return <DashboardApp user={session.user}/>;
}

function LandingPage({onLogin}){
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand-row"><b className="wordmark">ProfitsPilot</b></div>
        <button onClick={onLogin}>Login / Start free</button>
      </nav>

      <section className="hero">
        <div>
          <span className="pill">Built for resellers and small teams</span>
          <h1>Track profit, stock, costs, customers, and team activity in one place.</h1>
          <p>ProfitsPilot gives your business a proper dashboard with inventory automation, reports, analytics, team roles, and upgrade-ready paid plans.</p>
          <div className="hero-actions">
            <button onClick={onLogin}>Start free</button>
            <a href="#pricing">View pricing</a>
          </div>
        </div>
        <div className="hero-card">
          <h3>Today</h3>
          <div className="mini-stat"><span>Revenue</span><b>£1,240.00</b></div>
          <div className="mini-stat"><span>Profit</span><b>£392.50</b></div>
          <div className="mini-stat"><span>Low Stock</span><b>3 items</b></div>
        </div>
      </section>

      <section className="landing-grid">
        <Feature icon={<Boxes/>} title="Inventory automation" text="Stock reduces automatically when you add a sale."/>
        <Feature icon={<Users/>} title="Team roles" text="Owner, Admin, Staff, and Viewer permissions."/>
        <Feature icon={<TrendingUp/>} title="Analytics" text="Best sellers, margins, revenue, and profit insights."/>
        <Feature icon={<FileText/>} title="Reports" text="Export CSV and print monthly PDF reports."/>
      </section>

      <section id="pricing" className="pricing-section">
        <h2>Pricing</h2>
        <PricingCards publicMode/>
      </section>
    </div>
  );
}

function Feature({icon,title,text}){ return <div className="feature">{icon}<h3>{title}</h3><p>{text}</p></div>; }

function Auth({onBack}){
  const [mode,setMode] = useState("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [msg,setMsg] = useState("");
  const [err,setErr] = useState("");

  async function signUp(){
    setErr(""); setMsg("");
    if(!email.trim() || password.length < 6){
      setErr("Enter an email and a password with at least 6 characters.");
      return;
    }
    const {error} = await supabase.auth.signUp({email:email.trim(),password});
    if(error) setErr(error.message);
    else setMsg("Account created. Check your email if confirmation is required.");
  }

  async function signIn(){
    setErr(""); setMsg("");
    const {error} = await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error) setErr(error.message);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <button className="auth-back" onClick={onBack}>← Back To Website</button>
        <div className="auth-copy">
          <span className="eyebrow">ProfitsPilot Workspace</span>
          <h1>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h1>
          <p>{mode === "login" ? "Sign in to manage your business dashboard." : "Start your business workspace with inventory, sales, analytics, and reports."}</p>
        </div>

        <div className="auth-tabs">
          <button className={mode==="login" ? "active" : ""} onClick={()=>{setMode("login");setErr("");setMsg("");}}>Sign In</button>
          <button className={mode==="signup" ? "active" : ""} onClick={()=>{setMode("signup");setErr("");setMsg("");}}>Create Account</button>
        </div>

        {err && <p className="error">{err}</p>}
        {msg && <p className="success">{msg}</p>}

        <div className="auth-form">
          <label>Email Address</label>
          <input placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />

          <label>Password</label>
          <div className="password-field">
            <input placeholder="Your password" type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="button" className="icon-button" onClick={()=>setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
          </div>

          {mode === "login" ? (
            <button className="wide-button" onClick={signIn}>Sign In</button>
          ) : (
            <button className="wide-button" onClick={signUp}>Create Account</button>
          )}
        </div>

        <p className="auth-small">{mode === "login" ? "New to ProfitsPilot?" : "Already have an account?"} <button onClick={()=>setMode(mode==="login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
      </section>

      <section className="auth-showcase">
        <div className="showcase-card">
          <h2>Built For Modern Resellers</h2>
          <p>Track sales, inventory levels, customers, expenses, and performance from one polished dashboard.</p>
          <div className="showcase-grid">
            <div><b>Live Profit</b><span>See margins clearly</span></div>
            <div><b>Team Roles</b><span>Control access</span></div>
            <div><b>Reports</b><span>Export clean data</span></div>
            <div><b>AI Coach</b><span>Business plan feature</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function encodeInvoiceData(invoice){
  try{
    return btoa(unescape(encodeURIComponent(JSON.stringify(invoice))));
  }catch{
    return "";
  }
}

function decodeInvoiceData(raw){
  try{
    return JSON.parse(decodeURIComponent(escape(atob(raw))));
  }catch{
    return null;
  }
}

function monthKey(date){
  return String(date || "").slice(0,7);
}

function generateForecast(orders){
  const monthly = {};
  for(const o of orders){
    const key = monthKey(o.order_date);
    if(!key) continue;
    monthly[key] = (monthly[key] || 0) + Number(o.sale_price || 0);
  }
  const values = Object.values(monthly);
  if(values.length === 0) return {average:0,nextMonth:0,trend:"No sales data yet."};
  const average = values.reduce((a,b)=>a+b,0) / values.length;
  const last = values[values.length-1] || 0;
  const previous = values[values.length-2] || last;
  const change = last - previous;
  return {
    average,
    nextMonth: Math.max(0, last + change),
    trend: change >= 0 ? "Sales are trending up." : "Sales are trending down."
  };
}


function generateAdvancedForecast(orders,costs){
  const months = {};
  for(const o of orders){
    const key = monthKey(o.order_date);
    if(!key) continue;
    months[key] ??= {month:key,revenue:0,costs:0,profit:0,orders:0};
    months[key].revenue += Number(o.sale_price||0);
    months[key].profit += Number(o.sale_price||0)-Number(o.fees||0)-Number(o.shipping||0);
    months[key].orders += 1;
  }
  for(const c of costs){
    const key = monthKey(c.cost_date);
    if(!key) continue;
    months[key] ??= {month:key,revenue:0,costs:0,profit:0,orders:0};
    months[key].costs += Number(c.amount||0);
    months[key].profit -= Number(c.amount||0);
  }
  const rows = Object.values(months).sort((a,b)=>a.month.localeCompare(b.month));
  if(rows.length === 0) return {nextRevenue:0,nextProfit:0,confidence:"Low",summary:"Add sales and costs to generate a forecast."};
  const last3 = rows.slice(-3);
  const avgRevenue = last3.reduce((s,r)=>s+r.revenue,0)/last3.length;
  const avgProfit = last3.reduce((s,r)=>s+r.profit,0)/last3.length;
  const last = rows[rows.length-1], prev = rows[rows.length-2] || last;
  const nextRevenue = Math.max(0, avgRevenue + (last.revenue-prev.revenue)*0.35);
  const nextProfit = avgProfit + (last.profit-prev.profit)*0.35;
  return {nextRevenue,nextProfit,confidence:rows.length>=3?"Medium":"Low",summary:last.revenue>=prev.revenue?"Revenue is trending upward.":"Revenue is slowing down."};
}

function DashboardApp({user}){
  const [page,setPage] = useState("dashboard");
  const [products,setProducts] = useState([]);
  const [orders,setOrders] = useState([]);
  const [costs,setCosts] = useState([]);
  const [customers,setCustomers] = useState([]);
  const [suppliers,setSuppliers] = useState([]);
  const [invoices,setInvoices] = useState([]);
  const [paymentRequests,setPaymentRequests] = useState([]);
  const [paymentSettings,setPaymentSettings] = useState(null);
  const [integrationConnections,setIntegrationConnections] = useState([]);
  const [recurringExpenses,setRecurringExpenses] = useState([]);
  const [stockMovements,setStockMovements] = useState([]);
  const [backups,setBackups] = useState([]);
  const [activity,setActivity] = useState([]);
  const [business,setBusiness] = useState(null);
  const [myRole,setMyRole] = useState("");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [theme,setTheme] = useState(localStorage.getItem("profitspilot-theme") || "light");
  const [toasts,setToasts] = useState([]);

  const isFounder = String(user.email || "").toLowerCase() === OWNER_EMAIL;
  const planKey = isFounder ? "business" : (business?.plan || "free");
  const plan = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

  useEffect(()=>{ document.body.dataset.theme = theme; localStorage.setItem("profitspilot-theme", theme); },[theme]);
  function notify(message,type="success"){ const id=makeToastId(); setToasts(t=>[...t,{id,message,type}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500); }

  async function writeActivity(action,details){
    if(!business?.id) return;
    await supabase.rpc("log_activity", { target_business_id:business.id, action_text:action, details_text:details });
  }

  async function acceptInviteFromUrl(){
    const url = new URL(window.location.href);
    const inviteToken = url.searchParams.get("invite");
    if(!inviteToken) return;
    const result = await supabase.rpc("accept_business_invite", { invite_token:inviteToken });
    if(result.error) notify(result.error.message,"error"); else notify(result.data || "Invite accepted.");
    url.searchParams.delete("invite");
    window.history.replaceState({}, "", url.toString());
  }

  async function loadData(){
    setLoading(true); setError("");
    await acceptInviteFromUrl();

    const membership = await supabase.from("business_members").select("business_id,role").eq("user_id",user.id).limit(1).maybeSingle();
    if(membership.error){ setError("Could not load your business membership."); setLoading(false); return; }
    if(!membership.data?.business_id){
      setBusiness(null); setProducts([]); setOrders([]); setCosts([]); setCustomers([]); setActivity([]);
      setError("You are not part of a business yet. Create your own business to start using ProfitsPilot.");
      setLoading(false); return;
    }

    setMyRole(membership.data.role);

    const b = await supabase.from("businesses").select("id,name,currency,logo_url,description,plan,slug").eq("id",membership.data.business_id).maybeSingle();
    if(b.error){ setError("Could not load your business."); setLoading(false); return; }
    if(!b.data){ setBusiness(null); setError("Business not found. Create a new business to continue."); setLoading(false); return; }

    setBusiness(b.data);
    const [p,o,c,cu,sup,inv,pr,payset,conn,recur,move,bak,a] = await Promise.all([
      supabase.from("products").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("orders").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("costs").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("customers").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("suppliers").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("invoices").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("payment_requests").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("payment_settings").select("*").eq("business_id",b.data.id).maybeSingle(),
      supabase.from("integration_connections").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("recurring_expenses").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}),
      supabase.from("stock_movements").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}).limit(40),
      supabase.from("backups").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}).limit(10),
      supabase.from("activity_log").select("*").eq("business_id",b.data.id).order("created_at",{ascending:false}).limit(12)
    ]);

    if(p.error) console.error(p.error); if(o.error) console.error(o.error); if(c.error) console.error(c.error); if(cu.error) console.error(cu.error); if(sup.error) console.error(sup.error); if(inv.error) console.error(inv.error); if(pr.error) console.error(pr.error); if(payset.error) console.error(payset.error); if(conn.error) console.error(conn.error); if(recur.error) console.error(recur.error); if(move.error) console.error(move.error); if(bak.error) console.error(bak.error); if(a.error) console.error(a.error);
    setProducts(p.data||[]); setOrders(o.data||[]); setCosts(c.data||[]); setCustomers(cu.data||[]); setSuppliers(sup.data||[]); setInvoices(inv.data||[]); setPaymentRequests(pr.data||[]); setPaymentSettings(payset.data||null); setIntegrationConnections(conn.data||[]); setRecurringExpenses(recur.data||[]); setStockMovements(move.data||[]); setBackups(bak.data||[]); setActivity(a.data||[]);
    setLoading(false);
  }

  useEffect(()=>{ loadData(); },[]);

  const stats = useMemo(()=>{
    const revenue = orders.reduce((s,o)=>s+Number(o.sale_price||0),0);
    const fees = orders.reduce((s,o)=>s+Number(o.fees||0)+Number(o.shipping||0),0);
    const costTotal = costs.reduce((s,c)=>s+Number(c.amount||0),0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
    const weeklyRevenue = orders.filter(o=>new Date(o.order_date)>=weekAgo).reduce((s,o)=>s+Number(o.sale_price||0),0);
    const weeklyFees = orders.filter(o=>new Date(o.order_date)>=weekAgo).reduce((s,o)=>s+Number(o.fees||0)+Number(o.shipping||0),0);
    const weeklyCosts = costs.filter(c=>new Date(c.cost_date)>=weekAgo).reduce((s,c)=>s+Number(c.amount||0),0);
    const inventoryValue = products.reduce((s,p)=>s+(Number(p.stock||0)*Number(p.buy_price||0)),0);
    const lowStock = products.filter(p=>Number(p.stock||0)>0 && Number(p.stock||0)<=3);
    const outOfStock = products.filter(p=>Number(p.stock||0)<=0);
    const averageOrder = orders.length ? revenue/orders.length : 0;
    const margin = revenue > 0 ? ((revenue-fees-costTotal)/revenue)*100 : 0;
    return {revenue,fees,costTotal,profit:revenue-fees-costTotal,weeklyProfit:weeklyRevenue-weeklyFees-weeklyCosts,inventoryValue,lowStock,outOfStock,totalOrders:orders.length,averageOrder,margin};
  },[orders,costs,products]);

  const chartData = useMemo(()=>{
    const map={};
    for(const o of orders){ map[o.order_date]??={date:o.order_date,revenue:0,costs:0,profit:0}; map[o.order_date].revenue+=Number(o.sale_price||0); map[o.order_date].profit+=Number(o.sale_price||0)-Number(o.fees||0)-Number(o.shipping||0); }
    for(const c of costs){ map[c.cost_date]??={date:c.cost_date,revenue:0,costs:0,profit:0}; map[c.cost_date].costs+=Number(c.amount||0); map[c.cost_date].profit-=Number(c.amount||0); }
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date));
  },[orders,costs]);

  const platformData = useMemo(()=>Object.values(orders.reduce((m,o)=>{ const k=o.platform||"Unknown"; m[k]??={platform:k,revenue:0}; m[k].revenue+=Number(o.sale_price||0); return m; },{})),[orders]);
  async function signOut(){ await supabase.auth.signOut(); }

  return (
    <div className="app">
      <ToastStack toasts={toasts}/>
      <aside>
        <div className="business-profile">
          {business?.logo_url ? <img className="business-logo" src={business.logo_url} alt={business.name}/> : <div className="business-logo-fallback">{initials(business?.name || "ProfitsPilot")}</div>}
          <div><h1>{business ? business.name : "ProfitsPilot"}</h1><p className="role-badge">Role: {myRole ? titleCase(myRole) : user.email}</p><small className="plan-badge">{isFounder ? "Founder Access" : plan.label}</small></div>
        </div>
        <Nav page={page} setPage={setPage} id="dashboard" icon={<Home/>} label="Dashboard"/>
        <Nav page={page} setPage={setPage} id="orders" icon={<ShoppingCart/>} label="Sales / Orders"/>
        <Nav page={page} setPage={setPage} id="costs" icon={<Receipt/>} label="Costs"/>
        <Nav page={page} setPage={setPage} id="recurring" icon={<CalendarClock/>} label="Recurring"/>
        <Nav page={page} setPage={setPage} id="products" icon={<Boxes/>} label="Inventory"/>
        <Nav page={page} setPage={setPage} id="customers" icon={<Users/>} label="Customers"/>
        <Nav page={page} setPage={setPage} id="suppliers" icon={<Truck/>} label="Suppliers"/>
        <Nav page={page} setPage={setPage} id="invoices" icon={<FileSignature/>} label="Invoices"/>
        <Nav page={page} setPage={setPage} id="analytics" icon={<TrendingUp/>} label="Analytics"/>
        <Nav page={page} setPage={setPage} id="reports" icon={<BarChart3/>} label="Reports"/>
        <Nav page={page} setPage={setPage} id="catalogue" icon={<Store/>} label="Catalogue"/>
        <Nav page={page} setPage={setPage} id="integrations" icon={<PlugZap/>} label="Integrations"/>
<Nav page={page} setPage={setPage} id="billing" icon={<Crown/>} label="Billing"/>
        {isFounder && <Nav page={page} setPage={setPage} id="adminPayments" icon={<WalletCards/>} label="Admin Payments"/>}
        <Nav page={page} setPage={setPage} id="team" icon={<Users/>} label="Team"/>
        <Nav page={page} setPage={setPage} id="settings" icon={<Settings/>} label="Settings"/>
        <button className="nav theme-toggle" onClick={()=>setTheme(theme==="dark" ? "light" : "dark")}>{theme==="dark" ? <Sun/> : <Moon/>}{theme==="dark" ? "Light mode" : "Dark mode"}</button>
        <button className="secondary signout" onClick={signOut}><LogOut size={16}/> Sign out</button>
      </aside>

      <MobileNav page={page} setPage={setPage}/>

      <main>
        {loading ? <p>Loading your data...</p> : error ? <CreateBusiness user={user} reload={loadData} message={error}/> : <>
          {page==="dashboard" && <HomePage stats={stats} chartData={chartData} platformData={platformData} products={products} activity={activity} business={business} plan={plan} orders={orders} costs={costs}/>}
          {page==="orders" && <Orders user={user} business={business} myRole={myRole} orders={orders} products={products} customers={customers} reload={loadData} writeActivity={writeActivity} notify={notify} plan={plan}/>}
          {page==="costs" && <Costs user={user} business={business} myRole={myRole} costs={costs} reload={loadData} writeActivity={writeActivity} notify={notify}/>}
          {page==="recurring" && <RecurringExpenses user={user} business={business} myRole={myRole} recurringExpenses={recurringExpenses} reload={loadData} writeActivity={writeActivity} notify={notify}/>} 
          {page==="products" && <Products user={user} business={business} myRole={myRole} products={products} reload={loadData} writeActivity={writeActivity} notify={notify} plan={plan}/>}
          {page==="customers" && <Customers user={user} business={business} myRole={myRole} customers={customers} orders={orders} reload={loadData} writeActivity={writeActivity} notify={notify} plan={plan}/>}
          {page==="suppliers" && <Suppliers user={user} business={business} myRole={myRole} suppliers={suppliers} reload={loadData} writeActivity={writeActivity} notify={notify}/>} 
          {page==="invoices" && <Invoices user={user} business={business} myRole={myRole} invoices={invoices} orders={orders} customers={customers} products={products} reload={loadData} writeActivity={writeActivity} notify={notify} plan={plan} setPage={setPage}/>} 
          {page==="analytics" && <Analytics products={products} orders={orders} costs={costs} stats={stats} business={business} plan={plan} setPage={setPage}/>}
          {page==="reports" && <Reports orders={orders} costs={costs} products={products} stats={stats} business={business} notify={notify} plan={plan} setPage={setPage}/>}
          {page==="catalogue" && <Catalogue business={business} products={products} plan={plan} setPage={setPage} notify={notify}/>}
          {page==="integrations" && <Integrations business={business} products={products} orders={orders} integrationConnections={integrationConnections} reload={loadData} notify={notify} plan={plan} setPage={setPage}/>} 
{page==="billing" && <Billing business={business} myRole={myRole} notify={notify} isFounder={isFounder} paymentRequests={paymentRequests} paymentSettings={paymentSettings} reload={loadData}/>} 
          {page==="adminPayments" && isFounder && <AdminPayments business={business} paymentRequests={paymentRequests} paymentSettings={paymentSettings} reload={loadData} notify={notify}/>} 
          {page==="team" && <Team business={business} myRole={myRole} notify={notify}/>}
          {page==="settings" && <BusinessSettings business={business} myRole={myRole} reload={loadData} writeActivity={writeActivity} notify={notify}/>}
        </>}
      </main>
    </div>
  );
}

function MobileNav({page,setPage}){ const items=[["dashboard",<Home/>,"Home"],["orders",<ShoppingCart/>,"Sales"],["products",<Boxes/>,"Stock"],["analytics",<TrendingUp/>,"Stats"],["billing",<Crown/>,"Pro"]]; return <nav className="mobile-nav">{items.map(([id,icon,label])=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}>{icon}<span>{label}</span></button>)}</nav>; }
function ToastStack({toasts}){ return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}</div>; }
function Nav({page,setPage,id,icon,label}){ return <button className={page===id?"nav active":"nav"} onClick={()=>setPage(id)}>{icon}{label}</button>; }
function Header({title,note}){ return <header><h1>{title}</h1><p>{note}</p></header>; }
function Stat({label,value,trend}){ return <section className="stat"><div className="stat-top"><span>{label}</span><TrendingUp size={18}/></div><strong>{value}</strong>{trend&&<small>{trend}</small>}</section>; }

function CreateBusiness({user,reload,message}){ const [name,setName]=useState(""),[err,setErr]=useState(""); async function createBusiness(){ setErr(""); if(!name.trim()){setErr("Enter a business name.");return;} const result=await supabase.rpc("create_business_for_current_user",{business_name:name.trim()}); if(result.error){setErr(result.error.message);return;} setName(""); reload(); } return <section className="card"><h2>Create your own business</h2><p>{message||"You are not currently part of a business."}</p>{err&&<p className="error">{err}</p>}<div className="form"><input placeholder="Business name" value={name} onChange={e=>setName(e.target.value)}/><button onClick={createBusiness}>Create business</button></div></section>; }

function HomePage({stats,chartData,platformData,products,activity,business,plan,orders,costs}){
  const alerts = [
    ...stats.outOfStock.map(p=>({type:"Unavailable",name:p.name,detail:"This item needs to be replenished before it can be sold."})),
    ...stats.lowStock.map(p=>({type:"Running Low",name:p.name,detail:`Only ${p.stock} remaining.`}))
  ].slice(0,6);

  return (
    <>
      <section className="executive-hero">
        <div>
          <p className="eyebrow">Business Command Centre</p>
          <h1>{business?.name || "ProfitsPilot"} Dashboard</h1>
          <p>A clean overview of revenue, profit, inventory levels, orders, customers, and growth.</p>
        </div>
        <div className="executive-actions">
          <span><BadgeCheck size={16}/> Secure Workspace</span>
          <span><Zap size={16}/> Live Insights</span>
        </div>
      </section>

      <div className="grid kpi-grid">
        <Stat label="Revenue" value={money(stats.revenue,business.currency)} trend="All-time sales"/>
        <Stat label="Net Profit" value={money(stats.profit,business.currency)} trend={`${stats.margin.toFixed(1)}% margin`}/>
        <Stat label="Weekly Profit" value={money(stats.weeklyProfit,business.currency)} trend="Last 7 days"/>
        <Stat label="Inventory Value" value={money(stats.inventoryValue,business.currency)} trend={`${products.length}/${plan.maxProducts===99999?"∞":plan.maxProducts} products`}/>
      </div>

      <section className="professional-alerts card">
        <div className="section-head">
          <div>
            <h2>Inventory Monitor</h2>
            <p>Clear warnings for items that need attention.</p>
          </div>
          <span className={alerts.length ? "risk-pill warning" : "risk-pill safe"}>{alerts.length ? `${alerts.length} alert${alerts.length>1?"s":""}` : "All clear"}</span>
        </div>
        {alerts.length ? (
          <div className="alert-grid">
            {alerts.map((a,i)=>(
              <div className="alert-tile" key={i}>
                <AlertTriangle size={18}/>
                <div><b>{a.name}</b><span>{a.type}</span><p>{a.detail}</p></div>
              </div>
            ))}
          </div>
        ) : <p className="muted">No urgent inventory issues right now.</p>}
      </section>

      <div className="dashboard-split">
        <section className="card">
          <div className="section-head"><h2>Profit Trend</h2><span className="mini-label">Live</span></div>
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
          <div className="section-head"><h2>Sales Channels</h2><span className="mini-label">Platforms</span></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={platformData}>
              <XAxis dataKey="platform"/>
              <YAxis/>
              <Tooltip formatter={v=>money(v,business.currency)}/>
              <Bar dataKey="revenue"/>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <SmartInsights stats={stats} orders={orders || []} costs={costs || []} business={business} plan={plan}/>
      <ActivityFeed activity={activity}/>
    </>
  );
}

function SmartInsights({stats,orders,costs,business,plan}){
  const forecast = typeof generateAdvancedForecast === "function" ? generateAdvancedForecast(orders,costs) : generateForecast(orders);
  const locked = !plan?.ai;
  const tips = [];
  if(stats.profit < 0) tips.push("Your profit is currently negative. Review product pricing, shipping costs, and selling fees.");
  if(stats.margin > 0 && stats.margin < 20) tips.push("Your margin is under 20%. Increase prices slightly or source products at a lower cost.");
  if(stats.lowStock.length > 0) tips.push(`${stats.lowStock.length} item(s) are close to running out. Replenish the best sellers first.`);
  if(stats.outOfStock.length > 0) tips.push(`${stats.outOfStock.length} item(s) are unavailable. Replenish them or hide them from your catalogue.`);
  if(stats.totalOrders === 0) tips.push("Add your first order to unlock more accurate business coaching.");
  if(tips.length === 0) tips.push("Your business looks stable. Keep adding data for more detailed recommendations.");

  return (
    <section className={locked ? "card ai-card ai-blur-wrap" : "card ai-card"}>
      <div className="section-head">
        <div><h2><Bot size={18}/> AI Business Coach</h2><p>Personalised advice based on sales, inventory levels, profit, and costs.</p></div>
        <span className={locked ? "locked-pill" : "risk-pill safe"}>{locked ? <><Lock size={14}/> Business Plan</> : "Active"}</span>
      </div>

      <div className={locked ? "ai-blurred" : ""}>
        <ul>{tips.map((tip,i)=><li key={i}>{tip}</li>)}</ul>
        <div className="forecast-grid">
          <div><span>Forecast Revenue</span><b>{money(forecast.nextRevenue ?? forecast.nextMonth ?? 0,business?.currency)}</b></div>
          <div><span>Forecast Profit</span><b>{money(forecast.nextProfit ?? 0,business?.currency)}</b></div>
          <div><span>Confidence</span><b>{forecast.confidence || "Learning"}</b></div>
        </div>
        <p>{forecast.summary || forecast.trend}</p>
      </div>

      {locked && (
        <div className="ai-overlay">
          <Bot size={28}/>
          <h3>Unlock AI Business Coach</h3>
          <p>Available on the Business plan.</p>
        </div>
      )}
    </section>
  );
}

function ActivityFeed({activity}){ return <section className="card"><h2>Recent Activity</h2>{activity.length===0?<p>No recent activity yet.</p>:<div className="activity-feed">{activity.map(a=><div className="activity-item" key={a.id}><div className="activity-dot"/><div><strong>{a.action}</strong><p>{a.details}</p><small>{new Date(a.created_at).toLocaleString()}</small></div></div>)}</div>}</section>; }

function Orders({user,business,myRole,orders,products,customers,reload,writeActivity,notify,plan}){
  const [editing,setEditing]=useState(null);
  const [f,setF]=useState({order_date:today(),product:"",platform:"",quantity:1,sale_price:"",fees:"",shipping:"",customer_name:"",customer_email:""});
  const canAdd=canAddRole(myRole), canDelete=canDeleteRole(myRole), canEdit=canAddRole(myRole);

  function startEdit(row){ setEditing(row.id); setF({order_date:row.order_date||today(),product:row.product||"",platform:row.platform||"",quantity:row.quantity||1,sale_price:row.sale_price||"",fees:row.fees||"",shipping:row.shipping||"",customer_name:row.customer_name||"",customer_email:row.customer_email||""}); }
  function resetForm(){ setEditing(null); setF({order_date:today(),product:"",platform:"",quantity:1,sale_price:"",fees:"",shipping:"",customer_name:"",customer_email:""}); }

  async function maybeSaveCustomer(){
    if(!plan.customers || !f.customer_email.trim()) return;
    const exists = customers.find(c=>String(c.email||"").toLowerCase()===f.customer_email.trim().toLowerCase());
    if(exists) return;
    await supabase.from("customers").insert({business_id:business.id,user_id:user.id,name:f.customer_name,email:f.customer_email});
  }

  async function save(){
    if(!business||!canAdd) return;
    const qtySold=Number(f.quantity||1);
    const selectedProduct=products.find(p=>p.name===f.product);
    if(!editing&&selectedProduct&&qtySold>Number(selectedProduct.stock||0)){notify("Not enough inventory available.","error");return;}

    const orderData = {...f, quantity:Number(f.quantity||1), sale_price:Number(f.sale_price||0), fees:Number(f.fees||0), shipping:Number(f.shipping||0)};

    if(editing){
      const result=await supabase.from("orders").update(orderData).eq("id",editing);
      if(result.error){notify(result.error.message,"error");return;}
      await writeActivity("Updated order",`${f.product||"Order"} was edited`);
      notify("Order updated.");
    } else {
      const result=await supabase.from("orders").insert({...orderData,user_id:user.id,business_id:business.id});
      if(result.error){notify(result.error.message,"error");return;}
      if(selectedProduct){
        const newStock=Number(selectedProduct.stock||0)-qtySold;
        const stockResult=await supabase.from("products").update({stock:newStock}).eq("id",selectedProduct.id);
        if(stockResult.error) notify("Order saved, but stock could not update.","error");
      }
      await maybeSaveCustomer();
      await writeActivity("Added sale",`${f.product||"Product"} sold x${qtySold}`);
      notify("Sale added and stock updated.");
    }
    resetForm(); reload();
  }

  async function del(id){ if(!canDelete)return; await supabase.from("orders").delete().eq("id",id); await writeActivity("Deleted order",`Order ${id} was deleted`); notify("Order deleted."); reload(); }

  return <><Header title="Sales / Orders" note={canAdd?"Add sales, customers, and automatically reduce stock.":"Read-only access."}/>
    {canAdd&&<section className="card form"><input type="date" value={f.order_date} onChange={e=>setF({...f,order_date:e.target.value})}/><select value={f.product} onChange={e=>setF({...f,product:e.target.value})}><option value="">Product</option>{products.map(p=><option key={p.id} value={p.name}>{p.name} — Inventory: {p.stock}</option>)}</select><input placeholder="Platform" value={f.platform} onChange={e=>setF({...f,platform:e.target.value})}/><input type="number" placeholder="Qty" value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/><input type="number" placeholder="Sale price" value={f.sale_price} onChange={e=>setF({...f,sale_price:e.target.value})}/><input type="number" placeholder="Fees" value={f.fees} onChange={e=>setF({...f,fees:e.target.value})}/><input type="number" placeholder="Shipping" value={f.shipping} onChange={e=>setF({...f,shipping:e.target.value})}/>{plan.customers&&<><input placeholder="Customer name" value={f.customer_name} onChange={e=>setF({...f,customer_name:e.target.value})}/><input placeholder="Customer email" value={f.customer_email} onChange={e=>setF({...f,customer_email:e.target.value})}/></>}<button onClick={save}><PlusCircle size={16}/>{editing?"Save order":"Add sale"}</button>{editing&&<button className="secondary" onClick={resetForm}>Cancel edit</button>}</section>}
    <EditableTable rows={orders} cols={["order_date","product","platform","quantity","sale_price","fees","shipping","customer_name"]} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/>
  </>;
}

function Costs({user,business,myRole,costs,reload,writeActivity,notify}){
  const [editing,setEditing]=useState(null),[f,setF]=useState({cost_date:today(),website:"",category:"",description:"",amount:""});
  const canAdd=canAddRole(myRole),canDelete=canDeleteRole(myRole),canEdit=canAddRole(myRole);
  function startEdit(row){setEditing(row.id);setF({cost_date:row.cost_date||today(),website:row.website||"",category:row.category||"",description:row.description||"",amount:row.amount||""});}
  function resetForm(){setEditing(null);setF({cost_date:today(),website:"",category:"",description:"",amount:""});}
  async function save(){ if(!business||!canAdd)return; const costData={...f,amount:f.amount===""?0:Number(f.amount)}; if(editing){const result=await supabase.from("costs").update(costData).eq("id",editing); if(result.error){notify(result.error.message,"error");return;} await writeActivity("Updated cost",`${f.description||f.category||"Cost"} was edited`); notify("Cost updated.");} else {const result=await supabase.from("costs").insert({...costData,user_id:user.id,business_id:business.id}); if(result.error){notify(result.error.message,"error");return;} await writeActivity("Added cost",`${f.description||f.category||"Cost"}: ${money(f.amount,business.currency)}`); notify("Cost added.");} resetForm();reload();}
  async function del(id){if(!canDelete)return; await supabase.from("costs").delete().eq("id",id); await writeActivity("Deleted cost",`Cost ${id} was deleted`); notify("Cost deleted."); reload();}
  return <><Header title="Costs" note={canAdd?"Track purchases, postage, packaging, ads, and website costs.":"Read-only access."}/>{canAdd&&<section className="card form"><input type="date" value={f.cost_date} onChange={e=>setF({...f,cost_date:e.target.value})}/><input placeholder="Website" value={f.website} onChange={e=>setF({...f,website:e.target.value})}/><input placeholder="Category" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/><input placeholder="Description" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/><input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/><button onClick={save}><PlusCircle size={16}/>{editing?"Save cost":"Add cost"}</button>{editing&&<button className="secondary" onClick={resetForm}>Cancel edit</button>}</section>}<EditableTable rows={costs} cols={["cost_date","website","category","description","amount"]} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null}/></>;
}

function Products({user,business,myRole,products,stockMovements,reload,writeActivity,notify,plan}){
  const [editing,setEditing]=useState(null),[imageFile,setImageFile]=useState(null),[search,setSearch]=useState(""),[quickSku,setQuickSku]=useState("");
  const [f,setF]=useState({name:"",sku:"",stock:"",buy_price:"",sell_price:"",supplier:"",image_url:""});
  const [cameraOpen,setCameraOpen]=useState(false);
  const [videoStream,setVideoStream]=useState(null);
  const canAdd=canAddRole(myRole),canDelete=canDeleteRole(myRole),canEdit=canAddRole(myRole);
  const filteredProducts=useMemo(()=>{const q=(search||quickSku).toLowerCase();return products.filter(p=>String(p.name||"").toLowerCase().includes(q)||String(p.sku||"").toLowerCase().includes(q)||String(p.supplier||"").toLowerCase().includes(q));},[products,search,quickSku]);


  async function scanWithCamera(){
    if(!("BarcodeDetector" in window)){
      notify("Camera barcode detection is not supported on this browser. Use typed barcode instead.","error");
      startBarcodeScan();
      return;
    }
    try{
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      setVideoStream(stream);
      setCameraOpen(true);
      setTimeout(async ()=>{
        const video = document.getElementById("barcode-video");
        if(!video) return;
        video.srcObject = stream;
        await video.play();
        const detector = new BarcodeDetector({formats:["ean_13","ean_8","code_128","code_39","upc_a","upc_e"]});
        const loop = async ()=>{
          if(!video || video.paused || video.ended) return;
          const codes = await detector.detect(video).catch(()=>[]);
          if(codes.length){
            setF(prev=>({...prev,sku:codes[0].rawValue}));
            notify("Barcode scanned.");
            stopCamera();
            return;
          }
          requestAnimationFrame(loop);
        };
        loop();
      },200);
    }catch{
      notify("Could not open camera.","error");
    }
  }
  function stopCamera(){
    if(videoStream) videoStream.getTracks().forEach(t=>t.stop());
    setVideoStream(null);
    setCameraOpen(false);
  }

  function startEdit(row){setEditing(row.id);setImageFile(null);setF({name:row.name||"",sku:row.sku||"",stock:row.stock||"",buy_price:row.buy_price||"",sell_price:row.sell_price||"",supplier:row.supplier||"",image_url:row.image_url||""});}
  function resetForm(){setEditing(null);setImageFile(null);setF({name:"",sku:"",stock:"",buy_price:"",sell_price:"",supplier:"",image_url:""});}
  async function uploadImage(){ if(!imageFile)return f.image_url; const safeName=imageFile.name.replace(/[^a-zA-Z0-9.-]/g,"_"); const filePath=`${business.id}/${Date.now()}-${safeName}`; const up=await supabase.storage.from("product-images").upload(filePath,imageFile); if(up.error){notify(up.error.message,"error");return f.image_url;} return supabase.storage.from("product-images").getPublicUrl(filePath).data.publicUrl; }
  async function save(){ if(!business||!canAdd)return; if(!editing && products.length>=plan.maxProducts){notify(`Your ${plan.label} plan product limit has been reached.`,"error");return;} const finalImageUrl=await uploadImage(); const productData={...f,stock:f.stock===""?0:Number(f.stock),buy_price:f.buy_price===""?0:Number(f.buy_price),sell_price:f.sell_price===""?0:Number(f.sell_price),image_url:finalImageUrl}; if(editing){const result=await supabase.from("products").update(productData).eq("id",editing); if(result.error){notify(result.error.message,"error");return;} await writeActivity("Updated product",`${f.name||"Product"} was edited`); notify("Product updated.");} else {const result=await supabase.from("products").insert({...productData,user_id:user.id,business_id:business.id}); if(result.error){notify(result.error.message,"error");return;} await writeActivity("Added product",`${f.name||"Product"} added to inventory`); notify("Product added.");} resetForm();reload(); }
  async function del(id){if(!canDelete)return; await supabase.from("products").delete().eq("id",id); await writeActivity("Deleted product",`Product ${id} was deleted`); notify("Product deleted."); reload();}
  async function adjustStock(product,amount){ if(!canEdit)return; const nextStock=Math.max(0,Number(product.stock||0)+amount); const result=await supabase.from("products").update({stock:nextStock}).eq("id",product.id); if(result.error){notify(result.error.message,"error");return;} await writeActivity("Updated stock",`${product.name} inventory changed to ${nextStock}`); notify("Inventory updated."); reload();}
  return <><Header title="Inventory" note={canAdd?"Add products, upload photos, scan/search SKUs, and adjust stock quickly.":"Read-only access."}/>{canAdd&&<section className="card form"><input placeholder="Product name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input placeholder="SKU / Barcode" value={f.sku} onChange={e=>setF({...f,sku:e.target.value})}/><input type="number" placeholder="Stock" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}/><input type="number" placeholder="Buy price" value={f.buy_price} onChange={e=>setF({...f,buy_price:e.target.value})}/><input type="number" placeholder="Sell price" value={f.sell_price} onChange={e=>setF({...f,sell_price:e.target.value})}/><input placeholder="Supplier" value={f.supplier} onChange={e=>setF({...f,supplier:e.target.value})}/><input type="file" accept="image/*" onChange={e=>setImageFile(e.target.files?.[0]||null)}/>{imageFile&&<p>Selected image: {imageFile.name}</p>}<button onClick={save}><PlusCircle size={16}/>{editing?"Save product":"Add product"}</button>{editing&&<button className="secondary" onClick={resetForm}>Cancel edit</button>}</section>}<section className="table-toolbar"><div className="searchbox"><Search size={16}/><input placeholder="Search products, SKU, supplier..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="searchbox"><PackageSearch size={16}/><input placeholder="Quick SKU/barcode lookup..." value={quickSku} onChange={e=>setQuickSku(e.target.value)}/></div></section>{cameraOpen && <section className="card camera-card"><h2>Scan Barcode</h2><video id="barcode-video" playsInline muted></video><button className="danger" onClick={stopCamera}>Stop Camera</button></section>}

      <ProductTable products={filteredProducts} currency={business.currency} onEdit={canEdit?startEdit:null} onDelete={canDelete?del:null} onStock={canEdit?adjustInventory:null}/><section className="card table-card"><h2>Stock Movement History</h2>{stockMovements?.length ? <table><thead><tr><th>Product</th><th>Change</th><th>New Stock</th><th>Reason</th><th>Date</th></tr></thead><tbody>{stockMovements.map(m=><tr key={m.id}><td>{m.product_name}</td><td>{m.change_amount}</td><td>{m.new_stock}</td><td>{m.reason}</td><td>{new Date(m.created_at).toLocaleString()}</td></tr>)}</tbody></table> : <p>No stock movements yet.</p>}</section></>;
}

function ProductTable({products,currency,onEdit,onDelete,onStock}){ return <section className="card table-card"><table><thead><tr><th>Image</th><th>Name</th><th>SKU</th><th>Inventory</th><th>Buy</th><th>Sell</th><th>Profit</th><th>Margin</th><th>Supplier</th>{(onEdit||onDelete||onStock)&&<th>Actions</th>}</tr></thead><tbody>{products.map(p=>{const profit=Number(p.sell_price||0)-Number(p.buy_price||0);const margin=Number(p.sell_price||0)>0?((profit/Number(p.sell_price))*100).toFixed(1):"0.0";const stock=Number(p.stock||0);return <tr key={p.id}><td>{p.image_url?<img className="thumb" src={p.image_url} alt={p.name}/>:<span className="empty-thumb">—</span>}</td><td><strong>{p.name}</strong></td><td>{p.sku}</td><td><span className={stock<=0?"stock out":stock<=3?"stock low":"stock ok"}>{stock<=0?"Out":stock<=3?`Low: ${stock}`:stock}</span></td><td>{money(p.buy_price,currency)}</td><td>{money(p.sell_price,currency)}</td><td>{money(profit,currency)}</td><td>{margin}%</td><td>{p.supplier}</td>{(onEdit||onDelete||onStock)&&<td className="actions">{onStock&&<><button className="mini" onClick={()=>onStock(p,-1)}><Minus size={14}/></button><button className="mini" onClick={()=>onStock(p,1)}><Plus size={14}/></button></>}{onEdit&&<button className="secondary" onClick={()=>onEdit(p)}>Edit</button>}{onDelete&&<button className="danger" onClick={()=>onDelete(p.id)}><Trash2 size={14}/>Delete</button>}</td>}</tr>;})}</tbody></table></section>; }
function EditableTable({rows,cols,onEdit,onDelete}){ return <section className="card table-card"><table><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}{(onEdit||onDelete)&&<th>Actions</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c}>{String(r[c]??"")}</td>)}{(onEdit||onDelete)&&<td className="actions">{onEdit&&<button className="secondary" onClick={()=>onEdit(r)}>Edit</button>}{onDelete&&<button className="danger" onClick={()=>onDelete(r.id)}><Trash2 size={14}/>Delete</button>}</td>}</tr>)}</tbody></table></section>; }

function Customers({user,business,myRole,customers,orders,reload,writeActivity,notify,plan}){
  const [f,setF]=useState({name:"",email:"",phone:"",notes:""}), canAdd=canAddRole(myRole);
  async function addCustomer(){ if(!plan.customers){notify("Customer tracking is a Pro feature.","error");return;} if(!canAdd)return; const result=await supabase.from("customers").insert({...f,business_id:business.id,user_id:user.id}); if(result.error){notify(result.error.message,"error");return;} await writeActivity("Added customer",`${f.name||f.email} was added`); notify("Customer added."); setF({name:"",email:"",phone:"",notes:""}); reload(); }
  return <><Header title="Customers" note={plan.customers?"Track buyers, repeat customers, and customer sales history.":"Upgrade to Pro to track customers."}/>{!plan.customers&&<UpgradeCard setPage={()=>{}}/>}{plan.customers&&canAdd&&<section className="card form"><input placeholder="Name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input placeholder="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/><input placeholder="Phone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><input placeholder="Notes" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/><button onClick={addCustomer}>Add customer</button></section>}<section className="card"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Notes</th></tr></thead><tbody>{customers.map(c=>{const count=orders.filter(o=>String(o.customer_email||"").toLowerCase()===String(c.email||"").toLowerCase()).length;return <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td><td>{count}</td><td>{c.notes}</td></tr>;})}</tbody></table></section></>;
}

function Analytics({products,orders,stats,business,plan,setPage}){
  if(!plan.analytics) return <><Header title="Analytics" note="Advanced analytics are included in Pro and Business."/><UpgradeCard setPage={setPage}/></>;
  const bestProducts=Object.values(orders.reduce((m,o)=>{const k=o.product||"Unknown";m[k]??={name:k,quantity:0,revenue:0};m[k].quantity+=Number(o.quantity||0);m[k].revenue+=Number(o.sale_price||0);return m;},{})).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
  const topProfitProducts=[...products].map(p=>({...p,unitProfit:Number(p.sell_price||0)-Number(p.buy_price||0)})).sort((a,b)=>b.unitProfit-a.unitProfit).slice(0,5);
  return <><Header title="Analytics" note="See best sellers, profit margins, and business performance."/><div className="grid"><Stat label="Net Profit" value={money(stats.profit,business.currency)}/><Stat label="Profit Margin" value={`${stats.margin.toFixed(1)}%`}/><Stat label="Average Order" value={money(stats.averageOrder,business.currency)}/><Stat label="Inventory Value" value={money(stats.inventoryValue,business.currency)}/></div><section className="card"><h2>Best-selling products</h2>{bestProducts.length===0?<p>No sales yet.</p>:<table><thead><tr><th>Product</th><th>Qty sold</th><th>Revenue</th></tr></thead><tbody>{bestProducts.map(p=><tr key={p.name}><td>{p.name}</td><td>{p.quantity}</td><td>{money(p.revenue,business.currency)}</td></tr>)}</tbody></table>}</section><section className="card"><h2>Highest unit profit</h2>{topProfitProducts.length===0?<p>No products yet.</p>:<table><thead><tr><th>Product</th><th>Buy</th><th>Sell</th><th>Unit profit</th></tr></thead><tbody>{topProfitProducts.map(p=><tr key={p.id}><td>{p.name}</td><td>{money(p.buy_price,business.currency)}</td><td>{money(p.sell_price,business.currency)}</td><td>{money(p.unitProfit,business.currency)}</td></tr>)}</tbody></table>}</section></>;
}

function UpgradeCard({setPage}){ return <section className="card plan-card"><h2>Upgrade to unlock this feature</h2><p>Advanced analytics, customer tracking, PDF reports, higher limits, and more team capacity are included in paid plans.</p><button onClick={()=>setPage("billing")}>View plans</button></section>; }

function Team({business,myRole,notify}){ const [email,setEmail]=useState(""),[members,setMembers]=useState([]),[msg,setMsg]=useState(""),[err,setErr]=useState(""),[inviteRole,setInviteRole]=useState("staff"),[inviteLink,setInviteLink]=useState(""); const canManageTeam=canManageTeamRole(myRole);
  async function leaveBusiness(){const confirmed=confirm("Are you sure you want to leave this business?");if(!confirmed)return;const result=await supabase.rpc("leave_current_business",{target_business_id:business.id});if(result.error){setErr(result.error.message);return;}alert(result.data);window.location.reload();}
  async function loadMembers(){if(!business)return;setErr("");const result=await supabase.rpc("get_business_members",{target_business_id:business.id});if(result.error){setErr("Could not load team members.");return;}setMembers(result.data||[]);}
  useEffect(()=>{loadMembers();},[business?.id]);
  async function addMember(){if(!canManageTeam){setErr("Only owners and admins can add members.");return;}setMsg("");setErr("");if(!email.trim()){setErr("Enter your friend's email address.");return;}const result=await supabase.rpc("add_business_member_by_email",{target_email:email.trim(),target_business_id:business.id});if(result.error){setErr(result.error.message);return;}if(typeof result.data==="string"&&result.data.toLowerCase().includes("not found")){setErr(result.data);return;}setMsg(result.data||"Member added successfully.");notify?.("Member added.");setEmail("");loadMembers();}
  async function createInvite(){if(!canManageTeam){setErr("Only owners and admins can create invite links.");return;}const result=await supabase.rpc("create_business_invite",{target_business_id:business.id,invite_role:inviteRole});if(result.error){setErr(result.error.message);return;}const link=`${window.location.origin}/?invite=${result.data}`;setInviteLink(link);notify?.("Invite link created.");}
  async function copyInvite(){await navigator.clipboard.writeText(inviteLink);notify?.("Invite link copied.");}
  async function changeRole(memberId,newRole){if(!canManageTeam){setErr("Only owners and admins can change roles.");return;}const result=await supabase.rpc("update_business_member_role",{target_member_id:memberId,new_role:newRole});if(result.error){setErr(result.error.message);return;}notify?.("Role updated.");loadMembers();}
  async function removeMember(memberId){if(!canManageTeam)return;const confirmed=confirm("Remove this member?");if(!confirmed)return;const result=await supabase.rpc("remove_business_member",{target_member_id:memberId});if(result.error){setErr(result.error.message);return;}notify?.("Member removed.");loadMembers();}
  return <><Header title="Team" note="Manage roles, members, and invite links." />{canManageTeam&&<><section className="card form"><input placeholder="Friend's email" value={email} onChange={e=>setEmail(e.target.value)}/><button onClick={addMember}>Add member</button></section><section className="card"><h2>Invite Link</h2><p>Create a link someone can use to join this business after logging in.</p><div className="form"><select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}><option value="admin">Admin</option><option value="staff">Staff</option><option value="viewer">Viewer</option></select><button onClick={createInvite}>Create invite link</button></div>{inviteLink&&<div className="share-link"><LinkIcon size={16}/><input readOnly value={inviteLink}/><button onClick={copyInvite}><Clipboard size={16}/>Copy</button></div>}</section></>}{err&&<p className="error">{err}</p>}{msg&&<p className="success">{msg}</p>}<section className="card"><h2>Members</h2><table><thead><tr><th>Email</th><th>User ID</th><th>Role</th><th>Actions</th></tr></thead><tbody>{members.map(m=><tr key={m.member_id}><td>{m.email||"No email found"}</td><td>{m.user_id}</td><td><select value={m.role} onChange={e=>changeRole(m.member_id,e.target.value)} disabled={!canManageTeam||m.role==="owner"}><option value="owner">Owner</option><option value="admin">Admin</option><option value="staff">Staff</option><option value="viewer">Viewer</option></select></td><td>{m.role!=="owner"&&canManageTeam?<button className="danger" onClick={()=>removeMember(m.member_id)}>Remove</button>:"Protected"}</td></tr>)}</tbody></table></section><section className="card"><h2>Leave Business</h2><p>Leave this business and remove your access.</p><button className="danger" onClick={leaveBusiness}>Leave Business</button></section></>;
}

function BusinessSettings({business,myRole,reload,writeActivity,notify}){ const [name,setName]=useState(business.name||""),[currency,setCurrency]=useState(business.currency||"GBP"),[logoUrl,setLogoUrl]=useState(business.logo_url||""),[logoFile,setLogoFile]=useState(null),[description,setDescription]=useState(business.description||""),[msg,setMsg]=useState(""),[err,setErr]=useState(""),[shareLink,setShareLink]=useState(""); const canEdit=myRole==="owner"; useEffect(()=>{setShareLink(window.location.origin);},[]);
  async function uploadLogo(){if(!logoFile)return logoUrl; const safeName=logoFile.name.replace(/[^a-zA-Z0-9.-]/g,"_"); const filePath=`${business.id}/${Date.now()}-${safeName}`; const up=await supabase.storage.from("business-logos").upload(filePath,logoFile); if(up.error){setErr(up.error.message);notify?.(up.error.message,"error");return logoUrl;} return supabase.storage.from("business-logos").getPublicUrl(filePath).data.publicUrl;}
  async function saveSettings(){setMsg("");setErr("");if(!canEdit){setErr("Only the owner can change settings.");return;}const finalLogoUrl=await uploadLogo();const result=await supabase.rpc("update_business_settings",{target_business_id:business.id,business_name:name,currency_text:currency,logo_url_text:finalLogoUrl,description_text:description});if(result.error){setErr(result.error.message);notify?.(result.error.message,"error");return;}await writeActivity("Updated settings","Business settings were changed");setLogoUrl(finalLogoUrl);setLogoFile(null);setMsg("Settings saved.");notify?.("Settings saved.");reload();}
  async function copyShareLink(){await navigator.clipboard.writeText(shareLink);notify?.("App link copied.");}
  return <><Header title="Settings" note="Manage branding, currency, and your app link."/><section className="card form"><input disabled={!canEdit} placeholder="Business name" value={name} onChange={e=>setName(e.target.value)}/><select disabled={!canEdit} value={currency} onChange={e=>setCurrency(e.target.value)}><option value="GBP">GBP (£)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select><input disabled={!canEdit} type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0]||null)}/><input disabled={!canEdit} placeholder="Business description" value={description} onChange={e=>setDescription(e.target.value)}/><button disabled={!canEdit} onClick={saveSettings}>Save settings</button></section>{logoFile&&<p className="success">Selected logo: {logoFile.name}</p>}{!canEdit&&<p className="error">Only the owner can edit business settings.</p>}{err&&<p className="error">{err}</p>}{msg&&<p className="success">{msg}</p>}<section className="card"><h2>Accessible App Link</h2><p>Use this link to open your app directly. For a proper searchable link, connect a custom domain in Vercel.</p><div className="share-link"><LinkIcon size={16}/><input readOnly value={shareLink}/><button onClick={copyShareLink}>Copy link</button></div></section>{logoUrl&&<section className="card"><h2>Logo Preview</h2><img className="logo-preview" src={logoUrl} alt="Business logo"/></section>}</>;
}


function Catalogue({business,products,plan,setPage,notify}){
  const link = `${window.location.origin}/store/${business.slug || business.id}`;
  async function copyLink(){ await navigator.clipboard.writeText(link); notify?.("Catalogue link copied."); }
  return (
    <>
      <Header title="Public Catalogue" note={plan.store ? "Share a public product catalogue with customers." : "Public catalogue is included in Pro and Business."}/>
      {!plan.store && <UpgradeCard setPage={setPage}/>}
      {plan.store && (
        <>
          <section className="card">
            <h2>Your Catalogue Link</h2>
            <div className="share-link"><LinkIcon size={16}/><input readOnly value={link}/><button onClick={copyLink}><Clipboard size={16}/>Copy</button></div>
          </section>
          <section className="catalogue-grid">
            {products.filter(p=>p.is_public !== false).map(p=>(
              <div className="catalogue-card" key={p.id}>
                {p.image_url && <img src={p.image_url} alt={p.name}/>}<h3>{p.name}</h3><p>{money(p.sell_price,business.currency)}</p><small>{Number(p.stock||0)>0 ? "In Stock" : "Out Of Stock"}</small>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}

function PublicStore({slug}){
  const [business,setBusiness]=useState(null);
  const [products,setProducts]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ async function load(){
    const b=await supabase.from("businesses").select("id,name,currency,logo_url,description,slug").eq("slug",slug).maybeSingle();
    if(!b.data){ setLoading(false); return; }
    setBusiness(b.data);
    const p=await supabase.from("products").select("*").eq("business_id",b.data.id).eq("is_public",true).order("created_at",{ascending:false});
    setProducts(p.data||[]); setLoading(false);
  } load(); },[slug]);
  if(loading) return <main className="loading-screen">Loading catalogue...</main>;
  if(!business) return <main className="loading-screen">Catalogue not found.</main>;
  return <div className="public-store"><header className="store-header">{business.logo_url ? <img src={business.logo_url} alt={business.name}/> : <div className="brand-mark">{initials(business.name)}</div>}<h1>{business.name}</h1><p>{business.description || "Powered by ProfitsPilot"}</p></header><section className="catalogue-grid">{products.map(p=><div className="catalogue-card" key={p.id}>{p.image_url && <img src={p.image_url} alt={p.name}/>}<h3>{p.name}</h3><p>{money(p.sell_price,business.currency)}</p><small>{Number(p.stock||0)>0 ? "In Stock" : "Out Of Stock"}</small></div>)}</section></div>;
}


function Suppliers({user,business,myRole,suppliers,reload,writeActivity,notify}){
  const [f,setF]=useState({name:"",website:"",email:"",phone:"",notes:""});
  const mayAdd=canAddRole(myRole);
  async function addSupplier(){
    if(!mayAdd) return;
    if(!f.name.trim()){ notify("Enter a supplier name.","error"); return; }
    const result=await supabase.from("suppliers").insert({...f,business_id:business.id,user_id:user.id});
    if(result.error){ notify(result.error.message,"error"); return; }
    await writeActivity("Added Supplier",`${f.name} was added`);
    notify("Supplier added.");
    setF({name:"",website:"",email:"",phone:"",notes:""});
    reload();
  }
  async function removeSupplier(row){
    const confirmed=confirm("Delete this supplier?");
    if(!confirmed) return;
    const result=await supabase.from("suppliers").delete().eq("id",row.id);
    if(result.error){ notify(result.error.message,"error"); return; }
    await writeActivity("Deleted Supplier",`${row.name} was deleted`);
    notify("Supplier deleted.");
    reload();
  }
  return <><Header title="Suppliers" note="Track suppliers, websites, contact details, and notes."/>{mayAdd&&<section className="card form"><input placeholder="Supplier name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input placeholder="Website" value={f.website} onChange={e=>setF({...f,website:e.target.value})}/><input placeholder="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/><input placeholder="Phone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><input placeholder="Notes" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/><button onClick={addSupplier}><PlusCircle size={16}/>Add Supplier</button></section>}<EditableTable rows={suppliers} cols={["name","website","email","phone","notes"]} onDelete={canDeleteRole(myRole)?removeSupplier:null}/></>;
}

function Invoices({user,business,myRole,invoices,orders,customers,products,reload,writeActivity,notify,plan,setPage}){
  const [f,setF]=useState({customer_name:"",customer_email:"",items:"",amount:"",status:"draft"});
  const mayAdd=canAddRole(myRole);
  async function createInvoice(){
    if(!plan.pdf){ notify("Invoices and PDF reports are a Pro feature.","error"); setPage("billing"); return; }
    if(!mayAdd) return;
    const invoiceNumber = `INV-${Date.now()}`;
    const payload={...f,business_id:business.id,user_id:user.id,invoice_number:invoiceNumber,amount:Number(f.amount||0),invoice_date:today()};
    const result=await supabase.from("invoices").insert(payload);
    if(result.error){ notify(result.error.message,"error"); return; }
    await writeActivity("Created Invoice",`${invoiceNumber} for ${f.customer_name||"Customer"}`);
    notify("Invoice created.");
    setF({customer_name:"",customer_email:"",items:"",amount:"",status:"draft"});
    reload();
  }
  function printInvoice(row){
    const data=encodeInvoiceData({business,invoice:row});
    window.open(`/invoice.html?data=${encodeURIComponent(data)}`,"_blank");
  }
  function emailInvoice(row){
    const subject=encodeURIComponent(`Invoice ${row.invoice_number} from ${business.name}`);
    const body=encodeURIComponent(`Hi ${row.customer_name||""},\n\nHere is your invoice ${row.invoice_number} for ${money(row.amount,business.currency)}.\n\nThanks,\n${business.name}`);
    window.location.href=`mailto:${row.customer_email||""}?subject=${subject}&body=${body}`;
  }
  return <><Header title="Invoices" note="Create invoices, print/save PDFs, and open email receipts."/>
    {!plan.pdf&&<UpgradeCard setPage={setPage}/>}
    {plan.pdf&&mayAdd&&<section className="card form"><input placeholder="Customer name" value={f.customer_name} onChange={e=>setF({...f,customer_name:e.target.value})}/><input placeholder="Customer email" value={f.customer_email} onChange={e=>setF({...f,customer_email:e.target.value})}/><input placeholder="Items / description" value={f.items} onChange={e=>setF({...f,items:e.target.value})}/><input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/><select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option></select><button onClick={createInvoice}><FileSignature size={16}/>Create Invoice</button></section>}
    <section className="card table-card"><table><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Email</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{invoices.map(row=><tr key={row.id}><td>{row.invoice_number}</td><td>{row.invoice_date}</td><td>{row.customer_name}</td><td>{row.customer_email}</td><td>{money(row.amount,business.currency)}</td><td>{titleCase(row.status)}</td><td className="actions"><button className="secondary" onClick={()=>printInvoice(row)}>Print / PDF</button><button onClick={()=>emailInvoice(row)}><Mail size={14}/>Email</button></td></tr>)}</tbody></table></section>
  </>;
}


function Integrations({business,products=[],orders=[],integrationConnections=[],reload,notify,plan,setPage}){
  const [shopifyStore,setShopifyStore]=useState("");
  const hasAccess = !!plan?.integrations;
  const connected = platform => integrationConnections?.find(c=>c.platform===platform && c.status==="connected");

  function csvDownload(filename,headers,rows){
    const content=[headers,...rows].map(row=>row.map(cell=>`"${String(cell??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob=new Blob([content],{type:"text/csv"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    a.click();
  }

  function exportProducts(platform){
    if(!hasAccess){ setPage("billing"); return; }
    const headers=["sku","title","quantity","price","image_url"];
    const rows=products.map(p=>[p.sku||p.id,p.name||"",p.stock||0,p.sell_price||0,p.image_url||""]);
    csvDownload(`profitspilot-${platform}-products.csv`,headers,rows);
    notify(`${platform} product export ready.`);
  }

  function exportOrders(platform){
    if(!hasAccess){ setPage("billing"); return; }
    const headers=["order_date","product","quantity","sale_price","fees","shipping","customer_name","customer_email"];
    const rows=orders.map(o=>headers.map(h=>o[h]??""));
    csvDownload(`profitspilot-${platform}-orders.csv`,headers,rows);
    notify(`${platform} order export ready.`);
  }

  async function saveConnection(platform,meta={}){
    if(!hasAccess){ setPage("billing"); return; }
    const existing=integrationConnections?.find(c=>c.platform===platform);
    const payload={business_id:business.id,platform,status:"connected",meta,connected_at:new Date().toISOString()};
    const result=existing
      ? await supabase.from("integration_connections").update(payload).eq("id",existing.id)
      : await supabase.from("integration_connections").insert(payload);
    if(result.error){ notify(result.error.message,"error"); return; }
    notify(`${platform} connected.`);
    reload();
  }

  async function disconnect(platform){
    const existing=integrationConnections?.find(c=>c.platform===platform);
    if(!existing) return;
    const result=await supabase.from("integration_connections").update({status:"disconnected"}).eq("id",existing.id);
    if(result.error){ notify(result.error.message,"error"); return; }
    notify(`${platform} disconnected.`);
    reload();
  }

  function connectEbay(){ if(!hasAccess){setPage("billing");return;} window.open(`/api/ebay-auth?business_id=${encodeURIComponent(business.id)}`,"_blank"); }
  function connectVinted(){ if(!hasAccess){setPage("billing");return;} saveConnection("vinted",{type:"vinted_pro_connection"}); }
  function connectShopify(){
    if(!hasAccess){setPage("billing");return;}
    if(!shopifyStore.trim()){ notify("Enter your Shopify store domain first.","error"); return; }
    window.open(`/api/shopify-auth?shop=${encodeURIComponent(shopifyStore.trim())}&business_id=${encodeURIComponent(business.id)}`,"_blank");
  }

  const platforms=[
    {id:"ebay",name:"eBay",text:"Connect your eBay workflow and export marketplace-ready files.",action:connectEbay},
    {id:"vinted",name:"Vinted Pro",text:"Connect your Vinted Pro workflow and export your catalogue.",action:connectVinted},
    {id:"shopify",name:"Shopify",text:"Connect your Shopify store for product and order workflows.",action:connectShopify}
  ];

  return (
    <>
      <Header title="Integrations" note="Connect sales channels and keep product data organised."/>

      {!hasAccess && (
        <section className="card integration-lock">
          <Lock size={22}/>
          <div><h2>Marketplace integrations are included with Pro</h2><p>Upgrade to Pro or Business to connect eBay, Vinted, and Shopify.</p></div>
          <button onClick={()=>setPage("billing")}>View Plans</button>
        </section>
      )}

      <section className="integration-grid polished-integrations">
        {platforms.map(p=>(
          <div className={`card integration-card ${!hasAccess ? "disabled-card" : ""}`} key={p.id}>
            <div className="integration-top">
              <div><h2>{p.name}</h2><p>{p.text}</p></div>
              <span className={connected(p.id) ? "connection-pill connected" : "connection-pill"}>{connected(p.id) ? "Connected" : "Ready"}</span>
            </div>

            {p.id==="shopify" && <input placeholder="yourstore.myshopify.com" value={shopifyStore} onChange={e=>setShopifyStore(e.target.value)} disabled={!hasAccess}/>}

            <div className="actions">
              <button onClick={p.action} disabled={!hasAccess}><Zap size={16}/>Connect</button>
              <button className="secondary" onClick={()=>exportProducts(p.id)} disabled={!hasAccess}>Export Products</button>
              <button className="secondary" onClick={()=>exportOrders(p.id)} disabled={!hasAccess}>Export Orders</button>
              {connected(p.id) && <button className="danger" onClick={()=>disconnect(p.id)}>Disconnect</button>}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function RecurringExpenses({user,business,myRole,recurringExpenses=[],reload,writeActivity,notify}){
  const [f,setF]=useState({name:"",category:"",amount:"",frequency:"monthly",next_due:today(),notes:""});
  const mayAdd=canAddRole(myRole);

  async function addRecurring(){
    if(!mayAdd) return;
    if(!f.name.trim()){ notify("Enter a name.","error"); return; }
    const result=await supabase.from("recurring_expenses").insert({...f,business_id:business.id,user_id:user.id,amount:Number(f.amount||0)});
    if(result.error){ notify(result.error.message,"error"); return; }
    await writeActivity("Added Recurring Expense",`${f.name}: ${money(f.amount,business.currency)}`);
    notify("Recurring expense added.");
    setF({name:"",category:"",amount:"",frequency:"monthly",next_due:today(),notes:""});
    reload();
  }

  async function removeRecurring(row){
    const confirmed=confirm("Delete this recurring expense?");
    if(!confirmed) return;
    const result=await supabase.from("recurring_expenses").delete().eq("id",row.id);
    if(result.error){ notify(result.error.message,"error"); return; }
    await writeActivity("Deleted Recurring Expense",row.name);
    notify("Recurring expense deleted.");
    reload();
  }

  return (
    <>
      <Header title="Recurring Expenses" note="Manage regular costs such as rent, subscriptions, utilities, and software."/>
      {mayAdd && (
        <section className="card form">
          <input placeholder="Name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
          <input placeholder="Category" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/>
          <input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
          <select value={f.frequency} onChange={e=>setF({...f,frequency:e.target.value})}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input type="date" value={f.next_due} onChange={e=>setF({...f,next_due:e.target.value})}/>
          <input placeholder="Notes" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
          <button onClick={addRecurring}><PlusCircle size={16}/>Add Expense</button>
        </section>
      )}

      <section className="card table-card">
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Amount</th><th>Frequency</th><th>Next Due</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>{recurringExpenses.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.category}</td><td>{money(r.amount,business.currency)}</td><td>{titleCase(r.frequency)}</td><td>{r.next_due}</td><td>{r.notes}</td><td>{canDeleteRole(myRole)&&<button className="danger" onClick={()=>removeRecurring(r)}>Delete</button>}</td></tr>)}</tbody>
        </table>
        {!recurringExpenses.length && <p className="muted">No recurring expenses yet.</p>}
      </section>
    </>
  );
}

function Billing({business,myRole,notify,isFounder,paymentRequests,paymentSettings,reload}){
  const [selectedPlan,setSelectedPlan]=useState("pro");
  const [method,setMethod]=useState("Bank Transfer");
  const [reference,setReference]=useState("");
  const [proof,setProof]=useState("");
  const proLink=import.meta.env.VITE_STRIPE_PRO_LINK||"";
  const businessLink=import.meta.env.VITE_STRIPE_BUSINESS_LINK||"";
  function go(link){
    if(!link){ notify?.("Stripe link not added yet. Use manual payment request instead.","error"); return; }
    window.open(link,"_blank");
  }
  async function submitManualRequest(){
    if(myRole!=="owner"){ notify("Only the Owner can request a plan upgrade.","error"); return; }
    const result=await supabase.from("payment_requests").insert({business_id:business.id,requested_plan:selectedPlan,payment_method:method,payment_reference:reference,proof_text:proof,status:"pending"});
    if(result.error){ notify(result.error.message,"error"); return; }
    notify("Payment request submitted. Approve it manually in Supabase after checking payment.");
    setReference(""); setProof(""); reload?.();
  }
  return <><Header title="Plans" note={isFounder ? "You have Founder Access. All premium features are unlocked." : "Upgrade ProfitsPilot with paid or manual plans."}/>{isFounder&&<section className="card plan-card active-plan"><h2><ShieldCheck size={18}/> Founder Access</h2><p>You have the Business plan unlocked for free because this account is the founder account.</p></section>}<PricingCards onPro={()=>go(proLink)} onBusiness={()=>go(businessLink)} currentPlan={isFounder ? "business" : (business.plan||"free")}/>{myRole!=="owner"&&<p className="error">Only the Owner should manage billing.</p>}<section className="card payment-details-card"><h2><Banknote size={18}/> How To Pay</h2><p>Pay using one of the methods below, then submit your payment reference.</p>{paymentSettings?.paypal_email&&<div className="payment-box"><b>PayPal</b><p>{paymentSettings.paypal_email}</p></div>}{paymentSettings?.paypal_link&&<div className="payment-box"><b>PayPal Link</b><p>{paymentSettings.paypal_link}</p></div>}{paymentSettings?.bank_name&&<div className="payment-box"><b>Bank Transfer</b><p>Account Name: {paymentSettings.account_name}</p><p>Bank: {paymentSettings.bank_name}</p><p>Sort Code: {paymentSettings.sort_code}</p><p>Account Number: {paymentSettings.account_number}</p><p>Use your business name as the reference.</p></div>}{!paymentSettings&&<p className="error">Payment details have not been added yet.</p>}</section><section className="card"><h2><CreditCard size={18}/> Manual Payment Request</h2><p>Use this for PayPal or bank transfer. The customer pays, submits a reference, then you manually approve the plan in Supabase.</p><div className="form"><select value={selectedPlan} onChange={e=>setSelectedPlan(e.target.value)}><option value="pro">Pro</option><option value="business">Business</option></select><select value={method} onChange={e=>setMethod(e.target.value)}><option>Bank Transfer</option><option>PayPal</option><option>Cash / Other</option></select><input placeholder="Payment reference" value={reference} onChange={e=>setReference(e.target.value)}/><input placeholder="Proof / note" value={proof} onChange={e=>setProof(e.target.value)}/><button onClick={submitManualRequest}>Submit Request</button></div></section><section className="card"><h2>Payment Requests</h2>{paymentRequests?.length?<table><thead><tr><th>Plan</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th></tr></thead><tbody>{paymentRequests.map(r=><tr key={r.id}><td>{titleCase(r.requested_plan)}</td><td>{r.payment_method}</td><td>{r.payment_reference}</td><td>{titleCase(r.status)}</td><td>{new Date(r.created_at).toLocaleString()}</td></tr>)}</tbody></table>:<p>No payment requests yet.</p>}</section><section className="card"><h2>Automatic Subscriptions</h2><p>True automatic charging needs Stripe, PayPal Business, or another provider with webhooks. This upgrade includes the manual approval workflow that works without a business payment account.</p></section></>;
}

function AdminPayments({business,paymentRequests,paymentSettings,reload,notify}){
  const [settings,setSettings]=useState({paypal_email:paymentSettings?.paypal_email||"bakerjubahji@outlook.com",paypal_link:paymentSettings?.paypal_link||"",account_name:paymentSettings?.account_name||"",bank_name:paymentSettings?.bank_name||"",sort_code:paymentSettings?.sort_code||"",account_number:paymentSettings?.account_number||""});
  useEffect(()=>{setSettings({paypal_email:paymentSettings?.paypal_email||"bakerjubahji@outlook.com",paypal_link:paymentSettings?.paypal_link||"",account_name:paymentSettings?.account_name||"",bank_name:paymentSettings?.bank_name||"",sort_code:paymentSettings?.sort_code||"",account_number:paymentSettings?.account_number||""});},[paymentSettings?.id]);
  async function saveSettings(){
    const payload={...settings,business_id:business.id};
    const result=paymentSettings?.id ? await supabase.from("payment_settings").update(payload).eq("id",paymentSettings.id) : await supabase.from("payment_settings").insert(payload);
    if(result.error){notify(result.error.message,"error");return;}
    notify("Payment details saved."); reload();
  }
  async function approve(row){
    const result=await supabase.rpc("approve_payment_request",{target_request_id:row.id});
    if(result.error){notify(result.error.message,"error");return;}
    notify(result.data||"Payment approved."); reload();
  }
  async function reject(row){
    const reason=prompt("Reason for rejecting?")||"Rejected";
    const result=await supabase.from("payment_requests").update({status:"rejected",admin_note:reason}).eq("id",row.id);
    if(result.error){notify(result.error.message,"error");return;}
    notify("Payment rejected."); reload();
  }
  return <><Header title="Admin Payments" note="Add payment details and approve or reject manual upgrade requests."/>
    <section className="card"><h2>Payment Details Customers See</h2><div className="form"><input placeholder="PayPal email" value={settings.paypal_email} onChange={e=>setSettings({...settings,paypal_email:e.target.value})}/><input placeholder="PayPal.Me link" value={settings.paypal_link} onChange={e=>setSettings({...settings,paypal_link:e.target.value})}/><input placeholder="Account name" value={settings.account_name} onChange={e=>setSettings({...settings,account_name:e.target.value})}/><input placeholder="Bank name" value={settings.bank_name} onChange={e=>setSettings({...settings,bank_name:e.target.value})}/><input placeholder="Sort code" value={settings.sort_code} onChange={e=>setSettings({...settings,sort_code:e.target.value})}/><input placeholder="Account number" value={settings.account_number} onChange={e=>setSettings({...settings,account_number:e.target.value})}/><button onClick={saveSettings}>Save Payment Details</button></div></section>
    <section className="card table-card"><h2>Manual Payment Requests</h2>{paymentRequests?.length?<table><thead><tr><th>Plan</th><th>Method</th><th>Reference</th><th>Proof</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>{paymentRequests.map(r=><tr key={r.id}><td>{titleCase(r.requested_plan)}</td><td>{r.payment_method}</td><td>{r.payment_reference}</td><td>{r.proof_text}</td><td>{titleCase(r.status)}</td><td>{new Date(r.created_at).toLocaleString()}</td><td className="actions">{r.status==="pending"&&<button onClick={()=>approve(r)}><CheckCircle2 size={14}/>Approve</button>}{r.status==="pending"&&<button className="danger" onClick={()=>reject(r)}><XCircle size={14}/>Reject</button>}</td></tr>)}</tbody></table>:<p>No payment requests yet.</p>}</section>
  </>;
}

function PricingCards({onPro,onBusiness,currentPlan="free",publicMode=false}){ return <div className="pricing"><Plan name="Free" price="£0" active={currentPlan==="free"} features={["25 Products","3 Team Members","Basic Dashboard","CSV Export"]}/><Plan name="Pro" price="£9.99/mo" active={currentPlan==="pro"} onClick={onPro} features={["500 Products","10 Team Members","Customer Tracking","Advanced Analytics","PDF Reports","Public Catalogue"]}/><Plan name="Business" price="£29.99/mo" active={currentPlan==="business"} onClick={onBusiness} features={["Unlimited Products","Unlimited Team","Advanced Reports","Priority Features","Custom Branding"]}/></div>; }
function Plan({name,price,features,onClick,active}){ return <section className={`card plan-card ${active?"active-plan":""}`}><h2>{name}</h2><h1>{price}</h1>{active&&<p className="success">Current Plan</p>}<ul>{features.map(f=><li key={f}>{f}</li>)}</ul>{onClick&&<button onClick={onClick}>Upgrade</button>}</section>; }

function Reports({orders,costs,products,stats,business,notify,plan,setPage}){ if(!plan.pdf) return <><Header title="Reports" note="CSV is available. PDF reports are included in Pro."/><section className="card form"><button onClick={exportCSV}><Download size={16}/>Export CSV</button><button onClick={()=>setPage("billing")}>Upgrade for PDF</button></section></>; function exportCSV(){const lines=["Type,Date,Name,Website/Platform,Qty/Category,Amount,Fees,Shipping"];orders.forEach(o=>lines.push(`ORDER,${o.order_date},${o.product},${o.platform},${o.quantity},${o.sale_price},${o.fees},${o.shipping}`));costs.forEach(c=>lines.push(`COST,${c.cost_date},${c.description},${c.website},${c.category},${c.amount},,`));products.forEach(p=>lines.push(`PRODUCT,,${p.name},${p.supplier},${p.stock},${p.sell_price},${p.buy_price},`));const blob=new Blob([lines.join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="profitspilot-report.csv";a.click();notify?.("CSV exported.");} function printReport(){window.print();notify?.("Print dialog opened.");} return <><Header title="Reports" note="Export CSV or print/save a monthly PDF report."/><div className="grid print-summary"><Stat label="Revenue" value={money(stats.revenue,business.currency)}/><Stat label="Costs" value={money(stats.costTotal,business.currency)}/><Stat label="Fees + Shipping" value={money(stats.fees,business.currency)}/><Stat label="Profit" value={money(stats.profit,business.currency)}/></div><section className="card form no-print"><button onClick={exportCSV}><Download size={16}/>Export CSV</button><button className="secondary" onClick={printReport}>Print / Save PDF</button></section><section className="card print-only"><h2>{business.name} Profit Report</h2><p>Generated on {new Date().toLocaleDateString()}</p><p>Revenue: {money(stats.revenue,business.currency)}</p><p>Costs: {money(stats.costTotal,business.currency)}</p><p>Fees + Shipping: {money(stats.fees,business.currency)}</p><p>Profit: {money(stats.profit,business.currency)}</p></section></>; }

createRoot(document.getElementById("root")).render(<App/>);

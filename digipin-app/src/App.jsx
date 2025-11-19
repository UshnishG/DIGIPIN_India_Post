import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Navigation, Layers, Copy, CheckCircle, 
  AlertCircle, Loader2, User, Shield, Lock, Unlock,
  QrCode, ChevronRight, BadgeCheck, Globe, Activity, 
  LogOut, Building2, Search, Truck, Key, Menu, X, Sparkles, 
  Trash2, GripVertical, Clock, Edit3
} from 'lucide-react';

// Mock Registered Partners for Dropdown
const REGISTERED_PARTNERS = [
  { id: "Amazon Logistics", name: "Amazon Logistics" },
  { id: "Zomato", name: "Zomato Delivery" },
  { id: "Uber", name: "Uber Rides" },
  { id: "Apollo", name: "Apollo Ambulance" },
  { id: "DHL", name: "DHL Express" }
];

const DigipinPlatform = () => {
  const [user, setUser] = useState(null); 
  const [activeView, setActiveView] = useState('dashboard'); 
  const [notification, setNotification] = useState(null);
  const [myAddresses, setMyAddresses] = useState([]);
  const [libReady, setLibReady] = useState(false); 
  
  const BASE_URL = "http://localhost:8000";

  useEffect(() => {
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLibReady(true);
      document.body.appendChild(script);
    } else {
      setLibReady(true);
    }
  }, []);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAuth = async (type, formData) => {
    try {
      const endpoint = type === 'register' ? '/auth/register' : '/auth/login';
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Auth Failed");

      if (type === 'login') {
        setUser(data.user);
        setActiveView('dashboard');
        showNotify(`Welcome, ${data.user.name}`);
        if (data.user.role === 'resident') fetchAddresses(data.user.email);
      } else {
        showNotify("Registration successful! Please login.");
      }
    } catch (e) {
      showNotify(e.message, "error");
    }
  };

  const fetchAddresses = async (email) => {
    try {
      const res = await fetch(`${BASE_URL}/user/my-addresses/${email}`);
      if (res.ok) {
        const data = await res.json();
        // Add local state for locking (mocking backend lock status)
        const enhancedData = data.map(addr => ({ ...addr, isLocked: false }));
        setMyAddresses(enhancedData);
      }
    } catch(e) { console.error(e); }
  };

  const renderContent = () => {
    if (!user) return <AuthPage onAuth={handleAuth} />;
    
    if (user.role === 'resident') {
      switch (activeView) {
        case 'dashboard': 
          return <ResidentDashboard 
            user={user} 
            addresses={myAddresses} 
            setAddresses={setMyAddresses} 
            onViewChange={setActiveView} 
            notify={showNotify}
            libReady={libReady}
          />;
        case 'registry': return <IdentityRegistry user={user} refreshAddresses={() => fetchAddresses(user.email)} baseUrl={BASE_URL} notify={showNotify} libReady={libReady} />;
        case 'consent': return <ConsentManager user={user} addresses={myAddresses} baseUrl={BASE_URL} notify={showNotify} libReady={libReady} />;
        default: return <ResidentDashboard user={user} addresses={myAddresses} setAddresses={setMyAddresses} onViewChange={setActiveView} notify={showNotify} libReady={libReady}/>;
      }
    } else {
      return <PartnerPortal user={user} baseUrl={BASE_URL} notify={showNotify} libReady={libReady} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <NavBar user={user} activeView={activeView} onViewChange={setActiveView} onLogout={() => setUser(null)} />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {renderContent()}
      </main>
      {notification && <NotificationToast msg={notification.msg} type={notification.type} />}
    </div>
  );
};

// --- COMPONENTS ---

const AuthPage = ({ onAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('resident');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 animate-in fade-in">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <MapPin className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-slate-500 text-sm mt-2">DIGIPIN Federated Platform</p>
        </div>

        <div className="bg-slate-50 p-1 rounded-xl flex border border-slate-200 mb-6">
          <button onClick={() => setRole('resident')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${role === 'resident' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>Resident</button>
          <button onClick={() => setRole('partner')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${role === 'partner' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>Partner</button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onAuth(isRegister ? 'register' : 'login', { ...form, role }); }} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name / Org</label>
              <input required className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Name" onChange={e => setForm({...form, full_name: e.target.value})} />
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
            <input required type="email" className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="email@example.com" onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
            <input required type="password" className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-2">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-indigo-600 font-medium hover:underline">
            {isRegister ? 'Already have an account? Sign in' : 'New user? Create account'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- RESIDENT DASHBOARD ---
const ResidentDashboard = ({ user, addresses, setAddresses, onViewChange, notify, libReady }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [previewAddress, setPreviewAddress] = useState(null); 
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (previewAddress && libReady && mapRef.current && window.L) {
      if (!mapInstance.current) {
        mapInstance.current = window.L.map(mapRef.current, { zoomControl: false }).setView([20.59, 78.96], 5);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);
      }
      mapInstance.current.invalidateSize();
      const lat = previewAddress.lat || 20.59;
      const lon = previewAddress.lon || 78.96;
      
      mapInstance.current.setView([lat, lon], 16);
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = window.L.marker([lat, lon]).addTo(mapInstance.current)
        .bindPopup(`<b>${previewAddress.alias}</b>`).openPopup();
    }
  }, [previewAddress, libReady]);

  const onDragStart = (e, index) => {
    setDraggedItem(addresses[index]);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (index) => {
    const draggedOverItem = addresses[index];
    if (draggedItem === draggedOverItem) return;
    const items = addresses.filter(item => item !== draggedItem);
    items.splice(index, 0, draggedItem);
    setAddresses(items);
  };

  const toggleLock = (idx) => {
    const newAddrs = [...addresses];
    newAddrs[idx].isLocked = !newAddrs[idx].isLocked;
    setAddresses(newAddrs);
    notify(newAddrs[idx].isLocked ? "Identity Locked 🔒" : "Identity Unlocked 🔓");
  };

  const deleteIdentity = (idx) => {
    if (window.confirm("Are you sure you want to delete this identity?")) {
      const newAddrs = addresses.filter((_, i) => i !== idx);
      setAddresses(newAddrs);
      notify("Identity Deleted", "success");
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-indigo-900 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hello, {user.name.split(' ')[0]}</h1>
          <p className="text-indigo-200">Your digital presence is secure.</p>
        </div>
        <button onClick={() => onViewChange('registry')} className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2">
          <User className="w-5 h-5" /> New Identity
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div onClick={() => onViewChange('registry')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><User className="w-6 h-6" /></div><div><div className="text-2xl font-bold text-slate-900">{addresses.length}</div><div className="text-sm text-slate-500">Identities</div></div></div>
          <div className="text-indigo-600 font-medium text-sm flex items-center gap-1">Manage Addresses <ChevronRight className="w-4 h-4" /></div>
        </div>
        <div onClick={() => onViewChange('consent')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group">
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><Shield className="w-6 h-6" /></div><div><div className="text-2xl font-bold text-slate-900">Privacy</div><div className="text-sm text-slate-500">Access Control</div></div></div>
          <div className="text-amber-600 font-medium text-sm flex items-center gap-1">Grant Permissions <ChevronRight className="w-4 h-4" /></div>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 mb-4 text-lg px-1">Your Digital Addresses (Drag to Reorder)</h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {addresses.length === 0 ? <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">No addresses found. Create one to get started.</div> : addresses.map((addr, i) => (
          <div 
            key={i}
            className={`bg-white p-5 rounded-2xl border shadow-sm transition-all relative group ${addr.isLocked ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-indigo-300'}`}
            onDragOver={() => onDragOver(i)}
          >
            <div 
              className="absolute top-4 right-4 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1"
              draggable
              onDragStart={(e) => onDragStart(e, i)}
            >
              <GripVertical className="w-5 h-5" />
            </div>

            <div className="cursor-pointer" onClick={() => setPreviewAddress(addr)}>
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${addr.isLocked ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                  {addr.alias.split('@')[1].substring(0,2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{addr.alias}</div>
                  <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block mt-1 border border-slate-200">{addr.digipin}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button onClick={() => toggleLock(i)} className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${addr.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                  {addr.isLocked ? <><Lock className="w-3 h-3" /> Locked</> : <><Unlock className="w-3 h-3" /> Active</>}
                </button>
              </div>
              <button onClick={() => deleteIdentity(i)} className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50" title="Delete Identity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewAddress && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewAddress(null)}>
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="h-64 bg-slate-100 relative">
               <div ref={mapRef} className="w-full h-full z-0" />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{previewAddress.alias}</h3>
                  <p className="text-sm text-slate-500 mt-1">{previewAddress.digipin}</p>
                </div>
                <button onClick={() => setPreviewAddress(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- REGISTRY WITH CUSTOM SUFFIX ---
const IdentityRegistry = ({ user, refreshAddresses, baseUrl, notify, libReady }) => {
  const [suffixMode, setSuffixMode] = useState('home');
  const [customSuffix, setCustomSuffix] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [createdData, setCreatedData] = useState(null);
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (libReady && mapRef.current && window.L && !mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current, { zoomControl: false }).setView([20.59, 78.96], 5);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
    }
  }, [libReady]);

  useEffect(() => {
    if (createdData && mapInstance.current) {
      const lat = createdData.lat || 20.59;
      const lon = createdData.lon || 78.96;
      mapInstance.current.invalidateSize();
      mapInstance.current.flyTo([lat, lon], 16, { duration: 1.5 });
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = window.L.marker([lat, lon]).addTo(mapInstance.current)
        .bindPopup(`<b>${createdData.digital_address}</b><br/>${createdData.digipin}`).openPopup();
    }
  }, [createdData]);

  const handleAiImprove = async () => {
    if (!address) return notify("Enter an address first", "error");
    setAiLoading(true);
    try {
      const improved = await callGemini(`Fix format, remove noise: "${address}". Return clean string only.`);
      if (improved) { setAddress(improved.trim()); notify("Address Enhanced ✨"); }
    } catch (e) { notify("AI Busy", "error"); } finally { setAiLoading(false); }
  };

  const handleReg = async () => {
    if (!address) return notify("Address required", "error");
    const finalSuffix = suffixMode === 'other' ? customSuffix.trim() : suffixMode;
    if (!finalSuffix) return notify("Handle name required", "error");

    setLoading(true);
    setCreatedData(null);
    try {
      const res = await fetch(`${baseUrl}/register-address`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ alias_suffix: finalSuffix, user_email: user.email, address_text: address })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail || "Failed");
      setCreatedData(data);
      notify(`Identity Minted!`);
      refreshAddresses();
    } catch(e) { notify(e.message, 'error'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      <div className="absolute top-6 left-6 bottom-auto z-10 w-full max-w-md animate-in slide-in-from-left-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Mint Identity</h2>
            <p className="text-slate-500 text-sm mt-1">Link a digital address to a physical location.</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Handle</label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="pl-3 font-bold text-slate-700">{user.email.split('@')[0]}@</div>
                <select 
                  className="flex-1 p-2 bg-transparent font-medium text-indigo-600 outline-none cursor-pointer" 
                  value={suffixMode} 
                  onChange={e => setSuffixMode(e.target.value)}
                >
                  <option value="home">home</option>
                  <option value="work">work</option>
                  <option value="shop">shop</option>
                  <option value="office">office</option>
                  <option value="other">Other (Custom)</option>
                </select>
              </div>
              {/* Custom Suffix Input */}
              {suffixMode === 'other' && (
                 <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                    <input 
                      className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/50 text-indigo-700 font-medium"
                      placeholder="Type custom handle name (e.g. gym, vacation)"
                      value={customSuffix}
                      onChange={e => setCustomSuffix(e.target.value)}
                    />
                 </div>
              )}
            </div>
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="text-xs font-bold text-slate-500 uppercase block">Physical Address</label>
                <button onClick={handleAiImprove} disabled={aiLoading} className="text-[10px] flex items-center gap-1 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-0.5 rounded transition-colors disabled:opacity-50">
                  
                </button>
              </div>
              <textarea className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] text-sm bg-slate-50" placeholder="Enter street address..." value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <button onClick={handleReg} disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" /> : <><BadgeCheck className="w-5 h-5" /> Mint Identity</>}
            </button>
          </div>
        </div>
      </div>
      {createdData && (
        <div className="absolute bottom-8 right-8 z-10 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-slate-200 max-w-xs animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-2 text-green-600 mb-2 font-bold text-sm uppercase tracking-wide">
            <CheckCircle className="w-4 h-4" /> Identity Created
          </div>
          <div className="text-xl font-bold text-indigo-900 mb-1">{createdData.digital_address}</div>
          <div className="font-mono text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg inline-block border border-slate-200 w-full text-center">
            {createdData.digipin}
          </div>
        </div>
      )}
    </div>
  );
};

// --- CONSENT (Partner Dropdown) ---
const ConsentManager = ({ user, addresses, baseUrl, notify, libReady }) => {
  const [partnerName, setPartnerName] = useState(REGISTERED_PARTNERS[0].id);
  const [selectedAlias, setSelectedAlias] = useState(addresses[0]?.alias || '');
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!selectedAlias && addresses.length > 0) setSelectedAlias(addresses[0].alias);
    if (selectedAlias) setSelectedAddressData(addresses.find(a => a.alias === selectedAlias));
  }, [addresses, selectedAlias]);

  useEffect(() => {
    if (libReady && mapRef.current && window.L && !mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current, { zoomControl: false }).setView([20.59, 78.96], 4);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
    }
  }, [libReady]);

  useEffect(() => {
    if (selectedAddressData && selectedAddressData.lat && mapInstance.current) {
      mapInstance.current.invalidateSize();
      mapInstance.current.flyTo([selectedAddressData.lat, selectedAddressData.lon], 15);
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = window.L.marker([selectedAddressData.lat, selectedAddressData.lon]).addTo(mapInstance.current);
    }
  }, [selectedAddressData]);

  const grant = async () => {
    if (!selectedAlias || !partnerName) return notify("Fill all fields", "error");
    if (selectedAddressData?.isLocked) return notify("This identity is LOCKED 🔒. Unlock it first.", "error");

    try {
      const res = await fetch(`${baseUrl}/grant-consent`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ digital_address_alias: selectedAlias, requester_id: partnerName, duration_minutes: 60 })
      });
      if(!res.ok) throw new Error("Failed");
      notify(`Access granted to ${partnerName}`);
    } catch(e) { notify("Error", "error"); }
  };

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      <div className="absolute top-6 left-6 bottom-auto z-10 w-full max-w-md animate-in slide-in-from-left-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Grant Access</h2>
            <p className="text-slate-500 text-sm mt-1">Securely share your location data.</p>
          </div>
          <div className="space-y-5">
            
            <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Select Partner</label>
               <select 
                 className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" 
                 value={partnerName}
                 onChange={e => setPartnerName(e.target.value)}
               >
                 {REGISTERED_PARTNERS.map(p => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
            </div>

            <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">Select Identity</label>
               {addresses.length > 0 ? (
                 <select 
                   className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer" 
                   value={selectedAlias}
                   onChange={e => setSelectedAlias(e.target.value)}
                 >
                   {addresses.map(a => <option key={a.alias} value={a.alias}>{a.alias} {a.isLocked ? '(Locked)' : ''}</option>)}
                 </select>
               ) : <div className="text-red-500 italic text-sm">No identities found.</div>}
            </div>

            <button onClick={grant} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all">
               <Lock className="w-4 h-4" /> Grant Access (60 mins)
             </button>
          </div>
        </div>
      </div>
      
      {selectedAddressData && (
        <div className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Previewing</div>
          <div className="font-bold text-slate-900">{selectedAddressData.alias}</div>
          <div className="text-xs font-mono text-slate-500">{selectedAddressData.digipin}</div>
        </div>
      )}
    </div>
  );
};

// --- PARTNER PORTAL (With Timers) ---
const PartnerPortal = ({ user, baseUrl, notify, libReady }) => {
  const [consents, setConsents] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [timers, setTimers] = useState({});
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const fetchConsents = async () => {
      try {
        const res = await fetch(`${baseUrl}/partner/my-consents?partner_name=${encodeURIComponent(user.name)}`);
        if (res.ok) {
            const data = await res.json();
            setConsents(data);
        }
      } catch(e) { console.error(e); }
    };
    fetchConsents();
    const poll = setInterval(fetchConsents, 30000);
    return () => clearInterval(poll);
  }, [user.name, baseUrl]);

  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const newTimers = {};
      consents.forEach(c => {
        const end = new Date(c.expires_at);
        const diff = end - now;
        if (diff > 0) {
          const mins = Math.floor((diff % 3600000) / 60000);
          newTimers[c.alias] = `${mins}m left`;
        } else {
          newTimers[c.alias] = "Expired";
        }
      });
      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, [consents]);

  useEffect(() => {
    if (libReady && mapRef.current && window.L && !mapInstance.current) {
      mapInstance.current = window.L.map(mapRef.current, { zoomControl: false }).setView([20.59, 78.96], 4);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
    }
  }, [libReady]);

  useEffect(() => {
    if (selectedData && selectedData.lat && mapInstance.current) {
      mapInstance.current.invalidateSize();
      mapInstance.current.flyTo([selectedData.lat, selectedData.lon], 16);
      setAiInsights(null);
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = window.L.marker([selectedData.lat, selectedData.lon]).addTo(mapInstance.current)
        .bindPopup(`<b>${selectedData.alias}</b><br/>${selectedData.digipin}`).openPopup();
    }
  }, [selectedData]);

  const analyzeLocation = async () => {
    if (!selectedData) return;
    setAiLoading(true);
    try {
      const prompt = `Analyze location context: "${selectedData.address}". Type (Home/Office)? Best delivery time? Short.`;
      const insight = await callGemini(prompt);
      setAiInsights(insight);
    } catch(e) { notify("AI Error", "error"); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      <div className="absolute top-6 left-6 bottom-6 z-10 w-full max-w-sm pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 flex flex-col h-full pointer-events-auto">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Truck className="text-indigo-600"/> Access List</h2>
            <p className="text-xs text-slate-500 mt-1">Active consents for "{user.name}"</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {consents.length === 0 ? (
              <div className="text-center text-slate-400 mt-10 px-4">
                <Lock className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No active consents found.</p>
              </div>
            ) : (
              consents.map((c, i) => (
                <div key={i} onClick={() => setSelectedData(c)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedData === c ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 hover:bg-slate-50 hover:border-indigo-200'}`}>
                  <div className="font-bold text-sm text-slate-900 flex justify-between items-start">
                      <div>{c.alias} <span className="block text-[10px] font-mono text-slate-500 mt-0.5">{c.digipin}</span></div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${timers[c.alias] === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          <Clock className="w-3 h-3" /> {timers[c.alias] || '...'}
                      </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 line-clamp-1">{c.address}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const NavBar = ({ user, activeView, onViewChange, onLogout }) => (
  <nav className="bg-white border-b h-16 flex items-center justify-between px-6 shrink-0 z-50 relative shadow-sm">
    <div className="flex items-center gap-2 text-xl font-bold text-slate-900 tracking-tight">
      <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><MapPin className="w-5 h-5" /></div> DIGIPIN
    </div>
    {user && (
      <div className="flex items-center gap-6">
        {user.role === 'resident' && (
          <div className="hidden md:flex gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <NavBtn active={activeView === 'dashboard'} onClick={() => onViewChange('dashboard')} label="Dashboard" />
            <NavBtn active={activeView === 'registry'} onClick={() => onViewChange('registry')} label="Registry" />
            <NavBtn active={activeView === 'consent'} onClick={() => onViewChange('consent')} label="Consent" />
          </div>
        )}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500 capitalize font-medium">{user.role}</div>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Sign Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    )}
  </nav>
);

const NavBtn = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-900'}`}>
    {label}
  </button>
);

const NotificationToast = ({ msg, type }) => (
  <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[1000] animate-in slide-in-from-right-5 ${type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-slate-900 text-white border border-slate-800'}`}>
    {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
    <span className="font-medium text-sm">{msg}</span>
  </div>
);

export default DigipinPlatform;
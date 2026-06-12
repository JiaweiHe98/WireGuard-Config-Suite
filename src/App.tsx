import { useState, useEffect } from 'react';
import { ServerSettings } from './components/ServerSettings';
import { ClientManager } from './components/ClientManager';
import { ConfigViewer } from './components/ConfigViewer';
import { ServerSettingsType, ClientType, FirewallType, RouteType } from './types';
import { generateSecureKey, getMockPublicKey, getNextIpAddress } from './utils';
import { ShieldAlert, BookOpen, ExternalLink, ShieldCheck, Cpu, Sun, Moon, RefreshCw } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('wg_theme');
    return (saved === 'light' || saved === 'dark') ? (saved as 'light' | 'dark') : 'light';
  });

  const [settings, setSettings] = useState<ServerSettingsType>(() => {
    const saved = localStorage.getItem('wg_server_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    // Default fallback settings
    const priv = generateSecureKey();
    return {
      privateKey: priv,
      publicKey: getMockPublicKey(priv),
      interfaceCidr: '10.8.0.1/24',
      listenPort: 51820,
      publicEndpoint: '159.203.41.98', // A placeholder default endpoint to show functional configurations instantly
      dnsServers: '1.1.1.1, 1.0.0.1',
      enableFirewall: true,
      firewallType: FirewallType.IPTABLES,
      networkInterface: 'eth0',
    };
  });

  const [clients, setClients] = useState<ClientType[]>(() => {
    const saved = localStorage.getItem('wg_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved clients:', e);
      }
    }

    // Default seed clients to make app immediately useful
    const c1Priv = generateSecureKey();
    const c2Priv = generateSecureKey();
    return [
      {
        id: 'cli-1',
        name: 'iPhone-Cellular',
        privateKey: c1Priv,
        publicKey: getMockPublicKey(c1Priv),
        preSharedKey: '',
        assignedIp: '10.8.0.2/32',
        routeType: RouteType.ALL_TRAFFIC,
        customAllowedIps: '',
        persistentKeepalive: 25,
        dnsOverride: '',
      },
      {
        id: 'cli-2',
        name: 'Macbook-Pro',
        privateKey: c2Priv,
        publicKey: getMockPublicKey(c2Priv),
        preSharedKey: generateSecureKey(),
        assignedIp: '10.8.0.3/32',
        routeType: RouteType.ALL_TRAFFIC,
        customAllowedIps: '',
        persistentKeepalive: 0,
        dnsOverride: '',
      },
    ];
  });

  const [selectedClientId, setSelectedClientId] = useState<string | null>(() => {
    const saved = localStorage.getItem('wg_selected_client_id');
    return saved || 'cli-1';
  });

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('wg_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('wg_server_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('wg_clients', JSON.stringify(clients));
    // If our selected client was deleted, fall back to first client
    if (selectedClientId && !clients.some((c) => c.id === selectedClientId)) {
      setSelectedClientId(clients[0]?.id || null);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (selectedClientId) {
      localStorage.setItem('wg_selected_client_id', selectedClientId);
    } else {
      localStorage.removeItem('wg_selected_client_id');
    }
  }, [selectedClientId]);

  // Recalculates all subsequent client IP assignments if the server interface CIDR modifications occur
  // to avoid clients having broken IP mappings that fall outside the new range!
  useEffect(() => {
    const updated = clients.map((client, idx) => {
      const freshIp = getNextIpAddress(settings.interfaceCidr, idx);
      if (client.assignedIp !== freshIp) {
        return { ...client, assignedIp: freshIp };
      }
      return client;
    });

    // Check if any IP actually changed before updating state to avoid infinite rendering cycles
    const didChange = updated.some((c, i) => c.assignedIp !== clients[i].assignedIp);
    if (didChange) {
      setClients(updated);
    }
  }, [settings.interfaceCidr]);

  const handleAddClient = (newClient: ClientType) => {
    setClients((prev) => [...prev, newClient]);
    setSelectedClientId(newClient.id);
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateClient = (id: string, updated: ClientType) => {
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const handleClearPersistence = () => {
    if (window.confirm('Are you sure you want to revert all parameters to defaults? Your active overrides will be cleared.')) {
      localStorage.removeItem('wg_server_settings');
      localStorage.removeItem('wg_clients');
      localStorage.removeItem('wg_selected_client_id');
      localStorage.removeItem('wg_theme');
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Main Headers */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-10 pb-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Glowing Logo */}
            <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500 blur-sm opacity-50"></div>
              <Cpu className="w-7 h-7 text-white relative z-10" />
            </div>

            <div>
              <h1 className={`font-sans font-extrabold text-2xl sm:text-3xl tracking-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-50'
              }`}>
                WireGuard Config Suite
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Visual interface to declare, manage peers, and export client & host parameters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Day/Night view button */}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer select-none ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-sm shadow-slate-100/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Day/Night view"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Reset Defaults button */}
            <button
              onClick={handleClearPersistence}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-650 hover:border-red-200 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-red-950/15 hover:text-red-400 hover:border-red-900/50'
              }`}
              title="Reset all settings to defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <a
              href="https://www.wireguard.com/"
              target="_blank"
              referrerPolicy="no-referrer"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              Official Guide <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Informational Banner */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 mb-8">
        <div className={`border rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 shadow-sm transition-colors ${
          theme === 'light' 
            ? 'bg-indigo-50/40 border-indigo-100 shadow-slate-100/50' 
            : 'bg-gradient-to-r from-indigo-950/20 to-slate-900 border-indigo-950/80 shadow-lg'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 border rounded-xl mt-0.5 flex-shrink-0 ${
              theme === 'light'
                ? 'bg-indigo-100/50 border-indigo-150 text-indigo-600'
                : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="max-w-xl">
              <h3 className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>How to establish your secure tunnel:</h3>
              <p className={`text-xs mt-1 leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Configure your public server settings in <strong>Step 1</strong>, manage client configurations in <strong>Step 2</strong>, and preview or download complete configuration file sets or scan client mobile QR codes under <strong>Step 3</strong>.
              </p>
            </div>
          </div>

          {!settings.publicEndpoint && (
            <div className={`flex items-center gap-2 border rounded-xl px-4 py-3.5 text-xs ${
              theme === 'light'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-yellow-950/30 border border-yellow-900/30 text-yellow-500'
            }`}>
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <div>
                <strong>Action Needed:</strong> Define a Public Server Endpoint to complete your client profiles.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Workspace LayoutGrid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pb-16">
        {/* Left Side: Parameters and Client list */}
        <div className="flex flex-col gap-6">
          <ServerSettings settings={settings} onChange={setSettings} theme={theme} />
          <ClientManager
            clients={clients}
            serverSettings={settings}
            selectedClientId={selectedClientId}
            onSelectClient={setSelectedClientId}
            onAddClient={handleAddClient}
            onDeleteClient={handleDeleteClient}
            onUpdateClient={handleUpdateClient}
            theme={theme}
          />
        </div>

        {/* Right Side: Render configs */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <ConfigViewer
            serverSettings={settings}
            clients={clients}
            selectedClientId={selectedClientId}
            theme={theme}
          />
        </div>
      </main>
    </div>
  );
}

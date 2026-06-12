import React, { useState } from 'react';
import { ClientType, RouteType, ServerSettingsType } from '../types';
import { generateSecureKey, getMockPublicKey, getNextIpAddress, isValidPrivateKey } from '../utils';
import { Users, Plus, Trash2, Smartphone, Laptop, HardDrive, Key, HelpCircle, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface ClientManagerProps {
  clients: ClientType[];
  serverSettings: ServerSettingsType;
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  onAddClient: (client: ClientType) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, updated: ClientType) => void;
  theme: 'light' | 'dark';
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  serverSettings,
  selectedClientId,
  onSelectClient,
  onAddClient,
  onDeleteClient,
  onUpdateClient,
  theme,
}) => {
  // Local state for the "Add Client" modal/form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [presharedKeyEnabled, setPresharedKeyEnabled] = useState(false);
  const [devicePreset, setDevicePreset] = useState<'phone' | 'laptop' | 'other'>('laptop');
  const [routeType, setRouteType] = useState<RouteType>(RouteType.ALL_TRAFFIC);
  const [customAllowedIps, setCustomAllowedIps] = useState('192.168.1.0/24');
  const [dnsOverride, setDnsOverride] = useState('');
  const [persistentKeepalive, setPersistentKeepalive] = useState(0); // Default: none/0, or 25s
  
  // Custom keypair states
  const [customPrivateKeyEnabled, setCustomPrivateKeyEnabled] = useState(false);
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [showAddPrivateKey, setShowAddPrivateKey] = useState(true);
  const [showEditPrivateKey, setShowEditPrivateKey] = useState(true);

  const isLight = theme === 'light';
  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;

  const resetAddForm = () => {
    setNewClientName('');
    setPresharedKeyEnabled(false);
    setDevicePreset('laptop');
    setRouteType(RouteType.ALL_TRAFFIC);
    setCustomAllowedIps('192.168.1.0/24');
    setDnsOverride('');
    setPersistentKeepalive(0);
    setCustomPrivateKeyEnabled(false);
    setCustomPrivateKey('');
    setShowAddPrivateKey(true);
    setShowAddForm(false);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newClientName.trim() || `Client-${clients.length + 1}`;
    
    let clientPrivateKey = '';
    if (customPrivateKeyEnabled && customPrivateKey.trim()) {
      const trimmedKey = customPrivateKey.trim();
      if (!isValidPrivateKey(trimmedKey)) {
        alert('Invalid private key format. Must be a 32-byte Base64 encoded string (44 characters ending with =).');
        return;
      }
      clientPrivateKey = trimmedKey;
    } else {
      clientPrivateKey = generateSecureKey();
    }

    const clientPublicKey = getMockPublicKey(clientPrivateKey);
    const psk = presharedKeyEnabled ? generateSecureKey() : '';
    
    // Auto-calculate the next safe IP based on the current number of clients
    const clientIp = getNextIpAddress(serverSettings.interfaceCidr, clients.length);

    const newClient: ClientType = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      privateKey: clientPrivateKey,
      publicKey: clientPublicKey,
      preSharedKey: psk,
      assignedIp: clientIp,
      routeType,
      customAllowedIps: routeType === RouteType.CUSTOM ? customAllowedIps : '',
      persistentKeepalive,
      dnsOverride,
      includeInConfig: true,
    };

    onAddClient(newClient);
    resetAddForm();
  };

  const getDeviceIcon = (preset: string) => {
    switch (preset) {
      case 'phone':
        return <Smartphone className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />;
      case 'laptop':
        return <Laptop className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />;
      default:
        return <HardDrive className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />;
    }
  };

  return (
    <div 
      id="wg-client-manager-root" 
      className={`border rounded-2xl p-6 shadow-xl flex flex-col gap-6 transition-colors ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-100/40' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
    >
      <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div 
            id="icon-client-badge" 
            className={`p-2.5 border rounded-xl ${
              isLight 
                ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`font-sans font-semibold text-lg tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              2. Client Peers ({clients.length})
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Add secure users or individual client devices</p>
          </div>
        </div>

        {!showAddForm && (
          <button
            id="btn-add-client-toggle"
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 font-sans font-medium text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Peer
          </button>
        )}
      </div>

      {showAddForm && (
        <form 
          onSubmit={handleCreateClient} 
          className={`border rounded-xl p-5 flex flex-col gap-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
          }`}
        >
          <h3 className={`text-xs font-semibold uppercase tracking-wider select-none ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
            Configure New Peer Profile
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Device Friendly Name</label>
              <input
                id="input-new-client-name"
                type="text"
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800/80 text-slate-100'
                }`}
                placeholder="e.g. iPhone-Vance or Home-PC"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Device Type Preset</label>
              <div className="grid grid-cols-3 gap-2">
                {(['phone', 'laptop', 'other'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDevicePreset(preset)}
                    className={`text-xs py-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      devicePreset === preset
                        ? isLight
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-semibold'
                          : 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                        : isLight
                          ? 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    {getDeviceIcon(preset)}
                    <span className="capitalize">{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Routing / Split-Tunneling
                <span className="tooltip group relative cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className={`absolute text-[10px] w-52 p-2 rounded-lg -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none border z-10 ${
                    isLight ? 'bg-white border-slate-200 text-slate-700 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                    <strong>All Traffic</strong> routes everything via VPN. <strong>VPN Only</strong> routes only the VPN subnet itself (split tunneling).
                  </span>
                </span>
              </label>
              <select
                id="select-route-type"
                className={`border rounded-lg px-3 py-2 text-xs cursor-pointer focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-200'
                }`}
                value={routeType}
                onChange={(e) => setRouteType(e.target.value as RouteType)}
              >
                <option value={RouteType.ALL_TRAFFIC}>Route ALL Traffic (Secure Gateway)</option>
                <option value={RouteType.VPN_ONLY}>Route VPN Only (Split Tunneling)</option>
                <option value={RouteType.CUSTOM}>Route Custom IP Range</option>
              </select>
            </div>

            {routeType === RouteType.CUSTOM && (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Custom Allowed IPs Subnets</label>
                <input
                  id="input-custom-allowed-ips"
                  type="text"
                  className={`border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-100'
                  }`}
                  placeholder="e.g. 192.168.1.0/24, 10.0.0.0/8"
                  value={customAllowedIps}
                  onChange={(e) => setCustomAllowedIps(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Persistent Keepalive
                <span className="tooltip group relative cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className={`absolute text-[10px] w-52 p-2 rounded-lg -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none border z-10 ${
                    isLight ? 'bg-white border-slate-200 text-slate-700 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                    Keeps vpn channel open when clients live behind a NAT or firewall. 25 seconds is recommended for mobile clients.
                  </span>
                </span>
              </label>
              <select
                id="select-persistent-keepalive"
                className={`border rounded-lg px-3 py-2 text-xs cursor-pointer focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-200'
                }`}
                value={persistentKeepalive}
                onChange={(e) => setPersistentKeepalive(parseInt(e.target.value) || 0)}
              >
                <option value={0}>Disabled (Default - saves battery)</option>
                <option value={15}>15 sec (High Frequency)</option>
                <option value={25}>25 sec (Recommended NAT / Mobile)</option>
                <option value={60}>60 sec (Background keepalive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium flex items-center justify-between">
                <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Preshared Key (Post-Quantum Security)</span>
                <button
                  type="button"
                  onClick={() => setPresharedKeyEnabled(!presharedKeyEnabled)}
                  className={`transition-colors cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {presharedKeyEnabled ? (
                    <span className="flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-600 dark:text-emerald-400">
                      <Key className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <span className="text-[11px] font-sans font-medium text-slate-400 dark:text-slate-500">Disabled</span>
                  )}
                </button>
              </label>
              <div className={`border rounded-lg p-2.5 flex items-center justify-between ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Adds an extra layer of symmetric cryptography.</span>
                <button
                  id="btn-toggle-preshared-key"
                  type="button"
                  onClick={() => setPresharedKeyEnabled(!presharedKeyEnabled)}
                  className={`transition-colors cursor-pointer ${isLight ? 'text-slate-400 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}
                >
                  {presharedKeyEnabled ? (
                    <ToggleRight className="w-7 h-7 text-indigo-600 dark:text-indigo-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Custom Client DNS Override</label>
              <input
                id="input-dns-override"
                type="text"
                className={`border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-100 placeholder:text-slate-600'
                }`}
                placeholder="Leave blank to inherit Server DNS"
                value={dnsOverride}
                onChange={(e) => setDnsOverride(e.target.value)}
              />
            </div>
          </div>

          {/* Custom key section when adding client */}
          <div className={`border-t pt-3 flex flex-col gap-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <label className="text-xs font-medium flex items-center justify-between">
              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Custom Keypair Deployment</span>
              <button
                type="button"
                onClick={() => setCustomPrivateKeyEnabled(!customPrivateKeyEnabled)}
                className={`transition-colors cursor-pointer text-xs font-bold ${
                  customPrivateKeyEnabled 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {customPrivateKeyEnabled ? '✓ Manual Private Key Mode' : '+ Use Custom Private Key'}
              </button>
            </label>

            {customPrivateKeyEnabled && (
              <div className="flex flex-col gap-3 mt-1 animate-fadeIn">
                <div className="flex flex-col gap-1 text-xs">
                  <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Input Private Key</span>
                  <div className="relative flex items-center">
                    <input
                      id="input-create-custom-privkey"
                      type={showAddPrivateKey ? 'text' : 'password'}
                      className={`w-full border rounded-lg pl-3 pr-20 py-1.5 font-mono text-xs tracking-wide focus:outline-none focus:border-indigo-500 ${
                        isLight 
                          ? 'bg-white border-slate-200 text-slate-700' 
                          : 'bg-slate-900 border-slate-800/80 text-slate-300'
                      } ${customPrivateKey && !isValidPrivateKey(customPrivateKey) ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Paste 32-byte Base64 key..."
                      value={customPrivateKey}
                      onChange={(e) => setCustomPrivateKey(e.target.value.trim())}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddPrivateKey(!showAddPrivateKey)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer p-0.5"
                        title={showAddPrivateKey ? "Hide Key" : "Show Key"}
                      >
                        {showAddPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {isValidPrivateKey(customPrivateKey) ? (
                        <span className="text-emerald-500 font-bold text-sm" title="Valid Key">✓</span>
                      ) : (
                        <span className="text-red-500 font-extrabold text-sm" title="Invalid Private Key (Must be 32-byte Base64, e.g. 44 characters ending with =)">✗</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Derived Public Key</span>
                  <div className={`border rounded-lg px-3 py-1.5 font-mono text-xs select-all truncate tracking-wide ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800/80 text-slate-400'
                  }`}>
                    {isValidPrivateKey(customPrivateKey) ? getMockPublicKey(customPrivateKey) : '(Enter valid key)'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center justify-end gap-3 border-t pt-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <button
              id="btn-cancel-add-client"
              type="button"
              onClick={resetAddForm}
              className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              id="btn-save-new-client"
              type="submit"
              className="px-4.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
            >
              Save Peer Profile
            </button>
          </div>
        </form>
      )}

      {/* List of active clients */}
      {clients.length === 0 ? (
        <div className={`border border-dashed rounded-2xl py-10 px-4 text-center flex flex-col items-center justify-center gap-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <Users className={`w-8 h-8 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
          <div>
            <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>No peers defined yet</p>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Add a client peer to generate customized Client profiles, download files, or scan QR codes.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clients.map((client) => {
            const isSelected = selectedClientId === client.id;
            const isPhone = client.name.toLowerCase().includes('phone') || client.name.toLowerCase().includes('ios') || client.name.toLowerCase().includes('android');
            const isLaptop = client.name.toLowerCase().includes('pc') || client.name.toLowerCase().includes('mac') || client.name.toLowerCase().includes('laptop') || client.name.toLowerCase().includes('work');
            
            let presetIcon = <HardDrive className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />;
            if (isPhone) {
              presetIcon = <Smartphone className={`w-4 h-4 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />;
            } else if (isLaptop) {
              presetIcon = <Laptop className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />;
            }

            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={`group relative border-y border-r border-l-4 rounded-xl p-4 cursor-pointer text-left transition-all ${
                  isSelected
                    ? isLight
                      ? 'bg-indigo-50/90 border-y-indigo-400 border-r-indigo-400 shadow-sm shadow-indigo-100/30'
                      : 'bg-indigo-950/25 border-y-indigo-500 border-r-indigo-500 shadow-md shadow-indigo-950/10'
                    : isLight
                      ? 'bg-slate-50 border-y-slate-200 border-r-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      : 'bg-slate-950/60 border-y-slate-800/80 border-r-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                } ${
                  client.includeInConfig !== false
                    ? isSelected
                      ? 'border-l-indigo-600 dark:border-l-indigo-500'
                      : 'border-l-emerald-500 dark:border-l-emerald-400'
                    : 'border-l-slate-300 dark:border-l-slate-700 opacity-65 saturate-[60%]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300' 
                        : isLight ? 'bg-white border border-slate-200 text-slate-500' : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}>
                      {presetIcon}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold transition-colors truncate max-w-[100px] ${
                        isSelected 
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                          : isLight ? 'text-slate-800 group-hover:text-indigo-600' : 'text-slate-200 group-hover:text-indigo-400'
                      }`} title={client.name}>
                        {client.name}
                      </h4>
                      <p className={`font-mono text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {client.assignedIp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-center">
                    {/* Premium Custom Toggle Switch */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card selection toggle
                        onUpdateClient(client.id, {
                          ...client,
                          includeInConfig: client.includeInConfig === false,
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        client.includeInConfig !== false
                          ? 'bg-emerald-500 dark:bg-emerald-600'
                          : 'bg-slate-300 dark:bg-slate-800'
                      }`}
                      title={client.includeInConfig === false ? "Excluded from Server config. Click to include." : "Included in Server config. Click to exclude."}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          client.includeInConfig !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>

                    <button
                      id={`btn-delete-${client.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClient(client.id);
                      }}
                      className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100/40 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove peer config"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* mini specification tags */}
                <div className={`flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t ${isLight ? 'border-slate-200/60' : 'border-slate-800/60'}`}>
                  <span className={`text-[9px] px-1.5 py-0.5 border rounded ${
                    isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {client.routeType === RouteType.ALL_TRAFFIC ? 'Full Tunnel' : 'Split Tunnel'}
                  </span>
                  {client.preSharedKey && (
                    <span className={`text-[9px] px-1.5 py-0.5 border rounded flex items-center gap-0.5 ${
                      isLight 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-emerald-900/10 text-emerald-405 border-emerald-900/20'
                    }`}>
                      <Key className="w-2 h-2" /> PSK
                    </span>
                  )}
                  {client.persistentKeepalive > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 border rounded ${
                      isLight 
                        ? 'bg-cyan-50 text-cyan-700 border-cyan-100' 
                        : 'bg-cyan-900/10 text-cyan-400 border-cyan-800/20'
                    }`}>
                      KA: {client.persistentKeepalive}s
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected client editor */}
      {selectedClientId && selectedClient && (
        <div id="selected-client-editor" className={`border rounded-xl p-5 mt-2 flex flex-col gap-4 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                Edit Selected Peer Settings: {selectedClient.name}
              </span>
            </div>
            <span className={`text-[10px] font-mono select-none px-2 py-0.5 rounded ${isLight ? 'bg-indigo-100/60 text-indigo-700' : 'bg-indigo-500/10 text-indigo-300'}`}>
              Auto-saves to browser
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-xs">
              <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Friendly Peer Name</label>
              <input
                id="edit-client-name"
                type="text"
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800/80 text-slate-100'
                }`}
                value={selectedClient.name}
                onChange={(e) => onUpdateClient(selectedClient.id, { ...selectedClient, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Tunnel Allocated IP Address</label>
              <input
                id="edit-client-ip"
                type="text"
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800/80 text-slate-100'
                }`}
                value={selectedClient.assignedIp}
                onChange={(e) => onUpdateClient(selectedClient.id, { ...selectedClient, assignedIp: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-xs">
              <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Routing / Tunnel Type</label>
              <select
                id="edit-client-route"
                className={`border rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-200'
                }`}
                value={selectedClient.routeType}
                onChange={(e) => {
                  const val = e.target.value as RouteType;
                  onUpdateClient(selectedClient.id, { 
                    ...selectedClient, 
                    routeType: val,
                    customAllowedIps: val === RouteType.CUSTOM ? (selectedClient.customAllowedIps || '192.168.1.0/24') : '' 
                  });
                }}
              >
                <option value={RouteType.ALL_TRAFFIC}>Route ALL Traffic (Secure Gateway)</option>
                <option value={RouteType.VPN_ONLY}>Route VPN Only (Split Tunneling)</option>
                <option value={RouteType.CUSTOM}>Route Custom IP Subnets</option>
              </select>
            </div>

            {selectedClient.routeType === RouteType.CUSTOM && (
              <div className="flex flex-col gap-1.5 text-xs animate-fadeIn">
                <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Custom Allowed IPs Subnets</label>
                <input
                  id="edit-client-custom-ips"
                  type="text"
                  className={`border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-100'
                  }`}
                  value={selectedClient.customAllowedIps || ''}
                  onChange={(e) => onUpdateClient(selectedClient.id, { ...selectedClient, customAllowedIps: e.target.value })}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-xs">
              <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Persistent Keepalive</label>
              <select
                id="edit-client-keepalive"
                className={`border rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-200'
                }`}
                value={selectedClient.persistentKeepalive}
                onChange={(e) => onUpdateClient(selectedClient.id, { ...selectedClient, persistentKeepalive: parseInt(e.target.value) || 0 })}
              >
                <option value={0}>Disabled</option>
                <option value={15}>15 seconds (High activity)</option>
                <option value={25}>25 seconds (Recommended NAT/Mobile)</option>
                <option value={60}>60 seconds</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-xs">
              <label className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Custom Client DNS Override</label>
              <input
                id="edit-client-dns"
                type="text"
                className={`border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-550 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-100 placeholder:text-slate-600'
                }`}
                placeholder="Leave blank to inherit Server DNS"
                value={selectedClient.dnsOverride || ''}
                onChange={(e) => onUpdateClient(selectedClient.id, { ...selectedClient, dnsOverride: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className={`font-semibold flex items-center justify-between ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span>Preshared Key (Optional)</span>
                <button
                  type="button"
                  onClick={() => {
                    const freshPsk = selectedClient.preSharedKey ? '' : generateSecureKey();
                    onUpdateClient(selectedClient.id, { ...selectedClient, preSharedKey: freshPsk });
                  }}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  {selectedClient.preSharedKey ? 'Remove PSK' : 'Generate PSK'}
                </button>
              </label>
              <input
                id="edit-client-psk"
                type="text"
                className={`border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-100 placeholder:text-slate-500'
                }`}
                placeholder="No pre-shared key config"
                value={selectedClient.preSharedKey || ''}
                onChange={(e) => onUpdateClient(selectedClient.id, { ...selectedClient, preSharedKey: e.target.value.trim() })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t pt-3 border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Client Private Key</span>
                <button
                  type="button"
                  onClick={() => {
                    const freshPriv = generateSecureKey();
                    const freshPub = getMockPublicKey(freshPriv);
                    onUpdateClient(selectedClient.id, { 
                      ...selectedClient, 
                      privateKey: freshPriv, 
                      publicKey: freshPub 
                    });
                  }}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5 animate-spin-hover" /> Regenerate Client Key
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="edit-client-private-key"
                  type={showEditPrivateKey ? 'text' : 'password'}
                  className={`w-full border rounded-lg pl-3 pr-20 py-2.5 font-mono text-xs tracking-wide focus:outline-none focus:border-indigo-500 ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-700' 
                      : 'bg-slate-900 border-slate-800/80 text-slate-300'
                  } ${!isValidPrivateKey(selectedClient.privateKey) ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={selectedClient.privateKey}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const isValid = isValidPrivateKey(val);
                    const derivedPub = isValid ? getMockPublicKey(val) : '(Invalid Private Key)';
                    onUpdateClient(selectedClient.id, { 
                      ...selectedClient, 
                      privateKey: val, 
                      publicKey: derivedPub 
                    });
                  }}
                  placeholder="Paste or type private key..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowEditPrivateKey(!showEditPrivateKey)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer p-0.5"
                    title={showEditPrivateKey ? "Hide Key" : "Show Key"}
                  >
                    {showEditPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {isValidPrivateKey(selectedClient.privateKey) ? (
                    <span className="text-emerald-500 font-bold text-sm" title="Valid Key">✓</span>
                  ) : (
                    <span className="text-red-500 font-extrabold text-sm" title="Invalid Private Key (Must be 32-byte Base64, e.g. 44 characters ending with =)">✗</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'} mb-1`}>Client Public Key (Auto-calculated)</span>
              <div className={`border rounded-lg px-3 py-2.5 font-mono text-xs select-all truncate tracking-wide bg-opacity-50 ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800/80 text-slate-400'
              }`}>
                {selectedClient.publicKey}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

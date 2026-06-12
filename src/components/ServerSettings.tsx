import React, { useState } from 'react';
import { ServerSettingsType, FirewallType } from '../types';
import { generateSecureKey, getMockPublicKey, isValidPrivateKey } from '../utils';
import { Shield, Key, Network, Server, HelpCircle, RefreshCw, Info } from 'lucide-react';

interface ServerSettingsProps {
  settings: ServerSettingsType;
  onChange: (updated: ServerSettingsType) => void;
  theme: 'light' | 'dark';
}

export const ServerSettings: React.FC<ServerSettingsProps> = ({ settings, onChange, theme }) => {
  const [showKeyInfo, setShowKeyInfo] = useState(false);
  const isLight = theme === 'light';

  const handleRegenerateKeys = () => {
    const privateKey = generateSecureKey();
    const publicKey = getMockPublicKey(privateKey);
    onChange({ ...settings, privateKey, publicKey });
  };

  const updateField = (key: keyof ServerSettingsType, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  // Preset subnets
  const subnetPresets = [
    { label: '10.8.0.1/24 (Default)', val: '10.8.0.1/24' },
    { label: '192.168.100.1/24', val: '192.168.100.1/24' },
    { label: '10.0.0.1/24', val: '10.0.0.1/24' },
  ];

  // Preset DNS
  const dnsPresets = [
    { label: 'Cloudflare', val: '1.1.1.1, 1.0.0.1' },
    { label: 'Google', val: '8.8.8.8, 8.8.4.4' },
    { label: 'AdGuard Privacy', val: '94.140.14.14, 94.140.15.15' },
    { label: 'None (Decentralized)', val: '' },
  ];

  return (
    <div 
      id="wg-server-settings-root" 
      className={`border rounded-2xl p-6 shadow-xl flex flex-col gap-6 transition-colors ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-100/40' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
    >
      <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div 
            id="icon-server-badge" 
            className={`p-2.5 border rounded-xl ${
              isLight 
                ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                : 'p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
            }`}
          >
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`font-sans font-semibold text-lg tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              1. Server Node Settings
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Configure global WireGuard host parameters</p>
          </div>
        </div>
      </div>

      {/* Network parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Public Endpoint <span className="text-red-500">*</span>
            <span className="tooltip group relative cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className={`absolute text-[10px] w-56 p-2 rounded-lg -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 border ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-700 shadow-lg' 
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                The public IP address or Domain Name of this server which clients will connect to.
              </span>
            </span>
          </label>
          <input
            id="input-public-endpoint"
            type="text"
            className={`border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-white placeholder:text-slate-400' 
                : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-indigo-500 placeholder:text-slate-600'
            }`}
            placeholder="e.g. 159.203.41.98 or vpn.domain.com"
            value={settings.publicEndpoint}
            onChange={(e) => updateField('publicEndpoint', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Interface Listen Port
            <span className="tooltip group relative cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className={`absolute text-[10px] w-48 p-2 rounded-lg -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 border ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-700 shadow-lg' 
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                UDP port WireGuard binds to (Default is 51820).
              </span>
            </span>
          </label>
          <input
            id="input-listen-port"
            type="number"
            min="1"
            max="65535"
            className={`border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-white' 
                : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-indigo-500'
            }`}
            value={settings.listenPort}
            onChange={(e) => updateField('listenPort', parseInt(e.target.value) || 51820)}
          />
        </div>
      </div>

      {/* Subnet settings */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Internal Interface CIDR
            <span className="tooltip group relative cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className={`absolute text-[10px] w-56 p-2 rounded-lg -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 border ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-700 shadow-lg' 
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                The private network range assigned to the VPN tunnel. The server usually takes .1.
              </span>
            </span>
          </label>
          <div className="flex gap-2">
            <input
              id="input-interface-cidr"
              type="text"
              className={`border rounded-xl px-4 py-2.5 text-sm transition-colors flex-1 focus:outline-none ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-white' 
                  : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-indigo-500'
              }`}
              value={settings.interfaceCidr}
              onChange={(e) => updateField('interfaceCidr', e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {subnetPresets.map((preset) => (
            <button
              key={preset.val}
              type="button"
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                settings.interfaceCidr === preset.val
                  ? isLight
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
              onClick={() => updateField('interfaceCidr', preset.val)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keypairs */}
      <div className={`border rounded-xl p-4 flex flex-col gap-3.5 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-500" />
            <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Cryptographic Keypairs
            </span>
          </div>
          <button
            id="btn-regenerate-server-keys"
            type="button"
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors font-medium cursor-pointer"
            onClick={handleRegenerateKeys}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate Keys
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1 text-xs">
            <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Server Private Key</span>
            <div className="relative flex items-center">
              <input
                id="input-server-private-key"
                type="text"
                className={`w-full border rounded-lg pl-3 pr-10 py-2 font-mono text-xs tracking-wide focus:outline-none focus:border-indigo-500 ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-700' 
                    : 'bg-slate-900 border-slate-800/80 text-slate-300'
                } ${!isValidPrivateKey(settings.privateKey) ? 'border-red-500 focus:border-red-500' : ''}`}
                value={settings.privateKey}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  const valid = isValidPrivateKey(val);
                  const derivedPub = valid ? getMockPublicKey(val) : '(Invalid Private Key)';
                  onChange({ ...settings, privateKey: val, publicKey: derivedPub });
                }}
                placeholder="Paste or type private key..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {isValidPrivateKey(settings.privateKey) ? (
                  <span className="text-emerald-500 font-bold text-sm" title="Valid Key">✓</span>
                ) : (
                  <span className="text-red-500 font-extrabold text-sm" title="Invalid Private Key (must be 32-byte Base64, e.g. 44 characters ending with =)">✗</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} font-medium`}>Server Public Key (Auto-calculated)</span>
            <div className={`border rounded-lg px-3 py-2 font-mono text-xs select-all truncate tracking-wide ${
              isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800/80 text-slate-400'
            }`}>
              {settings.publicKey}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowKeyInfo(!showKeyInfo)}
          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 mt-1 justify-start cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" /> Learn how key generation works securely
        </button>

        {showKeyInfo && (
          <div className={`text-[11px] leading-relaxed border rounded-lg p-3 mt-1 ${
            isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <strong>Browser-Secure Verification:</strong> We generate structurally valid pre-shared and asymmetric 256-bit keys entirely within your browser sandboxed environment using <code>window.crypto.getRandomValues()</code>. Since these secrets remain strictly static on your internal UI state and are never transferred to external servers, your secure parameters are fully guarded.
          </div>
        )}
      </div>

      {/* Advanced Settings: DNS and Firewall */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* DNS selection */}
        <div className="flex flex-col gap-2">
          <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Default Client DNS
          </label>
          <input
            id="input-dns-servers"
            type="text"
            className={`border rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-white placeholder:text-slate-400' 
                : 'bg-slate-950 border-slate-800 text-slate-100 focus:border-indigo-500 placeholder:text-slate-600'
            }`}
            placeholder="e.g. 1.1.1.1, 8.8.8.8"
            value={settings.dnsServers}
            onChange={(e) => updateField('dnsServers', e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5 mt-1">
            {dnsPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`text-[10px] px-2 py-1 rounded-md border transition-all cursor-pointer ${
                  settings.dnsServers === preset.val
                    ? isLight
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-semibold'
                      : 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                }`}
                onClick={() => updateField('dnsServers', preset.val)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Firewall settings */}
        <div className="flex flex-col gap-2">
          <label className={`text-xs font-medium flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>NAT Routing Firewall</span>
            <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => updateField('enableFirewall', !settings.enableFirewall)}>
              <input
                id="toggle-enable-firewall"
                type="checkbox"
                checked={settings.enableFirewall}
                onChange={(e) => updateField('enableFirewall', e.target.checked)}
                className={`w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'}`}
              />
              <span className={`text-[11px] font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Enable routing</span>
            </div>
          </label>

          <div className={`flex flex-col gap-2 border rounded-xl p-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Firewall Package:</span>
              <select
                id="select-firewall-type"
                disabled={!settings.enableFirewall}
                value={settings.firewallType}
                onChange={(e) => updateField('firewallType', e.target.value as FirewallType)}
                className={`border rounded-lg text-xs py-1 px-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-medium cursor-pointer ${
                  isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <option value={FirewallType.IPTABLES}>iptables (Recommended)</option>
                <option value={FirewallType.UFW}>UFW (Ubuntu)</option>
                <option value={FirewallType.NFTABLES}>nftables (Modern Linux)</option>
                <option value={FirewallType.NONE}>None / Static Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs gap-2">
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Public WAN Interface:</span>
              <input
                id="input-network-interface"
                type="text"
                disabled={!settings.enableFirewall}
                value={settings.networkInterface}
                onChange={(e) => updateField('networkInterface', e.target.value)}
                className={`border rounded-lg text-xs py-1 px-2 w-24 text-right focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono ${
                  isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
                placeholder="eth0"
              />
            </div>
          </div>
          <span className={`text-[10px] leading-tight ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Routing/NAT config allows your VPN clients to access the broader internet using the server's network connection.
          </span>
        </div>
      </div>
    </div>
  );
};

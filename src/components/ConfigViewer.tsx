import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ServerSettingsType, ClientType } from '../types';
import { generateServerConfig, generateClientConfig } from '../utils';
import { Copy, Download, QrCode, ArrowUpRight, FileText, Check } from 'lucide-react';

interface ConfigViewerProps {
  serverSettings: ServerSettingsType;
  clients: ClientType[];
  selectedClientId: string | null;
  theme: 'light' | 'dark';
}

export const ConfigViewer: React.FC<ConfigViewerProps> = ({
  serverSettings,
  clients,
  selectedClientId,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'server' | 'client'>('server');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLight = theme === 'light';

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0] || null;

  // Generate standard configuration files
  const serverConfigText = generateServerConfig(serverSettings, clients);
  const clientConfigText = selectedClient ? generateClientConfig(serverSettings, selectedClient) : '';

  const activeConfigText = activeTab === 'server' ? serverConfigText : clientConfigText;
  const activeFileName = activeTab === 'server' ? 'wg0.conf' : `${selectedClient?.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'client'}.conf`;

  // Draw the QR Code when QR is visible (supporting both server and client configuration)
  useEffect(() => {
    if (showQr && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        activeConfigText,
        {
          width: 250,
          margin: 1.5,
          color: {
            dark: '#030712', // deep dark slate
            light: '#ffffff', // pristine white
          },
        },
        (error) => {
          if (error) console.error('Failed to draw QR:', error);
        }
      );
    }
  }, [activeConfigText, showQr]);

  // Handle auto-focus and auto-tabbing when client is selected
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      setActiveTab('client');
    }
  }, [selectedClientId, clients.length]);

  // Reset QR display when changing configuration tabs
  useEffect(() => {
    setShowQr(false);
  }, [activeTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeConfigText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([activeConfigText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = activeFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Split-up syntax highlighter lines manually for a gorgeous color code render without heavy packages
  const renderHighlightedConfig = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const isComment = line.trim().startsWith('#');
      const isSection = line.trim().startsWith('[') && line.trim().endsWith(']');
      let processedLine = <span>{line}</span>;

      if (isComment) {
        processedLine = <span className={isLight ? 'text-slate-400 italic select-none' : 'text-slate-500 italic select-none'}>{line}</span>;
      } else if (isSection) {
        processedLine = <span className="text-indigo-600 dark:text-indigo-405 font-bold">{line}</span>;
      } else if (line.includes('=')) {
        const [opt, ...valArr] = line.split('=');
        const val = valArr.join('=');
        processedLine = (
          <span>
            <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400 font-medium'}>{opt}</span>
            <span className={isLight ? 'text-slate-400' : 'text-slate-400'}>=</span>
            <span className={`select-all break-all ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{val}</span>
          </span>
        );
      }

      return (
        <div key={idx} className="leading-5 min-h-[1.25rem] break-all whitespace-pre-wrap py-0.5">
          {processedLine}
        </div>
      );
    });
  };

  return (
    <div 
      id="wg-config-viewer-root" 
      className={`border rounded-2xl p-6 shadow-xl flex flex-col gap-6 transition-colors ${
        isLight 
          ? 'bg-white border-slate-250 text-slate-800 shadow-slate-100/40' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
    >
      <div className={`flex items-center justify-between border-b pb-4 flex-wrap gap-4 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div 
            id="icon-file-badge" 
            className={`p-2.5 border rounded-xl ${
              isLight 
                ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`font-sans font-semibold text-lg tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              3. Configuration Output
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Preview and extract full server and peer profiles</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className={`flex p-1.5 rounded-xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-850'
        }`}>
          <button
            id="tab-server"
            type="button"
            className={`px-4.5 py-1.5 rounded-lg text-xs font-medium font-sans transition-all cursor-pointer ${
              activeTab === 'server'
                ? 'bg-indigo-600 text-white shadow-md'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('server')}
          >
            Server (wg0.conf)
          </button>
          <button
            id="tab-client"
            disabled={clients.length === 0}
            type="button"
            className={`px-4.5 py-1.5 rounded-lg text-xs font-medium font-sans transition-all disabled:opacity-40 cursor-pointer ${
              activeTab === 'client'
                ? 'bg-indigo-600 text-white shadow-md'
                : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('client')}
          >
            Client Configuration
          </button>
        </div>
      </div>

      {activeTab === 'client' && clients.length > 0 && selectedClient && (
        <div className={`flex items-center justify-between border rounded-xl px-4 py-3 text-xs gap-4 flex-wrap ${
          isLight ? 'bg-slate-50 border-slate-150' : 'bg-slate-950 border-slate-850'
        }`}>
          <div className="flex items-center gap-2">
            <span className={isLight ? 'text-slate-500 font-sans' : 'text-slate-400 font-sans'}>Active Client Profile:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg">
              {selectedClient.name}
            </span>
            <span className={`font-mono text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>({selectedClient.assignedIp})</span>
          </div>

          <button
            id="btn-toggle-client-qr"
            type="button"
            onClick={() => setShowQr(!showQr)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              showQr 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' 
                : isLight 
                  ? 'bg-white border-slate-205 text-slate-605 hover:text-slate-800 hover:border-slate-350' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {showQr ? 'Hide QR Code' : 'Show Mobile QR Code'}
          </button>
        </div>
      )}

      {activeTab === 'server' && (
        <div className={`flex items-center justify-between border rounded-xl px-4 py-3 text-xs gap-4 flex-wrap ${
          isLight ? 'bg-slate-50 border-slate-150' : 'bg-slate-950 border-slate-850'
        }`}>
          <div className="flex items-center gap-2">
            <span className={isLight ? 'text-slate-500 font-sans' : 'text-slate-400 font-sans'}>Active Server Profile:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-150 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg">
              {serverSettings.interfaceCidr || 'wg0'}
            </span>
            <span className={`font-mono text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>(Port {serverSettings.listenPort})</span>
          </div>

          <button
            id="btn-toggle-server-qr"
            type="button"
            onClick={() => setShowQr(!showQr)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              showQr 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' 
                : isLight 
                  ? 'bg-white border-slate-205 text-slate-605 hover:text-slate-800 hover:border-slate-350' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {showQr ? 'Hide QR Code' : 'Show Server QR Code'}
          </button>
        </div>
      )}

      {/* Main Display Frame */}
      <div className="relative flex-1 flex flex-col min-h-[350px]">
        {showQr ? (
          <div className={`border rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn flex-1 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
          }`}>
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center border border-slate-250 transition-transform hover:scale-102">
              <canvas ref={canvasRef} id="qrcode-canvas" />
            </div>
            <div className="max-w-sm flex flex-col gap-1.5">
              <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {activeTab === 'server' ? 'Server Configuration QR Code' : 'Scan to Connect Instantly'}
              </span>
              <p className={`text-[11px] leading-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {activeTab === 'server' ? (
                  <>
                    Scan or backup the entire server-side <code>wg0.conf</code> configuration for quick import into administrative managers or deployment utilities.
                  </>
                ) : (
                  <>
                    Open the official <strong>WireGuard application</strong> on your iOS, iPadOS or Android mobile device, select the <code>+</code> add button, choose <strong>Scan from QR Code</strong>, and focus on the display canvas above.
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className={`border rounded-2xl flex-1 flex flex-col overflow-hidden max-h-[500px] ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'
          }`}>
            {/* Action Bar inside coding block */}
            <div className={`flex items-center justify-between px-4 py-2 border-b z-10 ${
              isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-950/60 border-slate-850/80'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30"></span>
                <span className={`ml-1.5 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{activeFileName}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-copy-config"
                  type="button"
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-sans font-medium cursor-pointer ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-650 hover:text-slate-800' 
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-download-config"
                  type="button"
                  onClick={handleDownload}
                  className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-sans font-medium cursor-pointer ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-650 hover:text-slate-800' 
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-100 hover:border-slate-700'
                  }`}
                  title="Download configuration"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className={`p-5 overflow-auto flex-1 font-mono text-xs select-text text-left ${
              isLight ? 'bg-white text-slate-800' : 'bg-slate-950 text-slate-300'
            }`}>
              {renderHighlightedConfig(activeConfigText)}
            </div>
          </div>
        )}
      </div>

      <div className={`border rounded-xl p-4.5 flex gap-3 text-xs leading-normal ${
        isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/40 border-slate-850 text-slate-400'
      }`}>
        <ArrowUpRight className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
        <div>
          <strong>Routing Setup (Server):</strong> Make sure IPv4 routing and packet forwarding is enabled on your host VPS using: <code className={`px-1 py-0.5 rounded font-bold ${
            isLight ? 'bg-slate-200 text-indigo-700' : 'bg-slate-950 text-indigo-400'
          }`}>sysctl -w net.ipv4.ip_forward=1</code>, and configure iptables NAT masquerading rules matching your public interface.
        </div>
      </div>
    </div>
  );
};

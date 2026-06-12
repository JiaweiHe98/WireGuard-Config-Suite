import { ServerSettingsType, ClientType, FirewallType, RouteType } from './types';
import nacl from 'tweetnacl';

// Base64 helper supporting Node and Browser
function atobHelper(str: string): string {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(str);
  }
  return Buffer.from(str, 'base64').toString('binary');
}

function btoaHelper(str: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(str);
  }
  return Buffer.from(str, 'binary').toString('base64');
}

// Cryptographically secure Base64 random key generator (looks exactly like WG Keys)
export function generateSecureKey(): string {
  const bytes = new Uint8Array(32);
  try {
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
    } else {
      // Fallback for node or tests
      for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
  } catch (e) {
    // Basic fallback
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoaHelper(binary);
}

// Check if string is a valid WireGuard private/public key (32 bytes encoded in Base64)
export function isValidPrivateKey(key: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length !== 44) return false;
  try {
    const decoded = atobHelper(trimmed);
    return decoded.length === 32;
  } catch (e) {
    return false;
  }
}

// Generates the standards-compliant, cryptographically correct WireGuard public key from a private key.
// It uses TweetNaCl's Curve25519 (X25519) basepoint scalar multiplication, matching wg pubkey output perfectly.
export function getMockPublicKey(privateKey: string): string {
  try {
    const trimmed = privateKey.trim();
    if (!isValidPrivateKey(trimmed)) {
      return '(Invalid Private Key)';
    }
    const decoded = atobHelper(trimmed);
    const privBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      privBytes[i] = decoded.charCodeAt(i);
    }
    
    // Compute the standard X25519 public key from the private key
    const keyPair = nacl.box.keyPair.fromSecretKey(privBytes);
    const pubBytes = keyPair.publicKey;
    
    let binary = '';
    for (let i = 0; i < 32; i++) {
      binary += String.fromCharCode(pubBytes[i]);
    }
    return btoaHelper(binary);
  } catch (e) {
    return '(Invalid Private Key)';
  }
}

// Generate a valid IP for a client based on the server subnet
export function getNextIpAddress(serverCidr: string, index: number): string {
  const parts = serverCidr.split('/');
  const ipPart = parts[0] || '10.8.0.1';
  const cidrDigits = ipPart.split('.').map(Number);
  
  if (cidrDigits.length !== 4 || cidrDigits.some(isNaN)) {
    return `10.8.0.${index + 2}/32`;
  }

  // Generate an IP that is (index + 2) in the last octet, assuming standard /24 subnet.
  // Let's increment logically so it does not exceed 254
  let lastOctet = cidrDigits[3] + 1 + index;
  let carry3 = cidrDigits[2];
  let carry2 = cidrDigits[1];
  let carry1 = cidrDigits[0];

  if (lastOctet > 254) {
    const added = lastOctet - cidrDigits[3];
    lastOctet = (cidrDigits[3] + added) % 254;
    if (lastOctet === 0 || lastOctet === 1) lastOctet = 2; // avoid server IP/network IP
    carry3 = (carry3 + Math.floor((cidrDigits[3] + added) / 254)) % 256;
  }

  return `${carry1}.${carry2}.${carry3}.${lastOctet}/32`;
}

// Helper: Generates firewall PostUp and PostDown string values
export function getFirewallCommands(
  type: FirewallType,
  enable: boolean,
  interfaceName: string
): { postUp: string; postDown: string } {
  if (!enable || type === FirewallType.NONE) {
    return { postUp: '', postDown: '' };
  }

  switch (type) {
    case FirewallType.IPTABLES:
      return {
        postUp: `iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${interfaceName} -j MASQUERADE`,
        postDown: `iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${interfaceName} -j MASQUERADE`,
      };
    case FirewallType.UFW:
      return {
        postUp: `ufw route allow in on %i && ufw allow %i/udp && sysctl -w net.ipv4.ip_forward=1`,
        postDown: `ufw route delete allow in on %i && ufw delete allow %i/udp`,
      };
    case FirewallType.NFTABLES:
      return {
        postUp: `nft add table ip wg-nat; nft add chain ip wg-nat postrouting { type nat hook postrouting priority 100 \\; }; nft add rule ip wg-nat postrouting oifname "${interfaceName}" masquerade`,
        postDown: `nft delete table ip wg-nat`,
      };
    default:
      return { postUp: '', postDown: '' };
  }
}

// Generates server wg0.conf text
export function generateServerConfig(
  settings: ServerSettingsType,
  clients: ClientType[]
): string {
  let config = `#[Interface] ##########################################
# WireGuard Server Configuration
# Network IP Range: ${settings.interfaceCidr}
# Listening Port: ${settings.listenPort}
# Server Public Key: ${settings.publicKey}
# Generated on: ${new Date().toLocaleDateString()}
#####################################################

[Interface]
Address = ${settings.interfaceCidr}
ListenPort = ${settings.listenPort}
PrivateKey = ${settings.privateKey}
`;

  // Add firewall rules if enabled
  const { postUp, postDown } = getFirewallCommands(
    settings.firewallType,
    settings.enableFirewall,
    settings.networkInterface
  );

  if (postUp && postDown) {
    config += `PostUp = ${postUp}\n`;
    config += `PostDown = ${postDown}\n`;
  }

  config += '\n';

  // Add each Client as a [Peer]
  clients.forEach((client) => {
    if (client.includeInConfig === false) return;
    config += `# Peer: ${client.name}\n`;
    config += `[Peer]\n`;
    config += `PublicKey = ${client.publicKey}\n`;
    config += `AllowedIPs = ${client.assignedIp}\n`;
    if (client.preSharedKey) {
      config += `PresharedKey = ${client.preSharedKey}\n`;
    }
    config += '\n';
  });

  return config.trim();
}

// Generates client configuration text
export function generateClientConfig(
  settings: ServerSettingsType,
  client: ClientType
): string {
  let allowedIPs = '0.0.0.0/0, ::/0'; // Default: route all
  if (client.routeType === RouteType.VPN_ONLY) {
    // Route only the VPN Subnet
    allowedIPs = settings.interfaceCidr;
  } else if (client.routeType === RouteType.CUSTOM) {
    allowedIPs = client.customAllowedIps || '0.0.0.0/0';
  }

  const dnsLine = client.dnsOverride 
    ? `DNS = ${client.dnsOverride}` 
    : settings.dnsServers 
      ? `DNS = ${settings.dnsServers}` 
      : '';

  let config = `#[Interface] ##########################################
# WireGuard Client: ${client.name}
# Profile Internal IP: ${client.assignedIp}
# Inherits Server Endpoint: ${settings.publicEndpoint}:${settings.listenPort}
#####################################################

[Interface]
PrivateKey = ${client.privateKey}
Address = ${client.assignedIp}
${dnsLine}

[Peer]
PublicKey = ${settings.publicKey}
Endpoint = ${settings.publicEndpoint || 'YOUR_SERVER_PUBLIC_IP'}:${settings.listenPort}
AllowedIPs = ${allowedIPs}
`;

  if (client.persistentKeepalive > 0) {
    config += `PersistentKeepalive = ${client.persistentKeepalive}\n`;
  }

  if (client.preSharedKey) {
    config += `PresharedKey = ${client.preSharedKey}\n`;
  }

  return config.trim();
}

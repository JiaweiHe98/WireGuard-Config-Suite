export enum FirewallType {
  IPTABLES = 'iptables',
  UFW = 'ufw',
  NFTABLES = 'nftables',
  NONE = 'none',
}

export enum RouteType {
  ALL_TRAFFIC = 'all',
  VPN_ONLY = 'vpn-only',
  CUSTOM = 'custom',
}

export interface ServerSettingsType {
  privateKey: string;
  publicKey: string;
  interfaceCidr: string; // e.g. 10.8.0.1/24
  listenPort: number; // e.g. 51820
  publicEndpoint: string; // e.g. 192.168.1.100 or vpn.domain.com
  dnsServers: string; // e.g. 1.1.1.1, 1.0.0.1
  enableFirewall: boolean;
  firewallType: FirewallType;
  networkInterface: string; // e.g. eth0 or ens3
}

export interface ClientType {
  id: string;
  name: string;
  privateKey: string;
  publicKey: string;
  preSharedKey: string; // Optional pre-shared key, empty if disabled
  assignedIp: string; // e.g. 10.8.0.2/32
  routeType: RouteType;
  customAllowedIps: string; // e.g. 192.168.1.0/24
  persistentKeepalive: number; // 0 for disabled, else seconds (e.g. 25)
  dnsOverride: string; // Optional custom DNS for this client, empty to inherit server's DNS
  includeInConfig?: boolean; // Whether to include this client in the downloaded/viewed server config
}

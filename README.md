# 🛡️ WireGuard Config Suite

Welcome to the **WireGuard Config Suite**—an offline-first, browser-secure, high-fidelity configuration builder designed to visually design, manage, and deploy industrial-grade WireGuard VPN structures. 

This guide serves as a complete reference for using the web editor, understanding cryptographic key derivation, and verifying deployments to server endpoints securely.

---

## 🎯 Architectural Intent

Creating WireGuard configs manually is error-prone. Misconfigured CIDR subnets, broken Routing Tables, missing `PersistentKeepalive` parameters, or typing mismatches in public/private key pairs will quiet fail the handshake.

This tool guarantees structural and cryptographic consistency:
* **True Cryptography**: Derived public keys are generated strictly in your browser using standard **TweetNaCl Curve25519 (X25519)**.
* **Flexible Peer Filtering**: Check and toggle peer inclusion instantly to dynamically generate the main `wg0.conf` file containing only active peers.
* **Responsive Visualizers**: Instantly view, copy, download, or scan the configuration with visual high-density QR Codes (supporting both server-profile backup and client profile imports).
* **Automated Orchestrator**: Includes an exportable, self-contained Python 3 script that detects your Linux kernel environment, installs tools, enables forwarding, and bootstraps the configuration.

---

## 🚀 Step-by-Step UI Guide

### 1. Server Configuration
* **Server Private Key**: Standard 256-bit private key. Generate securely using the `Generate Secure Key` command or input your own.
* **Server Public Key**: Auto-calculates standard X25519 basepoint multiply. Keep this secure to populate client peer structures.
* **Public Endpoint/Port**: Define the WAN IP or Domain name that clients will contact. Default UDP port is `51820`.
* **Private Network Subnet**: Configure the internal tunnel network (e.g., `10.8.0.1/24`). It auto-validates CIDR syntax.
* **Firewall (NAT) Rules**: Pick `iptables` or standard simple rules. The generated configuration automatically hooks `PostUp` and `PostDown` triggers to configure system NAT translation.

### 2. Client Peer Management
* **Peer Profiles**: Create dedicated configurations for `Smartphones`, `Laptops`, or standard custom interfaces.
* **Interactive Activation Switches**: 
  * Each peer comes with a premium inline toggle switch.
  * Toggling the switch **off** keeps the peer settings stored safely in the database, but instantly excludes it from the compiled `wg0.conf` server configuration template.
  * Toggling **on** instantly appends the peer details back into the active interface configuration.
* **Tunnel Presets**:
  * **Full Tunnel (`0.0.0.0/0, ::/0`)**: Forces all outbound internet traffic from the device through the secure VPN tunnel.
  * **Split Tunnel**: Routes only local subnet traffic through the VPN, sending external web traffic through standard local networks.
  * **Custom IP Routing**: Paste specialized CIDR constraints (e.g., specific staging subnets or corporate backplanes).
* **Hide/Show Key Options**: Click the eye icon (`Eye` / `EyeOff`) on any private key input box to mask sensitive strings during shared deployment or screen sharing sessions.

### 3. Visualizations & Exporting
* Navigate tabs between `Server wg0.conf` and client profile configurations.
* Click **Show QR Code** for any active profile. Scan Client QR Codes straight into the official WireGuard applications for iOS, iPadOS, and Android.
* Use the **Export Python Script** tab to download your automated terminal deployer.

---

## 🔒 Post-Installation & Security Checks

### 1. Firewall Access
Ensure your server firewall allows inbound UDP traffic on your chosen listen port:
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 51820/udp

# Firewalld (CentOS/Rocky Linux)
sudo firewall-cmd --add-port=51820/udp --permanent
sudo firewall-cmd --reload
```

### 2. Live Peer Status Information
To monitor active client sessions, handshakes, transfer counters, and network transfer speeds, run:
```bash
sudo wg show
```

### 3. Interactive Troubleshooting
* **No Handshake?** Ensure your UDP port is open in your cloud provider's network security group (e.g., AWS Security Group, GCP VPC Firewall, or AWS EC2 console).
* **Connection Established but No Traffic?** Verify that forwarding is active:
  ```bash
  cat /proc/sys/net/ipv4/ip_forward  # Should return 1
  ```
  And check that the server private config exhibits the exact network interface matching your WAN IP (e.g., `eth0`, `ens3`, or `enp0s3`).

---

## 🛠️ Local Development Guide

To customize or run this UI suite locally within your own workspace environment:

### Prerequisites
* Node.js v18+
* npm or Yarn

### Setup
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```
The server will boot locally. Open [http://localhost:3000](http://localhost:3000) to view the application.

---

*Crafted safely and cryptographically in browser with Inter UI and JetBrains Mono Typography pairings.*

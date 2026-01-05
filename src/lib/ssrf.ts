import dns from "node:dns/promises";
import net from "node:net";

const PRIVATE_CIDRS = [
  { prefix: "10.", label: "10.0.0.0/8" },
  { prefix: "192.168.", label: "192.168.0.0/16" },
  { prefix: "172.", label: "172.16.0.0/12" },
  { prefix: "127.", label: "loopback" },
  { prefix: "0.", label: "unspecified" },
];

function isPrivateIp(ip: string): boolean {
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return PRIVATE_CIDRS.some(({ prefix }) => ip.startsWith(prefix));
}

async function resolveHost(host: string): Promise<string> {
  const lookup = await dns.lookup(host, { family: 0 });
  return lookup.address;
}

export async function assertUrlIsSafe(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL invalide");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Seules les URLs http/https sont autorisées");
  }

  const hostname = url.hostname;

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("URL privée ou loopback refusée");
    }
    return;
  }

  const ip = await resolveHost(hostname);
  if (net.isIP(ip) && isPrivateIp(ip)) {
    throw new Error("URL pointant vers une IP privée refusée");
  }
}

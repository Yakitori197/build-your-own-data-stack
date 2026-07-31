/**
 * IP address classification for SSRF protection.
 *
 * Pure and dependency-free so it can be unit tested exhaustively without any
 * network. Only addresses that are globally routable public unicast are treated
 * as "public"; everything else (loopback, private, link-local, unspecified,
 * multicast, CGNAT, and other reserved ranges) is rejected.
 */

export type IpClass =
  | 'public'
  | 'loopback'
  | 'private'
  | 'link-local'
  | 'unspecified'
  | 'multicast'
  | 'cgnat'
  | 'reserved'
  | 'invalid';

function toByte(part: string): number | null {
  if (!/^\d{1,3}$/.test(part)) {
    return null;
  }
  const value = Number(part);
  return value <= 255 ? value : null;
}

/** Parse a dotted-decimal IPv4 string into 4 bytes, or null. */
export function parseIpv4(input: string): [number, number, number, number] | null {
  const parts = input.split('.');
  if (parts.length !== 4) {
    return null;
  }
  const bytes: number[] = [];
  for (const part of parts) {
    const byte = toByte(part);
    if (byte === null) {
      return null;
    }
    bytes.push(byte);
  }
  // Exactly four elements were just pushed, so these are always defined.
  return [bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!];
}

/** Parse an IPv6 string (optionally with embedded IPv4) into 16 bytes, or null. */
export function parseIpv6(input: string): number[] | null {
  let str = input;
  const zoneIndex = str.indexOf('%');
  if (zoneIndex !== -1) {
    str = str.slice(0, zoneIndex);
  }
  if (str.length === 0 || !str.includes(':') || !/^[0-9a-fA-F:.]+$/.test(str)) {
    return null;
  }

  // Embedded IPv4 in the final group, e.g. ::ffff:192.0.2.1
  const lastColon = str.lastIndexOf(':');
  const last = str.slice(lastColon + 1);
  if (last.includes('.')) {
    const v4 = parseIpv4(last);
    if (v4 === null) {
      return null;
    }
    const g1 = ((v4[0] << 8) | v4[1]).toString(16);
    const g2 = ((v4[2] << 8) | v4[3]).toString(16);
    str = `${str.slice(0, lastColon + 1)}${g1}:${g2}`;
  }

  const halves = str.split('::');
  if (halves.length > 2) {
    return null;
  }

  const parseGroups = (part: string): number[] | null => {
    if (part === '') {
      return [];
    }
    const groups: number[] = [];
    for (const group of part.split(':')) {
      if (group === '' || group.length > 4 || !/^[0-9a-fA-F]+$/.test(group)) {
        return null;
      }
      groups.push(parseInt(group, 16));
    }
    return groups;
  };

  const head = parseGroups(halves[0] ?? '');
  const tail = halves.length === 2 ? parseGroups(halves[1] ?? '') : [];
  if (head === null || tail === null) {
    return null;
  }

  let groups: number[];
  if (halves.length === 2) {
    const missing = 8 - head.length - tail.length;
    if (missing < 1) {
      return null;
    }
    groups = [...head, ...new Array<number>(missing).fill(0), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) {
    return null;
  }

  const bytes: number[] = [];
  for (const group of groups) {
    bytes.push((group >> 8) & 0xff, group & 0xff);
  }
  return bytes;
}

function classifyIpv4(bytes: [number, number, number, number]): IpClass {
  const [a, b, c] = bytes;
  if (a === 0) return 'unspecified'; // 0.0.0.0/8
  if (a === 10) return 'private'; // 10.0.0.0/8
  if (a === 127) return 'loopback'; // 127.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return 'cgnat'; // 100.64.0.0/10
  if (a === 169 && b === 254) return 'link-local'; // 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return 'private'; // 172.16.0.0/12
  if (a === 192 && b === 168) return 'private'; // 192.168.0.0/16
  if (a === 192 && b === 0 && c === 0) return 'reserved'; // 192.0.0.0/24
  if (a === 192 && b === 0 && c === 2) return 'reserved'; // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 88 && c === 99) return 'reserved'; // 192.88.99.0/24
  if (a === 198 && (b === 18 || b === 19)) return 'reserved'; // 198.18.0.0/15
  if (a === 198 && b === 51 && c === 100) return 'reserved'; // 198.51.100.0/24
  if (a === 203 && b === 0 && c === 113) return 'reserved'; // 203.0.113.0/24
  if (a >= 224 && a <= 239) return 'multicast'; // 224.0.0.0/4
  if (a >= 240) return 'reserved'; // 240.0.0.0/4 (incl. 255.255.255.255)
  return 'public';
}

function classifyIpv6(bytes: number[]): IpClass {
  // `bytes` always has 16 elements here (parseIpv6 guarantees it).
  const b = (i: number): number => bytes[i]!;
  if (bytes.every((byte) => byte === 0)) return 'unspecified'; // ::
  if (bytes.slice(0, 15).every((byte) => byte === 0) && b(15) === 1) return 'loopback'; // ::1
  // IPv4-mapped (::ffff:0:0/96) — classify the embedded IPv4
  if (bytes.slice(0, 10).every((byte) => byte === 0) && b(10) === 0xff && b(11) === 0xff) {
    return classifyIpv4([b(12), b(13), b(14), b(15)]);
  }
  if ((b(0) & 0xfe) === 0xfc) return 'private'; // fc00::/7 (unique local)
  if (b(0) === 0xfe && (b(1) & 0xc0) === 0x80) return 'link-local'; // fe80::/10
  if (b(0) === 0xff) return 'multicast'; // ff00::/8
  if (b(0) === 0x20 && b(1) === 0x01 && b(2) === 0x0d && b(3) === 0xb8) return 'reserved'; // 2001:db8::/32
  if ((b(0) & 0xe0) === 0x20) return 'public'; // 2000::/3 global unicast
  return 'reserved';
}

/** Classify an IP string. Returns `'invalid'` when it is not a valid IP. */
export function classifyIp(ip: string): IpClass {
  const v4 = parseIpv4(ip);
  if (v4 !== null) {
    return classifyIpv4(v4);
  }
  const v6 = parseIpv6(ip);
  if (v6 !== null) {
    return classifyIpv6(v6);
  }
  return 'invalid';
}

/** True only for globally routable public unicast addresses. */
export function isPublicIp(ip: string): boolean {
  return classifyIp(ip) === 'public';
}

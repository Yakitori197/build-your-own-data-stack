import { describe, expect, it } from 'vitest';
import { classifyIp, isPublicIp, parseIpv4, parseIpv6 } from '../lib/net/ip';

describe('parseIpv4', () => {
  it('parses valid dotted-decimal', () => {
    expect(parseIpv4('1.2.3.4')).toEqual([1, 2, 3, 4]);
    expect(parseIpv4('255.255.255.255')).toEqual([255, 255, 255, 255]);
  });

  it('rejects malformed input', () => {
    expect(parseIpv4('256.0.0.1')).toBeNull(); // octet > 255
    expect(parseIpv4('1.2.3')).toBeNull(); // too few parts
    expect(parseIpv4('1.2.3.4.5')).toBeNull(); // too many parts
    expect(parseIpv4('a.b.c.d')).toBeNull(); // non-numeric
    expect(parseIpv4('1.2.3.')).toBeNull(); // empty octet
    expect(parseIpv4('01234.0.0.1')).toBeNull(); // more than 3 digits
  });
});

describe('parseIpv6', () => {
  it('parses valid forms', () => {
    expect(parseIpv6('::1')).toHaveLength(16);
    expect(parseIpv6('2001:db8::1')).toHaveLength(16);
    expect(parseIpv6('::ffff:1.2.3.4')).toHaveLength(16);
    expect(parseIpv6('1:2:3:4:5:6:7:8')).toHaveLength(16);
  });

  it('rejects malformed input', () => {
    expect(parseIpv6('1.2.3.4')).toBeNull(); // no colon at all
    expect(parseIpv6('')).toBeNull();
    expect(parseIpv6('1::2::3')).toBeNull(); // two "::"
    expect(parseIpv6('12345::')).toBeNull(); // group too long
    expect(parseIpv6('gggg::')).toBeNull(); // non-hex characters
    expect(parseIpv6('1:2:3:4:5:6:7')).toBeNull(); // too few groups, no "::"
    expect(parseIpv6('1:2:3:4:5:6:7:8:9')).toBeNull(); // too many groups
    expect(parseIpv6('1:2:3:4:5:6:7:8::')).toBeNull(); // "::" with 8 groups present
    expect(parseIpv6('::ffff:999.0.0.1')).toBeNull(); // bad embedded IPv4
  });
});

describe('classifyIp — reserved and boundary cases', () => {
  it('classifies reserved IPv4 blocks', () => {
    expect(classifyIp('192.0.0.1')).toBe('reserved');
    expect(classifyIp('192.0.2.5')).toBe('reserved');
    expect(classifyIp('192.88.99.1')).toBe('reserved');
    expect(classifyIp('198.18.0.1')).toBe('reserved');
    expect(classifyIp('198.19.0.1')).toBe('reserved');
    expect(classifyIp('198.51.100.1')).toBe('reserved');
    expect(classifyIp('203.0.113.1')).toBe('reserved');
    expect(classifyIp('240.0.0.1')).toBe('reserved');
  });

  it('treats nearby-but-routable IPv4 as public', () => {
    expect(classifyIp('192.0.1.1')).toBe('public');
    expect(classifyIp('198.20.0.1')).toBe('public');
    expect(classifyIp('11.0.0.1')).toBe('public');
    expect(classifyIp('223.255.255.255')).toBe('public');
  });

  it('classifies IPv6 edge cases', () => {
    expect(classifyIp('0100::1')).toBe('reserved'); // not global unicast
    expect(classifyIp('3fff:ffff::1')).toBe('public'); // within 2000::/3
    expect(classifyIp('::ffff:10.0.0.1')).toBe('private'); // IPv4-mapped private
    expect(classifyIp('fe80::1%eth0')).toBe('link-local'); // zone id stripped
  });

  it('returns invalid for strings that are neither IPv4 nor IPv6', () => {
    expect(classifyIp('not-an-ip')).toBe('invalid');
    expect(classifyIp('')).toBe('invalid');
    expect(classifyIp('999.999.999.999')).toBe('invalid');
  });
});

describe('isPublicIp', () => {
  it('accepts only public unicast addresses', () => {
    expect(isPublicIp('8.8.8.8')).toBe(true);
    expect(isPublicIp('2606:4700:4700::1111')).toBe(true);
    expect(isPublicIp('10.0.0.1')).toBe(false);
    expect(isPublicIp('127.0.0.1')).toBe(false);
    expect(isPublicIp('::1')).toBe(false);
    expect(isPublicIp('garbage')).toBe(false);
  });
});

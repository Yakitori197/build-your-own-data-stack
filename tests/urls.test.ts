import { describe, expect, it } from 'vitest';
import { analyzeUrl, isCleanHttpsUrl } from '../lib/catalog/urls';

describe('analyzeUrl', () => {
  it('accepts a clean https url', () => {
    const result = analyzeUrl('https://example.com/tutorial');
    expect(result.valid).toBe(true);
    expect(result.protocol).toBe('https:');
    expect(result.trackingParams).toEqual([]);
    expect(result.reason).toBeNull();
  });

  it('accepts https urls with benign query params and fragments', () => {
    const result = analyzeUrl('https://example.com/docs?page=2#section');
    expect(result.valid).toBe(true);
  });

  it('rejects non-https urls', () => {
    const result = analyzeUrl('http://example.com/tutorial');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-https');
  });

  it('rejects unparseable urls', () => {
    const result = analyzeUrl('not a url');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('unparseable');
    expect(result.protocol).toBeNull();
  });

  it('flags utm_* tracking params', () => {
    const result = analyzeUrl('https://example.com/a?utm_source=news&x=1');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('tracking-params');
    expect(result.trackingParams).toContain('utm_source');
  });

  it('flags known tracking params case-insensitively and preserves original casing', () => {
    const result = analyzeUrl('https://example.com/a?FBCLID=123');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('tracking-params');
    expect(result.trackingParams).toEqual(['FBCLID']);
  });

  it('prioritises the not-https reason over tracking params', () => {
    const result = analyzeUrl('http://example.com/a?utm_source=x');
    expect(result.reason).toBe('not-https');
    expect(result.trackingParams).toContain('utm_source');
  });
});

describe('analyzeUrl (SSRF policy)', () => {
  it('rejects embedded credentials and non-default ports', () => {
    expect(analyzeUrl('https://user:pass@example.com/').reason).toBe('unsafe-url');
    expect(analyzeUrl('https://example.com:8443/').reason).toBe('unsafe-url');
  });

  it('rejects non-public hostnames', () => {
    expect(analyzeUrl('https://localhost/').reason).toBe('unsafe-host');
    expect(analyzeUrl('https://svc.internal/').reason).toBe('unsafe-host');
    expect(analyzeUrl('https://foo.local/').reason).toBe('unsafe-host');
  });

  it('rejects all IP literals (only DNS hostnames are allowed)', () => {
    expect(analyzeUrl('https://10.0.0.1/').reason).toBe('unsafe-address');
    expect(analyzeUrl('https://127.0.0.1/').reason).toBe('unsafe-address');
    expect(analyzeUrl('https://[::1]/').reason).toBe('unsafe-address');
    expect(analyzeUrl('https://8.8.8.8/').reason).toBe('unsafe-address');
  });

  it('still accepts clean public https hostnames', () => {
    expect(analyzeUrl('https://example.com/path').valid).toBe(true);
  });
});

describe('isCleanHttpsUrl', () => {
  it('is a thin predicate over analyzeUrl', () => {
    expect(isCleanHttpsUrl('https://example.com')).toBe(true);
    expect(isCleanHttpsUrl('http://example.com')).toBe(false);
    expect(isCleanHttpsUrl('https://127.0.0.1/')).toBe(false);
  });
});

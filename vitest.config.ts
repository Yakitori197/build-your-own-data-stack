import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Coverage targets the core, network-free modules only. The Astro site and
      // thin CLI wrappers are exercised via build/e2e rather than unit coverage.
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/*.test.ts',
        'lib/**/*.d.ts',
        'lib/**/index.ts',
        // Thin socket adapter: needs a real TLS connection, exercised only by
        // the scheduled links:check run. Its security-relevant options are built
        // and tested in buildRequestOptions (lib/linkcheck/http.ts).
        'lib/linkcheck/transport.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});

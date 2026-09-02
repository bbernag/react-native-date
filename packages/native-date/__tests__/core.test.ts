import {
  now,
  parse,
  tryParse,
  format,
  formatDate,
  formatDateTime,
  toISOString,
} from '../src/index';

describe('Core Functions', () => {
  describe('now()', () => {
    it('should return current timestamp', () => {
      const before = Date.now();
      const result = now();
      const after = Date.now();

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it('should return a valid timestamp', () => {
      expect(now()).toBeValidTimestamp();
    });
  });

  describe('parse()', () => {
    it('should parse ISO 8601 date strings', () => {
      const result = parse('2024-06-15');
      expect(result).toBeValidTimestamp();
    });

    it('should parse ISO 8601 datetime strings', () => {
      const result = parse('2024-06-15T10:30:00');
      expect(result).toBeValidTimestamp();
    });

    it('should parse ISO 8601 with timezone', () => {
      const result = parse('2024-06-15T10:30:00Z');
      expect(result).toBeValidTimestamp();
    });

    it('should throw for invalid date strings', () => {
      expect(() => parse('not-a-date')).toThrow(/Invalid ISO-8601/);
      expect(() => parse('')).toThrow(/Invalid ISO-8601/);
      expect(() => parse('invalid')).toThrow(/Invalid ISO-8601/);
      expect(() => parse('2024-02-30')).toThrow(/Invalid ISO-8601/);
      expect(() => parse('2024-02-31')).toThrow(/Invalid ISO-8601/);
      expect(() => parse('2024/01/15')).toThrow(/Invalid ISO-8601/);
    });

    it('should parse HH:mm after T, including a Z designator', () => {
      expect(parse('2024-01-15T14:30Z')).toBe(Date.UTC(2024, 0, 15, 14, 30));
      expect(parse('2024-01-15T14:30:00Z')).toBe(Date.UTC(2024, 0, 15, 14, 30));
    });
  });

  describe('tryParse()', () => {
    it('should return timestamp for valid date strings', () => {
      const result = tryParse('2024-06-15');
      expect(result).not.toBeNull();
      expect(result).toBeValidTimestamp();
    });

    it('should return null for invalid date strings', () => {
      expect(tryParse('not-a-date')).toBeNull();
      expect(tryParse('')).toBeNull();
      expect(tryParse('invalid')).toBeNull();
    });
  });

  describe('format()', () => {
    it('should format timestamp with pattern', () => {
      const timestamp = parse('2024-06-15T10:30:45');
      const result = format(timestamp, 'yyyy-MM-dd');
      expect(result).toBe('2024-06-15');
    });

    it('should format with time components', () => {
      const timestamp = parse('2024-06-15T10:30:45');
      const result = format(timestamp, 'HH:mm:ss');
      expect(result).toBe('10:30:45');
    });

    it('should handle complex patterns', () => {
      const timestamp = parse('2024-06-15T10:30:45.123');
      const result = format(timestamp, 'yyyy-MM-dd HH:mm:ss.SSS');
      expect(result).toBe('2024-06-15 10:30:45.123');
    });
  });

  describe('formatDate()', () => {
    it('should format as yyyy-MM-dd', () => {
      const timestamp = parse('2024-06-15T10:30:00');
      expect(formatDate(timestamp)).toBe('2024-06-15');
    });
  });

  describe('formatDateTime()', () => {
    it('should format as yyyy-MM-dd HH:mm:ss', () => {
      const timestamp = parse('2024-06-15T10:30:45');
      expect(formatDateTime(timestamp)).toBe('2024-06-15 10:30:45');
    });
  });

  describe('toISOString()', () => {
    it('should format as ISO 8601', () => {
      const timestamp = parse('2024-06-15T10:30:45.123Z');
      const result = toISOString(timestamp);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});

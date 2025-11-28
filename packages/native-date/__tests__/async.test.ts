import {
  parseManyAsync,
  formatManyAsync,
  getComponentsManyAsync,
} from '../src/index';

describe('Async Batch Operations', () => {
  describe('parseManyAsync()', () => {
    it('should parse multiple valid date strings', async () => {
      const dateStrings = ['2024-01-15', '2024-06-20', '2024-12-25'];
      const results = await parseManyAsync(dateStrings);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeValidTimestamp();
      });
    });

    it('should return NaN for invalid date strings', async () => {
      const dateStrings = ['2024-01-15', 'invalid', '2024-12-25'];
      const results = await parseManyAsync(dateStrings);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeValidTimestamp();
      expect(results[1]).toBeNaN();
      expect(results[2]).toBeValidTimestamp();
    });

    it('should handle empty array', async () => {
      const results = await parseManyAsync([]);
      expect(results).toHaveLength(0);
    });

    it('should handle large arrays', async () => {
      const dateStrings = Array.from(
        { length: 100 },
        (_, i) => `2024-${String((i % 12) + 1).padStart(2, '0')}-15`
      );
      const results = await parseManyAsync(dateStrings);

      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result).toBeValidTimestamp();
      });
    });
  });

  describe('formatManyAsync()', () => {
    it('should format multiple timestamps', async () => {
      // Use explicit times to avoid timezone boundary issues
      const timestamps = [
        new Date('2024-01-15T12:00:00').getTime(),
        new Date('2024-06-20T12:00:00').getTime(),
        new Date('2024-12-25T12:00:00').getTime(),
      ];
      const results = await formatManyAsync(timestamps, 'yyyy-MM-dd');

      expect(results).toHaveLength(3);
      expect(results[0]).toBe('2024-01-15');
      expect(results[1]).toBe('2024-06-20');
      expect(results[2]).toBe('2024-12-25');
    });

    it('should handle different format patterns', async () => {
      const timestamps = [new Date('2024-06-15T10:30:45').getTime()];
      const results = await formatManyAsync(timestamps, 'HH:mm:ss');

      expect(results).toHaveLength(1);
      expect(results[0]).toBe('10:30:45');
    });

    it('should handle empty array', async () => {
      const results = await formatManyAsync([], 'yyyy-MM-dd');
      expect(results).toHaveLength(0);
    });
  });

  describe('getComponentsManyAsync()', () => {
    it('should get components for multiple timestamps', async () => {
      const timestamps = [
        new Date('2024-01-15T10:30:45').getTime(),
        new Date('2024-06-20T15:45:30').getTime(),
      ];
      const results = await getComponentsManyAsync(timestamps);

      expect(results).toHaveLength(2);

      const first = results[0]!;
      const second = results[1]!;

      expect(first.year).toBe(2024);
      expect(first.month).toBe(1);
      expect(first.day).toBe(15);

      expect(second.year).toBe(2024);
      expect(second.month).toBe(6);
      expect(second.day).toBe(20);
    });

    it('should handle empty array', async () => {
      const results = await getComponentsManyAsync([]);
      expect(results).toHaveLength(0);
    });
  });
});

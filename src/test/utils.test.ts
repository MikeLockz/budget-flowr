import { describe, it, expect, vi } from 'vitest';
import { cn, formatCurrency, formatDate, truncateString, generateId, formatDollarWholeNumber } from '../lib/utils';

describe('cn function', () => {
  it('should combine class names correctly', () => {
    // Test with simple strings
    expect(cn('class1', 'class2')).toBe('class1 class2');
    
    // Test with conditional classes
    expect(cn('base', 'included', undefined)).toBe('base included');
    
    // Test with object syntax
    expect(cn('base', { 'conditional': true, 'not-included': false })).toBe('base conditional');
    
    // Test with array syntax
    expect(cn('base', ['array-item', 'another-item'])).toBe('base array-item another-item');
    
    // Test with tailwind conflicting classes (tailwind-merge functionality)
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('formatCurrency function', () => {
  it('should format numbers as currency with default parameters', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(-1000)).toBe('-$1,000.00');
  });
  
  it('should format numbers with different currencies', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
    expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
    expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
  });
  
  it('should format numbers with different locales', () => {
    expect(formatCurrency(1000, 'USD', 'en-US')).toBe('$1,000.00');
    
    // Use regex for German locale to avoid potential invisible character issues
    const deResult = formatCurrency(1000, 'EUR', 'de-DE');
    expect(deResult).toMatch(/1\.000,00\s*€/);
    
    // Use regex for French locale to avoid potential invisible character issues
    const frResult = formatCurrency(1000, 'EUR', 'fr-FR');
    expect(frResult).toMatch(/1\s*000,00\s*€/);
  });
});

describe('formatDollarWholeNumber function', () => {
  it('should format numbers as whole dollar amounts', () => {
    expect(formatDollarWholeNumber(1000)).toBe('$1,000');
    expect(formatDollarWholeNumber(1234.56)).toBe('$1,235');
    expect(formatDollarWholeNumber(0)).toBe('$0');
    expect(formatDollarWholeNumber(-1000)).toBe('-$1,000');
  });
  
  it('should round numbers correctly', () => {
    expect(formatDollarWholeNumber(1234.49)).toBe('$1,234');
    expect(formatDollarWholeNumber(1234.5)).toBe('$1,235');
    expect(formatDollarWholeNumber(0.4)).toBe('$0');
    expect(formatDollarWholeNumber(0.5)).toBe('$1');
  });
});

describe('formatDate function', () => {
  it('should format dates with default options', () => {
    const testDate = new Date('2025-05-01T12:00:00Z');
    expect(formatDate(testDate)).toBe('May 1, 2025');
  });
  
  it('should format dates with custom options', () => {
    const testDate = new Date('2025-05-01T12:00:00Z');
    
    expect(formatDate(testDate, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })).toBe('May 1, 2025');
    
    expect(formatDate(testDate, { 
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit' 
    })).toBe('05/01/25');
    
    expect(formatDate(testDate, { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })).toMatch(/\w+, May 1, 2025/); // Day of week depends on timezone
    
    expect(formatDate(testDate, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })).toMatch(/May 1, 2025(,)? (at )?\d{1,2}:\d{2} (AM|PM)/); // Time depends on timezone
  });
});

describe('truncateString function', () => {
  it('should truncate strings longer than the specified length', () => {
    expect(truncateString('This is a long string', 10)).toBe('This is a ...');
    expect(truncateString('Short', 10)).toBe('Short');
    expect(truncateString('Exactly 10', 10)).toBe('Exactly 10');
    expect(truncateString('', 10)).toBe('');
  });
  
  it('should handle edge cases', () => {
    expect(truncateString('Test', 0)).toBe('...');
    expect(truncateString('Test', 1)).toBe('T...');
    expect(truncateString('Test', 4)).toBe('Test');
  });
  
  it('should handle negative length values', () => {
    expect(truncateString('Test', -5)).toBe('...');
  });
  
  it('should handle special characters correctly', () => {
    expect(truncateString('Special 😊 characters', 10)).toBe('Special 😊...');
    expect(truncateString('Unicode: 汉字', 10)).toBe('Unicode: 汉...');
  });
});

describe('generateId function', () => {
  it('should generate a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });
  
  it('should generate a string with the expected length', () => {
    const id = generateId();
    expect(id.length).toBe(7); // Based on implementation: substring(2, 9)
  });
  
  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100); // All IDs should be unique
  });
  
  it('should use Math.random for generation', () => {
    // Mock Math.random to return a fixed value
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValue(0.5);
    
    const id1 = generateId();
    const id2 = generateId();
    
    // With a fixed random value, the IDs should be identical
    expect(id1).toBe(id2);
    
    // Restore the original implementation
    randomSpy.mockRestore();
  });
});

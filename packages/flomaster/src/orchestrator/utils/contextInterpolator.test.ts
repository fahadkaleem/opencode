import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { findVariables, interpolate } from './contextInterpolator.js';

describe('context-interpolator', () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  });

  describe('interpolate', () => {
    it('should replace a single placeholder with a string value', () => {
      const template = 'Hello, {{name}}!';
      const context = { name: 'World' };
      const result = interpolate(template, context);
      expect(result).toBe('Hello, World!');
    });

    it('should replace multiple unique placeholders', () => {
      const template = 'User: {{user}}, Role: {{role}}';
      const context = { user: 'Alex', role: 'Admin' };
      const result = interpolate(template, context);
      expect(result).toBe('User: Alex, Role: Admin');
    });

    it('should replace multiple instances of the same placeholder', () => {
      const template = '{{greeting}}, {{user}}. Welcome, {{user}}!';
      const context = { greeting: 'Hi', user: 'Sam' };
      const result = interpolate(template, context);
      expect(result).toBe('Hi, Sam. Welcome, Sam!');
    });

    it('should handle number values', () => {
      const template = 'Count: {{count}}';
      const context = { count: 42 };
      const result = interpolate(template, context);
      expect(result).toBe('Count: 42');
    });

    it('should handle boolean values', () => {
      const template = 'Active: {{isActive}}';
      const context = { isActive: true };
      const result = interpolate(template, context);
      expect(result).toBe('Active: true');
    });

    it('should handle null values', () => {
      const template = 'Value: {{value}}';
      const context = { value: null };
      const result = interpolate(template, context);
      expect(result).toBe('Value: null');
    });

    it('should replace undefined values with empty string by default', () => {
      const template = 'Value: {{missing}}';
      const context = { other: 'test' };
      const result = interpolate(template, context);
      expect(result).toBe('Value: ');
    });

    it('should throw on undefined when option is set', () => {
      const template = 'Value: {{missing}}';
      const context = { other: 'test' };
      expect(() =>
        interpolate(template, context, { throwOnUndefined: true }),
      ).toThrow('Undefined variable: missing');
    });

    it('should return the original string if no placeholders are present', () => {
      const template = 'This is a plain string.';
      const context = { key: 'value' };
      const result = interpolate(template, context);
      expect(result).toBe('This is a plain string.');
    });

    it('should handle an empty template string', () => {
      const template = '';
      const context = { key: 'value' };
      const result = interpolate(template, context);
      expect(result).toBe('');
    });

    it('should handle empty context (replaces with empty string)', () => {
      const template = 'Hello, {{name}}!';
      const context = {};
      const result = interpolate(template, context);
      expect(result).toBe('Hello, !');
    });

    it('should handle nested object access with dot notation', () => {
      const template = 'City: {{user.address.city}}';
      const context = { user: { address: { city: 'New York' } } };
      const result = interpolate(template, context);
      expect(result).toBe('City: New York');
    });

    it('should handle array access', () => {
      const template = 'First item: {{items.0}}';
      const context = { items: ['apple', 'banana', 'cherry'] };
      const result = interpolate(template, context);
      expect(result).toBe('First item: apple');
    });

    it('should handle whitespace in placeholders', () => {
      const template = 'Hello, {{ name }}!';
      const context = { name: 'World' };
      const result = interpolate(template, context);
      expect(result).toBe('Hello, World!');
    });

    it('should stringify object values', () => {
      const template = 'Data: {{data}}';
      const context = { data: { foo: 'bar' } };
      const result = interpolate(template, context);
      expect(result).toBe('Data: {"foo":"bar"}');
    });

    it('should stringify array values', () => {
      const template = 'Items: {{items}}';
      const context = { items: [1, 2, 3] };
      const result = interpolate(template, context);
      expect(result).toBe('Items: [1,2,3]');
    });
  });

  describe('findVariables', () => {
    it('should extract single variable', () => {
      const template = 'Hello, {{name}}!';
      const result = findVariables(template);
      expect(result).toEqual(['name']);
    });

    it('should extract multiple unique variables', () => {
      const template = '{{greeting}}, {{name}}!';
      const result = findVariables(template);
      expect(result).toEqual(['greeting', 'name']);
    });

    it('should deduplicate repeated variables', () => {
      const template = '{{name}} is {{name}}';
      const result = findVariables(template);
      expect(result).toEqual(['name']);
    });

    it('should return empty array for no variables', () => {
      const template = 'Hello, World!';
      const result = findVariables(template);
      expect(result).toEqual([]);
    });

    it('should handle nested path variables', () => {
      const template = '{{user.name}} lives in {{user.address.city}}';
      const result = findVariables(template);
      expect(result).toEqual(['user.name', 'user.address.city']);
    });

    it('should handle whitespace in variables', () => {
      const template = '{{ name }}';
      const result = findVariables(template);
      expect(result).toEqual(['name']);
    });
  });
});

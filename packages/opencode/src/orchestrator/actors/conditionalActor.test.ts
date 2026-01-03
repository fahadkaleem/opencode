/**
 * Conditional Actor Tests
 */

import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { ConditionalOperator } from '../types.js';
import {
  createConditionalInput,
  evaluateCondition,
  extractInputText,
  extractMatchText,
  extractOperator,
} from './conditionalActor.js';

describe('conditional-actor', () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  });

  describe('evaluateCondition', () => {
    describe('equals operator', () => {
      it('should return true when strings are equal', () => {
        const result = evaluateCondition('hello', 'hello', 'equals', true);
        expect(result).toBe(true);
      });

      it('should return false when strings are not equal', () => {
        const result = evaluateCondition('hello', 'world', 'equals', true);
        expect(result).toBe(false);
      });

      it('should be case-insensitive when caseSensitive is false', () => {
        const result = evaluateCondition('Hello', 'hello', 'equals', false);
        expect(result).toBe(true);
      });
    });

    describe('not equals operator', () => {
      it('should return true when strings are different', () => {
        const result = evaluateCondition('hello', 'world', 'not equals', true);
        expect(result).toBe(true);
      });

      it('should return false when strings are equal', () => {
        const result = evaluateCondition('hello', 'hello', 'not equals', true);
        expect(result).toBe(false);
      });
    });

    describe('contains operator', () => {
      it('should return true when input contains match', () => {
        const result = evaluateCondition(
          'hello world',
          'world',
          'contains',
          true,
        );
        expect(result).toBe(true);
      });

      it('should return false when input does not contain match', () => {
        const result = evaluateCondition('hello', 'world', 'contains', true);
        expect(result).toBe(false);
      });
    });

    describe('not contains operator', () => {
      it('should return true when input does not contain match', () => {
        const result = evaluateCondition(
          'hello',
          'world',
          'not contains',
          true,
        );
        expect(result).toBe(true);
      });

      it('should return false when input contains match', () => {
        const result = evaluateCondition(
          'hello world',
          'world',
          'not contains',
          true,
        );
        expect(result).toBe(false);
      });
    });

    describe('starts with operator', () => {
      it('should return true when input starts with match', () => {
        const result = evaluateCondition(
          'hello world',
          'hello',
          'starts with',
          true,
        );
        expect(result).toBe(true);
      });

      it('should return false when input does not start with match', () => {
        const result = evaluateCondition(
          'hello world',
          'world',
          'starts with',
          true,
        );
        expect(result).toBe(false);
      });
    });

    describe('ends with operator', () => {
      it('should return true when input ends with match', () => {
        const result = evaluateCondition(
          'hello world',
          'world',
          'ends with',
          true,
        );
        expect(result).toBe(true);
      });

      it('should return false when input does not end with match', () => {
        const result = evaluateCondition(
          'hello world',
          'hello',
          'ends with',
          true,
        );
        expect(result).toBe(false);
      });
    });

    describe('regex operator', () => {
      it('should return true when input matches regex', () => {
        const result = evaluateCondition('hello123', '\\d+', 'regex', true);
        expect(result).toBe(true);
      });

      it('should return false when input does not match regex', () => {
        const result = evaluateCondition('hello', '\\d+', 'regex', true);
        expect(result).toBe(false);
      });

      it('should return false when regex is invalid', () => {
        const result = evaluateCondition('hello', '[invalid(', 'regex', true);
        expect(result).toBe(false);
      });

      it('should be case-insensitive when caseSensitive is false', () => {
        const result = evaluateCondition('HELLO', 'hello', 'regex', false);
        expect(result).toBe(true);
      });
    });

    describe('numeric comparison operators', () => {
      it('should return true when value is less than match', () => {
        const result = evaluateCondition('5', '10', 'less than', true);
        expect(result).toBe(true);
      });

      it('should return true when value is less than or equal to match', () => {
        const result = evaluateCondition(
          '10',
          '10',
          'less than or equal',
          true,
        );
        expect(result).toBe(true);
      });

      it('should return true when value is greater than match', () => {
        const result = evaluateCondition('15', '10', 'greater than', true);
        expect(result).toBe(true);
      });

      it('should return true when value is greater than or equal to match', () => {
        const result = evaluateCondition(
          '10',
          '10',
          'greater than or equal',
          true,
        );
        expect(result).toBe(true);
      });

      it('should return false when value is not a number', () => {
        const result = evaluateCondition('abc', '10', 'less than', true);
        expect(result).toBe(false);
      });

      it('should return false when match is not a number', () => {
        const result = evaluateCondition('10', 'abc', 'less than', true);
        expect(result).toBe(false);
      });
    });
  });

  describe('extractInputText', () => {
    it('should extract input_text field when present', () => {
      const result = extractInputText({ input_text: 'hello' });
      expect(result).toBe('hello');
    });

    it('should extract inputText field when present', () => {
      const result = extractInputText({ inputText: 'hello' });
      expect(result).toBe('hello');
    });

    it('should extract text from message object when present', () => {
      const result = extractInputText({ message: { text: 'hello' } });
      expect(result).toBe('hello');
    });

    it('should return empty string when no valid field is found', () => {
      const result = extractInputText({});
      expect(result).toBe('');
    });

    it('should convert non-string values to string', () => {
      const result = extractInputText({ value: 123 });
      expect(result).toBe('123');
    });
  });

  describe('extractMatchText', () => {
    it('should extract match_text field when present', () => {
      const result = extractMatchText({ match_text: 'pattern' });
      expect(result).toBe('pattern');
    });

    it('should extract matchText field when present', () => {
      const result = extractMatchText({ matchText: 'pattern' });
      expect(result).toBe('pattern');
    });

    it('should return empty string when no valid field is found', () => {
      const result = extractMatchText({});
      expect(result).toBe('');
    });
  });

  describe('extractOperator', () => {
    it('should extract valid operator when present', () => {
      const result = extractOperator({ operator: 'contains' });
      expect(result).toBe('contains');
    });

    it('should return equals as default when operator is invalid', () => {
      const result = extractOperator({ operator: 'invalid' });
      expect(result).toBe('equals');
    });

    it('should return equals as default when operator is missing', () => {
      const result = extractOperator({});
      expect(result).toBe('equals');
    });
  });

  describe('createConditionalInput', () => {
    it('should create conditional input from inputs and config', () => {
      const inputs = {
        input_text: 'hello',
        match_text: 'hello',
        true_case_message: 'matched',
        false_case_message: 'not matched',
      };
      const config = {
        operator: 'equals' as ConditionalOperator,
        caseSensitive: true,
        maxIterations: 10,
      };

      const result = createConditionalInput(inputs, config, 0);

      expect(result.inputText).toBe('hello');
      expect(result.matchText).toBe('hello');
      expect(result.operator).toBe('equals');
      expect(result.caseSensitive).toBe(true);
      expect(result.trueCaseMessage).toBe('matched');
      expect(result.falseCaseMessage).toBe('not matched');
      expect(result.maxIterations).toBe(10);
      expect(result.currentIteration).toBe(0);
    });
  });
});

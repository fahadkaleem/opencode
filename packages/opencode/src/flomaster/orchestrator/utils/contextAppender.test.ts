import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { PromptBuildConfig, StepContext } from '../types.js';
import {
  appendContextToPrompt,
  buildContextBlock,
  buildPrompt,
  resolveContextSource,
} from './contextInterpolator.js';

describe('resolveContextSource', () => {
  describe('output type', () => {
    it('resolves string value from shared context', async () => {
      const ctx: StepContext = {
        name: 'spec',
        source: 'write-spec.document',
        type: 'output',
      };
      const sharedContext = {
        'write-spec': { document: 'Spec content here' },
      };

      const result = await resolveContextSource(ctx, sharedContext);
      expect(result).toBe('Spec content here');
    });

    it('returns JSON for object values', async () => {
      const ctx: StepContext = {
        name: 'data',
        source: 'step.output',
        type: 'output',
      };
      const sharedContext = {
        step: { output: { key: 'value' } },
      };

      const result = await resolveContextSource(ctx, sharedContext);
      expect(result).toBe('{"key":"value"}');
    });

    it('returns null for missing output', async () => {
      const ctx: StepContext = {
        name: 'missing',
        source: 'nonexistent.output',
        type: 'output',
      };

      const result = await resolveContextSource(ctx, {});
      expect(result).toBeNull();
    });
  });

  describe('file type', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'context-test-'));
      await fs.writeFile(path.join(tempDir, 'test.md'), 'File contents here');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('returns path for mode=path (default)', async () => {
      const ctx: StepContext = {
        name: 'rules',
        source: 'test.md',
        type: 'file',
      };

      const result = await resolveContextSource(ctx, {}, { baseDir: tempDir });
      expect(result).toBe('test.md');
    });

    it('returns file contents for mode=contents', async () => {
      const ctx: StepContext = {
        name: 'rules',
        source: 'test.md',
        type: 'file',
        mode: 'contents',
      };

      const result = await resolveContextSource(ctx, {}, { baseDir: tempDir });
      expect(result).toBe('File contents here');
    });

    it('returns null for missing file with mode=contents', async () => {
      const ctx: StepContext = {
        name: 'missing',
        source: 'nonexistent.md',
        type: 'file',
        mode: 'contents',
      };

      const result = await resolveContextSource(ctx, {}, { baseDir: tempDir });
      expect(result).toBeNull();
    });
  });

  describe('static type', () => {
    it('returns literal source string', async () => {
      const ctx: StepContext = {
        name: 'instructions',
        source: 'Always run tests before completing.',
        type: 'static',
      };

      const result = await resolveContextSource(ctx, {});
      expect(result).toBe('Always run tests before completing.');
    });
  });
});

describe('buildContextBlock', () => {
  it('builds XML context block from multiple contexts', async () => {
    const contexts: StepContext[] = [
      { name: 'spec', source: 'step.doc', type: 'output' },
      { name: 'note', source: 'Run tests', type: 'static' },
    ];
    const sharedContext = {
      step: { doc: 'Spec content' },
    };

    const result = await buildContextBlock(contexts, sharedContext);

    expect(result).toBe(
      '<context>\n' +
        '<spec>\nSpec content\n</spec>\n' +
        '<note>\nRun tests\n</note>\n' +
        '</context>',
    );
  });

  it('returns empty string for empty contexts', async () => {
    const result = await buildContextBlock([], {});
    expect(result).toBe('');
  });

  it('skips contexts that resolve to null', async () => {
    const contexts: StepContext[] = [
      { name: 'missing', source: 'nonexistent.output', type: 'output' },
      { name: 'present', source: 'Hello', type: 'static' },
    ];

    const result = await buildContextBlock(contexts, {});

    expect(result).toBe('<context>\n<present>\nHello\n</present>\n</context>');
  });

  it('returns empty string when all contexts resolve to null', async () => {
    const contexts: StepContext[] = [
      { name: 'missing', source: 'nonexistent.output', type: 'output' },
    ];

    const result = await buildContextBlock(contexts, {});
    expect(result).toBe('');
  });
});

describe('appendContextToPrompt', () => {
  it('appends context block with double newline', () => {
    const prompt = 'Do the task.';
    const contextBlock = '<context>\n<spec>\nContent\n</spec>\n</context>';

    const result = appendContextToPrompt(prompt, contextBlock);

    expect(result).toBe(
      'Do the task.\n\n<context>\n<spec>\nContent\n</spec>\n</context>',
    );
  });

  it('returns original prompt for empty context block', () => {
    const prompt = 'Do the task.';
    const result = appendContextToPrompt(prompt, '');
    expect(result).toBe('Do the task.');
  });
});

describe('buildPrompt', () => {
  it('combines interpolation and context appending', async () => {
    const config: PromptBuildConfig = {
      template: 'Implement: {{task.title}}',
      context: [{ name: 'spec', source: 'planning.spec', type: 'output' }],
    };
    const sharedContext = {
      task: { title: 'User Auth' },
      planning: { spec: 'Build OAuth2 login' },
    };

    const result = await buildPrompt(config, sharedContext);

    expect(result).toBe(
      'Implement: User Auth\n\n' +
        '<context>\n<spec>\nBuild OAuth2 login\n</spec>\n</context>',
    );
  });

  it('works with template only (no context)', async () => {
    const sharedContext = {
      greeting: { name: 'World' },
    };

    // Note: name is at root level in flattened context
    const result = await buildPrompt(
      { template: 'Hello, {{greeting.name}}!' },
      sharedContext,
    );

    expect(result).toBe('Hello, World!');
  });

  it('works with context only (no interpolation)', async () => {
    const config: PromptBuildConfig = {
      template: 'Follow the spec below.',
      context: [{ name: 'spec', source: 'Build something', type: 'static' }],
    };

    const result = await buildPrompt(config, {});

    expect(result).toBe(
      'Follow the spec below.\n\n' +
        '<context>\n<spec>\nBuild something\n</spec>\n</context>',
    );
  });

  it('uses undefinedValue option for missing variables', async () => {
    const config: PromptBuildConfig = {
      template: 'Task: {{missing}}',
    };

    const result = await buildPrompt(config, {}, { undefinedValue: '[N/A]' });

    expect(result).toBe('Task: [N/A]');
  });

  it('throws on undefined when throwOnUndefined is true', async () => {
    const config: PromptBuildConfig = {
      template: 'Task: {{missing}}',
    };

    await expect(
      buildPrompt(config, {}, { throwOnUndefined: true }),
    ).rejects.toThrow('Undefined variable: missing');
  });
});

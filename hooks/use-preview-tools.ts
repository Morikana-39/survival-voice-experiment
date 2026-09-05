'use client';
import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type Context = {
  registerTool(
    tool: Tool,
    options: { signal: AbortSignal },
  ): void | Promise<void>;
};

// Researcher preview only. Never expose automation actions in real participant sessions.
export function usePreviewTools(
  preview: boolean,
  phase: string,
  busy: boolean,
  restart: () => void,
) {
  const current = useRef({ preview, phase, busy, restart });
  useEffect(() => {
    current.current = { preview, phase, busy, restart };
  }, [preview, phase, busy, restart]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!preview || !context) return;
    const lifecycle = new AbortController(),
      schema = { type: 'object', properties: {}, additionalProperties: false };
    const validate = (input: unknown) => {
      if (
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input) ||
        Object.keys(input).length
      )
        throw new Error('Expected an empty object');
      if (!current.current.preview)
        throw new Error('Available only in preview');
    };
    const register = (tool: Tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'get_experiment_preview_stage',
      title: 'Read experiment preview stage',
      description:
        'Read the current researcher preview stage without revealing participant answers or the assigned condition.',
      inputSchema: schema,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        validate(input);
        return {
          mode: 'preview',
          phase: current.current.phase,
          busy: current.current.busy,
        };
      },
    });
    register({
      name: 'restart_experiment_preview',
      title: 'Restart experiment preview',
      description:
        'Return the researcher preview to the consent screen. Does not submit consent or create a real participant session.',
      inputSchema: schema,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        validate(input);
        if (current.current.busy) throw new Error('Wait for the current save');
        flushSync(() => current.current.restart());
        return { phase: 'consent', mode: 'preview' };
      },
    });
    return () => lifecycle.abort();
  }, [preview]);
}

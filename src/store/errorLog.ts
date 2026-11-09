import { isBoolean, isRecord } from '@/domain';

import { createPersistedStore } from './createPersistedStore';
import { nonNegative } from './storage';

/** One caught error. It stays on this phone; only a player copying diagnostics moves it. */
export type LoggedError = {
  at: number;
  /** `Name: message`. */
  message: string;
  stack: string | null;
  /** Where in the screen tree a render crash happened; null for errors outside rendering. */
  componentStack: string | null;
  /** True when it brought up the recovery screen. */
  fatal: boolean;
};

/** Where an error was caught, beyond the error itself. */
export type ErrorContext = { fatal: boolean; componentStack?: string | null };

/** The newest errors kept; older ones drop off. */
export const ERROR_LOG_LIMIT = 5;
/** Stacks are cut to this length so a deep render tree cannot bloat the log. */
const STACK_MAX_LENGTH = 2000;

type ErrorLogData = { errors: LoggedError[] };

const DEFAULTS: ErrorLogData = { errors: [] };

const isStackOrNull = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

function isLoggedError(value: unknown): value is LoggedError {
  return (
    isRecord(value) &&
    nonNegative(value.at) &&
    typeof value.message === 'string' &&
    isStackOrNull(value.stack) &&
    isStackOrNull(value.componentStack) &&
    isBoolean(value.fatal)
  );
}

function sanitizeErrorLog(stored: Record<string, unknown>): Partial<ErrorLogData> {
  return Array.isArray(stored.errors)
    ? { errors: stored.errors.filter(isLoggedError).slice(0, ERROR_LOG_LIMIT) }
    : {};
}

const trimStack = (stack: string | null | undefined): string | null =>
  stack ? stack.trim().slice(0, STACK_MAX_LENGTH) : null;

/** Turns anything thrown into a log entry; throwing a non-`Error` value still leaves a trace. */
export function toLoggedError(error: unknown, context: ErrorContext, at: number): LoggedError {
  const isError = error instanceof Error;

  return {
    at,
    message: isError ? `${error.name}: ${error.message}` : String(error),
    stack: trimStack(isError ? error.stack : null),
    componentStack: trimStack(context.componentStack),
    fatal: context.fatal,
  };
}

/** The last few errors, newest first, kept on this phone and never sent anywhere. */
export const useErrorLogStore = createPersistedStore({
  key: 'nearbydice.errorLog.v1',
  defaults: DEFAULTS,
  sanitize: sanitizeErrorLog,
  actions: (update) => ({
    record: (error: unknown, context: ErrorContext) =>
      update(({ errors }) => ({
        errors: [toLoggedError(error, context, Date.now()), ...errors].slice(0, ERROR_LOG_LIMIT),
      })),
  }),
});

import { performance } from 'perf_hooks';

const VALID_EXECUTION_ID_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const createExecutionId = (length = 6) => {
  let result = '';

  for ( var i = 0; i < length; i++ ) {
    const characterIndex = Math.floor(Math.random() * VALID_EXECUTION_ID_CHARACTERS.length);
    result += VALID_EXECUTION_ID_CHARACTERS.charAt(characterIndex);
  }

  return result;
};

export const log = (prefix: string, message: string) => {
  console.log(`[${prefix}] ${message}`);
};

export const logExecution = async <T>(
  prefix: string,
  startLabel: string,
  endLabel: string,
  fn: () => Promise<T>
): Promise<T> => {
  const executionId = createExecutionId();

  log(prefix, `[${executionId}] ${startLabel}`);

  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  log(prefix, `[${executionId}] ${endLabel}: ${end - start}ms`);

  return result;
};

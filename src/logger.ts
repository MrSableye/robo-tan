import { performance } from 'perf_hooks';

export const log = (prefix: string, message: string) => {
    console.log(`[${prefix}] ${message}`);
};

export const logExecution = async <T>(
    prefix: string,
    startLabel: string,
    endLabel: string,
    fn: () => Promise<T>
): Promise<T> => {
    log(prefix, startLabel);

    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    log(prefix, `${endLabel}: ${end - start}ms`);

    return result;
};

const cache: Set<symbol> = new Set();

/**
 * Throttle a function. It will ignore any calls to it in the
 * timeout time since it was last called successfully.
 *
 * @param timeout in milliseconds
 */
export function throttleFunction<T>(timeout: number): (
    target: T ,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<() => Promise<void>>,
) => void {
    return (
        _target: T,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<(
            ...args: unknown[]
        ) => Promise<void>>,
    ): void => {

        if (descriptor.value === undefined) {
            throw new Error('Invalid trottleFunction usage detected');
        }

        const oldMethod = descriptor.value;
        const identifier = Symbol();

        descriptor.value = function(...args: unknown[]): Promise<void> {
            if (!cache.has(identifier)) {
                oldMethod.call(this, args);
                cache.add(identifier);
                setTimeout((): void => {
                    cache.delete(identifier);
                }, timeout);
            }

            return Promise.resolve();
        };
    };
}

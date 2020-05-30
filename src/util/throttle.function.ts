const cache: Set<symbol> = new Set();

/**
 * Throttle a function. It will ignore any calls to it in the
 * timeout time since it was last called successfully.
 *
 * @param timeout in milliseconds
 */
export function throttleFunction<T, R = void>(timeout: number): (
    target: T ,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<() => Promise<R | undefined>>,
) => void {
    return (
        _target: T,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<(
            ...args: unknown[]
        ) => Promise<R | undefined>>,
    ): void => {

        if (descriptor.value === undefined) {
            throw new Error('Invalid trottleFunction usage detected');
        }

        const oldMethod = descriptor.value;
        const identifier = Symbol();

        descriptor.value = async function(
            ...args: unknown[]
        ): Promise<R | undefined> {
            if (!cache.has(identifier)) {
                cache.add(identifier);
                setTimeout((): void => {
                    cache.delete(identifier);
                }, timeout);
                return oldMethod.call(this, args);
            }
        };
    };
}

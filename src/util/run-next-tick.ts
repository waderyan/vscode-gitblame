/**
 * Throttle a function. It will ignore any calls to it in the
 * timeout time since it was last called successfully.
 *
 * @param timeout in milliseconds
 */
export function runNextTick<T, ReturnValue = void>(): (
    target: T ,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<() => Promise<ReturnValue>>,
) => void {
    return (
        _target: T,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<(
            ...args: unknown[]
        ) => Promise<ReturnValue>>,
    ): void => {

        if (descriptor.value === undefined) {
            throw new Error('Invalid runNextTick usage detected');
        }

        const oldMethod = descriptor.value;

        descriptor.value = function(...args: unknown[]): Promise<ReturnValue> {
            return new Promise((resolve): void => {
                setImmediate((): void => {
                    resolve(oldMethod.call(this, args));
                });
            });
        };
    };
}

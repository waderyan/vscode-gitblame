export interface Thenable<T> {
    then<Resolve>(
        fulfilled?: (value: T) => Resolve | Thenable<Resolve>,
        reject?: (reason: unknown) => Resolve | Thenable<Resolve>,
    ): Thenable<Resolve>;
    then<Resolve>(
        fulfilled?: (value: T) => Resolve | Thenable<Resolve>,
        reject?: (reason: unknown) => void,
    ): Thenable<Resolve>;
}

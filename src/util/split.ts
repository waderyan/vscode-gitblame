export function split(target: string, char = " "): [string, string] {
    if (char.length !== 1) {
        throw new Error(`Invalid split character argument "${char}"`);
    }
    const targetIndex = target.indexOf(char);

    if (targetIndex === -1) {
        return [target, ""];
    }

    return [
        target.substr(0, targetIndex),
        target.substr(targetIndex + 1).trim(),
    ];
}

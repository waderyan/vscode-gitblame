const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;

function unitsBetween(unit: number, compareTo: Date, now: Date): number {
    const diffMilliseconds = compareTo.valueOf() - now.valueOf();

    return Math.round(diffMilliseconds / unit);
}

export function secondsBetween(compareTo: Date, now: Date): number {
    return unitsBetween(SECOND, compareTo, now);
}

export function minutesBetween(compareTo: Date, now: Date): number {
    return unitsBetween(MINUTE, compareTo, now);
}

export function hoursBetween(compareTo: Date, now: Date): number {
    return unitsBetween(HOUR, compareTo, now);
}

export function daysBetween(compareTo: Date, now: Date): number {
    return unitsBetween(DAY, compareTo, now);
}

export function monthsBetween(compareTo: Date, now: Date): number {
    return unitsBetween(MONTH, compareTo, now);
}

export function yearsBetween(compareTo: Date, now: Date): number {
    return unitsBetween(YEAR, compareTo, now);
}

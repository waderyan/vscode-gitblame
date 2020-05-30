const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;

function unitsBetween(unit: number, now: Date, compareTo: Date): number {
    const diffMilliseconds = now.valueOf() - compareTo.valueOf();

    return Math.round(diffMilliseconds / unit);
}

export function secondsBetween(now: Date, compareTo: Date): number {
    return unitsBetween(SECOND, now, compareTo);
}

export function minutesBetween(now: Date, compareTo: Date): number {
    return unitsBetween(MINUTE, now, compareTo);
}

export function hoursBetween(now: Date, compareTo: Date): number {
    return unitsBetween(HOUR, now, compareTo);
}

export function daysBetween(now: Date, compareTo: Date): number {
    return unitsBetween(DAY, now, compareTo);
}

export function monthsBetween(now: Date, compareTo: Date): number {
    return unitsBetween(MONTH, now, compareTo);
}

export function yearsBetween(now: Date, compareTo: Date): number {
    return unitsBetween(YEAR, now, compareTo);
}

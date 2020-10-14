const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;

function between(unit: number, now: Date, compare: Date): number {
    const diffMilliseconds = now.valueOf() - compare.valueOf();

    return Math.round(diffMilliseconds / unit);
}

export const minutesBetween = (
    now: Date,
    compare: Date,
): number => between(MINUTE, now, compare);

export const hoursBetween = (
    now: Date,
    compare: Date,
): number => between(HOUR, now, compare);

export const daysBetween = (
    now: Date,
    compare: Date,
): number => between(DAY, now, compare);

export const monthsBetween = (
    now: Date,
    compare: Date,
): number => between(MONTH, now, compare);

export const yearsBetween = (
    now: Date,
    compare: Date,
): number => between(YEAR, now, compare);

import { appendOrNot } from "./append-or-not";
import { getProperty } from "./property";
import {
    daysBetween,
    hoursBetween,
    minutesBetween,
    monthsBetween,
    yearsBetween,
} from "./ago";

import type { Commit } from "../git/util/stream-parsing";

type InfoTokenFunctionWithParameter = (value: string) => string;
type InfoTokenFunction = InfoTokenFunctionWithParameter | string;

export type InfoTokens = {
    [key: string]: InfoTokenFunction | undefined;
}

export type InfoTokenNormalizedCommitInfo = {
    "author.mail": string;
    "author.name": string;
    "author.timestamp": string;
    "author.tz": string;
    "author.date": string;
    "commit.hash": string;
    "commit.hash_short": InfoTokenFunctionWithParameter;
    "commit.summary": InfoTokenFunctionWithParameter;
    "committer.mail": string;
    "committer.name": string;
    "committer.timestamp": string;
    "committer.tz": string;
    "committer.date": string;
    "time.ago": string;
    "time.c_ago": string;
    "time.c_from": string;
    "time.from": string;
}

type TokenReplaceGroup = {
    func: InfoTokenFunction;
    param: string;
    mod: string;
}

const enum MODE {
    OUT,
    IN,
}

function tokenParser<T extends InfoTokens>(token: string, infoTokens: T): TokenReplaceGroup {
    const parameterIndex = token.indexOf(",");
    const modifierIndex = token.indexOf("|");
    const subToken = (a: number, b = -1) => token.substring(a, b === -1 ? undefined : b);
    const functionName = subToken(0, Math.max(parameterIndex, modifierIndex));

    return {
        func: infoTokens[functionName] || functionName,
        param: subToken(parameterIndex + 1, modifierIndex),
        mod: modifierIndex === -1 ? "" : subToken(modifierIndex + 1),
    };
}

function * parse<T extends InfoTokens>(target: string, infoTokens: T): Generator<string | TokenReplaceGroup> {
    let lastSplit = 0;
    let mode = MODE.OUT;

    for (let index = 0; index < target.length; index++) {
        if (mode === MODE.OUT && target.substr(index, 2) === "${") {
            mode = MODE.IN;
            yield target.substring(lastSplit, index);
            lastSplit = index;
            index = index + 1;
        } else if (mode === MODE.IN && target[index] === "}") {
            mode = MODE.OUT;
            yield tokenParser(target.substring(lastSplit + 2, index), infoTokens);
            lastSplit = index + 1;
        }
    }

    yield target.substring(lastSplit);
}

function modify(value: string, modifier: string): string {
    if (modifier === "u") {
        return value.toUpperCase();
    }
    if (modifier === "l") {
        return value.toLowerCase();
    }
    if (modifier) {
        return `${value}|${modifier}`;
    }

    return value;
}

export function toDateText(dateNow: Date, dateThen: Date): string {
    const minutes = minutesBetween(dateNow, dateThen);

    if (minutes < 5) {
        return "right now";
    }
    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }

    const hours = hoursBetween(dateNow, dateThen);
    if (hours < 24) {
        return appendOrNot(hours, "hour");
    }

    const days = daysBetween(dateNow, dateThen);
    if (days < 31) {
        return appendOrNot(days, "day");
    }

    const months = monthsBetween(dateNow, dateThen);
    if (months < 12) {
        return appendOrNot(months, "month");
    }

    return appendOrNot(yearsBetween(dateNow, dateThen), "year");
}

export function normalizeCommitInfoTokens(
    {author, committer, hash, summary}: Commit,
): InfoTokenNormalizedCommitInfo {
    const now = new Date();
    const authorTime = new Date(author.time * 1000);
    const committerTime = new Date(committer.time * 1000);

    const ago = toDateText(now, authorTime);
    const cAgo = toDateText(now, committerTime);
    const shortness = (target: string, fallbackLength: string) => (length: string): string => {
        return target.substr(0, parseInt(length ?? fallbackLength, 10));
    };

    return {
        "author.mail": author.mail,
        "author.name": author.name,
        "author.timestamp": author.time.toString(),
        "author.tz": author.tz,
        "author.date": authorTime.toISOString().slice(0, 10),
        "commit.hash": hash,
        "commit.hash_short": shortness(hash, "7"),
        "commit.summary": shortness(summary, "65536"),
        "committer.mail": committer.mail,
        "committer.name": committer.name,
        "committer.timestamp": committer.time.toString(),
        "committer.tz": committer.tz,
        "committer.date": committerTime.toISOString().slice(0, 10),
        "time.ago": ago,
        "time.c_ago": cAgo,
        "time.from": ago,
        "time.c_from": cAgo,
    };
}

export function parseTokens<T extends InfoTokens>(
    target: string,
    infoTokens: T,
): string {
    let out = "";

    for (const piece of parse(target, infoTokens)) {
        if (typeof piece === "string") {
            out += piece;
        } else if (typeof piece.func === "function") {
            out += modify(piece.func(piece.param), piece.mod);
        } else {
            out += modify(piece.func, piece.mod);
        }
    }

    return out;
}

export function toTextView(commit: Commit): string {
    const messageFormat = getProperty("statusBarMessageFormat", "");

    return parseTokens(messageFormat, normalizeCommitInfoTokens(commit));
}

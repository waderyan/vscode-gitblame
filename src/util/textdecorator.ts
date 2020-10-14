import { appendOrNot } from "./append-or-not";
import { getProperty } from "./property";
import {
    daysBetween,
    hoursBetween,
    minutesBetween,
    monthsBetween,
    yearsBetween,
} from "./ago";
import { Commit } from "../git/util/stream-parsing";

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
    "commit.hash_short": (length: string) => string;
    "commit.summary": (length: string) => string;
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
    func: string;
    param: string;
    mod: string;
}

const enum MODE {
    OUT,
    IN,
}

function tokenParser(token: string): TokenReplaceGroup {
    const parameterIndex = token.indexOf(",");
    const modifierIndex = token.indexOf("|");
    const subToken = (a: number, b?: number) => token.substring(a, b);

    if (parameterIndex !== -1 && modifierIndex !== -1) {
        return {
            func: subToken(0, parameterIndex),
            param: subToken(parameterIndex + 1, modifierIndex),
            mod: subToken(modifierIndex + 1),
        };
    } else if (parameterIndex !== -1) {
        return {
            func: subToken(0, parameterIndex),
            param: subToken(parameterIndex + 1),
            mod: "",
        };
    } else if (modifierIndex !== -1) {
        return {
            func: subToken(0, modifierIndex),
            param: "",
            mod: subToken(modifierIndex + 1),
        };
    }

    return {
        func: token,
        param: "",
        mod: "",
    };
}

function parse(target: string): (string | TokenReplaceGroup)[] {
    const tokenized = [];
    let lastSplit = 0;
    let mode = MODE.OUT;

    for (let index = 0; index < target.length; index++) {
        if (mode === MODE.OUT && "${" === target.substr(index, 2)) {
            mode = MODE.IN;
            tokenized.push(target.substring(lastSplit, index));
            lastSplit = index;
            index = index + 1;
        } else if (mode === MODE.IN && target[index] === "}") {
            mode = MODE.OUT;
            const newSplitIndex = index + 1;
            tokenized.push(
                tokenParser(
                    target.substring(lastSplit + 2, newSplitIndex - 1),
                ),
            );
            lastSplit = newSplitIndex;
        }
    }

    tokenized.push(target.substring(lastSplit));

    return tokenized;
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

export function toTextView(commit: Commit): string {
    const messageFormat = getProperty("statusBarMessageFormat", "");

    return parseTokens(
        messageFormat,
        normalizeCommitInfoTokens(commit),
    );
}

export function toDateText(dateNow: Date, dateThen: Date): string {
    const years = yearsBetween(dateNow, dateThen);
    const months = monthsBetween(dateNow, dateThen);
    const days = daysBetween(dateNow, dateThen);
    const hours = hoursBetween(dateNow, dateThen);
    const minutes = minutesBetween(dateNow, dateThen);

    if (minutes < 5) {
        return "right now";
    }
    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }
    if (hours < 24) {
        return appendOrNot(hours, "hour");
    }
    if (days < 31) {
        return appendOrNot(days, "day");
    }
    if (months < 12) {
        return appendOrNot(months, "month");
    }

    return appendOrNot(years, "year");
}

export function normalizeCommitInfoTokens(
    commit: Commit,
): InfoTokenNormalizedCommitInfo {
    const now = new Date();
    const authorTime = new Date(commit.author.timestamp * 1000);
    const committerTime = new Date(commit.committer.timestamp * 1000);

    const ago = toDateText(now, authorTime);
    const cAgo = toDateText(now, committerTime);
    const shortness = (
        target: string,
        fallbackLength: string,
    ) => (length: string): string => {
        const cutoffPoint = (length || fallbackLength).toString();
        return target.substr(
            0,
            parseInt(cutoffPoint, 10),
        );
    };

    return {
        "author.mail": commit.author.mail,
        "author.name": commit.author.name,
        "author.timestamp": commit.author.timestamp.toString(),
        "author.tz": commit.author.tz,
        "author.date": authorTime.toISOString().slice(0, 10),
        "commit.hash": commit.hash,
        "commit.hash_short": shortness(commit.hash, "7"),
        "commit.summary": shortness(commit.summary, "65536"),
        "committer.mail": commit.committer.mail,
        "committer.name": commit.committer.name,
        "committer.timestamp": commit.committer.timestamp.toString(),
        "committer.tz": commit.committer.tz,
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

    for (const piece of parse(target)) {
        let func: InfoTokenFunction | undefined;
        if (typeof piece === "string") {
            out += piece;
        } else if (func = infoTokens[piece.func], func) {
            if (typeof func === "function") {
                out += modify(func(piece.param), piece.mod);
            } else {
                out += modify(func, piece.mod);
            }
        } else {
            out += modify(piece.func, piece.mod);
        }
    }

    return out;
}

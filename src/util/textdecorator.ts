import { container } from "tsyringe";

import { pluralText } from "./plural-text";
import { Property } from "./property";
import {
    daysBetween,
    hoursBetween,
    minutesBetween,
    monthsBetween,
    yearsBetween,
} from "./ago";
import {
    GitCommitInfo,
    isBlankCommit,
} from "../git/util/blanks";

type InfoTokenFunctionWithParameter = (value: string) => string;
type InfoTokenFunctionWithoutParameter = () => string;
type InfoTokenFunction =
    InfoTokenFunctionWithParameter | InfoTokenFunctionWithoutParameter;

export interface InfoTokens {
    [key: string]: InfoTokenFunction | undefined;
}

export interface InfoTokenNormalizedCommitInfo extends InfoTokens {
    "author.mail": () => string;
    "author.name": () => string;
    "author.timestamp": () => string;
    "author.tz": () => string;
    "author.date": () => string;
    "commit.hash": () => string;
    "commit.hash_short": (length: string) => string;
    "commit.summary": (length: string) => string;
    "committer.mail": () => string;
    "committer.name": () => string;
    "committer.timestamp": () => string;
    "committer.tz": () => string;
    "committer.date": () => string;
    "time.ago": () => string;
    "time.c_ago": () => string;
    "time.c_from": () => string;
    "time.from": () => string;
}

interface TokenReplaceGroup {
    token: string;
    value: string;
    modifier: string;
}

export class TextDecorator {
    public static toTextView(commit: GitCommitInfo): string {
        if (isBlankCommit(commit)) {
            return container.resolve<Property>("Property").get(
                "statusBarMessageNoCommit",
            ) || "Not Committed Yet";
        }

        const normalizedCommitInfo = TextDecorator.normalizeCommitInfoTokens(
            commit,
        );
        const messageFormat = container.resolve<Property>("Property").get(
            "statusBarMessageFormat",
        );

        if (messageFormat) {
            return TextDecorator.parseTokens(
                messageFormat,
                normalizedCommitInfo,
            );
        } else {
            return "No configured message format for gitblame";
        }
    }

    public static toDateText(dateNow: Date, dateThen: Date): string {
        const years = yearsBetween(dateNow, dateThen);
        const months = monthsBetween(dateNow, dateThen);
        const days = daysBetween(dateNow, dateThen);
        const hours = hoursBetween(dateNow, dateThen);
        const minutes = minutesBetween(dateNow, dateThen);

        if (years >= 1) {
            return pluralText(years, "year", "years") + " ago";
        } else if (months >= 1) {
            return pluralText(months, "month", "months") + " ago";
        } else if (days >= 1) {
            return pluralText(days, "day", "days") + " ago";
        } else if (hours >= 1) {
            return pluralText(hours, "hour", "hours") + " ago";
        } else if (minutes >= 5) {
            return `${minutes} minutes ago`;
        } else {
            return "right now";
        }
    }

    public static parseTokens(
        target: string,
        tokens: InfoTokens,
    ): string {
        const tokenRegex = new RegExp(
            "\\$\\{" +
            "(?<token>[a-z._-]{1,})" +
            ",*" +
            "(?<value>.*?)" +
            "(?<modifier>(|\\|[a-z]+))" +
            "\\}",
            "gi",
        );

        if (typeof target !== "string") {
            return "";
        }

        return target.replace(
            tokenRegex,
            (...args: unknown[]): string => {
                const groups: TokenReplaceGroup
                    = args[args.length - 1] as TokenReplaceGroup;

                const value = TextDecorator.runKey(tokens, groups);

                return TextDecorator.modify(value, groups.modifier);
            },
        );
    }

    public static runKey(
        tokens: InfoTokens,
        group: TokenReplaceGroup,
    ): string {
        const currentToken = tokens[group.token];

        if (currentToken) {
            return currentToken(group.value);
        }

        return group.token;
    }

    public static modify(value: string, modifier: string): string {
        if (modifier === "|u") {
            return value.toUpperCase();
        } else if (modifier === "|l") {
            return value.toLowerCase();
        }

        return `${value}${modifier}`;
    }

    public static normalizeCommitInfoTokens(
        commit: GitCommitInfo,
    ): InfoTokenNormalizedCommitInfo {
        const now = new Date();
        const authorTime = new Date(commit.author.timestamp * 1000);
        const committerTime = new Date(commit.committer.timestamp * 1000);

        const valueFrom = (value: { toString: () => string }): () => string => {
            return (): string => value.toString();
        }
        const ago = valueFrom(TextDecorator.toDateText(now, authorTime));
        const cAgo = valueFrom(TextDecorator.toDateText(now, committerTime));
        const authorDate = valueFrom(authorTime.toISOString().slice(0, 10));
        const cDate = valueFrom(committerTime.toISOString().slice(0, 10));
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
            "author.mail": valueFrom(commit.author.mail),
            "author.name": valueFrom(commit.author.name),
            "author.timestamp": valueFrom(commit.author.timestamp),
            "author.tz": valueFrom(commit.author.tz),
            "author.date": authorDate,
            "commit.hash": valueFrom(commit.hash),
            "commit.hash_short": shortness(commit.hash, '7'),
            "commit.summary": shortness(commit.summary, '65536'),
            "committer.mail": valueFrom(commit.committer.mail),
            "committer.name": valueFrom(commit.committer.name),
            "committer.timestamp": valueFrom(commit.committer.timestamp),
            "committer.tz": valueFrom(commit.committer.tz),
            "committer.date": cDate,
            "time.ago": ago,
            "time.c_ago": cAgo,
            "time.from": ago,
            "time.c_from": cAgo,
        };
    }
}

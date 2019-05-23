import * as moment from "moment";

import { GitBlame } from "../git/blame";
import {
    GitCommitInfo,
    InfoTokenNormalizedCommitInfo,
} from "../interfaces";
import { pluralText } from "./plural-text";
import { Property } from "./property";

export class TextDecorator {
    public static toTextView(commit: GitCommitInfo): string {
        if (GitBlame.isBlankCommit(commit)) {
            return Property.get("statusBarMessageNoCommit")
                || "Not Committed Yet";
        }

        const normalizedCommitInfo = TextDecorator.normalizeCommitInfoTokens(
            commit,
        );
        const messageFormat = Property.get("statusBarMessageFormat");

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
        const momentNow = moment(dateNow);
        const momentThen = moment(dateThen);

        const years = momentNow.diff(momentThen, "years");
        const months = momentNow.diff(momentThen, "months");
        const days = momentNow.diff(momentThen, "days");
        const hours = momentNow.diff(momentThen, "hours");
        const minutes = momentNow.diff(momentThen, "minutes");

        if (years >= 1) {
            return pluralText(years, "year", "years") + " ago";
        } else if (months >= 1) {
            return pluralText(months, "month", "months") + " ago";
        } else if (days >= 1) {
            return pluralText(days, "day", "days") + " ago";
        } else if (hours >= 1) {
            return pluralText(hours, "hour", "hours") + " ago";
        } else if (minutes >= 5) {
            return pluralText(minutes, "minute", "minutes") + " ago";
        } else {
            return "right now";
        }
    }

    public static parseTokens(
        target: string,
        tokens: InfoTokenNormalizedCommitInfo,
    ): string {
        const tokenRegex = /\$\{([a-z\.\-\_]{1,})[,]*(|.{1,}?)(?=\})}/gi;

        if (typeof target !== "string") {
            return "";
        }

        return target.replace(
            tokenRegex,
            <K extends keyof InfoTokenNormalizedCommitInfo>(
                path: string,
                key: K,
                inValue: string,
            ): string => {
                return TextDecorator.runKey(
                    tokens,
                    key,
                    inValue,
                );
            },
        );
    }

    public static runKey<K extends keyof InfoTokenNormalizedCommitInfo>(
        tokens: InfoTokenNormalizedCommitInfo,
        key: K,
        value: string,
    ): string {
        const currentToken = tokens[key];

        if (key === "commit.hash_short") {
            return tokens["commit.hash_short"](value);
        }

        if (key === "time.c_custom") {
            return tokens["time.c_custom"](value);
        }

        if (key === "time.custom") {
            return tokens["time.custom"](value);
        }

        if (currentToken) {
            return currentToken();
        }

        return key;
    }

    public static normalizeCommitInfoTokens(
        commit: GitCommitInfo,
    ): InfoTokenNormalizedCommitInfo {
        const now = new Date();
        const authorTime = moment.unix(commit.author.timestamp);
        const committerTime = moment.unix(commit.committer.timestamp);

        return {
            "author.mail": (): string => commit.author.mail,
            "author.name": (): string => commit.author.name,
            "author.timestamp": (): string => (
                commit.author.timestamp.toString()
            ),
            "author.tz": (): string => commit.author.tz,
            "commit.filename": (): string => commit.filename,
            "commit.hash": (): string => commit.hash,
            "commit.hash_short": (length = "7"): string => {
                const cutoffPoint = length.toString();
                return commit.hash.substr(
                    0,
                    parseInt(cutoffPoint, 10),
                );
            },
            "commit.summary": (): string => commit.summary,
            "committer.mail": (): string => commit.committer.mail,
            "committer.name": (): string => commit.committer.name,
            "committer.timestamp": (): string => (
                commit.committer.timestamp.toString()
            ),
            "committer.tz": (): string => commit.committer.tz,
            "time.ago": (): string => TextDecorator.toDateText(
                now,
                authorTime.toDate(),
            ),
            "time.c_ago": (): string => TextDecorator.toDateText(
                now,
                committerTime.toDate(),
            ),
            "time.c_custom": (format = ""): string => (
                committerTime.format(format)
            ),
            "time.c_from": (): string => committerTime.fromNow(),
            "time.custom": (format = ""): string => authorTime.format(format),
            "time.from": (): string => authorTime.fromNow(),
        };
    }
}

import * as assert from "assert";

import { InfoTokenNormalizedCommitInfo } from "interfaces";
import { TextDecorator } from "../src/util/textdecorator";

suite("Date Calculations", (): void => {
    test("Time ago in years", (): void => {
        assert.equal(
            TextDecorator.toDateText(new Date(2015, 1), new Date(2014, 1)),
            "1 year ago",
        );
    });

    test("Time ago in months", (): void => {
        assert.equal(
            TextDecorator.toDateText(new Date(2015, 4), new Date(2015, 1)),
            "3 months ago",
        );

        assert.equal(
            TextDecorator.toDateText(new Date(2015, 2, 10), new Date(2015, 1)),
            "1 month ago",
        );
    });

    test("Time ago in days", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 5),
                new Date(2015, 1, 1),
            ),
            "4 days ago",
        );
    });

    test("Time ago in hours", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 3, 0, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "2 hours ago",
        );
    });

    test("Time ago in minutes", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 29, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "29 minutes ago",
        );
    });

    test("Right now", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 1, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "right now",
        );
    });

    test("Correct pluralisation", (): void => {
        assert.notEqual(
            TextDecorator.toDateText(
                new Date(2015, 1, 2),
                new Date(2015, 1, 1),
            ),
            "1 days ago",
        );

        assert.notEqual(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 0, 0),
                new Date(2015, 1, 1, 0, 0, 0),
            ),
            "1 hours ago",
        );

        assert.notEqual(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 1, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "1 minutes ago",
        );
    });
});

suite("Token Parser", (): void => {
    const normalizedInfo: InfoTokenNormalizedCommitInfo = {
        "author.mail": (): string => "value-author.mail",
        "author.name": (): string => "value-author.name",
        "author.timestamp": (): string => "value-author.timestamp",
        "author.tz": (): string => "value-author.tz",
        "commit.filename": (): string => "value-commit.filename",
        "commit.hash": (): string => "value-commit.hash",
        "commit.hash_short": (): string => "value-commit.hash_short",
        "commit.summary": (): string => "value-commit.summary",
        "committer.mail": (): string => "value-committer.mail",
        "committer.name": (): string => "value-committer.name",
        "committer.timestamp": (): string => "value-committer.timestamp",
        "committer.tz": (): string => "value-committer.tz",
        "time.ago": (): string => "value-time.ago",
        "time.c_ago": (): string => "value-time.c_ago",
        "time.c_custom": (): string => "value-time.c_custom",
        "time.c_from": (): string => "value-time.c_from",
        "time.custom": (): string => "value-time.custom",
        "time.from": (): string => "value-time.from",
    };

    test("Invalid token", (): void => {
        assert.equal(
            TextDecorator.parseTokens("Invalid ${token}", normalizedInfo),
            "Invalid token",
        );
    });

    test("Simple replace", (): void => {
        assert.equal(
            TextDecorator.parseTokens("Simple ${author.mail}", normalizedInfo),
            "Simple value-author.mail",
        );
    });
});

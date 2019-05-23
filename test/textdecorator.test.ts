import * as assert from "assert";

import { InfoTokenNormalizedCommitInfo } from "interfaces";
import { TextDecorator } from "../src/util/textdecorator";

suite("Date Calculations", () => {
    test("Time ago in years", () => {
        assert.equal(
            TextDecorator.toDateText(new Date(2015, 1), new Date(2014, 1)),
            "1 year ago",
        );
    });

    test("Time ago in months", () => {
        assert.equal(
            TextDecorator.toDateText(new Date(2015, 4), new Date(2015, 1)),
            "3 months ago",
        );

        assert.equal(
            TextDecorator.toDateText(new Date(2015, 2, 20), new Date(2015, 1)),
            "1 month ago",
        );
    });

    test("Time ago in days", () => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 5),
                new Date(2015, 1, 1),
            ),
            "4 days ago",
        );
    });

    test("Time ago in hours", () => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 3, 0, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "2 hours ago",
        );
    });

    test("Time ago in minutes", () => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 30, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "30 minutes ago",
        );
    });

    test("Right now", () => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 1, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "right now",
        );
    });

    test("Correct pluralisation", () => {
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

suite("Token Parser", () => {
    const normalizedInfo: InfoTokenNormalizedCommitInfo = {
        "author.mail": () => "value-author.mail",
        "author.name": () => "value-author.name",
        "author.timestamp": () => "value-author.timestamp",
        "author.tz": () => "value-author.tz",
        "commit.filename": () => "value-commit.filename",
        "commit.hash": () => "value-commit.hash",
        "commit.hash_short": (length?: string) => "value-commit.hash_short",
        "commit.summary": () => "value-commit.summary",
        "committer.mail": () => "value-committer.mail",
        "committer.name": () => "value-committer.name",
        "committer.timestamp": () => "value-committer.timestamp",
        "committer.tz": () => "value-committer.tz",
        "time.ago": () => "value-time.ago",
        "time.c_ago": () => "value-time.c_ago",
        "time.c_custom": (format?: string) => "value-time.c_custom",
        "time.c_from": () => "value-time.c_from",
        "time.custom": (format?: string) => "value-time.custom",
        "time.from": () => "value-time.from",
    };

    test("Invalid token", () => {
        assert.equal(
            TextDecorator.parseTokens("Invalid ${token}", normalizedInfo),
            "Invalid token",
        );
    });

    test("Simple replace", () => {
        assert.equal(
            TextDecorator.parseTokens("Simple ${author.mail}", normalizedInfo),
            "Simple value-author.mail",
        );
    });
});

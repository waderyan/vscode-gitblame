import * as assert from "assert";

import {
    InfoTokens,
    TextDecorator,
} from "../../src/util/textdecorator";

suite("Date Calculations", (): void => {
    test("Time ago in years", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1),
                new Date(2014, 1),
            ),
            "1 year ago",
        );
    });

    test("Time ago in months", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 4),
                new Date(2015, 1),
            ),
            "3 months ago",
        );

        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 2, 10),
                new Date(2015, 1),
            ),
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
    const normalizedInfo: InfoTokens = {
        "example.token": (): string => "example-token",
        "value": (value?: string): string => {
            return `${ value }-example`;
        },
        "mixed.token": (): string => "mIxeD-ToKeN",
    };

    test("Invalid token", (): void => {
        assert.equal(
            TextDecorator.parseTokens("Invalid ${token}", normalizedInfo),
            "Invalid token",
        );
    });

    test("Simple replace", (): void => {
        assert.equal(
            TextDecorator.parseTokens(
                "Simple ${example.token}",
                normalizedInfo,
            ),
            "Simple example-token",
        );
    });

    test("Value replace", (): void => {
        assert.equal(
            TextDecorator.parseTokens(
                "Value ${value,some-value}",
                normalizedInfo,
            ),
            "Value some-value-example",
        );
    });

    test("Modifier replace", (): void => {
        assert.equal(
            TextDecorator.parseTokens(
                "Value ${mixed.token|u}",
                normalizedInfo,
            ),
            "Value MIXED-TOKEN",
        );
        assert.equal(
            TextDecorator.parseTokens(
                "Value ${mixed.token|l}",
                normalizedInfo,
            ),
            "Value mixed-token",
        );
    });

    test("Modifier replace with value", (): void => {
        test("Modifier replace", (): void => {
            assert.equal(
                TextDecorator.parseTokens(
                    "Value ${value,mIxEd-ToKeN|u}",
                    normalizedInfo,
                ),
                "Value MIXED-TOKEN-EXAMPLE",
            );
            assert.equal(
                TextDecorator.parseTokens(
                    "Value ${value,mIxEd-ToKeN|l}",
                    normalizedInfo,
                ),
                "Value mixed-token-example",
            );
        });
    });

    test("Invalid modifier", (): void => {
        assert.equal(
            TextDecorator.parseTokens(
                "Value ${example.token|invalidModifier}",
                normalizedInfo,
            ),
            "Value example-token|invalidModifier",
        );
        assert.equal(
            TextDecorator.parseTokens(
                "Value ${example.token|invalidModifier}",
                normalizedInfo,
            ),
            "Value example-token|invalidModifier",
        );
        assert.equal(
            TextDecorator.parseTokens(
                "Value ${example.token|q}",
                normalizedInfo,
            ),
            "Value example-token|q",
        );
    });

    test("Modifier without token", (): void => {
        assert.equal(
            TextDecorator.parseTokens(
                "Value ${|mod}",
                normalizedInfo,
            ),
            "Value ${|mod}",
        );
    });
});

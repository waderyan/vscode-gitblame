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
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1),
                new Date(2005, 1),
            ),
            "10 years ago",
        );
    });

    test("Time ago in months", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1),
                new Date(2015, 0),
            ),
            "1 month ago",
        );
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 11, 10),
                new Date(2015, 0),
            ),
            "11 months ago",
        );
    });

    test("Time ago in days", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 2),
                new Date(2015, 1, 1),
            ),
            "1 day ago",
        );
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 31),
                new Date(2015, 1, 1),
            ),
            "30 days ago",
        );
    });

    test("Time ago in hours", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 0, 0),
                new Date(2015, 1, 1, 0, 0, 0),
            ),
            "1 hour ago",
        );
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 23, 29, 0),
                new Date(2015, 1, 1, 0, 0, 0),
            ),
            "23 hours ago",
        );
    });

    test("Time ago in minutes", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 5, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "5 minutes ago",
        );
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 59, 29),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "59 minutes ago",
        );
    });

    test("Right now", (): void => {
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 0, 1),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "right now",
        );
        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 1, 4, 29),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "right now",
        );
    });
});

suite("Token Parser", (): void => {
    const normalizedInfo: InfoTokens = {
        "example.token": (): string => "example-token",
        "value": (value?: string): string => {
            if (value) {
                return `${ value }-example`;
            } else {
                return `-example`;
            }
        },
        "mixed.token": (): string => "mIxeD-ToKeN",
    };

    test("No token", (): void => {
        assert.equal(
            TextDecorator.parseTokens("No token", normalizedInfo),
            "No token",
        );
    });

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

    test("Token in the middle of string", (): void => {
        assert.equal(
            TextDecorator.parseTokens(
                "Simple ${example.token} in a longer text",
                normalizedInfo,
            ),
            "Simple example-token in a longer text",
        );
    });

    test("Multiple tokens", (): void => {
        assert.equal(
            TextDecorator.parseTokens(
                "Multiple ${example.token} in a ${length,longer} text",
                normalizedInfo,
            ),
            "Multiple example-token in a length text",
        );
    });
});

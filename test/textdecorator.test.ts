import assert = require("assert");

import { TextDecorator } from "../src/util/textdecorator";

// Defines a Mocha test suite to group tests of similar kind together
suite("Date Calculations", () => {
    test("Time ago", () => {
        assert.equal(
            TextDecorator.toDateText(new Date(2015, 4), new Date(2015, 1)),
            "3 months ago",
        );

        assert.equal(
            TextDecorator.toDateText(new Date(2015, 2, 20), new Date(2015, 1)),
            "1 month ago",
        );

        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 5),
                new Date(2015, 1, 1),
            ),
            "4 days ago",
        );

        assert.equal(
            TextDecorator.toDateText(
                new Date(2015, 1, 1, 3, 0, 0),
                new Date(2015, 1, 1, 1, 0, 0),
            ),
            "2 hours ago",
        );

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
    test("No tokens", () => {
        assert.equal(TextDecorator.parseTokens("No ${tokens}", {}), "No tokens");
    });

    test("Simple example", () => {
        assert.equal(
            TextDecorator.parseTokens("Simple ${replace-word}", {
                "replace-word": "replace",
            }),
            "Simple replace",
        );
    });

    test("Function as token value", () => {
        assert.equal(
            TextDecorator.parseTokens("Function ${replace-word}", {
                "replace-word": () => "replaced",
            }),
            "Function replaced",
        );
    });

    test("Function as token value with parameter", () => {
        assert.equal(
            TextDecorator.parseTokens("Function value ${replace,test}", {
                replace: (value) => value + "ed",
            }),
            "Function value tested",
        );
    });

    test("Mixed token types", () => {
        assert.equal(
            TextDecorator.parseTokens("Multiple ${type} ${what,replacer}", {
                type: "mixed",
                what: (value) => value + "s",
            }),
            "Multiple mixed replacers",
        );
    });

    test("Repeated token usage", () => {
        assert.equal(
            TextDecorator.parseTokens("${token} ${token} ${token}", {
                token: "value",
            }),
            "value value value",
        );
    });

    test("Invalid token value", () => {
        assert.equal(
            TextDecorator.parseTokens("${non-valid-value}", {
                "non-valid-value": [],
            }),
            "non-valid-value",
        );
    });

    test("Walk down in token object", () => {
        assert.equal(
            TextDecorator.parseTokens("${climb.far}", {
                climb: {
                    far: "down",
                },
            }),
            "down",
        );
    });

    test("Unicode string", () => {
        assert.equal(
            TextDecorator.parseTokens("${ok,💯}", {
                ok: (value) => "👌" + value + "👌",
            }),
            "👌💯👌",
        );
    });

    test("Unicode tokens unsupported", () => {
        assert.notEqual(
            TextDecorator.parseTokens("${👌}", {
                "👌": "ok-hand",
            }),
            "ok-hand",
        );
    });

    test("No tokens", () => {
        assert.equal(TextDecorator.parseTokens(null, null), "");
    });
});

suite("Normalize Commit Info Tokens", () => {
    const dummyGitCommitAuthor = {
        mail: "dummy@mail.ad",
        name: "Dummy Name",
        timestamp: 0,
        tz: "+0000",
    };
    const dummyGitCommitInfo = {
        author: { ...dummyGitCommitAuthor },
        committer: { ...dummyGitCommitAuthor },
        filename: "file.dummy",
        hash: "2cde51fbd0f310c8a2c5f977e665c0ac3945b46d",
        summary: "Dummy commit",
    };
});

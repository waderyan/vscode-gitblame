import * as assert from "assert";
import { split } from "../../src/util/split";

suite("Split", (): void => {
    test("Single Space", (): void => {
        assert.deepStrictEqual(
            split("single space"),
            ["single", "space"],
        );
    });
    test("Multiple Spaces", (): void => {
        assert.deepStrictEqual(
            split("multiple spaces in this test right here"),
            ["multiple", "spaces in this test right here"],
        );
    });
    test("No Spaces", (): void => {
        assert.deepStrictEqual(
            split("oneword"),
            ["oneword", ""],
        );
    });
    test("Trim results", (): void => {
        assert.deepStrictEqual(
            split("trim    result   "),
            ["trim", "result"],
        );
    });
    test("Single Amperstand", (): void => {
        assert.deepStrictEqual(
            split("single&amperstand", "&"),
            ["single", "amperstand"],
        );
    });
    test("Short second parameter", (): void => {
        assert.throws(
            (): void => {
                split("bad second argument", "");
            },
            new Error(`Invalid split character argument ""`),
        );
    });
    test("Long second parameter", (): void => {
        assert.throws(
            (): void => {
                split("bad second argument", "long");
            },
            new Error(`Invalid split character argument "long"`),
        );
    });
});

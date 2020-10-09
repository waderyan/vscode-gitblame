import * as assert from "assert";

import {
    daysBetween,
    hoursBetween,
    minutesBetween,
    monthsBetween,
    yearsBetween,
} from "../../src/util/ago";

suite("Ago", (): void => {
    test("Minutes", (): void => {
        assert.strictEqual(
            minutesBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:00:20"),
            ),
            -0,
        );
        assert.strictEqual(
            minutesBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:20:00"),
            ),
            -20,
        );
    });

    test("Hours", (): void => {
        assert.strictEqual(
            hoursBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:00:20"),
            ),
            -0,
        );
        assert.strictEqual(
            hoursBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:30:00"),
            ),
            -0,
        );
        assert.strictEqual(
            hoursBetween(
                new Date("1970-06-06 10:30:00"),
                new Date("1970-06-06 10:00:00"),
            ),
            1,
        );
        assert.strictEqual(
            hoursBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 20:00:00"),
            ),
            -10,
        );
    });

    test("Days", (): void => {
        assert.strictEqual(
            daysBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-02 10:00:00"),
            ),
            4,
        );
        assert.strictEqual(
            daysBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-12 10:00:00"),
            ),
            -6,
        );
    });

    test("Months", (): void => {
        assert.strictEqual(
            monthsBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-08-06 10:00:00"),
            ),
            -2,
        );
    });

    test("Years", (): void => {
        assert.strictEqual(
            yearsBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1980-06-06 10:00:20"),
            ),
            -10,
        );
    });
});

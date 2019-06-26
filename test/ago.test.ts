import * as assert from "assert";

import {
    daysBetween,
    hoursBetween,
    minutesBetween,
    monthsBetween,
    secondsBetween,
    yearsBetween,
} from "../src/util/ago";

suite("Ago", (): void => {
    test("Seconds", (): void => {
        assert.equal(
            secondsBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:00:20"),
            ),
            -20,
        );
    });

    test("Minutes", (): void => {
        assert.equal(
            minutesBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:00:20"),
            ),
            0,
        );
        assert.equal(
            minutesBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:20:00"),
            ),
            -20,
        );
    });

    test("Hours", (): void => {
        assert.equal(
            hoursBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:00:20"),
            ),
            0,
        );
        assert.equal(
            hoursBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 10:30:00"),
            ),
            -0,
        );
        assert.equal(
            hoursBetween(
                new Date("1970-06-06 10:30:00"),
                new Date("1970-06-06 10:00:00"),
            ),
            1,
        );
        assert.equal(
            hoursBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-06 20:00:00"),
            ),
            -10,
        );
    });

    test("Days", (): void => {
        assert.equal(
            daysBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-02 10:00:00"),
            ),
            4,
        );
        assert.equal(
            daysBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-06-12 10:00:00"),
            ),
            -6,
        );
    });

    test("Months", (): void => {
        assert.equal(
            monthsBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1970-08-06 10:00:00"),
            ),
            -2,
        );
    });

    test("Years", (): void => {
        assert.equal(
            yearsBetween(
                new Date("1970-06-06 10:00:00"),
                new Date("1980-06-06 10:00:20"),
            ),
            -10,
        );
    });
});

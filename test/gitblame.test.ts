import * as assert from "assert";

import { GitBlame } from "../src/git/blame";

suite("Web URL formatting", () => {
    const blame = new GitBlame();

    test("https://", () => {
        assert.equal(
            blame.defaultWebPath(
                "https://example.com/user/repo.git",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "https://example.com/user/repo",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("git@", () => {
        assert.equal(
            blame.defaultWebPath(
                "git@example.com:user/repo.git",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath("git@example.com:user/repo", "hash", false),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("username@", () => {
        assert.equal(
            blame.defaultWebPath(
                "username@example.com:user/repo.git",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "username@example.com:user/repo",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("https:// with port", () => {
        assert.equal(
            blame.defaultWebPath(
                "https://example.com:8080/user/repo.git",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "https://example.com:8080/user/repo",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("git@ with port", () => {
        assert.equal(
            blame.defaultWebPath(
                "git@example.com:8080/user/repo.git",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "git@example.com:8080/user/repo",
                "hash",
                false,
            ),
            "https://example.com/user/repo/commit/hash",
        );
    });

    test("https:// plural", () => {
        assert.equal(
            blame.defaultWebPath(
                "https://example.com/user/repo.git",
                "hash",
                true,
            ),
            "https://example.com/user/repo/commits/hash",
        );
        assert.equal(
            blame.defaultWebPath("https://example.com/user/repo", "hash", true),
            "https://example.com/user/repo/commits/hash",
        );
    });

    test("ssh:// short host no user", () => {
        assert.equal(
            blame.defaultWebPath(
                "ssh://user@host:8080/SomeProject.git",
                "hash",
                false,
            ),
            "https://host/SomeProject/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "ssh://user@host:8080/SomeProject",
                "hash",
                false,
            ),
            "https://host/SomeProject/commit/hash",
        );
    });

});

suite("Origin to project name", () => {
    const blame = new GitBlame();

    test("https://", () => {
        assert.equal(
            blame.projectNameFromOrigin("https://example.com/user/repo.git"),
            "repo",
        );
        assert.equal(
            blame.projectNameFromOrigin("https://example.com/user/repo"),
            "repo",
        );
    });

    test("git@", () => {
        assert.equal(
            blame.projectNameFromOrigin("git@example.com/user/repo.git"),
            "repo",
        );
        assert.equal(
            blame.projectNameFromOrigin("git@example.com/user/repo"),
            "repo",
        );
    });

    test("longer than normal path", () => {
        assert.equal(
            blame.projectNameFromOrigin(
                "git@example.com/company/group/user/repo.git",
            ),
            "repo",
        );
        assert.equal(
            blame.projectNameFromOrigin(
                "git@example.com/company/group/user/repo",
            ),
            "repo",
        );
    });
});

import * as assert from "assert";

import { GitBlame } from "../src/git/blame";

suite("Web URL formatting", (): void => {
    const blame = new GitBlame();

    test("https://", (): void => {
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

    test("git@", (): void => {
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

    test("username@", (): void => {
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

    test("https:// with port", (): void => {
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

    test("git@ with port", (): void => {
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

    test("https:// plural", (): void => {
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

    test("ssh:// short host no user", (): void => {
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

    test("non-alphanumeric in path", (): void => {
        assert.equal(
            blame.defaultWebPath(
                "https://example.com/us.er/repo.git",
                "hash",
                false,
            ),
            "https://example.com/us.er/repo/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "https://example.com/user/re-po.git",
                "hash",
                false,
            ),
            "https://example.com/user/re-po/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "https://example.com/user/re%20po.git",
                "hash",
                false,
            ),
            "https://example.com/user/re%20po/commit/hash",
        );
        assert.equal(
            blame.defaultWebPath(
                "ssh://user@example.com:us.er/repo.git",
                "hash",
                false,
            ),
            "https://example.com/us.er/repo/commit/hash",
        );
    });

});

suite("Origin to project name", (): void => {
    const blame = new GitBlame();

    test("https://", (): void => {
        assert.equal(
            blame.projectNameFromOrigin("https://example.com/user/repo.git"),
            "repo",
        );
        assert.equal(
            blame.projectNameFromOrigin("https://example.com/user/repo"),
            "repo",
        );
    });

    test("git@", (): void => {
        assert.equal(
            blame.projectNameFromOrigin("git@example.com/user/repo.git"),
            "repo",
        );
        assert.equal(
            blame.projectNameFromOrigin("git@example.com/user/repo"),
            "repo",
        );
    });

    test("longer than normal path", (): void => {
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

    test("non-alphanumeric in path", (): void => {
        assert.equal(
            blame.projectNameFromOrigin(
                "https://example.com/user/re-po.git",
            ),
            "re-po",
        );
        assert.equal(
            blame.projectNameFromOrigin(
                "https://example.com/us.er/repo.git",
            ),
            "repo",
        );
        assert.equal(
            blame.projectNameFromOrigin(
                "https://example.com/user/re.po.git",
            ),
            "re.po",
        );
        assert.equal(
            blame.projectNameFromOrigin(
                "https://example.com/user/re.po",
            ),
            "re.po",
        );
    });
});

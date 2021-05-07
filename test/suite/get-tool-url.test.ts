import * as assert from "assert";

import { gitRemotePath } from "../../src/git/util/get-tool-url";

suite('Get tool URL: gitRemotePath', (): void => {
    test('http://', (): void => {
        const func = gitRemotePath('http://example.com/path/to/something/');

        assert.strictEqual(func(), 'invalid-index');
        assert.strictEqual(func('0'), 'path');
        assert.strictEqual(func('1'), 'to');
        assert.strictEqual(func('2'), 'something');
    });
    test('https://', (): void => {
        const func = gitRemotePath('https://example.com/path/to/something/');

        assert.strictEqual(func(), 'invalid-index');
        assert.strictEqual(func('0'), 'path');
        assert.strictEqual(func('1'), 'to');
        assert.strictEqual(func('2'), 'something');
    });
    test('ssh://', (): void => {
        const func = gitRemotePath('ssh://example.com/path/to/something/');

        assert.strictEqual(func(), 'invalid-index');
        assert.strictEqual(func('0'), 'path');
        assert.strictEqual(func('1'), 'to');
        assert.strictEqual(func('2'), 'something');
    });
    test('git@', (): void => {
        const func = gitRemotePath('git@example.com:path/to/something/');

        assert.strictEqual(func(), 'invalid-index');
        assert.strictEqual(func('0'), 'path');
        assert.strictEqual(func('1'), 'to');
        assert.strictEqual(func('2'), 'something');
    });
    test('http:// with port', (): void => {
        const func = gitRemotePath('http://example.com:8080/path/to/something/');

        assert.strictEqual(func(), 'invalid-index');
        assert.strictEqual(func('0'), 'path');
        assert.strictEqual(func('1'), 'to');
        assert.strictEqual(func('2'), 'something');
    });
    test('https:// with port', (): void => {
        const func = gitRemotePath('https://example.com:8080/path/to/something/');

        assert.strictEqual(func(), 'invalid-index');
        assert.strictEqual(func('0'), 'path');
        assert.strictEqual(func('1'), 'to');
        assert.strictEqual(func('2'), 'something');
    });
    test('ssh:// with port', (): void => {
        const func = gitRemotePath('ssh://example.com:8080/path/to/something/');

        assert.strictEqual(func(), 'invalid-index');
        assert.strictEqual(func('0'), 'path');
        assert.strictEqual(func('1'), 'to');
        assert.strictEqual(func('2'), 'something');
    });

    test('Empty input', (): void => {
        const func = gitRemotePath('');

        assert.strictEqual(func(), 'no-remote-url');
        assert.strictEqual(func('0'), 'no-remote-url');
    });
    test('Weird input', (): void => {
        const func = gitRemotePath('weird input');

        assert.strictEqual(func(), 'no-remote-url');
        assert.strictEqual(func('0'), 'no-remote-url');
    });
});

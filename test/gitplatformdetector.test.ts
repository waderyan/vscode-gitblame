import assert = require('assert');
// Nock is a library for mocking network requests
import nock = require('nock');

import { GitPlatformDetector } from '../src/util/gitplatformdetector';

suite('Git Platform Detector', () => {
    test('Cleaning URL', () => {
        assert.equal(
            GitPlatformDetector.cleanUrl('http://gitexample.com/repository/'),
            'http://gitexample.com/repository/'
        );

        assert.equal(
            GitPlatformDetector.cleanUrl('https://gitexample.com/repository.git'),
            'https://gitexample.com/repository/'
        );

        assert.equal(
            GitPlatformDetector.cleanUrl('git@gitexample.com:repository.git'),
            'http://gitexample.com/repository/'
        );

        assert.equal(
            GitPlatformDetector.cleanUrl('git@gitexample.com:433:repository.git'),
            'http://gitexample.com:433/repository/'
        );

        assert.equal(
            GitPlatformDetector.cleanUrl('http://gitexample.com:repository.git'),
            'http://gitexample.com/repository/'
        );
    });

    test('Requests to http', async () => {
        nock('http://gitexample.com')
            .get('/')
            .reply(200, 'OK');

        const message = await GitPlatformDetector.request('http://gitexample.com/');
        let responseContent = '';

        message.on('data', (chunk) => {
            responseContent += chunk;
        });

        message.on('end', () => {
            assert.equal('OK', responseContent);
        });
    });

    test('Requests to https', async () => {
        nock('https://gitexample.com')
            .get('/')
            .reply(200, 'OK');

        const message = await GitPlatformDetector.request('https://gitexample.com/');
        let responseContent = '';

        message.on('data', (chunk) => {
            responseContent += chunk;
        });

        message.on('end', () => {
            assert.equal('OK', responseContent);
        });
    });

    test('Identified status code', async () => {
        const statusCode = 200;

        nock('http://gitexample.com')
            .get('/')
            .reply(statusCode, `${statusCode} response`);

        const responseCode = await GitPlatformDetector.requestStatusCode('http://gitexample.com/');

        assert.strictEqual(responseCode, statusCode);
    });

    test('Identified 200 status as good', async () => {
        nock('http://gitexample.com')
            .get('/')
            .reply(200, 'OK');

        const testStatus = await GitPlatformDetector.testUrl('http://gitexample.com/');

        assert.strictEqual(testStatus, true);
    });

    test('Identified 400 status as bad', async () => {
        nock('http://gitexample.com')
            .get('/')
            .reply(400, 'OK');

        const testStatus = await GitPlatformDetector.testUrl('http://gitexample.com/');

        assert.strictEqual(testStatus, false);
    });
});
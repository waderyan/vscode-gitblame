import assert = require('assert');

import { walkObject } from '../src/util/objectpath';

suite('Object Walker', () => {
    test('Object Walker', () => {
        assert.equal(
            walkObject({
                'oneStep': 10
            }, 'oneStep'),
            10
        );

        assert.equal(
            walkObject({
                10: 'a string'
            }, '10'),
            'a string'
        );

        assert.equal(
            walkObject({
                many: {
                    many: {
                        steps: 'far down'
                    }
                }
            }, 'many.many.steps'),
            'far down'
        );

        assert.equal(
            walkObject({
                theKey: 20
            }, 'no_key', 'not there'),
            'not there'
        );

        assert.equal(
            walkObject({
                2: {
                    3: {
                        4: 'numbers'
                    }
                }
            }, '2.3.4'),
            'numbers'
        );

        assert.equal(
            walkObject([
                [
                    [
                        'array'
                    ]
                ]
            ], '0.0.0'),
            'array'
        );

        assert.deepEqual(
            walkObject({
                'try to': {
                    'return': 'an object'
                }
            }, 'try to'),
            {
                'return': 'an object'
            }
        );
    });
});
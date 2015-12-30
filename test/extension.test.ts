// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import {GitBlame} from '../src/gitblame';
import {GitBlameController, TextDecorator} from '../src/controller';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {

	// Defines a Mocha unit test
	test("Something 1", () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));
	});
});

suite('GitBlame Tests', () => {
    
    test('Date Calculations', () => {
        
        const decorator = new TextDecorator();
        
        var d1 = new Date(2015, 4);
        var d2 = new Date(2015, 1);
        
        assert.equal('3 months ago', decorator.toDateText(d1, d2));
        
    });
});
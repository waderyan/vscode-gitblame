# Change Log

## 3.1.0 (August 27, 2019)
* Bug: Extension host crashing when renaming file [#59](https://github.com/Sertion/vscode-gitblame/issues/59) (Thanks to [pierznj](https://github.com/pierznj))
* Feature: Two new tokens for `gitblame.commitUrl` [#61](https://github.com/Sertion/vscode-gitblame/issues/61) (Thanks to [ajoga](https://github.com/ajoga) and [nitzel](https://github.com/nitzel))
* Fix: Adding [acknowledgements for the logo](https://twitter.com/jasonlong) [#63](https://github.com/Sertion/vscode-gitblame/issues/63) (Thanks to [Eonfge](https://github.com/Eonfge))
* Fix: Updating readme
* Fix: Updating dependencies

## 3.0.1 (August 2, 2019)
* Bug: Removing depricated token from default value for `gitblame.infoMessageFormat` [#57](https://github.com/Sertion/vscode-gitblame/issues/57) (Thanks to [Kyngo](https://github.com/Kyngo))

## 3.0.0 (July 27, 2019)
* Bug: Fixing rare bug where swapping between different file views didn't update the view
* Deprication: Removing the `.custom` tokens from status bar message
* Deprication: The `.from` token now is identical to `.ago`
* Deprication: Removing the `commit.filename` tokens from status bar message
* Deprication: Removing custom spinner support (`gitblame.progressSpinner`)
* Deprication: Removing log levels (`gitblame.logLevel`). It is replaced by `gitblame.logNonCritical` (defaults to `true`)
* Feature: Blame cache is now tied to the open document. Closing the document will clear if from the cache
* Feature: Move to the new `@types/vscode` and `vscode-test` packages
* Feature: Move to new build system
* Fix: Removeing or updating dependencies

The removal of the custom-token allows us to remove our dependency on moment. This lowers the extension bundle size from 850 kb to about 100 kb.

## 2.8.1 (June 21, 2019)
* Bug: Blaming a removed file crashes the extension [#54](https://github.com/Sertion/vscode-gitblame/pull/54) (Thanks to [dmitriismitnov](https://github.com/dmitriismitnov))
* Fix: Updating dependencies

## 2.8.0 (June 9, 2019)
* Feature: Auto detect Atlassian's BitBucket [#52](https://github.com/Sertion/vscode-gitblame/pull/52)
* Feature: Now display _X years ago_ instead of massive amounts of months [#53](https://github.com/Sertion/vscode-gitblame/pull/53) (Thanks to [radar](https://github.com/radar))
* Fix: Updating dependencies
* Fix: New linting rules

### BitBucket Detection

There is a new setting called `gitblame.pluralWebPathSubstrings`. It is an array of strings that, if present in the git origin url, will add an extra _S_ to the online tool url.

## 2.7.0 (March 27, 2019)

* Feature: Copy tool URL or hash to your clipboard with `gitblame.addToolUrlToClipboard` and `gitblame.addCommitHashToClipboard`! (Thanks to [tombusby](https://github.com/tombusby) for the suggestion)
* Fix: Updating dependencies

## 2.6.3 (November 30, 2018)

* Feature: Add support for using remote URL in blame link expansion [#50](https://github.com/Sertion/vscode-gitblame/pull/50) (Thanks to [allight](https://github.com/allight))

## 2.6.2 (November 27, 2018)

* Fix: Updating dependencies

## 2.6.1 (November 15, 2018)

* Bug: Dot in username generates wrong repository URL [#48](https://github.com/Sertion/vscode-gitblame/pull/48) (Thanks to [bolduz](https://github.com/bolduz))

## 2.6.0 (November 5, 2018)

* Feature: We can now parse a wider variety of git origin formats [#46](https://github.com/Sertion/vscode-gitblame/pull/46)
* Feature: You can now use your project name in `vscode.commitUrl` [#46](https://github.com/Sertion/vscode-gitblame/pull/46)
* Fix: Updating dependencies

## 2.5.1 (October 28, 2018)

* Bug: Remote URLs without `.git` are now handled correctly [#44](https://github.com/Sertion/vscode-gitblame/pull/44) (Thanks to [dewe](https://github.com/dewe))

## 2.5.0 (October 21, 2018)

* Bug: Sometimes gitblame blamed the same file multiple time in parallel. This is no longer the case.
* Feature: We now use `vscode.git` to find your git binary.
* Fix: Change the default info message format to be prefixed by the date instead of the commit hash. It is in ISO 8601 with dashes for separator.
* Fix: Updating Readme to better guide Bitbucket users to the `isWebPathPlural` setting.
* Fix: Removed `internalHashLength` setting. We now alsways use the whole hash.
* Fix: Moved back to using [`fs.watch`](https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener) from [`workspace.FileSystemWatcher`](https://code.visualstudio.com/docs/extensionAPI/vscode-api#workspace.createFileSystemWatcher) after getting reposts that file watching is having issues.
* Fix: Better handling of ENOENT in git command runner. [#41](https://github.com/Sertion/vscode-gitblame/pull/41) (Thanks to [Yottster](https://github.com/Yottster))
* Fix: Moved to strict TypeScript.
* Fix: Updating dependencies

## 2.4.4 (August 1, 2018)

* Fix: Updating dependencies

## 2.4.3 (August 1, 2018)

* Bug: Showing unedited gitblame info template when running *Show quick Info* on unblameable line (Thanks to [BerndErnst](https://github.com/BerndErnst))
* Bug: Using a map instead of an object for storing git blame file cache. Now we can blame files named `__proto__` etc.

## 2.4.2 (April 5, 2018)

* Bug: Blame uses committer not author [#29](https://github.com/Sertion/vscode-gitblame/issues/29), [#32](https://github.com/Sertion/vscode-gitblame/issues/32), and [#33](https://github.com/Sertion/vscode-gitblame/issues/33) (Thanks to [HCoban](https://github.com/HCoban), [richardscarrott](https://github.com/richardscarrott), and [KenCoder](https://github.com/KenCoder))

## 2.4.1 (March 30, 2018)

* Bug: defaultWebPath handles plural not correctly [#30](https://github.com/Sertion/vscode-gitblame/issues/30) (Thanks to [HCoban](https://github.com/HCoban))

## 2.4.0 (March 26, 2018)

* Feature: Added `gitblame.isWebPathPlural`. Setting for GitBucket users to help the new auto detect feature. [PR#28](https://github.com/Sertion/vscode-gitblame/pull/28) (Thanks to [dimitarnestorov](https://github.com/dimitarnestorov)) 

## 2.3.1 (March 24, 2018)

* Fix: Updating Readme

## 2.3.0 (March 24, 2018)

* Feature: Atempting to auto detect if you use a known git web interface [#15](https://github.com/Sertion/vscode-gitblame/issues/15) (Thanks to [@Fidge123](https://github.com/Fidge123), [@sabrehagen](https://github.com/sabrehagen), [@henvic](https://github.com/henvic), and an extra thanks to [@neerolyte](https://github.com/neerolyte))
* Feature: Added `gitblame.statusBarPositionPriority` for moving the status bar view [#25](https://github.com/Sertion/vscode-gitblame/issues/25) (Thanks to [@jvoigt](https://github.com/jvoigt))
* Fix: Merging `GitBlame` and `GitBlameController` to `GitBlame`
* Fix: Renaming `GitBlameFile*` to `GitFile*`
* Fix: Rewrote all the tests
* Fix: Updating dependencies
* Fix: Updating preview video/image
* Enhancement: Prettifying with [Prettier](https://prettier.io/)
* Enhancement: Tslintifying with [TSLint](https://palantir.github.io/tslint/)

## 2.2.0 (September 07, 2017)

* Feature: Multiple workspace support [#23](https://github.com/Sertion/vscode-gitblame/issues/23) (Thanks to [@IgorNovozhilov](https://github.com/IgorNovozhilov))
* Fix: Updating dependencies

## 2.1.0 (August 12, 2017)

* Bug: Keep current line blame info when opening `gitblame.quickInfo`
* Bug: No longer tells you that your custom git path is incorrect
* Bug: Supports git paths with spaces in them
* Feature: Allow for shorter internal git hash storage (`gitblame.internalHashLength`)

## 2.0.2 (July 24, 2017)

* Bug: Spinner will spin forever when there is no repo to be found

## 2.0.1 (July 20, 2017)

* Fix: Moving `git.path` message from `critical` to `error`

## 2.0.0 (July 20, 2017)

This will be updating the major version as we are changing what the exposed command is called.

* Fix: Change name of the command to `gitblame.quickInfo` (was `extension.blame`)
* Fix: Updating the _Known issues_ link to the new issue tracker as all old issues are resolved
* Fix: Moved to TypeScript 2.4.1
* Fix: Cleaning imports
* Fix: Remove Q&A-section from vscode marketplace
* Fix: No more `null`
* Fix: Renamed all interfaces (removed the `I`-prefix)
* Bug: Only try to blame files in our `workspace.rootPath`
* Bug: Adding missing _the_ in tooltip
* Bug: Adding better `dispose` handling
* Feature: Adding command (`gitblame.blameLink`) for online blame
* Feature: Adding a fancy _loading spinner_ when waiting for blaming information
* Feature: Clear the cache of closed files from time to time
* Feature: Replacing [git-blame](https://github.com/alessioalex/git-blame) with our own `--incremental` based solution
* Feature: Killing the `git blame` process when requesting a re-blame
* Feature: Logging when we run commands and what command it was
* Feature: More informative logging
* Feature: Time stamps in the log
* Feature: Adding setting to limit what log levels gets logged

## 1.11.3 (June 15, 2017)

* Bug: Blaming the wrong line [#20](https://github.com/Sertion/vscode-gitblame/issues/20) (Thanks to [@gucong3000](https://github.com/gucong3000))

## 1.11.2 (June 06, 2017)

* Bug: Updating issue link in change log [#19](https://github.com/Sertion/vscode-gitblame/issues/19) (Thanks to [@adambowles](https://github.com/adambowles))
* Fix: Updating dependencies

## 1.11.1 (June 05, 2017)

* Bug: Singular for single number minutes, hours, and days [#18](https://github.com/Sertion/vscode-gitblame/issues/18) (Thanks to [@adambowles](https://github.com/adambowles))

## 1.11.0 (June 05, 2017)

* Bug: Singular for single number months [#16](https://github.com/Sertion/vscode-gitblame/issues/16) (Thanks to [@adambowles](https://github.com/adambowles))
* Fix: Adding additional tests for checking `toDateText`
* Fix: Watching only blamed files

## 1.10.0 (May 21, 2017)

* Feature: Adding support for git submodules [#12](https://github.com/Sertion/vscode-gitblame/issues/12)

## 1.9.0 (May 15, 2017)

* Bug: Fix link in CHANGELOG.md
* Fix: Moved to TypeScript 2.1.5
* Bug: Allow for underscore in tokens
* Fix: Using `async`/`await` where appropriate
* Bug: Allow token functions do declare default values
* Fix: Moving editor and document validation to its on file
* Fix: Moving git repository finding process to its own file
* Feature: Adding a better tool for handling informative errors to the user
* Feature: Listening to file changes in the repository and generates new git blame info if an external tool changes a file

## 1.8.2 (May 14, 2017)

* Bug: Fix incorrect version number in CHANGELOG.md [#13](https://github.com/Sertion/vscode-gitblame/pull/13) (Thanks to [@zackschuster](https://github.com/zackschuster))
* Fix: Removing `typings` directory
* Feature: Now respects `git.path` (Thanks to [@alessioalex](https://github.com/alessioalex)) [#4](https://github.com/Sertion/vscode-gitblame/issues/4)
* Feature: Adding short hash token to `infoMessageFormat` and `statusBarMessageFormat` [#10](https://github.com/Sertion/vscode-gitblame/issues/10)

## 1.8.1 (May 01, 2017)

* Bug: Fix incorrect file name in imports [#9](https://github.com/Sertion/vscode-gitblame/issues/9) (Thanks to [@pftbest](https://github.com/pftbest))

## 1.8.0 (May 01, 2017)

* Feature: Customizable status bar message format [#5](https://github.com/Sertion/vscode-gitblame/issues/5)
* Feature: Customizable `infoMessage` format
* Enhancement: Updating installation instructions

## 1.7.1 (April 30, 2017)

* Enhancement: Use the same cache for `showMessage` and `view.refresh`

## 1.7.0 (April 30, 2017)

* Feature: Adding setting to ignore whitespace changes (`gitblame.ignoreWhitespace`) [#1](https://github.com/Sertion/vscode-gitblame/issues/1)
* Feature: Adding setting to open commit info in online tool (`gitblame.commitUrl`) [#6](https://github.com/Sertion/vscode-gitblame/issues/6)
* Enhancement: Status bar message no longer clickable when there is no commit associated with the current line
* Enhancement: Adding info about configuration in `README.md`
* Bug: Spawn fewer git processes when opening a file [#3](https://github.com/Sertion/vscode-gitblame/issues/3)

## 1.6.2 (April 29, 2017)

* Updating example animation
* Removing backlog from `README.md`, it is now the [`Planned` label in the issue tracker](https://github.com/Sertion/vscode-gitblame/labels/Planned)

## 1.6.1 (April 29, 2017)

* Split change log into its own file as per [suggestion from @daniel-white](https://github.com/waderyan/vscode-gitblame/issues/30)

## 1.6.0 (April 17, 2017)

* More granular time info
* Adding a re-check of blame info on save

## 1.5.0 (April 17, 2017)

* Spring cleaning

## 1.4.0 (April 16, 2017)

* Now respects changes made in the git working tree when blaming
* Updating dependencies
* Updating to new repository

## 1.3.0 (July 21, 2016)

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/12) to make the status bar message interactive (credit to [@j-em](https://github.com/j-em));

## 1.2.0 (July 20, 2016)

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/10) replacing 'Hello World' message with hash and commit message (credit to [@carloscz](https://github.com/carloscz)).

## 1.1.0 (May 20, 2016)

* Reduced text size which was causing the blame info not to show.
* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/5) (credit to [@fogzot](https://github.com/fogzot)) that searches for .git in parent dirs.

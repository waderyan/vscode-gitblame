# Git Blame

See Git Blame information in the status bar for the currently selected line.

![Feature Usage](https://github.com/Sertion/vscode-gitblame/raw/master/images/GitBlamePreview.gif)

# Install

Open up VS Code.

1. Press `F1`
2. Type `ext` in command palette
3. Select "install" and hit enter
4. Type `blame`
5. Select "Git Blame" extension and hit enter

# Configuration

- `gitblame.commitUrl` (`string`, default `""`)
  - url where you can see the commit by hash
  - Available tokens:
    - `${hash}` - the commit hash
  - _Example:_ `https://github.com/Sertion/vscode-gitblame/commit/${hash}`
- `gitblame.ignoreWhitespace` (`boolean`, default `false`)
  - use the git blame `-w` flag

# [Planned Features](https://github.com/Sertion/vscode-gitblame/labels/Planned)

# [Known Issues](https://github.com/waderyan/vscode-gitblame/issues)

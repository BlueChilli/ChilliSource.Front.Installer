# ChilliSource.Front.Installer

A CLI script to create a new project using BlueChilli's Front-end Framework or to use one or more parts of the aforesaid framework.

## Usage

The script is pretty self explanatory on execution. Every single time when the command requires input from the user, it will prompt. So, you can even start using it without having to read the rest of this page :smirk:

```shell
npx bc-starter-template <project-directory>
```

## Flags

There three flags available for you to use. You can use them together too if you like:

| Name       | Short | Long                | Description                                                                               |
| ---------- | ----- | ------------------- | ----------------------------------------------------------------------------------------- |
| Modules    | `-m`  | `--only-modules`    | This shows a prompt to the user select modules and install them and their dependencies    |
| Components | `-c`  | `--only-components` | This shows a prompt to the user select components and install them and their dependencies |
| Styles     | `-s`  | `--only-styles`     | This installs the latest version of style helpers to the target directory                 |

Of course you can use `npx bc-starter-template --help` or `npx bc-starter-template -h` for help directly in the your terminal.

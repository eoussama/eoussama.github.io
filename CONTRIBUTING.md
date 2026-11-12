# Contributing to the portfolio

Thank you for your interest in contributing to my **portfolio**! It's my personal site, so most of what's on it is mine to write, but fixes are always welcome: a bug, a broken link, a typo, a layout that breaks on your screen, or a translation that reads wrong in one of its seven languages.

Before you start contributing, please take a moment to review this guide, which outlines the process for contributing and the community guidelines we follow.

## Code of Conduct

We have a [Code of Conduct](CODE_OF_CONDUCT.md) that we expect all contributors to adhere to. Please read it and make sure you understand and follow it in all your interactions within our project.

## Getting Started

- If you are new to the project, please review the [README](README.md) for an overview of how the site is built and how to run it.

- Check the [Issues](https://github.com/eoussama/eoussama.github.io/issues) to find tasks that need assistance or to report any bugs or feature requests.

- For security vulnerabilities, do **not** open an issue. Follow the [Security Policy](SECURITY.md) instead.

## How to Contribute

1. Fork the repository to your GitHub account.

2. Create a new branch for your contribution:

   ```bash
   git checkout -b fix/your-fix-name
   ```

3. Make your changes, keeping each commit focused on a single concern.

4. Run the checks the site is held to:

   ```bash
   pnpm lint
   pnpm check
   ```

5. Commit your changes with a clear, descriptive message, prefixed with `feat:`, `fix:` or `chore:`:

   ```bash
   git commit -m "fix: describe your fix"
   ```

6. Push the branch to your fork:

   ```bash
   git push origin fix/your-fix-name
   ```

7. Open a pull request against the `master` branch and fill out the pull request template.

## Pull Request Guidelines

- Link the issue your pull request addresses, if any.
- Keep pull requests small and focused; split unrelated changes into separate pull requests.
- When you change the interface's wording, change it in every language in `src/i18n/ui.ts`, or say which ones you couldn't.
- Check your change in both the light and dark themes, and on a phone-sized screen.
- Be responsive to review feedback.

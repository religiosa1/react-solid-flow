# react-solid-flow changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Added
- additional typescript checks if useResource value is a function type, so it's
  impossible to accidently miss the external function wrapper during initialization
- `<Match />` narrows down renderProp type to non-nullable values
### Changed
- `<Await />` now renders nothing instead of throwing an error, if nullish `for` prop was supplied
- exports declaration was changed for better cjs/mjs support
- stricter internal dispatch checkings in useResource
- documentation and changelog typos, wordings and better examples

## [0.2.3] - 2023-02-20
### Changed
- `typeof function` being used instead of `instanceOf Function` in checks inside the
  code to avoid potential [issue with Jest](https://github.com/facebook/jest/issues/6329)
### Security
- devDependencies versions bump

## [0.2.2] - 2023-01-25
### Changed
- actually change react jsx-runtime back to classic in the bundle,
  because of the issue with webpack5 mjs imports

## [0.2.1] - 2023-01-24
### Changed
- eslint check was added to the build-test pipeline, so it's required for lint to pass
- Stricter error verification rules, resource error types were changed from any to unknown
- jsx-runtime settings changed to react-jsx
### Fixed
- fixed or muted all the previous eslint warnings

## [0.2.0] - 2023-01-23
First public release.
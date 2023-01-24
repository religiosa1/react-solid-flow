# managed-timeout changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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
# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/typescript-tea/core/compare/v0.3.0...master)

- Add `setup()` to `EffectManger`. This makes it possible for setup code to exist outside of core. For example code for setting up listening to popstate for navigation.
- Add generic `Init` type to `init()` function and `Program.run()` instead of passing current url. This makes it possible to pass any type of data from the outside into the init() function of the program (a litle similar to Elm's flags). Since you can pass anything, tt is still possible to pass current url.
- Remove `onUrlChange` from `Program`. This can instead be passed as creation parameter to a navigation effect manager.

## [0.3.0](https://github.com/typescript-tea/core/compare/v0.2.0...v0.3.0) - 2020-03-04

### Changed

- Internal refactoring.

## [0.2.0](https://github.com/typescript-tea/core/compare/v0.1.0...v0.2.0) - 2020-02-26

### Changed

- Renamed runtime to Program.run()
- Renamed mapDispatch to Dispatch.map()
- Require render function to Program.run()
- Make effectManagers optional in Program.run()
- Remove dep on ts-exhaustive-check

## [0.1.0](https://github.com/typescript-tea/core/compare/v0.1.0...v0.1.0) - 2020-01-26

### Added

- Initial version.

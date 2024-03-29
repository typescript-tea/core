# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/typescript-tea/core/compare/v0.6.0...master)

## [0.6.0](https://github.com/typescript-tea/core/compare/v0.5.1...0.6.0) - 2022-07-05

### Added

- Do not call view()/render() when state has not changed (#14)

## [0.5.1](https://github.com/typescript-tea/core/compare/v0.5.0...0.5.1) - 2021-05-23

### Fixed

- Always call all effect managers so they get updated subscriptions even if there are no subscriptions anymore. See PR [#8](https://github.com/typescript-tea/core/pull/8) and See PR [#9](https://github.com/typescript-tea/core/pull/9).

## [0.5.0](https://github.com/typescript-tea/core/compare/v0.4.0...0.5.0) - 2020-10-22

### Added

- Add internal dummy field to preserve generic parameter of `Cmd<Action>` and `Sub<Action>`.

## [0.4.0](https://github.com/typescript-tea/core/compare/v0.3.0...0.4.0) - 2020-04-24

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

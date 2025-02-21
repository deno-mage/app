# Contributing

## Requirements

- [Deno](https://deno.land/)
- [Pre-commit](https://pre-commit.com/)

## Setup

1. Clone the repository
2. Install the pre-commit hooks by running `pre-commit install`
3. Install dependencies by running `deno install`

## Testing

The core philosophy of Mage is to be test-driven. In general favour writing
tests against a running server.

Run the tests with the following command:

```sh
deno task test
```

## Committing changes

**Ensure you have the pre-commit hooks installed.** These run in CI on the
server so you won't be able to merge if they aren't run but they're extremely
fast and will save you time.

When committing changes, loosely follow the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
specification. Pull request titles are linted to be conventional commit format
and are then used as the commit message upon squash merging.

```sh
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update documentation"
...
```

## Releasing

Releases are automatically created when a pull request is merged if the version
in [deno.json](./deno.json) is updated. The version should be updated following
the [Semantic Versioning](https://semver.org/) specification.

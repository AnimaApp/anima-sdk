# Development

## Setup

1. Install the dependencies from the monorepo root:

```
yarn
```

2. Install the dependencies from Playwright to run the tests:

```
npx playwright install --with-deps
```

3. Write the an env file at `example-server/.env`. Use [`example-server/example.env`](example-server/example.env) as a guideline.

4. Start all the dev scripts:

```
yarn dev
```

5. Run the tests. Note: You need to start the development server firstly before running the tests:

```
yarn test
```

## Testing

### `sdk`

We have a snapshot of a [Figma design for testing](https://www.figma.com/design/5d0u9PmD4GtB5fdX57pTtK/Anima-SDK---Test-File?node-id=0-1&p=f&t=kJLhweCNMscFzELT-11).

Whenever you need to test a different case, you should update this design and update the local snapshot. Steps to do it:

1. Create a `sdk/.env` [following this example](./sdk/example.env).

2. Run this command:

```
yarn update-design-test-snapshot
```

## Publishing

CircleCI publishes automatically to GitHub Packages and NPM whenever a commit is merged to the main branch.

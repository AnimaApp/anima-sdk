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

## Publishing

CircleCI publishes automatically to GitHub Packages and NPM whenever a commit is merged to the main branch.

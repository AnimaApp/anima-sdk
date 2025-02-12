<img src="https://avatars.githubusercontent.com/u/20587282?s=200&v=4" align="right" />

# Anima SDK

> Design to code, automated

```ts
import { Anima } from "@animaapp/anima-sdk";

const anima = new Anima({
  auth: { token: "Your Anima Token" },
});

const { files } = await anima.generateCode({
  fileKey: "Figma Design Key",
  figmaToken: "Your Figma Token",
  nodesId: ["1:2"],
  settings: {
    language: "typescript",
    framework: "react",
    styling: "css",
  },
});

console.log(files); // High-quality React code from your Figma design!
```

## Anima SDK for React

We offer an official React package: `@animaapp/anima-sdk-react`.

## Assets Storage

The Figma file may contains assets. You can choose whether to let us host them, or give you the assets links to download then you can host them, or return the assets togheter the source files.

### Have Anima host your assets

```ts
const { files } = await anima.generateCode({
  assetsStorage: { strategy: "host" },
});
```

With the `"local"` strategy, Anima will host the assets files. This is the default strategy.

### Manage your own hosting

```ts
const { files, assets } = await anima.generateCode({
  assetsStorage: { strategy: "external", url: "https://cdn.example.com" },
});
```

With the `"external"` strategy, the method returns assets, an array of `{ name, url }`. Download each asset from its url and re-upload it at your own hosting.

### Local

If you are using `useAnimaCodegen` from `@animaapp/anima-sdk-react`, you have one additional strategy: `"local"`.

```ts
const { files } = await useAnimaCodegen({
  assetsStorage: { strategy: "local", path: "/" },
});
```

It downloads all the assets from the client-side and include them in `files` as base64.

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
    model: "gpt-4o-mini",
    framework: "react",
    styling: "css",
  },
});

console.log(files); // High-quality React code from your Figma design!
```

## Anima SDK for React

We offer an official React package: `@animaapp/anima-sdk-react`.

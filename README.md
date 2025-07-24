<img src="https://avatars.githubusercontent.com/u/20587282?s=200&v=4" align="right" />

# Anima SDK

> Design to code, automated

The Anima SDK allows you to generate code from:

* **Figma** -> Converts Figma designs into high-quality code.
* **Websites** (Early Preview) -> Converts website URLs into high-quality code.

Here are some examples of how to use the Anima SDK to generate code from any Figma design or website.

## Example: Figma to Code

```ts
import { Anima } from "@animaapp/anima-sdk";

const anima = new Anima({
  auth: {
    token: "Your Anima Token",
    userId: "x", // Optional, only used if you want to link the request to an external id
  },
});

const { files } = await anima.generateCode({
  fileKey: "Figma Design Key",
  figmaToken: "Your Figma Token",
  nodesId: ["1:2"],
  settings: {
    language: "typescript",
    framework: "react",
    styling: "tailwind",
    uiLibrary: "shadcn",
  },
  tracking: {
    externalId: "x", // Optional, used to override the userId from auth, if provided
  },
});

console.log(files); // High-quality React code from your Figma design!
```

Check [`example-server`](/example-server) to see a thin example on how to expose an endpoint to call Anima API.

## Example: Website to Code (Early Preview)

```ts
import { Anima } from "@animaapp/anima-sdk";

const anima = new Anima({
  auth: {
    token: "Your Anima Token",
    userId: "x", // Optional, only used if you want to link the request to an external id
  },
});

const { files } = await anima.generateCodeFromWebsite({
  url: "https://www.example.com", // The URL of the website to convert
  settings: {
    framework: "react",
    language: "typescript",
    styling: "tailwind",
  },
  tracking: {
    externalId: "x", // Optional, used to override the userId from auth, if provided
  },
});

console.log(files); // High-quality React code from your website!
```

Check [`example-server`](/example-server) to see a thin example on how to expose an endpoint to call Anima API.

## SDK

> Note: The package `@animaapp/anima-sdk` is designed to run on the backend.

### Settings Options

The following options can be passed to the `settings` parameter when calling `generateCode` or `generateCodeFromWebsite`.

> Note: Not all options are available for both Figma designs and websites. We will mark the options that are available for each source.

| Option                      | Type                                                                                                       | Description                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `language`                  | `"typescript" \| "javascript"` <br><br> Note: only `typescript` is currently available for websites.                                                                             | The programming language to use for code generation.                                     |
| `framework`                 | `"react" \| "html"`                                                                                        | The framework to use for code generation.                                                |
| `styling`                   | `"plain_css" \| "css_modules" \| "styled_components" \| "tailwind" \| "sass" \| "scss" \| "inline_styles"` <br><br> Note: only `tailwind` is currently available for websites. | The styling approach to use for the generated code.                                      |
| `uiLibrary`                 | `"mui" \| "antd" \| "radix" \| "shadcn"` <br><br> Note: only `shadcn` is currently available for websites. You can also omit this option to use vanilla React.                                                                   | The UI component library to use (React only).                                            |
| `responsivePages`           | `Array<{ name: string; framesId: string[] }>` <br><br> Note: only available for Figma designs.                                                              | When set, it overrides any responsive settings from the plugin.                          |
| `enableTranslation`         | `boolean` <br><br> Note: only available for Figma designs.                                                                                                  | Enable translation support (HTML only).                                                  |
| `enableCompactStructure`    | `boolean` <br><br> Note: only available for Figma designs.                                                                                                  | Generate a more compact file structure.                                                  |
| `enableAutoSplit`           | `boolean` <br><br> Note: only available for Figma designs.                                                                                                  | Automatically split components based on complexity.                                      |
| `autoSplitThreshold`        | `number` <br><br> Note: only available for Figma designs.                                                                                                   | The complexity threshold for auto-splitting components.                                  |
| `disableMarkedForExport`    | `boolean` <br><br> Note: only available for Figma designs.                                                                                                  | Disable the "marked for export" feature.                                                 |
| `allowAutoSelectFirstNode`  | `boolean` <br><br> Note: only available for Figma designs.                                                                                                  | Auto-select first valid node when passed a page with multiple children (default: `true`) |
| `enableGeneratePackageLock` | `boolean`                                                                                                  | Generate package-lock.json file.                                                         |
| `enableDisplayDataId`       | `boolean` <br><br> Note: only available for Figma designs.                                                                                                  | Add data-id attributes to elements for easier testing and selection.                     |
| `enableDisplayDataName`     | `boolean` <br><br> Note: only available for Figma designs.                                                                                                  | Add data-name attributes to elements for easier identification.                          |
| `enableAnimationsPreset`    | `boolean` <br><br> Note: only available for React with Shadcn UI library.                                                                                   | Enable basic animations for elements.                                                    |

### Utils

#### `isValidFigmaUrl`

Check if a given Figma link is a valid design for code generation.

## Anima SDK for React

We offer an official React package: `@animaapp/anima-sdk-react`.

### Getting Top-Level Node IDs

To get the top-level node IDs from a Figma file, you can use the `useFigmaFile` hook:

```tsx
import { useFigmaFile } from "@animaapp/anima-sdk-react";

function FigmaNodeExplorer() {
  const { data, isLoading, error } = useFigmaFile({
    fileKey: "your-figma-file-key",
    authToken: "your-figma-token",
    params: {
      depth: 2, // Controls how deep into the document tree to traverse:
                // depth: 1 - returns only Pages
                // depth: 2 - returns Pages and all top level objects on each page
                // omitting depth - returns all nodes (can be resource-intensive for large files)
    },
  });

  if (isLoading) return <div>Loading Figma file...</div>;
  if (error) return <div>Error loading file: {error.message}</div>;

  // Extract top-level node IDs from the document (assuming depth: 2)
  const pages = data?.document?.children ?? [];
  const topLevelNodeIds = pages.flatMap((page) => page.children).map((frame) => frame.id);

  return (
    <div>
      <h3>Top-level Node IDs:</h3>
      <ul>
        {topLevelNodeIds.map(nodeId => (
          <li key={nodeId}>{nodeId}</li>
        ))}
      </ul>
    </div>
  );
}
```

These node IDs can then be used in the `nodesId` parameter when calling `generateCode()`.

### Assets Storage

The generated code may contain assets. You can choose whether to let us host them, or give you the assets links to download then you can host them, or return the assets together with the source files.

> Note: Website imports currently only support the `host` and `external` strategies.

#### Have Anima host your assets

```ts
const { files } = await anima.generateCode({
  assetsStorage: { strategy: "host" },
});
```

With the `"host"` strategy, Anima will host the assets files. This is the default strategy.

#### Manage your own hosting

```ts
const { files, assets } = await anima.generateCode({
  assetsStorage: { strategy: "external", url: "https://cdn.example.com" },
});
```

With the `"external"` strategy, the method returns assets in an array of `{ name, url }`. Download each asset from its url and re-upload it at your own hosting.

#### Local

If you are using `useAnimaCodegen` from `@animaapp/anima-sdk-react`, you have one additional strategy: `"local"`.

```ts
const { files } = await useAnimaCodegen({
  assetsStorage: {
    strategy: "local",
    filePath: "public/assets",
    referencePath: "/",
  },
});

// or

const { files } = await useAnimaCodegen({
  assetsStorage: {
    strategy: "local",
    path: "/", // equivalent of `{ filePath: "/", referencePath: "/" }`
  },
});
```

It downloads all the assets from the client-side and include them in `files` as base64.

The property `filePath` defines where the files are stored in the project, and `referencePath` defines the base path when the source references for a file (e.g., the `src` attribute from `<img />`). If both values are equal, you can use just `path`.

## Development

See [`DEVELOPMENT.md`](DEVELOPMENT.md) to learn how to develop the Anima SDK itself - not how to use it on your project.

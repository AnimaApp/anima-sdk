import { AnimaFiles } from "../types";

export const getRelatedScreenFiles = ({
  files,
  screenPath = "src/screens",
}: {
  files: AnimaFiles;
  screenPath?: string;
}) => {
  const result: AnimaFiles = {};
  const processed = new Set<string>();

  function processFile(filePath: string) {
    if (processed.has(filePath) || !files[filePath]) {
      return;
    }

    processed.add(filePath);
    result[filePath] = files[filePath];

    const imports = parseImports(files[filePath].content);

    imports.forEach((importPath) => {
      try {
        const resolvedPath = resolveImportPath(filePath, importPath);

        if (resolvedPath.startsWith("src/")) {
          const importDir = resolvedPath.split("/").slice(0, -1).join("/");
          const dirFiles = getAllFilesInDirectory(files, importDir);
          dirFiles.forEach((file) => {
            if (!processed.has(file)) {
              processFile(file);
            }
          });
        }
      } catch (error) {
        console.warn(
          `Failed to resolve import ${importPath} in ${filePath}:`,
          error
        );
      }
    });
  }

  Object.entries(files).forEach(([key, value]) => {
    if (key.startsWith(screenPath)) {
      processFile(key);
    } else if (!key.startsWith("src/")) {
      result[key] = value;
    }
  });

  return result;
};

function parseImports(content: string): string[] {
  const importRegex = /import.*?["']([^"']+)["']/g;
  const exports = /export.*from\s+["']([^"']+)["']/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  while ((match = exports.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return [...new Set(imports)];
}

function resolveImportPath(basePath: string, importPath: string): string {
  if (!importPath.startsWith(".")) {
    return importPath;
  }

  const baseDir = basePath.split("/").slice(0, -1);
  const importParts = importPath.split("/");
  const resolvedParts: string[] = [...baseDir];

  for (const part of importParts) {
    if (part === "..") {
      resolvedParts.pop();
    } else if (part !== ".") {
      resolvedParts.push(part);
    }
  }

  return resolvedParts.join("/");
}

function getAllFilesInDirectory(files: AnimaFiles, dirPath: string): string[] {
  return Object.keys(files).filter((file) => file.startsWith(dirPath));
}

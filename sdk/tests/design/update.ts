import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { getFigmaFile } from "../../src";
import { GetFileResponse } from "@figma/rest-api-spec";

dotenv.config();

const figmaAuthToken = process.env.FIGMA_AUTH_TOKEN;

if (!figmaAuthToken) {
  throw new Error('Missing environment variable "FIGMA_AUTH_TOKEN"');
}

const getDesingFilePath = () => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(dirname, "design.ts");

  return filePath;
};

const getFileContent = (design: GetFileResponse) => {
  return `/* eslint-disable @typescript-eslint/no-loss-of-precision */

import type { GetFileResponse } from "@figma/rest-api-spec";

export default ${JSON.stringify(design, null, 2)} satisfies GetFileResponse;`;
};

const update = async () => {
  const design = await getFigmaFile({
    fileKey: "5d0u9PmD4GtB5fdX57pTtK",
    authToken: figmaAuthToken,
    params: {
      geometry: "paths",
    },
  });

  const designFilePath = getDesingFilePath();
  const fileContent = getFileContent(design);

  fs.writeFileSync(designFilePath, fileContent, "utf-8");

  console.log(`Design file has been generated at "${designFilePath}"`);
};

update();

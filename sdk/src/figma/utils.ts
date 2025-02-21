import type { GetFileResponse, Node } from '@figma/rest-api-spec';
import { FigmaRestApi } from '@animaapp/http-client-figma';
import { handleFigmaApiError, type FigmaApiError } from './figmaError';

export type FigmaNode = Node;
export type GetFileParams = { fileKey: string; authToken?: string; figmaRestApi?: FigmaRestApi };

export type FigmaPage = { id: string; name: string };
export type GetFilePagesParams = {
  fileKey: string;
  authToken?: string;
  figmaRestApi?: FigmaRestApi;
  params?: Record<string, string | number | undefined>;
};
export type GetFilePagesResult = FigmaPage[] | undefined;
export type GetFileNodesParams = {
  fileKey: string;
  authToken?: string;
  nodeIds: string[];
  figmaRestApi?: FigmaRestApi;
  params?: Record<string, string | number>;
};

export type GetFigmaFileResult = GetFileResponse | undefined;

export const getFigmaFile = async ({
  fileKey,
  authToken,
  figmaRestApi = new FigmaRestApi(),
  params = {},
}: GetFilePagesParams): Promise<GetFigmaFileResult> => {
  if (authToken) {
    figmaRestApi.token = authToken;
  }

  try {
    const rootFile = await figmaRestApi.files.get({
      fileKey,
      params,
    });

    return rootFile;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getFileNodes = async ({
  fileKey,
  authToken,
  nodeIds,
  figmaRestApi = new FigmaRestApi(),
  params = {},
}: GetFileNodesParams) => {
  if (authToken) {
    figmaRestApi.token = authToken;
  }

  try {
    const data = await figmaRestApi.nodes.get({
      fileKey,
      nodeIds,
      params: {
        ...params,
      },
    });

    return data.nodes;
  } catch (error) {
    return handleFigmaApiError(error as FigmaApiError, fileKey);
  }
};

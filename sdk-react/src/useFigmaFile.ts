import useSWR from "swr";
import { useAnimaSDK } from "./AnimaSdkProvider";

export const useFigmaFile = ({
  fileKey,
  authToken,
  enabled = true,
  params = {},
}: {
  fileKey: string;
  authToken?: string;
  enabled?: boolean;
  params?: {
    depth?: number;
  };
}) => {
  const { figmaRestApi } = useAnimaSDK();

  const isEnabled = Boolean(enabled && fileKey && authToken);

  const { data, isLoading, error } = useSWR(
    ["useFigmaFile", fileKey, authToken, params],
    () => {
      if (!isEnabled) {
        return null;
      }

      return figmaRestApi
        .withOptions(authToken ? { token: authToken } : {})
        .getFile({
          fileKey,
          depth: params.depth,
        });
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    data: data ?? null,
    isLoading,
    error,
  };
};

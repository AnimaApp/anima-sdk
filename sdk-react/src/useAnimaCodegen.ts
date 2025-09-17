import { useCallback, useState } from "react";
import {
  CodegenState,
  createJob,
  initialProgress,
  UseAnimaParams,
} from "./createJob";

/**
 * @deprecated use `createJob` from `AnimaSdkProvider` instead
 */
export const useAnimaCodegen = ({
  url,
  method = "POST",
}: {
  url: string;
  method?: string;
}) => {
  const [state, setState] = useState<CodegenState>(initialProgress);

  const getCode = useCallback(
    <T extends UseAnimaParams = UseAnimaParams>(params: T) =>
      createJob(url, method, params, setState),
    [url, method]
  );

  return {
    getCode,
    status: state.status,
    progressMessages: state.progressMessages,
    jobSessionId: state.jobSessionId,
    jobStatus: state.jobStatus,
    tasks: state.tasks,
    error: state.error,
    result: state.result,
  };
};

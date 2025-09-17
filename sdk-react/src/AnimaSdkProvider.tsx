/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AnimaFiles, ProgressMessage } from '@animaapp/anima-sdk';
import { initialProgress, createJob as sdkCreateJob, UseAnimaParams } from './createJob';

type JobType = 'f2c' | 'l2c' | 'p2c';

type Job =
  | { status: 'idle' }
  | {
    status: 'error';
    type: JobType;
    params: Record<string, any>;
    error: CreateJobError;
    sessionId: string | null;
    payload: Record<string, any>;
    progressMessages: ProgressMessage[];
  }
  | {
    status: 'pending';
    type: JobType;
    params: Record<string, any>;
    sessionId: string | null;
    payload: Record<string, any>;
    progressMessages: ProgressMessage[];
  }
  | {
    status: 'success';
    type: JobType;
    params: Record<string, any>;
    sessionId: string;
    payload: Record<string, any>;
    assets?: Array<{
      name: string;
      url: string;
    }>;
    files: AnimaFiles;
    progressMessages: ProgressMessage[];
  };

type AnimaSdkContextType = {
  createJob: <T extends UseAnimaParams = UseAnimaParams>(type: JobType, params: T) => Promise<void>;
  job: Job;
};

type Props = {
  f2cUrl: string;
  l2cUrl: string;
  p2cUrl: string;
  children: ReactNode;
};

export class CreateJobError extends Error {
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'CreateJobError';
    this.cause = cause;
  }
}

export class UnknownCodegenError extends Error {
  constructor() {
    super('');
    this.name = 'UnknownCodegenError';
  }
}

export const AnimaSdkContext = createContext<AnimaSdkContextType | null>(null);

export function AnimaSdkProvider({ f2cUrl, l2cUrl, p2cUrl, children }: Props) {
  const [job, setJob] = useState<Job>({ status: 'idle' });
  const currentJobType = useRef<JobType | null>(null);
  const [rawState, setRawState] = useState(initialProgress);

  const mappingJobTypeToUrl: Record<JobType, string> = {
    f2c: f2cUrl,
    l2c: l2cUrl,
    p2c: p2cUrl,
  };

  const createJob = async (type: JobType, params: UseAnimaParams) => {
    if (job.status === 'pending') {
      throw new Error('A job is already in progress');
    }

    currentJobType.current = type;

    try {
      const url = mappingJobTypeToUrl[type];
      const { result } = await sdkCreateJob(url, 'POST', params, (newState) => setRawState(newState));

      if (result) {
        const sessionId = result.sessionId;
        const files = result.files;
        const assets = result.assets

        setJob((job) => ({
          status: 'success',
          type,
          params: 'params' in job ? job.params : {},
          sessionId,
          payload: rawState.jobStatus,
          assets,
          files,
          progressMessages: rawState.progressMessages,
        }));

        return;
      }
    } catch (e) {
      currentJobType.current = null;

      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      const error = new CreateJobError(errorMessage, e);

      setJob({
        status: 'error',
        type,
        params,
        error,
        sessionId: rawState.jobSessionId ?? null,
        payload: rawState.jobStatus,
        progressMessages: rawState.progressMessages,
      });

      throw error;
    }
  };

  useEffect(() => {
    if (!currentJobType.current) {
      return;
    }

    const jobType = currentJobType.current

    if (rawState.status === 'error') {
      const error = rawState.error ?? new UnknownCodegenError();

      setJob((job) => ({
        status: 'error',
        type: jobType,
        params: 'params' in job ? job.params : {},
        error,
        sessionId: rawState.jobSessionId ?? null,
        payload: rawState.jobStatus,
        progressMessages: rawState.progressMessages,
      }));

      return;
    }

    if (rawState.status === 'pending') {
      setJob((job) => ({
        status: 'pending',
        type: jobType,
        params: 'params' in job ? job.params : {},
        sessionId: rawState.jobSessionId,
        payload: rawState.jobStatus,
        progressMessages: rawState.progressMessages,
      }));

      return;
    }
  }, [rawState]);

  return (
    <AnimaSdkContext.Provider
      value={{
        createJob,
        job,
      }}
    >
      {children}
    </AnimaSdkContext.Provider>
  );
}

export function useAnimaSDK() {
  const context = useContext(AnimaSdkContext);

  if (!context) {
    throw new Error('useAnimaSDK must be used within AnimaSDKProvider');
  }

  return context;
}

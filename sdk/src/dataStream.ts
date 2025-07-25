/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Anima } from "./anima";
import type { GetCodeFromFigmaErrorReason } from "./errors";
import type {
  GetCodeParams,
  GetCodeFromWebsiteParams,
  GetCodeFromPromptParams,
  GetLink2CodeParams,
  SSEGetCodeFromWebsiteMessage,
  SSEGetCodeFromPromptMessage,
  SSEGetCodeFromFigmaMessageErrorPayload,
  SSEGetCodeFromFigmaMessage,
} from "./types";

type StreamErrorPayload = {
  name: string;
  message: GetCodeFromFigmaErrorReason;
  status?: number;
  detail?: unknown;
  errorPayload?: SSEGetCodeFromFigmaMessageErrorPayload;
};

export type StreamMessage<T> =
  | Exclude<T, { type: "error" }>
  | {
    type: "error";
    payload: StreamErrorPayload;
  };

export type StreamCodgenMessage = StreamMessage<SSEGetCodeFromFigmaMessage>;
export type StreamCodeFromWebsiteMessage =
  StreamMessage<SSEGetCodeFromWebsiteMessage>;
export type StreamCodeFromPromptMessage =
  StreamMessage<SSEGetCodeFromPromptMessage>;
export type StreamL2CMessage = StreamMessage<SSEGetCodeFromWebsiteMessage>;

/**
 * Generic function to create a stream for both codegen and link2code.
 * 
 * @param anima - An Anima service instance
 * @param params - Parameters for the generation process
 * @param generateMethod - The method to call on the Anima instance
 * @returns A ReadableStream that emits messages related to the generation process
 */
function createGenerationStream<
  TParams,
  TMessage,
  TStreamMessage extends StreamMessage<TMessage>
>(
  anima: Anima,
  params: TParams,
  generateMethod: (
    params: TParams,
    handler: (message: TMessage) => void
  ) => Promise<any>
): ReadableStream<TStreamMessage> {
  return new ReadableStream({
    start(controller) {
      generateMethod
        .call(anima, params, (message: any) => {
          if (message.type === "error") {
            // TODO: It's a dead code. It's never reached, since all errors are thrown.
            // controller.enqueue({
            //   type: "error",
            //   payload: { message: message.payload.reason },
            // });
          } else {
            controller.enqueue(message);
          }

          if (message.type === "aborted" || message.type === "error") {
            controller.close();
          }
        })
        .then((_result) => {
          controller.enqueue({
            type: "done",
            payload: {
              tokenUsage: _result.tokenUsage,
              sessionId: _result.sessionId,
            },
          } as any);
          controller.close();
        })
        .catch((error) => {
          controller.enqueue({
            type: "error",
            payload: {
              name: "name" in error ? error.name : "Unknown error",
              message: "message" in error ? error.message : "Unknown",
              status: "status" in error ? error.status : undefined,
              detail: "detail" in error ? error.detail : undefined,
              errorPayload: "payload" in error ? error.payload : undefined,
            },
          } as any);
          controller.close();
        });
    },
  });
}

/**
 * Start the code generation and creates a ReadableStream to output its result.
 *
 * The stream is closed when the codegen ends.
 *
 * @param {Anima} anima - An Anima service instance to generate the code from.
 * @param {GetCodeParams} params - Parameters required for the code generation process.
 * @returns {ReadableStream<StreamCodgenMessage>} - A ReadableStream that emits messages related to the code generation process.
 */
export const createCodegenStream = (
  anima: Anima,
  params: GetCodeParams
): ReadableStream<StreamCodgenMessage> => {
  return createGenerationStream<
    GetCodeParams,
    SSEGetCodeFromFigmaMessage,
    StreamCodgenMessage
  >(anima, params, anima.generateCode);
};

/**
 * Generic function to create a Server-Sent Events (SSE) Response from a stream.
 *
 * @param stream - The stream to convert to an SSE response
 * @returns A promise that resolves to an HTTP response
 */
async function createResponseEventStream<
  T extends { type: string; payload?: any },
>(stream: ReadableStream<T>): Promise<Response> {
  const [verifyStream, consumerStream] = stream.tee();
  const firstMessage = await verifyStream.getReader().read();

  if (
    firstMessage.done ||
    !firstMessage.value ||
    (firstMessage.value.type === "error" && firstMessage.value.payload?.status)
  ) {
    return new Response(JSON.stringify(firstMessage.value), {
      status:
        firstMessage.value?.type === "error"
          ? (firstMessage.value.payload?.status ?? 500)
          : 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const encoder = new TextEncoder();
  const seeStream = consumerStream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        const sseString = `event: ${chunk.type}\ndata: ${JSON.stringify(
          chunk
        )}\n\n`;
        controller.enqueue(encoder.encode(sseString));
      },
    })
  );

  return new Response(seeStream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    },
  });
}

/**
 * Creates a Server-Sent Events (SSE) `Response` that forwards all messages from the code generation stream.
 *
 * But, if the first message indicates an error (e.g., connection failed), the function returns a 500 response with the error message.
 *
 * @param {Anima} anima - The Anima instance to use for creating the data stream.
 * @param {GetCodeParams} params - The parameters for the code generation request.
 * @returns {Promise<Response>} - A promise that resolves to an HTTP response.
 */
export const createCodegenResponseEventStream = async (
  anima: Anima,
  params: GetCodeParams
): Promise<Response> => {
  const stream = createCodegenStream(anima, params);
  return createResponseEventStream(stream);
};

/**
 * Start the code generation from website and creates a ReadableStream to output its result.
 *
 * The stream is closed when the code generation ends.
 *
 * @param {Anima} anima - An Anima service instance to generate the code from.
 * @param {GetCodeFromWebsiteParams} params - Parameters required for the code generation process.
 * @returns {ReadableStream<StreamCodeFromWebsiteMessage>} - A ReadableStream that emits messages related to the code generation process.
 */
export const createCodeFromWebsiteStream = (
  anima: Anima,
  params: GetCodeFromWebsiteParams
): ReadableStream<StreamCodeFromWebsiteMessage> => {
  return createGenerationStream<
    GetCodeFromWebsiteParams,
    SSEGetCodeFromWebsiteMessage,
    StreamCodeFromWebsiteMessage
  >(anima, params, anima.generateCodeFromWebsite);
};

/**
 * Creates a Server-Sent Events (SSE) `Response` that forwards all messages from the code generation from website stream.
 *
 * But, if the first message indicates an error (e.g., connection failed), the function returns a 500 response with the error message.
 *
 * @param {Anima} anima - The Anima instance to use for creating the data stream.
 * @param {GetCodeFromWebsiteParams} params - The parameters for the code generation request.
 * @returns {Promise<Response>} - A promise that resolves to an HTTP response.
 */
export const createCodeFromWebsiteResponseEventStream = async (
  anima: Anima,
  params: GetCodeFromWebsiteParams
): Promise<Response> => {
  const stream = createCodeFromWebsiteStream(anima, params);
  return createResponseEventStream(stream);
};

/**
 * Prompt to Code (p2c) stream flow.
 *
 * Start the prompt to code generation and creates a ReadableStream to output its result.
 *
 * The stream is closed when the code generation ends.
 *
 * @param {Anima} anima - An Anima service instance to generate the code from.
 * @param {GetCodeFromPromptParams} params - Parameters required for the code generation process.
 * @returns {ReadableStream<StreamCodeFromPromptMessage>} - A ReadableStream that emits messages related to the code generation process.
 */
export const createCodeFromPromptStream = (
  anima: Anima,
  params: GetCodeFromPromptParams
): ReadableStream<StreamCodeFromPromptMessage> => {
  return createGenerationStream<
    GetCodeFromPromptParams,
    SSEGetCodeFromPromptMessage,
    StreamCodeFromPromptMessage
  >(anima, params, anima.generateCodeFromPrompt);
};

/**
 * Creates a Server-Sent Events (SSE) `Response` that forwards all messages from the code generation from prompt stream.
 *
 * But, if the first message indicates an error (e.g., connection failed), the function returns a 500 response with the error message.
 *
 * @param {Anima} anima - The Anima instance to use for creating the data stream.
 * @param {GetCodeFromPromptParams} params - The parameters for the code generation request.
 * @returns {Promise<Response>} - A promise that resolves to an HTTP response.
 */
export const createCodeFromPromptResponseEventStream = async (
  anima: Anima,
  params: GetCodeFromPromptParams
): Promise<Response> => {
  const stream = createCodeFromPromptStream(anima, params);
  return createResponseEventStream(stream);
};

/**
 * @deprecated This function will be removed soon, please use `createCodeFromWebsiteStream` instead.
 * @experimental
 * This API is experimental and may change or be removed in future releases.
 * Link2Code (l2c) stream flow.
 *
 * Start the URL to code generation and creates a ReadableStream to output its result.
 *
 * The stream is closed when the URL to code generation ends.
 *
 * @param {Anima} anima - An Anima service instance to generate the code from.
 * @param {GetLink2CodeParams} params - Parameters required for the URL to code generation process.
 * @returns {ReadableStream<StreamL2CMessage>} - A ReadableStream that emits messages related to the URL to code generation process.
 */
export const createLink2CodeStream = (
  anima: Anima,
  params: GetLink2CodeParams
): ReadableStream<StreamL2CMessage> => {
  return createGenerationStream<
    GetLink2CodeParams,
    SSEGetCodeFromWebsiteMessage,
    StreamL2CMessage
  >(anima, params, anima.generateLink2Code);
};

/**
 * @deprecated This function will be removed soon, please use `createCodeFromWebsiteResponseEventStream` instead.
 * Creates a Server-Sent Events (SSE) `Response` that forwards all messages from the URL to code generation stream.
 *
 * But, if the first message indicates an error (e.g., connection failed), the function returns a 500 response with the error message.
 *
 * @param {Anima} anima - The Anima instance to use for creating the data stream.
 * @param {GetLink2CodeParams} params - The parameters for the URL to code generation request.
 * @returns {Promise<Response>} - A promise that resolves to an HTTP response.
 */
export const createLink2CodeResponseEventStream = async (
  anima: Anima,
  params: GetLink2CodeParams
): Promise<Response> => {
  const stream = createLink2CodeStream(anima, params);
  return createResponseEventStream(stream);
};

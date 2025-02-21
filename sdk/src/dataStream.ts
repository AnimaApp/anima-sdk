import type { Anima } from "./anima";
import type { CodegenErrorReason } from "./errors";
import type { GetCodeParams, SSECodgenMessage } from "./types";

export type StreamCodgenMessage =
  | Exclude<SSECodgenMessage, { type: "error" }>
  | { type: "error"; payload: { message: CodegenErrorReason, status?: number } };

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
  return new ReadableStream({
    start(controller) {
      anima
        .generateCode(params, (message) => {
          if (message.type === "error") {
            console.log('NOT SURE IF THIS IS REACHABLE, ALL ERRORS ARE THROWING');
            controller.enqueue({
              type: "error",
              payload: { message: message.payload.reason },
            });
          } else {
            controller.enqueue(message);
          }

          if (message.type === "aborted" || message.type === "error") {
            controller.close();
          }
        })
        .then((_result) => {
          controller.enqueue({ type: "done" });
          controller.close();
        })
        .catch((error) => {
          controller.enqueue({
            type: "error",
            payload: {
              message: "message" in error ? error.message : "Unknown",
              status: "status" in error ? error.status : undefined,
            },
          });
          controller.close();
        });
    },
  });
};

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

  const [verifyStream, consumerStream] = stream.tee();
  const firstMessage = await verifyStream.getReader().read();

  if (
    firstMessage.done ||
    !firstMessage.value ||
    firstMessage.value?.type === "error" && firstMessage.value?.payload?.status
  ) {
    return new Response(JSON.stringify(firstMessage.value), {
      status: firstMessage.value?.type === "error" ? (firstMessage.value?.payload?.status ?? 500) : 500,
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
      "Connection": "keep-alive",
      "Cache-Control": "no-cache",
    },
  });
};

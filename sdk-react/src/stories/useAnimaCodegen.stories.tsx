import { useState } from "react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { AnimaSDKResult, CodegenError } from "@animaapp/anima-sdk";
import type { Meta, StoryObj } from "@storybook/react";
import { useAnimaCodegen, UseAnimaParams } from "..";

type Props = {
  payload: UseAnimaParams & { animaAccessToken?: string };
};

const DummyComponent = ({ payload }: Props) => {
  const [result, setResult] = useState<AnimaSDKResult | null>(null);
  const [error, setError] = useState<CodegenError | null>(null);

  const animaCodegen = useAnimaCodegen({
    url: "http://localhost:3000",
  });

  const handleClick = async () => {
    const { result, error } = await animaCodegen.getCode(payload);

    setResult(result);
    setError(error);
  };

  return (
    <div>
      <button data-testid="run-button" onClick={handleClick}>
        Run request
      </button>

      {result && (
        <div>
          <h3>Success result</h3>

          <pre data-testid="request-result" data-status="success">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div>
          <h3>Error result</h3>

          <pre data-testid="request-result" data-status="error">
            {JSON.stringify(
              {
                name: error.name,
                message: error.message,
                status: error.status,
                detail: error.detail,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

const meta = {
  title: "Hooks/useAnimaCodegen",
  component: DummyComponent,
} satisfies Meta<typeof DummyComponent>;
export default meta;

type Story = StoryObj<typeof meta>;

const run = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const result: { result: AnimaSDKResult | null; error: CodegenError | null } =
    { result: null, error: null };

  const canvas = within(canvasElement);

  const runButton = canvas.getByTestId("run-button");
  await userEvent.click(runButton);

  const requestResult = await waitFor(
    () => canvas.findByTestId("request-result"),
    { timeout: 10_000 }
  );

  if (!requestResult.textContent) {
    return result;
  }

  const resultStatus = requestResult.dataset.status;

  if (resultStatus === "success") {
    result.result = JSON.parse(requestResult.textContent);
  } else {
    result.error = JSON.parse(requestResult.textContent);
  }

  return result;
};

export const Success: Story = {
  play: async (context) => {
    const { result } = await run(context);

    expect(result).toMatchObject({
      sessionId: expect.anything(),
      figmaFileName: "Anima SDK - Test File",
      figmaSelectedFrameName: "MyFrame",
      files: expect.anything(),
      tokenUsage: expect.anything(),
    });
  },

  args: {
    payload: {
      fileKey: "5d0u9PmD4GtB5fdX57pTtK",
      nodesId: ["1:2"],
      settings: {
        framework: "react",
        styling: "plain_css",
      },
    },
  },
};

export const InvalidBody: Story = {
  play: async (context) => {
    const { error } = await run(context);

    expect(error).toMatchObject({
      name: "HTTP error from Anima API",
      message: "Invalid body payload",
      status: 400,
      detail: [
        {
          code: "invalid_type",
          expected: "string",
          received: "null",
          path: ["fileKey"],
          message: "Expected string, received null",
        },
      ],
    });
  },

  args: {
    payload: {
      // @ts-expect-error: Testing invalid body payload
      fileKey: null,
      nodesId: ["1:2"],
      settings: {
        framework: "react",
        styling: "plain_css",
      },
    },
  },
};

export const InvalidAnimaJWTTokenFormat: Story = {
  play: async (context) => {
    const { error } = await run(context);

    expect(error).toMatchObject({
      name: "HTTP error from Anima API",
      message: "Invalid Anima token",
      status: 401,
    });
  },

  args: {
    payload: {
      animaAccessToken: "invalid-jwt-token",
      fileKey: "5d0u9PmD4GtB5fdX57pTtK",
      nodesId: ["1:2"],
      settings: {
        framework: "react",
        styling: "plain_css",
      },
    },
  },
};

export const NotFoundFile: Story = {
  play: async (context) => {
    const { error } = await run(context);

    expect(error).toMatchObject({
      name: "Task Crashed",
      message: "Figma file not found",
    });
  },

  args: {
    payload: {
      fileKey: "invalid-file-key",
      nodesId: ["1:2"],
      settings: {
        framework: "react",
        styling: "plain_css",
      },
    },
  },
};

export const NotSupportedNode: Story = {
  play: async (context) => {
    const { error } = await run(context);

    expect(error).toMatchObject({
      name: "Task Crashed",
      message: "Selected node type is not supported",
    });
  },

  args: {
    payload: {
      fileKey: "5d0u9PmD4GtB5fdX57pTtK",
      nodesId: ["14:5"],
      settings: {
        framework: "react",
        styling: "plain_css",
      },
    },
  },
};

export const InvisibleGroupNode: Story = {
  play: async (context) => {
    const { error } = await run(context);

    expect(error).toMatchObject({
      name: "Task Crashed",
      message: "Invisible group nodes are unsupported",
    });
  },
  args: {
    payload: {
      fileKey: "5d0u9PmD4GtB5fdX57pTtK",
      nodesId: ["134:14"],
      settings: {
        framework: "react",
        styling: "plain_css",
      },
    },
  },
};

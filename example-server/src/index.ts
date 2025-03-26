import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  type GetCodeParams,
  createCodegenResponseEventStream,
} from "@animaapp/anima-sdk";
import getAnima from "./getAnima.js";

type RouteGetCodeParams = GetCodeParams & {
  animaAccessToken?: string;
  teamId?: string;
};

const app = new Hono();

app.use("*", cors());

app.post("/", async (c) => {
  try {
    const params = (await c.req.json()) as RouteGetCodeParams;

    const anima = getAnima({
      token: params.animaAccessToken,
      teamId: params.teamId,
    });

    const response = await createCodegenResponseEventStream(anima, {
      figmaToken: process.env.FIGMA_TOKEN,
      ...params,
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
  }

  return new Response("Internal server error", { status: 500 });
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

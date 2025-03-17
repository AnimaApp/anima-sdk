import { Anima } from "@animaapp/anima-sdk";
import { config } from "dotenv";

config();

const anima = new Anima({
  apiBaseAddress: process.env.ANIMA_PUBLIC_URL,
  auth: {
    token: process.env.ANIMA_ACCESS_TOKEN as string,
    teamId: process.env.ANIMA_TEAM_ID as string,
  },
});

export default anima;

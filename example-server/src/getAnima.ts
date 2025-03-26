import { Anima } from "@animaapp/anima-sdk";
import { config } from "dotenv";

config();

const getAnima = ({
  apiBaseAddress = process.env.ANIMA_PUBLIC_URL,
  token = process.env.ANIMA_ACCESS_TOKEN!,
  teamId = process.env.ANIMA_TEAM_ID!,
} = {}) => {
  const anima = new Anima({
    apiBaseAddress,
    auth: {
      token,
      teamId,
    },
  });

  return anima;
};

export default getAnima;

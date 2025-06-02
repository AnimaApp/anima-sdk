import { Anima } from "@animaapp/anima-sdk";
import { config } from "dotenv";

config();

const getAnima = ({
  apiBaseAddress = process.env.ANIMA_PUBLIC_URL,
  token = process.env.ANIMA_ACCESS_TOKEN!,
} = {}) => {
  const anima = new Anima({
    apiBaseAddress,
    auth: {
      token,
    },
  });

  return anima;
};

export default getAnima;

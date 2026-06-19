import type { NextApiRequest, NextApiResponse } from "next";
import app from "@workspace/api-server";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}

import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "120mb" }));
app.use(express.urlencoded({ extended: true, limit: "120mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);
app.use("/api", router);
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body is too large. Videos should upload through Supabase Storage, not through the course JSON payload." });
    return;
  }
  next(err);
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const dbError = err?.cause ?? err;
  logger.error({ err, dbCode: dbError?.code, dbDetail: dbError?.detail, dbConstraint: dbError?.constraint_name }, "Unhandled request error");
  const message = [dbError?.message || err?.message, dbError?.detail].filter(Boolean).join(" — ");
  res.status(500).json({ error: message || "Internal server error" });
});

export default app;

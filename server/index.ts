import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { startCronJobs } from "./cron.js";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);

// Logger para endpoints API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch { }
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Basic error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint (always available)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV, vercel: process.env.VERCEL });
});

// Debug endpoint to inspect filesystem in production
app.get('/api/debug-fs', (req, res) => {
  try {
    const root = process.cwd();
    const getDirInfo = (dir: string, depth = 0): any => {
      if (depth > 2) return { name: dir, info: "depth limit" };
      const items = fs.readdirSync(dir);
      return items.map(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        return {
          name: item,
          path: fullPath,
          isDir: stats.isDirectory(),
          children: stats.isDirectory() && !item.startsWith('.') ? getDirInfo(fullPath, depth + 1) : undefined
        };
      });
    };
    res.json({
      cwd: root,
      dirname: import.meta.dirname,
      structure: getDirInfo(root)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

let initializationPromise: Promise<void> | null = null;

async function initializeApp() {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      log("starting server initialization...");
      const server = await registerRoutes(app);
      // Start background jobs
      startCronJobs();

      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        log("production mode: serving static files");
        serveStatic(app);
      }

      if (process.env.VERCEL !== "1") {
        const PORT = Number(process.env.PORT) || 5000;
        const HOST = "0.0.0.0";
        server.listen(PORT, HOST, () => {
          log(`serving on port ${PORT}`);
        });
      } else {
        log("vercel environment detected: listen() disabled");
      }
      log("initialization sequence finished");
    } catch (err) {
      log(`CRITICAL ERROR during initialization: ${err}`);
      console.error("FATAL ERROR DURING SERVER STARTUP:", err);
      if (!process.env.DATABASE_URL) {
        console.error("MISSING DATABASE_URL environment variable.");
      }
      throw err;
    }
  })();

  return initializationPromise;
}

// Global middleware to ensure the app is ready before processing requests
app.use(async (req, res, next) => {
  // if (req.path.startsWith('/api/')) return next(); // REMOVED to ensure init


  try {
    await initializeApp();
    next();
  } catch (err) {
    res.status(500).send(`Server initialization failed: ${err}`);
  }
});

// For Vercel, we export the app and trigger initialization
if (process.env.VERCEL === "1") {
  initializeApp().catch(err => {
    console.error("Vercel background init failed:", err);
  });
} else {
  // Not on Vercel: run the init logic (which will call listen())
  initializeApp();
}

// Export for serverless
export default app;

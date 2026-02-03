import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { default: viteConfig } = await import("../vite.config.js");
  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(import.meta.dirname, "..", "public"),
    // Vercel/Serverless adaptations
    path.resolve(process.cwd(), ".next/server/pages"), // just in case
    path.resolve(process.cwd(), "..", "dist", "public"),
  ];

  let distPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      log(`Found static directory: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    log(`ERROR: No static directory found. Deployment might be broken.`);
    log(`Current working directory: ${process.cwd()}`);
    log(`Import.meta.dirname: ${import.meta.dirname}`);
    // Attempt to create a fallback or just return to avoid crash, but serving will fail
  } else {
    log(`serving static files from: ${distPath}`);
    app.use(express.static(distPath, {
      index: false,
      maxAge: '1d',
      immutable: true,
      fallthrough: true
    }));
  }

  // SPA fallback handler
  app.use("*", (req, res, next) => {
    // 1. Skip API routes obviously
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // 2. Prevent serving index.html for missing static assets (images, js, css)
    // This fixes the "MIME type text/html" error for missing scripts
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
      res.status(404).json({ message: "Not found", path: req.path });
      return;
    }

    // 3. Serve index.html for all other routes (SPA)
    const indexPath = distPath ? path.resolve(distPath, "index.html") : null;

    if (indexPath && fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application not found (index.html missing)");
    }
  });
}

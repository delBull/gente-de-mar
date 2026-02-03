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
    // Vercel output sometimes places things in unusual places
    path.resolve(process.cwd(), "..", "dist", "public"),
    path.resolve(process.cwd(), "..", "public"),
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
    return;
  }

  log(`serving static files from: ${distPath}`);
  app.use(express.static(distPath, {
    index: false, // Handle index manually with the catch-all
    maxAge: '1d',
    immutable: true
  }));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (req, res, next) => {
    // Skip API and files with extensions
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return next();
    }

    const indexPath = path.resolve(distPath, "index.html");

    // Si es una ruta de API o parece un archivo estático (tiene extensión), devolvemos 404
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      res.status(404).send("Not Found");
      return;
    }

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });
}

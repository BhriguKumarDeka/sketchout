import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

/**
 * Vite plugin that automatically spawns the Express backend server on port 5000
 * if it is not already running, preventing ECONNREFUSED proxy errors.
 */
function autoBackendPlugin(): Plugin {
  let backendProc: ChildProcess | null = null;

  return {
    name: 'auto-backend-plugin',
    configureServer(server) {
      // Check if server is already responding on port 5000
      const checkReq = http.get('http://127.0.0.1:5000/api/health', (res) => {
        if (res.statusCode === 200) {
          console.log('\x1b[32m[SketchOut]\x1b[0m Backend server already active on http://localhost:5000');
        }
      });

      checkReq.on('error', () => {
        console.log('\x1b[33m[SketchOut]\x1b[0m Backend not detected on port 5000. Auto-spawning Express server...');
        const serverDir = path.resolve(__dirname, '../server');

        backendProc = spawn('npm', ['run', 'dev'], {
          cwd: serverDir,
          shell: true,
          stdio: 'inherit',
        });

        backendProc.on('error', (err) => {
          console.warn('\x1b[31m[SketchOut]\x1b[0m Could not auto-start backend process:', err.message);
        });
      });

      server.httpServer?.on('close', () => {
        if (backendProc) {
          try {
            backendProc.kill();
          } catch {}
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), autoBackendPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            // Clean graceful response instead of crashing Vite terminal with AggregateError
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  error: 'Backend is booting or offline. Operating in resilient local mode.',
                  isOffline: true,
                })
              );
            }
          });
        },
      },
    },
  },
});

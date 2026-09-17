import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal logs
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

console.log(`${BOLD}${CYAN}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}  SatQuery Full-Stack AI Launcher (Node.js Runner)  ${RESET}`);
console.log(`${BOLD}${CYAN}====================================================${RESET}`);

const isWindows = process.platform === 'win32';

// ── Locate the Python executable ─────────────────────────────────────────────
// Priority: uv (if installed) → .venv Python → system Python
const uvPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.local', 'bin', isWindows ? 'uv.exe' : 'uv');
const hasUv  = fs.existsSync(uvPath);

const venvPython = isWindows
  ? path.join(__dirname, '.venv', 'Scripts', 'python.exe')
  : path.join(__dirname, '.venv', 'bin', 'python');
const hasVenv = fs.existsSync(venvPython);

// BACKEND PORT — must match .env PORT= value
const BACKEND_PORT = process.env.PORT || '8000';

// ── Build the exact spawn command (NO shell:true — fixes DEP0190) ─────────────
// DEP0190 root cause: passing an args array with shell:true causes Node to
// concatenate them into a shell string, which is a security risk and triggers
// the deprecation. Fix: always pass cmd + args array with shell:false.
let spawnCmd, spawnArgs;

if (hasUv) {
  console.log(`${CYAN}[BACKEND]${RESET} Spawning FastAPI via uv (.venv)`);
  spawnCmd  = uvPath;
  // args as array — no shell injection risk
  spawnArgs = ['run', '--python', '.venv', 'python', '-m', 'uvicorn',
               'backend.main:app', '--host', '127.0.0.1', '--port', BACKEND_PORT];
} else {
  const pythonCmd = hasVenv ? venvPython : (isWindows ? 'python' : 'python3');
  console.log(`${CYAN}[BACKEND]${RESET} Using Python: ${pythonCmd}`);
  spawnCmd  = pythonCmd;
  spawnArgs = ['-m', 'uvicorn', 'backend.main:app',
               '--host', '127.0.0.1', '--port', BACKEND_PORT];
}

// ── Pre-flight: free the backend port if occupied ────────────────────────────
try {
  if (isWindows) {
    execSync(
      `powershell -Command "Get-NetTCPConnection -LocalPort ${BACKEND_PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
      { stdio: 'ignore' }
    );
  } else {
    execSync(`lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  }
} catch (_) { /* no-op */ }

// ── 1. Start Python FastAPI Backend ──────────────────────────────────────────
// FIX (DEP0190): shell MUST be false when args are passed as an array.
// On Windows, uv.exe and python.exe are direct executables — no shell needed.
const backend = spawn(spawnCmd, spawnArgs, {
  cwd: __dirname,
  shell: false,            // ← was: shell: isWindows  (caused DEP0190)
  env: {
    ...process.env,
    PYTHONUNBUFFERED: '1',
    // Forward .env values so uvicorn picks them up without python-dotenv
    PORT:             BACKEND_PORT,
  },
});

backend.stdout?.on('data', (data) => {
  data.toString().trimEnd().split('\n')
    .forEach(line => console.log(`${CYAN}[BACKEND]${RESET} ${line}`));
});

backend.stderr?.on('data', (data) => {
  data.toString().trimEnd().split('\n')
    .forEach(line => console.error(`${RED}[BACKEND ERR]${RESET} ${line}`));
});

backend.on('error', (err) => {
  console.error(`${RED}[BACKEND] Failed to start: ${err.message}${RESET}`);
  if (err.code === 'ENOENT') {
    console.error(`${RED}[BACKEND] Command not found: "${spawnCmd}". Is .venv created?${RESET}`);
  }
});

backend.on('close', (code) => {
  if (code !== null && code !== 0) {
    console.log(`${RED}[BACKEND] Exited with code ${code}${RESET}`);
  }
});

// ── 2. Start Vite Frontend ────────────────────────────────────────────────────
// Use the platform-specific npx binary directly (no shell needed).
// Port is pinned in vite.config.js — no port drift.
const npxCmd = isWindows
  ? path.join(__dirname, 'node_modules', '.bin', 'vite.cmd')
  : path.join(__dirname, 'node_modules', '.bin', 'vite');

// Fallback to global npx if local binary doesn't exist
const frontendCmd  = fs.existsSync(npxCmd) ? npxCmd : (isWindows ? 'npx.cmd' : 'npx');
const frontendArgs = fs.existsSync(npxCmd) ? [] : ['vite'];

const frontend = spawn(frontendCmd, frontendArgs, {
  cwd: __dirname,
  shell: false,           // ← no shell:true needed here either
});

frontend.stdout?.on('data', (data) => {
  data.toString().trimEnd().split('\n')
    .forEach(line => console.log(`${GREEN}[FRONTEND]${RESET} ${line}`));
});

frontend.stderr?.on('data', (data) => {
  data.toString().trimEnd().split('\n')
    .forEach(line => console.error(`${RED}[FRONTEND ERR]${RESET} ${line}`));
});

frontend.on('error', (err) => {
  console.error(`${RED}[FRONTEND] Failed to start Vite: ${err.message}${RESET}`);
});

// ── Clean shutdown ────────────────────────────────────────────────────────────
function cleanup() {
  console.log(`\n${BOLD}Shutting down SatQuery processes...${RESET}`);
  try {
    if (isWindows) {
      if (backend.pid)  spawn('taskkill', ['/pid', backend.pid.toString(),  '/f', '/t'], { shell: false });
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t'], { shell: false });
    } else {
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
    }
  } catch (_) { /* no-op */ }
  process.exit(0);
}

process.on('SIGINT',  cleanup);
process.on('SIGTERM', cleanup);

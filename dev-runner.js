import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal logs
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}${CYAN}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}  SatQuery Full-Stack AI Launcher (Node.js Runner)  ${RESET}`);
console.log(`${BOLD}${CYAN}====================================================${RESET}`);

// Locate Python executable or uv runner
const isWindows = process.platform === 'win32';
const uvPath = path.join(process.env.USERPROFILE || '', '.local', 'bin', 'uv.exe');
const hasUv = isWindows && fs.existsSync(uvPath);

const venvPythonWin = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
const venvPythonUnix = path.join(__dirname, '.venv', 'bin', 'python');

let spawnCmd, spawnArgs;
if (hasUv) {
  console.log(`${CYAN}[BACKEND]${RESET} Spawning FastAPI via uv runner (.venv)`);
  spawnCmd = uvPath;
  spawnArgs = ['run', '--python', '.venv', 'python', '-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8080'];
} else {
  let pythonCmd = 'python';
  if (isWindows && fs.existsSync(venvPythonWin)) {
    pythonCmd = venvPythonWin;
  } else if (!isWindows && fs.existsSync(venvPythonUnix)) {
    pythonCmd = venvPythonUnix;
  }
  console.log(`${CYAN}[BACKEND]${RESET} Using Python: ${pythonCmd}`);
  spawnCmd = pythonCmd;
  spawnArgs = ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8080'];
}

// 1. Start Python FastAPI Backend
const backend = spawn(spawnCmd, spawnArgs, {
  cwd: __dirname,
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
  shell: isWindows,
});

backend.stdout?.on('data', (data) => {
  const lines = data.toString().trimEnd().split('\n');
  lines.forEach(line => console.log(`${CYAN}[BACKEND]${RESET} ${line}`));
});

backend.stderr?.on('data', (data) => {
  const lines = data.toString().trimEnd().split('\n');
  lines.forEach(line => console.error(`${RED}[BACKEND ERR]${RESET} ${line}`));
});

backend.on('error', (err) => {
  console.error(`${RED}[BACKEND] Failed to start Python server: ${err.message}${RESET}`);
});

backend.on('close', (code) => {
  if (code !== null && code !== 0) {
    console.log(`${RED}[BACKEND] Exited with code ${code}${RESET}`);
  }
});

// 2. Start Vite Frontend
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const frontend = spawn(npxCmd, ['vite'], {
  cwd: __dirname,
  shell: isWindows,
});

frontend.stdout?.on('data', (data) => {
  const lines = data.toString().trimEnd().split('\n');
  lines.forEach(line => console.log(`${GREEN}[FRONTEND]${RESET} ${line}`));
});

frontend.stderr?.on('data', (data) => {
  const lines = data.toString().trimEnd().split('\n');
  lines.forEach(line => console.error(`${RED}[FRONTEND ERR]${RESET} ${line}`));
});

frontend.on('error', (err) => {
  console.error(`${RED}[FRONTEND] Failed to start Vite dev server: ${err.message}${RESET}`);
});

// Clean shutdown on Windows Ctrl+C
function cleanup() {
  console.log(`\n${BOLD}Shutting down SatQuery processes...${RESET}`);
  try {
    if (isWindows) {
      if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
    } else {
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
    }
  } catch (e) {
    // Ignore shutdown errors
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

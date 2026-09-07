import { execFile, spawn } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const uploadDirectory = await mkdtemp(join(tmpdir(), "avyaan-pages-upload-"));
const wrangler = join(projectRoot, "node_modules", ".bin", "wrangler");
const execFileAsync = promisify(execFile);

async function gitMetadataArguments() {
  try {
    const [{ stdout: hash }, { stdout: message }, { stdout: status }] = await Promise.all([
      execFileAsync("git", ["rev-parse", "HEAD"], { cwd: projectRoot }),
      execFileAsync("git", ["log", "-1", "--pretty=%s"], { cwd: projectRoot }),
      execFileAsync("git", ["status", "--porcelain"], { cwd: projectRoot }),
    ]);

    return [
      `--commit-hash=${hash.trim()}`,
      `--commit-message=${message.trim()}`,
      `--commit-dirty=${status.trim() ? "true" : "false"}`,
    ];
  } catch {
    return [];
  }
}

try {
  await cp(join(projectRoot, "dist", "client"), uploadDirectory, { recursive: true });
  const gitArguments = await gitMetadataArguments();

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      wrangler,
      [
        "--cwd",
        uploadDirectory,
        "pages",
        "deploy",
        ".",
        "--project-name=avyaans-little-world",
        "--branch=main",
        ...gitArguments,
      ],
      {
        cwd: uploadDirectory,
        env: {
          ...process.env,
          WRANGLER_LOG_PATH: join(projectRoot, ".wrangler", "wrangler.log"),
          WRANGLER_WRITE_LOGS: "false",
        },
        stdio: "inherit",
      },
    );

    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) process.exitCode = exitCode;
} finally {
  await rm(uploadDirectory, { force: true, recursive: true });
}

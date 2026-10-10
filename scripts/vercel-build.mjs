import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function runNpm(args) {
  const result = spawnSync(npm, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const demoMode = process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL;

if (process.env.VERCEL_ENV === "production" && !demoMode) {
  runNpm(["run", "db:migrate:deploy"]);
}

runNpm(["run", "build"]);

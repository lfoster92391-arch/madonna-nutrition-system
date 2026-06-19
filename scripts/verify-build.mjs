import { execSync } from "node:child_process"

function run(label, cmd) {
  console.log(`\n▶ ${label}`)
  execSync(cmd, { stdio: "inherit" })
}

run("encoding scan", "node scripts/scan-encoding.mjs")
run("typecheck", "npx tsc --noEmit")
console.log("\n✓ verify-build passed")

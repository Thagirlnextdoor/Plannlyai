// Generates the Android TWA project from twa-manifest.json without any interactive
// prompts (bubblewrap's inquirer UI crashes when stdin has no TTY, which is the case
// when driven from a script). Mirrors `bubblewrap init` + `bubblewrap update`.
const path = require("path");

const CLI_ROOT = "C:/Users/USER/AppData/Roaming/npm/node_modules/@bubblewrap/cli";
const shared = require(path.join(CLI_ROOT, "dist/lib/cmds/shared.js"));
const { TwaManifest } = require(path.join(CLI_ROOT, "node_modules/@bubblewrap/core/dist/index.js"));

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "twa-manifest.json");
const TARGET = path.join(ROOT, "android", "twa");

// Never called by updateProject when skipVersionUpgrade=true and the icon URL is valid,
// but it must exist to satisfy the Prompt interface.
const prompt = {
  printMessage: (msg) => console.log(msg),
  promptConfirm: async (msg) => {
    throw new Error("Unexpected interactive prompt: " + msg);
  },
  promptInput: async (msg) => {
    throw new Error("Unexpected interactive prompt: " + msg);
  },
  promptPassword: async (msg) => {
    throw new Error("Unexpected interactive prompt: " + msg);
  },
};

(async () => {
  const twaManifest = await TwaManifest.fromFile(MANIFEST);
  const validationError = twaManifest.validate();
  if (validationError) {
    console.error("twa-manifest.json is invalid: " + validationError);
    process.exit(1);
  }

  const ok = await shared.updateProject(true, null, prompt, TARGET, MANIFEST);
  if (!ok) {
    console.error("TWA project generation failed");
    process.exit(1);
  }

  console.log("Project generated at: " + TARGET);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

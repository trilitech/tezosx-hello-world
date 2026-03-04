/**
 * Compile MessageStore.sol using solc (npm package).
 * Outputs ABI and bytecode to contracts/MessageStore.json
 *
 * Usage: npx tsx scripts/compile.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import solc from "solc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractPath = resolve(__dirname, "../contracts/MessageStore.sol");
const source = readFileSync(contractPath, "utf-8");

const input = {
  language: "Solidity",
  sources: {
    "MessageStore.sol": { content: source },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors?.some((e: any) => e.severity === "error")) {
  console.error("Compilation errors:");
  output.errors.forEach((e: any) => console.error(e.formattedMessage));
  process.exit(1);
}

const contract = output.contracts["MessageStore.sol"]["MessageStore"];
const artifact = {
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object,
};

const outPath = resolve(__dirname, "../contracts/MessageStore.json");
writeFileSync(outPath, JSON.stringify(artifact, null, 2));
console.log("Compiled successfully →", outPath);

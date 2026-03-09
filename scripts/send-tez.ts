/**
 * Send tez from a bootstrap account to a destination address.
 *
 * Usage: npx tsx scripts/send-tez.ts <destination> [amount_in_tez]
 */
import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";
import bs58check from "bs58check";
import nacl from "tweetnacl";

const PREFIX = process.env.TXPARK_PREFIX ?? "demo";
const TEZOS_RPC = `https://${PREFIX}.txpark.nomadic-labs.com/rpc/tezlink`;
const BOOTSTRAP1_SEED = "edsk3gUfUPyBSfrS9CCgmCIQsTCHGkviBDusMxDJstFtojtc1uo2KK7";

// edsk2 prefix (seed): [0x0d, 0x0f, 0x3a, 0x07] (4 bytes)
// edsk prefix (full):  [0x2b, 0xf6, 0x4e, 0x07] (4 bytes)
const EDSK2_PREFIX = Buffer.from([0x0d, 0x0f, 0x3a, 0x07]);
const EDSK_PREFIX = Buffer.from([0x2b, 0xf6, 0x4e, 0x07]);

function seedToFullSecretKey(seedB58: string): string {
  const decoded = bs58check.decode(seedB58);
  const seed = decoded.subarray(EDSK2_PREFIX.length); // strip prefix
  const keypair = nacl.sign.keyPair.fromSeed(seed);
  const fullKey = Buffer.concat([EDSK_PREFIX, Buffer.from(keypair.secretKey)]);
  return bs58check.encode(fullKey);
}

async function main() {
  const dest = process.argv[2];
  const amount = Number(process.argv[3] || 1000);

  if (!dest) {
    console.error("Usage: npx tsx scripts/send-tez.ts <destination> [amount]");
    process.exit(1);
  }

  const fullSk = seedToFullSecretKey(BOOTSTRAP1_SEED);
  const Tezos = new TezosToolkit(TEZOS_RPC);
  const signer = await InMemorySigner.fromSecretKey(fullSk);
  Tezos.setProvider({ signer });

  const from = await signer.publicKeyHash();
  console.log(`Sending ${amount} tez from ${from} to ${dest}...`);

  const op = await Tezos.contract.transfer({ to: dest, amount });
  console.log("Op hash:", op.hash);
  await op.confirmation(1);
  console.log("Confirmed!");

  const balance = await Tezos.tz.getBalance(dest);
  console.log("Destination balance:", balance.toNumber() / 1e6, "tez");
}

main().catch((e) => console.error("Error:", e.message));

import { AbiCoder } from "ethers";
import { Tezos } from "./wallet";
import { CRAC_GATEWAY, MESSAGE_STORE_ADDRESS } from "./config";

/**
 * Send a message to the EVM MessageStore contract via CRAC.
 *
 * Calls the `call` entrypoint on the CRAC gateway (KT1):
 *   pair string (pair string bytes)
 *   = (evm_destination, (method_signature, abi_encoded_params))
 *
 * @param useRawTransfer - When true, builds the Michelson parameter manually
 *   (required when the enshrined gateway doesn't expose its script via RPC).
 *   When false, uses Taquito's contract abstraction.
 */
export async function sendMessageViaCrac(message: string, useRawTransfer = false) {
  if (!MESSAGE_STORE_ADDRESS) {
    throw new Error(
      "MESSAGE_STORE_ADDRESS not set. Deploy the EVM contract first and set VITE_MESSAGE_STORE_ADDRESS."
    );
  }

  const abiCoder = AbiCoder.defaultAbiCoder();
  const abiParams = abiCoder.encode(["string"], [message]);
  // Remove 0x prefix for Michelson bytes
  const abiParamsHex = abiParams.slice(2);

  let op;

  if (useRawTransfer) {
    // Raw transfer: build the Michelson parameter by hand.
    // Required because the enshrined gateway contract has no script
    // exposed via the standard Tezos RPC (returns 404 on /entrypoints).
    op = await Tezos.wallet
      .transfer({
        to: CRAC_GATEWAY,
        amount: 0,
        parameter: {
          entrypoint: "call",
          value: {
            prim: "Pair",
            args: [
              { string: MESSAGE_STORE_ADDRESS },
              {
                prim: "Pair",
                args: [
                  { string: "store(string)" },
                  { bytes: abiParamsHex },
                ],
              },
            ],
          },
        },
      })
      .send();
  } else {
    // Taquito contract abstraction: works if the gateway exposes its
    // script via the Tezos RPC (future testnet versions may support this).
    const contract = await Tezos.wallet.at(CRAC_GATEWAY);
    op = await contract.methodsObject
      .call({
        0: MESSAGE_STORE_ADDRESS,
        1: "store(string)",
        2: abiParamsHex,
      })
      .send();
  }

  await op.confirmation(1);
  return op.opHash;
}

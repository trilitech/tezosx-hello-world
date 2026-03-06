import { AbiCoder, keccak256, toUtf8Bytes } from "ethers";
import { EVM_RPC_URL, MESSAGE_STORE_ADDRESS } from "./config";

/**
 * Read the stored message from the EVM MessageStore contract via eth_call.
 */
export async function readMessage(): Promise<string> {
  if (!MESSAGE_STORE_ADDRESS) {
    throw new Error("MESSAGE_STORE_ADDRESS not set.");
  }

  // read() selector = first 4 bytes of keccak256("read()")
  const selector = keccak256(toUtf8Bytes("read()")).slice(0, 10);

  const response = await fetch(EVM_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: MESSAGE_STORE_ADDRESS, data: selector }, "latest"],
      id: 1,
    }),
  });

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message);
  }

  if (!json.result || json.result === "0x") {
    return "(empty)";
  }

  const decoded = AbiCoder.defaultAbiCoder().decode(["string"], json.result);
  return decoded[0];
}

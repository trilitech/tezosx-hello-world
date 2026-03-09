const PREFIX = import.meta.env.VITE_TXPARK_PREFIX ?? "demo";
const BASE_URL = `https://${PREFIX}.txpark.nomadic-labs.com`;

// EVM JSON-RPC (for eth_call, deploy, etc.)
export const EVM_RPC_URL = `${BASE_URL}/rpc`;

// Tezos RPC (for Taquito / wallet connection)
export const TEZOS_RPC_URL = `${BASE_URL}/rpc/tezlink`;

// CRAC Gateway contract on Michelson side
export const CRAC_GATEWAY = "KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw";

// EVM contract address — set after deploying MessageStore
export const MESSAGE_STORE_ADDRESS = import.meta.env.VITE_MESSAGE_STORE_ADDRESS ?? "";

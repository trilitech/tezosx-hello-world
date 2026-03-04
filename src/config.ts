// EVM JSON-RPC (for eth_call, deploy, etc.)
export const EVM_RPC_URL = "https://demo.txpark.nomadic-labs.com/rpc";

// Tezos RPC (for Taquito / wallet connection)
export const TEZOS_RPC_URL = "https://demo.txpark.nomadic-labs.com/rpc/tezlink";

// CRAC Gateway contract on Michelson side
export const CRAC_GATEWAY = "KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw";

// EVM contract address — set after deploying MessageStore
export const MESSAGE_STORE_ADDRESS = import.meta.env.VITE_MESSAGE_STORE_ADDRESS ?? "";

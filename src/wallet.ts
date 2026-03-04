import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { TEZOS_RPC_URL } from "./config";

export const Tezos = new TezosToolkit(TEZOS_RPC_URL);

let wallet: BeaconWallet | null = null;

export async function connectWallet(): Promise<string> {
  wallet = new BeaconWallet({
    name: "CRAC Demo",
    network: { type: "custom" as any, rpcUrl: TEZOS_RPC_URL },
  });
  await wallet.requestPermissions();
  Tezos.setWalletProvider(wallet);
  return wallet.getPKH();
}

export async function disconnectWallet(): Promise<void> {
  if (wallet) {
    await wallet.clearActiveAccount();
    wallet = null;
  }
}

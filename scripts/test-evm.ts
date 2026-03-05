import { JsonRpcProvider, Wallet, Contract } from "ethers";

const provider = new JsonRpcProvider("https://demo.txpark.nomadic-labs.com/rpc");
const wallet = new Wallet("0x9722f6cc9ff938e63f8ccb74c3daa6b45837e5c5e3835ac08c44c50ab5f39dc0", provider);
const contract = new Contract("0xd77420F73B4612a7A99DBA8c2AFd30a1886b0344", [
  "function store(string memory _msg) public",
  "function message() public view returns (string)",
], wallet);

async function main() {
  console.log("Calling store('direct-evm-test')...");
  const tx = await contract.store("direct-evm-test");
  console.log("TX hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Status:", receipt?.status);

  const msg = await contract.message();
  console.log("Stored message:", msg);
}

main().catch((e) => console.error("Error:", e.message));

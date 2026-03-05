# CRAC Demo

Demo app for the CRAC (Cross-Runtime Atomic Calls) feature of Tezos X:
send a message from a Michelson wallet to an EVM smart contract via the CRAC gateway, then read it back.

## Known issue: CRAC calls break block decoding

Successful CRAC calls currently break the EVM node's block decoding.
See [L2-958](https://linear.app/tezos/issue/L2-958/internal-operations-to-the-michelson-runtimes-gateway-break-block) for details.

A reproduction script is provided — see [Reproducing the bug](#reproducing-the-bug-l2-958) below.

## Testnet

| | |
|---|---|
| EVM RPC | `https://demo.txpark.nomadic-labs.com/rpc` |
| Tezos RPC | `https://demo.txpark.nomadic-labs.com/rpc/tezlink` |
| Blockscout | `https://demo.txpark.nomadic-labs.com/` |
| CRAC Gateway (Michelson) | `KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw` |
| CRAC Gateway (EVM precompile) | `0xff00000000000000000000000000000000000007` |
| ERC-20 Wrapper | `KT18oDJJKXMKhfE1bSuAPGp92pYcwVKvCChb` |

## Bootstrap accounts

The testnet provides pre-funded accounts (no faucet). Documented in the
[TezosX Onboarding Guide](https://linear.app/tezos/document/tezosx-onboarding-guide-da27b417c992).

### EVM

| Address | Private key |
|---|---|
| `0x6ce4d79d4E77402e1ef3417Fdda433aA744C6e1c` | `0x9722f6cc9ff938e63f8ccb74c3daa6b45837e5c5e3835ac08c44c50ab5f39dc0` |
| `0xB53dc01974176E5dFf2298C5a94343c2585E3c54` | `0x3a6a6ca30c1ef1ce605a63a7a1a4ff4c689f8414ca0838bca29423f0ec280ff5` |
| `0x9b49c988b5817Be31DfB00F7a5a4671772dCce2B` | `0x0eb9bfa77d6cd145cdc0e3d6f902ee1464aeb5f62b02e38f111c9b60cd3adab5` |

### Tezos (Michelson)

| Account | Public key | Private key (seed) |
|---|---|---|
| bootstrap1 | `edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Wd9sDVC9yav` | `edsk3gUfUPyBSfrS9CCgmCiQsTCHGkviBDusMxDJstFtojtc1zcpsh` |
| bootstrap2 | `edpktzNbDAUjUk697W7gYg2CRuBQjyPxbEg8dLccYYwKSKvkPvjtV9` | |
| bootstrap3 | `edpkuTXkJDGcFd5nh6VvMz8phXxU3Bi7h6hqgywNFi1vZTfQNnS1RV` | |
| bootstrap4 | `edpkuFrRoDSEbJYgxRtLx2ps82UdaYc1WwfS9sE11yhauZt5DgCHbU` | |
| bootstrap5 | `edpkv8EUUH68jmo3f7Um5PezmfGrRF24gnfLpH3sVNwJnV5bVCxL2n` | |

**Note:** The commonly cited bootstrap1 key `edsk3gUfUPyBSfrS9CCgmCIQsTCHGkviBDusMxDJstFtojtc1uo2KK7` contains an uppercase `I` which is invalid in base58. The correct key has a lowercase `i` (`CiQ`) and a different suffix (`zcpsh`).

## Demo app workflow

### 1. Install

```bash
npm install
```

### 2. Compile the EVM contract

```bash
npm run compile
```

Compiles `contracts/MessageStore.sol` with solc and outputs `contracts/MessageStore.json`.

### 3. Deploy the EVM contract

```bash
npm run deploy -- <EVM_PRIVATE_KEY>
```

Example with a bootstrap account:
```bash
npm run deploy -- 0x9722f6cc9ff938e63f8ccb74c3daa6b45837e5c5e3835ac08c44c50ab5f39dc0
```

### 4. Configure

Create a `.env` file:
```
VITE_MESSAGE_STORE_ADDRESS=0x...deployed_address...
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:5174.

### 6. Usage

1. **Connect wallet** — Click "Connect Michelson Wallet", approve in Temple
2. **Send message** — Type a message, click "Send" (calls the CRAC Gateway which routes to the EVM contract)
3. **Read message** — Click "Read" to fetch the stored message via `eth_call`

**Note:** Due to the bug described above, sending a message will currently fail with a deserialization error even though the CRAC call itself succeeds at the kernel level.

## Reproducing the bug (L2-958)

The script `scripts/reproduce-crac-bug.sh` demonstrates that successful CRAC calls break the EVM node's block decoding, while reverted calls work fine.

### Prerequisites

You need an `octez-client` built from the [tezos repo](https://gitlab.com/tezos/tezos). Standard releases don't know the testnet protocol (`PtSeouLo...`).

```bash
cd ~/git/tezos
eval $(opam env)
make octez-client
```

### Run

```bash
# Default: looks for octez-client at ~/git/tezos/octez-client
./scripts/reproduce-crac-bug.sh

# Or specify the path:
OCTEZ_CLIENT=/path/to/octez-client ./scripts/reproduce-crac-bug.sh
```

### What the script does

It sends 3 CRAC calls via `octez-client` to the gateway `KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw`:

**Test 1 — Default entrypoint (transfer 1 tez to an EVM address)**
```bash
octez-client transfer 1 from bootstrap1 to KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw \
  --arg '"0x6ce4d79d4E77402e1ef3417Fdda433aA744C6e1c"' --burn-cap 1
```
Result: operation is included in a block, but `"Not enough data"` deserialization error.

**Test 2 — Call entrypoint (store a string on a payable EVM contract)**
```bash
octez-client transfer 0 from bootstrap1 to KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw \
  --entrypoint call \
  --arg 'Pair "0x3af5..." (Pair "store(string)" 0x<abi_encoded_hello>)' --burn-cap 1
```
Result: same `"Not enough data"` deserialization error.

**Test 3 — Control: call with amount to a non-payable contract (reverts)**
```bash
octez-client transfer 1 from bootstrap1 to KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw \
  --entrypoint call \
  --arg 'Pair "0xd774..." (Pair "store(string)" 0x<abi_encoded_hello>)' --burn-cap 1
```
Result: receipt decoded correctly, shows `"Cross-runtime call reverted"`.

### Expected output

```
Test 1 & 2: "evm_node.dev.tezlink.deserialize_operation" / "Not enough data"
Test 3:     "Cross-runtime call reverted" (receipt decoded OK)
```

### Root cause

Successful CRAC calls produce an **internal operation** in the receipt. The result tag for this internal operation (`0x68`) is not handled by SeouLo's `operation_data_and_receipt_encoding`, causing `Data_encoding.Binary.of_bytes` to fail with `Not_enough_data`.

Reverted calls do not produce internal operations, so the receipt is simpler and decodes fine. This is why test 3 works but tests 1 and 2 don't.

See the [full analysis in L2-958](https://linear.app/tezos/issue/L2-958/internal-operations-to-the-michelson-runtimes-gateway-break-block).

## CRAC format reference

The gateway `%call` entrypoint expects `pair string (pair string bytes)`:
- `string`: EVM destination address (e.g. `"0x3af5..."`)
- `string`: method signature (e.g. `"store(string)"`)
- `bytes`: ABI-encoded parameters (without the 4-byte selector — the kernel computes it from the signature)

Source: [`enshrined_contracts.rs`](https://gitlab.com/tezos/tezos/-/blob/5cd6628b9e54acdd0738edddd31183746b2111da/etherlink/kernel_latest/tezos_execution/src/enshrined_contracts.rs)

## Architecture

See [ARCHITECTURE.md](../ARCHITECTURE.md) for technical design choices.

#!/usr/bin/env bash
#
# Reproduce: Internal operations to the Michelson runtime's gateway break block decoding
# Issue: https://linear.app/tezos/issue/L2-958
#
# This script sends a CRAC call from Michelson to EVM via the gateway contract.
# When the call succeeds, the resulting internal operation produces a receipt
# that SeouLo's operation_data_and_receipt_encoding cannot deserialize,
# causing the EVM node to report:
#   "evm_node.dev.tezlink.deserialize_operation" / "Not enough data"
#
# Prerequisites:
#   - octez-client built from the tezos repo (standard releases don't know the testnet protocol)
#   - Set OCTEZ_CLIENT env var to point to it, or it will look in ~/git/tezos/octez-client
#
# Usage:
#   ./scripts/reproduce-crac-bug.sh
#   OCTEZ_CLIENT=/path/to/octez-client ./scripts/reproduce-crac-bug.sh

set -euo pipefail

# --- Configuration ---
PREFIX="${TXPARK_PREFIX:-demo}"
TEZLINK_RPC="https://${PREFIX}.txpark.nomadic-labs.com/rpc/tezlink"
GATEWAY="KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw"
# bootstrap1 seed key (note: lowercase 'i' in CiQ, not uppercase 'I')
BOOTSTRAP_KEY="edsk3gUfUPyBSfrS9CCgmCiQsTCHGkviBDusMxDJstFtojtc1zcpsh"
# Any valid EVM address works as the CRAC destination
EVM_DESTINATION="0x6ce4d79d4E77402e1ef3417Fdda433aA744C6e1c"

# --- Find octez-client ---
OCTEZ="${OCTEZ_CLIENT:-${HOME}/git/tezos/octez-client}"
if [ ! -x "$OCTEZ" ]; then
    echo "ERROR: octez-client not found at $OCTEZ"
    echo "Build it from the tezos repo or set OCTEZ_CLIENT env var."
    exit 1
fi
echo "Using octez-client: $OCTEZ"

# --- Use a temporary directory for client state ---
CLIENT_DIR=$(mktemp -d)
trap 'rm -rf "$CLIENT_DIR"' EXIT
echo "Client dir: $CLIENT_DIR"

# --- Import bootstrap key ---
echo ""
echo "=== Step 1: Import bootstrap1 key ==="
$OCTEZ -d "$CLIENT_DIR" -E "$TEZLINK_RPC" \
    import secret key bootstrap1 "unencrypted:${BOOTSTRAP_KEY}" --force 2>&1

# --- Check balance ---
echo ""
echo "=== Step 2: Check bootstrap1 balance ==="
$OCTEZ -d "$CLIENT_DIR" -E "$TEZLINK_RPC" \
    get balance for bootstrap1 2>&1

# --- Test 1: Default entrypoint (simple transfer to EVM address) ---
echo ""
echo "========================================================="
echo "=== Test 1: Default entrypoint — transfer to EVM addr ==="
echo "========================================================="
echo "Sending: transfer 1 tez to gateway with default entrypoint"
echo "Arg: EVM address string \"$EVM_DESTINATION\""
echo ""
echo "Expected: operation is included but receipt deserialization fails"
echo "          with 'Not enough data' because the successful CRAC"
echo "          produces an internal operation whose result tag (0x68)"
echo "          is not handled by SeouLo's encoding."
echo ""
$OCTEZ -d "$CLIENT_DIR" -E "$TEZLINK_RPC" \
    transfer 1 from bootstrap1 to "$GATEWAY" \
    --arg "\"${EVM_DESTINATION}\"" \
    --burn-cap 1 2>&1 || true

# --- Test 2: Call entrypoint (call EVM contract method) ---
echo ""
echo "========================================================="
echo "=== Test 2: Call entrypoint — store(string) on EVM    ==="
echo "========================================================="
# ABI encoding of store(string) with argument "hello":
#   offset (0x20) + length (5) + "hello" padded to 32 bytes
ABI_PARAMS="00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005"
ABI_PARAMS+="68656c6c6f000000000000000000000000000000000000000000000000000000"
# Use a known deployed MessageStore contract (payable store)
EVM_CONTRACT="0x3af54710DC3bdc73922F3435876396372DDC18Fc"

echo "Sending: transfer 0 tez to gateway with 'call' entrypoint"
echo "Arg: Pair \"$EVM_CONTRACT\" (Pair \"store(string)\" 0x<abi>)"
echo ""
echo "Expected: same 'Not enough data' deserialization error."
echo ""
$OCTEZ -d "$CLIENT_DIR" -E "$TEZLINK_RPC" \
    transfer 0 from bootstrap1 to "$GATEWAY" \
    --entrypoint call \
    --arg "Pair \"${EVM_CONTRACT}\" (Pair \"store(string)\" 0x${ABI_PARAMS})" \
    --burn-cap 1 2>&1 || true

# --- Test 3 (control): Call that reverts — should decode fine ---
echo ""
echo "========================================================="
echo "=== Test 3 (control): Call with amount to non-payable ==="
echo "========================================================="
# Use the old non-payable contract address
EVM_CONTRACT_NONPAYABLE="0xd77420F73B4612a7A99DBA8c2AFd30a1886b0344"
echo "Sending: transfer 1 tez to gateway calling non-payable store()"
echo "Arg: Pair \"$EVM_CONTRACT_NONPAYABLE\" (Pair \"store(string)\" 0x<abi>)"
echo ""
echo "Expected: 'Cross-runtime call reverted' — receipt decodes fine"
echo "          because the reverted call does NOT produce an internal"
echo "          operation, so SeouLo can handle the receipt."
echo ""
$OCTEZ -d "$CLIENT_DIR" -E "$TEZLINK_RPC" \
    transfer 1 from bootstrap1 to "$GATEWAY" \
    --entrypoint call \
    --arg "Pair \"${EVM_CONTRACT_NONPAYABLE}\" (Pair \"store(string)\" 0x${ABI_PARAMS})" \
    --burn-cap 1 2>&1 || true

echo ""
echo "========================================================="
echo "=== Summary ==="
echo "========================================================="
echo "Test 1 & 2: Should show 'Not enough data' deserialization error"
echo "Test 3:     Should show 'Cross-runtime call reverted' (decoded OK)"
echo ""
echo "This confirms the bug is specifically about internal operations"
echo "produced by successful CRAC calls — their receipt tag is not"
echo "handled by SeouLo's operation_data_and_receipt_encoding."

import { useState } from "react";
import { connectWallet, disconnectWallet } from "./wallet";
import { sendMessageViaCrac } from "./crac";
import { readMessage } from "./evm";
import { MESSAGE_STORE_ADDRESS } from "./config";

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [storedMessage, setStoredMessage] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawTransfer, setRawTransfer] = useState(false);

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAddress(addr);
      setStatus("");
    } catch (e: any) {
      setStatus(`Connection failed: ${e.message}`);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setAddress(null);
    setStatus("");
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setStatus("Sending via CRAC...");
    try {
      const opHash = await sendMessageViaCrac(message, rawTransfer);
      setStatus(`Sent! Op: ${opHash}`);
      setMessage("");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async () => {
    setLoading(true);
    setStatus("Reading from EVM...");
    try {
      const msg = await readMessage();
      setStoredMessage(msg);
      setStatus("");
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", fontFamily: "system-ui" }}>
      <h1>CRAC Demo</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Michelson &rarr; EVM cross-runtime call on Tezos X
      </p>

      {!MESSAGE_STORE_ADDRESS && (
        <div style={{ background: "#fff3cd", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          Set <code>VITE_MESSAGE_STORE_ADDRESS</code> in <code>.env</code> after deploying the EVM contract.
        </div>
      )}

      {/* Wallet */}
      <section style={{ marginBottom: 24 }}>
        {address ? (
          <div>
            <span style={{ fontSize: 14, color: "#28a745" }}>
              Connected: {address.slice(0, 8)}...{address.slice(-4)}
            </span>
            <button onClick={handleDisconnect} style={{ marginLeft: 12 }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={handleConnect}>Connect Michelson Wallet</button>
        )}
      </section>

      {/* Send */}
      {address && (
        <section style={{ marginBottom: 24 }}>
          <h3>Send a message via CRAC</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              style={{ flex: 1, padding: 8 }}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !message.trim()}>
              Send
            </button>
          </div>
        </section>
      )}

      {/* Read */}
      <section style={{ marginBottom: 24 }}>
        <h3>Read stored message (EVM)</h3>
        <button onClick={handleRead} disabled={loading}>
          Read
        </button>
        {storedMessage !== null && (
          <div
            style={{
              marginTop: 12,
              padding: 16,
              background: "#f0f0f0",
              borderRadius: 6,
              fontSize: 18,
              wordBreak: "break-word",
            }}
          >
            {storedMessage}
          </div>
        )}
      </section>

      {/* Raw transfer toggle */}
      <section style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={rawTransfer}
            onChange={(e) => setRawTransfer(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Raw transfer (bypass Taquito contract abstraction)
        </label>
        <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
          Use this if the CRAC gateway doesn't expose its script via the Tezos RPC.
        </p>
      </section>

      {/* Status */}
      {status && (
        <div style={{ fontSize: 13, color: "#555", wordBreak: "break-all" }}>
          {status}
        </div>
      )}
    </div>
  );
}

export default App;

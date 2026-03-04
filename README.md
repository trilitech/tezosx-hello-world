# CRAC Demo

Demo minimale de la feature CRAC (Cross-Runtime Atomic Calls) de Tezos X :
envoyer un message depuis un wallet Michelson vers un smart contract EVM, puis le relire.

## Prerequis

- Node.js >= 18
- Un wallet Michelson (Temple, Umami...) configure sur le testnet TezosX

## Comptes bootstrap

Le testnet fournit des comptes pre-finances, sans faucet. Ils sont documentes dans le
[TezosX Onboarding Guide](https://linear.app/tezos/document/tezosx-onboarding-guide-da27b417c992).

### EVM

| Adresse | Cle privee |
|---|---|
| `0x6ce4d79d4E77402e1ef3417Fdda433aA744C6e1c` | `0x9722f6cc9ff938e63f8ccb74c3daa6b45837e5c5e3835ac08c44c50ab5f39dc0` |
| `0xB53dc01974176E5dFf2298C5a94343c2585E3c54` | `0x3a6a6ca30c1ef1ce605a63a7a1a4ff4c689f8414ca0838bca29423f0ec280ff5` |
| `0x9b49c988b5817Be31DfB00F7a5a4671772dCce2B` | `0x0eb9bfa77d6cd145cdc0e3d6f902ee1464aeb5f62b02e38f111c9b60cd3adab5` |

### Tezos (Michelson)

| Compte | Cle publique |
|---|---|
| bootstrap1 | `edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Wd9sDVC9yav` |
| bootstrap2 | `edpktzNbDAUjUk697W7gYg2CRuBQjyPxbEg8dLccYYwKSKvkPvjtV9` |
| bootstrap3 | `edpkuTXkJDGcFd5nh6VvMz8phXxU3Bi7h6hqgywNFi1vZTfQNnS1RV` |
| bootstrap4 | `edpkuFrRoDSEbJYgxRtLx2ps82UdaYc1WwfS9sE11yhauZt5DgCHbU` |
| bootstrap5 | `edpkv8EUUH68jmo3f7Um5PezmfGrRF24gnfLpH3sVNwJnV5bVCxL2n` |

## Workflow

### 1. Installation

```bash
cd crac-demo
npm install
```

### 2. Compilation du contrat EVM

Le contrat `contracts/MessageStore.sol` est compile avec `solc` (installe via npm) :

```bash
npm run compile
```

Cela genere `contracts/MessageStore.json` contenant l'ABI et le bytecode.

### 3. Deploiement du contrat EVM sur le testnet

Utiliser un des comptes bootstrap EVM ci-dessus :

```bash
npm run deploy -- 0x9722f6cc9ff938e63f8ccb74c3daa6b45837e5c5e3835ac08c44c50ab5f39dc0
```

Le script deploie via le RPC `https://demo.txpark.nomadic-labs.com/rpc` et affiche l'adresse du contrat.

### 4. Configuration

Creer un fichier `.env` a la racine :

```
VITE_MESSAGE_STORE_ADDRESS=0x...adresse_deployee...
```

### 5. Lancement

```bash
npm run dev
```

Ouvrir http://localhost:5174.

## Utilisation

1. **Connecter le wallet** — Cliquer "Connect Michelson Wallet", approuver dans Temple/Umami
2. **Envoyer un message** — Taper un message, cliquer "Send"
   - L'app appelle le CRAC Gateway (`KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw`) qui route l'appel vers le contrat EVM
3. **Lire le message** — Cliquer "Read" pour lire le message stocke dans le contrat EVM via `eth_call`

## Architecture

Voir [ARCHITECTURE.md](../ARCHITECTURE.md) pour le detail des choix techniques.

## Testnet

| | |
|---|---|
| RPC | `https://demo.txpark.nomadic-labs.com/rpc` |
| Blockscout | `https://demo.txpark.nomadic-labs.com/` |
| CRAC Gateway | `KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw` |

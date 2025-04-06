# defi4all

DeFi 4 All est une application décentralisée conçue pour simplifier la gestion des positions et stratégies en finance décentralisée (DeFi).

---

## 📦 Installation

```bash
git clone 
cd backend
npm install
cd frontend
npm install
```

## ✅ Déploiement avec Hardhat

BACKEND (Tests unitaires avec hardhat et Chai):

```bash
cd backend
npx hardhat node 
npx hardhat ignition deploy ignition/modules/D4A_hardhat.js --network localhost
```

FRONTEND:

```bash
cd frontend
npm run dev
```

Application accessible on localhost:3000

## 🧪 Tests

BACKEND (Tests unitaires avec hardhat et Chai):

```bash
git clone 
cd backend
npx hardhat test
```

## Scripts

```bash
cd backend
npx hardhat run scripts/SwapEthToUsdc.js --network localhost
```
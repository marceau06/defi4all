const { network } = require("hardhat");

async function main() {
 
    // Miner un nouveau bloc pour appliquer le temps
    await network.provider.send("evm_mine");
    // Pause de 1 seconde (1000 ms)
    await new Promise((resolve) => setTimeout(resolve, 1000));

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
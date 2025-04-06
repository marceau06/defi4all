const { ethers, network } = require("hardhat");

const MINUTES_IN_HOUR = 60;
let elapsed = 0;

async function main() {
  console.log("Starting blockchain time forwarder...");
  
  while (elapsed < MINUTES_IN_HOUR) {
    // Avancer le temps d'1 minute (60 secondes)
    await network.provider.send("evm_increaseTime", [60]);

    // Miner un nouveau bloc pour appliquer le temps
    await network.provider.send("evm_mine");

    // Afficher le timestamp
    const block = await ethers.provider.getBlock("latest");
    console.log("New Block Timestamp:", block.timestamp);

    elapsed++;

    // Pause de 1 seconde (1000 ms)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
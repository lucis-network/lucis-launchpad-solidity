// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  if (!process.env.RECEIVE_ADDRESS) {
    console.error("Please setting env file");
    return;
  }

  if (process.env.MODE === "dev") {
    // Deploy BUSD
    const BUSDToken = await ethers.getContractFactory("BUSDToken");
    const busd = await BUSDToken.deploy();
    await busd.deployed();
    console.log("busd deployed to:", busd.address);

    const BoxNft = await ethers.getContractFactory("BoxNft");
    const box = await BoxNft.deploy(
      busd.address,
      process.env.RECEIVE_ADDRESS!,
      "50000000000000000000"
    );
    await box.deployed();
    console.log("Box deployed to:", box.address);
    return;
  }

  if (!process.env.PAYMENT_TOKEN_ADDRESS) {
    console.error("Please setting env file");
    return;
  }

  const BoxNft = await ethers.getContractFactory("BoxNft");
  const box = await BoxNft.deploy(
    process.env.PAYMENT_TOKEN_ADDRESS!,
    process.env.RECEIVE_ADDRESS!,
    "PRICE_18_UNIT"
  );
  await box.deployed();
  console.log("Box deployed to:", box.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
  if (
    !process.env.RECEIVE_ADDRESS ||
    !process.env.BOX_TYPES! ||
    !process.env.BOX_PRICES!
  ) {
    console.error("Please setting env file");
    return;
  }

  if (!process.env.PAYMENT_TOKEN_ADDRESS) {
    // Deploy BUSD
    const Token = await ethers.getContractFactory(
      process.env.TOKEN_FILE ?? "BUSDToken"
    );
    const _token = await Token.deploy();
    await _token.deployed();
    process.env.PAYMENT_TOKEN_ADDRESS = _token.address;
    console.log("token deployed to:", process.env.PAYMENT_TOKEN_ADDRESS);
  }

  if (!process.env.PAYMENT_TOKEN_ADDRESS) {
    console.error("Please setting env file");
    return;
  }

  const BoxNft = await ethers.getContractFactory("BoxNft");
  const box = await BoxNft.deploy(
    process.env.PAYMENT_TOKEN_ADDRESS!,
    process.env.RECEIVE_ADDRESS!,
    process.env.BOX_TYPES!.split(","),
    process.env.BOX_PRICES!.split(",")
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

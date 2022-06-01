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

  if (!process.env.LBOX_CONTRACT_ADDRESS) {
    console.log("Box contract not deployed");
    return;
  }
  // Update box type, price
  if (
    !process.env.BOX_TYPES ||
    !process.env.BOX_PRICES ||
    !process.env.BOX_QTYS
  ) {
    console.log("BOX_TYPES | BOX_PRICES | BOX_QTYS Not set in env");
    return;
  }

  const LBox = await ethers.getContractFactory("LBox");
  const boxCt = await LBox.attach(process.env.LBOX_CONTRACT_ADDRESS ?? "");
  const allocBoxTx = await boxCt.allocBox(
    process.env.BOX_TYPES.split(","),
    process.env.BOX_PRICES.split(","),
    process.env.BOX_QTYS.split(","),
    {
      gasLimit: 200000,
    }
  );
  console.log("allocBoxTx: ", allocBoxTx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

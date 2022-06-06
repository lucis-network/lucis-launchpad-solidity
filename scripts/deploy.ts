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

  if (process.env.ENV === "testnet" && !process.env.PAYMENT_TOKEN_ADDRESS) {
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

  if (!process.env.BOX_CONTRACT_ADDRESS) {
    if (!process.env.RECEIVE_ADDRESS) {
      console.log("RECEIVE_ADDRESS Missing");
      return;
    }
    if (
      !process.env.BOX_TYPES ||
      !process.env.BOX_PRICES ||
      !process.env.BOX_QTYS
    ) {
      console.log("BOX_TYPES | BOX_PRICES | BOX_QTYS");
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

  if (!process.env.LUCIS_NFT_CONTRACT_ADDRESS) {
    const LucisNFT = await ethers.getContractFactory("LucisNFT");
    const lucisNftCt = await LucisNFT.deploy();
    await lucisNftCt.deployed();
    console.log("LucisNft deployed to:", lucisNftCt.address);
    process.env.LUCIS_NFT_CONTRACT_ADDRESS = lucisNftCt.address;
  }

  if (!process.env.LBOX_CONTRACT_ADDRESS) {
    if (!process.env.RECEIVE_ADDRESS) {
      console.log("RECEIVE_ADDRESS Missing");
      return;
    }

    if (
      !process.env.BOX_TYPES ||
      !process.env.BOX_PRICES ||
      !process.env.BOX_QTYS
    ) {
      console.log("BOX_TYPES | BOX_PRICES | BOX_QTYS");
      return;
    }

    if (
      !process.env.BOX_CHAR_RATES ||
      !process.env.BOX_COSTUME_RATES ||
      !process.env.BOX_HAT_RATES ||
      !process.env.BOX_WEAPON_RATES ||
      !process.env.BOX_GLASSES_RATES ||
      !process.env.BOX_BACKGROUND_RATES ||
      !process.env.BOX_LEVEL_RATES ||
      !process.env.BOX_FACTOR_RATES ||
      !process.env.BOX_HALO_RATES
    ) {
      console.log("BOX ATT not set in env");
      return;
    }

    const LBox = await ethers.getContractFactory("LBox");

    const boxCt = await LBox.deploy(
      process.env.PAYMENT_TOKEN_ADDRESS!,
      process.env.RECEIVE_ADDRESS!
    );
    await boxCt.deployed();
    console.log("LBox deployed to:", boxCt.address);

    if (process.env.LUCIS_NFT_CONTRACT_ADDRESS) {
      const updateNftBoxTx = await boxCt.updateNftContract(
        process.env.LUCIS_NFT_CONTRACT_ADDRESS
      );
      console.log("updateNftBoxTx: ", updateNftBoxTx.hash);
    }

    const allocBoxTx = await boxCt.allocBox(
      process.env.BOX_TYPES.split(","),
      process.env.BOX_PRICES.split(","),
      process.env.BOX_QTYS.split(",")
    );
    console.log("allocBoxTx: ", allocBoxTx.hash);

    const updateBoxTx = await boxCt.updateBox(
      process.env.BOX_CHAR_RATES.split(","),
      process.env.BOX_COSTUME_RATES.split(","),
      process.env.BOX_HAT_RATES.split(","),
      process.env.BOX_WEAPON_RATES.split(","),
      process.env.BOX_GLASSES_RATES.split(","),
      process.env.BOX_BACKGROUND_RATES.split(","),
      process.env.BOX_LEVEL_RATES.split(","),
      process.env.BOX_FACTOR_RATES.split(","),
      process.env.BOX_HALO_RATES.split(",")
    );
    console.log("updateBoxTx: ", updateBoxTx.hash);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

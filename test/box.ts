import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { MathHelper } from "./math.helper";
import "@nomiclabs/hardhat-waffle";

let busd: Contract;
let boxCt: Contract;
let lucis_nft: Contract;

let owner: SignerWithAddress;
let buyer: SignerWithAddress;
let feeWallet: SignerWithAddress;
let accounts: SignerWithAddress[];
let decimals: number;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let firstType = "type";
let firstPrice = "";
const buy_amount = 100;
const boxBuyed: number[] = [];
const URI_CONTENT = "https://game/";

describe("LBox", function () {
  before(async function () {
    const BUSD = await ethers.getContractFactory("BUSDToken");
    const LucisNFT = await ethers.getContractFactory("LucisNFT");
    const LBox = await ethers.getContractFactory("LBox");

    busd = await BUSD.attach(process.env.PAYMENT_TOKEN_ADDRESS ?? "");
    lucis_nft = await LucisNFT.attach(
      process.env.LUCIS_NFT_CONTRACT_ADDRESS ?? ""
    );
    boxCt = await LBox.attach(process.env.LBOX_CONTRACT_ADDRESS ?? "");

    const _decimals = await busd.decimals();
    decimals = Math.pow(10, _decimals);

    accounts = await ethers.getSigners();
    owner = accounts[0];
    buyer = accounts[1];
    feeWallet = accounts[2];
    if (!buyer || !feeWallet) {
      throw Error("Please set multiple PRIVATE_KEY in env separate by ','");
    }

    if (!process.env.BOX_TYPES || !process.env.BOX_PRICES) {
      throw Error("Please set multiple BOX_TYPES, BOX_PRICES in env");
    }

    firstType = process.env.BOX_TYPES!.split(",")[0];
    firstPrice = process.env.BOX_PRICES!.split(",")[0];
  });

  beforeEach(async function () {
    // box = await Box.deploy();
    // await box.deployed();
  });

  it("Should update price success", async function () {
    return;

    const allocBoxTx = await boxCt.allocBox(
      process.env.BOX_TYPES!.split(","),
      process.env.BOX_PRICES!.split(","),
      process.env.BOX_QTYS!.split(",")
    );
    await allocBoxTx.wait();

    const result = await await boxCt.getPrices(firstType);
    expect(result.toString()).to.equal(firstPrice);
  });

  it("should send 900 busd to buyer account", async () => {
    return;

    const sendAmount = 1055;
    const balance = await busd.balanceOf(buyer.address);
    console.log("balance: ", balance);
    if (balance >= sendAmount) {
      return;
    }
    const amountSend = MathHelper.toString(sendAmount * decimals);
    const totalBalance = MathHelper.toString(
      MathHelper.plus(balance.toString(), amountSend).toNumber()
    );
    const result = await busd.transfer(buyer.address, amountSend);
    const waitResult = await result.wait();
    console.log("waitResult: ", waitResult);
    console.log("result: ", result);

    const newBalance = await busd.balanceOf(buyer.address);
    // console.log(newBalance.toString());
    expect(newBalance.toString()).to.equal(totalBalance);
  });

  // Validate
  it("could not mint to zero address", async () => {
    return;

    await expect(boxCt.buyBox(ZERO_ADDRESS, firstType, 5)).to.be.reverted;
  });

  it("quantity must be > 0", async () => {
    return;

    await expect(boxCt.buyBox(ZERO_ADDRESS, firstType, 0)).to.be.reverted;
  });

  it("allowance is not enough", async () => {
    return;

    await busd.connect(buyer).approve(boxCt.address, firstPrice);
    await expect(boxCt.buyBox(buyer.address, firstType, 5)).to.be.reverted;
  });

  it("Token balance is not enough", async () => {
    return;

    const balance = await busd.balanceOf(buyer.address);
    const balanceNum = MathHelper.toNumber(balance.toString());
    // console.log("balance: ", balance.toString());
    expect(balanceNum).greaterThan(0);

    const quantity =
      Math.round(MathHelper.div(balanceNum, firstPrice).toNumber()) + 10;
    // console.log("quantity: ", quantity);
    await busd
      .connect(buyer)
      .approve(
        boxCt.address,
        MathHelper.mul(firstPrice, quantity).toString(10)
      );

    await expect(boxCt.buyBox(buyer.address, firstType, quantity)).to.be
      .reverted;
  });

  it("should buy box successfuly", async () => {
    // return;

    // const block = await ethers.provider.getBlockNumber();
    // console.log("block: ", block);
    // console.log("buyer: ", buyer.address);
    // console.log("hotWallet: ", hotWallet.address);

    const quantity = 2;
    const price = buy_amount * decimals;
    const buyAmount = price * quantity;

    const balance = await busd.balanceOf(buyer.address);
    const balanceNum = MathHelper.toNumber(balance.toString());
    // console.log("balance: ", balance.toString());
    expect(balanceNum).greaterThanOrEqual(buyAmount);

    const hotWalletBalance = await busd.balanceOf(feeWallet.address);
    // buy box
    await busd
      .connect(buyer)
      .approve(boxCt.address, MathHelper.toString(buyAmount));
    const result = await boxCt.buyBox(buyer.address, firstType, quantity);
    await result.wait();
    // console.log("result: ", result);

    const newBalance = await busd.balanceOf(buyer.address);
    // console.log("newBalance", newBalance.toString());
    expect(newBalance.toString()).to.equal(
      MathHelper.toString(MathHelper.minus(balanceNum, buyAmount).toNumber())
    );

    const newHotWalletBalance = await busd.balanceOf(feeWallet.address);
    // console.log("newHotWalletBalance", newHotWalletBalance.toString());
    expect(newHotWalletBalance.toString()).to.equal(
      MathHelper.toString(
        MathHelper.plus(hotWalletBalance.toString(), buyAmount).toNumber()
      )
    );
    const eventFilter = boxCt.filters.Transfer();
    const events = await boxCt.queryFilter(eventFilter, "latest");
    // console.log("events: ", events[0]);
    const tokenId = MathHelper.toNumber(events[0].args?.tokenId.toString());
    expect(tokenId).greaterThanOrEqual(0);
    boxBuyed.push(tokenId);
  });

  // //setBaseURI
  it("setBaseURI should abort with an must have admin role", async () => {
    return;

    await expect(boxCt.connect(buyer).setBaseURI(URI_CONTENT)).to.be.reverted;
  });

  it("setBaseURI should successfully", async () => {
    return;

    await boxCt.connect(owner).setBaseURI(URI_CONTENT);
    await boxCt.tokenURI(boxBuyed[0]);
    expect(await boxCt.tokenURI(boxBuyed[0])).to.be.equal(
      URI_CONTENT + boxBuyed[0]
    );
  });

  // Test case Summon Item
  it("should abort by Summon Item is not allowed", async () => {
    return;

    // const tokens = await box.balanceOf(buyer.address);
    // console.log("tokens: ", tokens);
    await boxCt.setAllowSummonItem(false);
    await expect(boxCt.connect(buyer).summonItem(5)).to.be.reverted;
  });

  it("should abort by sender is not own of tokenId", async () => {
    return;

    await boxCt.setAllowSummonItem(true);
    await expect(
      boxCt.connect(feeWallet).summonItem(5),
      "revert sender is not own of tokenId"
    ).to.be.reverted;
  });

  it("should abort with an operator query for nonexistent token", async () => {
    return;

    await boxCt.setAllowSummonItem(true);
    await expect(
      boxCt.connect(buyer).summonItem(10000),
      "revert ERC721: owner query for nonexistent token"
    ).to.be.reverted;
  });

  it("should summon item successfully", async () => {
    return;

    // console.log("buyer: ", buyer.address);
    // console.log("boxBuyed[0]: ", boxBuyed[0]);
    // const balanceOf = await box.balanceOf(buyer.address);
    // console.log("balanceOf: ", balanceOf);
    await boxCt.setAllowSummonItem(true);
    const result = await boxCt.connect(buyer).summonItem(boxBuyed[0]);
    await result.wait();
    // console.log("result: ", result);
    await expect(boxCt.ownerOf(boxBuyed[0]), "REVERT: Token burned").to.be
      .reverted;
    // expectEvent(result, "ItemSummoned");
  });

  it("setAllowSummonItem should abort with an must have admin role", async () => {
    return;

    await expect(boxCt.connect(buyer).setAllowSummonItem(false)).to.be.reverted;
  });

  it("setReceivedAddress should != address 0x", async () => {
    return;

    await expect(boxCt.connect(owner).setReceivedAddress(ZERO_ADDRESS)).to.be
      .reverted;
  });

  it("setReceivedAddress should abort with an must have admin role", async () => {
    return;

    await expect(boxCt.connect(buyer).setReceivedAddress(feeWallet.address)).to
      .be.reverted;
  });

  it("setReceivedAddress should successfully", async () => {
    return;

    await boxCt.connect(owner).setReceivedAddress(feeWallet.address);
  });

  it("setupMinterRole should abort with an account must be not equal address 0x", async () => {
    return;

    await expect(boxCt.connect(owner).setupMinterRole(ZERO_ADDRESS, true)).to.be
      .reverted;
  });

  it("setupMinterRole should abort with an must have admin role", async () => {
    return;

    await expect(
      boxCt.connect(buyer.address).setupMinterRole(buyer.address, true)
    ).to.be.reverted;
  });

  it("setupMinterRole should successfully", async () => {
    return;

    await boxCt.connect(owner).setupMinterRole(buyer.address, true);
  });
});

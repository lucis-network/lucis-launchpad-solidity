import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { MathHelper } from "./math.helper";

let busd: Contract;
let box: Contract;
let owner: SignerWithAddress;
let buyer: SignerWithAddress;
let hotWallet: SignerWithAddress;
let accounts: SignerWithAddress[];
const boxBuyed: number[] = [];
let decimals: number;
const URI_CONTETN = "https://game/";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("BoxNft", function () {
  before(async function () {
    const BUSD = await ethers.getContractFactory("BUSDToken");
    const Box = await ethers.getContractFactory("BoxNft");

    busd = await BUSD.attach(process.env.TOKEN_CONTRACT_ADDRESS ?? "");
    box = await Box.attach(process.env.BOX_CONTRACT_ADDRESS ?? "");
    const _decimals = await busd.decimals();
    decimals = Math.pow(10, _decimals);

    accounts = await ethers.getSigners();
    owner = accounts[0];
    buyer = accounts[1];
    hotWallet = accounts[2];
    if (!buyer || !hotWallet) {
      throw Error("Please set multiple PRIVATE_KEY in env separate by ','");
    }
  });

  beforeEach(async function () {
    // box = await Box.deploy();
    // await box.deployed();
  });

  // Prepare
  it("Should set and get prices success", async function () {
    const price = MathHelper.toString(90 * decimals);
    const setTx = await box.setPrices(["type"], [price]);
    // wait until the transaction is mined
    await setTx.wait();
    const result = await await box.getPrices("type");
    expect(result.toString()).to.equal(price);
    // const num = MathHelper.div(result.toString(), 1e18).toNumber();
    // console.log("result: ", num);
    // expect(num).greaterThanOrEqual(0);
  });

  it("should send 900 busd to buyer account", async () => {
    const balance = await busd.balanceOf(buyer.address);
    const amountSend = MathHelper.toString(900 * decimals);
    const totalBalance = MathHelper.toString(
      MathHelper.plus(balance.toString(), amountSend).toNumber()
    );
    await busd.transfer(buyer.address, amountSend);
    const newBalance = await busd.balanceOf(buyer.address);
    // console.log(newBalance.toString());
    expect(newBalance.toString()).to.equal(totalBalance);
  });

  // Validate
  it("could not mint to zero address", async () => {
    await expect(box.buyBox(ZERO_ADDRESS, "type", 5)).to.be.reverted;
  });

  it("quantity must be > 0", async () => {
    await expect(box.buyBox(ZERO_ADDRESS, "type", 0)).to.be.reverted;
  });

  it("allowance is not enough", async () => {
    await busd
      .connect(buyer)
      .approve(box.address, MathHelper.toString(90 * decimals));
    await expect(box.buyBox(buyer.address, "type", 5)).to.be.reverted;
  });

  it("Token balance is not enough", async () => {
    const balance = await busd.balanceOf(buyer.address);
    const balanceNum = MathHelper.toNumber(balance.toString());
    // console.log("balance: ", balance.toString());
    expect(balanceNum).greaterThan(0);

    const quantity =
      Math.round(MathHelper.div(balanceNum, 90 * decimals).toNumber()) + 10;
    // console.log("quantity: ", quantity);
    await busd
      .connect(buyer)
      .approve(box.address, MathHelper.toString(90 * quantity * decimals));

    await expect(box.buyBox(buyer.address, "type", quantity)).to.be.reverted;
  });

  it("should buy box successfuly", async () => {
    // const block = await ethers.provider.getBlockNumber();
    // console.log("block: ", block);
    // console.log("buyer: ", buyer.address);
    // console.log("hotWallet: ", hotWallet.address);

    const quantity = 2;
    const price = 90 * decimals;
    const buyAmount = price * quantity;

    const balance = await busd.balanceOf(buyer.address);
    const balanceNum = MathHelper.toNumber(balance.toString());
    // console.log("balance: ", balance.toString());
    expect(balanceNum).greaterThanOrEqual(buyAmount);

    const hotWalletBalance = await busd.balanceOf(hotWallet.address);
    // buy box
    await busd
      .connect(buyer)
      .approve(box.address, MathHelper.toString(buyAmount));
    const result = await box.buyBox(buyer.address, "type", quantity);
    await result.wait();
    // console.log("result: ", result);

    const newBalance = await busd.balanceOf(buyer.address);
    // console.log("newBalance", newBalance.toString());
    expect(newBalance.toString()).to.equal(
      MathHelper.toString(MathHelper.minus(balanceNum, buyAmount).toNumber())
    );

    const newHotWalletBalance = await busd.balanceOf(hotWallet.address);
    // console.log("newHotWalletBalance", newHotWalletBalance.toString());
    expect(newHotWalletBalance.toString()).to.equal(
      MathHelper.toString(
        MathHelper.plus(hotWalletBalance.toString(), buyAmount).toNumber()
      )
    );
    const eventFilter = box.filters.Transfer();
    const events = await box.queryFilter(eventFilter, "latest");
    // console.log("events: ", events[0]);
    const tokenId = MathHelper.toNumber(events[0].args?.tokenId.toString());
    expect(tokenId).greaterThanOrEqual(0);
    boxBuyed.push(tokenId);
  });

  // //setBaseURI
  it("setBaseURI should abort with an must have admin role", async () => {
    await expect(box.connect(buyer).setBaseURI("https://game")).to.be.reverted;
  });

  it("setBaseURI should successfully", async () => {
    await box.connect(owner).setBaseURI(URI_CONTETN);
    await box.tokenURI(boxBuyed[0]);
    expect(await box.tokenURI(boxBuyed[0])).to.be.equal(
      URI_CONTETN + boxBuyed[0]
    );
  });

  // Test case Summon Item
  it("should abort by Summon Item is not allowed", async () => {
    // const tokens = await box.balanceOf(buyer.address);
    // console.log("tokens: ", tokens);
    await box.setAllowSummonItem(false);
    await expect(box.connect(buyer).summonItem(5)).to.be.reverted;
  });

  it("should abort by sender is not own of tokenId", async () => {
    await box.setAllowSummonItem(true);
    await expect(
      box.connect(hotWallet).summonItem(5),
      "revert sender is not own of tokenId"
    ).to.be.reverted;
  });

  it("should abort with an operator query for nonexistent token", async () => {
    await box.setAllowSummonItem(true);
    await expect(
      box.connect(buyer).summonItem(10000),
      "revert ERC721: owner query for nonexistent token"
    ).to.be.reverted;
  });

  it("should summon item successfully", async () => {
    // console.log("buyer: ", buyer.address);
    // console.log("boxBuyed[0]: ", boxBuyed[0]);
    // const balanceOf = await box.balanceOf(buyer.address);
    // console.log("balanceOf: ", balanceOf);
    await box.setAllowSummonItem(true);
    const result = await box.connect(buyer).summonItem(boxBuyed[0]);
    await result.wait();
    // console.log("result: ", result);
    await expect(box.ownerOf(boxBuyed[0]), "REVERT: Token burned").to.be
      .reverted;
    // expectEvent(result, "ItemSummoned");
  });

  it("setAllowSummonItem should abort with an must have admin role", async () => {
    await expect(box.connect(buyer).setAllowSummonItem(false)).to.be.reverted;
  });

  it("setReceivedAddress should != address 0x", async () => {
    await expect(box.connect(owner).setReceivedAddress(ZERO_ADDRESS)).to.be
      .reverted;
  });

  it("setReceivedAddress should abort with an must have admin role", async () => {
    await expect(box.connect(buyer).setReceivedAddress(hotWallet.address)).to.be
      .reverted;
  });

  it("setReceivedAddress should successfully", async () => {
    await box.connect(owner).setReceivedAddress(hotWallet.address);
  });

  it("setupMinterRole should abort with an account must be not equal address 0x", async () => {
    await expect(box.connect(owner).setupMinterRole(ZERO_ADDRESS, true)).to.be
      .reverted;
  });

  it("setupMinterRole should abort with an must have admin role", async () => {
    await expect(
      box.connect(buyer.address).setupMinterRole(buyer.address, true)
    ).to.be.reverted;
  });

  it("setupMinterRole should successfully", async () => {
    await box.connect(owner).setupMinterRole(buyer.address, true);
  });
});

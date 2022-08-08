import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, utils,BigNumber } from "ethers";
import { ethers } from "hardhat";
import { MathHelper } from "./math.helper";

let busd: Contract;
let box: Contract;
let lucisNFT: Contract;
let owner: SignerWithAddress;
let buyer: SignerWithAddress;
let hotWallet: SignerWithAddress;
let accounts: SignerWithAddress[];
const boxBuyed: number[] = [];
const URI_CONTETN = "https://game/";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("LBox erc1155", function () {
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    buyer = accounts[1];
    hotWallet = accounts[2];
    const BUSD = await ethers.getContractFactory("BUSDToken");
    const LBox = await ethers.getContractFactory("LBox");
    const LucisNFT = await ethers.getContractFactory("LucisNFT");


    busd = await BUSD.deploy();
    lucisNFT = await LucisNFT.deploy();
    box = await LBox.deploy(busd.address, hotWallet.address, lucisNFT.address);
    await box.updateNftContract(
      lucisNFT.address
    );
    await box.updateBox(
      process.env.BOX_CHAR_RATES?.split(","),
      process.env.BOX_RARITY_RATES?.split(","),
      process.env.BOX_LEVEL_RATES?.split(","),
      process.env.BOX_ELEMENTAL_RATES?.split(","),
      process.env.BOX_COSTUME_RATES?.split(","),
      process.env.BOX_HAT_RATES?.split(","),
      process.env.BOX_WEAPON_RATES?.split(","),
      process.env.BOX_GLASSES_RATES?.split(",")
    );

    await lucisNFT.setupMinterRole(box.address, true);
    
    if (!buyer || !hotWallet) {
      throw Error("Please set multiple PRIVATE_KEY in env separate by ','");
    }
  });

  beforeEach(async function () {
    // box = await Box.deploy();
    // await box.deployed();
  });



  it("should send 900 busd to buyer account", async () => {
    const balanceRes = await busd.balanceOf(buyer.address);
    const balance = BigNumber.from(balanceRes);
    const amountSend = utils.parseEther("900");
    const totalBalance = balance.add(amountSend);
    await busd.transfer(buyer.address, amountSend);
    const newBalance = await busd.balanceOf(buyer.address);
    // console.log(newBalance.toString());
    expect(newBalance.toString()).to.equal(totalBalance);
  });

  // Validate
  it("could not mint to zero address", async () => {
    const price  = "100000000000000000"; // 0.1 busd
    await expect(box.buyBox(ZERO_ADDRESS, price, 5)).to.be.reverted;
  });

  it("quantity must be > 0", async () => {
    const price  = "100000000000000000"; // 0.1 busd
    await expect(box.buyBox(buyer.address, price, 0)).to.be.reverted;
  });

  it("allowance is not enough", async () => {
    const amountSend = utils.parseEther("900");
    await busd.transfer(buyer.address, amountSend);
    await busd.connect(buyer).approve(box.address, amountSend);
    const price  = "1000000000000000000000"; // 1000 busd
    await expect(box.buyBox(buyer.address, price, 5)).to.be.reverted;
  });

  it("Token balance is not enough", async () => {
    const amountSend = utils.parseEther("100");
    await busd.transfer(buyer.address, amountSend);
    const balance = await busd.balanceOf(buyer.address);
    const balanceNum = MathHelper.toNumber(balance.toString());
    // console.log("balance: ", balance.toString());
    expect(balanceNum).greaterThan(0);

    const price = utils.parseEther("100");
    const busdApproved = utils.parseEther("1000");
    // console.log("quantity: ", quantity);
    await busd
      .connect(buyer)
      .approve(box.address, busdApproved);

    await expect(box.buyBox(buyer.address, price, 20)).to.be.reverted;
  });

  it("should buy box successfully", async () => {
    const amountSend = utils.parseEther("10000");
    await busd.transfer(buyer.address, amountSend);
    await busd.connect(buyer).approve(box.address, amountSend);

    const quantity = 20;
    const price = utils.parseEther("100");

    const buyerBalanceBefore = await busd.balanceOf(buyer.address);

    const ownerBalanceBefore = await busd.balanceOf(hotWallet.address);

    const result = await box.buyBox(buyer.address, price, quantity);
    await result.wait();
    // console.log("result: ", result);

    const buyerBalanceAfter = await busd.balanceOf(buyer.address);
    // console.log("newBalance", newBalance.toString());
    expect(buyerBalanceAfter.toString()).to.equal(
      BigNumber.from(buyerBalanceBefore).sub(BigNumber.from(utils.parseEther("2000"))).toString()// 20 * 100
    );

    const ownerBalanceAfter = await busd.balanceOf(hotWallet.address);
    // console.log("newHotWalletBalance", newHotWalletBalance.toString());
    expect(ownerBalanceAfter.toString()).to.equal(
        BigNumber.from(ownerBalanceBefore).add(BigNumber.from(utils.parseEther("2000"))).toString()// 20 * 100
    );
  });

  // //setBaseURI
  it("setBaseURI should abort with an must have admin role", async () => {
    await expect(box.connect(buyer).setURI("https://game")).to.be.reverted;
  });


  // Test case Summon Item
  it("should abort by box is zero", async () => {
    // const tokens = await box.balanceOf(buyer.address);
    // console.log("tokens: ", tokens);
    await box.setAllowSummonItem(true);
    await expect(box.connect(buyer).summonItem()).to.be.reverted;
  });

  // Test case Summon Item
  it("should abort by Summon Item is not allowed", async () => {
    // const tokens = await box.balanceOf(buyer.address);
    // console.log("tokens: ", tokens);
    const amountSend = utils.parseEther("10000");
    await busd.transfer(buyer.address, amountSend);
    await busd.connect(buyer).approve(box.address, amountSend);
    const quantity = 20;
    const price = utils.parseEther("100");
    const result = await box.buyBox(buyer.address, price, quantity);
    await result.wait();

    await box.setAllowSummonItem(false);
    await expect(box.connect(buyer).summonItem()).to.be.reverted;
  });

  it("should abort by sender is not own of tokenId", async () => {
    const amountSend = utils.parseEther("10000");
    await busd.transfer(buyer.address, amountSend);
    await busd.connect(buyer).approve(box.address, amountSend);
    const quantity = 20;
    const price = utils.parseEther("100");
    const result = await box.buyBox(buyer.address, price, quantity);
    await result.wait();

    await box.setAllowSummonItem(true);
    await expect(box.connect(hotWallet).summonItem(),"revert sender is not own of tokenId").to.be.reverted;
  });



  it("should summon item successfully", async () => {
    await box.setInitNone(1234567);
    const amountSend = utils.parseEther("10000");
    await busd.transfer(buyer.address, amountSend);
    await busd.connect(buyer).approve(box.address, amountSend);
    const quantity = 20;
    const price = utils.parseEther("100");
    const resultBuyBox = await box.buyBox(buyer.address, price, quantity);
    await resultBuyBox.wait();

    await box.setAllowSummonItem(true);
    const result = await box.connect(buyer).summonItem();
    const rc = await result.wait(); // 0ms, as tx is already confirmed
    const event = rc.events.find((event: any) => event.event === 'ItemSummoned');


    const tokenId = event?.args?.[0];

    const ownerOfNftMinted = await lucisNFT.ownerOf(tokenId);

    expect(buyer.address).to.equal(ownerOfNftMinted);
    const balanceOfBoxAfter = await box.balanceOf(buyer.address, 1);

    expect(balanceOfBoxAfter.toString()).to.equal("19");

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

});

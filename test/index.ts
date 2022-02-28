import { expect } from "chai";
import { ethers } from "hardhat";
import { MathHelper } from "./math.helper";
// const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

describe("BoxNft", function () {
  before(async function () {
    this.Box = await ethers.getContractFactory("BoxNft");
  });

  beforeEach(async function () {
    // this.box = await this.Box.deploy();
    // await this.box.deployed();
    this.box = await this.Box.attach(
      "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
    );
  });

  it("Should return price >= 0", async function () {
    const result = await await this.box.getPrices("cl02lx5os0003doo02oebccpd");
    const num = MathHelper.div(result.toString(), 1e18).toNumber();
    console.log("result: ", num);
    expect(num).greaterThanOrEqual(0);

    // const setTx = await this.box.setPrices(["a"], ["10"]);
    // wait until the transaction is mined
    // await setTx.wait();
    // expect(await this.box.greet()).to.equal("Hola, mundo!");
  });

  it("setTokenURI with admin role", async function () {});

  it("setTokenURI without any role", async function () {});

  it("buyBox with minter role", async function () {});

  it("buyBox without any role", async function () {});
});

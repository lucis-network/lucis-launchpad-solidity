import { expect } from "chai";
import { ethers } from "hardhat";
// const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

describe("BoxNft", function () {
  before(async function () {
    this.Box = await ethers.getContractFactory("BoxNft");
  });

  beforeEach(async function () {
    this.box = await this.Box.deploy();
    await this.box.deployed();
  });

  it("Should return the new greeting once it's changed", async function () {
    expect(await this.box.greet()).to.equal("Hello, world!");

    const setGreetingTx = await this.box.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();
    expect(await this.box.greet()).to.equal("Hola, mundo!");
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";
import { MathHelper } from "./math.helper";
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";

describe("BoxNft", function () {
  before(async function () {
    this.BUSD = await ethers.getContractFactory("BUSDToken");
    this.Box = await ethers.getContractFactory("BoxNft");
  });

  beforeEach(async function () {
    // this.box = await this.Box.deploy();
    // await this.box.deployed();
    this.busd = await this.BUSD.attach(
      "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
    );
    this.box = await this.Box.attach(
      "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
    );
    this.accounts = await ethers.getSigners();
    this.buyer = this.this.buyer;
  });

  it("should put 1000 busd to first account", async () => {
    let balance = await this.busd.balanceOf(this.buyer);
    console.log(balance.toString());

    const total_supply = await this.busd.totalSupply();
    console.log(total_supply.toString());
    expect(total_supply.toString()).to.equal("1000000000000000000000000000");

    await this.busd.transfer(this.buyer, "100000000000000000000000000");
    balance = await this.busd.balanceOf(this.buyer);
    console.log(balance.toString());
    expect(balance.toString()).to.equal("1000000000000000000000");
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

  //Exception buyBox
  it("could not mint to zero address", async () => {
    await this.busd.approve(
      this.box.address,
      "100000000000000000000000000000000000",
      { from: this.buyer }
    );
    expectRevert(
      this.box.buyBox("0x0000000000000000000000000000000000000000", 5)
    );
  });

  it("quantity must be greater than 0", async () => {
    await this.busd.approve(
      this.box.address,
      "100000000000000000000000000000000000",
      { from: this.buyer }
    );
    expectRevert(this.box.buyBox(this.buyer, 0));
  });

  it("allowance is not enough", async () => {
    await this.busd.approve(this.box.address, "1000", { from: this.buyer });
   expectRevert(
      this.box.buyBox(this.buyer, 5),
      "revert allowance is not enough"
    ));
  });

  it("Token balance is not enough", async () => {
    await this.busd.approve(
      this.box.address,
      "100000000000000000000000000000000000",
      { from: this.buyer }
    );
    await expectRevert(
      this.box.buyBox(this.buyer, 10000000)
    );
  });

  //Buy box success
  it("should buy 5 box for first account successfuly", async () => {
    await this.busd.approve(
      this.box.address,
      "100000000000000000000000000000000000",
      { from: this.buyer }
    );
    let result = await this.box.buyBox(this.buyer, 5);

    let account_1_balance = await this.busd.balanceOf(this.buyer);
    console.log("account_1_balance", account_1_balance.toString());
    assert.isTrue(
      account_1_balance.toString() === "99995000000000000000000000"
    );

    let account_0_balance = await this.busd.balanceOf(accounts[0]);
    console.log("account_0_balance", account_0_balance.toString());
    assert.isTrue(
      account_0_balance.toString() === "900005000000000000000000000"
    );

    truffleAssert.eventEmitted(result, "Transfer", (ev) => {
      if (
        ev.to === this.buyer &&
        ev.from.toString() === "0x0000000000000000000000000000000000000000"
      ) {
        boxBoughtOfAccount1.push(ev.tokenId);
      }
      return true;
    });
  });

  //Test case Summon Item
  it("should abort with an Summon Item is not allowed", async () => {
    await catchRevert(this.box.summonItem(1, { from: this.buyer }));
  });

  it("should abort with an sender is not own of tokenId", async () => {
    await this.box.setAllowSummonItem(true);
    expectRevert(
      this.box.summonItem(1, { from: accounts[2] }),
      "revert sender is not own of tokenId"
    );
  });

  it("should abort with an operator query for nonexistent token", async () => {
    await this.box.setAllowSummonItem(true);
    expectRevert(
      this.box.summonItem(10, { from: this.buyer }),
      "revert ERC721: owner query for nonexistent token"
    );
  });

  //Test case Summon Item success
  it("should summon item successfully", async () => {
    await this.box.setAllowSummonItem(true);
    // console.log("boxBoughtOfAccount1[0]:", boxBoughtOfAccount1[0]);
    try {
      let result = await this.box.summonItem(boxBoughtOfAccount1[0].toString(), {
        from: this.buyer,
      });
      truffleAssert.eventEmitted(result, "ItemSummoned", (ev) => {
        console.log(
          "tokenId:" +
            ev.tokenId.toString() +
            " itemTokenId:" +
            ev.itemTokenId.toString() +
            " star:" +
            ev.star
        );
        return true;
      });
    } catch (e) {
      console.error(e);
    }
  });

  //setBaseURI
  it("setBaseURI should abort with an must have admin role", async () => {
    expectRevert(
      this.box.setBaseURI("https://hihi", { from: this.buyer }),
      "revert must have admin role"
    );
  });

  it("setBaseURI should successfully", async () => {
    await this.box.setBaseURI("https://hihi");
  });

  //setAllowSummonItem
  it("setAllowSummonItem should abort with an must have admin role", async () => {
    expectRevert(
      this.box.setAllowSummonItem(false, { from: this.buyer }),
      "revert must have admin role"
    );
  });

  //setReceivedAddress
  it("setReceivedAddress should abort with an _receivedAddress must be not equal address 0x", async () => {
    expectRevert(
      this.box.setReceivedAddress("0x0000000000000000000000000000000000000000", {
        from: this.buyer,
      }),
      "revert _receivedAddress must be not equal address 0x"
    );
  });

  it("setReceivedAddress should abort with an must have admin role", async () => {
    expectRevert(
      this.box.setReceivedAddress(accounts[0], { from: this.buyer }),
      "revert must have admin role"
    );
  });

  it("setReceivedAddress should successfully", async () => {
    await this.box.setReceivedAddress(accounts[0]);
  });

  //setupMinterRole
  it("setupMinterRole should abort with an account must be not equal address 0x", async () => {
    expectRevert(
      this.box.setupMinterRole(
        "0x0000000000000000000000000000000000000000",
        true,
        { from: this.buyer }
      ),
      "revert account must be not equal address 0x"
    );
  });

  it("setupMinterRole should abort with an must have admin role", async () => {
    expectRevert(
      this.box.setupMinterRole(this.buyer, true, { from: this.buyer }),
      "revert must have admin role"
    );
  });

  it("setupMinterRole is true should successfully", async () => {
    await this.box.setupMinterRole(this.buyer, true);
  });

  it("setupMinterRole is false should successfully", async () => {
    await this.box.setupMinterRole(this.buyer, false);
  });
});

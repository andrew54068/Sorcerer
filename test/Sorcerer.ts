import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deploySorcerer() {

  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  const Sorcerer = await ethers.getContractFactory("Sorcerer");
  const sorcerer = await Sorcerer.deploy();

  return { sorcerer, owner, otherAccount };
}

describe("Deployment", function () {
  it("Should deployed contract", async function () {
    const { sorcerer, owner } = await loadFixture(deploySorcerer);

    expect(await sorcerer.owner()).to.equal(owner.address);
  });

});

describe("Token uri", function () {

  it("token uri not set yet", async function () {
    const { sorcerer } = await loadFixture(deploySorcerer);

    let number = ethers.BigNumber.from("1");
    await expect(sorcerer.tokenURI(number)).to.be.reverted;
  });

  it("token uri not set yet", async function () {
    const { sorcerer } = await loadFixture(deploySorcerer);

    let number = ethers.BigNumber.from("0");
    await expect(sorcerer.tokenURI(number)).to.be.reverted;
  });

  it("set base uri", async function () {
    const { sorcerer, otherAccount } = await loadFixture(deploySorcerer);

    let baseURI = "https://gateway.pinata.cloud/ipfs/Qmehf8kSgTondwi7sDpR2kf8zaea1idycRQuVKxEQ2y9oi/"
    expect(await sorcerer.setBaseURI(baseURI));

    expect(await sorcerer.mint(otherAccount.address));
    let number = ethers.BigNumber.from("0");
    expect(await sorcerer.tokenURI(number)).to.equal(baseURI + `${number}`);
  });

});

describe("Generation", function () {

  it("get generation amount", async function () {
    const { sorcerer } = await loadFixture(deploySorcerer);

    expect(await sorcerer.getFirstGenerationAmount()).to.equal(0);
  });

  it("lookup generation", async function () {
    const { sorcerer } = await loadFixture(deploySorcerer);

    expect(await sorcerer.getIsFirstGenerationAmount(1)).to.equal(false);
  });

  it("set generation 1000", async function () {
    const { sorcerer } = await loadFixture(deploySorcerer);

    const number = 1000
    expect(await sorcerer.setFirstGenAmount(number));
    expect(await sorcerer.getFirstGenerationAmount()).to.equal(number);
  });

  it("set generation 2000", async function () {
    const { sorcerer } = await loadFixture(deploySorcerer);

    const number = 2000
    expect(await sorcerer.setFirstGenAmount(number));
    expect(await sorcerer.getFirstGenerationAmount()).to.equal(number);
  });

  it("set generation 1 and verify", async function () {
    const { sorcerer, otherAccount } = await loadFixture(deploySorcerer);

    const number = 1
    expect(await sorcerer.setFirstGenAmount(number));
    expect(await sorcerer.getFirstGenerationAmount()).to.equal(number);

    expect(await sorcerer.mint(otherAccount.address));
    expect(await sorcerer.getIsFirstGenerationAmount(0)).to.equal(true);

    expect(await sorcerer.mint(otherAccount.address));
    expect(await sorcerer.getIsFirstGenerationAmount(1)).to.equal(false);
  });

});

describe("Approved", function () {

  it("isApprovedForAll", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);

    expect(await sorcerer.isApprovedForAll(owner.address, owner.address)).to.equal(false);
  });

  it("set ApprovedForAll to self", async function () {
    const { sorcerer, owner } = await loadFixture(deploySorcerer);

    await expect(sorcerer.setApprovalForAll(owner.address, true)).to.be.reverted;
  });

  it("set ApprovedForAll", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);

    expect(await sorcerer.isApprovedForAll(owner.address, otherAccount.address)).to.equal(false);
    expect(await sorcerer.setApprovalForAll(otherAccount.address, true));
    expect(await sorcerer.isApprovedForAll(owner.address, otherAccount.address)).to.equal(true);
  });

  it("opensea proxy contract ApprovedForAll", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);

    const openseaProxyContract = "0x58807baD0B376efc12F5AD86aAc70E78ed67deaE"
    expect(await sorcerer.isApprovedForAll(owner.address, openseaProxyContract)).to.equal(true);
    expect(await sorcerer.isApprovedForAll(otherAccount.address, openseaProxyContract)).to.equal(true);
  });


});

describe("mint", function () {

  it("owner mint", async function () {
    const { sorcerer, otherAccount } = await loadFixture(deploySorcerer);
    expect(await sorcerer.mint(otherAccount.address));
  });

  it("others mint", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);
    const sorcerer2 = sorcerer.connect(otherAccount)
    await expect(sorcerer2.mint(otherAccount.address, { from: otherAccount.address })).to.be.reverted;
  });

});

describe("balance", function () {

  it("balanceOf", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);
    expect(await sorcerer.balanceOf(otherAccount.address)).to.equal(0);
    expect(await sorcerer.mint(otherAccount.address));
    expect(await sorcerer.balanceOf(otherAccount.address)).to.equal(1);
    expect(await sorcerer.mint(otherAccount.address));
    expect(await sorcerer.balanceOf(otherAccount.address)).to.equal(2);
  });

});


describe("burn", function () {

  it("burn token by other reverted", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);
    expect(await sorcerer.balanceOf(otherAccount.address)).to.equal(0);
    expect(await sorcerer.mint(otherAccount.address));

    await expect(sorcerer.burn(0)).to.be.reverted;
  });

  it("burn token by other passed", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);
    expect(await sorcerer.balanceOf(otherAccount.address)).to.equal(0);
    expect(await sorcerer.mint(otherAccount.address));

    const sorcerer2 = sorcerer.connect(otherAccount);
    expect(await sorcerer2.setApprovalForAll(owner.address, true));

    const index = 0;
    await expect(sorcerer.burn(index))
      .to.emit(sorcerer, "burnToken(address,address,uint256)")
      .withArgs(owner.address, otherAccount.address, index);
  });

  it("burn token by self", async function () {
    const { sorcerer, owner, otherAccount } = await loadFixture(deploySorcerer);
    expect(await sorcerer.balanceOf(otherAccount.address)).to.equal(0);
    expect(await sorcerer.mint(otherAccount.address));

    const sorcerer2 = sorcerer.connect(otherAccount);
    const index = 0;
    await expect(sorcerer2.burn(index))
      .to.emit(sorcerer2, "burnToken(address,address,uint256)")
      .withArgs(otherAccount.address, otherAccount.address, index);

    expect(await sorcerer.balanceOf(otherAccount.address)).to.equal(0);
  });

});
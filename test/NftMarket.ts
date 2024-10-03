const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketHub", function () {
  async function deployNFTMarketHubFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const NFTMarketHub = await ethers.getContractFactory("NFTMarketHub");
    const nftMarketHub = await NFTMarketHub.deploy();
    await nftMarketHub.waitForDeployment();

    // // Send 1 ETH to the contract
    // await owner.sendTransaction({
    //   to: nftMarketHub.address,
    //   value: ethers.utils.parseEther("1.0")
    // });

    return { nftMarketHub, owner, addr1, addr2 };
  }
  it("Should deploy the contract", async function () {
    const { nftMarketHub } = await loadFixture(deployNFTMarketHubFixture);
    expect(nftMarketHub.address).to.be.properAddress;
  });

  it("Should set the right owner", async function () {
    const { nftMarketHub, owner } = await loadFixture(deployNFTMarketHubFixture);
    expect(await nftMarketHub.owner()).to.equal(owner.address);
  });

  
  it("Should mint an NFT", async function () {
    const { nftMarketHub, addr1 } = await loadFixture(deployNFTMarketHubFixture);
    await nftMarketHub.connect(addr1).mintNFT("tokenURI");
    expect(await nftMarketHub.ownerOf(1)).to.equal(addr1.address);
  });

  it("Should list an NFT", async function () {
    const { nftMarketHub, addr1 } = await loadFixture(deployNFTMarketHubFixture);
    await nftMarketHub.connect(addr1).mintNFT("tokenURI");
    await nftMarketHub.connect(addr1).listNFT(1, ethers.parseEther("1"));
    const nft = await nftMarketHub.nfts(1);
    expect(nft.price).to.equal(ethers.parseEther("1"));
    expect(nft.isListed).to.be.true;
  });

  it("Should buy an NFT", async function () {
    const { nftMarketHub, addr1, addr2 } = await loadFixture(deployNFTMarketHubFixture);
    await nftMarketHub.connect(addr1).mintNFT("tokenURI");
    await nftMarketHub.connect(addr1).listNFT(1, ethers.parseEther("1"));
    await nftMarketHub.connect(addr2).buyNFT(1, { value: ethers.parseEther("1") });
    expect(await nftMarketHub.ownerOf(1)).to.equal(addr2.address);
  });

  it("Should delist an NFT", async function () {
    const { nftMarketHub, addr1 } = await loadFixture(deployNFTMarketHubFixture);
    await nftMarketHub.connect(addr1).mintNFT("tokenURI");
    await nftMarketHub.connect(addr1).listNFT(1, ethers.parseEther("1"));
    await nftMarketHub.connect(addr1).delistNFT(1);
    const nft = await nftMarketHub.nfts(1);
    expect(nft.isListed).to.be.false;
  });

  it("Should revert when non-owner tries to list NFT", async function () {
    const { nftMarketHub, addr1, addr2 } = await loadFixture(deployNFTMarketHubFixture);
    await nftMarketHub.connect(addr1).mintNFT("tokenURI");
    await expect(nftMarketHub.connect(addr2).listNFT(1, ethers.parseEther("1")))
      .to.be.revertedWithCustomError(nftMarketHub, "NotOwner");
  });

  it("Should revert when buying with insufficient funds", async function () {
    const { nftMarketHub, addr1, addr2 } = await loadFixture(deployNFTMarketHubFixture);
    await nftMarketHub.connect(addr1).mintNFT("tokenURI");
    await nftMarketHub.connect(addr1).listNFT(1, ethers.parseEther("1"));
    await expect(nftMarketHub.connect(addr2).buyNFT(1, { value: ethers.parseEther("0.5") }))
      .to.be.revertedWithCustomError(nftMarketHub, "InsufficientFunds");
  });

  it("Should allow owner to withdraw funds", async function () {
    const { nftMarketHub, owner } = await loadFixture(deployNFTMarketHubFixture);

    // Verify the contract has funds before withdrawal
    const contractBalance = await ethers.provider.getBalance(nftMarketHub.address);
    expect(contractBalance).to.equal(ethers.utils.parseEther("1.0"));

    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
    // Perform the withdrawal
    const tx = await nftMarketHub.withdrawFunds();
    const receipt = await tx.wait();

    // Calculate gas cost
    const gasCost = receipt.gasUsed.mul(tx.gasPrice);
    
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
    
    // Check that the owner's balance increased by approximately 1 ETH (minus gas costs)
    expect(finalOwnerBalance).to.be.closeTo(
      initialOwnerBalance.add(ethers.utils.parseEther("1.0")).sub(gasCost),
      ethers.utils.parseEther("0.01") // Allow for some deviation due to gas costs
    );

    // Verify the contract balance is now 0
    const finalContractBalance = await ethers.provider.getBalance(nftMarketHub.address);
    expect(finalContractBalance).to.equal(0);
  });

});
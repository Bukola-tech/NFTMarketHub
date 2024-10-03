// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTMarketHubModule = buildModule("NFTMarketHubModule", (m) => {
  const nftMarketHub = m.contract("NFTMarketHub");

  return { nftMarketHub };
});

export default NFTMarketHubModule;
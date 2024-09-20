// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MarketplaceErrors, MarketplaceEvents, MarketplaceLib} from "./Library.sol";

contract NFTMarketHub is ERC721URIStorage, Ownable, ReentrancyGuard {
    using MarketplaceLib for mapping(uint256 => MarketplaceLib.NFT);

    mapping(uint256 => MarketplaceLib.NFT) public nfts;
    uint256 private _nextTokenId;

    constructor() ERC721("NFTMarketHub", "NMH") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    function mintNFT(string memory tokenURI) external {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        nfts[tokenId] = MarketplaceLib.NFT(tokenId, 0, msg.sender, false);
        emit MarketplaceEvents.NFTMinted(tokenId, msg.sender);
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        if (ownerOf(tokenId) != msg.sender) revert MarketplaceErrors.NotOwner();
        nfts.listNFT(tokenId, price, msg.sender);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        (address seller, uint256 price) = nfts.buyNFT(tokenId, msg.sender);
        if (msg.value < price) revert MarketplaceErrors.InsufficientFunds();

        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(price);

        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    function delistNFT(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert MarketplaceErrors.NotOwner();
        nfts.delistNFT(tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://api.nfthub.com/metadata/";
    }

    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
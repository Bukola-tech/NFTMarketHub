// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

library MarketplaceErrors {
    error NotOwner();
    error NotListed();
    error AlreadyListed();
    error InsufficientFunds();
    error PriceMustBeAboveZero();
}

library MarketplaceEvents {
    event NFTMinted(uint256 indexed tokenId, address indexed owner);
    event NFTListed(uint256 indexed tokenId, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event NFTDelisted(uint256 indexed tokenId);
}

library MarketplaceLib {
    struct NFT {
        uint256 tokenId;
        uint256 price;
        address owner;
        bool isListed;
    }

    function listNFT(mapping(uint256 => NFT) storage nfts, uint256 tokenId, uint256 price, address owner) internal {
        if (price == 0) revert MarketplaceErrors.PriceMustBeAboveZero();
        if (nfts[tokenId].isListed) revert MarketplaceErrors.AlreadyListed();

        nfts[tokenId].price = price;
        nfts[tokenId].isListed = true;
        nfts[tokenId].owner = owner;

        emit MarketplaceEvents.NFTListed(tokenId, price);
    }

    function delistNFT(mapping(uint256 => NFT) storage nfts, uint256 tokenId) internal {
        if (!nfts[tokenId].isListed) revert MarketplaceErrors.NotListed();

        nfts[tokenId].isListed = false;
        nfts[tokenId].price = 0;

        emit MarketplaceEvents.NFTDelisted(tokenId);
    }

    function buyNFT(mapping(uint256 => NFT) storage nfts, uint256 tokenId, address buyer) internal returns (address seller, uint256 price) {
        NFT storage nft = nfts[tokenId];
        if (!nft.isListed) revert MarketplaceErrors.NotListed();

        seller = nft.owner;
        price = nft.price;

        nft.owner = buyer;
        nft.isListed = false;
        nft.price = 0;

        emit MarketplaceEvents.NFTSold(tokenId, buyer, price);
    }
}
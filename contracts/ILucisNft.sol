// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface ILucisNft {
    struct Item {
        uint256 character;
        uint256 rarity;
        uint256 level;
        uint256 elemental;
        uint256 costume;
        uint256 hat;
        uint256 weapon;
        uint256 glasses;
    }

    event ItemMinted(
        uint256 tokenId,
        uint256 character,
        uint256 rarity,
        uint256 level,
        uint256 elemental,
        uint256 costume,
        uint256 hat,
        uint256 weapon,
        uint256 glasses
    );

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );

    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    function balanceOf(address owner) external view returns (uint256 balance);

    function ownerOf(uint256 tokenId) external view returns (address owner);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function approve(address to, uint256 tokenId) external;

    function getApproved(uint256 tokenId)
        external
        view
        returns (address operator);

    function setApprovalForAll(address operator, bool _approved) external;

    function isApprovedForAll(address owner, address operator)
        external
        view
        returns (bool);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external;

    function tokenDetail(uint256 tokenId) external view returns (Item memory);

    function mintToken(
        address toAddress,
        uint256 character,
        uint256 rarity,
        uint256 level,
        uint256 elemental,
        uint256 costume,
        uint256 hat,
        uint256 weapon,
        uint256 glasses
    ) external returns (uint256);
}

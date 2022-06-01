// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";

contract LucisNFT is
    Context,
    AccessControl,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Item {
        uint256 character;
        uint256 costume;
        uint256 hat;
        uint256 weapon;
        uint256 glasses;
        uint256 background;
        uint256 level;
        uint256 factor;
        uint256 halo;
    }

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    // Mapping from token ID to token data
    mapping(uint256 => Item) private _tokenDetail;
    string private _baseTokenURI = "";

    event ItemMinted(
        uint256 tokenId,
        uint256 character,
        uint256 costume,
        uint256 hat,
        uint256 weapon,
        uint256 glasses,
        uint256 background,
        uint256 level,
        uint256 factor,
        uint256 halo
    );

    constructor() ERC721("Lucis NFT", "LCN") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());

        _tokenIdTracker.increment();
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseTokenURI) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "must have admin role"
        );
        _baseTokenURI = baseTokenURI;
    }

    function setupMinterRole(address account, bool _enable) external {
        require(account != address(0), "account must be not equal address 0x");
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "must have admin role"
        );
        if (_enable) {
            _setupRole(MINTER_ROLE, account);
        } else {
            _revokeRole(MINTER_ROLE, account);
        }
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        string memory currentBaseUri = _baseURI();
        return
            bytes(currentBaseUri).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseUri,
                        Strings.toString(tokenId),
                        ".json"
                    )
                )
                : "";
    }

    function tokenDetail(uint256 tokenId) external view returns (Item memory) {
        return _tokenDetail[tokenId];
    }

    function mintToken(
        address toAddress,
        uint256 character,
        uint256 costume,
        uint256 hat,
        uint256 weapon,
        uint256 glasses,
        uint256 background,
        uint256 level,
        uint256 factor,
        uint256 halo
    ) external returns (uint256) {
        require(hasRole(MINTER_ROLE, _msgSender()), "NEED_MINTER_ROLE");
        require(toAddress != address(0), "ZERO_ADDRESS");
        require(character >= 0 && character < 12, "CHARACTER_INVALID");
        require(costume >= 0 && costume < 12, "COSTUME_INVALID");
        require(hat >= 0 && hat < 12, "HAT_INVALID");
        require(weapon >= 0 && weapon < 12, "WEAPON_INVALID");
        require(glasses >= 0 && glasses < 6, "GLASSES_INVALID");
        require(background >= 0 && background < 7, "BACKGROUND_INVALID");
        require(level >= 0 && level < 6, "LEVEL_INVALID");
        require(factor >= 0 && factor < 6, "FACTOR_INVALID");
        require(halo >= 0 && halo < 4, "HALO_INVALID");

        uint256 _tokenId = _tokenIdTracker.current();
        _mint(toAddress, _tokenId);
        _tokenIdTracker.increment();
        _tokenDetail[_tokenId] = Item(
            character,
            costume,
            hat,
            weapon,
            glasses,
            background,
            level,
            factor,
            halo
        );

        emit ItemMinted(
            _tokenId,
            character,
            costume,
            hat,
            weapon,
            glasses,
            background,
            level,
            factor,
            halo
        );
        return _tokenId;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

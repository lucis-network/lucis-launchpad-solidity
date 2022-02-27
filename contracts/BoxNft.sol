// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IGameNft.sol";

contract BoxNft is
Context,
AccessControlEnumerable,
ERC721Enumerable,
ERC721Burnable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI = "";
    uint256 private nonce = 0;

    IERC20 private paymentToken;
    address private receiveAddress;
    uint256 private price;
    // mapping(uint => uint256) private prices;

    bool private allowSummonItem = false;

    event ItemSummoned(uint256 tokenId);

    constructor(
        address _paymentTokenAddress,
        address _receiveAddress,
        uint256 _price
    ) ERC721("Game Box NFT", "GBN") {

        paymentToken = IERC20(_paymentTokenAddress);
        receiveAddress = _receiveAddress;
        price = _price;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());

        _tokenIdTracker.increment();

    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseTokenURI) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "must have admin role");
        _baseTokenURI = baseTokenURI;
    }

    function setAllowSummonItem(bool _allowSummonItem) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "must have admin role");
        allowSummonItem = _allowSummonItem;
    }

    function setReceivedAddress(address _receivedAddress) external {
        require(_receivedAddress != address(0), "_receivedAddress must != 0x");
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "must have admin role");
        receiveAddress = _receivedAddress;
    }

    function setupMinterRole(address account, bool _enable) external {
        require(account != address(0), "account must != 0x");
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "must have admin role");
        if (_enable) {
            _setupRole(MINTER_ROLE, account);
        }
        else {
            _revokeRole(MINTER_ROLE, account);
        }
    }

    function buyBox(address toAddress, uint256 quantity) external {
        require(hasRole(MINTER_ROLE, _msgSender()), "must have minter role");
        require(toAddress != address(0), "could not mint to zero address");
        require(quantity > 0, "quantity must be greater than 0");

        // check approve
        uint256 payAmount = price * quantity;

        uint256 approveAmount = paymentToken.allowance(toAddress, address(this));
        require(approveAmount >= payAmount, "allowance is not enough");

        uint256 tokenBalance = paymentToken.balanceOf(toAddress);
        require(tokenBalance >= payAmount, "token balance is not enough");

        paymentToken.transferFrom(toAddress, receiveAddress, payAmount);

        for (uint256 i = 0; i < quantity; i++) {
            _mint(toAddress, _tokenIdTracker.current());
            _tokenIdTracker.increment();
        }
    }

    function summonItem(uint256 tokenId) external {
        require(allowSummonItem, "Summon Item is not allowed");
        // check owner of tokenId
        require(ERC721.ownerOf(tokenId) == msg.sender, "sender is not owner of tokenId");
        ERC721Burnable.burn(tokenId);
        emit ItemSummoned(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {

    }

    /**
    * @dev See {IERC165-supportsInterface}.
    */
    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(AccessControlEnumerable, ERC721, ERC721Enumerable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

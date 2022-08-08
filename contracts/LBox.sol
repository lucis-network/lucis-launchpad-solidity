// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./ILucisNft.sol";

contract LBox is Context, AccessControl, ERC1155Burnable, ERC1155Pausable {
    // using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant LUCIS_BOX_ITEM = 1;

    IERC20 private paymentToken;
    address private receiveAddress;
    ILucisNft private lucisNft;

    bool private allowSummonItem = false;
    uint256 private nonce = 0;

    uint256[] private charRates;
    uint256[] private rarityRates;
    uint256[] private levelRates;
    uint256[] private elementalRates;

    uint256[] private costumeRates;
    uint256[] private hatRates;
    uint256[] private weaponRates;
    uint256[] private glassesRates;

    event ItemSummoned(
        uint256 itemTokenId,
        uint256 character,
        uint256 rarity,
        uint256 level,
        uint256 elemental,
        uint256 costume,
        uint256 hat,
        uint256 weapon,
        uint256 glasses
    );

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "LBox: Must have admin role"
        );
        _;
    }

    constructor(address _paymentTokenAddress, address _receiveAddress, string memory uri)
        ERC1155(uri)
    {
        paymentToken = IERC20(_paymentTokenAddress);
        receiveAddress = _receiveAddress;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());

    }


    function updateBox(
        uint256[] memory _charRates,
        uint256[] memory _rarityRates,
        uint256[] memory _levelRates,
        uint256[] memory _elementalRates,
        uint256[] memory _costumeRates,
        uint256[] memory _hatRates,
        uint256[] memory _weaponRates,
        uint256[] memory _glassesRates
    ) external onlyAdmin {
        charRates = _charRates;
        rarityRates = _rarityRates;
        levelRates = _levelRates;
        elementalRates = _elementalRates;

        costumeRates = _costumeRates;
        hatRates = _hatRates;
        weaponRates = _weaponRates;
        glassesRates = _glassesRates;
    }

    function buyBox(
        address toAddress,
        uint256 price,
        uint256 quantity
    ) external onlyAdmin {
        require(toAddress != address(0), "ZERO_ADDRESS");
        require(quantity > 0, "QUANTITY_INVALID");
        require(price > 0, "price not set");

        // check approve
        uint256 payAmount = price * quantity;

        uint256 approveAmount = paymentToken.allowance(
            toAddress,
            address(this)
        );
        require(approveAmount >= payAmount, "NEED_APPROVE");

        uint256 tokenBalance = paymentToken.balanceOf(toAddress);
        require(tokenBalance >= payAmount, "BALANCE_NOT_ENOUGH");

        paymentToken.transferFrom(toAddress, receiveAddress, payAmount);

        _mint(toAddress, LUCIS_BOX_ITEM, quantity, "");
    }

    function _random() private returns (uint256) {
        nonce += 1;
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        nonce,
                        block.difficulty,
                        block.timestamp,
                        blockhash(block.number - 1)
                    )
                )
            );
    }

    function _randomFrom(uint256[] memory rates) private returns (uint256) {
        uint256 totalRates = 0;
        for (uint256 idx = 0; idx < rates.length; idx++) {
            totalRates += rates[idx];
        }
        uint256 randRate = _random() % totalRates;
        uint256 ratePartition = 0;
        for (uint256 idx = 0; idx < rates.length; idx++) {
            ratePartition += rates[idx];
            if (randRate < ratePartition) {
                return idx;
            }
        }
        return 0;
    }

    function summonItem() external returns (uint256){
        require(allowSummonItem, "NOT_ALLOWED");
        // check owner of tokenId
        require(ERC1155.balanceOf(msg.sender, LUCIS_BOX_ITEM) > 0, "LBox: box is zero");

        uint256 _character = _randomFrom(charRates);
        uint256 _rarity = _randomFrom(rarityRates);
        uint256 _level = _randomFrom(levelRates);
        uint256 _elemental = _randomFrom(elementalRates);

        uint256 _costume = _randomFrom(costumeRates);
        uint256 _hat = _randomFrom(hatRates);
        uint256 _weapon = _randomFrom(weaponRates);
        uint256 _glasses = _randomFrom(glassesRates);

        uint256 _itemTokenId = lucisNft.mintToken(
            msg.sender,
            _character,
            _rarity,
            _level,
            _elemental,
            _costume,
            _hat,
            _weapon,
            _glasses
        );

        ERC1155Burnable.burn(msg.sender, LUCIS_BOX_ITEM, 1);
        emit ItemSummoned(
            _itemTokenId,
            _character,
            _rarity,
            _level,
            _elemental,
            _costume,
            _hat,
            _weapon,
            _glasses
        );

        return _itemTokenId;
    }

    function setInitNone(uint256 value) external onlyAdmin {
        nonce = value;
    }


    function setURI(string memory newUri) external onlyAdmin {
        ERC1155._setURI(newUri);
    }

    function setAllowSummonItem(bool _allowSummonItem) external onlyAdmin {
        allowSummonItem = _allowSummonItem;
    }

    function updateNftContract(address _nftAddress) external onlyAdmin {
        require(_nftAddress != address(0), "ADDRESS_INVALID");
        lucisNft = ILucisNft(_nftAddress);
    }

    function setReceivedAddress(address _receivedAddress) external onlyAdmin {
        require(_receivedAddress != address(0), "ADDRESS_INVALID");

        receiveAddress = _receivedAddress;
    }

    function setupMinterRole(address account, bool _enable) external onlyAdmin {
        require(account != address(0), "ADDRESS_INVALID");

        if (_enable) {
            _setupRole(MINTER_ROLE, account);
        } else {
            _revokeRole(MINTER_ROLE, account);
        }
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Pausable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

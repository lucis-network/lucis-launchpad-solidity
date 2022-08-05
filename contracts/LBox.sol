// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "./ILucisNft.sol";

contract LBox is Context, AccessControl, ERC721Burnable, ERC721Pausable {
    // using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdTracker;

    IERC20 private paymentToken;
    address private receiveAddress;
    ILucisNft private lucisNft;

    mapping(string => uint256) private prices;
    mapping(string => uint256) private availables;

    bool private allowSummonItem = false;
    uint256 private nonce = 0;
    string private _baseTokenURI = "";

    uint256[] private charRates;
    uint256[] private rarityRates;
    uint256[] private levelRates;
    uint256[] private elementalRates;

    uint256[] private costumeRates;
    uint256[] private hatRates;
    uint256[] private weaponRates;
    uint256[] private glassesRates;

    event ItemSummoned(
        uint256 tokenId,
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
            "LUcis NFT: Must have admin role"
        );
        _;
    }

    constructor(address _paymentTokenAddress, address _receiveAddress)
        ERC721("LUCIS Box NFT", "LBN")
    {
        paymentToken = IERC20(_paymentTokenAddress);
        receiveAddress = _receiveAddress;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());

        _tokenIdTracker.increment();
    }

    function allocBox(
        string[] memory boxType,
        uint256[] memory _prices,
        uint256[] memory _qtys
    ) external onlyAdmin {
        _allocBox(boxType, _prices, _qtys);
    }

    function _allocBox(
        string[] memory boxType,
        uint256[] memory _prices,
        uint256[] memory _qtys
    ) private {
        for (uint256 i = 0; i < boxType.length; i++) {
            prices[boxType[i]] = _prices[i];
            availables[boxType[i]] = _qtys[i];
        }
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
        rarityRates = rarityRates;
        levelRates = _levelRates;
        elementalRates = _elementalRates;

        costumeRates = _costumeRates;
        hatRates = _hatRates;
        weaponRates = _weaponRates;
        glassesRates = _glassesRates;
        backgroundRates = _backgroundRates;
        levelRates = _levelRates;
        factorRates = _factorRates;
        hatRates = _haloRates;
    }

    function buyBox(
        address toAddress,
        string memory boxType,
        uint256 quantity
    ) external {
        require(toAddress != address(0), "ZERO_ADDRESS");
        require(quantity > 0, "QUANTITY_INVALID");
        uint256 price = prices[boxType];
        require(price > 0, "price not set");

        uint256 _available = availables[boxType];
        require((_available - quantity) > 0, "QUANTITY_THRESHOLD");

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

        for (uint256 i = 0; i < quantity; i++) {
            _mint(toAddress, _tokenIdTracker.current());
            _tokenIdTracker.increment();
            availables[boxType] -= quantity;
        }
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

    function summonItem(uint256 tokenId) external {
        require(allowSummonItem, "NOT_ALLOWED");
        // check owner of tokenId
        require(ERC721.ownerOf(tokenId) == msg.sender, "NOT_PERMISSION");

        uint256 _character = _randomFrom(charRates);
        uint256 _rarity = _randomFrom(rarityRates);
        uint256 _level = _randomFrom(levelRates);
        uint256 _elemental = _randomFrom(elementalRates);

        uint256 _costume = _randomFrom(costumeRates);
        uint256 _hat = _randomFrom(hatRates);
        uint256 _weapon = _randomFrom(weaponRates);
        uint256 _glasses = _randomFrom(glassesRates);
        uint256 _background = _randomFrom(backgroundRates);
        uint256 _level = _randomFrom(levelRates);
        uint256 _factor = _randomFrom(factorRates);
        uint256 _halo = _randomFrom(haloRates);

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

        ERC721Burnable.burn(tokenId);
        emit ItemSummoned(
            tokenId,
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
    }

    function setInitNone(uint256 value) external onlyAdmin {
        nonce = value;
    }

    function getPrices(string calldata boxType)
        external
        view
        returns (uint256)
    {
        return prices[boxType];
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseTokenURI) external onlyAdmin {
        _baseTokenURI = baseTokenURI;
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
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

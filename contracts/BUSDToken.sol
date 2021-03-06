// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";


contract BUSDToken is ERC20Burnable {
    constructor() ERC20("BUSD", "BUSD") {
        _mint(_msgSender(), 10**9 * 10**18);
    }
}

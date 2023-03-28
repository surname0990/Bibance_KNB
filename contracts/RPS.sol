// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RPS {
    enum State {
        WIN,
        DEFEAT,
        DRAW
    }

    // TODO
    struct History {
        State state;
        uint256 money;
    }

    mapping(address => History[]) history;

    uint8 free = 0;
    uint256 minPrice = 10 ** 14;

    event Game(uint8 indexed my, uint8 indexed pc, State indexed state, address player, uint256 amount);

    modifier minBid() {
        require(msg.value > minPrice, "Min 0.0001 tBNB");
        _;
    }

    modifier onlyOption(uint8 option) {
        require(option <= 2, "only 0-2");
        _;
    }

    function play(uint8 option) public payable minBid onlyOption(option) {
        uint256 output = (msg.value * 2 * (100 - free)) / 100;
        require(address(this).balance >= output, "bankrupt");

        uint256 output1;

        uint8 randomResult = random();
        State state;

        if (randomResult == option) {
            output1 = output / 2;
            payable(msg.sender).transfer(output1);

            state = State.DRAW;
        } else if ((randomResult + 1) % 3 == option) {
            output1 = output;
            payable(msg.sender).transfer(output1);

            state = State.WIN;
        } else {
            state = State.DEFEAT;
        }

        History memory h;
        h.state = state;
        h.money = output;

        history[msg.sender].push(h);
        emit Game(option, randomResult, state, msg.sender, output);
    }

    // VRF
    function random() public view returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(block.timestamp))) % 3);
    }

    function getHistory() public view returns (History[] memory) {
        return history[msg.sender];
    }

    receive() external payable {}
}

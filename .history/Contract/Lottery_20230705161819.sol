// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract Lottery { 

    event NoWinner(string message);
    event PlayerEntered(address player);
    event WinnerPicked(address winner);
    event remainingTickets(uint tickets); 
    event itemBids(uint bids); 
    event OwnershipTransferred(address previousOwner, address newOwner);

    struct Person {
        uint personId;
        address addr;
        uint remainingTickets;
    }

    struct Item {
        uint itemId;
        uint itemTickets;
        address[] bidders;

    }

    address public owner;
    Item [3] public items;
    address[3] public winners;
    Person[] public bidders ;
    uint bidderCount = 0;
    mapping(address => Person) ticketDetails;
    uint public constant ticket = 0.01 ether;    
    address public allowedAddress;

    modifier onlyAllowedAddresses() {
        require(msg.sender == allowedAddress || msg.sender == owner , "Only the allowed addresses can call this function.");
        _;
    }

    constructor() {
        
        owner = msg.sender;
        allowedAddress = 0x153dfef4355E823dCB0FCc76Efe942BefCa86477;

        items[0] = Item({itemId:0, itemTickets:0, bidders: new address[](0)});
        items[1] = Item({itemId:1, itemTickets:0, bidders: new address[](0)});
        items[2] = Item({itemId:2, itemTickets:0, bidders: new address[](0)});
    }

    function getTickets(uint num_of_tickets) public payable {
        require(msg.value >= 0.01 ether, "Insufficient payment");
        require(msg.sender != owner, "Owner cannot participate ");


        if( ticketDetails[msg.sender].addr == address(0) ){
                bidders.push(Person({
                personId: bidderCount,
                addr: msg.sender,
                remainingTickets: num_of_tickets
            }));
            emit remainingTickets(ticketDetails[msg.sender].remainingTickets);
            ticketDetails[msg.sender] = bidders[bidderCount];
            bidderCount++;
        }else{

            uint bidderIndex = ticketDetails[msg.sender].personId;
            bidders[bidderIndex].remainingTickets += num_of_tickets;
            ticketDetails[msg.sender].remainingTickets += num_of_tickets;
            emit remainingTickets(ticketDetails[msg.sender].remainingTickets);
        
        }

    }

    function bid(uint _itemId, uint _count) public payable {
        require(msg.sender != owner, "Owner cannot participate ");
        
        ticketDetails[msg.sender].remainingTickets -= _count;
        uint bidderIndex = ticketDetails[msg.sender].personId;

        bidders[bidderIndex].remainingTickets -= _count;
        
        items[_itemId].itemTickets += _count;  

        items[_itemId].bidders.push(msg.sender);

        emit PlayerEntered(msg.sender);
        emit remainingTickets(ticketDetails[msg.sender].remainingTickets);    
        emit itemBids(items[_itemId].itemTickets); 

    }

    function random() private view returns (uint) {
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.timestamp
                )
            )
        );
        
        return randomNumber;

    }

    function pickWinner() public onlyAllowedAddresses {
        for (uint i = 0; i < 3; i++) {
            if (items[i].itemTickets == 0) {
                emit NoWinner("No winner found for the item");
            } else {
                uint randomIndex = random() % items[i].bidders.length;
                winners[i] = items[i].bidders[randomIndex];
                
                emit WinnerPicked(winners[i]);
                
            }
        }
        //reset only items and bidders to keep the last winners
        for (uint i = 0; i < 3; i++) {
            items[i] = Item({itemId: i, itemTickets: 0, bidders: new address[](0)});
        }

        for (uint i = 0; i < bidderCount; i++) {
            delete ticketDetails[bidders[i].addr];
        }
        delete bidders;
        bidderCount = 0;
        
        emit PlayerEntered(msg.sender);
        emit remainingTickets(ticketDetails[msg.sender].remainingTickets);    
         
    }


    function withdraw() public onlyAllowedAddresses {
        uint balance = address(this).balance;
        require(balance > 0, "Contract has no balance to withdraw.");
        payable(msg.sender).transfer(balance);
    }

    function reset() public onlyAllowedAddresses {

        // Reset items
        for (uint i = 0; i < 3; i++) {
            items[i] = Item({itemId: i, itemTickets: 0, bidders: new address[](0)});
        }

        // Reset bidders
        for (uint i = 0; i < bidderCount; i++) {
            delete ticketDetails[bidders[i].addr];
        }
        delete bidders;
        bidderCount = 0;
 
        // Reset winners
        delete winners;

    }

    function transferOwnership(address newOwner) public onlyAllowedAddresses{
        owner = newOwner;
        emit OwnershipTransferred(owner, newOwner);
    }

    function getPlayers() public view returns (address[] memory) {
        address[] memory players = new address[](bidderCount);
        for (uint i = 0; i < bidderCount; i++) {
            players[i] = bidders[i].addr;
        }
        return players;
    }

    function getItemBids(uint _itemId) public view returns (uint) {
        return items[_itemId].itemTickets;
    }

    function getRemainingTickets(address bidderAddress) public view returns (uint) {
        require(bidderAddress != address(0), "Invalid bidder address");
        return ticketDetails[bidderAddress].remainingTickets;
    }

    function getItemBidders(uint _itemId) public view returns (address[] memory) {
        return items[_itemId].bidders;
    }

    function getWinners() public view returns (address[3] memory) {
        return winners;
    }

    function isWinner() public view returns (bool) {
        for (uint i = 0; i < 3; i++) {
            if (msg.sender == winners[i]) {
                return true;
            }
        }
        return false;
    }

     function destroyContract() public onlyAllowedAddresses {
        selfdestruct(payable(owner));
    }

}
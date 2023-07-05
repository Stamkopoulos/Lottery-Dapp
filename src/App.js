import React, { Component } from "react";
import web3 from "./web3";
import lottery from "./lottery";
import Item1Photo from "./Images/item1.jpg";
import Item2Photo from "./Images/item2.jpg";
import Item3Photo from "./Images/item3.jpg";

import "./App.css";
import "bootstrap/dist/css/bootstrap.css";
// Η κλάση App αποτελεί απόγονο της Component
// η οποία είναι θεμελιώδης στην react.
// Σε κάθε αλλαγή κάποιου στοιχείου εντός της App,
// π.χ. πληκτρολογώντας εντός ενός textBox,
// ή αν τροποποιηθεί κάποια μεταβλητή state,
// όλη η ιστοσελίδα (HTML) γίνεται refresh
// καλώντας αυτόματα τη render()...
// ...ΠΡΟΣΟΧΗ! ΔΕΝ γίνεται reload... ΜΟΝΟ refresh
class App extends Component {
  state = {
    owner: "",
    manager: "",
    players: [],
    balance: "",
    message: "",
    currentPlayer: "",
    selectedItem: null,
    itemBids: [],
    winners: [],
    isWinner: "",
    remainingTickets: "",
    lastWinner: "",
    newOwner: "",
  };

  async componentDidMount() {
    window.ethereum.on("accountsChanged", (accounts) => {
      // ... να γίνεται reload η σελίδα, δηλ. να καλείται η componentDidMount()
      window.location.reload();
    });

    const players = await lottery.methods.getPlayers().call();
    const contractOwner = await lottery.methods.owner().call();
    const balance = await web3.eth.getBalance(lottery.options.address);
    const accounts = await web3.eth.getAccounts();
    const currentAccount = accounts[0];
    const winners = await lottery.methods.getWinners().call();
    const remainingTickets = await lottery.methods
      .getRemainingTickets(currentAccount)
      .call();
    const itemBids = [];
    for (var i = 0; i < 3; i++) {
      const bid = await lottery.methods.getItemBids(i).call();
      //itemBids.push(bid);
      itemBids[i] = bid;
    }

    this.setState({
      owner: contractOwner,
      players,
      contractOwner,
      accounts,
      currentAccount,
      balance,
      remainingTickets,
      itemBids,
      winners,
      message: "Data loaded!",
    });
  }
  onSubmit = async (event) => {
    event.preventDefault();
    this.setState({ message: "Waiting on transaction success..." });

    const numTickets = parseInt(this.state.value, 10);
    const paymentAmount = numTickets * 0.01;

    await lottery.methods.getTickets(numTickets).send({
      from: this.state.currentAccount,
      value: web3.utils.toWei(paymentAmount.toString(), "ether"),
    });
    this.setState({ message: "You have been entered!" });
  };

  onClick = async (item, bidCount) => {
    const accounts = await web3.eth.getAccounts();
    //const bidCount = this.state.bidCount;

    this.setState({ message: "Waiting for transaction success..." });

    await lottery.methods.bid(item.itemId, bidCount).send({
      from: accounts[0],
    });

    const updatedBidCount = await lottery.methods
      .getItemBids(item.itemId)
      .call();
    this.setState({
      message: "Your bid has been placed!",
      itemBids: {
        ...this.state.itemBids,
        [item.itemId]: updatedBidCount,
      },
    });

    /*this.setState((prevState) => ({
      message: "Your bid has been placed!",
      itemBids: {
        ...prevState.itemBids,
        [item.itemId]: (prevState.itemBids[item.itemId] || 0) + 1,
      },
    }));*/
  };

  onChange = (itemId, bidCount) => {
    this.setState((prevState) => ({
      itemBids: {
        ...prevState.itemBids,
        [itemId]: bidCount,
      },
    }));
  };

  revealWinner = async () => {
    this.setState({ message: "Revealing winner..." });

    await lottery.methods.pickWinner().send({
      from: this.state.contractOwner,
    });

    const winnersFromContract = await lottery.methods.getWinners().call();
    this.setState({
      winners: winnersFromContract,
      message: "Winner(s) revealed!",
    });

    /*this.setState((prevState) => ({
      winners: [...prevState.winners, prevState.winners[0]], // Assuming the first player in the array is the winner
      message: "Winner(s) revealed!",
    }));*/
  };

  withdraw = async () => {
    this.setState({ message: "Withdrawing funds..." });

    await lottery.methods.withdraw().send({
      from: this.state.contractOwner,
    });

    const balance = await web3.eth.getBalance(lottery.options.address);
    this.setState({ balance, message: "Funds withdrawn!" });
  };

  reset = async () => {
    this.setState({ message: "New cycle of buying lottery tickets!" });

    await lottery.methods.reset().send({
      from: this.state.contractOwner,
    });

    window.location.reload();
    /*this.setState({ message: "Lottery reset successfully!" });
    this.setState({
      message: "Lottery reset successfully!",
      winners: [], // Clear the winners array
    });*/
  };

  destroyContract = async () => {
    this.setState({ message: "The contract is destroyed!" });

    await lottery.methods.destroyContract().send({
      from: this.state.contractOwner,
    });

    window.location.reload();
  };

  /*reveal = async () => {
    this.setState({ message: "Checking if you are a winner..." });

    const isWinner = this.state.winners.includes(this.state.currentPlayer);

    this.setState({
      isWinner,
      message: "Winner status checked!",
    });
  };*/

  reveal = async () => {
    const accounts = await web3.eth.getAccounts();
    const isWinner = await lottery.methods.isWinner().call({
      from: accounts[0],
    });

    {
      isWinner
        ? this.setState({ message: "Congratulations! You are a winner!" })
        : this.setState({ message: "Sorry, you are not a winner." });
    }

    this.setState({ isWinner });
  };

  transferOwnership = async () => {
    await lottery.methods
      .transferOwnership(this.state.newOwner)
      .send({ from: this.state.contractOwner });

    this.setState({ message: "Ownership transferred!" });
  };

  /*transferOwnership = async (event) => {
    event.preventDefault();
    this.setState({ message: "Transferring ownership..." });
    await lottery.methods
      .transferOwnership(this.state.newOwner)
      .send({ from: this.state.contractOwner });
    this.setState({
      contractOwner: this.state.newOwner,
      message: "Ownership transferred successfully!",
      newOwner: "",
    });
  };*/

  /********************************************** */

  /********************************************** */

  render() {
    //---------------------------
    // Όποτε αγοραστεί λαχνός να ενημερώσεις τις players & balance
    lottery.events.PlayerEntered({}, async (error, event) => {
      if (error) {
        console.error(error);
      } else {
        const players = await lottery.methods.getPlayers().call();
        const balance = await web3.eth.getBalance(lottery.options.address);
        this.setState({ players, balance });
      }
    });

    lottery.events.WinnerPicked({}, async (error, event) => {
      if (error) {
        console.error(error);
      } else {
        const winner = event.returnValues.winner;

        this.setState((prevState) => ({
          winners: [...prevState.winners, winner],
        }));
      }
    });

    lottery.events.remainingTickets({}, async (error, event) => {
      if (error) {
        console.error(error);
      } else {
        const remainingTickets = await lottery.methods
          .getRemainingTickets(this.state.currentAccount)
          .call();
        this.setState({ remainingTickets });
      }
    });

    lottery.events.OwnershipTransferred({}, async (error, event) => {
      if (error) {
        console.error(error);
      } else {
        const owner = await lottery.methods.owner().call();
        const contractOwner = await lottery.methods.owner().call();
        this.setState({ contractOwner, owner });
      }
    });

    /*lottery.events.itemBids({}, async (error, event) => {
      if (error) {
        console.error(error);
      } else {
        await lottery.methods
          .getItemBids(this.state.itemId)
          .send({ from: this.state.contractOwner });
      }
    });*/

    //---------------------------

    const items = [
      {
        itemId: 0,
        itemName: "iMac",
        itemPhoto: Item1Photo,
      },
      {
        itemId: 1,
        itemName: "iPhone",
        itemPhoto: Item2Photo,
      },
      {
        itemId: 2,
        itemName: "Apple Watch",
        itemPhoto: Item3Photo,
      },
    ];

    //const isWinner = this.state.isWinner;
    //const firstThreeWinners = this.state.winners.slice(0, 3); // Get the first three winners

    return (
      <div>
        <header className="bg-dark text-light py-0">
          <div className="header">
            <div className="row align-items-center">
              <div className="col">
                <h2>{this.state.message}</h2>

                <p>
                  Contract manager:{" "}
                  <span className="text-warning">
                    <b>{this.state.contractOwner}</b>
                  </span>
                </p>

                <p>
                  Contract balance:{" "}
                  <span className="text-warning">
                    {" "}
                    <b>
                      {web3.utils.fromWei(this.state.balance, "ether")} Ether
                    </b>
                  </span>
                </p>

                <p>
                  Number of players:{" "}
                  <span className="text-warning">
                    <b>{this.state.players.length}</b>
                  </span>
                </p>

                <p>
                  Connected wallet address:{" "}
                  <span className="text-warning">
                    <b>{this.state.currentAccount}</b>
                  </span>
                </p>
              </div>

              <div className="col">
                {this.state.winners
                  .slice(0, 3)
                  .some(
                    (winner) =>
                      winner !== "0x0000000000000000000000000000000000000000"
                  ) && (
                  <div>
                    <h3>Last Winner Addresses</h3>
                    {this.state.winners.slice(0, 3).map((winner, index) => (
                      <p key={index}>
                        Winner {index + 1} :{" "}
                        <b className="text-warning">{winner}</b>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="col">
                {(this.state.currentAccount === this.state.owner ||
                  this.state.currentAccount ===
                    "0x153dfef4355E823dCB0FCc76Efe942BefCa86477") && (
                  <div className="mb-3 px-5">
                    <div>
                      <h4>Contract owner options</h4>
                      <button
                        className="btn btn-primary mx-2 my-1"
                        onClick={this.revealWinner}
                      >
                        Declare Winner
                      </button>

                      <button
                        className="btn btn-primary mx-2 my-1 "
                        onClick={this.withdraw}
                      >
                        Withdraw
                      </button>
                      <br />
                      <button
                        className="btn btn-primary mx-2 my-1"
                        onClick={this.reset}
                      >
                        Reset Contract
                      </button>
                      <button
                        className="btn btn-primary mx-2 my-1"
                        onClick={this.destroyContract}
                      >
                        Destroy Contract
                      </button>
                    </div>

                    <div /*onSubmit={this.transferOwnership}*/>
                      <div className="mb-3">
                        <label htmlFor="newOwner" className="form-label">
                          New Owner Address:
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="newOwner"
                          required
                          value={this.state.newOwner}
                          onChange={(event) =>
                            this.setState({ newOwner: event.target.value })
                          }
                        />
                      </div>
                      <button
                        type="submit"
                        onClick={this.transferOwnership}
                        className="btn btn-primary"
                      >
                        Transfer Ownership
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div class="row bg-dark ">
          <div id="sidenav" className="col-4">
            <div className="sidenav bg-dark text-light py-4">
              <div className="container">
                <hr />

                {this.state.winners
                  .slice(0, 3)
                  .every(
                    (winner) =>
                      winner === "0x0000000000000000000000000000000000000000"
                  ) &&
                  this.state.currentAccount !== this.state.owner && (
                    <form onSubmit={this.onSubmit}>
                      <div className="mb-3">
                        <label htmlFor="ticketCount" className="form-label">
                          Get Tickets &rarr;
                        </label>
                        <input
                          type="number"
                          id="ticketCount"
                          min="1"
                          required
                          className="form-control"
                          value={this.state.value}
                          onChange={(event) =>
                            this.setState({ value: event.target.value })
                          }
                        />
                      </div>

                      <button type="submit" className="btn btn-primary">
                        Get Tickets
                      </button>

                      <p className="text-warning mt-2">
                        Remaining Tickets:{" "}
                        <span>
                          <b>{this.state.remainingTickets}</b>
                        </span>
                      </p>
                    </form>
                  )}

                <div>
                  <h4>Check if You're a Winner</h4>
                  <button className="btn btn-primary" onClick={this.reveal}>
                    Am I Winner?
                  </button>
                </div>

                <hr />
              </div>
            </div>
          </div>

          <div id="items" className="col-8 py-0">
            <div className="container">
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {items.map((item) => (
                  <div className="col" key={item.itemId}>
                    <div
                      className="card"
                      style={{
                        backgroundColor: "#333339",
                      }}
                    >
                      <h5 className="text-white pt-1 ">{item.itemName}</h5>
                      <img
                        className="card-img-top img-fluid"
                        src={item.itemPhoto}
                        alt={item.itemName}
                      />

                      <div className="mb-3">
                        <label
                          htmlFor={`bidCount${item.itemId}`}
                          className="form-label"
                        >
                          Bid count:
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id={`bidCount${item.itemId}`}
                          min="0"
                          onChange={(e) =>
                            this.setState({ bidCount: e.target.value })
                          }
                          style={{ textAlign: "center" }}
                        />
                      </div>
                      {this.state.winners
                        .slice(0, 3)
                        .every(
                          (winner) =>
                            winner ===
                            "0x0000000000000000000000000000000000000000"
                        ) &&
                        this.state.currentAccount !== this.state.owner && (
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              this.onClick(
                                item,
                                this.state.bidCount
                                //this.state.itemBids[item.itemId]
                              )
                            }
                          >
                            Place Bid
                          </button>
                        )}
                      <p>Current bids: {this.state.itemBids[item.itemId]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

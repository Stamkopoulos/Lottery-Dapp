import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  // Use MetaMask provider
  web3 = new Web3(window.ethereum);
  window.ethereum.enable();
} else {
  // Use local development provider
  //const provider = new Web3.providers.HttpProvider("http://localhost:8545");
  //web3 = new Web3(provider);
}

export default web3;

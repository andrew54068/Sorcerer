/* Compile And Push To Eth Network */
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const Web3 = require("Web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require('dotenv').config()


const privateKey = process.env.privateKey; /* YOUR PRIVATE KEY ... */

let providerOrUrl = "";
const network = process.env.polygon_network

switch (network) {
  case 'mainnet':
    providerOrUrl = "https://polygon-mainnet.infura.io/v3/2b11ade4755b47aea7709655b0aac510"; /* Mainnet endpoint */
    break
  case 'testnet':
    providerOrUrl = "https://polygon-mumbai.infura.io/v3/2b11ade4755b47aea7709655b0aac510"; /* Mumbai testnet endpoint */
    break
  default:
    console.log(`polygon_network not found in env file`);
    process.exit();
}

const provider = new HDWalletProvider(privateKey, providerOrUrl);
const web3 = new Web3(provider);
const contractFileName = "Sorcerer.sol";
const contractName = "Sorcerer";
const content = fs.readFileSync(`./contract/${contractFileName}`, "utf8"); /* PATH TO CONTRACT */

const input = {
  language: "Solidity",
  sources: {
    [contractFileName]: { content },
  },
  settings: {
    outputSelection: { "*": { "*": ["*"] } },
  },
};

function findImports(relativePath) {
  //my imported sources are stored under the node_modules folder!
  const absolutePath = path.resolve(__dirname, 'node_modules', relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  return { contents: source };
}

(async () => {
  /* 1. Get Ethereum Account */
  const [account] = await web3.eth.getAccounts();
  
  /* 2. Compile Smart Contract */
  const result = solc.compile(JSON.stringify(input), { import: findImports })
  const { contracts } = JSON.parse(result);
  
  const contract = contracts[contractFileName][contractName];
  
  /* 2. Extract Abi And Bytecode From Contract */
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  
  const metadataFolderIpfsCID = "";
  
  /* 3. Send Smart Contract To Blockchain */
  const { _address } = await new web3.eth.Contract(abi)
    .deploy({ data: bytecode, arguments: [`https://ipfs.io/ipfs/${metadataFolderIpfsCID}/`] })
    .send({ from: account, gas: 8000000 });
  
  console.log("Contract Address =>", _address);
  process.exit()
})();
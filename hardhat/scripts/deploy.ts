import { ethers } from "hardhat";

async function main() {
  const provider = ethers.provider;
  const signers = await provider.getSigners();
  if (signers.length === 0) throw new Error("No signers available. Check PRIVATE_KEY in .env and fund the wallet");
  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const Purchases = await ethers.getContractFactory("Purchases", deployer);
  const purchases = await Purchases.deploy();
  await purchases.deployed();
  console.log("Purchases deployed to:", purchases.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
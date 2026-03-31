import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Balance:', ethers.formatEther(balance), 'tFIL')

  console.log('Deploying StorKeepRegistry...')
  const Registry = await ethers.getContractFactory('StorKeepRegistry')
  const registry = await Registry.deploy()
  await registry.waitForDeployment()

  const addr = await registry.getAddress()
  console.log('SUCCESS address=' + addr)
  console.log('Filfox=https://calibration.filfox.info/en/address/' + addr)
  console.log('ENV=STORKEEP_REGISTRY_CONTRACT=' + addr)
}

main().catch(e => { console.error(e.message); process.exit(1) })
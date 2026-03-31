import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying AgentBudget with:', deployer.address)

  const Factory = await ethers.getContractFactory('AgentBudget')
  const contract = await Factory.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('AgentBudget deployed to:', address)
  console.log('Add to .env.local: AGENT_BUDGET_CONTRACT=' + address)
}

main().catch(e => { console.error(e); process.exit(1) })

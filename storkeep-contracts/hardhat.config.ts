import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'dotenv/config'

const raw = process.env.STORKEEP_PRIVATE_KEY ?? '0'.repeat(64)
const PRIVATE_KEY = raw.startsWith('0x') ? raw : '0x' + raw

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  networks: {
    calibrationnet: {
      chainId: 314159,
      url: 'https://api.calibration.node.glif.io/rpc/v1',
      accounts: [PRIVATE_KEY],
    },
    filecoin: {
      chainId: 314,
      url: 'https://api.node.glif.io/rpc/v1',
      accounts: [PRIVATE_KEY],
    },
  },
}

export default config

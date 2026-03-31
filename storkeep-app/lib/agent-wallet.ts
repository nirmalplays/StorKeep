/** Agent runtime (`AgentVault` from `storkeep-sdk`) shares the Calibration wallet with StorKeep chain ops when unset. */
export function getAgentFilecoinPrivateKey(): `0x${string}` | undefined {
  const pk = process.env.FILECOIN_PRIVATE_KEY ?? process.env.FILECOIN_WALLET_PRIVATE_KEY
  if (!pk || !pk.startsWith('0x')) return undefined
  return pk as `0x${string}`
}

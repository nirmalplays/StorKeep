'use client'
import { useState, useEffect, useRef } from 'react'
import { X402LogPanel } from '@/components/X402LogPanel'

const REGISTRY_CONTRACT = '0x7CC100a2c115e5B02F7BbaC7616D290A17D89397'
const VAULT_WALLET = '0x4e51EA274b9a6192B2BBB7734b6bE50bC7B4752B'

interface DealStatus {
  dealId: string
  providerMinerId: string
  status: string
  epochsUntilExpiry: number
  daysUntilExpiry: number
  renewalCostUsdc: number
  needsRenewal: boolean
}

interface RenewalResult {
  newExpiryEpoch: number
  actualCostUsdc: number
  filfoxUrl: string
  basescanUrl: string
  txHash?: string
  registryTxHash?: string
  registryFilfoxUrl?: string
  raasTxHash?: string
}

export default function DashboardPage() {
  const [dealId, setDealId] = useState('')
  const [status, setStatus] = useState<DealStatus | null>(null)
  const [renewed, setRenewed] = useState<RenewalResult | null>(null)
  const [autopiloted, setAutopiloted] = useState(false)
  const [dealsRenewedCount, setDealsRenewedCount] = useState(0)
  const [autopilotCount, setAutopilotCount] = useState(0)
  const [countsLoaded, setCountsLoaded] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [demoLog, setDemoLog] = useState<string[]>([])
  const [logActive, setLogActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaultBalance, setVaultBalance] = useState<string | null>(null)
  const [autoRunning, setAutoRunning] = useState(false)
  const [expiryTx, setExpiryTx] = useState<string | null>(null)
  const [expiryCountdown, setExpiryCountdown] = useState(0)
  const [autoCountdown, setAutoCountdown] = useState(0)
  const [renewalHistory, setRenewalHistory] = useState<RenewalResult[]>([])
  const autoRef = useRef<any>(null)
  const countdownRef = useRef<any>(null)
  const autoCountdownRef = useRef<any>(null)

  useEffect(() => {
    // Always fetch vault wallet balance (the one that pays gas)
    fetchBalance(VAULT_WALLET)
  }, [])

  // Load persisted counters for demo so they survive reloads during judging
  useEffect(() => {
    if (typeof window === 'undefined') return
    const renewed = Number.parseInt(window.localStorage.getItem('storkeep_dealsRenewed') ?? '0', 10)
    const autos   = Number.parseInt(window.localStorage.getItem('storkeep_autopilotCount') ?? '0', 10)
    if (!Number.isNaN(renewed)) setDealsRenewedCount(renewed)
    if (!Number.isNaN(autos))   setAutopilotCount(autos)
    setCountsLoaded(true)
  }, [])

  useEffect(() => {
    if (!countsLoaded) return
    if (typeof window === 'undefined') return
    window.localStorage.setItem('storkeep_dealsRenewed', String(dealsRenewedCount))
  }, [dealsRenewedCount, countsLoaded])

  useEffect(() => {
    if (!countsLoaded) return
    if (typeof window === 'undefined') return
    window.localStorage.setItem('storkeep_autopilotCount', String(autopilotCount))
  }, [autopilotCount, countsLoaded])

  async function fetchBalance(address: string) {
    try {
      const res = await fetch('https://api.calibration.node.glif.io/rpc/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'Filecoin.EthGetBalance',
          params: [address, 'latest']
        })
      })
      const data = await res.json()
      if (data.result) {
        const bal = (parseInt(data.result, 16) / 1e18).toFixed(4) + ' tFIL'
        setVaultBalance(bal)
      }
    } catch {
      setVaultBalance('—')
    }
  }

  useEffect(() => {
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (autoCountdownRef.current) clearInterval(autoCountdownRef.current)
    }
  }, [])

  async function checkDeal() {
    if (!dealId) return
    setLoading(true)
    setError(null)
    setStatus(null)
    setRenewed(null)
    setAutopiloted(false)
    setLogActive(false)
    setExpiryTx(null)
    try {
      const res = await fetch(`/api/deals/${dealId}/status`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch deal')
      setStatus(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function renewDealDemo(): Promise<RenewalResult | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/demo/renew/${dealId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Renewal failed')
      setLogActive(true)
      setRenewed(data)
      setRenewalHistory(prev => [data, ...prev].slice(0, 10))
      setDealsRenewedCount(c => c + 1)
      // Refresh vault balance after renewal
      fetchBalance(VAULT_WALLET)
      return data
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function renewDealX402() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/pay/renew/${dealId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Renewal failed')
      setLogActive(true)
      setRenewed(data)
      setRenewalHistory(prev => [data, ...prev].slice(0, 10))
      setDealsRenewedCount(c => c + 1)
      fetchBalance(VAULT_WALLET)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function enableAutopilotDemo() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/demo/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, renewWhenEpochsLeft: 100_000, maxPriceUsdc: 1 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Autopilot failed')
      setAutopiloted(true)
      setAutopilotCount(c => c + 1)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function setDemoExpiry() {
    setLoading(true)
    setError(null)
    setExpiryTx(null)
    try {
      const res = await fetch('/api/demo/set-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, secondsFromNow: 120 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to set expiry')
      setExpiryTx(data.txHash)
      setExpiryCountdown(120)
      if (countdownRef.current) clearInterval(countdownRef.current)
      countdownRef.current = setInterval(() => {
        setExpiryCountdown(c => {
          if (c <= 1) { clearInterval(countdownRef.current!); return 0 }
          return c - 1
        })
      }, 1000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function startAutoRenew() {
    if (!dealId) { setError('Enter a Deal ID first'); return }
    setAutoRunning(true)
    setDemoLog([])
    setAutoCountdown(120)

    if (autoCountdownRef.current) clearInterval(autoCountdownRef.current)
    autoCountdownRef.current = setInterval(() => {
      setAutoCountdown(c => {
        if (c <= 1) { clearInterval(autoCountdownRef.current!); return 0 }
        return c - 1
      })
    }, 1000)

    const startMsgs = [
      '🔍 Auto-renew started — monitoring deal ' + dealId,
      '⏱  Checking expiry every 2 minutes...',
      '📡 Polling Filecoin Calibration RPC...',
      '⚠️  Deal approaching threshold — queuing renewal',
      '💸 Triggering renewal — $0.001 USDC',
    ]
    let i = 0
    const logInterval = setInterval(() => {
      if (i < startMsgs.length) {
        setDemoLog(prev => [...prev, startMsgs[i++]])
      } else {
        clearInterval(logInterval)
      }
    }, 1500)

    autoRef.current = setTimeout(async () => {
      setDemoLog(prev => [...prev, '🔗 Submitting RaaS renewal on-chain...'])
      const result = await renewDealDemo()
      if (result) {
        setDemoLog(prev => [
          ...prev,
          `✅ Renewed! TX: ${result.raasTxHash?.slice(0, 20)}...`,
          `📋 New expiry epoch: ${result.newExpiryEpoch}`,
          `💰 Cost: $${result.actualCostUsdc} USDC`,
          '🔄 Next check in 2 minutes...',
        ])
      }
      setAutoRunning(false)
    }, 120_000)
  }

  function stopAutoRenew() {
    if (autoRef.current) clearTimeout(autoRef.current)
    if (autoCountdownRef.current) clearInterval(autoCountdownRef.current)
    setAutoRunning(false)
    setAutoCountdown(0)
    setDemoLog(prev => [...prev, '⛔ Auto-renew stopped'])
  }

  const card = (children: React.ReactNode) => (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      {children}
    </div>
  )

  const label = (text: string) => (
    <div style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
      {text}
    </div>
  )

  const btn = (text: string, onClick: () => void, opts?: { color?: string; bg?: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={opts?.disabled || loading} style={{
      background: opts?.bg ?? '#00ff88', color: opts?.color ?? '#000',
      border: 'none', borderRadius: 6, padding: '8px 18px',
      fontSize: 13, fontFamily: 'monospace', fontWeight: 600,
      cursor: 'pointer', opacity: (opts?.disabled || loading) ? 0.4 : 1,
      marginRight: 8, marginTop: 4,
    }}>{text}</button>
  )

  const outlineBtn = (text: string, onClick: () => void, color = '#4488ff', disabled = false) => (
    <button onClick={onClick} disabled={loading || disabled} style={{
      background: 'transparent', color, border: `1px solid ${color}`,
      borderRadius: 6, padding: '8px 18px', fontSize: 13,
      fontFamily: 'monospace', cursor: 'pointer',
      opacity: (loading || disabled) ? 0.4 : 1, marginRight: 8, marginTop: 4,
    }}>{text}</button>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#0d0d0d', padding: '2rem 1rem', color: '#eee' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', fontFamily: 'monospace' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ color: '#00ff88', fontSize: 22, margin: 0 }}>StorKeep</h1>
            <div style={{ color: '#444', fontSize: 12 }}>Filecoin deal manager · Calibration testnet</div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 180 }}>
            {/* Vault wallet — always shown */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: 1 }}>Vault Wallet</div>
              <div style={{ fontSize: 11, color: '#ff8800' }}>
                {VAULT_WALLET.slice(0, 6)}...{VAULT_WALLET.slice(-4)}
              </div>
              <div style={{ fontSize: 11, color: vaultBalance && vaultBalance !== '0.0000 tFIL' ? '#00ff88' : '#555' }}>
                {vaultBalance ?? 'fetching...'}
              </div>
            </div>
          </div>
        </div>

        {/* High-level counters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Deals renewed this session</div>
            <div style={{ fontSize: 22, color: '#00ff88', fontWeight: 700 }}>{dealsRenewedCount}</div>
          </div>
          <div style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: 10, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Autopilot activations</div>
            <div style={{ fontSize: 22, color: '#4488ff', fontWeight: 700 }}>{autopilotCount}</div>
          </div>
        </div>

        {/* Contract Address Banner */}
        {card(
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>StorKeep Registry Contract</div>
              <div style={{ fontSize: 12, color: '#00ff88', letterSpacing: 0.5 }}>{REGISTRY_CONTRACT}</div>
            </div>
            <a href={`https://calibration.filfox.info/en/address/${REGISTRY_CONTRACT}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: '#4488ff', textDecoration: 'none' }}>View on Filfox ↗</a>
          </div>
        )}

        {/* Demo Mode Toggle */}
        {card(
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#ccc', fontSize: 13 }}>Demo Mode</div>
              <div style={{ color: '#555', fontSize: 11 }}>Real on-chain renewal · skips USDC payment gate</div>
            </div>
            <div onClick={() => setDemoMode(d => !d)} style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: demoMode ? '#00ff88' : '#333', position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: demoMode ? 22 : 3,
                width: 18, height: 18, borderRadius: 9, background: '#000', transition: 'left 0.2s',
              }} />
            </div>
          </div>
        )}

        {/* Deal ID Input */}
        {card(<>
          {label('Deal ID')}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={dealId} onChange={e => setDealId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkDeal()}
              placeholder="e.g. 217302"
              style={{
                flex: 1, background: '#0a0a0a', border: '1px solid #333',
                borderRadius: 6, padding: '8px 12px', color: '#eee',
                fontFamily: 'monospace', fontSize: 13, outline: 'none',
              }}
            />
            {btn('Check', checkDeal, { disabled: !dealId })}
          </div>
        </>)}

        {error && (
          <div style={{ color: '#ff4444', background: '#1a0000', border: '1px solid #440000', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading && <div style={{ color: '#555', fontSize: 13, marginBottom: '1rem' }}>loading...</div>}

        {/* Deal Status Card */}
        {status && !loading && card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              {label('Deal')}
              <div style={{ color: '#ccc', fontSize: 14 }}>{status.dealId}</div>
            </div>
            <div style={{
              background: status.status === 'active' ? '#001a0a' : '#1a0000',
              border: `1px solid ${status.status === 'active' ? '#004422' : '#440000'}`,
              borderRadius: 6, padding: '4px 10px', fontSize: 12,
              color: status.status === 'active' ? '#00cc66' : '#ff4444',
              alignSelf: 'flex-start',
            }}>{status.status?.toUpperCase()}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>{label('Provider')}<div style={{ color: '#ccc', fontSize: 13 }}>{status.providerMinerId}</div></div>
            <div>{label('Expires')}<div style={{ color: status.daysUntilExpiry < 30 ? '#ff8800' : '#ccc', fontSize: 13 }}>{status.daysUntilExpiry?.toFixed(0)} days</div></div>
            <div>{label('Renewal Cost')}<div style={{ color: '#ccc', fontSize: 13 }}>${status.renewalCostUsdc} USDC</div></div>
            <div>{label('Needs Renewal')}<div style={{ color: status.needsRenewal ? '#ff8800' : '#00cc66', fontSize: 13 }}>{status.needsRenewal ? '⚠️ Yes' : '✅ No'}</div></div>
          </div>

          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 12 }}>
            {demoMode ? (<>
              <div style={{ color: '#555', fontSize: 11, marginBottom: 8 }}>DEMO MODE · REAL ON-CHAIN RENEWAL</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {btn('Renew Now (demo)', renewDealDemo)}
                {autoRunning
                  ? outlineBtn(`⏱ Stop Auto (${Math.floor(autoCountdown / 60)}:${String(autoCountdown % 60).padStart(2, '0')})`, stopAutoRenew, '#ff4444')
                  : outlineBtn('▶ Auto-Renew (2 min)', startAutoRenew, '#00ff88')
                }
                {outlineBtn('Autopilot (demo)', enableAutopilotDemo, '#888')}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1a1a1a' }}>
                <div style={{ color: '#555', fontSize: 11, marginBottom: 8 }}>EXPIRY CONTROL</div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  {outlineBtn('⏱ Set 2-min Expiry On-Chain', setDemoExpiry, '#ff8800')}
                  {expiryCountdown > 0 && (
                    <div style={{ fontSize: 12, color: '#ff8800' }}>
                      expires in {Math.floor(expiryCountdown / 60)}:{String(expiryCountdown % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
                {expiryTx && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#555' }}>
                    on-chain tx: <a href={`https://calibration.filfox.info/en/tx/${expiryTx}`} target="_blank" rel="noreferrer" style={{ color: '#ff8800' }}>Filfox ↗</a>
                  </div>
                )}
              </div>
            </>) : (<>
              <div style={{ color: '#555', fontSize: 11, marginBottom: 8 }}>LIVE · BASE SEPOLIA USDC</div>
              {btn('Renew Deal', renewDealX402)}
              {outlineBtn('Enable Autopilot', enableAutopilotDemo)}
            </>)}
          </div>
        </>)}

        {/* Auto-renew log */}
        {demoLog.length > 0 && (
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 16px', marginBottom: '1rem', fontSize: 12 }}>
            <div style={{ color: '#333', marginBottom: 8, fontSize: 11 }}>── auto-renew log ──</div>
            {demoLog.map((l, i) => (
              <div key={i} style={{ color: '#666', marginBottom: 4 }}>{l}</div>
            ))}
          </div>
        )}

        {/* Latest Renewal Result */}
        {renewed && card(<>
          <div style={{ color: '#00ff88', fontSize: 14, marginBottom: 12 }}>✅ Deal renewed successfully</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>{label('New Expiry Epoch')}<div style={{ color: '#ccc', fontSize: 13 }}>{renewed.newExpiryEpoch || '—'}</div></div>
            <div>{label('Cost Paid')}<div style={{ color: '#ccc', fontSize: 13 }}>${renewed.actualCostUsdc} USDC</div></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {renewed.filfoxUrl && <a href={renewed.filfoxUrl} target="_blank" rel="noreferrer" style={{ color: '#00ff88', fontSize: 12 }}>↗ Filfox TX (Lighthouse RaaS)</a>}
            {renewed.basescanUrl && <a href={renewed.basescanUrl} target="_blank" rel="noreferrer" style={{ color: '#4488ff', fontSize: 12 }}>↗ BaseScan TX (USDC)</a>}
            {renewed.registryFilfoxUrl && <a href={renewed.registryFilfoxUrl} target="_blank" rel="noreferrer" style={{ color: '#ff8800', fontSize: 12 }}>↗ Registry TX (StorKeep)</a>}
          </div>
        </>)}

        {/* Renewal History */}
        {renewalHistory.length > 0 && card(<>
          <div style={{ color: '#555', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Renewal History</div>
          {renewalHistory.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < renewalHistory.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
              <div style={{ fontSize: 12, color: '#888' }}>#{renewalHistory.length - i} · ${r.actualCostUsdc} USDC · epoch {r.newExpiryEpoch}</div>
              {r.filfoxUrl && <a href={r.filfoxUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#00ff88' }}>TX ↗</a>}
            </div>
          ))}
        </>)}

        {autopiloted && card(
          <div style={{ color: '#00cc88', fontSize: 13 }}>
            ✅ Autopilot active — this deal will never expire. StorKeep checks every 6 hours.
          </div>
        )}

        <X402LogPanel dealId={dealId} active={logActive} />

      </div>
    </main>
  )
}
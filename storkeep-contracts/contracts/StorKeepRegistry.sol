// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title StorKeepRegistry
/// @notice On-chain renewal audit trail + demo expiry overrides for Filecoin deals
/// @dev Deploy on Filecoin Calibration. Use setDemoExpiry() to simulate expiring deals.
contract StorKeepRegistry {

    // ── Structs ───────────────────────────────────────────────────────────────

    struct Renewal {
        uint64  dealId;
        bytes   pieceCid;
        address triggeredBy;
        uint256 timestamp;
        string  lighthouseJobId;
    }

    // ── Storage ───────────────────────────────────────────────────────────────

    address public owner;
    mapping(uint64 => Renewal[]) public renewalHistory;
    uint256 public totalRenewals;

    /// @notice Demo expiry — block.timestamp when this deal "expires"
    mapping(uint64 => uint256) public demoExpiry;
    mapping(uint64 => bool)    public hasDemoExpiry;

    // ── Events ────────────────────────────────────────────────────────────────

    event DealRenewalTriggered(
        uint64  indexed dealId,
        bytes           pieceCid,
        address indexed triggeredBy,
        string          lighthouseJobId,
        uint256         timestamp
    );

    event DemoExpirySet(
        uint64  indexed dealId,
        uint256         expiresAt,
        uint256         secondsFromNow
    );

    event DemoExpiryCleared(uint64 indexed dealId);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ── Core ──────────────────────────────────────────────────────────────────

    function recordRenewal(
        uint64         dealId,
        bytes calldata pieceCid,
        address        triggeredBy,
        string calldata lighthouseJobId
    ) external {
        renewalHistory[dealId].push(Renewal({
            dealId:          dealId,
            pieceCid:        pieceCid,
            triggeredBy:     triggeredBy,
            timestamp:       block.timestamp,
            lighthouseJobId: lighthouseJobId
        }));
        totalRenewals++;

        if (hasDemoExpiry[dealId] && block.timestamp >= demoExpiry[dealId]) {
            delete demoExpiry[dealId];
            hasDemoExpiry[dealId] = false;
            emit DemoExpiryCleared(dealId);
        }

        emit DealRenewalTriggered(
            dealId, pieceCid, triggeredBy, lighthouseJobId, block.timestamp
        );
    }

    // ── Demo Expiry Control ───────────────────────────────────────────────────

    /// @notice Set a fake expiry. Use secondsFromNow=120 for a 2-minute demo.
    function setDemoExpiry(uint64 dealId, uint256 secondsFromNow) external onlyOwner {
        uint256 expiresAt = block.timestamp + secondsFromNow;
        demoExpiry[dealId]    = expiresAt;
        hasDemoExpiry[dealId] = true;
        emit DemoExpirySet(dealId, expiresAt, secondsFromNow);
    }

    /// @notice Clear a demo expiry
    function clearDemoExpiry(uint64 dealId) external onlyOwner {
        delete demoExpiry[dealId];
        hasDemoExpiry[dealId] = false;
        emit DemoExpiryCleared(dealId);
    }

    /// @notice Check if a deal is expired per demo override
    function isDemoExpired(uint64 dealId)
        external view
        returns (bool expired, uint256 secondsLeft)
    {
        if (!hasDemoExpiry[dealId]) return (false, 0);
        if (block.timestamp >= demoExpiry[dealId]) return (true, 0);
        return (false, demoExpiry[dealId] - block.timestamp);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    function getRenewalHistory(uint64 dealId)
        external view returns (Renewal[] memory)
    {
        return renewalHistory[dealId];
    }

    function getTotalRenewals() external view returns (uint256) {
        return totalRenewals;
    }

    function getRenewalCount(uint64 dealId) external view returns (uint256) {
        return renewalHistory[dealId].length;
    }
}
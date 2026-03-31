// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title AgentBudget — Onchain budget enforcement for AgentVault
/// @notice Agents register with a starting budget. Budget decreases with
///         each verified action. At zero, agent is marked dead.
contract AgentBudget {

  enum AgentType  { Producer, Consumer, Guardian }
  enum AgentState { Alive, Critical, Dead }

  struct Agent {
    address     wallet;
    AgentType   agentType;
    AgentState  state;
    uint256     budgetUsdfc;   // in 6-decimal USDFC units
    uint256     budgetTotal;
    uint256     storedBytes;
    uint256     txCount;
    uint256     bornAt;
    uint256     diedAt;        // 0 if alive
  }

  mapping(string => Agent) public agents;
  string[] public agentIds;
  uint256  public totalUsdcMoved;

  event AgentRegistered  (string indexed agentId, AgentType agentType, uint256 budget);
  event BudgetCharged    (string indexed agentId, uint256 amount, string reason);
  event AgentDied        (string indexed agentId, uint256 finalBalance, uint256 lifetime);
  event DataStored       (string indexed agentId, string cid, uint256 bytes_);
  event DataPruned       (string indexed agentId, string cid);
  event RevenueCollected (string indexed agentId, uint256 amount);

  function register(
    string calldata agentId,
    AgentType agentType,
    uint256 budgetUsdfc
  ) external {
    require(agents[agentId].bornAt == 0, "Agent already registered");
    agents[agentId] = Agent({
      wallet:      msg.sender,
      agentType:   agentType,
      state:       AgentState.Alive,
      budgetUsdfc: budgetUsdfc,
      budgetTotal: budgetUsdfc,
      storedBytes: 0,
      txCount:     0,
      bornAt:      block.timestamp,
      diedAt:      0
    });
    agentIds.push(agentId);
    emit AgentRegistered(agentId, agentType, budgetUsdfc);
  }

  function charge(
    string calldata agentId,
    uint256 amount,
    string calldata reason
  ) external {
    Agent storage a = agents[agentId];
    require(a.state != AgentState.Dead, "Agent is dead");
    require(a.budgetUsdfc >= amount, "Insufficient budget");

    a.budgetUsdfc  -= amount;
    a.txCount++;
    totalUsdcMoved += amount;

    if (a.budgetUsdfc == 0) {
      a.state  = AgentState.Dead;
      a.diedAt = block.timestamp;
      emit AgentDied(agentId, 0, block.timestamp - a.bornAt);
    } else if (a.budgetUsdfc * 100 / a.budgetTotal < 20) {
      a.state = AgentState.Critical;
    }

    emit BudgetCharged(agentId, amount, reason);
  }

  function recordStore(
    string calldata agentId,
    string calldata cid,
    uint256 bytes_
  ) external {
    agents[agentId].storedBytes += bytes_;
    emit DataStored(agentId, cid, bytes_);
  }

  function recordPrune(string calldata agentId, string calldata cid) external {
    emit DataPruned(agentId, cid);
  }

  function recordRevenue(string calldata agentId, uint256 amount) external {
    agents[agentId].budgetUsdfc += amount;
    emit RevenueCollected(agentId, amount);
  }

  function getAgent(string calldata agentId) external view returns (Agent memory) {
    return agents[agentId];
  }

  function getAllAgentIds() external view returns (string[] memory) {
    return agentIds;
  }

  function getAllAgents() external view returns (Agent[] memory, string[] memory) {
    Agent[] memory result = new Agent[](agentIds.length);
    for (uint i = 0; i < agentIds.length; i++) {
      result[i] = agents[agentIds[i]];
    }
    return (result, agentIds);
  }
}

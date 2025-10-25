// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BellaNapoliPredictionFactory is Ownable, ReentrancyGuard {
    address[] public allPools;
    mapping(address => PoolInfo) public poolInfo;
    uint256 public constant FEE_PERCENTAGE = 150;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public totalFeesCollected;

    struct PoolInfo {
        string title;
        string description;
        string category;
        uint256 closingDate;
        uint256 closingBid;
        address creator;
        bool isActive;
        uint256 createdAt;
    }

    event PoolCreated(address indexed poolAddress, string title, string category, address indexed creator, uint256 closingDate, uint256 closingBid);
    event PoolClosed(address indexed poolAddress, bool isActive);
    event FeesCollected(address indexed poolAddress, uint256 amount);
    event PoolWinnerSet(address indexed poolAddress, bool winner);
    event PoolEmergencyResolved(address indexed poolAddress, bool winner, string reason);
    event PoolEmergencyStopToggled(address indexed poolAddress, bool stopped);
    event PoolCancelled(address indexed poolAddress, string reason);

    constructor() Ownable() {}

    function createPool(string memory _title, string memory _description, string memory _category, uint256 _closingDate, uint256 _closingBid) external onlyOwner returns (address poolAddress) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_title).length <= 100, "Title too long");
        require(bytes(_description).length <= 500, "Description too long");
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(_closingDate > block.timestamp, "Closing date must be in the future");
        require(_closingDate <= block.timestamp + 365 days, "Closing date too far in the future");
        require(_closingBid > _closingDate, "Closing bid must be after closing date");
        require(_closingBid <= _closingDate + 30 days, "Closing bid too far after closing date");
        
        PredictionPool newPool = new PredictionPool(_title, _description, _category, _closingDate, _closingBid, address(this));
        poolAddress = address(newPool);
        
        poolInfo[poolAddress] = PoolInfo({
            title: _title,
            description: _description,
            category: _category,
            closingDate: _closingDate,
            closingBid: _closingBid,
            creator: msg.sender,
            isActive: true,
            createdAt: block.timestamp
        });
        
        allPools.push(poolAddress);
        emit PoolCreated(poolAddress, _title, _category, msg.sender, _closingDate, _closingBid);
        return poolAddress;
    }

    function closePool(address _poolAddress) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        require(poolInfo[_poolAddress].isActive, "Pool already closed");
        poolInfo[_poolAddress].isActive = false;
        emit PoolClosed(_poolAddress, false);
    }

    function collectFees(address _poolAddress) external nonReentrant returns (uint256 feeAmount) {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        require(poolInfo[_poolAddress].isActive, "Pool is not active");
        
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        feeAmount = pool.getTotalFees();
        totalFeesCollected += feeAmount;
        emit FeesCollected(_poolAddress, feeAmount);
        return feeAmount;
    }

    // ============ POOL MANAGEMENT FUNCTIONS ============
    
    function setPoolWinner(address _poolAddress, bool _winner) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        pool.setWinner(_winner);
        emit PoolWinnerSet(_poolAddress, _winner);
    }
    
    function emergencyResolvePool(address _poolAddress, bool _winner, string memory _reason) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        pool.emergencyResolve(_winner, _reason);
        emit PoolEmergencyResolved(_poolAddress, _winner, _reason);
    }
    
    function setPoolEmergencyStop(address _poolAddress, bool _stop) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        pool.setEmergencyStop(_stop);
        emit PoolEmergencyStopToggled(_poolAddress, _stop);
    }
    
    function cancelPoolPrediction(address _poolAddress, string memory _reason) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        pool.cancelPool(_reason);
        emit PoolCancelled(_poolAddress, _reason);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Fee withdrawal failed");
    }

    function getPoolCount() external view returns (uint256 count) {
        return allPools.length;
    }

    function getAllPools() external view returns (address[] memory pools) {
        return allPools;
    }

    function getPoolInfo(address _poolAddress) external view returns (PoolInfo memory info) {
        return poolInfo[_poolAddress];
    }

    function getPoolsByCategory(string memory _category) external view returns (address[] memory pools) {
        // Ottimizzazione: un solo loop invece di due
        uint256 count = 0;
        uint256 length = allPools.length;
        
        // Prima passata: conta i pool che corrispondono alla categoria
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(bytes(poolInfo[allPools[i]].category)) == keccak256(bytes(_category))) {
                count++;
            }
        }
        
        // Crea array con dimensione corretta
        address[] memory result = new address[](count);
        
        // Seconda passata: popola l'array (solo se ci sono risultati)
        if (count > 0) {
            uint256 index = 0;
            for (uint256 i = 0; i < length; i++) {
                if (keccak256(bytes(poolInfo[allPools[i]].category)) == keccak256(bytes(_category))) {
                    result[index] = allPools[i];
                    index++;
                    // Ottimizzazione: esci se abbiamo trovato tutti i pool
                    if (index == count) break;
                }
            }
        }
        
        return result;
    }

    receive() external payable {}
}

contract PredictionPool is Ownable, ReentrancyGuard {
    string public title;
    string public description;
    string public category;
    uint256 public closingDate;
    uint256 public closingBid;
    address payable public factory;

    bool public isClosed = false;
    bool public winnerSet = false;
    bool public winner;
    bool public emergencyStop = false;
    bool public cancelled = false;

    uint256 public totalYes;
    uint256 public totalNo;
    uint256 public totalBets;

    mapping(address => Bet) public userBets;
    address[] public bettors;

    mapping(address => bool) public hasClaimed;
    uint256 public totalClaimed;

    address public feeWallet = 0x8E49800F0AA47e68ba9e46D97481679D03379294;
    uint256 public constant FEE_PERCENTAGE = 150;
    uint256 public constant BASIS_POINTS = 10000;

    struct Bet {
        bool choice;
        uint256 amount;
        bool claimed;
        uint256 timestamp;
    }

    event BetPlaced(address indexed bettor, uint256 amount, bool choice, uint256 totalYes, uint256 totalNo, string predictionTitle, string userChoice);
    event WinnerSet(bool winnerChoice, string reason);
    event RewardClaimed(address indexed winner, uint256 amount);
    event EmergencyStopToggled(bool stopped);
    event PoolCancelled(string reason);
    event RefundClaimed(address indexed user, uint256 amount);
    event FeeTransferred(address indexed feeWallet, uint256 amount);

    constructor(string memory _title, string memory _description, string memory _category, uint256 _closingDate, uint256 _closingBid, address _factory) Ownable() {
        title = _title;
        description = _description;
        category = _category;
        closingDate = _closingDate;
        closingBid = _closingBid;
        factory = payable(_factory);
    }

    modifier bettingOpen() {
        require(!isClosed, "Pool is closed");
        require(!emergencyStop, "Betting is paused by admin");
        require(!cancelled, "Pool has been cancelled");
        require(block.timestamp < closingDate, "Betting period has ended");
        _;
    }

    function placeBet(bool _choice) external payable bettingOpen {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(msg.value >= 0.001 ether, "Minimum bet is 0.001 BNB");
        require(msg.value <= 100 ether, "Maximum bet is 100 BNB");
        require(userBets[msg.sender].amount == 0, "User has already placed a bet");
        require(msg.sender != address(0), "Invalid sender address");
        
        userBets[msg.sender] = Bet({
            choice: _choice,
            amount: msg.value,
            claimed: false,
            timestamp: block.timestamp
        });
        
        bettors.push(msg.sender);
        
        if (_choice) {
            totalYes += msg.value;
        } else {
            totalNo += msg.value;
        }
        
        totalBets += msg.value;
        
        string memory userChoiceStr = _choice ? "YES" : "NO";
        emit BetPlaced(msg.sender, msg.value, _choice, totalYes, totalNo, title, userChoiceStr);
    }

    function closePool() external onlyOwner {
        require(!isClosed, "Pool already closed");
        require(block.timestamp >= closingDate, "Cannot close before closing date");
        isClosed = true;
    }

    function setWinner(bool _winner) external onlyOwner {
        require(isClosed, "Pool must be closed first");
        require(!winnerSet, "Winner already set");
        winner = _winner;
        winnerSet = true;
        string memory reason = _winner ? "YES won" : "NO won";
        emit WinnerSet(_winner, reason);
    }

    function claimWinnings() external nonReentrant {
        require(winnerSet, "Winner not set yet");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!userBets[msg.sender].claimed, "Already claimed");
        require(userBets[msg.sender].choice == winner, "Not a winning bet");
        
        userBets[msg.sender].claimed = true;
        
        uint256 userBet = userBets[msg.sender].amount;
        uint256 totalWinningBets = winner ? totalYes : totalNo;
        uint256 totalLosingBets = winner ? totalNo : totalYes;
        
        // Calcolo corretto: l'utente riceve la sua quota proporzionale del pot totale
        // meno la sua quota proporzionale delle commissioni
        uint256 totalPot = totalBets;
        uint256 totalFees = (totalLosingBets * FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 netPot = totalPot - totalFees;
        
        // La ricompensa è proporzionale alla scommessa dell'utente rispetto alle scommesse vincenti
        uint256 reward = (userBet * netPot) / totalWinningBets;
        
        // Trasferisci le commissioni una sola volta (solo al primo claim)
        if (totalFees > 0 && !hasClaimed[address(0)]) {
            (bool feeSuccess, ) = payable(feeWallet).call{value: totalFees}("");
            require(feeSuccess, "Fee transfer failed");
            hasClaimed[address(0)] = true;
            emit FeeTransferred(feeWallet, totalFees);
        }
        
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Reward transfer failed");
        
        totalClaimed += reward;
        emit RewardClaimed(msg.sender, reward);
    }

    function setEmergencyStop(bool _stop) external onlyOwner {
        emergencyStop = _stop;
        emit EmergencyStopToggled(_stop);
    }

    function emergencyResolve(bool _winner, string memory _reason) external onlyOwner {
        require(emergencyStop, "Emergency stop not activated");
        require(!winnerSet, "Winner already set");
        winner = _winner;
        winnerSet = true;
        emit WinnerSet(_winner, _reason);
    }

    function cancelPool(string memory _reason) external onlyOwner {
        require(!winnerSet, "Cannot cancel after winner is set");
        require(!cancelled, "Pool already cancelled");
        cancelled = true;
        emit PoolCancelled(_reason);
    }

    function claimRefund() external nonReentrant {
        require(cancelled, "Pool not cancelled");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!userBets[msg.sender].claimed, "Already claimed");
        
        userBets[msg.sender].claimed = true;
        uint256 refundAmount = userBets[msg.sender].amount;
        
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit RefundClaimed(msg.sender, refundAmount);
    }

    function canClaimRefund(address _user) external view returns (bool) {
        return cancelled && userBets[_user].amount > 0 && !userBets[_user].claimed;
    }

    function isBettingOpen() public view returns (bool) {
        return !isClosed && !emergencyStop && !cancelled && block.timestamp < closingDate;
    }

    function getBettors() external view returns (address[] memory) {
        return bettors;
    }

    function getPoolStats() external view returns (uint256 _totalYes, uint256 _totalNo, uint256 _totalBets, uint256 _bettorCount, bool _isClosed, bool _winnerSet, bool _cancelled) {
        return (totalYes, totalNo, totalBets, bettors.length, isClosed, winnerSet, cancelled);
    }

    function getWinnerPot() external view returns (uint256) {
        return winner ? totalYes : totalNo;
    }

    function getLosingPot() external view returns (uint256) {
        return winner ? totalNo : totalYes;
    }

    function getFeeInfo() external view returns (address _feeWallet, uint256 _feePercentage, uint256 _totalFees, bool _feesClaimed) {
        return (feeWallet, FEE_PERCENTAGE, (winner ? totalNo : totalYes) * FEE_PERCENTAGE / BASIS_POINTS, hasClaimed[address(0)]);
    }

    function getTotalFees() external view returns (uint256) {
        require(winnerSet, "Winner not set yet");
        uint256 totalLosingBets = winner ? totalNo : totalYes;
        return (totalLosingBets * FEE_PERCENTAGE) / BASIS_POINTS;
    }

    function setFeeWallet(address _newFeeWallet) external onlyOwner {
        require(_newFeeWallet != address(0), "Invalid fee wallet address");
        require(_newFeeWallet != feeWallet, "Same fee wallet address");
        feeWallet = _newFeeWallet;
    }

    receive() external payable {}
}

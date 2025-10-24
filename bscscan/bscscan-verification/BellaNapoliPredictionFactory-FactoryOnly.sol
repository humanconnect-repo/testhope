// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// OpenZeppelin Context
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// OpenZeppelin Ownable
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// OpenZeppelin ReentrancyGuard
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

// PredictionPool Contract (needed for Factory)
contract PredictionPool is Ownable, ReentrancyGuard {
    
    // ============ STATE VARIABLES ============
    
    string public title;
    string public description;
    string public category;
    uint256 public closingDate;
    uint256 public closingBid;
    address public factory;
    
    bool public isClosed = false;
    bool public winnerSet = false;
    bool public winner = false;
    bool public cancelled = false;
    bool public emergencyStop = false;
    
    uint256 public totalYes = 0;
    uint256 public totalNo = 0;
    uint256 public totalBets = 0;
    uint256 public totalClaimed = 0;
    
    address[] public bettors;
    
    uint256 public constant FEE_PERCENTAGE = 150; // 1.5%
    address public constant FEE_WALLET = 0x8E49800F0AA47e68ba9e46D97481679D03379294;
    
    // ============ STRUCTS ============
    
    struct Bet {
        bool choice;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }
    
    // ============ MAPPINGS ============
    
    mapping(address => Bet) public userBets;
    
    // ============ EVENTS ============
    
    event BetPlaced(address indexed user, bool choice, uint256 amount, string title, string choiceText);
    event PoolClosed();
    event WinnerSet(bool winner);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _closingDate,
        uint256 _closingBid,
        address _factory
    ) {
        title = _title;
        description = _description;
        category = _category;
        closingDate = _closingDate;
        closingBid = _closingBid;
        factory = _factory;
    }
    
    // ============ BETTING FUNCTIONS ============
    
    function placeBet(bool _choice) external payable nonReentrant {
        require(!isClosed, "Betting is closed");
        require(!emergencyStop, "Emergency stop activated");
        require(!cancelled, "Pool has been cancelled");
        require(block.timestamp <= closingDate, "Betting period has ended");
        require(userBets[msg.sender].amount == 0, "User has already placed a bet");
        require(msg.value > 0, "Bet amount must be greater than 0");
        
        userBets[msg.sender] = Bet({
            choice: _choice,
            amount: msg.value,
            timestamp: block.timestamp,
            claimed: false
        });
        
        if (_choice) {
            totalYes += msg.value;
        } else {
            totalNo += msg.value;
        }
        
        totalBets += msg.value;
        bettors.push(msg.sender);
        
        emit BetPlaced(msg.sender, _choice, msg.value, title, _choice ? "YES" : "NO");
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    function closePool() external onlyOwner {
        require(!isClosed, "Pool already closed");
        isClosed = true;
        emit PoolClosed();
    }
    
    function setWinner(bool _winner) external onlyOwner {
        require(isClosed, "Pool must be closed first");
        require(!winnerSet, "Winner already set");
        require(block.timestamp > closingBid, "Cannot set winner before closing bid");
        
        winner = _winner;
        winnerSet = true;
        emit WinnerSet(_winner);
    }
    
    function cancelPool() external onlyOwner {
        require(!cancelled, "Pool already cancelled");
        require(!winnerSet, "Cannot cancel after winner is set");
        cancelled = true;
    }
    
    function setEmergencyStop(bool _stop) external onlyOwner {
        emergencyStop = _stop;
    }
    
    // ============ VALIDATION FUNCTIONS ============
    
    function canUserBet(address _user) external view returns (bool, string memory) {
        if (cancelled) return (false, "Pool has been cancelled");
        if (emergencyStop) return (false, "Emergency stop activated");
        if (isClosed) return (false, "Betting is closed");
        if (block.timestamp > closingDate) return (false, "Betting period has ended");
        if (userBets[_user].amount > 0) return (false, "User has already placed a bet");
        return (true, "User can place a bet");
    }
    
    function isBettingOpen() external view returns (bool) {
        return !isClosed && !emergencyStop && !cancelled && block.timestamp <= closingDate;
    }
    
    // ============ CLAIM FUNCTIONS ============
    
    function claimRewards() external nonReentrant {
        require(winnerSet, "Winner has not been set yet");
        require(!cancelled, "Pool has been cancelled - use claimRefund instead");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!userBets[msg.sender].claimed, "Rewards already claimed");
        require(userBets[msg.sender].choice == winner, "Not a winner");
        
        uint256 betAmount = userBets[msg.sender].amount;
        uint256 totalWinningBets = winner ? totalYes : totalNo;
        uint256 totalLosingBets = winner ? totalNo : totalYes;
        
        uint256 feeAmount = (totalLosingBets * FEE_PERCENTAGE) / 10000;
        uint256 rewardPool = totalLosingBets - feeAmount;
        uint256 userReward = (betAmount * rewardPool) / totalWinningBets;
        
        userBets[msg.sender].claimed = true;
        totalClaimed += userReward;
        
        payable(msg.sender).transfer(userReward);
        emit RewardsClaimed(msg.sender, userReward);
    }
    
    function claimRefund() external nonReentrant {
        require(cancelled, "Pool has not been cancelled");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!userBets[msg.sender].claimed, "Refund already claimed");
        
        uint256 refundAmount = userBets[msg.sender].amount;
        userBets[msg.sender].claimed = true;
        
        payable(msg.sender).transfer(refundAmount);
        emit RewardsClaimed(msg.sender, refundAmount);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getPoolStats() external view returns (
        uint256 _totalYes,
        uint256 _totalNo,
        uint256 _totalBets,
        bool _isClosed,
        bool _winnerSet,
        bool _winner
    ) {
        return (totalYes, totalNo, totalBets, isClosed, winnerSet, winner);
    }
    
    function getUserBet(address _user) external view returns (
        bool choice,
        uint256 amount,
        uint256 timestamp,
        bool claimed
    ) {
        Bet memory bet = userBets[_user];
        return (bet.choice, bet.amount, bet.timestamp, bet.claimed);
    }
    
    function getAllBettors() external view returns (address[] memory) {
        return bettors;
    }
    
    // ============ FEE FUNCTIONS ============
    
    function withdrawFees() external onlyOwner {
        require(winnerSet, "Winner must be set first");
        require(!cancelled, "Cannot withdraw fees from cancelled pool");
        
        uint256 totalLosingBets = winner ? totalNo : totalYes;
        uint256 feeAmount = (totalLosingBets * FEE_PERCENTAGE) / 10000;
        
        if (feeAmount > 0) {
            payable(FEE_WALLET).transfer(feeAmount);
        }
    }
    
    // ============ FALLBACK ============
    
    receive() external payable {
        // Accept ETH transfers
    }
}

// ============ FACTORY CONTRACT ============

contract BellaNapoliPredictionFactory is Ownable, ReentrancyGuard {
    
    // ============ STATE VARIABLES ============
    
    /// @dev Array of all created pool addresses
    address[] public allPools;
    
    /// @dev Mapping from pool address to pool metadata
    mapping(address => PoolInfo) public poolInfo;
    
    /// @dev Factory fee percentage (1.5% = 150 basis points)
    uint256 public constant FEE_PERCENTAGE = 150; // 1.5%
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    
    /// @dev Total fees collected by the factory
    uint256 public totalFeesCollected;
    
    // ============ STRUCTS ============
    
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
    
    // ============ EVENTS ============
    
    event PoolCreated(
        address indexed poolAddress,
        string title,
        string category,
        address indexed creator,
        uint256 closingDate,
        uint256 closingBid
    );
    
    event PoolClosed(address indexed poolAddress, bool isActive);
    event FeesCollected(address indexed poolAddress, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    constructor() Ownable() {}
    
    // ============ EXTERNAL FUNCTIONS ============
    
    /**
     * @dev Creates a new prediction pool
     * @param _title Title of the prediction event
     * @param _description Detailed description of the prediction
     * @param _category Category of the prediction (e.g., "Crypto", "Sports", "Politics")
     * @param _closingDate Timestamp when betting closes
     * @param _closingBid Timestamp when the prediction event ends
     * @return poolAddress Address of the newly created pool
     */
    function createPool(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _closingDate,
        uint256 _closingBid
    ) external onlyOwner returns (address poolAddress) {
        require(_closingDate > block.timestamp, "Closing date must be in the future");
        require(_closingBid > _closingDate, "Closing bid must be after closing date");
        
        // Deploy new PredictionPool contract
        PredictionPool newPool = new PredictionPool(
            _title,
            _description,
            _category,
            _closingDate,
            _closingBid,
            address(this) // Factory address for fee collection
        );
        
        poolAddress = address(newPool);
        
        // Store pool information
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
        
        // Add to all pools array
        allPools.push(poolAddress);
        
        emit PoolCreated(
            poolAddress,
            _title,
            _category,
            msg.sender,
            _closingDate,
            _closingBid
        );
        
        return poolAddress;
    }
    
    /**
     * @dev Closes a prediction pool (emergency function)
     * @param _poolAddress Address of the pool to close
     */
    function closePool(address _poolAddress) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        require(poolInfo[_poolAddress].isActive, "Pool already closed");
        
        poolInfo[_poolAddress].isActive = false;
        
        emit PoolClosed(_poolAddress, false);
    }
    
    /**
     * @dev Collects fees from a pool when a user claims winnings
     * @param _poolAddress Address of the pool
     * @param _claimAmount Amount being claimed by the user
     * @return feeAmount Amount of fees collected
     */
    function collectFees(address _poolAddress, uint256 _claimAmount) 
        external 
        nonReentrant 
        returns (uint256 feeAmount) 
    {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        require(msg.sender == _poolAddress, "Only pool contract can call this");
        
        feeAmount = (_claimAmount * FEE_PERCENTAGE) / BASIS_POINTS;
        totalFeesCollected += feeAmount;
        
        emit FeesCollected(_poolAddress, feeAmount);
        
        return feeAmount;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Returns the total number of pools created
     * @return count Number of pools
     */
    function getPoolCount() external view returns (uint256 count) {
        return allPools.length;
    }
    
    /**
     * @dev Returns all pool addresses
     * @return pools Array of all pool addresses
     */
    function getAllPools() external view returns (address[] memory pools) {
        return allPools;
    }
    
    /**
     * @dev Returns pool information by address
     * @param _poolAddress Address of the pool
     * @return info Pool information struct
     */
    function getPoolInfo(address _poolAddress) external view returns (PoolInfo memory info) {
        return poolInfo[_poolAddress];
    }
    
    /**
     * @dev Returns pools by category
     * @param _category Category to filter by
     * @return pools Array of pool addresses in the category
     */
    function getPoolsByCategory(string memory _category) external view returns (address[] memory pools) {
        uint256 count = 0;
        
        // Count pools in category
        for (uint256 i = 0; i < allPools.length; i++) {
            if (keccak256(bytes(poolInfo[allPools[i]].category)) == keccak256(bytes(_category))) {
                count++;
            }
        }
        
        // Create result array
        pools = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            if (keccak256(bytes(poolInfo[allPools[i]].category)) == keccak256(bytes(_category))) {
                pools[index] = allPools[i];
                index++;
            }
        }
        
        return pools;
    }
    
    /**
     * @dev Withdraws collected fees to owner
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Fee withdrawal failed");
    }
    
    // ============ FALLBACK ============
    
    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        // Accept direct ETH transfers
    }
}

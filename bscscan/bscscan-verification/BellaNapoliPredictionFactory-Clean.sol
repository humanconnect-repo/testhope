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

// PredictionPool Interface
interface IPredictionPool {
    function placeBet(bool _choice) external payable;
    function claimRewards() external;
    function claimRefund() external;
    function getPoolStats() external view returns (uint256, uint256, uint256, bool, bool, bool);
    function getUserBet(address _user) external view returns (bool, uint256, uint256, bool);
    function getAllBettors() external view returns (address[] memory);
    function isBettingOpen() external view returns (bool);
    function canUserBet(address _user) external view returns (bool, string memory);
    function closePool() external;
    function setWinner(bool _winner) external;
    function cancelPool() external;
    function setEmergencyStop(bool _stop) external;
    function withdrawFees() external;
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
        // Note: This will be replaced with actual PredictionPool deployment
        // For verification purposes, we'll use a placeholder
        poolAddress = address(0); // Placeholder
        
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

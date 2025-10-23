// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title BellaNapoliPredictionFactory
 * @dev Factory contract for creating and managing prediction pools
 * @author Bella Napoli Team
 */
contract BellaNapoliPredictionFactory {
    // ============ STATE VARIABLES ============ 
    
    address[] public allPools;
    mapping(address => PoolMetadata) public poolMetadata;
    uint256 public totalFeesCollected;
    address public owner;
    
    // ============ STRUCTS ============ 
    
    struct PoolMetadata {
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
        address indexed creator,
        string title,
        string category,
        uint256 closingDate,
        uint256 closingBid
    );
    
    event PoolClosed(address indexed poolAddress, bool isActive);
    event FeesCollected(address indexed poolAddress, uint256 amount);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // ============ MODIFIERS ============ 
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }
    
    // ============ CONSTRUCTOR ============ 
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============ EXTERNAL FUNCTIONS ============ 
    
    /**
     * @dev Creates a new prediction pool
     * @param _title Title of the prediction
     * @param _description Description of the prediction
     * @param _category Category (e.g., "Crypto", "Sports", "Politics")
     * @param _closingDate Unix timestamp when betting closes
     * @param _closingBid Unix timestamp when prediction expires
     * @return Address of the created pool
     */
    function createPool(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _closingDate,
        uint256 _closingBid
    ) external onlyOwner returns (address) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(_closingDate > block.timestamp, "Closing date must be in the future");
        require(_closingBid > _closingDate, "Closing bid must be after closing date");
        
        // Create a simple pool contract (simplified version)
        address poolAddress = address(new SimplePredictionPool(
            _title,
            _description,
            _category,
            _closingDate,
            _closingBid,
            address(this)
        ));
        
        allPools.push(poolAddress);
        
        poolMetadata[poolAddress] = PoolMetadata({
            title: _title,
            description: _description,
            category: _category,
            closingDate: _closingDate,
            closingBid: _closingBid,
            creator: msg.sender,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit PoolCreated(poolAddress, msg.sender, _title, _category, _closingDate, _closingBid);
        
        return poolAddress;
    }
    
    /**
     * @dev Returns all created pools
     * @return Array of pool addresses
     */
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }
    
    /**
     * @dev Returns the number of created pools
     * @return Number of pools
     */
    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }
    
    /**
     * @dev Returns metadata for a specific pool
     * @param _poolAddress Address of the pool
     * @return PoolMetadata struct
     */
    function getPoolInfo(address _poolAddress) external view returns (PoolMetadata memory) {
        return poolMetadata[_poolAddress];
    }
    
    /**
     * @dev Collects fees from a pool (called by PredictionPool)
     * @param _poolAddress Address of the pool
     * @param _amount Amount of fees collected
     * @return Amount collected
     */
    function collectFees(address _poolAddress, uint256 _amount) external returns (uint256) {
        require(poolMetadata[_poolAddress].creator != address(0), "Pool does not exist");
        totalFeesCollected += _amount;
        emit FeesCollected(_poolAddress, _amount);
        return _amount;
    }
    
    /**
     * @dev Withdraws collected fees to owner
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Fee withdrawal failed");
        
        totalFeesCollected = 0; // Reset counter after withdrawal
        emit FeesWithdrawn(owner, amount);
    }
    
    /**
     * @dev Closes a pool (emergency function)
     * @param _poolAddress Address of the pool to close
     */
    function closePool(address _poolAddress) external onlyOwner {
        require(poolMetadata[_poolAddress].creator != address(0), "Pool does not exist");
        poolMetadata[_poolAddress].isActive = false;
        emit PoolClosed(_poolAddress, false);
    }
    
    /**
     * @dev Transfers ownership of the contract to a new account
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    
    // ============ RECEIVE FUNCTION ============ 
    
    /**
     * @dev Allows the contract to receive BNB
     */
    receive() external payable {
        // Accepts BNB transfers (fees from pools)
    }
}

/**
 * @title SimplePredictionPool
 * @dev Simplified prediction pool contract
 */
contract SimplePredictionPool {
    string public title;
    string public description;
    string public category;
    uint256 public closingDate;
    uint256 public closingBid;
    address public factory;
    
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
    
    function getPoolInfo() external view returns (string memory, string memory, string memory, uint256, uint256) {
        return (title, description, category, closingDate, closingBid);
    }
}

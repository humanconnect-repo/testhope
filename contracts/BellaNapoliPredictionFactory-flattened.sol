// Sources flattened with hardhat v3.0.9 https://hardhat.org

// SPDX-License-Identifier: MIT

// File npm/@openzeppelin/contracts@4.9.6/utils/Context.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.4) (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File npm/@openzeppelin/contracts@4.9.6/access/Ownable.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File npm/@openzeppelin/contracts@4.9.6/security/ReentrancyGuard.sol

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}


// File contracts/BellaNapoliPredictionFactory.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;


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


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
    event PoolReopened(address indexed poolAddress);
    event PoolWinnerSet(address indexed poolAddress, bool winner);
    event PoolEmergencyResolved(address indexed poolAddress, bool winner, string reason);
    event PoolEmergencyStopToggled(address indexed poolAddress, bool stopped);
    event PoolCancelled(address indexed poolAddress, string reason);
    event PoolFundsRecovered(address indexed poolAddress);

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
        
        // L'ownership della pool è già della Factory (Ownable() usa msg.sender che è la Factory)
        
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
        
        // Chiama closePool sulla pool effettiva
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        pool.closePool();
        
        emit PoolClosed(_poolAddress, false);
    }

    function reopenPool(address _poolAddress) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        require(!poolInfo[_poolAddress].isActive, "Pool is already open");
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        pool.reopenPool();
        poolInfo[_poolAddress].isActive = true;
        emit PoolReopened(_poolAddress);
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
    
    /// @notice Recover unclaimed funds from a cancelled pool OR resolved pool
    /// @dev Only callable by owner, transfers remaining funds from pool to fee wallet
    /// Works for both cancelled pools and resolved pools
    /// @param _poolAddress The pool address to recover funds from
    function recoverCancelledPoolFunds(address _poolAddress) external onlyOwner {
        require(poolInfo[_poolAddress].creator != address(0), "Pool does not exist");
        PredictionPool pool = PredictionPool(payable(_poolAddress));
        pool.emergencyRecoverFunds();
        emit PoolFundsRecovered(_poolAddress);
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
    address public feeWallet2;  // Secondo wallet opzionale
    uint256 public feeSplitPercentage = 0;  // 0 = solo primo wallet, 5000 = 50/50, 3333 = 66.67%/33.33%
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
    event EmergencyFundsRecovered(address indexed to, uint256 amount, uint256 userCount);
    event PoolReopened();

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

    /// @notice Place a bet on this prediction pool
    /// @dev Users can bet YES (true) or NO (false) on the prediction
    /// @param _choice True for YES, False for NO
    /// Emits BetPlaced event with bet details
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

    /// @notice Close the betting pool
    /// @dev Only owner can close the pool at any time (except when cancelled)
    function closePool() external onlyOwner {
        require(!isClosed, "Pool already closed");
        require(!cancelled, "Cannot close a cancelled pool");
        isClosed = true;
    }

    /// @notice Reopen a closed pool (before winner is set)
    /// @dev Only owner can reopen a pool before winner is determined
    function reopenPool() external onlyOwner {
        require(isClosed, "Pool must be closed first");
        require(!winnerSet, "Cannot reopen after winner is set");
        require(!cancelled, "Cannot reopen a cancelled pool");
        isClosed = false;
        emit PoolReopened();
    }

    /// @notice Set the winner of the prediction
    /// @param _winner True if YES won, False if NO won
    function setWinner(bool _winner) external onlyOwner {
        require(isClosed, "Pool must be closed first");
        require(!winnerSet, "Winner already set");
        winner = _winner;
        winnerSet = true;
        string memory reason = _winner ? "YES won" : "NO won";
        emit WinnerSet(_winner, reason);
    }

    /// @notice Claim your winnings if you bet on the correct outcome
    /// @dev Winners receive a proportional share of the prize pool minus fees
    /// Emits RewardClaimed event with reward amount
    function claimWinnings() external nonReentrant {
        require(winnerSet, "Winner not set yet");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!userBets[msg.sender].claimed, "Already claimed");
        require(userBets[msg.sender].choice == winner, "Not a winning bet");
        
        userBets[msg.sender].claimed = true;
        
        uint256 userBet = userBets[msg.sender].amount;
        uint256 totalWinningBets = winner ? totalYes : totalNo;
        
        // Calcolo corretto: l'utente riceve la sua quota proporzionale del pot totale
        // meno la sua quota proporzionale delle commissioni
        uint256 totalPot = totalYes + totalNo;
        uint256 totalFees = (totalPot * FEE_PERCENTAGE) / BASIS_POINTS;  // 1.5% di tutto il pot
        uint256 netPot = totalPot - totalFees;
        
        // La ricompensa è proporzionale alla scommessa dell'utente rispetto alle scommesse vincenti
        uint256 reward = (userBet * netPot) / totalWinningBets;
        
        // Trasferisci le commissioni una sola volta (solo al primo claim)
        if (totalFees > 0 && !hasClaimed[address(0)]) {
            if (feeSplitPercentage > 0 && feeWallet2 != address(0)) {
                // Split delle fee tra due wallet
                uint256 fee1 = (totalFees * (BASIS_POINTS - feeSplitPercentage)) / BASIS_POINTS;
                uint256 fee2 = totalFees - fee1;
                
                (bool feeSuccess1, ) = payable(feeWallet).call{value: fee1}("");
                require(feeSuccess1, "Fee transfer 1 failed");
                
                (bool feeSuccess2, ) = payable(feeWallet2).call{value: fee2}("");
                require(feeSuccess2, "Fee transfer 2 failed");
                
                emit FeeTransferred(feeWallet, fee1);
                emit FeeTransferred(feeWallet2, fee2);
            } else {
                // Solo primo wallet
                (bool feeSuccess, ) = payable(feeWallet).call{value: totalFees}("");
                require(feeSuccess, "Fee transfer failed");
                emit FeeTransferred(feeWallet, totalFees);
            }
            
            hasClaimed[address(0)] = true;
        }
        
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Reward transfer failed");
        
        totalClaimed += reward;
        emit RewardClaimed(msg.sender, reward);
    }

    /// @notice Toggle emergency stop for betting
    /// @param _stop True to pause betting, False to resume
    function setEmergencyStop(bool _stop) external onlyOwner {
        require(!cancelled, "Cannot toggle emergency stop on a cancelled pool");
        emergencyStop = _stop;
        emit EmergencyStopToggled(_stop);
    }

    /// @notice Emergency resolution when pool is stopped
    /// @param _winner The winning outcome (true for YES, false for NO)
    /// @param _reason Reason for emergency resolution
    function emergencyResolve(bool _winner, string memory _reason) external onlyOwner {
        require(emergencyStop, "Emergency stop not activated");
        require(!winnerSet, "Winner already set");
        winner = _winner;
        winnerSet = true;
        emit WinnerSet(_winner, _reason);
    }

    /// @notice Cancel the prediction pool
    /// @param _reason Reason for cancellation
    function cancelPool(string memory _reason) external onlyOwner {
        require(!winnerSet, "Cannot cancel after winner is set");
        require(!cancelled, "Pool already cancelled");
        cancelled = true;
        emit PoolCancelled(_reason);
    }

    /// @notice Claim a refund for a cancelled pool
    /// @dev Returns the full bet amount back to the user when pool is cancelled
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

    /// @notice Emergency recovery of remaining funds from cancelled pool OR resolved pool
    /// @dev Only callable by owner, transfers ALL remaining funds to fee wallet
    /// Works for both cancelled pools and resolved pools (after winner is set)
    function emergencyRecoverFunds() external onlyOwner {
        require(cancelled || winnerSet, "Pool must be cancelled or resolved");
        
        uint256 remainingBalance = address(this).balance;
        require(remainingBalance > 0, "No remaining funds");
        
        // Trasferisci TUTTI i fondi residui al fee wallet (polvere, fondi non reclamati, ecc.)
        (bool success, ) = payable(feeWallet).call{value: remainingBalance}("");
        require(success, "Transfer failed");
        
        emit EmergencyFundsRecovered(feeWallet, remainingBalance, bettors.length);
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
        uint256 totalPot = totalYes + totalNo;
        return (feeWallet, FEE_PERCENTAGE, totalPot * FEE_PERCENTAGE / BASIS_POINTS, hasClaimed[address(0)]);
    }

    function getTotalFees() external view returns (uint256) {
        require(winnerSet, "Winner not set yet");
        uint256 totalPot = totalYes + totalNo;
        return (totalPot * FEE_PERCENTAGE) / BASIS_POINTS;  // 1.5% di tutto il pot
    }

    function setFeeWallet(address _newFeeWallet) external onlyOwner {
        require(_newFeeWallet != address(0), "Invalid fee wallet address");
        require(_newFeeWallet != feeWallet, "Same fee wallet address");
        feeWallet = _newFeeWallet;
    }

    function setFeeWallet2(address _newFeeWallet2) external onlyOwner {
        require(_newFeeWallet2 != address(0), "Invalid fee wallet address");
        feeWallet2 = _newFeeWallet2;
    }

    function setFeeSplit(uint256 _percentage) external onlyOwner {
        require(_percentage <= BASIS_POINTS, "Invalid percentage");
        feeSplitPercentage = _percentage;
    }

    receive() external payable {}
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./BellaNapoliPredictionFactory.sol";
import "./TimeConfig.sol";

/**
 * @title PredictionPool
 * @dev Individual prediction pool contract for a single prediction event
 * @author Bella Napoli Team
 * @notice This contract handles betting on a single prediction event
 *         and distributes rewards to winners
 */
contract PredictionPool is Ownable, ReentrancyGuard {
    
    // ============ STATE VARIABLES ============
    
    /// @dev Pool metadata
    string public title;
    string public description;
    string public category;
    uint256 public closingDate;    // When betting closes
    uint256 public closingBid;     // When the prediction event ends
    address payable public factory;        // Factory contract address
    
    /// @dev Pool state
    bool public isClosed = false;
    bool public winnerSet = false;
    bool public winner;            // true = Yes, false = No
    bool public emergencyStop = false;  // Emergency stop for betting
    bool public cancelled = false;      // Pool cancelled - refunds available
    
    /// @dev Betting totals
    uint256 public totalYes;
    uint256 public totalNo;
    uint256 public totalBets;
    
    /// @dev User betting data
    mapping(address => Bet) public userBets;
    address[] public bettors;
    
    /// @dev Claiming data
    mapping(address => bool) public hasClaimed;
    uint256 public totalClaimed;
    
    /// @dev Fee configuration
    address public constant FEE_WALLET = 0x8E49800F0AA47e68ba9e46D97481679D03379294;
    uint256 public constant FEE_PERCENTAGE = 150; // 1.5%
    uint256 public constant BASIS_POINTS = 10000; // 100%
    
    // ============ STRUCTS ============
    
    struct Bet {
        uint256 amount;
        bool choice;    // true = Yes, false = No
        bool claimed;
        uint256 timestamp;
    }
    
    // ============ EVENTS ============
    
    event BetPlaced(
        address indexed user,
        uint256 amount,
        bool choice,
        uint256 totalYes,
        uint256 totalNo,
        string predictionTitle,
        string userChoice
    );
    
    event WinnerSet(bool winner);
    event RewardClaimed(address indexed user, uint256 amount);
    event PoolClosed();
    event FeeTransferred(address indexed feeWallet, uint256 amount);
    event EmergencyStopToggled(bool stopped);
    event EmergencyResolution(bool winner, string reason);
    event PoolCancelled(string reason);
    event RefundClaimed(address indexed user, uint256 amount);
    
    // ============ MODIFIERS ============
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this");
        _;
    }
    
    modifier bettingOpen() {
        require(block.timestamp <= closingDate, "Betting period has ended");
        require(!isClosed, "Pool is closed");
        _;
    }
    
    modifier bettingClosed() {
        require(block.timestamp > closingDate, "Betting period is still open");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _closingDate,
        uint256 _closingBid,
        address _factory
    ) Ownable() {
        title = _title;
        description = _description;
        category = _category;
        closingDate = _closingDate;
        closingBid = _closingBid;
        factory = payable(_factory);
    }
    
    // ============ EXTERNAL FUNCTIONS ============
    
    /**
     * @dev Places a bet on the prediction pool
     * @param _choice true for "Yes" prediction, false for "No" prediction
     * @notice This function allows users to bet BNB on whether the prediction will be true or false
     * @notice The bet amount is sent as msg.value (in BNB)
     * @notice Users can only place one bet per pool
     * @notice Betting is only allowed before the closing date
     * @notice Fee: 1.5% of losing pot goes to fee wallet
     */
    function placeBet(bool _choice) external payable bettingOpen {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(userBets[msg.sender].amount == 0, "User has already placed a bet");
        require(!emergencyStop, "Betting has been stopped by admin");
        require(!cancelled, "Pool has been cancelled");
        
        // Record the bet
        userBets[msg.sender] = Bet({
            amount: msg.value,
            choice: _choice,
            claimed: false,
            timestamp: block.timestamp
        });
        
        // Add to bettors list if first bet
        if (bettors.length == 0 || bettors[bettors.length - 1] != msg.sender) {
            bettors.push(msg.sender);
        }
        
        // Update totals
        if (_choice) {
            totalYes += msg.value;
        } else {
            totalNo += msg.value;
        }
        
        totalBets += msg.value;
        
        emit BetPlaced(
            msg.sender, 
            msg.value, 
            _choice, 
            totalYes, 
            totalNo,
            title,
            _choice ? "YES" : "NO"
        );
    }
    
    /**
     * @dev Sets the winner after the prediction event ends
     * @param _winner true for Yes, false for No
     */
    function setWinner(bool _winner) external onlyOwner bettingClosed {
        require(!winnerSet, "Winner already set");
        require(block.timestamp > closingBid, "Prediction event has not ended yet");
        
        winner = _winner;
        winnerSet = true;
        isClosed = true;
        
        emit WinnerSet(_winner);
        emit PoolClosed();
    }
    
    /**
     * @dev Claims rewards for winning bets
     * @notice Fee 1.5% viene prelevata dal pool dei perdenti e inviata al wallet fisso
     *         I vincitori ricevono il loro pool + il pool dei perdenti (dopo fee)
     */
    function claim() external nonReentrant {
        require(winnerSet, "Winner not set yet");
        require(!isClosed || winnerSet, "Pool not closed yet");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!hasClaimed[msg.sender], "Already claimed");
        require(userBets[msg.sender].choice == winner, "Not a winning bet");
        
        hasClaimed[msg.sender] = true;
        userBets[msg.sender].claimed = true;
        
        // Calcola i pool
        uint256 winningPot = winner ? totalYes : totalNo;
        uint256 losingPot = winner ? totalNo : totalYes;
        
        // Calcola fee dal pool dei perdenti (1.5%)
        uint256 feeAmount = (losingPot * FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 netLosingPot = losingPot - feeAmount;
        
        // Invia fee al wallet fisso (solo al primo claim)
        if (feeAmount > 0 && !hasClaimed[address(0)]) { // Usa un marker per evitare doppi invii
            (bool feeSuccess, ) = payable(FEE_WALLET).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
            hasClaimed[address(0)] = true; // Marca che la fee è stata inviata
            emit FeeTransferred(FEE_WALLET, feeAmount);
        }
        
        // Calcola premio del vincitore
        uint256 userBetAmount = userBets[msg.sender].amount;
        uint256 totalWinningPot = winningPot + netLosingPot; // Vincitori + perdenti (dopo fee)
        uint256 userReward = (userBetAmount * totalWinningPot) / winningPot;
        
        totalClaimed += userReward;
        
        // Trasferisci premio al vincitore
        (bool success, ) = payable(msg.sender).call{value: userReward}("");
        require(success, "Reward transfer failed");
        
        emit RewardClaimed(msg.sender, userReward);
    }
    
    /**
     * @dev Emergency function to close pool (only factory owner)
     */
    function emergencyClose() external onlyFactory {
        require(!isClosed, "Pool already closed");
        isClosed = true;
        emit PoolClosed();
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Returns user's bet information
     * @param _user User address
     * @return bet Bet struct
     */
    function getUserBet(address _user) external view returns (Bet memory bet) {
        return userBets[_user];
    }
    
    /**
     * @dev Returns all bettor addresses
     * @return Array of bettor addresses
     */
    function getBettors() external view returns (address[] memory) {
        return bettors;
    }
    
    /**
     * @dev Returns pool statistics
     * @return _totalYes Total amount bet on Yes
     * @return _totalNo Total amount bet on No
     * @return _totalBets Total amount bet
     * @return _bettorCount Number of bettors
     * @return _isClosed Whether pool is closed
     * @return _winnerSet Whether winner is set
     * @return _winner The winning choice
     */
    function getPoolStats() external view returns (
        uint256 _totalYes,
        uint256 _totalNo,
        uint256 _totalBets,
        uint256 _bettorCount,
        bool _isClosed,
        bool _winnerSet,
        bool _winner
    ) {
        return (
            totalYes,
            totalNo,
            totalBets,
            bettors.length,
            isClosed,
            winnerSet,
            winner
        );
    }
    
    /**
     * @dev Returns the winning pot amount
     * @return Amount in the winning pot
     */
    function getWinningPot() external view returns (uint256) {
        return winner ? totalYes : totalNo;
    }
    
    /**
     * @dev Returns the losing pot amount
     * @return Amount in the losing pot
     */
    function getLosingPot() external view returns (uint256) {
        return winner ? totalNo : totalYes;
    }
    
    /**
     * @dev Returns pool metadata
     * @return _title Pool title
     * @return _description Pool description
     * @return _category Pool category
     * @return _closingDate When betting closes
     * @return _closingBid When prediction event ends
     */
    function getPoolInfo() external view returns (
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _closingDate,
        uint256 _closingBid
    ) {
        return (title, description, category, closingDate, closingBid);
    }
    
    /**
     * @dev Returns fee information
     * @return _feeWallet Address that receives fees
     * @return _feePercentage Fee percentage in basis points
     * @return _calculatedFee Calculated fee amount from losing pot
     * @return _feeSent Whether fee has been sent
     */
    function getFeeInfo() external view returns (
        address _feeWallet,
        uint256 _feePercentage,
        uint256 _calculatedFee,
        bool _feeSent
    ) {
        uint256 losingPot = winner ? totalNo : totalYes;
        uint256 calculatedFee = (losingPot * FEE_PERCENTAGE) / BASIS_POINTS;
        bool feeSent = hasClaimed[address(0)];
        
        return (FEE_WALLET, FEE_PERCENTAGE, calculatedFee, feeSent);
    }
    
    /**
     * @dev Returns redistribution information
     * @return _winningPot Amount in winning pot
     * @return _losingPot Amount in losing pot
     * @return _feeAmount Fee amount (1.5% of losing pot)
     * @return _netLosingPot Losing pot after fee deduction
     * @return _totalRedistribution Total amount to redistribute to winners
     */
    function getRedistributionInfo() external view returns (
        uint256 _winningPot,
        uint256 _losingPot,
        uint256 _feeAmount,
        uint256 _netLosingPot,
        uint256 _totalRedistribution
    ) {
        uint256 winningPot = winner ? totalYes : totalNo;
        uint256 losingPot = winner ? totalNo : totalYes;
        uint256 feeAmount = (losingPot * FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 netLosingPot = losingPot - feeAmount;
        uint256 totalRedistribution = winningPot + netLosingPot;
        
        return (winningPot, losingPot, feeAmount, netLosingPot, totalRedistribution);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Emergency stop/start betting (only owner)
     * @param _stop true to stop betting, false to resume
     */
    function setEmergencyStop(bool _stop) external onlyOwner {
        emergencyStop = _stop;
        emit EmergencyStopToggled(_stop);
    }
    
    /**
     * @dev Emergency resolution - set winner immediately (only owner)
     * @param _winner true for Yes, false for No
     * @param _reason reason for emergency resolution
     */
    function emergencyResolve(bool _winner, string memory _reason) external onlyOwner {
        require(!winnerSet, "Winner already set");
        require(bytes(_reason).length > 0, "Reason required for emergency resolution");
        
        winner = _winner;
        winnerSet = true;
        isClosed = true;
        emergencyStop = true; // Stop all betting
        
        emit EmergencyResolution(_winner, _reason);
        emit WinnerSet(_winner);
    }
    
    /**
     * @dev Check if betting is currently open (considering emergency stop)
     */
    function isBettingCurrentlyOpen() external view returns (bool) {
        return TimeConfig.isBettingOpen(closingDate) && !emergencyStop && !isClosed && !cancelled;
    }
    
    /**
     * @dev Returns human-readable information about this bet for wallet display
     * @return description String describing what the user is doing
     */
    function getBetDescription() external view returns (string memory) {
        return string(abi.encodePacked(
            "Place a bet on: ", title,
            " | Category: ", category,
            " | Betting closes: ", closingDate
        ));
    }
    
    /**
     * @dev Returns the current betting status for wallet display
     * @return status String describing if betting is open
     */
    function getBettingStatus() external view returns (string memory status) {
        if (emergencyStop) return "Betting is currently paused by admin";
        if (cancelled) return "This pool has been cancelled";
        if (block.timestamp > closingDate) return "Betting period has ended";
        return "Betting is open - you can place your bet";
    }
    
    /**
     * @dev Returns if the user can place a bet with detailed reason
     * @param _user Address of the user
     * @return canBet true if user can bet
     * @return reason reason why user cannot bet (if applicable)
     */
    function canUserBet(address _user) external view returns (bool canBet, string memory reason) {
        if (userBets[_user].amount > 0) {
            return (false, "You have already placed a bet in this pool");
        }
        if (emergencyStop) {
            return (false, "Betting has been paused by admin");
        }
        if (cancelled) {
            return (false, "This pool has been cancelled");
        }
        if (block.timestamp > closingDate) {
            return (false, "Betting period has ended");
        }
        return (true, "You can place your bet");
    }
    
    /**
     * @dev Cancel the pool and allow refunds (only owner)
     * @param _reason reason for cancellation
     */
    function cancelPool(string memory _reason) external onlyOwner {
        require(!winnerSet, "Cannot cancel after winner is set");
        require(!cancelled, "Pool already cancelled");
        require(bytes(_reason).length > 0, "Reason required for cancellation");
        
        cancelled = true;
        isClosed = true;
        emergencyStop = true; // Stop all betting
        
        emit PoolCancelled(_reason);
    }
    
    /**
     * @dev Claim refund for cancelled pool
     */
    function claimRefund() external nonReentrant {
        require(cancelled, "Pool not cancelled");
        require(userBets[msg.sender].amount > 0, "No bet placed");
        require(!hasClaimed[msg.sender], "Already claimed refund");
        
        uint256 refundAmount = userBets[msg.sender].amount;
        hasClaimed[msg.sender] = true;
        userBets[msg.sender].claimed = true;
        
        // Transfer refund to user
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit RefundClaimed(msg.sender, refundAmount);
    }
    
    /**
     * @dev Check if user can claim refund
     */
    function canClaimRefund(address _user) external view returns (bool) {
        return cancelled && 
               userBets[_user].amount > 0 && 
               !hasClaimed[_user];
    }
    
    // ============ FALLBACK ============
    
    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        // Accept direct ETH transfers
    }
}

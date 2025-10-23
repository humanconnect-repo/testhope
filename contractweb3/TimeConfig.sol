// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TimeConfig
 * @dev Configuration file for Italian timezone timestamps
 * @author Bella Napoli Team
 * @notice This library contains timestamp constants for Italian timezone
 *         All times are converted from CET (UTC+1) to UTC for blockchain compatibility
 */
library TimeConfig {
    
    // ============ BTC 150K PREDICTION TIMESTAMPS ============
    
    /// @dev Chiusura scommesse: 15 novembre 2025, 21:59 CET = 15 novembre 2025, 20:59 UTC
    uint256 public constant BTC_150K_BETTING_CLOSE = 1763236740;
    
    /// @dev Scadenza prediction: 31 dicembre 2025, 21:59 CET = 31 dicembre 2025, 20:59 UTC  
    uint256 public constant BTC_150K_PREDICTION_END = 1767211140;
    
    // ============ HELPER FUNCTIONS ============
    
    /**
     * @dev Converts Italian time to UTC timestamp
     * @param year Year (e.g., 2025)
     * @param month Month (1-12)
     * @param day Day (1-31)
     * @param hour Hour in 24h format (0-23)
     * @param minute Minute (0-59)
     * @return timestamp UTC timestamp in seconds
     * @notice Assumes CET timezone (UTC+1)
     */
    function italianTimeToUTC(
        uint256 year,
        uint256 month,
        uint256 day,
        uint256 hour,
        uint256 minute
    ) internal pure returns (uint256 timestamp) {
        // This is a simplified conversion assuming CET (UTC+1)
        // In production, you might want to use a more sophisticated timezone library
        
        // Basic validation
        require(year >= 2024, "Year must be 2024 or later");
        require(month >= 1 && month <= 12, "Month must be 1-12");
        require(day >= 1 && day <= 31, "Day must be 1-31");
        require(hour <= 23, "Hour must be 0-23");
        require(minute <= 59, "Minute must be 0-59");
        
        // Convert to UTC by subtracting 1 hour (CET = UTC+1)
        uint256 utcHour = hour >= 1 ? hour - 1 : 23;
        uint256 utcDay = hour >= 1 ? day : (day > 1 ? day - 1 : 1);
        
        // This is a simplified calculation
        // In production, use a proper date library
        timestamp = (year - 1970) * 365 * 24 * 60 * 60 +
                   (month - 1) * 30 * 24 * 60 * 60 +
                   (utcDay - 1) * 24 * 60 * 60 +
                   utcHour * 60 * 60 +
                   minute * 60;
    }
    
    /**
     * @dev Checks if current time is before betting close
     * @param bettingCloseTimestamp Betting close timestamp
     * @return true if betting is still open
     */
    function isBettingOpen(uint256 bettingCloseTimestamp) internal view returns (bool) {
        return block.timestamp <= bettingCloseTimestamp;
    }
    
    /**
     * @dev Checks if prediction event has ended
     * @param predictionEndTimestamp Prediction end timestamp
     * @return true if prediction event has ended
     */
    function isPredictionEnded(uint256 predictionEndTimestamp) internal view returns (bool) {
        return block.timestamp > predictionEndTimestamp;
    }
    
    /**
     * @dev Gets time remaining until betting close
     * @param bettingCloseTimestamp Betting close timestamp
     * @return seconds remaining (0 if closed)
     */
    function getTimeUntilBettingClose(uint256 bettingCloseTimestamp) internal view returns (uint256) {
        if (block.timestamp >= bettingCloseTimestamp) {
            return 0;
        }
        return bettingCloseTimestamp - block.timestamp;
    }
    
    /**
     * @dev Gets time remaining until prediction end
     * @param predictionEndTimestamp Prediction end timestamp
     * @return seconds remaining (0 if ended)
     */
    function getTimeUntilPredictionEnd(uint256 predictionEndTimestamp) internal view returns (uint256) {
        if (block.timestamp >= predictionEndTimestamp) {
            return 0;
        }
        return predictionEndTimestamp - block.timestamp;
    }
}

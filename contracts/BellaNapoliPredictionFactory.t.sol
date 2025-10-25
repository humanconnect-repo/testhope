// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { BellaNapoliPredictionFactory } from "./BellaNapoliPredictionFactory.sol";

contract BellaNapoliPredictionFactoryTest {
    BellaNapoliPredictionFactory factory;
    address owner;

    function setUp() public {
        factory = new BellaNapoliPredictionFactory();
        owner = address(this);
    }

    function test_InitialState() public view {
        require(factory.owner() == owner, "Owner should be set correctly");
        require(factory.FEE_PERCENTAGE() == 150, "Fee percentage should be 150");
        require(factory.BASIS_POINTS() == 10000, "Basis points should be 10000");
        require(factory.getPoolCount() == 0, "Initial pool count should be 0");
    }

    function test_CreatePool() public {
        uint256 closingDate = block.timestamp + 3600; // 1 hour from now
        uint256 closingBid = closingDate + 1800; // 30 minutes after closing
        
        address poolAddress = factory.createPool(
            "Test Prediction",
            "This is a test prediction",
            "Sports",
            closingDate,
            closingBid
        );
        
        require(poolAddress != address(0), "Pool address should not be zero");
        require(factory.getPoolCount() == 1, "Pool count should be 1");
        
        // Verifica le informazioni del pool
        BellaNapoliPredictionFactory.PoolInfo memory poolInfo = factory.getPoolInfo(poolAddress);
        require(keccak256(bytes(poolInfo.title)) == keccak256(bytes("Test Prediction")), "Title should match");
        require(keccak256(bytes(poolInfo.category)) == keccak256(bytes("Sports")), "Category should match");
        require(poolInfo.isActive == true, "Pool should be active");
    }

    function test_CreatePool_EmptyTitle() public {
        uint256 closingDate = block.timestamp + 3600;
        uint256 closingBid = closingDate + 1800;
        
        bool success = false;
        try factory.createPool("", "Description", "Category", closingDate, closingBid) {
            success = true;
        } catch {
            success = false;
        }
        require(!success, "Should revert with empty title");
    }

    function test_ClosePool() public {
        // Crea un pool
        uint256 closingDate = block.timestamp + 3600;
        uint256 closingBid = closingDate + 1800;
        
        address poolAddress = factory.createPool(
            "Test Pool",
            "Test Description",
            "Sports",
            closingDate,
            closingBid
        );
        
        // Verifica che il pool sia attivo
        BellaNapoliPredictionFactory.PoolInfo memory poolInfo = factory.getPoolInfo(poolAddress);
        require(poolInfo.isActive == true, "Pool should be active initially");
        
        // Chiudi il pool
        factory.closePool(poolAddress);
        
        // Verifica che il pool sia chiuso
        poolInfo = factory.getPoolInfo(poolAddress);
        require(poolInfo.isActive == false, "Pool should be closed after closePool");
    }

    function test_GetPoolsByCategory() public {
        // Crea pool con categorie diverse
        uint256 closingDate = block.timestamp + 3600;
        uint256 closingBid = closingDate + 1800;
        
        address pool1 = factory.createPool("Pool 1", "Desc 1", "Sports", closingDate, closingBid);
        address pool2 = factory.createPool("Pool 2", "Desc 2", "Politics", closingDate, closingBid);
        address pool3 = factory.createPool("Pool 3", "Desc 3", "Sports", closingDate, closingBid);
        
        // Testa la ricerca per categoria
        address[] memory sportsPools = factory.getPoolsByCategory("Sports");
        require(sportsPools.length == 2, "Should have 2 sports pools");
        
        address[] memory politicsPools = factory.getPoolsByCategory("Politics");
        require(politicsPools.length == 1, "Should have 1 politics pool");
        require(politicsPools[0] == pool2, "Politics pool should be pool2");
    }
}
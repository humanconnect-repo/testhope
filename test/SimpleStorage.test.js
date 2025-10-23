const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStorage", function () {
  let simpleStorage;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await SimpleStorage.deploy();
    await simpleStorage.waitForDeployment();
  });

  it("Should store and retrieve a value", async function () {
    const testValue = 42;
    
    // Store a value
    await simpleStorage.set(testValue);
    
    // Retrieve the value
    const storedValue = await simpleStorage.get();
    
    expect(storedValue).to.equal(testValue);
  });

  it("Should return 0 for uninitialized value", async function () {
    const storedValue = await simpleStorage.get();
    expect(storedValue).to.equal(0);
  });
});

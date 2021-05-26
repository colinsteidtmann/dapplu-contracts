const { expect } = require('chai');
const utils = require("../utils/utilities.js");
ethers.utils.Logger.setLogLevel('error');


describe('AgreementFactory', async function () { // LEVEL 1

  let agreementFactory, mockOracle, linkToken, dappluToken;
  let platform, brand, influencer;

  beforeEach(async () => {

    await deployments.fixture(['mocks', 'agreementFactory']);

    // Then, we can get the contracts like normal
    const DappluToken = await deployments.get('DappluToken');
    dappluToken = await ethers.getContractAt('DappluToken', DappluToken.address);

    const LinkToken = await deployments.get('LinkToken');
    linkToken = await ethers.getContractAt('LinkToken', LinkToken.address);

    const MockOracle = await deployments.get('MockOracle');
    mockOracle = await ethers.getContractAt('MockOracle', MockOracle.address);

    const AgreementFactory = await deployments.get('AgreementFactory');
    agreementFactory = await ethers.getContractAt('AgreementFactory', AgreementFactory.address);

    // Set signers
    [_, platform, brand, influencer] = await ethers.getSigners();

  })

  describe("Create agreement with CREATE2", () => { // LEVEL 2

    // Get params to create an agreement with
    const {
      salt, 
      endDate,
      payPerView,
      budget,
      usingEth,
      notUsingEth,
      agreementFile
    } = utils.correctInputParams();
    const ZERO_ADDRESS = utils.ZERO_ADDRESS();

    it("Should let a new agreement be created with ETH when passed in the correct params", async() => {

      // Get the future address
      const futureAddr = await agreementFactory.getAddressForCounterfactualAgreement(
        salt,
        brand.address,
        influencer.address,
        endDate,
        payPerView,
        budget,
        usingEth,
        agreementFile
      );

      // Make an agreement and get the created agreement's address
      const tx = await agreementFactory.createAgreement(
        salt,
        linkToken.address,
        mockOracle.address,
        ZERO_ADDRESS,
        brand.address,
        influencer.address,
        endDate,
        payPerView,
        budget,
        usingEth,
        agreementFile,
        {value: budget}
      );
      const event = await utils.getEvent(tx, agreementFactory, "AgreementCreated");
      const agreementAddr = event.args.agreement;

      // Test that the agreement has the correct address
      assert.equal(futureAddr, agreementAddr, "should have the correct address");

    });

    it("Should let a new agreement be created with dappluToken when passed in correct params", async() => {

      // Get the future address
      const futureAddr = await agreementFactory.getAddressForCounterfactualAgreement(
        salt,
        brand.address,
        influencer.address,
        endDate,
        payPerView,
        budget,
        notUsingEth,
        agreementFile
      );

      // Make an agreement and get the created agreement's address
      await dappluToken.connect(platform).transfer(brand.address, budget);
      await dappluToken.connect(brand).approve(agreementFactory.address, budget);
      const tx = await agreementFactory.connect(platform).createAgreement(
        salt,
        linkToken.address,
        mockOracle.address,
        dappluToken.address,
        brand.address,
        influencer.address,
        endDate,
        payPerView,
        budget,
        notUsingEth,
        agreementFile
      );
      const event = await utils.getEvent(tx, agreementFactory, "AgreementCreated");
      const agreementAddr = event.args.agreement;

      // Test that the agreement has the correct address
      assert.equal(futureAddr, agreementAddr, "should have the correct address");

    })
  })
})



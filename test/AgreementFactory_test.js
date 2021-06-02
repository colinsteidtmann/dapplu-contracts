const { expect } = require('chai');
const utils = require("../utils/utilities.js");
let { networkConfig } = require('../helper-hardhat-config');
ethers.utils.Logger.setLogLevel('error');





// ============ These vars is visibile to all tests ==================
let agreementFactory, oracle, linkToken, dappluToken;
let platform, brand, influencer;
let chainId, jobId, agreementStatuses;





// ============ This runs before every it test ==================
beforeEach(async () => {

    // Set signers amd chainId
    [_, platform, brand, influencer] = await ethers.getSigners();
    chainId = await getChainId();
    jobId = networkConfig[chainId]['jobId'];
    agreementStatuses = utils.agreementStatuses();

    if (network.name === "hardhat") {

        // Get static contracts
        await deployments.fixture(['mocks', 'agreementFactory']);

        const DappluToken = await deployments.get('DappluToken');
        dappluToken = await ethers.getContractAt('DappluToken', DappluToken.address);

        const LinkToken = await deployments.get('LinkToken');
        linkToken = await ethers.getContractAt('LinkToken', LinkToken.address);

        const MockOracle = await deployments.get('MockOracle');
        oracle = await ethers.getContractAt('MockOracle', MockOracle.address);

        const AgreementFactory = await deployments.get('AgreementFactory');
        agreementFactory = await ethers.getContractAt('AgreementFactory', AgreementFactory.address);

    } else {

        // Get static contracts
        dappluToken = await ethers.getContractFactory("DappluToken", networkConfig[chainId]['daiToken']);
        linkToken = await ethers.getContractAt("LinkToken", networkConfig[chainId]['linkToken']);
        oracle = await ethers.getContractAt("LinkToken", networkConfig[chainId]['oracle']);

        // Deploy existing agreement factory contract
        // agreementFactory = await ethers.getContractAt("AgreementFactory", "");

        // Deploy fresh agreement factory contract
        const AgreementFactory = await ethers.getContractFactory("AgreementFactory");
        agreementFactory = await AgreementFactory.connect(platform).deploy("0xf6bb34F530e2789F1abd2c1555B68190f4A5d3dF", platform.address); // old base agreement address
        await agreementFactory.deployed();
        // console.log("AgreementFactory address", agreementFactory.address);

    }

});





// ============ This first group of tests uses ETH as the payment option ==================
describe("AgreementFactory created with ETH", async () => {

    // Params used in the tests
    const {
        salt,
        tokenPaymentAddress,
        endDate,
        payPerView,
        budget,
        usingEth,
        mediaLink,
        oracleFee,
        viewCountHex,
        viewCountNumber,
    } = utils.ethBaseAgreementParams();

    it("Should let a new agreement be created with ETH when passed in the correct params", async () => {

        // Get the future address
        const futureAddr = await agreementFactory.getAddressForCounterfactualAgreement(
            salt,
            brand.address,
            influencer.address,
            endDate,
            payPerView,
            budget,
            usingEth
        );

        // Make an agreement and get the created agreement's address
        const tx = await agreementFactory.createAgreement(
            salt,
            linkToken.address,
            oracle.address,
            tokenPaymentAddress,
            brand.address,
            influencer.address,
            endDate,
            payPerView,
            budget,
            usingEth, { value: budget }
        );

        // Check the created agreement address equals the predicted agreement agreement address
        const agreementCreatedFilter = agreementFactory.filters.AgreementCreated();
        const agreementCreatedLog = await agreementFactory.queryFilter(agreementCreatedFilter);
        const agreementAddr = agreementCreatedLog[0].args.agreement;
        assert.equal(futureAddr, agreementAddr, "Created agreement should have the correct address");

    });

});





// ============ This second group of tests uses Dapplu Token as the payment option ==================
describe("AgreementFactory created with Dapplu Token", async () => {

    // Params used in the tests
    const chainId = await getChainId();
    const {
        salt,
        tokenPaymentAddress,
        endDate,
        payPerView,
        budget,
        usingEth,
        mediaLink,
        oracleFee,
        viewCountHex,
        viewCountNumber,
    } = utils.tokenBaseAgreementParams(chainId);

    it("Should let a new agreement be created with Dapplu Token when passed in the correct params", async () => {

        // Get the future address
        const futureAddr = await agreementFactory.getAddressForCounterfactualAgreement(
            salt,
            brand.address,
            influencer.address,
            endDate,
            payPerView,
            budget,
            usingEth
        );

        // Make an agreement and get the created agreement's address
        const tx = await agreementFactory.createAgreement(
            salt,
            linkToken.address,
            oracle.address,
            tokenPaymentAddress,
            brand.address,
            influencer.address,
            endDate,
            payPerView,
            budget,
            usingEth, { value: budget }
        );

        // Check the created agreement address equals the predicted agreement agreement address
        const agreementCreatedFilter = agreementFactory.filters.AgreementCreated();
        const agreementCreatedLog = await agreementFactory.queryFilter(agreementCreatedFilter);
        const agreementAddr = agreementCreatedLog[0].args.agreement;
        assert.equal(futureAddr, agreementAddr, "Created agreement should have the correct address");

    });

});
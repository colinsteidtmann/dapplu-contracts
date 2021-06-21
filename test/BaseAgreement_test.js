const { expect } = require('chai');
const { waffle } = require("hardhat");
const utils = require("../utils/utilities.js");
let { networkConfig } = require('../helper-hardhat-config');
ethers.utils.Logger.setLogLevel('error');





// ============ These vars is visibile to all tests ==================
let agreementFactory, baseAgreement, oracle, linkToken, dappluToken;
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
        await deployments.fixture(['mocks', 'baseAgreement', 'agreementFactory']);

        const DappluToken = await deployments.get('DappluToken');
        dappluToken = await ethers.getContractAt('DappluToken', DappluToken.address);

        const LinkToken = await deployments.get('LinkToken');
        linkToken = await ethers.getContractAt('LinkToken', LinkToken.address);

        const MockOracle = await deployments.get('MockOracle');
        oracle = await ethers.getContractAt('MockOracle', MockOracle.address);

        const BaseAgreement = await deployments.get('BaseAgreement');
        baseAgreement = await ethers.getContractAt('BaseAgreement', BaseAgreement.address);

        const AgreementFactory = await deployments.get('AgreementFactory');
        agreementFactory = await ethers.getContractAt('AgreementFactory', AgreementFactory.address);

    } else {

        // Get static contracts
        linkToken = await ethers.getContractAt("LinkToken", networkConfig[chainId]['linkToken']);
        oracle = await ethers.getContractAt("MockOracle", networkConfig[chainId]['oracle']);

        // Deploy existing Dapplu Token contract
        dappluToken = await ethers.getContractAt("DappluToken", "0xBb65172b5D28322DE505F6243583C520C2B03a01")

        // Deploy fresh Dapplu Token contract
        // const DappluToken = await ethers.getContractFactory("DappluToken");
        // dappluToken = await DappluToken.connect(platform).deploy(10000); // assign the platform 100 dappluTokens

        // Deploy existing Base Agreement contract
        //baseAgreement = await ethers.getContractAt("BaseAgreement", "0x6960a482DA31FEb7603191851e791afAAded8ff2");

        // Deploy Agreement Factory 
        agreementFactory = await ethers.getContractAt("AgreementFactory", "0xD9588c6b0bCECf64F707b331Ad64c78719a791e7");
       
        // Deploy fresh Base Agreement contract
        // const BaseAgreement = await ethers.getContractFactory("BaseAgreement");
        // baseAgreement = await BaseAgreement.connect(platform).deploy();
        // await baseAgreement.deployed();
        
        // console.log("BaseAgreement address", baseAgreement.address);

    }

});





// ============ This first group of tests uses ETH as the payment option ==================
// describe("Base agreement made with ETH", () => {

//     // Params used in the tests
//     let salt;
//     const {
//         tokenPaymentAddress,
//         endDate,
//         payPerView,
//         budget,
//         usingEth,
//         mediaLink,
//         oracleFee,
//         viewCountHex,
//         viewCountNumber,
//     } = utils.ethBaseAgreementParams();

//     // Initialize the base agreement with eth (like the factory would) before every test
//     beforeEach(async () => {
//         let {salt} = utils.ethBaseAgreementParams();

//         // Get the future address
//         const futureAddr = await agreementFactory.getAddressForCounterfactualAgreement(
//             salt,
//             brand.address,
//             influencer.address,
//             endDate,
//             payPerView,
//             budget,
//             usingEth
//         );

//         // Make an agreement and get the created agreement's address
//         await agreementFactory.connect(platform).createAgreement(
//                 salt,
//                 linkToken.address,
//                 oracle.address,
//                 tokenPaymentAddress,
//                 brand.address,
//                 influencer.address,
//                 endDate,
//                 payPerView,
//                 budget,
//                 usingEth,
//                 {value: budget}
//         );
//         const agreementCreatedFilter = agreementFactory.filters.AgreementCreated();
//         const agreementCreatedLog = await agreementFactory.queryFilter(agreementCreatedFilter);
//         const agreementAddr = agreementCreatedLog.slice(-1).pop().args.agreement;
//         assert.equal(futureAddr, agreementAddr, "Created agreement should have the correct address");
//         baseAgreement = await ethers.getContractAt("BaseAgreement", agreementAddr);
//     });

//     it("Should let influencer approve an agreement", async () => {

//         // Compare agreement status and media link before and after the influencer approves it
//         // Once influencer uploads a media link, make sure the agreement moved from proposed to active.

//         let details;

//         details = await baseAgreement.getAgreementDetails();
//         assert.equal(details._agreementStatus, agreementStatuses.Proposed, "status equals proposed");

//         await baseAgreement.connect(influencer).approveAgreement(mediaLink);

//         details = await baseAgreement.getAgreementDetails();
//         assert.equal(details._mediaLink, mediaLink, "submitted media link equals stored media link");
//         assert.equal(details._agreementStatus, agreementStatuses.Active, "status equals active");

//     });

//     it("Should let influencer reject an agreement and then refund everyone", async () => {

//         // Compare agreement status before and after the influencer rejects it
//         // Once influencer rejects it, make sure the agreement moved from proposed to rejected.
//         // Then make sure the brand got refunded its budget

//         let details;

//         details = await baseAgreement.getAgreementDetails();
//         assert.equal(details._agreementStatus, agreementStatuses.Proposed, "status equals proposed");

//         await baseAgreement.connect(influencer).rejectAgreement();

//         details = await baseAgreement.getAgreementDetails();
//         assert.equal(details._agreementStatus, agreementStatuses.Rejected, "status equals rejected");

//         const refundedBrandFilter = baseAgreement.filters.PaidSomeone(null, brand.address, null);
//         const refundedBrandLog = await baseAgreement.queryFilter(refundedBrandFilter);
//         const refundedAmount = refundedBrandLog[0].args.amount.toString()
//         assert.equal(refundedAmount, budget, "brand got refunded budget amount");
//         // console.log(`brand got refunded budget amount (${refundedAmount} refunded)`);

//     });

//     it("Should let influencer get views and withdraw", async () => {

//         // Fund agreement with link tokens
//         await linkToken.connect(platform).transfer(baseAgreement.address, ethers.utils.parseEther("0.2"));

//         // Approve the agreement to meet required conditions
//         await baseAgreement.connect(influencer).approveAgreement(mediaLink);

//         // Call withdraw
//         const tx = await baseAgreement.connect(influencer).withdraw(
//             jobId,
//             oracleFee
//         );

//         if (network.name === "hardhat") {

//             // Get oracle return data and fulfull chainlink request
//             const tx_receipt = await tx.wait();
//             const requestId = tx_receipt.events[0].topics[1];
//             const returnData = web3.utils.padRight(web3.utils.toHex(viewCountHex), 64);
//             const fulfill_tx = await oracle.fulfillOracleRequest(requestId, returnData);
//             await fulfill_tx.wait();

//         } else {

//             //wait 30 secs for oracle to callback
//             await new Promise(resolve => setTimeout(resolve, 30000));

//         }


//         // Check if the view counts on the video were found and recieved
//         const viewCountFilter = baseAgreement.filters.ViewCountResponse();
//         const viewCountLog = await baseAgreement.queryFilter(viewCountFilter);
//         const views = parseInt(viewCountLog[0].args.viewCount.toString());
//         assert.isAbove(views, 0, "video viewCount greater than 0");
//         // console.log(`video viewCount greater than 0 (${views} views)`);

//         // Check if the influencer was paid the full budget amount. 
//         const paidInfluencerFilter = baseAgreement.filters.PaidSomeone(null, influencer.address, null);
//         const paidInfluencerLog = await baseAgreement.queryFilter(paidInfluencerFilter);
//         const paidAmount = paidInfluencerLog[0].args.amount.toString();
//         assert.equal(paidAmount, budget, "influencer got paid full budget amount");
//         // console.log(`influencer got paid full budget amount (${paidAmount})`);

//     });

// });





// ============ This second group of tests uses Dapplu Token as the payment option ==================
describe("Base agreement made with Dapplu Token", () => {

    // Params used in the tests
    let salt;
    const {
        endDate,
        payPerView,
        budget,
        usingEth,
        mediaLink,
        oracleFee,
        viewCountHex,
        viewCountNumber,
    } = utils.tokenBaseAgreementParams(chainId);

    // Initialize the base agreement with eth (like the factory would) before every test
    beforeEach(async () => {
        let {salt} = utils.tokenBaseAgreementParams(chainId);

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

        // Approve the future contract to spend the platform's dapplu token
        await dappluToken.connect(platform).approve(agreementFactory.address, budget);

        // Make an agreement and get the created agreement's address
        await agreementFactory.connect(platform).createAgreement(
                salt,
                linkToken.address,
                oracle.address,
                dappluToken.address,
                brand.address,
                influencer.address,
                endDate,
                payPerView,
                budget,
                usingEth
        );


        const agreementCreatedFilter = agreementFactory.filters.AgreementCreated();
        const agreementCreatedLog = await agreementFactory.queryFilter(agreementCreatedFilter);
        const agreementAddr = agreementCreatedLog.slice(-1).pop().args.agreement;
        assert.equal(futureAddr, agreementAddr, "Created agreement should have the correct address");
        baseAgreement = await ethers.getContractAt("BaseAgreement", agreementAddr);

    });

    it("Should let influencer approve an agreement", async () => {

        // Compare agreement status and media link before and after the influencer approves it
        // Once influencer uploads a media link, make sure the agreement moved from proposed to active.

        let details;

        details = await baseAgreement.getAgreementDetails();
        assert.equal(details._agreementStatus, agreementStatuses.Proposed, "status equals proposed");

        await baseAgreement.connect(influencer).approveAgreement(mediaLink);

        details = await baseAgreement.getAgreementDetails();
        assert.equal(details._mediaLink, mediaLink, "submitted media link equals stored media link");
        assert.equal(details._agreementStatus, agreementStatuses.Active, "status equals active");

    });

    it("Should let influencer reject an agreement and then refund everyone", async () => {

        // Compare agreement status before and after the influencer rejects it
        // Once influencer rejects it, make sure the agreement moved from proposed to rejected.
        // Then make sure the brand got refunded its budget

        let details;

        details = await baseAgreement.getAgreementDetails();
        assert.equal(details._agreementStatus, agreementStatuses.Proposed, "status equals proposed");

        await baseAgreement.connect(influencer).rejectAgreement();

        details = await baseAgreement.getAgreementDetails();
        assert.equal(details._agreementStatus, agreementStatuses.Rejected, "status equals rejected");

        const refundedBrandFilter = baseAgreement.filters.PaidSomeone(null, brand.address, null);
        const refundedBrandLog = await baseAgreement.queryFilter(refundedBrandFilter);
        const refundedAmount = refundedBrandLog[0].args.amount.toString()
        assert.equal(refundedAmount, budget, "brand got refunded budget amount");
        // console.log(`brand got refunded budget amount (${refundedAmount} refunded)`);

    });

    it("Should let influencer get views and withdraw", async () => {

        // Fund agreement with link tokens
        await linkToken.connect(platform).transfer(baseAgreement.address, ethers.utils.parseEther("0.2"));

        // Approve the agreement to meet required conditions
        await baseAgreement.connect(influencer).approveAgreement(mediaLink);

        // Call withdraw
        const tx = await baseAgreement.connect(influencer).withdraw(
            jobId,
            oracleFee
        );

        if (network.name === "hardhat") {

            // Get oracle return data and fulfull chainlink request
            const tx_receipt = await tx.wait();
            const requestId = tx_receipt.events[0].topics[1];
            const returnData = web3.utils.padRight(web3.utils.toHex(viewCountHex), 64);
            const fulfill_tx = await oracle.fulfillOracleRequest(requestId, returnData);
            await fulfill_tx.wait();

        } else {

            //wait 30 secs for oracle to callback
            await new Promise(resolve => setTimeout(resolve, 30000));

        }


        // Check if the view counts on the video were found and recieved
        const viewCountFilter = baseAgreement.filters.ViewCountResponse();
        const viewCountLog = await baseAgreement.queryFilter(viewCountFilter);
        const views = parseInt(viewCountLog[0].args.viewCount.toString());
        assert.isAbove(views, 0, "video viewCount greater than 0");
        // console.log(`video viewCount greater than 0 (${views} views)`);

        // Check if the influencer was paid the full budget amount. 
        const paidInfluencerFilter = baseAgreement.filters.PaidSomeone(null, influencer.address, null);
        const paidInfluencerLog = await baseAgreement.queryFilter(paidInfluencerFilter);
        const paidAmount = paidInfluencerLog[0].args.amount.toString();
        assert.equal(paidAmount, budget, "influencer got paid full budget amount");
        // console.log(`influencer got paid full budget amount (${paidAmount})`);

    });

});
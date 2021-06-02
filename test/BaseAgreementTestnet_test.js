const { expect } = require('chai');
const { waffle } = require("hardhat");
const utils = require("../utils/utilities.js");
let { networkConfig } = require('../helper-hardhat-config');

describe('BaseAgreement', async function () { // LEVEL 1

  let baseAgreement, mockOracle, linkToken, dappluToken;
  let platform, brand, influencer;
  let chainId;

  beforeEach(async () => {
    // Set signers amd chainId
    [_, platform, brand, influencer] = await ethers.getSigners();
    chainId = await getChainId();

    dappluToken = await ethers.getContractFactory("DappluToken", networkConfig[chainId]['daiToken']);

    linkToken = await ethers.getContractAt("LinkToken", networkConfig[chainId]['linkToken']);

    // mockOracle = await ethers.getContractAt("MockOracle", networkConfig[chainId]['oracle']);

    // baseAgreement = await ethers.getContractAt("BaseAgreement", networkConfig[chainId]['baseAgreement']);
    const BaseAgreement = await ethers.getContractFactory("BaseAgreement");
    baseAgreement = await BaseAgreement.connect(platform).deploy();
    await baseAgreement.deployed();

  });

  describe("Init base agreement with ETH", () => { // LEVEL 2

    // Get correct params for testing
    const {
      // salt, 
      // endDate,
      // payPerView,
      // budget,
      // usingEth,
      // notUsingEth,

      // mediaLink,
      // viewCountNumber,
      // viewCountHex,
      oracleFee
    } = utils.correctInputParams();
    // const ZERO_ADDRESS = utils.ZERO_ADDRESS();
    // const agreementStatuses = utils.agreementStatuses();
    let chainId, jobId;

    beforeEach(async () => {
      // Set chainId and jobId
      chainId = await getChainId();
      jobId = networkConfig[chainId]['jobId'];
      

      // Initialize the base agreement like the factory would
      // await baseAgreement.connect(platform).init(
      //   platform.address,
      //   linkToken.address,
      //   mockOracle.address,
      //   ZERO_ADDRESS, // zero address for tokenPayment address because we're using eth.
      //   brand.address,
      //   influencer.address,
      //   endDate,
      //   payPerView,
      //   budget,
      //   usingEth
      // )

      // Fund the base agreement with eth like the factory would
      // const tx = {to: baseAgreement.address, value: ethers.utils.hexlify(budget)};
      // await platform.sendTransaction(tx);

    });

    describe("Approve agreement", () => { // LEVEL 3

      // it("should let influencer approve an agreement", async() => {

      //   // Compare agreement status and media link before and after the influencer approves it
      //   let details;
      //   details = await baseAgreement.getAgreementDetails();
      //   assert.equal(details._agreementStatus, agreementStatuses.Proposed, "status equals proposed");
      //   await baseAgreement.connect(influencer).approveAgreement(mediaLink);
      //   details = await baseAgreement.getAgreementDetails();

      //   assert.equal(details._mediaLink, mediaLink, "media link equals");
      //   assert.equal(details._agreementStatus, agreementStatuses.Active, "status equals active");

      // });

      // it("should let influencer reject an agreement", async() => {

      //   // Compare agreement status before and after the influencer rejects it
      //   let details;
      //   details = await baseAgreement.getAgreementDetails();
      //   assert.equal(details._agreementStatus, agreementStatuses.Proposed, "status equals proposed");
      //   await baseAgreement.connect(influencer).rejectAgreement();
      //   details = await baseAgreement.getAgreementDetails();
      //   assert.equal(details._agreementStatus, agreementStatuses.Rejected, "status equals rejected");

      // });

      it("should let influencer get views and withdraw", async() => {

        // Fund agreement with link tokens
        await linkToken.connect(platform).transfer(baseAgreement.address, ethers.utils.parseEther("0.2"));

        // Approve the agreement to meet required conditions
        // await baseAgreement.connect(influencer).approveAgreement(mediaLink);
        
        // Perform withdraw and prep api response
        // baseAgreement.connect(influencer).requestVolumeData();
        const transaction = await baseAgreement.connect(influencer).withdraw(
          jobId, 
          oracleFee
        );
        const tx_receipt = await transaction.wait()

        const apiResponse = (await baseAgreement.connect(influencer).getApiResponse()).value.toString();
        console.log("apiResponse", apiResponse);

        // Get influencer balance before oracle fulfulls
        // const influencerBalance1 = await influencer.getBalance();

        // // Get influencer balance after oracle fulfulls
        // const influencerBalance2 = await influencer.getBalance();
        // const difference = influencerBalance2.sub(influencerBalance1);

        // console.log("difference", difference.toString());

        // assert.equal(difference.toString(), viewCountNumber * payPerView, "influencer paid correctly");

      });
    });
  });
});



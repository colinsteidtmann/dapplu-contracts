/* global artifacts */
const ethers = require("ethers");
let { networkConfig } = require('../helper-hardhat-config');


const utilities = {

  agreementStatuses: () => ({"Proposed":0, "Rejected":1, "Active":2, "Completed":3}),

  ZERO_ADDRESS: () => ethers.constants.AddressZero,

  generateSaltValue: () => ethers.utils.hexZeroPad(ethers.BigNumber.from(ethers.utils.randomBytes(20)).toHexString(), 20),

  generateJobId: () => ethers.utils.hexZeroPad(ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString(), 32),

  ethBaseAgreementParams: () => {
    return ({
      salt: utilities.generateSaltValue(),
      tokenPaymentAddress: ethers.constants.AddressZero,
      endDate: Date.now()+24*60*60, // 1 day from now in unix seconds
      payPerView: 1, 
      budget: 10, 
      usingEth: true,
      mediaLink: "cPqK_zkTXIk",
      viewCountNumber: 10,
      viewCountHex: "0x22313022",
      oracleFee: ethers.utils.parseEther("0.1")
    })
  },

  tokenBaseAgreementParams: (chainId) => {
    return ({
      salt: utilities.generateSaltValue(),
      endDate: Date.now()+24*60*60, // 1 day from now in unix seconds
      payPerView: 1, 
      budget: 10, 
      usingEth: false,
      mediaLink: "cPqK_zkTXIk",
      viewCountNumber: 10,
      viewCountHex: "0x22313022",
      oracleFee: ethers.utils.parseEther("0.1")
    })
  },

  getRecentEvent: async (txReceipt, eventName) => {
    const res = await txReceipt.wait();
    const eventsWithEventName = res.events.filter((e) => e.event == eventName);
    const event = eventsWithEventName.filter((e) => e.transactionHash == txReceipt.hash)[0];
    return event;
  },


};

module.exports = utilities;
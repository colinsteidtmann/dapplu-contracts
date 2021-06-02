/* global artifacts */
const ethers = require("ethers");


const utilities = {

  getEvent: async (txReceipt, emitter, eventName) => {
  	const res = await txReceipt.wait();
  	const eventsWithEventName = res.events.filter((e) => e.event == eventName);
  	const event = eventsWithEventName.filter((e) => e.transactionHash == txReceipt.hash)[0];
  	return event;
  },

  generateSaltValue: () => ethers.utils.hexZeroPad(ethers.BigNumber.from(ethers.utils.randomBytes(20)).toHexString(), 20),

  generateJobId: () => ethers.utils.hexZeroPad(ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString(), 32),

  correctInputParams: () => {
    return ({
      salt: utilities.generateSaltValue(),
      endDate: Date.now()+24*60*60, // 1 day from now in unix seconds
      payPerView: 1, 
      budget: 10, 
      usingEth: true,
      notUsingEth: false,
      mediaLink: "cPqK_zkTXIk",
      viewCountNumber: 3,
      viewCountHex: "0x33",
      oracleFee: ethers.utils.parseEther("0.1")
    })
  },

  agreementStatuses: () => ({"Proposed":0, "Rejected":1, "Active":2, "Completed":3}),

  ZERO_ADDRESS: () => ethers.constants.AddressZero,

};

module.exports = utilities;
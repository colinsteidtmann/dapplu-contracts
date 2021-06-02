KovanAgreementFactory = require("./deployments/kovan/AgreementFactory.json");
KovanBaseAgreement = require("./deployments/kovan/BaseAgreement.json");


const networkConfig = {
    default: {
        name: 'hardhat',
        fee: '100000000000000000',
        keyHash: '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4',
        jobId: '0x3530666334323135663839343433643138356230363165356437616639343930'
    },
    31337: {
        name: 'localhost',
        fee: '100000000000000000',
        keyHash: '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4',
        jobId: '0x3530666334323135663839343433643138356230363165356437616639343930'
    },
    42: {
        name: 'kovan',
        linkToken: '0xa36085F69e2889c224210F603D836748e7dC0088',
        daiToken: '0xc4375b7de8af5a38a93548eb8453a498222c4ff2',
        agreementFactory: KovanAgreementFactory.address,
        baseAgreement: KovanBaseAgreement.address,
        oracle: '0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e',
        jobId: '0x3530666334323135663839343433643138356230363165356437616639343930',
        fee: '100000000000000000',
    },
    4: {
        name: 'rinkeby',
        linkToken: '0x01be23585060835e02b77ef475b0cc51aa1e0709',
        ethUsdPriceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
        keyHash: '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311',
        vrfCoordinator: '0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B',
        oracle: '0x7AFe1118Ea78C1eae84ca8feE5C65Bc76CcF879e',
        jobId: '6d1bfe27e7034b1d87b5270556b17277',
        fee: '100000000000000000',
    },
    1: {
        name: 'mainnet',
        linkToken: '0x514910771af9ca656af840dff83e8264ecf986ca'
    },
    5: {
        name: 'goerli',
        linkToken: '0x326c977e6efc84e512bb9c30f76e30c160ed06fb'
    }
}

const getNetworkIdFromName = async (networkIdName) => {
    for (const id in networkConfig) {
        if (networkConfig[id]['name'] == networkIdName) {
            return id
        }
    }
    return null
}

module.exports = {
    networkConfig,
    getNetworkIdFromName
}


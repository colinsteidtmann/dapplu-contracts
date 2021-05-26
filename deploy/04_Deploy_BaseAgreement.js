let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
  getNamedAccounts,
  deployments
}) => {
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = await getChainId()
  let linkTokenAddress
  let additionalMessage = ""

  if (chainId == 31337) {
    linkToken = await get('LinkToken')
    linkTokenAddress = linkToken.address
    additionalMessage = " --linkaddress " + linkTokenAddress
  } 

  const baseAgreement = await deploy('BaseAgreement', {
    from: deployer,
    args: [],
    log: true
  });

  log("Run the following command to fund contract with LINK:")
  log("npx hardhat fund-link --contract " + baseAgreement.address + " --network " + networkConfig[chainId]['name'] + additionalMessage)
  log("Then run Agreement Factory contract with following command:")
  log("npx hardhat request-data --contract " + baseAgreement.address + " --network " + networkConfig[chainId]['name'])
  log("----------------------------------------------------")
}

module.exports.tags = ['all', 'baseAgreement']

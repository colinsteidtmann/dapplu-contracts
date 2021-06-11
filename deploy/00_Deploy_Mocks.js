module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const DECIMALS = '18'
    const INITIAL_PRICE = '200000000000000000000'
    const { deploy, log } = deployments
    const { deployer, platform } = await getNamedAccounts()
    const accounts = await getNamedAccounts();
    const chainId = await getChainId()
    // If we are on a local development network, we need to deploy mocks!
    if (chainId == 31337) {
        log("Local network detected! Deploying mocks...")
        const dappluToken = await deploy('DappluToken', { from: platform, log: true, args: ["100"] });
        const linkToken = await deploy('LinkToken', { from: deployer, log: true })
        await deploy('MockOracle', {
            from: deployer,
            log: true,
            args: [linkToken.address]
        })
        log("Mocks Deployed!")
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        log("You are deploying to a local network, you'll need a local network running to interact")
        log("Please run `npx hardhat console` to interact with the deployed smart contracts!")
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    }
}
module.exports.tags = ['all', 'mocks']

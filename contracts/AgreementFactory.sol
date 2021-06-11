// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/fa64a1ced0b70ab89073d5d0b6e01b0778f7e7d6/contracts/token/ERC20/SafeERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/fa64a1ced0b70ab89073d5d0b6e01b0778f7e7d6/contracts/proxy/Clones.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./BaseAgreement.sol";


contract AgreementFactory {
    using SafeERC20 for IERC20;

    // The address of the base agreement implementation
    address public agreementImplementation;
    // The address of the platform
    address payable public platformAddress;

    // *************** Events *************************** //

    event PlatformAddressChanged(address addr);
    event AgreementCreated(
        address indexed agreement, 
        address indexed brand, 
        address indexed influencer
    );

    // *************** Modifiers ********************** //
    
    /**
     * @dev Restrict acces to only the platform
     */
    modifier onlyPlatform() {
        require(platformAddress == msg.sender, "Only platform");
        _;
    }

    // *************** Constructor ********************** //
    
    /**
     * @dev Initialize the factory contract
     * 
     */
    constructor (address _agreementImplementation, address payable _platformAddress) public {

        require(_agreementImplementation != address(0), "AF: AgreementImplementation address not defined");
        require(_platformAddress != address(0), "AF: platform address not defined");
        agreementImplementation = _agreementImplementation;
        platformAddress = _platformAddress;
    }


    // *************** External Functions ********************* //

    /**
     * @dev Create an agreement
     */
    function createAgreement(
        bytes20 _salt,
        address _link,
        address _oracle,
        address _tokenPaymentAddress,
        address payable _brand,
        address payable _influencer,
        uint256 _endDate,
        uint256 _payPerView,
        uint256 _budget,
        bool _usingEth
    ) 
        external
        payable 
        returns (address _agreement) 
    {
        // Validate inputs
        // Create new salt
        bytes32 newsalt = newSalt(
            _salt,
            _brand, 
            _influencer,
            _endDate,
            _payPerView,
            _budget,
            _usingEth
        );
        // Create agreement
        address payable agreement = payable(Clones.cloneDeterministic(agreementImplementation, newsalt));
        // Configure agreement
        configureAgreement(
            BaseAgreement(agreement),
            _link,
            _oracle,
            _tokenPaymentAddress,
            msg.sender, 
            _brand,
            _influencer,
            _endDate,
            _payPerView,
            _budget,
            _usingEth
        );
        // emit event
        emit AgreementCreated(
            agreement,
            _brand, 
            _influencer
        );
        
        // return agreement;
        return agreement;
    }

    /**
     * @dev Get agreements for a user
     */
     function getAddressForCounterfactualAgreement(
        bytes20 _salt,
        address _brand,
        address _influencer,
        uint256 _endDate,
        uint256 _payPerView,
        uint256 _budget,
        bool _usingEth
    ) 
        external 
        view
        returns (address _agreement)
    {
        bytes32 newsalt = newSalt(
            _salt,
            _brand,
            _influencer,
            _endDate,
            _payPerView,
            _budget,
            _usingEth
        );
        _agreement = Clones.predictDeterministicAddress(agreementImplementation, newsalt);

    }

    /**
     * @dev Solidity required recieve function
     */
    receive() external payable { }

     // *************** Internal Functions ********************* //

    /**
     * @dev Configures an agreement for a set of input params
     */
    function configureAgreement(
        BaseAgreement _agreement,
        address _link, 
        address _oracle,
        address _tokenPaymentAddress,
        address payable _sender,
        address payable _brand,
        address payable _influencer,
        uint256 _endDate,
        uint256 _payPerView,
        uint256 _budget,
        bool _usingEth
    )
        internal 
    {
        // Handle eth if received
        if (_usingEth) {
            // transfer funds to the agreement
            (bool success, ) = payable(address(_agreement)).call{value: _budget}("");
            require(success, "Unable to transfer");
        } else {
            IERC20 token = IERC20(_tokenPaymentAddress);
            // transfer funds to the agreement
            token.transferFrom(_sender, payable(address(_agreement)), _budget);
        }
        // Initialize the agreement
        _agreement.init(
            platformAddress,
            _link,
            _oracle,
            _tokenPaymentAddress,
            _brand, 
            _influencer,
            _endDate,
            _payPerView,
            _budget,
            _usingEth
        );
        // Give the agreement access to the factory's link
        LinkTokenInterface link = LinkTokenInterface(_link);
        link.approve(payable(address(_agreement)), link.balanceOf(address(this)));

    }

    /**
     */
    function newSalt(
        bytes20 _salt,
        address _brand, 
        address _influencer,
        uint256 _endDate,
        uint256 _payPerView,
        uint256 _budget,
        bool _usingEth

    ) 
        internal 
        pure 
        returns (bytes32) 
    {
        return keccak256(
            abi.encodePacked(keccak256(abi.encodePacked(
                _brand,
                _influencer,
                _endDate,
                _payPerView,
                _budget,
                _usingEth
            )), _salt
        ));
    }
    
}


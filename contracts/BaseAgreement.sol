// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;


import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.6/interfaces/LinkTokenInterface.sol";

// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/fa64a1ced0b70ab89073d5d0b6e01b0778f7e7d6/contracts/token/ERC20/IERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/fa64a1ced0b70ab89073d5d0b6e01b0778f7e7d6/contracts/token/ERC20/SafeERC20.sol";
// import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/ChainlinkClient.sol";
// import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/interfaces/LinkTokenInterface.sol";

contract BaseAgreement is ChainlinkClient {
    using SafeERC20 for IERC20;

    enum Status {
        PROPOSED,
        REJECTED,
        ACTIVE,
        COMPLETED
    }

    // Platform vars
    address payable public factoryAddress;
    address payable public platformAddress;
    uint256 public PLATFORM_FEE;// = 1; // 1 % of withdrawn funds go back to the platform
    // Agreement vars
    IERC20 public token;
    address payable public brand;
    address payable public influencer;
    uint256 public endDate;
    uint256 public payPerView;
    uint256 public budget;
    bool public usingEth;
    string public mediaLink;
    Status public agreementStatus; //= Status.PROPOSED;
    string public API_KEY ;//= "&key=AIzaSyB8UEknqf0DmdJW5Ow6rGP8co7I_dZEhwo";
    string public BASE_URL ;//= "https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=";

    // *************** Events *************************** //

    event PaidSomeone(address indexed from, address indexed to, uint256 amount);
    event MediaUpdated(string media);
    event ViewCountResponse(uint256 viewCount);

    // *************** Modifiers ********************* //

    /**
     * @dev Modifier to check if the brand is calling the transaction
     */
    modifier onlyBrand() {
        require(brand == msg.sender, 'Must be Brand');
        _;
    }

    /**
     * @dev Modifier to check if the influncer is calling the transaction
     */
    modifier onlyInfluencer() {
        require(influencer == msg.sender, 'Must be Influencer');
        _;
    }

    /**
     * @dev Prevents a function being run unless contract is proposed
     */
    modifier onlyContractProposed() {
        require(agreementStatus == Status.PROPOSED, 'Contract must be PROPOSED');
        _;
    }

    /**
     * @dev Prevents a function being run after the end date or if not active
     */
    modifier onlyContractActive() {
        require(agreementStatus == Status.ACTIVE, 'Contract must be ACTIVE');
        require(block.timestamp < endDate, 'Time cannot be past the end date');
        _;
    }


    // *************** External Functions ********************* //
    
    /**
     * @dev Inits the agreement
     */
    function init(
        address payable _platformAddress,
        address _link,
        address _oracle,
        address _tokenPaymentAddress,
        address payable _brand,
        address payable _influencer,
        uint256 _endDate,
        uint256 _payPerView,
        uint256 _budget,
        bool _usingEth,
        string calldata _API_KEY,
        string calldata _BASE_URL  
        
    ) 
        external 
    {
        // Initialize platform vars
        factoryAddress = msg.sender;
        platformAddress = _platformAddress;
        PLATFORM_FEE = 1;
        agreementStatus = Status.PROPOSED;
        // Initialize chainlink vars
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        // Initialize agreement vars
        token = IERC20(_tokenPaymentAddress);
        brand = _brand;
        influencer = _influencer;
        endDate = _endDate;
        payPerView = _payPerView;
        budget = _budget;
        usingEth = _usingEth;
        API_KEY = _API_KEY;
        BASE_URL = _BASE_URL;
    }

    /**
     * @dev Gets agreement details
     */
    function getAgreementDetails(

    )
        external
        view
        returns(
            address _tokenPaymentAddress,
            address payable _brand,
            address payable _influencer,
            uint256 _endDate,
            uint256 _payPerView,
            uint256 _budget,
            bool _usingEth, 
            string memory _mediaLink,
            Status _agreementStatus
        )
    {
        _tokenPaymentAddress = address(token);
        _brand = brand;
        _influencer = influencer;
        _endDate = endDate;
        _payPerView = payPerView;
        _budget = budget;
        _usingEth = usingEth;
        _mediaLink = mediaLink;
        _agreementStatus = agreementStatus;

    }

    /**
     * @dev Influencer approves the contract with a media link
     */
    function approveAgreement(
        string calldata _mediaLink
    )
        external
        onlyInfluencer()
    {
        mediaLink = _mediaLink;
        agreementStatus = Status.ACTIVE;
        emit MediaUpdated(mediaLink);
    }

    /**
     * @dev Influencer rejects contract and agreement ends
     */
    function rejectAgreement (

    )
        external
        onlyInfluencer()
        onlyContractProposed()
    {
        this.endAgreement();
        agreementStatus = Status.REJECTED;
    }

    /**
     * @dev Get view count on a video
     */

    function withdraw(
        bytes32 _jobId,
        uint256 _oracleFee
    )
        external
        onlyContractActive()
        returns(bytes32 requestId)
    {
        // check Link in this contract to see if we need to request more
        checkLINK(_oracleFee);

        // Get video view count
        Chainlink.Request memory req = buildChainlinkRequest(_jobId, address(this), this.fulfillWithdraw.selector);
        bytes memory url_bytes = abi.encodePacked(BASE_URL, mediaLink, API_KEY);
        req.add("get", string(url_bytes));
        // Set the path to find the desired data in the API response, where the response format is:
        //  {
        //   "kind": "youtube#videoListResponse",
        //   "etag": "ZmcX3BsmhS9iLumLv4kaVxnfeZ8",
        //   "items": [
        //     {
        //       "kind": "youtube#video",
        //       "etag": "oW3as3wjv-heYr4pGVlHnmFRgKw",
        //       "id": "Ks-_Mh1QhMc",
        //       "statistics": {
        //         "viewCount": "19255415",
        //         "likeCount": "285037",
        //         "dislikeCount": "5512",
        //         "favoriteCount": "0",
        //         "commentCount": "8580"
        //       }
        //     }
        //   ],
        //   "pageInfo": {
        //     "totalResults": 1,
        //     "resultsPerPage": 1
        //   }
        // }
        req.add("path", "items.0.statistics.viewCount");
        return sendChainlinkRequestTo(chainlinkOracleAddress(), req, _oracleFee);
    }

    /**
     * @dev Callback for chainlink, this function pays the influencer
     */
    function fulfillWithdraw(
        bytes32 _requestId,
        bytes32 _viewCount
    )
        external
        recordChainlinkFulfillment(_requestId)
    {
        // Convert api string response to an int
        string memory _viewCountString = bytes32ToString(_viewCount);
        uint256 viewCount = uint256(parseInt(_viewCountString, 0));
        emit ViewCountResponse(viewCount);
        // Pay the influencer
        payInfluencer(viewCount);
    }

    /**
     * @dev Send brand remaining balance and returns link to platform
     */
    function endAgreement(

    )
        external
    {
        require(agreementStatus != Status.ACTIVE || block.timestamp > endDate, "Agreement still alive");
        // Calculate pay amounts
        uint256 budgetRemaining = getAgreementBalance();
        uint256 totalPlatformFee = (budgetRemaining * PLATFORM_FEE) / 100 ;
        // Transfer funds
        paySomeone(payable(address(this)), brand, budgetRemaining - totalPlatformFee);
        paySomeone(payable(address(this)), platformAddress, totalPlatformFee);
        // Transfer link
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transferFrom(address(this), factoryAddress, link.balanceOf(address(this))),
            "Unable to transfer"
        );
        // Update agreement status to completed
        agreementStatus = Status.COMPLETED;
    }


    /**
     * @dev Solidity required recieve function
     */
    receive() external payable {}

    // *************** Internal Functions ********************* //

    /**
     * @dev Pays the influencer
     */
    function payInfluencer(
        uint256 _viewCount
    )
        internal
    {
        // Calculate pay
        uint256 budgetRemaining = getAgreementBalance();
        uint256 accumulatedPay = budget - budgetRemaining;
        uint256 pay = (payPerView * _viewCount) - accumulatedPay;
        if (pay > budgetRemaining) {
            pay = budgetRemaining;
        }
        // Calculate platform fee
        uint256 totalPlatformFee = (pay * PLATFORM_FEE) / 100;
        // Transfer funds
        paySomeone(payable(address(this)), influencer, pay-totalPlatformFee);
        paySomeone(payable(address(this)), platformAddress, totalPlatformFee);
    }

    /**
     * @dev Checks how much LINK is in the contract and requests more from the factory if necessary.
     */
    function checkLINK(
        uint256 _oracleFeeRequired
    ) 
        internal
    {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress()); 
        uint256 linkRemaining = link.balanceOf(address(this));

        // Request another LINK token if the agreement's remaining link gets too low
        if (linkRemaining < _oracleFeeRequired) {
            require(link.transferFrom(factoryAddress, address(this), _oracleFeeRequired), "Unable to transfer");
        }
    }

    /**
     * @dev Pay someone
     */
    function paySomeone(
        address payable _from,
        address payable _to,
        uint256 _payAmount
    )
        internal
    {
        if (_payAmount > 0) {
            if (usingEth) {
                (bool success, ) = _to.call{value:_payAmount}("");
                require(success, "Unable to transfer");
            } else {
                require(token.transfer(_to, _payAmount), "Unable to transfer");
            }
        }

        emit PaidSomeone(_from, _to, _payAmount);
    }

    /**
     * @dev Returns agreement balance
     */
    function getAgreementBalance(

    )
        internal
        view
        returns(uint256 _balance)
    {
        if (usingEth) {
            _balance = address(this).balance;
        } else {
            _balance = token.balanceOf(address(this));
        }
    }

    /**
     * @dev converts bytes32 to string
     */
    function bytes32ToString(
        bytes32 _bytes32
    ) 
        internal 
        pure 
        returns(string memory) 
    {
        uint256 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }



    /**
     * @dev converts a string to an int. _b is the power of 10 to multiply it by.
     */
    function parseInt(
        string memory _a, 
        uint _b
    ) 
        internal 
        pure 
        returns(int) 
    {
        bytes memory bresult = bytes(_a);
        int mint = 0;
        bool decimals = false;
        bool negative = false;
        for (uint i = 0; i < bresult.length; i++) {
            if ((i == 0) && (bresult[i] == '-')) {
                negative = true;
            }
            if ((uint8(bresult[i]) >= 48) && (uint8(bresult[i]) <= 57)) {
                if (decimals) {
                    if (_b == 0) break;
                    else _b--;
                }
                mint *= 10;
                mint += uint8(bresult[i]) - 48;
            } else if (uint8(bresult[i]) == 46) decimals = true;
        }
        if (_b > 0) mint *= int(10 ** _b);
        if (negative) mint *= -1;
        return mint;
    }

}



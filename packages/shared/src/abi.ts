// Generated from ship-or-burn-contracts out/ShipOrBurnIMD.sol/ShipOrBurnIMD.json. Regenerate after any contract change.
export const shipOrBurnAbi = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ANSWER_UINT256",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ATTESTATION_TYPEHASH",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DEAD",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "IMD_ORACLE_SIGNER",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_PREFIX",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_AGREED",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_PANEL",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_SPACING",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "attestationDigest",
    "inputs": [
      {
        "name": "a",
        "type": "tuple",
        "internalType": "struct ShipOrBurn.Attestation",
        "components": [
          {
            "name": "requestId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "chainId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "questionHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "answerType",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "answer",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "figure",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fromBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "toBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "blockHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "panelJobId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "panelSize",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "quorum",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "agreed",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "issuedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "expiresAt",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "attester",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createVault",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "builder",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "refundMisses",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "tranche",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "tranches",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "deadline",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "questionPrefix",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "eip712Domain",
    "inputs": [],
    "outputs": [
      {
        "name": "fields",
        "type": "bytes1",
        "internalType": "bytes1"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "version",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "chainId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifyingContract",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "extensions",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "expire",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getVault",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ShipOrBurn.Vault",
        "components": [
          {
            "name": "token",
            "type": "address",
            "internalType": "contract IERC20"
          },
          {
            "name": "tranches",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "settled",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "shipped",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "streak",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "baselined",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "closed",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "funder",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "startBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "builder",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "lastToBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "missTo",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "deadline",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "tranche",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "lastCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "prefixHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "linkSchedule",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "scheduleId",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "nextVerdictBlock",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "questionHash",
    "inputs": [
      {
        "name": "questionPrefix",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "fromBlock",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "toBlock",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "settle",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "a",
        "type": "tuple",
        "internalType": "struct ShipOrBurn.Attestation",
        "components": [
          {
            "name": "requestId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "chainId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "questionHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "answerType",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "answer",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "figure",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "fromBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "toBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "blockHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "panelJobId",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "panelSize",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "quorum",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "agreed",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "issuedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "expiresAt",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "questionPrefix",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "vaultCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Baseline",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "toBlock",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "requestId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EIP712DomainChanged",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Expired",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Missed",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "day",
        "type": "uint16",
        "indexed": true,
        "internalType": "uint16"
      },
      {
        "name": "count",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "requestId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ScheduleLinked",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "scheduleId",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Shipped",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "day",
        "type": "uint16",
        "indexed": true,
        "internalType": "uint16"
      },
      {
        "name": "count",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "streak",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "requestId",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VaultCreated",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "builder",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "funder",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "missTo",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "tranche",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "tranches",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "deadline",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "questionPrefix",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AttestationExpired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadAnswer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadParams",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadPrefix",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CountWentDown",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DeadlineTooSoon",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureLength",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureS",
    "inputs": [
      {
        "name": "s",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidShortString",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotFunder",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotYet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PastDeadline",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "StringTooLong",
    "inputs": [
      {
        "name": "str",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "TooEarly",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TooSoon",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnsupportedToken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VaultClosed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WeakPanel",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongQuestion",
    "inputs": []
  }
] as const;

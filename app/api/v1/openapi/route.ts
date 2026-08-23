import { NextResponse } from "next/server";

const API_REVISION = "HBCE-IPR-RUNTIME-API-v1-OPENAPI-CONTRACT-v1.0" as const;
const API_VERSION = "v1" as const;
const PRODUCT_NAME = "HBCE IPR Operational Identity & Proof Layer" as const;


const LEGAL_CERTIFICATION = false as const;
const OPC_BOUNDARY = "technical proof receipt only" as const;
const IPR_CARD_BOUNDARY =
  "IPR Card is an internal operational identity certificate, not an official public identity document" as const;

function utcNow(): string {
  return new Date().toISOString();
}

function jsonResponse(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-HBCE-API-Revision": API_REVISION,
      "X-HBCE-API-Version": API_VERSION,
      "X-HBCE-Legal-Certification": "false",
      "X-HBCE-OPC-Boundary": OPC_BOUNDARY
    }
  });
}

const boundarySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    legalCertification: {
      type: "boolean",
      enum: [false],
      description: "No external legal certification is asserted by the v1 runtime API."
    },
    opcBoundary: {
      type: "string",
      enum: [OPC_BOUNDARY],
      description: "OPC is exposed as a technical proof receipt only."
    },
    iprCardBoundary: {
      type: "string",
      enum: [IPR_CARD_BOUNDARY]
    },
    rawTextPersistence: {
      type: "boolean",
      enum: [false]
    },
    automaticIprMemoryWrite: {
      type: "boolean",
      enum: [false]
    },
    sourceProfileSaveMode: {
      type: "string",
      enum: ["EXPLICIT_OPERATOR_SAVE_ONLY"]
    }
  },
  required: [
    "legalCertification",
    "opcBoundary",
    "iprCardBoundary",
    "rawTextPersistence",
    "automaticIprMemoryWrite",
    "sourceProfileSaveMode"
  ]
} as const;

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "HBCE IPR Runtime API",
    version: "1.0.0",
    summary: PRODUCT_NAME,
    description:
      "Public HBCE IPR Runtime API v1 contract. It documents operational identity, governed interaction, technical traceability and proof-receipt interfaces.",
    contact: {
      name: "HERMETICUM B.C.E. S.r.l.",
      url: "https://hermeticum.example"
    }
  },
  jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
  servers: [
    {
      url: "/api/v1",
      description: "HBCE IPR Runtime API v1 mounted inside the Next.js app router"
    }
  ],
  tags: [
    {
      name: "Runtime",
      description: "Health and capability discovery"
    },
    {
      name: "IPR Session",
      description: "Operational identity session contract"
    },
    {
      name: "Governed Chat",
      description: "Synchronous AI runtime bridge contract"
    },
    {
      name: "Files",
      description: "File intake contract without raw persistence"
    },
    {
      name: "Operations",
      description: "Asynchronous operation contract and lookup"
    },
    {
      name: "Proof Receipts",
      description: "EVT, OPC, audit and model-usage receipt contracts"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Runtime"],
        operationId: "getHbceIprRuntimeHealth",
        summary: "Return HBCE IPR Runtime API v1 health metadata",
        responses: {
          "200": {
            description: "Runtime API v1 health contract ready",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/capabilities": {
      get: {
        tags: ["Runtime"],
        operationId: "getHbceIprRuntimeCapabilities",
        summary: "Return public v1 capability catalogue",
        responses: {
          "200": {
            description: "Capability catalogue",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CapabilitiesResponse"
                }
              }
            }
          }
        }
      }
    },
    "/ipr/session": {
      get: {
        tags: ["IPR Session"],
        operationId: "getIprSessionContract",
        summary: "Return IPR session endpoint contract",
        responses: {
          "200": {
            description: "Session contract"
          }
        }
      },
      post: {
        tags: ["IPR Session"],
        operationId: "createIprSession",
        summary: "Create an operational IPR-bound session receipt",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/IprSessionRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "IPR session accepted by v1 contract",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/IprSessionResponse"
                }
              }
            }
          },
          "400": {
            description: "Invalid session request"
          }
        }
      }
    },
    "/chat": {
      get: {
        tags: ["Governed Chat"],
        operationId: "getChatContract",
        summary: "Return governed chat endpoint contract",
        responses: {
          "200": {
            description: "Chat contract"
          }
        }
      },
      post: {
        tags: ["Governed Chat"],
        operationId: "createGovernedChatCompletion",
        summary: "Submit a synchronous governed AI interaction to JOKER-C2",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ChatRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Governed chat response from the v1 wrapper",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ChatResponse"
                }
              }
            }
          },
          "400": {
            description: "Invalid chat request"
          },
          "502": {
            description: "Internal JOKER-C2 bridge failed or returned invalid data"
          }
        }
      }
    },
    "/files": {
      get: {
        tags: ["Files"],
        operationId: "getFilesContract",
        summary: "Return file intake contract",
        responses: {
          "200": {
            description: "File intake contract"
          }
        }
      },
      post: {
        tags: ["Files"],
        operationId: "createFileIntakeContractReceipt",
        summary: "Register file descriptors without raw file persistence",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FileIntakeRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "File intake accepted by contract only",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FileIntakeResponse"
                }
              }
            }
          },
          "400": {
            description: "Invalid file intake request"
          }
        }
      }
    },
    "/operations": {
      get: {
        tags: ["Operations"],
        operationId: "getOperationsContract",
        summary: "Return asynchronous operation contract",
        responses: {
          "200": {
            description: "Operation contract"
          }
        }
      },
      post: {
        tags: ["Operations"],
        operationId: "createOperationReceipt",
        summary: "Create a contract-only operation receipt",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OperationRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Operation contract validated; authorization and execution are not performed by this endpoint",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/OperationResponse"
                }
              }
            }
          },
          "400": {
            description: "Invalid operation request"
          }
        }
      }
    },
    "/operations/{operationId}": {
      get: {
        tags: ["Operations"],
        operationId: "getOperationReceipt",
        summary: "Return operation lookup contract receipt",
        parameters: [
          {
            name: "operationId",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Contract-only operation lookup receipt"
          }
        }
      }
    },
    "/events": {
      get: {
        tags: ["Proof Receipts"],
        operationId: "listEventReceipts",
        summary: "Return EVT ledger contract metadata",
        parameters: [
          {
            name: "eventId",
            in: "query",
            required: false,
            schema: {
              type: "string"
            }
          },
          {
            name: "humanIpr",
            in: "query",
            required: false,
            schema: {
              type: "string"
            }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100
            }
          }
        ],
        responses: {
          "200": {
            description: "EVT contract metadata"
          }
        }
      }
    },
    "/opc/{opcId}": {
      get: {
        tags: ["Proof Receipts"],
        operationId: "getOpcReceipt",
        summary: "Return OPC technical proof receipt contract",
        parameters: [
          {
            name: "opcId",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "OPC technical proof receipt contract"
          }
        }
      }
    },
    "/audit/{auditId}": {
      get: {
        tags: ["Proof Receipts"],
        operationId: "getAuditReceipt",
        summary: "Return audit receipt contract without raw log exposure",
        parameters: [
          {
            name: "auditId",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Audit receipt contract"
          }
        }
      }
    },
    "/model-usage/{usageId}": {
      get: {
        tags: ["Proof Receipts"],
        operationId: "getModelUsageReceipt",
        summary: "Return model usage receipt contract without provider payload exposure",
        parameters: [
          {
            name: "usageId",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Model usage receipt contract"
          }
        }
      }
    },
    "/openapi": {
      get: {
        tags: ["Runtime"],
        operationId: "getOpenApiDocument",
        summary: "Return the OpenAPI 3.1 contract for HBCE IPR Runtime API v1",
        responses: {
          "200": {
            description: "OpenAPI 3.1 document"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Boundary: boundarySchema,
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["HBCE_IPR_RUNTIME_API_READY"]
          },
          apiVersion: {
            type: "string",
            enum: [API_VERSION]
          },
          product: {
            type: "string",
            enum: [PRODUCT_NAME]
          },
          runtime: {
            type: "string",
          },
          boundary: {
            $ref: "#/components/schemas/Boundary"
          }
        }
      },
      CapabilitiesResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["HBCE_IPR_RUNTIME_CAPABILITIES_READY"]
          },
          publicSurface: {
            type: "array",
            items: {
              type: "string"
            }
          },
          boundary: {
            $ref: "#/components/schemas/Boundary"
          }
        }
      },
      IprSessionRequest: {
        type: "object",
        additionalProperties: true,
        properties: {
          humanIpr: {
            type: "string",
          },
          runtimeIpr: {
            type: "string",
          },
          tenant: {
            type: "string",
          },
          workspace: {
            type: "string",
          },
          sessionIntent: {
            type: "string"
          },
          idempotencyKey: {
            type: "string"
          }
        },
        required: ["humanIpr"]
      },
      IprSessionResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["HBCE_IPR_SESSION_CONTRACT_CREATED"]
          },
          sessionStatus: {
            type: "string",
            enum: ["AUTHORIZATION_NOT_EVALUATED"]
          },
          boundary: {
            $ref: "#/components/schemas/Boundary"
          }
        }
      },
      ChatRequest: {
        type: "object",
        additionalProperties: true,
        properties: {
          sessionId: {
            type: "string"
          },
          humanIpr: {
            type: "string",
          },
          message: {
            type: "string",
            minLength: 1
          },
          files: {
            type: "array",
            items: {
              type: "object"
            }
          },
          constraints: {
            type: "object"
          },
          idempotencyKey: {
            type: "string"
          }
        },
        required: ["sessionId", "humanIpr", "message"]
      },
      ChatResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["HBCE_IPR_RUNTIME_CHAT_READY"]
          },
          answer: {
            type: "string"
          },
          responseEvt: {
            type: ["string", "null"]
          },
          opcId: {
            type: ["string", "null"]
          },
          auditId: {
            type: ["string", "null"]
          },
          usageId: {
            type: ["string", "null"]
          },
          boundary: {
            $ref: "#/components/schemas/Boundary"
          }
        }
      },
      FileIntakeRequest: {
        type: "object",
        additionalProperties: true,
        properties: {
          sessionId: {
            type: "string"
          },
          humanIpr: {
            type: "string",
          },
          files: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: true,
              properties: {
                filename: {
                  type: "string"
                },
                mimeType: {
                  type: "string"
                },
                size: {
                  type: "integer",
                  minimum: 0
                },
                sha256: {
                  type: "string"
                }
              },
              required: ["filename"]
            }
          }
        },
        required: ["sessionId", "humanIpr", "files"]
      },
      FileIntakeResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["HBCE_FILE_INTAKE_CONTRACT_READY"]
          },
          fileIntakeStatus: {
            type: "string",
            enum: ["ACCEPTED_BY_CONTRACT_ONLY"]
          },
          boundary: {
            $ref: "#/components/schemas/Boundary"
          }
        }
      },
      OperationRequest: {
        type: "object",
        additionalProperties: true,
        properties: {
          operationType: {
            type: "string"
          },
          subjectIpr: {
            type: "string",
          },
          payload: {
            type: "object"
          },
          constraints: {
            type: "object"
          },
          idempotencyKey: {
            type: "string"
          }
        },
        required: ["operationType", "subjectIpr", "payload"]
      },
      OperationResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["HBCE_OPERATION_CONTRACT_VALIDATED"]
          },
          operationStatus: {
            type: "string",
            enum: ["CONTRACT_VALIDATED_NO_AUTHORIZATION_DECISION"]
          },
          operationId: {
            type: "string"
          },
          boundary: {
            $ref: "#/components/schemas/Boundary"
          }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "HBCE-IPR-SESSION"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  "x-hbce": {
    revision: API_REVISION,
    product: PRODUCT_NAME,
    boundary: {
      legalCertification: LEGAL_CERTIFICATION,
      opcBoundary: OPC_BOUNDARY,
      iprCardBoundary: IPR_CARD_BOUNDARY
    }
  }
} as const;

export async function GET(): Promise<NextResponse> {
  return jsonResponse({
    status: "HBCE_IPR_RUNTIME_OPENAPI_READY",
    revision: API_REVISION,
    generatedAt: utcNow(),
    apiVersion: API_VERSION,
    product: PRODUCT_NAME,
    legalCertification: LEGAL_CERTIFICATION,
    opcBoundary: OPC_BOUNDARY,
    iprCardBoundary: IPR_CARD_BOUNDARY,
    openapi: openApiDocument
  });
}

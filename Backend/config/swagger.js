const path = require("path");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hall of Fame API",
      version: "1.0.0",
      description: "API documentation for Hall of Fame system",
    },

    components: {
      // ============================
      // AUTH SCHEME
      // ============================
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      // ============================
      // SCHEMAS
      // ============================
      schemas: {
        // ---------------------------
        // USER SCHEMA
        // ---------------------------
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67a2fedc8a121e4d45afc811" },
            email: { type: "string", example: "manoj@stud.hochschule-heidelberg.de" },
            role: {
              type: "string",
              enum: ["viewer", "student", "faculty", "admin"],
              example: "student"
            },
            createdAt: { type: "string", format: "date-time" }
          }
        },

        // ---------------------------
        // AUTH RESPONSE
        // ---------------------------
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful" },
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            user: { $ref: "#/components/schemas/User" }
          }
        },

        // ---------------------------
        // PROJECT SCHEMA
        // ---------------------------
        Project: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67a3ff219c14cc0ce92a7a41" },
            studentName: { type: "string", example: "Mahesh Babu" },
            regNumber: { type: "string", example: "11038700" },
            projectTitle: { type: "string", example: "AI Chatbot System" },

            longDescription: {
              type: "string",
              example: "A full-stack Generative AI chatbot project using RAG."
            },

            technologiesUsed: {
              type: "array",
              items: { type: "string" },
              example: ["FastAPI", "React", "MongoDB", "Docker"]
            },

            sourceType: {
              type: "string",
              enum: ["github", "zip"],
              example: "github"
            },

            sourcePathOrUrl: {
              type: "string",
              example: "https://github.com/manoj/explorix"
            },

            status: {
              type: "string",
              enum: ["queued", "building", "running", "stopped", "failed", "build_failed"],
              example: "running"
            },

            createdDate: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },

            hostPort: { type: "number", example: 8085 },
            internalPort: { type: "number", example: 80 },
            containerName: { type: "string", example: "container_67a3..." },
            imageTag: { type: "string", example: "project_67a3..." },

            frontendService: { type: "string", example: "frontend" },
            frontendPort: { type: "number", example: 3000 },

            logs: {
              type: "object",
              properties: {
                build: { type: "string", example: "Build successful" },
                deploy: { type: "string", example: "Container deployed successfully" }
              }
            }
          }
        },

        // ---------------------------
        // PROJECT UPLOAD BODY
        // ---------------------------
        ProjectUploadRequest: {
          type: "object",
          required: ["studentName", "regNumber", "projectTitle"],
          properties: {
            studentName: { type: "string", example: "Manoj" },
            regNumber: { type: "string", example: "11038690" },
            projectTitle: { type: "string", example: "Explorix AI" },
            description: { type: "string", example: "Travel planning AI assistant." },
            technologiesUsed: { type: "string", example: "React, Node.js, MongoDB" },
            githubUrl: { type: "string", example: "https://github.com/manoj/explorix" }
          }
        },

        // ---------------------------
        // DEPLOYMENT SERVICES
        // ---------------------------
        ContainerService: {
          type: "object",
          properties: {
            name: { type: "string", example: "explorix-frontend-1" },
            image: { type: "string", example: "frontend:latest" },
            ports: { type: "string", example: "3000->3000/tcp" },
            running: { type: "boolean", example: true }
          }
        }
      }
    },

    security: [{ bearerAuth: [] }]
  },

  // ============================
  // AUTO-SCAN ROUTES
  // ============================
  apis: [
    path.join(__dirname, "../routes/*.js")
  ]
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = { swaggerUi, swaggerSpec };

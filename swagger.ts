import swaggerAutogen from "swagger-autogen";

const doc = {
  openapi: "3.1.0",
  info: {
    title: "PalikaOS API",
    version: "1.0.0",
    description: "API documentation for the PalikaOS."
  },
  servers: [
    {
      url: "http://localhost:8081",
      description: "Local Server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const outputFile = "./src/docs/openapi.json";
// Generate from app.ts which imports all routes
const endpointsFiles = ["./src/app.ts"];

import fs from "fs";

// swaggerAutogen()(outputFile, endpointsFiles, doc);
const autogen = swaggerAutogen({ openapi: "3.1.0" });
autogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger UI documentation generated successfully!");
  
  // Post-process to group endpoints by tags based on their path
  const rawData = fs.readFileSync(outputFile, "utf-8");
  const swaggerData = JSON.parse(rawData);
  
  for (const path in swaggerData.paths) {
    const parts = path.split("/");
    // path typically looks like: /api/v1/users/...
    // parts will be: ["", "api", "v1", "users", ...]
    let tag = "General";
    
    if (parts.length >= 4 && parts[1] === "api" && parts[2] === "v1") {
      // capitalize the module name (e.g. users -> Users, service-requests -> Service-requests)
      const moduleName = parts[3];
      tag = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    } else if (path === "/health") {
      tag = "Health";
    }
    
    // Add the tag to all methods in this path
    for (const method in swaggerData.paths[path]) {
      swaggerData.paths[path][method].tags = [tag];
    }
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
  console.log("Auto-tagged endpoints based on URL paths for sidebar grouping!");
});

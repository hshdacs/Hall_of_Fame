// services/projectStatus.js

const { execSync } = require("child_process");

function getProjectServices(projectId) {
  try {
    const output = execSync(
      `docker ps --format "{{.Names}}|{{.Image}}|{{.Ports}}"`,
      { encoding: "utf8" }
    );

    const lines = output.split("\n").filter(Boolean);

    const services = [];

    lines.forEach((line) => {
      const [name, image, ports] = line.split("|");

      if (name.includes(projectId)) {
        services.push({
          name,
          image,
          ports: ports || "no port exposed",
          running: true,
        });
      }
    });

    return services;
  } catch (err) {
    console.error("Error fetching docker ps:", err.message);
    return [];
  }
}

module.exports = { getProjectServices };

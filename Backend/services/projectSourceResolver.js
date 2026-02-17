const fs = require("fs");
const path = require("path");

const COMPOSE_FILE_NAMES = [
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
  "compose.yaml",
];

const SKIP_DIRS = new Set([".git", "node_modules", "__MACOSX"]);

function findComposeFile(dir) {
  for (const fileName of COMPOSE_FILE_NAMES) {
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

function findDockerfile(dir) {
  const exact = path.join(dir, "Dockerfile");
  if (fs.existsSync(exact)) {
    return exact;
  }

  const lower = path.join(dir, "dockerfile");
  if (fs.existsSync(lower)) {
    return lower;
  }

  return null;
}

function isIgnoredDir(name) {
  return SKIP_DIRS.has(name);
}

function resolveProjectRoot(baseDir) {
  const queue = [{ dir: baseDir, depth: 0 }];
  const maxDepth = 6;

  while (queue.length > 0) {
    const { dir, depth } = queue.shift();

    const dockerfilePath = findDockerfile(dir);
    const composePath = findComposeFile(dir);

    if (dockerfilePath || composePath) {
      return {
        projectRoot: dir,
        dockerfilePath,
        composePath,
      };
    }

    if (depth >= maxDepth) {
      continue;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || isIgnoredDir(entry.name)) {
        continue;
      }
      queue.push({ dir: path.join(dir, entry.name), depth: depth + 1 });
    }
  }

  return {
    projectRoot: baseDir,
    dockerfilePath: null,
    composePath: null,
  };
}

module.exports = {
  COMPOSE_FILE_NAMES,
  resolveProjectRoot,
};

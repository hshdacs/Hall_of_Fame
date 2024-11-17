# Use the official Node.js 14 image as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Install serve to serve the build folder
RUN npm install -g serve

# Command to run the app
CMD ["serve", "-s", "build", "-l", "3002"]

# Expose the port the app runs on
EXPOSE 3002

# Use the official Node.js image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all the rest of the project files into the container
COPY . .

# Expose the port that CodeArena uses
EXPOSE 3000

# Command to start the application
CMD ["npm", "start"]
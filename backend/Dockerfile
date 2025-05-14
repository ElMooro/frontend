FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Bundle app source
COPY . .

# Skip mock data generation for production
# If you need mock data for development, run it locally with:
# npm run generate-mock-data

# Set environment to production
ENV NODE_ENV=production
ENV USE_MOCK_DATA=false

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "src/server.js"]
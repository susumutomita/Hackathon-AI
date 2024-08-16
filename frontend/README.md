# Onchain Senryu Frontend

This is the frontend component of the **Onchain Senryu** project, a platform that merges the traditional Japanese art of senryu with the blockchain technology on the Base blockchain.

## Table of Contents

- [Onchain Senryu Frontend](#onchain-senryu-frontend)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
  - [Setup and Installation](#setup-and-installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
  - [Environment Variables](#environment-variables)
  - [Contributing](#contributing)
  - [License](#license)

## Introduction

The frontend of **Onchain Senryu** is built with Next.js, providing an interactive user interface for creating, submitting, and voting on senryu poems. The frontend interacts with the blockchain through smart contracts deployed on the Base blockchain, ensuring that every interaction is secure and verifiable.

## Features

- **User Interface for Senryu Creation**: A simple and intuitive UI to generate senryu poems with AI assistance.
- **Blockchain Interaction**: Submit senryu poems to the blockchain directly from the UI.
- **Voting System**: Users can vote on their favorite senryu, with results displayed in real-time.
- **World ID Integration**: Secure login and bot prevention using World ID.

## Technologies Used

- **Frontend Framework**: Next.js
- **Styling**: Tailwind CSS
- **Blockchain Interaction**: Ethers.js
- **AI Integration**: Groq API
- **Authentication**: World ID

## Setup and Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/susumutomita/2024-Superhack
   cd 2024-Superhack/frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

## Running the Development Server

To start the development server, run the following command:

```bash
npm run dev
```

This will start the server on `http://localhost:3000`, where you can access the frontend.

## Building for Production

To create a production build, run:

```bash
npm run build
```

This will generate optimized files in the `.next` directory, ready to be deployed.

## Environment Variables

The following environment variables are required to run the frontend:

- `NEXT_PUBLIC_WLD_APP_ID`: Your World ID App ID
- `NEXT_PUBLIC_WLD_ACTION`: Your World ID Action
- `GROQ_API_KEY`: Your Groq API key

Set these variables in a `.env.local` file in the `frontend` directory.

Example `.env.local` file:

```plaintext
NEXT_PUBLIC_WLD_APP_ID=your-world-id-app-id
NEXT_PUBLIC_WLD_ACTION=your-world-id-action
GROQ_API_KEY=your-groq-api-key
```

## Contributing

We welcome contributions to the Onchain Senryu frontend. Please fork the repository and submit pull requests for review. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

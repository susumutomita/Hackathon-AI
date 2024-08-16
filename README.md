
# Hackathon AI - Hackathon Success Support Tool

## Overview

**Hackathon AI** is an AI-driven tool designed to help hackathon participants maximize their chances of success by leveraging data from past hackathons. Developed using TypeScript and Electron, this cross-platform desktop application allows users to analyze past hackathon data and gain insights to optimize their project strategies.

## Key Features

- **Analysis of Past Hackathon Data**: Analyze trends from finalist projects and requirements from prize-winning projects to identify key success factors.
- **Similar Project Search**: Support for checking the novelty of ideas and estimating the likelihood of success.
- **Trend Analysis and Prediction**: Predict technological trends and identify the categories of projects most likely to succeed.
- **Strategic Guidelines**: Provide guidelines for optimizing presentations, team building, and analyzing judging criteria.

## System Architecture

This project is built on TypeScript and Electron. The following is an overview of the system architecture.

### System Context Diagram

```mermaid
graph TB
    A[Hackathon Participant] --> |Input Data| B[Hackathon AI]
    B --> |Analysis Results| A
    B --> |Data Retrieval/Update| C[Database Server]
    B --> |External API Calls| D[API Services]
    B --> |Real-time Updates| E[Cloud Data Sources]

    subgraph Hackathon AI
        B1[Data Analysis Module]
        B2[AI Model Module]
        B3[Vector Database]
        B4[Guideline Generation Module]
    end

    B --> B1
    B --> B2
    B --> B3
    B --> B4
```

### Architecture Overview

- **Hackathon Participant**: The user who utilizes Hackathon AI to gain insights based on past data.
- **Hackathon AI**: The desktop application that integrates data analysis, AI models, vector databases, and guideline generation modules.
- **Database Server**: Manages and stores data from past hackathons and projects.
- **API Services**: Supports API calls for external data and analysis resources.
- **Cloud Data Sources**: Provides real-time trends and the latest data.

## Installation and Setup

### Prerequisites

- Node.js (version 14.x or above)
- npm or yarn

### Installation Steps

1. Clone the repository:

    ```bash
    git clone https://github.com/susumutomita/Hackathon-AI
    ```

2. Install dependencies:

    ```bash
    make install_all
    ```

3. Start the application in development mode:

    ```bash
    make start
    ```

4. To create a production build:

    ```bash
    make build
    ```

## Usage

1. After launching the application, provide the necessary data inputs via the UI.
2. The application will display analysis results and guidelines based on past hackathon data.
3. Use the provided guidelines and strategic recommendations to support your project's progress.

## Development Environment

- **TypeScript**: Used as the main programming language.
- **React**: Used to create UI components.
- **TensorFlow.js**: Used for training and running AI models.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

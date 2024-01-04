# Notes API

A secure and scalable RESTful API that allows users to `create`, `read`, `update`, and `delete` notes. Users are able to `share` their notes with other users and `search` for notes based on keywords.

## API Endpoints

**Authentication Endpoints**

-   POST /api/auth/signup: create a new user account.
-   POST /api/auth/login: log in to an existing user account and receive an access token.
-   POST /api/auth/logout: log out an authenticated user account.
-   GET /api/auth/refresh: refresh access token for an authenticated user account.

**Note Endpoints**

-   GET /api/notes: get a list of all notes for the authenticated user.
-   GET /api/notes/:id: get a note by ID for the authenticated user.
-   POST /api/notes: create a new note for the authenticated user.
-   PUT /api/notes/:id: update an existing note by ID for the authenticated user.
-   DELETE /api/notes/:id: delete a note by ID for the authenticated user.
-   POST /api/notes/:id/share: share a note with another user for the authenticated user.
-   GET /api/search?q=:query: search for notes based on keywords for the authenticated user.

## Tech Stacks:

MongoDB

-   MongoDB offers flexibility in handling unstructured data, which suits scenarios where the data structure might evolve or where a flexible schema is required. Its JSON-like documents make it easy to work with JavaScript-based stacks like Node.js.

Express.js

-   Express.js is a popular framework for Node.js that simplifies building robust web applications and APIs. It offers a minimalist and flexible approach, allowing easy creation of routes, middleware, and handling of HTTP requests and responses. Additionally, it benefits from wide community support, making it easier to find resources, plugins, and solutions due to its extensive user base.

Node.js v20

-   Node.js is chosen for its event-driven, non-blocking I/O model, making it efficient for handling concurrent requests in the API.

JWT (JSON Web Tokens)

-   JWT provides a secure and compact way to transmit information between parties as a JSON object. It is commonly used for authentication and are stateless, allowing for scalability and easy integration into an API-driven architecture.

Jest

-   Jest is a widely used testing framework for JavaScript applications, offering a rich set of features for writing unit, integration, and end-to-end tests. It's known for its simplicity, speed, and built-in functionalities like snapshot testing and mocking.

Supertest

-   Supertest is a testing library used with Jest (or other testing frameworks) for making HTTP assertions. It allows for easy testing of HTTP requests and responses in an Express app, enabling comprehensive API endpoint testing.

## Installation Instructions:

### Setup

-   Create an `.env` file from the `.env_sample`, and configure the environment variables accordingly.

-   Install all the dependencies.
    ```
    npm install
    ```

### To run the application and test:

-   To start application:
    ```
    npm run start
    ```
-   To run test:
    ```
    npm run test
    ```

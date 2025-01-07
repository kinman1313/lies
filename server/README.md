# Chat Application Server

A real-time chat application server built with Node.js, Express, Socket.IO, and MongoDB.

## Features

- Real-time messaging with Socket.IO
- User authentication and authorization
- Channel-based communication
- File uploads (images, documents, voice messages)
- Message scheduling and expiry
- Message reactions and pinning
- User presence and typing indicators
- Rate limiting and security features
- Comprehensive error handling and logging

## Prerequisites

- Node.js (>= 14.0.0)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd chat-server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your configuration.

## Configuration

The following environment variables need to be configured:

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLIENT_URL`: Client application URL
- `UPLOAD_PATH`: Path for file uploads
- Other configuration options (see `.env.example`)

## Directory Structure

```
server/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── services/        # Business logic
├── utils/          # Utility functions
├── uploads/        # Uploaded files
├── logs/           # Application logs
└── server.js       # Main application file
```

## API Routes

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Messages

- `GET /api/messages` - Get all messages
- `GET /api/messages/:id` - Get message by ID
- `POST /api/messages` - Create a new message
- `PATCH /api/messages/:id` - Update a message
- `DELETE /api/messages/:id` - Delete a message

### Channels

- `GET /api/channels` - Get all channels
- `GET /api/channels/:id` - Get channel by ID
- `POST /api/channels` - Create a new channel
- `PATCH /api/channels/:id` - Update a channel
- `DELETE /api/channels/:id` - Delete a channel

### Users

- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/password` - Change password

## Socket Events

### Connection

- `connection` - Client connected
- `disconnect` - Client disconnected

### Messages

- `message:new` - New message
- `message:update` - Message updated
- `message:delete` - Message deleted
- `message:react` - Message reaction
- `message:read` - Message read receipt

### Channels

- `channel:join` - Join channel
- `channel:leave` - Leave channel

### Users

- `user:status` - User status update
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

## Error Handling

The application includes comprehensive error handling:

- Validation errors
- Authentication errors
- File upload errors
- Database errors
- Rate limiting errors
- Socket connection errors

## Security Features

- JWT authentication
- Request rate limiting
- Input validation
- CORS configuration
- Helmet security headers
- File upload restrictions

## Development

Start the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

## Production

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Update other environment variables for production
3. Start the server:

```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

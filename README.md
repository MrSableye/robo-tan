# Robo-tan
[![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/showderp/dogars-discord-bot?style=for-the-badge)](https://hub.docker.com/r/showderp/dogars-discord-bot/builds)
[![Docker Pulls](https://img.shields.io/docker/pulls/showderp/dogars-discord-bot?style=for-the-badge)](https://hub.docker.com/r/showderp/dogars-discord-bot)

This bot tracks and interacts with Showderp battles on /vp/'s Showderp thread.

## Development
### Prerequisites
1. [Node.js](https://nodejs.org/)
2. [Docker](https://www.docker.com/) (optional)

### Scripts
#### NPM Scripts
- `npm run build`: Compiles all of the TypeScript files and places the compiled JavaScript files in `dist/`
- `npm run lint`: Lints the TypeScript files for style
- `npm run start`: Builds and runs the application
- `npm run test`: Runs Jest unit tests

#### Docker Commands
- `docker build -t showderp/dogars-discord-bot .`: Builds a local Docker image of the bot
- Run the Docker container with the bot image:
```
    docker run -d
    -e TOKEN=<DISCORD BOT TOKEN>
    -e CHANNEL_ID=<DISCORD CHANNEL ID>
    -e SHOWDOWN_USER=<SHOWDOWN USER NAME>
    -e SHOWDOWN_PASSWORD=<SHOWDOWN USER NAME>
    -e SHOWDOWN_AVATAR=<SHOWDOWN USER AVATAR>
    showderp/dogars-discord-bot
```

## Deploying/Running
### Environment Variables
- `TOKEN`: The Discord bot token associated with your Discord application
- `CHANNEL_ID`: The channel to send battle updates to.
- `SHOWDOWN_USER`: The Showdown username to login as
- `SHOWDOWN_PASSWORD`: The Showdown password to use to login
- `SHOWDOWN_AVATAR`: (Optional) The avatar to use for the Showdown user
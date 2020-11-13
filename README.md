# showderp/dogars-discord-bot
[![Travis (.org)](https://img.shields.io/travis/showderp/dogars-discord-bot?style=for-the-badge)](https://travis-ci.org/github/showderp/dogars-discord-bot)
[![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/showderp/dogars-discord-bot?style=for-the-badge)](https://hub.docker.com/r/showderp/dogars-discord-bot/builds)
[![Docker Pulls](https://img.shields.io/docker/pulls/showderp/dogars-discord-bot?style=for-the-badge)](https://hub.docker.com/r/showderp/dogars-discord-bot)

This bot provides basic commands for integrating with [dogars.ga](https://dogars.ga) as well as streaming battles to Discord similar to [showderp/battle-feed](https://github.com/showderp/battle-feed). Try `!help` in a server with it to get a list of commands.

## Development
### Prerequisites
1. [Node.js](https://nodejs.org/)
2. [Docker](https://www.docker.com/) (optional)

### Scripts
#### NPM Scripts
- `npm run build`: Compiles all of the TypeScript files and places the compiled JavaScript files in `dist/`
- `npm run lint`: Lints the TypeScript files for style
- `npm run lint-fix`: Lints the TypeScript files for style and fixes any issues that can be automatically fixed
- `npm run start`: Builds and runs the application
- `npm run test`: Runs Jest unit tests

#### Docker Commands
- `docker build -t showderp/dogars-discord-bot .`: Builds a local Docker image of the bot
- `docker run -d -e TOKEN=<TOKEN> -e CHANNEL_ID showderp/dogars-discord-bot`: Runs a Docker container with the bot image

## Deploying/Running
### Environment Variables
- `TOKEN`: The Discord bot token associated with your Discord application
- `CHANNEL_ID`: The channel to send battle updates to.

### Common Environments
#### With Docker
Create a Docker container with the `TOKEN` and `CHANNEL_ID` environment variables and the `showderp/dogars-discord/bot` Docker image.

##### Example
```docker run -d -e TOKEN=<TOKEN> -e CHANNEL_ID showderp/dogars-discord-bot```

#### Standalone
Execute `dist/index.js` with Node.js with the `TOKEN` and `CHANNEL_ID` environment variables.

##### Example
```TOKEN=<TOKEN> CHANNEL_ID=<CHANNEL ID> node dist/index.js```
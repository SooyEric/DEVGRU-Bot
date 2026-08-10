# DEVGRU-Bot

Official Discord bot for DEVGRU.

Project

DEVGRU-Bot is a custom Discord bot built from scratch for the DEVGRU community.

The project is designed to remain modular and lightweight, adding systems only when they are actually required.

Architecture

source/
├── app.js
├── config/
├── commands/
├── events/
├── database/
└── utils/

Requirements

* Node.js 20+
* Discord Bot
* Discord Bot Token
* Discord Application Client ID
* PostgreSQL database
* Railway or another Node.js-compatible host

Environment Variables

The bot uses environment variables for sensitive configuration.

Required:

DISCORD_TOKEN
DISCORD_CLIENT_ID
DATABASE_URL
NODE_ENV

Secrets must never be committed to GitHub.

Running

The production start command is:

npm start

Which runs:

node source/app.js

Development

DEVGRU-Bot is being developed from scratch and does not depend on the architecture or source code of TitanBot.

Systems and commands will be added progressively as the project grows.

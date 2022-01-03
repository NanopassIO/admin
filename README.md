# Nanopass Admin Panel

## Intro

This codebase contains 2 main sections
- Admin panel to administer the black box system
- Scheduled scripts that run at regular intervals to trigger the black box raffle system

## Scripts


The main scripts that are of note are `activate-batch-background.js` and `preload-batch-background.js`. `

- `preload-batch-background` is responsible for pushing the snapshot of next weeks batch up to the database server.
- `activate-batch-background` is responsible for taking a second snapshot, then shuffling the addresses and pushing the results up to the database server.

The action runs are publically verifiable and the logs are viewable under the Actions tab.

## Architecture

The system mainly consists of ether.js to communicate with the smart contract side, and a DynamoDB backend to store info about accounts, batches and prizes.

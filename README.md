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

## Front-end

To run the front-end serve the `public` directory, it is all static HTML and compatible with modern browsers without any build steps.

## Deployment In Production

1. Install `aws cli` in your local machine. You can refer to this [guide](https://aws.amazon.com/cli/) here for the installation instruction
2. Do `aws configure` in your local terminal. It will prompt you to input the access id and secret key of your aws account
3. Do `npm run deploy` in the project directory to deploy it to your aws environment
   - Update the ACCOUNT_NO and REGION in your .env accordingly
4. Do `npx cdk destroy` to release the resources
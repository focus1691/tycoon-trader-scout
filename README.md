# Tycoon Trader Scout

## Overview
Retrieve and rank all Tycoon platform traders by top 10 K-ratio.

## Prerequisites
- Redis server running locally.
- Tycoon platform access token.

## Configuration
1. Ensure Redis is installed and running on your local machine at `redis://127.0.0.1:6379`.
2. Obtain a Tycoon access token by logging into the [Tycoon platform](https://platform.tycoon.io/) and extract the Bearer token from the network tab (this acts as your Tycoon API access token but is not directly provided; it expires daily). Use this as your `TYCOON_ACCESS_TOKEN`.
3. Create a `.env` file in the root of the project and add the following environmental variables:

```
REDIS_URI=redis://127.0.0.1:6379
TYCOON_ACCESS_TOKEN=your_tycoon_access_token_here
```

## Usage
1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Start the application: `npm start`

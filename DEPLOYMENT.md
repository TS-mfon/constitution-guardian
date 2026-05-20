# Constitutional DAO Deployment

This upgrade changes the contract storage layout and public method surface, so it should be treated as a fresh **Studionet redeploy**.

## Expected Environment

Source credentials from:

```bash
source /home/sudodave/buildenv/.env
```

Required values to add if missing:

- `GENLAYER_ACCOUNT_NAME`
- `VITE_CONSTITUTIONAL_DAO_ADDRESS`

## Contract Deploy

```bash
genlayer network set studionet
genlayer account use "$GENLAYER_ACCOUNT_NAME"
genlayer deploy --contract contract..py --args "The DAO exists to steward public digital institutions..."
```

After deployment, update the frontend address:

```bash
export VITE_CONSTITUTIONAL_DAO_ADDRESS=<new_contract_address>
```

## Frontend Build

```bash
npm install
npm run build
```

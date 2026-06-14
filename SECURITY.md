# Security Notes

## Environment variables

Never commit real `.env` files. The checked-in `.env.example` files contain
only empty placeholders.

Variables prefixed with `VITE_` are bundled into the browser app by Vite. Treat
them as public. Do not use `VITE_` for provider secrets, admin keys, webhook
secrets, private tokens, or OAuth client secrets.

Keep private values in backend or Appwrite Function environment variables, for
example:

- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `PERPLEXITY_API_KEY`
- `SONAR_PRO_API_KEY`
- `GEMINI_API_KEY`
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_SECRET`

## Before publishing

Rotate any key that has ever been stored in a local `.env` file or deployment
archive before making the repository public.

Deployment archives, local build outputs, `node_modules`, and temporary
Appwrite packaging folders are ignored because they can contain stale secrets or
machine-specific artifacts.

## Browser-exposed API keys

Some existing frontend features still read provider keys from `VITE_*`
variables. If those features are deployed publicly, restrict those keys by
domain/referrer in the provider dashboard or move the calls behind an Appwrite
Function/server proxy.

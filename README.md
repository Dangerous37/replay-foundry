# Replay Foundry

A recovery planner for an integration outage. Run competing replay policies against the same ambiguous delivery history, compare downstream effects and identify operations requiring receipt reconciliation.

**[Launch the interactive case](https://dangerous37.github.io/replay-foundry/)** · [Input and decision contract](CONTRACT.md)

## Reproduce the decision
Compare Blind replay with Reconcile receipts first. The lost acknowledgment hides an 80-unit effect. Replaying unconditionally duplicates it, while reconciliation recovers its receipt and sends only the rejected transfer. Edit the history to inject existing duplicate effects.

## Run the local API
Use Node.js 24. Run `npm ci --offline`, `npm test` and `npm start`. Open the address printed by the server. POST JSON to `/api/evaluate` for the same result as the UI. The local web client calls the HTTP API. The public static site runs the same decision module in the browser. All examples use synthetic data. Export a report from the client to keep the result.

To reproduce the browser test, use Python 3.12, install `requirements-test.txt`, run `python -m playwright install chrome`, then `python browser_test.py`.

## Operational limits
The log supplies a downstream observation for lost acknowledgments. Real recovery requires querying a trusted destination ledger first. The rehearsal is deterministic and does not send money, modify accounts or contact a live connector.

## Resumen en español
Ensaya la recuperación de una integración sin reenviar operaciones reales. Compara el efecto de repetir todas las entregas con el de consultar primero los recibos del destino.

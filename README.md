# prismarine-bedrock-ai

AI agent workflows, packet parity tooling, and recorded Bedrock scenario lab for [`prismarine-bedrock`](https://github.com/deepslate-bedrock/prismarine-bedrock).

Start with [`AGENTS.md`](AGENTS.md) for agent operating rules. Recorded BDS workflows live in [`test/recorded-bds`](test/recorded-bds), and durable task logs live in [`docs/tasks`](docs/tasks).

Common commands:

```powershell
pnpm install
pnpm run test:static
pnpm run recorded-bds:gym -- status --scenario=craft-planks-and-place
pnpm run e2e:servers:launch -- --target=endstone --world=superflat --endstone-packet-recorder
```

# Coding Pet

Coding Pet is a small Tauri desktop companion built with vanilla TypeScript.

## Local event receiver

The Tauri process listens only on `127.0.0.1:39421` for `POST /events`. Incoming JSON is forwarded to the frontend, validated as a generic `PetEvent`, and then passed to `handlePetEvent()`.

With Coding Pet running in development, test the external receiver with:

```sh
curl -X POST http://127.0.0.1:39421/events \
	-H 'Content-Type: application/json' \
	-d '{"type":"working"}'
```

Valid event types are `idle`, `working`, `success`, and `error`. Invalid payloads are ignored by the frontend.

## OMP adapter

The OMP adapter template lives at [integrations/omp/coding-pet.ts](integrations/omp/coding-pet.ts). OMP loads the adapter from:

```text
~/.omp/agent/extensions/coding-pet.ts
```

To install the repository version for OMP:

```sh
cp integrations/omp/coding-pet.ts ~/.omp/agent/extensions/coding-pet.ts
```

The adapter translates OMP lifecycle events into the generic Coding Pet contract:

- `session_start` -> `idle`
- `agent_start` -> `working`
- terminal `agent_end` -> `success`
- `tool_error`, `tool_timeout`, `tool_aborted`, or `tool_blocked` -> `error`

It sends those events to the local receiver with HTTP `POST` requests. If Coding Pet is not running, the adapter ignores the connection failure so OMP continues normally.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

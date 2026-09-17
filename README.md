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

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

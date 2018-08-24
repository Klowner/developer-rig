### Installing the developer rig.

To get started with the Twitch Developer Rig, first let's install it using npm

```npm install -g twitch-dev-rig```

### Creating your first extension

To create your first extension, run

`rig create extension my_first_extension`

This will create the following tree in your current working directory

```
my_first_extension
|-- css
|   `-- styles.css
|
|-- extension.json
|-- video_component.html
|-- video_overlay.html
|-- config.html
|-- live_config.html
`-- panel.html
```

### Running your first extension locally

View your extension in your browser, first start the engines by running:

`rig serve`

The server will be up and listening when you see this message on screen:

`** Twitch Live Extension Development Server is listening on localhost:3000, open your browser on https://localhost:3000/ **`

Now open your browser at https://localhost:3000

```
// Here there's a screenshot of the twitch layout. There's a navbar at the top, left
// panel & right panel, video stream in the middle. Looks exactly like Twitch, but most
// of functionality is gone.

// Instead, you see a random video (say a demo effect) in the middle, and a hello world
// floating. This is the skeleon that we just generated.

// Instead of the chat, you have action buttons:
// - reload() - reloads the extension
// - onAuthorized opaque user
// - onAuthorized real user
// - onContext simulates context change
// - simulation of bits sku query
// - simulation for user details revoke
// and so on

// User can now develop their extension. We might need to provide a dummy user, or just
// explain how to get oauth token for the developer to actually use the rest of the twitch
// api, not the extensions api.
```

### Adding your extension to Twitch

```
// Here we explain how to configure twitch to load the extension, how to add it to
// a specific channel (stream), but this for a different document. Up until now, we
// weren't required to add anything to twitch, we worked locally.
```

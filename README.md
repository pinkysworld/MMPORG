# Frontier Valley MMORPG Prototype

This prototype showcases a lightweight 3D world rendered with [three.js](https://threejs.org/).
Players can explore the valley, interact with ambient animals, and gather resources for their inventory.

## Features
- Stylised terrain with trees, rocks, clouds, and a campfire-lit settlement
- Four friendly animals that grant unique resources on a cooldown
- Click-to-interact system with descriptive lore and resource collection
- Persistent on-screen inventory listing gathered goods
- Help overlay and responsive UI for desktop and mobile browsers

## Getting Started
No build step is required. Open `index.html` in a modern browser (Chrome, Edge, Firefox, or Safari) to explore the scene.

For local development with live reloading, you can serve the directory via any static file server, e.g.

```bash
npx serve .
```

## Controls
- **Left click** on an animal to open its interaction panel
- **Click “Collect Resource”** once the cooldown expires to store new goods
- **Drag** to orbit the camera, **scroll** to zoom in/out
- Press **H** to toggle the in-world help overlay

# OpenAI Realtime Console

This is an example application showing how to use the [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) with [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc) and Firebase Authentication.

## Installation and usage

Before you begin, you'll need:

1. **OpenAI API key** - [create one in the dashboard here](https://platform.openai.com/settings/api-keys)
2. **Firebase project** - [create one in the Firebase console here](https://console.firebase.google.com/)

### Firebase Setup

1. Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and add Email/Password as a sign-in provider:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
3. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click "Add app" and choose Web
   - Copy the configuration values

4. Create a `.env` file and add your Firebase configuration:

```bash
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (for server-side authentication)
# Option 1: Service account key as JSON string
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Option 2: Service account key file path (for development)
# Download service account key from Firebase Console > Project Settings > Service Accounts
# FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./path/to/serviceAccountKey.json
```

5. **Firebase Admin SDK Setup** (for API authentication):
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - For development: Set the JSON content as `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
   - For production: Use Google Cloud default credentials or set the service account JSON

Running this application locally requires [Node.js](https://nodejs.org/) to be installed. Install dependencies for the application with:

```bash
npm install
```

Start the application server with:

```bash
npm run dev
```

This should start the console application on [http://localhost:3000](http://localhost:3000). You'll be prompted to sign in with email and password before accessing the application.

This application is a minimal template that uses [express](https://expressjs.com/) to serve the React frontend contained in the [`/client`](./client) folder. The server is configured to use [vite](https://vitejs.dev/) to build the React frontend.

This application shows how to send and receive Realtime API events over the WebRTC data channel and configure client-side function calling. You can also view the JSON payloads for client and server events using the logging panel in the UI.

For a more comprehensive example, see the [OpenAI Realtime Agents](https://github.com/openai/openai-realtime-agents) demo built with Next.js, using an agentic architecture inspired by [OpenAI Swarm](https://github.com/openai/swarm).

## Previous WebSockets version

The previous version of this application that used WebSockets on the client (not recommended in browsers) [can be found here](https://github.com/openai/openai-realtime-console/tree/websockets).

## License

MIT

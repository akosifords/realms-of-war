# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Realms of War

A strategic multiplayer game built with React, Vite, and Unity WebGL.

## Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Firebase configuration
3. Copy `public/firebase-config.template.js` to `public/firebase-config.js` and add your Firebase API key
4. Install dependencies:
```bash
npm install
```

5. Run the development server:
```bash
npm run dev
```

## Security Note on Firebase API Keys

This project uses Firebase for authentication and database access. Firebase web API keys are designed to be included in client-side code and are considered "publicly visible" by design. However, we've taken steps to keep them out of the repository:

1. The primary API key is loaded at runtime through `firebase-config.js` which is excluded from git
2. A template file (`firebase-config.template.js`) is provided instead
3. For CI/CD deployments, use environment secrets to inject the API key

Firebase security is enforced through:
- Firebase Authentication rules
- Firestore security rules
- Firebase project settings

For more information, see Firebase documentation on [web API key security](https://firebase.google.com/docs/projects/api-keys).

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch. You can view the live application at:

https://akosifords.github.io/realms-of-war/

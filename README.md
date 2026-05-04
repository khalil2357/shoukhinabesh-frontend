# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# shoukhinabesh-frontend

## Stripe Checkout (Sandbox)

This frontend supports Stripe Checkout in test mode (sandbox) using PaymentIntent flow.

### 1) Configure environment

Create a `.env` file from `.env.example` and set:

- `VITE_API_URL` to your backend API base URL
- `VITE_STRIPE_PUBLISHABLE_KEY` to your Stripe test publishable key (`pk_test_...`)

### 2) Backend requirement

Your backend endpoint `POST /payments/stripe/intent` should accept `{ amount, currency }` and return:

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "id": "pi_xxx",
  "status": "requires_payment_method"
}
```

The frontend will use `clientSecret` to confirm payment with the card.

### 3) Checkout flow

1. Go to Cart and click checkout
2. Select **Stripe** as payment method
3. Enter cardholder name and card details
4. Click `Pay Now` to process payment
5. After successful payment, the order is placed

### 4) Test cards

Use Stripe test cards (for example `4242 4242 4242 4242`) with:
- Any valid future expiry date (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)
- Any ZIP code

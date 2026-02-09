# Premium Planner

A React application for premium planning, built with Vite and TypeScript.

## Getting Started

### Prerequisites

- Node.js (v20 or later recommended)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

To start the development server:

```bash
npm run dev
```

### Building

To build the application for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Linting and Formatting

To lint the code:

```bash
npm run lint
```

To format the code:

```bash
npm run format
```

## Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

1.  Push changes to the `main` branch.
2.  The "Deploy to GitHub Pages" workflow will automatically run.
3.  Once completed, the application will be available at your GitHub Pages URL.

## Project Structure

-   `src/`: Source code
-   `public/`: Static assets
-   `.github/workflows`: GitHub Actions workflows
-   `dist/`: Production build output

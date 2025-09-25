# Zenith Task: A Minimalist Todo Platform

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chartmann1590/Zenith-Task-A-Minimalist-Todo)

Zenith Task is a visually stunning, minimalist, and highly interactive todo list application designed to enhance productivity through an elegant and intuitive user experience. Built on Cloudflare's edge network, it offers lightning-fast performance. The application features a clean two-column layout: a sidebar for project navigation and a main content area for managing tasks. Users can create projects, add tasks with details like priority and due dates, and track their progress seamlessly. The entire experience is enhanced with subtle micro-interactions and smooth animations, making task management not just efficient, but delightful.

## Key Features

- **Minimalist & Modern UI**: A clean, uncluttered interface that helps you focus on your tasks.
- **Project Management**: Organize your tasks into different projects for better clarity.
- **Full Task CRUD**: Create, read, update, and delete tasks with ease.
- **Interactive Experience**: Smooth animations, hover states, and micro-interactions make using the app a delight.
- **Responsive Design**: Flawless performance and layout across all device sizes, from mobile to desktop.
- **Edge-Powered**: Built on Cloudflare Workers and Durable Objects for global, low-latency performance.

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Hono on Cloudflare Workers
- **State Management**: Zustand
- **Storage**: Cloudflare Durable Objects
- **UI & Animation**: Framer Motion, Lucide React
- **Language**: TypeScript
- **Runtime & Package Manager**: Bun

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- A [Cloudflare account](https://dash.cloudflare.com/sign-up).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/zenith-task.git
    cd zenith-task
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

## Development

To start the local development server, which includes both the Vite frontend and the Wrangler backend, run the following command:

```bash
bun run dev
```

This will start the application, typically on `http://localhost:3000`. The frontend will hot-reload on changes, and the worker will restart automatically.

### Project Structure

-   `src/`: Contains the frontend React application, including pages, components, and the Zustand store.
-   `worker/`: Contains the Hono backend code that runs on Cloudflare Workers, including API routes and entity definitions for Durable Objects.
-   `shared/`: Contains shared TypeScript types used by both the frontend and the backend to ensure type safety.

## Deployment

This project is designed for easy deployment to the Cloudflare network.

1.  **Build the project:**
    This command bundles the React application and prepares the worker for deployment.
    ```bash
    bun run build
    ```

2.  **Deploy to Cloudflare:**
    This command deploys your application to your Cloudflare account. You will be prompted to log in if you haven't already.
    ```bash
    bun run deploy
    ```

Alternatively, you can deploy directly from your GitHub repository using the button below.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/chartmann1590/Zenith-Task-A-Minimalist-Todo)

## License

This project is licensed under the MIT License.
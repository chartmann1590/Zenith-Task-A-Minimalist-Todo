# Zenith Task: A Minimalist Todo Platform

Zenith Task is a visually stunning, minimalist, and highly interactive todo list application designed to enhance productivity through an elegant and intuitive user experience. The application features a clean two-column layout: a sidebar for project navigation and a main content area for managing tasks. Users can create projects, add tasks with details like priority and due dates, and track their progress seamlessly. The entire experience is enhanced with subtle micro-interactions and smooth animations, making task management not just efficient, but delightful.

## Key Features

- **Minimalist & Modern UI**: A clean, uncluttered interface that helps you focus on your tasks.
- **Project Management**: Organize your tasks into different projects for better clarity.
- **Full Task CRUD**: Create, read, update, and delete tasks with ease.
- **Interactive Experience**: Smooth animations, hover states, and micro-interactions make using the app a delight.
- **Responsive Design**: Flawless performance and layout across all device sizes, from mobile to desktop.
- **Fast & Responsive**: Optimized for speed and performance across all devices.

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Storage**: Local storage and state management
- **UI & Animation**: Framer Motion, Lucide React
- **Language**: TypeScript
- **Runtime & Package Manager**: Bun

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/chartmann1590/Zenith-Task-A-Minimalist-Todo.git
    cd zenith-task
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

## Development

To start the local development server, run the following command:

```bash
bun run dev
```

This will start the application, typically on `http://localhost:3000`. The frontend will hot-reload on changes.

### Project Structure

-   `src/`: Contains the frontend React application, including pages, components, and the Zustand store.
-   `shared/`: Contains shared TypeScript types used by the application to ensure type safety.

## Deployment

This project is designed for easy deployment to any static hosting platform.

1.  **Build the project:**
    This command bundles the React application for deployment.
    ```bash
    bun run build
    ```

2.  **Deploy to your preferred platform:**
    You can deploy the built files from the `dist` directory to any static hosting platform like Vercel, Netlify, GitHub Pages, or any other hosting service.

## License

This project is licensed under the MIT License.
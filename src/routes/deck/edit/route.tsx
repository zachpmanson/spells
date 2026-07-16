import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/deck/edit')({
  component: () => <Outlet />,
})

import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import { AboutPage } from './routes/about'
import { ChatConversationPage } from './routes/chat-conversation'
import { NewChatPage } from './routes/chat'
import { HomePage } from './routes/home'
import { RootLayout } from './routes/root-layout'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
})

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: NewChatPage,
})

const chatConversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$conversationId',
  component: ChatConversationPage,
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, chatRoute, chatConversationRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

import { Hono } from 'hono'
import { auth } from './lib/auth';

const app = new Hono()

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default {
  port: 8787,
  fetch: app.fetch
}

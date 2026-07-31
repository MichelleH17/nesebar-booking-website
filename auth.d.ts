// Type augmentation for nuxt-auth-utils — shape set in server/api/auth/login.post.ts
declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    role: 'guest' | 'family' | 'admin' | 'demo'
    color: string
  }
}

export {}

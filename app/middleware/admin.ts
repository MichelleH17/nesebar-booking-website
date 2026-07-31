export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/prihlaseni')
  }
  if (user.value?.role !== 'admin') {
    return navigateTo('/kalendar')
  }
})

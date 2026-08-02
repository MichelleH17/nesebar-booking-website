<template>
  <div class="flex min-h-screen flex-col bg-white font-sans text-ink">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-sea-deep focus:px-4 focus:py-2 focus:text-white"
    >
      Přeskočit na obsah
    </a>
    <NuxtRouteAnnouncer />
    <AppHeader />
    <main id="main-content" class="flex-1">
      <NuxtPage />
    </main>
    <AppFooter />
    <DemoNotice />
  </div>
</template>

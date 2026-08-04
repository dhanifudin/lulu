<template>
  <!-- Shared gradient hero used across all main pages -->
  <header class="flower-bg bg-gradient-to-b from-pink-100 to-cream">
    <div class="max-w-lg mx-auto px-5 pb-5"
         style="padding-top: calc(env(safe-area-inset-top, 0px) + 1.5rem)">
      <slot />
    </div>
  </header>
</template>

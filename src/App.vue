<script setup>
import { ref } from "vue";
import { RouterView } from "vue-router";
import Sidebar from "./components/Sidebar.vue";

const isSidebarOpen = ref(false);
</script>

<template>
  <div
    class="h-screen flex flex-col w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden"
  >
    <!-- Top Navigation -->
    <header
      class="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-border-dark px-6 py-3 bg-white dark:bg-surface-dark z-20 shrink-0"
    >
      <div class="flex items-center gap-4">
        <button
          @click="isSidebarOpen = true"
          class="flex lg:hidden items-center justify-center p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="flex items-center gap-3 text-primary">
          <img
            src="/favicon.svg"
            alt="Logo"
            class="size-8 rounded-lg drop-shadow-sm transition-transform hover:scale-105"
          />
          <h2 class="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">貨幣轉換器</h2>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden relative">
      <!-- Sidebar -->
      <Sidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-y-auto bg-background-light dark:bg-background-dark relative">
        <RouterView />
      </main>
    </div>
  </div>
</template>

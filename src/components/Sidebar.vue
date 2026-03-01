<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const route = useRoute()

const navItems = [
  { name: '幣值轉換器', icon: 'calculate', path: '/' },
  { name: '當前幣值匯率', icon: 'trending_up', path: '/rates' },
  { name: '我的最愛', icon: 'favorite', path: '/favorites' }
]

const isActive = (path) => {
  return route.path === path
}
</script>

<template>
  <!-- Mobile Backdrop -->
  <div 
    v-if="isOpen" 
    @click="emit('close')" 
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
  ></div>

  <!-- Sidebar -->
  <aside 
    class="fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark py-6 px-4 gap-6 justify-between shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center mb-2 px-3 lg:hidden">
        <p class="text-xs font-bold text-text-secondary uppercase tracking-wider">Menu</p>
        <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <p class="hidden lg:block px-3 text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Menu</p>
      
      <RouterLink 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        @click="emit('close')"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
        :class="isActive(item.path) 
          ? 'bg-primary text-white shadow-md shadow-primary/20' 
          : 'text-slate-600 dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-background-dark hover:text-slate-900 dark:hover:text-white transition-colors'"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span class="text-sm" :class="isActive(item.path) ? 'font-semibold' : 'font-medium'">{{ item.name }}</span>
      </RouterLink>
    </div>
  </aside>
</template>

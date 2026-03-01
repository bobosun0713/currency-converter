<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrencyStore } from '../stores/currency'

const currencyStore = useCurrencyStore()
const route = useRoute()

const amount = ref(1000)
const fromCurrency = ref('USD')
const toCurrency = ref('EUR')
const hasConverted = ref(false)

// Custom Search Dropdowns State
const searchFrom = ref('')
const searchTo = ref('')
const isFromDropdownOpen = ref(false)
const isToDropdownOpen = ref(false)

// Close dropdowns when clicking outside
import { onBeforeUnmount, nextTick } from 'vue'

const handleClickOutside = (e) => {
  if (!e.target.closest('.searchable-select')) {
    isFromDropdownOpen.value = false
    isToDropdownOpen.value = false
  }
}

onMounted(() => {
  if (!currencyStore.lastUpdated) {
    currencyStore.fetchRates()
  }
  document.addEventListener('click', handleClickOutside)

  // Listen to Quick Convert query params
  if (route.query.from && route.query.to) {
    fromCurrency.value = route.query.from
    toCurrency.value = route.query.to
    amount.value = 1
    
    // Allow the watcher to trigger and reset the value first, then force it back to true
    nextTick(() => {
       hasConverted.value = true
    })
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Auto-reset the converted state if the user changes the amount, from, or to fields.
// This enforces the "explicit click to convert" experience.
watch([amount, fromCurrency, toCurrency], () => {
   hasConverted.value = false
})

const convertedAmount = computed(() => {
  if (!hasConverted.value) return 0
  return currencyStore.convert(amount.value, fromCurrency.value, toCurrency.value).toFixed(2)
})

const swapCurrencies = () => {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
  hasConverted.value = false // Require new click to convert
}

const triggerConvert = () => {
   hasConverted.value = true
}

const currentExchangeRate = computed(() => {
  const rate = currencyStore.convert(1, fromCurrency.value, toCurrency.value)
  return `1.00 ${fromCurrency.value} = ${rate.toFixed(5)} ${toCurrency.value}`
})

// Currency Lookup helpers
const allCurrencies = computed(() => {
  return Object.values(currencyStore.currencies).sort((a, b) => a.code.localeCompare(b.code))
})

const formatCurrencyName = (curr) => {
   if (!curr) return ''
   return `${curr.name}${curr.country ? ` (${curr.country})` : ''}`
}

const filteredFromCurrencies = computed(() => {
  const q = searchFrom.value.toLowerCase()
  if (!q) return allCurrencies.value
  return allCurrencies.value.filter(c => c.code.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q)) || (c.country && c.country.toLowerCase().includes(q)))
})

const filteredToCurrencies = computed(() => {
  const q = searchTo.value.toLowerCase()
  if (!q) return allCurrencies.value
  return allCurrencies.value.filter(c => c.code.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q)) || (c.country && c.country.toLowerCase().includes(q)))
})

const selectFrom = (code) => {
  fromCurrency.value = code
  isFromDropdownOpen.value = false
}

const selectTo = (code) => {
  toCurrency.value = code
  isToDropdownOpen.value = false
}

const openDropdown = (type) => {
  if (type === 'from') {
    isFromDropdownOpen.value = true
    isToDropdownOpen.value = false
    searchFrom.value = ''
  } else {
    isToDropdownOpen.value = true
    isFromDropdownOpen.value = false
    searchTo.value = ''
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto w-full flex flex-col gap-8 p-4 md:p-8">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">貨幣轉換器</h1>
        <p class="text-slate-500 dark:text-text-secondary mt-2">查看即時外匯匯率與歷史趨勢。</p>
      </div>
      <div class="text-right hidden md:block">
        <p class="text-sm font-medium text-slate-500 dark:text-text-secondary">最後更新</p>
        <div class="flex items-center gap-2 justify-end">
          <span class="size-2 rounded-full bg-green-500 animate-pulse"></span>
           <span v-if="currencyStore.lastUpdated" class="text-sm font-bold text-slate-900 dark:text-white">{{ currencyStore.lastUpdated }}</span>
          <span v-else class="text-sm font-bold text-slate-900 dark:text-white">剛剛</span>
        </div>
      </div>
    </div>
    
    <!-- Converter Card -->
    <div class="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-border-dark p-6 md:p-8">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end mb-8 relative z-10">
        <!-- From -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-slate-500 dark:text-text-secondary">轉換金額 & 來源幣別</label>
          <div class="flex rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all searchable-select relative">
            <input type="number" v-model="amount" class="w-1/2 md:w-[60%] min-w-0 bg-transparent border-none outline-none text-slate-900 dark:text-white text-xl font-bold p-4 focus:ring-0 placeholder:text-slate-400">
            <div class="w-px bg-slate-200 dark:bg-border-dark my-2 shrink-0"></div>
            
            <!-- Custom Searchable Dropdown From -->
            <div class="w-1/2 md:w-[40%] text-slate-900 dark:text-white relative cursor-pointer group" @click="openDropdown('from')">
               <div class="min-w-0 bg-transparent border-none outline-none font-bold p-4 flex items-center justify-between h-full">
                  <span class="truncate">{{ fromCurrency }}</span>
                  <span class="material-symbols-outlined text-slate-400 text-[20px] ml-1">expand_more</span>
               </div>
               
               <div v-show="isFromDropdownOpen" class="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden" @click.stop>
                   <div class="p-2 border-b border-slate-100 dark:border-slate-800">
                      <input type="text" v-model="searchFrom" placeholder="搜尋幣值或國家..." class="w-full bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                   </div>
                   <ul class="max-h-64 overflow-y-auto w-full">
                      <li v-for="curr in filteredFromCurrencies" :key="curr.code" @click="selectFrom(curr.code)" class="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer text-slate-900 dark:text-white text-sm flex flex-col justify-center">
                         <span class="font-bold mb-0.5">{{ curr.code }}</span>
                         <span class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ formatCurrencyName(curr) }}</span>
                      </li>
                      <li v-if="filteredFromCurrencies.length === 0" class="px-4 py-3 text-slate-500 text-sm text-center">找不到貨幣</li>
                   </ul>
               </div>
            </div>
          </div>
        </div>
        
        <!-- Swap Button -->
        <button @click="swapCurrencies" class="flex items-center justify-center size-12 rounded-full bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-border-dark text-primary hover:bg-primary hover:text-white hover:border-primary transition-all mx-auto md:mb-1 shadow-sm shrink-0">
          <span class="material-symbols-outlined">swap_horiz</span>
        </button>
        
        <!-- To -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-slate-500 dark:text-text-secondary">轉換為</label>
          <div :class="['flex rounded-xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark transition-all searchable-select relative', hasConverted ? 'ring-2 ring-emerald-500/30 border-emerald-500/50' : 'focus-within:ring-2 focus-within:ring-primary focus-within:border-primary']">
            <!-- Output field -->
            <div class="w-1/2 md:w-[60%] min-w-0 bg-transparent border-none outline-none text-slate-900 dark:text-white text-xl font-bold p-4 flex items-center">
               <span v-if="!hasConverted" class="text-slate-400 font-normal">0.00</span>
               <span v-else class="text-emerald-600 dark:text-emerald-400 font-bold transition-all">{{ convertedAmount }}</span>
            </div>
            
            <div class="w-px bg-slate-200 dark:bg-border-dark my-2 shrink-0"></div>
            
            <!-- Custom Searchable Dropdown To -->
             <div class="w-1/2 md:w-[40%] text-slate-900 dark:text-white relative cursor-pointer group" @click="openDropdown('to')">
               <div class="min-w-0 bg-transparent border-none outline-none font-bold p-4 flex items-center justify-between h-full">
                  <span class="truncate">{{ toCurrency }}</span>
                  <span class="material-symbols-outlined text-slate-400 text-[20px] ml-1">expand_more</span>
               </div>
               
               <div v-show="isToDropdownOpen" class="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden" @click.stop>
                   <div class="p-2 border-b border-slate-100 dark:border-slate-800">
                      <input type="text" v-model="searchTo" placeholder="搜尋幣值或國家..." class="w-full bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                   </div>
                   <ul class="max-h-64 overflow-y-auto w-full">
                      <li v-for="curr in filteredToCurrencies" :key="curr.code" @click="selectTo(curr.code)" class="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer text-slate-900 dark:text-white text-sm flex flex-col justify-center">
                         <span class="font-bold mb-0.5">{{ curr.code }}</span>
                         <span class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ formatCurrencyName(curr) }}</span>
                      </li>
                      <li v-if="filteredToCurrencies.length === 0" class="px-4 py-3 text-slate-500 text-sm text-center">找不到貨幣</li>
                   </ul>
               </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <!-- Result & Action -->
      <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100 dark:border-border-dark relative z-0">
        <div class="text-center md:text-left">
          <p class="text-sm font-medium text-slate-500 dark:text-text-secondary mb-1">{{ currentExchangeRate }}</p>
          <p v-if="hasConverted" class="text-xs text-emerald-600 dark:text-emerald-500 font-medium">轉換成功</p>
          <p v-else class="text-xs text-slate-400 dark:text-slate-500">輸入金額並點擊轉換以獲取最新結果</p>
        </div>
        <div class="flex gap-3 w-full md:w-auto">
          <button @click="triggerConvert" :disabled="hasConverted" class="flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-8 rounded-lg font-bold transition-colors shadow-md disabled:cursor-not-allowed" :class="hasConverted ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-primary text-white hover:bg-blue-600 shadow-blue-500/30'">
            <span v-if="hasConverted" class="material-symbols-outlined text-[20px]">check_circle</span>
            <span v-else class="material-symbols-outlined text-[20px]">currency_exchange</span>
            {{ hasConverted ? '已轉換' : '轉換' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

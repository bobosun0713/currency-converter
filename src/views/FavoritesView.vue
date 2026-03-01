<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCurrencyStore } from '../stores/currency'
import { useRouter } from 'vue-router'

const currencyStore = useCurrencyStore()
const router = useRouter()

const showAddModal = ref(false)
const newFrom = ref('USD')
const newTo = ref('EUR')

const searchFrom = ref('')
const searchTo = ref('')
const isFromDropdownOpen = ref(false)
const isToDropdownOpen = ref(false)

// Close dropdowns when clicking outside
import { onBeforeUnmount } from 'vue'

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
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const getMockSparkline = (isUp) => {
    return isUp 
      ? "M0 30 Q 10 25, 20 28 T 40 20 T 60 25 T 80 15 L 100 10" 
      : "M0 10 Q 30 15, 50 20 T 80 30 L 100 35"
}

const getMockChange = (from, to) => {
  // Deterministic mock based on char code so it doesn't jump around
  const val = (from.charCodeAt(0) + to.charCodeAt(1)) % 100 / 100
  const isUp = from.charCodeAt(0) % 2 === 0
  return {
    value: isUp ? val : -val,
    isUp,
    text: `${isUp ? '+' : ''}${(isUp ? val : -val).toFixed(2)}%`
  }
}

const favoriteCards = computed(() => {
  return currencyStore.favorites.map(fav => {
    const rate = currencyStore.convert(1, fav.from, fav.to)
    const fromCurrency = currencyStore.currencies[fav.from]
    const toCurrency = currencyStore.currencies[fav.to]
    const changeMock = getMockChange(fav.from, fav.to)
    
    return {
      from: fav.from,
      to: fav.to,
      fromName: fromCurrency ? `${fromCurrency.name}${fromCurrency.country ? ` (${fromCurrency.country})` : ''}` : fav.from,
      toName: toCurrency ? `${toCurrency.name}${toCurrency.country ? ` (${toCurrency.country})` : ''}` : fav.to,
      toSymbol: toCurrency ? toCurrency.symbol : '',
      rate: rate.toFixed(4),
      change: changeMock,
      sparkline: getMockSparkline(changeMock.isUp)
    }
  })
})

const allCurrencies = computed(() => {
  return Object.values(currencyStore.currencies).sort((a, b) => a.code.localeCompare(b.code))
})

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
  newFrom.value = code
  searchFrom.value = code
  isFromDropdownOpen.value = false
}

const selectTo = (code) => {
  newTo.value = code
  searchTo.value = code
  isToDropdownOpen.value = false
}

// Ensure search inputs show the selected value when opened
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

const handleAddFavorite = () => {
  if (newFrom.value && newTo.value && newFrom.value !== newTo.value) {
    currencyStore.addFavorite(newFrom.value, newTo.value)
    showAddModal.value = false
  }
}

const removeFavorite = (from, to) => {
  currencyStore.removeFavorite(from, to)
}

const quickConvert = (from, to) => {
  router.push({ path: '/', query: { from, to } })
}
</script>

<template>
  <div class="px-4 md:px-10 py-8 mx-auto w-full max-w-[1440px] relative">
    <!-- Page Title Area -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-slate-900 dark:text-white">我的最愛</h1>
        <p class="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">即時追蹤您最常使用的貨幣對。</p>
      </div>
      <button @click="showAddModal = true" class="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
        <span class="material-symbols-outlined text-[20px]">add</span>
        <span class="text-sm font-bold">新增貨幣對</span>
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="currencyStore.isFetching" class="w-full text-center py-12 text-slate-500">
      <p>正在抓取最新匯率...</p>
    </div>

    <!-- Grid Layout -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-0">
      
      <!-- Generated Cards -->
      <div v-for="card in favoriteCards" :key="`${card.from}-${card.to}`" class="flex flex-col gap-4 rounded-xl p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark shadow-sm hover:shadow-md transition-shadow relative group">
        
        <!-- Delete Button (visible on hover) -->
        <button @click="removeFavorite(card.from, card.to)" class="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 z-10" title="移除">
          <span class="material-symbols-outlined text-[20px]">delete</span>
        </button>

        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <div>
              <p class="text-slate-900 dark:text-white text-base font-bold leading-tight pr-6">{{ card.from }} / {{ card.to }}</p>
              <p class="text-slate-500 dark:text-slate-400 text-xs">{{ card.fromName }} / {{ card.toName }}</p>
            </div>
          </div>
        </div>
        
        <div class="flex items-end gap-2 mt-2">
          <p class="text-slate-900 dark:text-white text-3xl font-bold leading-tight flex items-baseline gap-1">
            <span>{{ card.rate }}</span>
            <span class="text-lg text-slate-500">{{ card.toSymbol }}</span>
          </p>
          <span :class="[
            'flex items-center text-sm font-medium mb-1 px-1.5 py-0.5 rounded',
            card.change.isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
          ]">
            <span class="material-symbols-outlined text-[16px] mr-0.5">{{ card.change.isUp ? 'trending_up' : 'trending_down' }}</span>
            {{ card.change.text }}
          </span>
        </div>
        
        <!-- Sparkline -->
        <div class="h-16 w-full relative">
          <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
            <path :d="card.sparkline" fill="none" :class="card.change.isUp ? 'stroke-emerald-500' : 'stroke-rose-500'" stroke-linecap="round" stroke-width="2" vector-effect="non-scaling-stroke"></path>
          </svg>
        </div>
        
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button @click="quickConvert(card.from, card.to)" class="flex-1 flex items-center justify-center gap-2 h-9 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-bold transition-colors">
            <span class="material-symbols-outlined text-[18px]">currency_exchange</span>
            快速轉換
          </button>
        </div>
      </div>
      
      <!-- Add New Card Placeholder -->
      <div @click="showAddModal = true" class="flex flex-col gap-4 rounded-xl p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-transparent items-center justify-center cursor-pointer group transition-all min-h-[300px]">
        <div class="size-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <span class="material-symbols-outlined text-slate-400 group-hover:text-primary text-[32px]">add</span>
        </div>
        <div class="text-center">
          <p class="text-slate-900 dark:text-white text-lg font-bold">增加貨幣對</p>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">追蹤新的匯率</p>
        </div>
      </div>
    </div>

    <!-- Add Favorite Modal overlay -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div class="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-xl font-bold text-slate-900 dark:text-white">新增貨幣對</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="p-6 space-y-6">
          <div class="space-y-4">
            <div class="flex flex-col gap-2 searchable-select">
              <label class="text-sm font-bold text-slate-900 dark:text-white">來源幣別 (From)</label>
              <div class="relative">
                <input 
                  type="text" 
                  v-model="searchFrom" 
                  @focus="openDropdown('from')"
                  :placeholder="newFrom || '搜尋貨幣...'"
                  class="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-800 px-4 pr-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <span class="material-symbols-outlined">search</span>
                </div>
                
                <!-- Dropdown List -->
                <ul v-show="isFromDropdownOpen" class="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                  <li 
                    v-for="curr in filteredFromCurrencies" 
                    :key="curr.code" 
                    @click="selectFrom(curr.code)"
                    class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer text-slate-900 dark:text-white text-sm"
                  >
                    <span class="font-bold">{{ curr.code }}</span> - {{ curr.name }}{{ curr.country ? ` (${curr.country})` : '' }}
                  </li>
                  <li v-if="filteredFromCurrencies.length === 0" class="px-4 py-3 text-slate-500 text-sm text-center">
                     找不到貨幣
                  </li>
                </ul>
              </div>
            </div>
            
            <div class="flex flex-col gap-2 searchable-select">
              <label class="text-sm font-bold text-slate-900 dark:text-white">目標幣別 (To)</label>
               <div class="relative">
                <input 
                  type="text" 
                   v-model="searchTo" 
                  @focus="openDropdown('to')"
                  :placeholder="newTo || '搜尋貨幣...'"
                  class="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-neutral-800 px-4 pr-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <span class="material-symbols-outlined">search</span>
                </div>
                
                 <!-- Dropdown List -->
                <ul v-show="isToDropdownOpen" class="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                  <li 
                    v-for="curr in filteredToCurrencies" 
                    :key="curr.code" 
                    @click="selectTo(curr.code)"
                    class="px-4 py-2 hover:bg-slate-50 dark:hover:bg-neutral-700 cursor-pointer text-slate-900 dark:text-white text-sm"
                  >
                    <span class="font-bold">{{ curr.code }}</span> - {{ curr.name }}{{ curr.country ? ` (${curr.country})` : '' }}
                  </li>
                  <li v-if="filteredToCurrencies.length === 0" class="px-4 py-3 text-slate-500 text-sm text-center">
                     找不到貨幣
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
             <p class="text-sm text-blue-700 dark:text-blue-300">您將追蹤 <strong>{{ newFrom }}</strong> 轉換為 <strong>{{ newTo }}</strong> 的即時匯率。</p>
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end bg-slate-50 dark:bg-background-dark">
          <button @click="showAddModal = false" class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            取消
          </button>
          <button @click="handleAddFavorite" :disabled="newFrom === newTo" class="px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-md shadow-primary/20">
            確認新增
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

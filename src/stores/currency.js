import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useCurrencyStore = defineStore('currency', () => {
  const currencies = ref({
    USD: { code: 'USD', name: '美金', symbol: '$' },
    EUR: { code: 'EUR', name: '歐元', symbol: '€' },
    GBP: { code: 'GBP', name: '英鎊', symbol: '£' },
    JPY: { code: 'JPY', name: '日圓', symbol: '¥' },
    CAD: { code: 'CAD', name: '加幣', symbol: '$' },
    CHF: { code: 'CHF', name: '瑞士法郎', symbol: 'CHF' },
    AUD: { code: 'AUD', name: '澳幣', symbol: '$' },
    TWD: { code: 'TWD', name: '新台幣', symbol: 'NT$' },
    CNY: { code: 'CNY', name: '人民幣', symbol: '¥' },
    HKD: { code: 'HKD', name: '港幣', symbol: '$' },
    SGD: { code: 'SGD', name: '新加坡幣', symbol: '$' },
    KRW: { code: 'KRW', name: '韓元', symbol: '₩' }
  })

  // Start with some default rates, but they will be overwritten
  const rates = ref({
    USD: 1,
    EUR: 0.92345,
    GBP: 0.79,
    JPY: 148.25,
    CAD: 1.35,
    CHF: 0.88,
    AUD: 1.52,
    TWD: 31.50
  })

  const lastUpdated = ref(null)
  const isFetching = ref(false)

  // Read from localStorage if available
  const savedFavorites = localStorage.getItem('stitch_currency_converter_v1_favorites')
  const savedPinned = localStorage.getItem('stitch_currency_converter_v1_pinned')

  const favorites = ref(savedFavorites ? JSON.parse(savedFavorites) : [
    { from: 'USD', to: 'TWD' },
    { from: 'USD', to: 'EUR' },
    { from: 'JPY', to: 'TWD' }
  ])

  const pinnedRates = ref(savedPinned ? JSON.parse(savedPinned) : [])

  // Setup watchers to persist to localStorage automatically
  watch(favorites, (newVal) => {
    localStorage.setItem('stitch_currency_converter_v1_favorites', JSON.stringify(newVal))
  }, { deep: true })

  watch(pinnedRates, (newVal) => {
    localStorage.setItem('stitch_currency_converter_v1_pinned', JSON.stringify(newVal))
  }, { deep: true })

  const fetchRates = async () => {
    isFetching.value = true
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await response.json()
      
      if (data && data.rates) {
        // Update all rates globally, not just pre-defined ones
        rates.value = { ...data.rates }
        
        // Initialize Intl.DisplayNames for Region names in Traditional Chinese
        const regionNames = new Intl.DisplayNames(['zh-TW'], { type: 'region' })
        
        // Exceptional cases where ISO currency codes don't directly map cleanly to ISO country codes 
        // using just the primary 2 letters, or have special geopolitical identities.
        const countryExceptions = {
          'EUR': '歐洲聯盟',
          'ANG': '荷屬安地列斯',
          'XAF': '中部非洲國家經濟共同體',
          'XCD': '東加勒比國家組織',
          'XOF': '西非國家經濟共同體',
          'XPF': '法屬玻里尼西亞',
          'BTC': '全球',
          // Correct mapping for popular codes that might resolve weirdly or vaguely
          'TWD': '台灣',
          'CNY': '中國',
          'HKD': '香港',
          'MOP': '澳門'
        }

        // Apply country names to ALL currencies, both pre-defined and new
        Object.keys(data.rates).forEach(code => {
            let countryName = ''
            try {
              if (countryExceptions[code]) {
                 countryName = countryExceptions[code]
              } else {
                 const countryCode = code.substring(0, 2)
                 const res = regionNames.of(countryCode)
                 countryName = (res && res !== countryCode) ? res : ''
              }
            } catch (e) {
              countryName = ''
            }

          if (!currencies.value[code]) {
            currencies.value[code] = { 
              code, 
              name: code, 
              symbol: code, 
              country: countryName 
            }
          } else {
            // Update existing predefined currencies to include the country if they didn't have it
            if (!currencies.value[code].country) {
               currencies.value[code].country = countryName
            }
          }
        })
        lastUpdated.value = new Date(data.time_last_updated * 1000).toLocaleString()
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
    } finally {
      isFetching.value = false
    }
  }

  const convert = (amount, fromCode, toCode) => {
    if (!rates.value[fromCode] || !rates.value[toCode] || !amount) return 0
    // Convert logic: amount / fromRate * toRate
    const baseAmount = amount / rates.value[fromCode]
    return baseAmount * rates.value[toCode]
  }

  const addFavorite = (from, to) => {
    // Check if it already exists
    const exists = favorites.value.some(fav => fav.from === from && fav.to === to)
    if (!exists) {
      favorites.value.push({ from, to })
    }
  }

  const removeFavorite = (from, to) => {
    favorites.value = favorites.value.filter(fav => !(fav.from === from && fav.to === to))
  }

  const togglePin = (code) => {
    const index = pinnedRates.value.indexOf(code)
    if (index === -1) {
      pinnedRates.value.push(code)
    } else {
      pinnedRates.value.splice(index, 1)
    }
  }

  return {
    currencies,
    rates,
    favorites,
    pinnedRates,
    lastUpdated,
    isFetching,
    convert,
    fetchRates,
    addFavorite,
    removeFavorite,
    togglePin
  }
})

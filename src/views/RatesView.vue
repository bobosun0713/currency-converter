<script setup>
import { computed, onMounted, ref } from "vue";

import { useCurrencyStore } from "../stores/currency";

const currencyStore = useCurrencyStore();
const searchQuery = ref("");
const sortOption = ref("priority"); // 'priority', 'az', 'za', 'high', 'low'

// Pagination state
const currentPage = ref(1);
const itemsPerPage = 10;

onMounted(() => {
  if (!currencyStore.lastUpdated) {
    currencyStore.fetchRates();
  }
});

const getMockChange = code => {
  const val = ((code.charCodeAt(0) + code.charCodeAt(1)) % 100) / 100;
  const isUp = code.charCodeAt(0) % 2 === 0;
  return {
    value: isUp ? val : -val,
    isUp,
    text: `${isUp ? "+" : ""}${(isUp ? val : -val).toFixed(2)}%`
  };
};

// Full processed dataset based on search, filter, sorting, and pinning
const filteredAndSortedData = computed(() => {
  const allRatesKeys = Object.keys(currencyStore.rates);
  const priorityOrder = ["TWD", "USD", "JPY", "CNY"];

  const mappedData = allRatesKeys.map(code => {
    const currency = currencyStore.currencies[code];
    const nameStr = currency ? `${currency.name}${currency.country ? ` (${currency.country})` : ""}` : code;

    return {
      code,
      name: nameStr,
      rate: currencyStore.rates[code],
      change: getMockChange(code),
      isPinned: currencyStore.pinnedRates.includes(code)
    };
  });

  // 1. Filter by search
  let filtered = mappedData.filter(item => {
    const q = searchQuery.value.toLowerCase();
    return item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
  });

  // 2. Sort by selected option
  filtered.sort((a, b) => {
    switch (sortOption.value) {
      case "az":
        return a.code.localeCompare(b.code);
      case "za":
        return b.code.localeCompare(a.code);
      case "high":
        return b.rate - a.rate;
      case "low":
        return a.rate - b.rate;
      case "priority":
      default:
        // eslint-disable-next-line no-case-declarations
        const aPriority = priorityOrder.indexOf(a.code);
        // eslint-disable-next-line no-case-declarations
        const bPriority = priorityOrder.indexOf(b.code);

        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;
        return a.code.localeCompare(b.code);
    }
  });

  // 3. Extract pinned items and put them at the very top
  const pinnedItems = filtered.filter(item => item.isPinned);
  const unpinnedItems = filtered.filter(item => !item.isPinned);

  // Custom sorting rule: Pinned items are always on top
  return [...pinnedItems, ...unpinnedItems];
});

// Pagination computes
const totalPages = computed(() => Math.ceil(filteredAndSortedData.value.length / itemsPerPage) || 1);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredAndSortedData.value.slice(start, end);
});

const goToPage = page => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// CSV Export
const exportToCSV = () => {
  const headers = ["貨幣名稱", "代碼", "匯率 (1 USD =)", "24小時變動"];
  const rows = filteredAndSortedData.value.map(item => [item.name, item.code, item.rate.toFixed(4), item.change.text]);

  const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

  // Create a Blob and trigger download
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `exchange_rates_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-8">
    <div class="flex flex-col max-w-[1200px] flex-1 w-full gap-6">
      <!-- Page Header -->
      <div class="flex flex-wrap justify-between items-end gap-4 pb-2">
        <div class="flex min-w-72 flex-col gap-2">
          <h1 class="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            即時匯率
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
            主要世界貨幣對美金的即時匯率。
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span class="material-symbols-outlined text-lg">update</span>
          <span v-if="currencyStore.lastUpdated">最後更新: {{ currencyStore.lastUpdated }}</span>
          <span v-else>正在抓取最新匯率...</span>
        </div>
      </div>

      <!-- Search, Filter, and Export Bar -->
      <div class="flex flex-col sm:flex-row gap-4 items-center">
        <label class="flex flex-col h-12 w-full sm:flex-1 relative group">
          <div
            class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors"
          >
            <span class="material-symbols-outlined">search</span>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋貨幣 (例如 EUR, JPY)"
            class="form-input flex w-full h-full rounded-lg text-slate-900 dark:text-white border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 pl-12 text-base font-normal leading-normal focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
            @input="currentPage = 1"
          />
        </label>

        <div class="flex gap-2 w-full sm:w-auto">
          <!-- Sort Dropdown -->
          <div class="relative flex-1 sm:flex-none">
            <select
              v-model="sortOption"
              class="appearance-none w-full h-12 pl-10 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors focus:outline-none cursor-pointer"
              @change="currentPage = 1"
            >
              <option value="priority">預設熱門排序</option>
              <option value="az">代碼 A-Z</option>
              <option value="za">代碼 Z-A</option>
              <option value="high">匯率 高-低</option>
              <option value="low">匯率 低-高</option>
            </select>
            <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 flex items-center">
              <span class="material-symbols-outlined text-[20px]">sort</span>
            </div>
            <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
              <span class="material-symbols-outlined text-[20px]">expand_more</span>
            </div>
          </div>

          <!-- Export Button -->
          <button
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 px-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 transition-colors shrink-0"
            @click="exportToCSV"
          >
            <span class="material-symbols-outlined">download</span>
            <span class="font-medium hidden sm:inline">匯出 CSV</span>
          </button>
        </div>
      </div>

      <!-- Rates Table -->
      <div
        class="@container w-full overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-surface-dark shadow-sm"
      >
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-background-dark border-b border-neutral-200 dark:border-neutral-700">
              <th class="px-4 py-4 w-12 text-center text-slate-400 whitespace-nowrap">
                <span class="material-symbols-outlined text-[18px]">push_pin</span>
              </th>
              <th
                class="px-4 py-4 text-slate-900 dark:text-white text-sm font-semibold leading-normal w-[30%] whitespace-nowrap"
              >
                貨幣名稱
              </th>
              <th
                class="px-4 py-4 text-slate-900 dark:text-white text-sm font-semibold leading-normal w-[20%] whitespace-nowrap"
              >
                代碼
              </th>
              <th
                class="px-4 py-4 text-slate-900 dark:text-white text-sm font-semibold leading-normal text-right w-[25%] whitespace-nowrap"
              >
                匯率 (1 USD =)
              </th>
              <th
                class="px-6 py-4 text-slate-900 dark:text-white text-sm font-semibold leading-normal text-right whitespace-nowrap"
              >
                24小時變動
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200 dark:border-border-dark">
            <tr
              v-if="currencyStore.isFetching"
              class="group hover:bg-neutral-50 dark:hover:bg-background-dark transition-colors"
            >
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">正在載入即時資料...</td>
            </tr>
            <tr
              v-else-if="paginatedData.length === 0"
              class="group hover:bg-neutral-50 dark:hover:bg-background-dark transition-colors"
            >
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">沒有找到符合的貨幣</td>
            </tr>
            <tr
              v-for="item in paginatedData"
              v-else
              :key="item.code"
              class="group hover:bg-neutral-50 dark:hover:bg-background-dark transition-colors"
              :class="{ 'bg-primary/5 dark:bg-primary/10': item.isPinned }"
            >
              <td class="px-4 py-4 text-center whitespace-nowrap">
                <button
                  class="transition-colors hover:text-amber-500 focus:outline-none"
                  :class="item.isPinned ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'"
                  @click="currencyStore.togglePin(item.code)"
                >
                  <span class="material-symbols-outlined text-[18px]" :class="item.isPinned ? 'font-solid' : ''"
                    >push_pin</span
                  >
                </button>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-slate-900 dark:text-white text-sm font-medium">{{ item.name }}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-slate-500 dark:text-slate-400 text-sm font-medium">{{ item.code }}</div>
              </td>
              <td class="px-4 py-4 text-right whitespace-nowrap">
                <div class="text-slate-900 dark:text-white text-sm font-bold font-mono">{{ item.rate.toFixed(4) }}</div>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <div
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                    item.change.isUp
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  ]"
                >
                  <span class="material-symbols-outlined text-sm">{{
                    item.change.isUp ? "trending_up" : "trending_down"
                  }}</span>
                  {{ item.change.text }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8">
        <div class="text-sm text-slate-500 dark:text-slate-400 order-2 sm:order-1 text-center sm:text-left">
          顯示第
          <span class="font-bold text-slate-900 dark:text-white">{{
            paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
          }}</span>
          到
          <span class="font-bold text-slate-900 dark:text-white">{{
            Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)
          }}</span>
          筆，共 <span class="font-bold text-slate-900 dark:text-white">{{ filteredAndSortedData.length }}</span> 筆資料
        </div>

        <div class="flex items-center gap-2 order-1 sm:order-2">
          <!-- Previous Button -->
          <button
            class="flex h-10 px-3 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === 1 || totalPages === 0"
            @click="goToPage(currentPage - 1)"
          >
            <span class="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>

          <!-- Page Status -->
          <span class="text-sm font-medium px-2 dark:text-white">第 {{ currentPage }} / {{ totalPages }} 頁</span>

          <!-- Next Button -->
          <button
            class="flex h-10 px-3 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === totalPages || totalPages === 0"
            @click="goToPage(currentPage + 1)"
          >
            <span class="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

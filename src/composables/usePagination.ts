import { ref, computed } from 'vue'

export function usePagination(initialPageSize: number = 12) {
  const currentPage = ref(0)
  const totalItems = ref(0)
  const pageSize = ref(initialPageSize)

  const pageCount = computed(() => Math.ceil(totalItems.value / pageSize.value))

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pageCount.value) {
      currentPage.value = newPage
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const setPageSize = (nextSize: number) => {
    const parsed = Number(nextSize)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    pageSize.value = parsed
    currentPage.value = 0
  }

  const resetPagination = () => {
    currentPage.value = 0
    totalItems.value = 0
    pageSize.value = initialPageSize
  }

  return {
    currentPage,
    totalItems,
    pageSize,
    pageCount,
    handlePageChange,
    setPageSize,
    resetPagination
  }
} 
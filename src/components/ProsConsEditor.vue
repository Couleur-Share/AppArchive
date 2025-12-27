<template>
  <div class="space-y-6">
    <!-- 优点编辑 -->
    <div>
      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">优点</label>
      <div class="space-y-2">
        <div v-for="(pro, index) in localPros" :key="index" class="flex gap-2">
          <input
            v-model="localPros[index]"
            type="text"
            :disabled="disabled"
            @input="onProsInput(index)"
            class="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入优点..."
          />
          <IconButton size="xs" variant="danger" type="button" :disabled="disabled" @click="removePro(index)">
            <Trash2 class="w-4 h-4" />
          </IconButton>
        </div>
        <BaseButton type="button" :disabled="disabled" @click="addPro" variant="secondary" class="w-full border-dashed justify-center text-gray-500 dark:text-gray-400">
          <Plus class="w-4 h-4" />
          添加优点
        </BaseButton>
      </div>
    </div>

    <!-- 缺点编辑 -->
    <div>
      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">缺点</label>
      <div class="space-y-2">
        <div v-for="(con, index) in localCons" :key="index" class="flex gap-2">
          <input
            v-model="localCons[index]"
            type="text"
            :disabled="disabled"
            @input="onConsInput(index)"
            class="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入缺点..."
          />
          <IconButton size="xs" variant="danger" type="button" :disabled="disabled" @click="removeCon(index)">
            <Trash2 class="w-4 h-4" />
          </IconButton>
        </div>
        <BaseButton type="button" :disabled="disabled" @click="addCon" variant="secondary" class="w-full border-dashed justify-center text-gray-500 dark:text-gray-400">
          <Plus class="w-4 h-4" />
          添加缺点
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import BaseButton from './common/BaseButton.vue'
import IconButton from './common/IconButton.vue'

const props = defineProps<{
  pros: string[] | undefined
  cons: string[] | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:pros': [value: string[]]
  'update:cons': [value: string[]]
  'touched-pros': []
  'touched-cons': []
}>()

const localPros = ref<string[]>(props.pros ? [...props.pros] : [])
const localCons = ref<string[]>(props.cons ? [...props.cons] : [])

watch(() => props.pros, (v) => {
  localPros.value = Array.isArray(v) ? [...v] : []
})
watch(() => props.cons, (v) => {
  localCons.value = Array.isArray(v) ? [...v] : []
})

const addPro = () => {
  localPros.value = [...localPros.value, '']
  emit('update:pros', localPros.value)
  emit('touched-pros')
}
const removePro = (index: number) => {
  const next = [...localPros.value]
  next.splice(index, 1)
  localPros.value = next
  emit('update:pros', next)
  emit('touched-pros')
}
const onProsInput = (_index: number) => {
  emit('update:pros', [...localPros.value])
  emit('touched-pros')
}

const addCon = () => {
  localCons.value = [...localCons.value, '']
  emit('update:cons', localCons.value)
  emit('touched-cons')
}
const removeCon = (index: number) => {
  const next = [...localCons.value]
  next.splice(index, 1)
  localCons.value = next
  emit('update:cons', next)
  emit('touched-cons')
}
const onConsInput = (_index: number) => {
  emit('update:cons', [...localCons.value])
  emit('touched-cons')
}
</script>

<style scoped>
</style>



<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  description?: string
  width?: 'default' | 'wide'
  closeLabel?: string
}>(), {
  description: '',
  width: 'default',
  closeLabel: 'Close',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const modalClassName = computed(() => (props.width === 'wide' ? 'app-modal is-wide' : 'app-modal'))

function closeModal() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="app-modal-overlay" @click.self="closeModal">
      <div :class="modalClassName" class="panel">
        <div class="section-header">
          <div>
            <h3>{{ title }}</h3>
            <p v-if="description" class="muted">{{ description }}</p>
          </div>
          <button class="button-ghost" type="button" @click="closeModal">{{ closeLabel }}</button>
        </div>

        <div class="app-modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<template>
  <div class="color-wrapper">
    <button
      type="button"
      :class="{
        'color-picker': true
      }"
      :title="color"
      :style="{ color: color }"
      @click="togglePalette"
    />
    <div
      v-show="isOpen"
      :class="{
        'color-palette': true
      }"
    >
      <label
        :key="shade"
        :title="shade"
        :style="{ color: shade }"
        v-for="shade in palette"
      >
        <input type="radio" :value="shade" @click="onColorPicked(shade)" />
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'color-picker',

  props: {
    color: {
      type: String
    },
    palette: {
      default: () => [
        '#000000',
        '#FFFFFF',
        '#039BE5',
        '#ff3860',
        '#008732',
        '#5E60BA',
        '#f57f17'
      ],
      type: Array
    }
  },

  emits: ['change'],

  data() {
    return {
      isOpen: false
    }
  },

  methods: {
    togglePalette() {
      this.isOpen = !this.isOpen
    },

    onColorPicked(shade) {
      this.$emit('change', shade)
      this.isOpen = false
    }
  }
}
</script>

<style lang="scss" scoped>
.color-wrapper {
  position: relative;
  display: inline-flex;
}
.color-picker {
  padding: 0;
  background-color: transparent;
  cursor: pointer;
}
.preview .color-picker {
  background-color: $dark-grey;
}
.color-picker::before,
.color-palette label::before {
  display: block;
  content: '';
  margin: 0.25rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: currentColor;
}
.color-palette {
  position: absolute;
  z-index: 900;
  left: 0;
  bottom: calc(100% - 0.25rem);
  background-color: $dark-grey-light;
  border-radius: 5px;
}
.preview .color-palette {
  background-color: $dark-grey;
}
.color-palette label {
  display: block;
  margin: 0.5rem 0;
  cursor: pointer;
}
.color-palette input {
  display: none;
}
</style>

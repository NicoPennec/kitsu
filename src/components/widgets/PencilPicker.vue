<template>
  <div class="pencil-wrapper">
    <button
      type="button"
      class="pencil-picker"
      :title="$t(`playlists.actions.annotation_${pencil}`)"
      :class="{
        medium: pencil === 'medium',
        small: pencil === 'small'
      }"
      @click="togglePalette"
    />
    <div v-show="isOpen" class="pencil-palette">
      <label
        :key="pencil"
        :title="$t(`playlists.actions.annotation_${pencil}`)"
        :class="{
          medium: pencil === 'medium',
          small: pencil === 'small'
        }"
        v-for="pencil in sizes"
      >
        <input type="radio" :value="pencil" @click="onPencilPicked(pencil)" />
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'pencil-picker',

  props: {
    pencil: {
      type: String
    },
    sizes: {
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

    onPencilPicked(width) {
      this.$emit('change', width)
      this.isOpen = false
    }
  }
}
</script>

<style lang="scss" scoped>
.pencil-wrapper {
  position: relative;
  display: inline-flex;
}
.pencil-picker {
  padding: 0;
  background-color: transparent;
  cursor: pointer;
}
.pencil-picker {
  background-color: transparent;
  min-width: 1.5rem;
}
.pencil-picker::before,
.pencil-palette label::before {
  display: block;
  content: '';
  margin: 0.4rem auto;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: $light-grey;
}

.pencil-picker.medium::before,
.pencil-palette label.medium::before {
  margin: 0.5rem auto;
  width: 0.7rem;
  height: 0.7rem;
}

.pencil-picker.small::before,
.pencil-palette label.small::before {
  margin: 0.55rem auto;
  width: 0.5rem;
  height: 0.5rem;
}

.pencil-palette {
  position: absolute;
  z-index: 900;
  left: 0;
  bottom: calc(100% - 0.25rem);
  background-color: $dark-grey-light;
  border-radius: 5px;
  padding: 0 0.25rem;
}
.preview .pencil-palette {
  background-color: $dark-grey;
}
.pencil-palette label {
  display: block;
  margin: 0.5rem 0;
  cursor: pointer;
}
.pencil-palette input {
  display: none;
}
</style>

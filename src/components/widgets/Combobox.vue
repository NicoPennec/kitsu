<template>
  <div :class="{ field: withMargin, 'is-inline': isInline }">
    <label class="label" v-if="label.length > 0">
      {{ label }}
    </label>
    <p class="control" :class="{ 'is-inline': isInline }">
      <span class="select" :class="{ 'is-top': isTop }">
        <select
          ref="select"
          class="combobox select-input"
          :class="{ thin, error }"
          :disabled="disabled"
          :style="{
            width: width ? `${width}px` : undefined,
            maxWidth: maxWidth ? `${maxWidth}px` : undefined
          }"
          :title="currentOption?.label"
          @change="updateValue"
          @keyup.enter="emitEnter()"
        >
          <option
            v-for="(option, i) in options"
            :key="`${i}-${option.label}-${option.value}`"
            :value="option.label || option.value"
            :selected="value === option.value"
          >
            {{ getOptionLabel(option) }}
          </option>
        </select>
      </span>
    </p>
  </div>
</template>

<script>
export default {
  name: 'combobox',

  props: {
    label: {
      default: '',
      type: String
    },
    value: {
      default: '',
      type: [Object, String, Boolean, Number]
    },
    options: {
      default: () => [],
      type: Array
    },
    localeKeyPrefix: {
      default: '',
      type: String
    },
    isInline: {
      default: false,
      type: Boolean
    },
    isTop: {
      default: false,
      type: Boolean
    },
    disabled: {
      default: false,
      type: Boolean
    },
    error: {
      default: false,
      type: Boolean
    },
    maxWidth: {
      type: Number
    },
    thin: {
      default: false,
      type: Boolean
    },
    width: {
      type: Number
    },
    withMargin: {
      default: true,
      type: Boolean
    }
  },

  computed: {
    currentOption() {
      return this.options.find(option => option.value === this.value)
    }
  },

  methods: {
    updateValue() {
      const label = this.$refs.select.value
      const option = this.options.find(option => option.label === label)
      this.$emit('input', option.value)
    },

    emitEnter() {
      const label = this.$refs.select.value
      const option = this.options.find(option => option.label === label)
      this.$emit('enter', option.value)
    },

    getOptionLabel(option) {
      if (this.localeKeyPrefix && option.label) {
        return this.$t(this.localeKeyPrefix + option.label.toLowerCase())
      }
      return option.label
    }
  }
}
</script>

<style lang="scss" scoped>
.dark select:disabled {
  background: $dark-grey;
  border-color: $dark-grey-strong;
}

.is-top select {
  font-size: 1.2em;
  border: 0;
  border-bottom: 1px solid $light-grey;
  border-radius: 0;
  height: 38px;
}

.is-top select:focus {
  border-color: $green;
  outline: 0;
}

.select-input {
  height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;

  &.thin {
    height: 2.1em;
  }
}

.select {
  height: auto;
}
.select::after {
  border: 1px solid $green;
  border-right: 0;
  border-top: 0;
  margin-top: -4px;
}

.select.is-top::after {
  border: 2px solid $green;
  border-right: 0;
  border-top: 0;
  margin-top: -4px;
}

.error {
  border-color: $red;
}
</style>

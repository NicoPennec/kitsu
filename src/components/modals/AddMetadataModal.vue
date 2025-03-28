<template>
  <div
    :class="{
      modal: true,
      'is-active': active
    }"
  >
    <div class="modal-background" @click="$emit('cancel')"></div>

    <div class="modal-content">
      <div class="box content">
        <h1 class="title">
          {{
            isEditing
              ? $t('productions.metadata.edit_title')
              : $t('productions.metadata.title')
          }}
        </h1>

        <text-field
          ref="nameField"
          :label="$t('assets.fields.name')"
          v-model.trim="form.name"
          @enter="confirm"
        />

        <combobox
          :label="$t('assets.fields.type')"
          v-model="form.data_type"
          :options="typeOptions"
          @enter="confirm"
        />

        <div v-if="['list', 'taglist'].includes(form.data_type)">
          <p class="strong">
            {{ $t('productions.metadata.available_values') }}
          </p>

          <div
            ref="valueList"
            class="choice-value-wrapper mb1"
            v-if="form.values.length"
          >
            <p class="choice-value" :key="value" v-for="value in form.values">
              <span>{{ value }}</span>
              <span
                class="remove-button pull-right"
                @click="removeValue(value)"
              >
                x
              </span>
            </p>
          </div>
          <div v-else>
            {{ $t('productions.metadata.add_new_values') }}
          </div>

          <text-field
            v-model.trim="valueToAdd"
            :button-label="$t('main.add')"
            @enter="addValue"
          />
        </div>

        <div v-if="form.data_type === 'checklist'">
          <p class="strong">
            {{ $t('productions.metadata.checklist') }}
          </p>
          <div class="checklist-wrapper">
            <checklist
              :checklist="checklist"
              @add-item="onAddChecklistItem"
              @remove-task="removeTask"
              v-if="checklist.length"
            />
            <button-simple
              :class="{
                button: true,
                active: checklist.length !== 0
              }"
              icon="plus"
              :title="$t('comments.add_checklist')"
              @click="addChecklistEntry(-1)"
            />
          </div>
        </div>

        <div
          class="departments mb2"
          v-if="form.departments.length || selectableDepartments.length"
        >
          <label class="label">
            {{ $t('people.fields.departments') }}
          </label>
          <div
            class="department-element mb1"
            :key="departmentId"
            @click="removeDepartment(departmentId)"
            v-for="departmentId in form.departments"
          >
            <department-name :department="departmentMap.get(departmentId)" />
          </div>
          <div class="flexrow" v-if="selectableDepartments.length">
            <combobox-department
              class="flexrow-item"
              :selectable-departments="selectableDepartments"
              :max-height-select-input="160"
              v-model="selectedDepartment"
            />
            <button
              class="button is-success flexrow-item"
              :class="{
                'is-disabled': selectedDepartment === null
              }"
              @click="addDepartment"
            >
              {{ $t('main.add') }}
            </button>
          </div>
        </div>

        <combobox-boolean
          ref="hiddenField"
          :label="$t('assets.fields.hidden_from_client')"
          v-model="form.for_client"
          @enter="confirm"
        />

        <modal-footer
          :error-text="$t('productions.metadata.error')"
          :is-error="isError"
          :is-loading="isLoading"
          :is-disabled="!isFormFilled"
          @confirm="confirm"
          @cancel="$emit('cancel')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { modalMixin } from '@/components/modals/base_modal'
import { descriptorMixin } from '@/components/mixins/descriptors'

import { remove } from '@/lib/models'

import ButtonSimple from '@/components/widgets/ButtonSimple.vue'
import Checklist from '@/components/widgets/Checklist.vue'
import Combobox from '@/components/widgets/Combobox.vue'
import ComboboxBoolean from '@/components/widgets/ComboboxBoolean.vue'
import ComboboxDepartment from '@/components/widgets/ComboboxDepartment.vue'
import DepartmentName from '@/components/widgets/DepartmentName.vue'
import ModalFooter from '@/components/modals/ModalFooter.vue'
import TextField from '@/components/widgets/TextField.vue'

export default {
  name: 'add-metadata-modal',

  mixins: [descriptorMixin, modalMixin],

  components: {
    ButtonSimple,
    Checklist,
    Combobox,
    ComboboxBoolean,
    ComboboxDepartment,
    DepartmentName,
    ModalFooter,
    TextField
  },

  props: {
    active: {
      type: Boolean,
      default: false
    },
    descriptorToEdit: {
      type: Object,
      default: () => {}
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    isError: {
      type: Boolean,
      default: false
    },
    entityType: {
      type: String,
      default: 'Asset'
    }
  },

  emits: ['cancel', 'confirm'],

  data() {
    return {
      form: {
        name: '',
        data_type: 'string',
        for_client: 'false',
        values: [],
        departments: []
      },
      valueToAdd: '',
      checklist: [],
      typeOptions: [
        {
          label: this.$t('productions.metadata.string'),
          value: 'string'
        },
        {
          label: this.$t('productions.metadata.number'),
          value: 'number'
        },
        {
          label: this.$t('productions.metadata.boolean'),
          value: 'boolean'
        },
        {
          label: this.$t('productions.metadata.choices'),
          value: 'list'
        },
        {
          label: this.$t('productions.metadata.tags'),
          value: 'taglist'
        },
        {
          label: this.$t('productions.metadata.checklist'),
          value: 'checklist'
        }
      ],
      selectedDepartment: null
    }
  },

  mounted() {
    this.reset()
  },

  computed: {
    ...mapGetters([
      'currentProduction',
      'departmentMap',
      'isCurrentUserSupervisor',
      'taskTypeMap',
      'user'
    ]),

    isEditing() {
      return Boolean(this.descriptorToEdit.id)
    },

    selectableDepartments() {
      if (!this.currentProduction) return []

      let departments = this.currentProduction.task_types
        .map(taskTypeId => {
          const taskType = this.taskTypeMap.get(taskTypeId)
          return taskType && taskType.for_entity === this.entityType
            ? this.departmentMap.get(taskType.department_id)
            : false
        })
        .filter(
          (department, index, self) =>
            department &&
            self.indexOf(department) === index &&
            this.form.departments.findIndex(
              selectedDepartment => selectedDepartment === department.id
            ) === -1
        )
      if (this.isCurrentUserSupervisor && this.user.departments.length > 0) {
        departments = departments.filter(
          department => this.user.departments.indexOf(department.id) >= 0
        )
      }
      return departments
    },

    isFormFilled() {
      return (
        this.form.name.length &&
        (['string', 'number', 'boolean'].includes(this.form.data_type) ||
          (['list', 'taglist'].includes(this.form.data_type) &&
            this.form.values.length) ||
          (this.form.data_type === 'checklist' &&
            this.checklist?.[0]?.text.length)) &&
        (!this.isCurrentUserSupervisor ||
          !this.user.departments.length ||
          this.form.departments.length)
      )
    },

    valueList() {
      return this.$refs.valueList
    }
  },

  methods: {
    addValue(value) {
      const newValue = value
      if (!this.form.values.find(v => v === newValue) && newValue) {
        this.form.values.push(newValue)
        if (this.form.data_type === 'taglist') {
          this.form.values.sort()
        }
        this.valueToAdd = ''
        this.$nextTick(() => {
          const newValueIndex = this.form.values.findIndex(v => v === newValue)
          const newValuePosition =
            (this.valueList.scrollHeight / this.form.values.length) *
            newValueIndex
          this.valueList.scrollTop = newValuePosition
        })
      }
      return newValue
    },

    confirm() {
      if (['string', 'number', 'boolean'].includes(this.form.data_type)) {
        this.form.values = []
      } else if (this.form.data_type === 'checklist') {
        this.form.values = this.checklist
          .filter(Boolean)
          .map(x => (x.checked ? '[x] ' : '[ ] ') + x.text)
      }
      return this.$emit('confirm', this.form)
    },

    removeValue(valueToRemove) {
      this.form.values = remove(this.form.values, valueToRemove)
    },

    addDepartment() {
      this.form.departments.push(this.selectedDepartment)
      this.selectedDepartment = null
    },

    removeDepartment(idToRemove) {
      const departmentIndex = this.form.departments.indexOf(idToRemove)
      if (departmentIndex >= 0) {
        this.form.departments.splice(departmentIndex, 1)
      }
    },

    addChecklistEntry(index) {
      if (index === -1 || index === this.checklist.length - 1) {
        this.checklist.push({
          text: '',
          checked: false
        })
      }
    },

    onAddChecklistItem(item) {
      delete item.index
      this.checklist.push(item)
    },

    removeTask(entry) {
      this.checklist = remove(this.checklist, entry)
    },

    reset() {
      if (this.isEditing) {
        this.form = {
          id: this.descriptorToEdit.id,
          name: this.descriptorToEdit.name,
          data_type: this.descriptorToEdit.data_type,
          for_client: this.descriptorToEdit.for_client ? 'true' : 'false',
          values: [...this.descriptorToEdit.choices],
          departments: [...this.descriptorToEdit.departments]
        }
        this.checklist = this.getDescriptorChecklistValues(
          this.descriptorToEdit
        )
        if (this.form.data_type === 'taglist') {
          this.form.values.sort()
        }
      } else {
        this.form = {
          name: '',
          data_type: 'string',
          for_client: 'false',
          values: [],
          departments: []
        }
        this.checklist = []
      }
      this.valueToAdd = ''
    }
  },

  watch: {
    active() {
      if (this.active) {
        this.reset()
        this.$nextTick(() => {
          this.$refs.nameField.focus()
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dark .remove-button:hover {
  background: $grey-strong;
}

.modal-content .box p.text {
  margin-bottom: 1em;
}

.error {
  margin-top: 1em;
}

.description {
  margin-bottom: 1em;
}

.choice-value-wrapper {
  max-height: 120px;
  overflow-y: auto;
}

.content .choice-value {
  border: 1px solid var(--border);
  border-bottom: 0;
  margin: 0;
  padding: 0.5em;
}

.content .choice-value:last-child {
  border-bottom: 1px solid var(--border);
}

.remove-button {
  color: $grey;
  width: 20px;
  text-align: center;
  padding: 0;
  cursor: pointer;
}

.remove-button:hover {
  background: $white-grey;
  border-radius: 50%;
}

.department-element {
  display: inline-block;
  margin-right: 0.2em;
  cursor: pointer;
}

.checklist-wrapper {
  margin-bottom: 1em;
}

.checklist-wrapper .button {
  margin: 0.5em 0.2em;
}
</style>

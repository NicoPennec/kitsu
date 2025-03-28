<template>
  <div class="people-timesheet-info">
    <div class="close">
      <router-link class="close-button" :to="closeRoute">
        <x-icon />
      </router-link>
    </div>

    <div class="flexrow">
      <people-avatar class="flexrow-item" :person="person" :is-lazy="false" />
      <page-title class="flexrow-item" :text="person.full_name" />
    </div>

    <div class="info-date" v-if="isMonthInfo">{{ monthString }} {{ year }}</div>
    <div class="info-date" v-else-if="isWeekInfo">
      {{ $t('main.week') }}
      {{ week }}, {{ startDay }} - {{ endDay }} {{ weekMonth }} {{ year }}
    </div>
    <div class="info-date" v-else-if="isDayInfo">
      {{ day }} {{ monthString }} {{ year }}
    </div>

    <quota-shot-list
      class="time-spent-list"
      :count-mode="countMode"
      :shots="shots"
      :is-loading="isLoading"
      :is-error="isLoadingError"
    />
  </div>
</template>

<script>
import { XIcon } from 'lucide-vue-next'
import moment from 'moment-timezone'
import { mapGetters } from 'vuex'

import { monthToString } from '@/lib/time'

import PageTitle from '@/components/widgets/PageTitle.vue'
import PeopleAvatar from '@/components/widgets/PeopleAvatar.vue'
import QuotaShotList from '@/components/lists/QuotaShotList.vue'

export default {
  name: 'people-quota-info',

  components: {
    XIcon,
    PageTitle,
    PeopleAvatar,
    QuotaShotList
  },

  props: {
    person: {
      type: Object,
      default: () => {}
    },
    year: {
      type: Number,
      default: 0
    },
    month: {
      type: Number,
      default: 0
    },
    week: {
      type: Number,
      default: 0
    },
    day: {
      type: Number,
      default: 0
    },
    countMode: {
      type: String,
      default: 'frames'
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    isLoadingError: {
      type: Boolean,
      default: false
    },
    shots: {
      type: Array,
      default: () => []
    }
  },

  emits: ['close'],

  computed: {
    ...mapGetters(['currentEpisode', 'currentProduction']),

    startDay() {
      return moment().day('Monday').year(this.year).week(this.week).date()
    },

    endDay() {
      return moment()
        .day('Monday')
        .year(this.year)
        .week(this.week)
        .add(6, 'days')
        .date()
    },

    weekMonth() {
      return moment()
        .day('Monday')
        .year(this.year)
        .week(this.week)
        .format('MMM')
    },

    monthString() {
      return monthToString(this.month)
    },

    isMonthInfo() {
      return this.$route.path.indexOf('month') > 0
    },

    isWeekInfo() {
      return this.$route.path.indexOf('week') > 0
    },

    isDayInfo() {
      return this.$route.path.indexOf('day') > 0
    },

    closeRoute() {
      if (!this.currentProduction) return {}
      let route = {
        name: 'quota',
        production_id: this.currentProduction.id
      }
      if (this.isMonthInfo) {
        route = {
          name: 'quota-month',
          params: {
            year: this.year
          }
        }
      } else if (this.isWeekInfo) {
        route = {
          name: 'quota-week',
          params: {
            year: this.year
          }
        }
      } else if (this.isDayInfo) {
        route = {
          name: 'quota-day',
          params: {
            year: this.year,
            month: this.month
          }
        }
      }
      if (this.currentEpisode) {
        route.name = `episode-${route.name}`
        route.params.episode_id = this.currentEpisode.id
      }
      route.query = this.$route.query
      return route
    }
  },

  methods: {
    onCloseClicked() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.dark .close-button:hover {
  background: $dark-grey-lightest;
}

.data-list {
  padding-bottom: 5em;
}

.people-timesheet-info {
  border-left: 1px solid var(--border);
  height: 100%;
  padding: 1em;
}

.info-date {
  font-size: 1.5em;
  margin-top: 1em;
  text-transform: capitalize;
}

.close {
  text-align: right;
}

.close-button {
  cursor: pointer;
  display: inline-block;
  text-align: center;
  padding-top: 3px;
  width: 30px;
  height: 30px;
}

.close-button:hover {
  display: inline-block;
  background: $white-grey;
  border-radius: 50%;
}
</style>

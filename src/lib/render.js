import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { markedEmoji } from 'marked-emoji'

import emojis from '@/lib/emojis'
import { formatTime } from '@/lib/video'

const markedEmojiOptions = {
  emojis,
  renderer: token => token.emoji
}
marked.use(markedEmoji(markedEmojiOptions))

export const TIME_CODE_REGEX = /v(\d+) (\d+:)?(\d+):(\d+)(\.|:)(\d+) \((\d+)\)/g

// stricter than DOMPurify's defaults, which would let user content embed
// style, form, input, media and svg tags
const BASE_ALLOWED_TAGS = (
  'address article aside footer header h1 h2 h3 h4 h5 h6 hgroup main nav ' +
  'section blockquote dd div dl dt figcaption figure hr li menu ol p pre ul ' +
  'a abbr b bdi bdo br cite code data dfn em i kbd mark q rb rp rt rtc ruby ' +
  's samp small span strong sub sup time u var wbr caption col colgroup ' +
  'table tbody td tfoot th thead tr'
).split(' ')

// ALLOWED_ATTR below applies to every tag; restrict each attribute to the
// tags where it is meaningful.
const ALLOWED_ATTRIBUTES = {
  a: ['class', 'href'],
  img: ['src']
}

// Keep link/image URLs to these schemes; DOMPurify's defaults would also let
// through sms:, callto:, cid:, xmpp:, matrix: links and data: images.
const ALLOWED_URI_SCHEMES = ['http', 'https', 'ftp', 'mailto', 'tel']
const URI_SCHEME_REGEX = /^([a-z][a-z0-9+.-]*):/
const ATTR_WHITESPACE_REGEX =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0020\u00a0\u1680\u180e\u2000-\u2029\u205f\u3000]/g

DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  const allowedAttributes = ALLOWED_ATTRIBUTES[node.nodeName.toLowerCase()]
  if (!allowedAttributes?.includes(data.attrName)) {
    data.keepAttr = false
    return
  }
  if (data.attrName === 'href' || data.attrName === 'src') {
    const value = data.attrValue.replace(ATTR_WHITESPACE_REGEX, '')
    const scheme = URI_SCHEME_REGEX.exec(value.toLowerCase())?.[1]
    if (scheme && !ALLOWED_URI_SCHEMES.includes(scheme)) {
      data.keepAttr = false
    }
  }
})

export const sanitize = (html, options) => {
  options = {
    allowedLinkTag: true,
    allowedImageTag: true,
    ...options
  }
  const allowedTags = BASE_ALLOWED_TAGS.filter(
    tag => options.allowedLinkTag || tag !== 'a'
  )
  if (options.allowedImageTag) {
    allowedTags.push('img')
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['class', 'href', 'src'],
    ALLOW_DATA_ATTR: false,
    // Drop the text content of these tags, not just the tags themselves.
    ADD_FORBID_CONTENTS: ['textarea', 'option']
  })
}

export const getTaskTypeStyle = task => {
  let border = 'transparent'
  if (task) border = task.task_type_color
  return {
    'border-left': `4px solid ${border}`
  }
}

export const renderComment = (
  input,
  mentions,
  departmentMentions,
  personMap,
  departmentMap,
  taskTypes = [],
  className = ''
) => {
  let html = renderMarkdown(input)

  const replacements = new Map()

  if (mentions) {
    for (const personId of mentions) {
      const person = personMap.get(personId)
      if (!person) continue
      replacements.set(
        `@${person.full_name}`,
        `<a class="mention" href="/people/${person.id}">@${person.full_name}</a>`
      )
    }
    for (const departmentId of departmentMentions) {
      const department = departmentMap.get(departmentId)
      if (!department) continue
      replacements.set(
        `@${department.name}`,
        `<span style="color: ${department.color}">@${department.name}</span>`
      )
    }
  }

  if (taskTypes) {
    taskTypes.forEach(taskType => {
      const task_name = encodeHtmlEntities(taskType.name)
      if (taskType.url) {
        replacements.set(
          `#${task_name}`,
          `<a class="mention mention-task" href="${taskType.url}">#${task_name}</a>`
        )
      }
    })
    replacements.set(
      '#All',
      `<a class="mention mention-task" href="#">#All</a>`
    )
  }

  if (replacements.size > 0) {
    const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = [...replacements.keys()]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegex)
      .join('|')
    html = html.replace(new RegExp(pattern, 'g'), match =>
      replacements.get(match)
    )
  }

  return html.replaceAll(
    TIME_CODE_REGEX,
    (match, version, hours, minutes, seconds, sep, subframes, frame) => {
      return `<span
        class="timecode ${className}"
        data-version-revision="${version}"
        data-frame="${frame}"
      >${match}</span>`
    }
  )
}

export const renderMarkdown = (input, options = {}) => {
  if (!input?.length) return ''
  const html = marked.parse(input)
  return sanitize(html, options)
}

/**
 * Encode HTML entities in JavaScript
 * example task name: "Light & Render" => "Light &amp; Render"
 * @param {string} str - string to encode
 * @returns {string} - encoded string
 */
const encodeHtmlEntities = str => {
  return str.replace(
    /[&<>'"]/g,
    tag =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      })[tag]
  )

  // // -- more complex version if needed --
  // var el = document.createElement("div");
  // el.innerText = el.textContent = str;
  // str = el.innerHTML;
  // return str;
}

export const replaceTimeWithTimecode = (
  comment,
  currentPreviewRevision,
  frame,
  fps
) => {
  if (comment) {
    const frameDuration = Math.round((1 / fps) * 10000) / 10000
    const currentTimeRaw = (frame - 1) * frameDuration
    const formatedTime = formatTime(currentTimeRaw, fps)
    return comment.replaceAll(
      '@frame',
      `v${currentPreviewRevision} ${formatedTime} (${frame})`
    )
  } else {
    return ''
  }
}

export const renderFileSize = size => {
  if (!size) return ''
  let renderedSize
  if (size > 1000000000) {
    renderedSize = (size / 1000000000).toFixed(1) + 'G'
  } else if (size > 1000000) {
    renderedSize = (size / 1000000).toFixed(1) + 'M'
  } else if (size > 1000) {
    renderedSize = (size / 1000).toFixed(0) + 'K'
  } else {
    renderedSize = size + ''
  }
  return renderedSize
}

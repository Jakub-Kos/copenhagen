import { describe, expect, it } from 'vitest'
import { thumb } from './placeImage'

const img = (url: string) => ({ url, page: '', author: '', license: '' })

describe('thumb', () => {
  it('swaps the width of a stored 960 px thumbnail', () => {
    expect(thumb(img('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/960px-X.jpg'), 250)).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/X.jpg/250px-X.jpg',
    )
  })

  it('uses a 250 px thumbnail of a small original for lists, the original otherwise', () => {
    const o = img('https://upload.wikimedia.org/wikipedia/commons/8/8c/Louisiana.jpg')
    expect(thumb(o, 250)).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Louisiana.jpg/250px-Louisiana.jpg')
    expect(thumb(o, 960)).toBe(o.url)
  })
})

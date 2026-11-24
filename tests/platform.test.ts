import { describe, expect, it } from 'vitest'
import { isIosSafari } from '../src/utils/platform'

const IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1'
const IPAD_SAFARI =
  'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
const DESKTOP_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const DESKTOP_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'

describe('isIosSafari', () => {
  it('detects real iPhone Safari', () => {
    expect(isIosSafari(IOS_SAFARI, false)).toBe(true)
  })

  it('detects real iPad Safari', () => {
    expect(isIosSafari(IPAD_SAFARI, false)).toBe(true)
  })

  it('excludes Chrome on iOS (still WebKit, but not actually Safari)', () => {
    expect(isIosSafari(IOS_CHROME, false)).toBe(false)
  })

  it('excludes Android Chrome', () => {
    expect(isIosSafari(ANDROID_CHROME, false)).toBe(false)
  })

  it('excludes desktop Safari', () => {
    expect(isIosSafari(DESKTOP_SAFARI, false)).toBe(false)
  })

  it('excludes desktop Chrome', () => {
    expect(isIosSafari(DESKTOP_CHROME, false)).toBe(false)
  })
})

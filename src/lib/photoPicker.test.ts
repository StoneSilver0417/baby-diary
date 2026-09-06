import { describe, it, expect } from 'vitest'
import { pickPhotos } from './photoPicker'

describe('pickPhotos', () => {
  it('Given null or undefined, When pickPhotos is called, Then it returns empty array', async () => {
    expect(await pickPhotos(null)).toEqual([])
    expect(await pickPhotos(undefined)).toEqual([])
  })

  it('Given a list of valid files, When pickPhotos is called, Then it returns valid blob array', async () => {
    const file1 = new File(['image-content-1'], 'photo1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['image-content-2'], 'photo2.heic', { type: 'image/heic' })
    const result = await pickPhotos([file1, file2])
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(file1)
    expect(result[1]).toBe(file2)
  })

  it('Given files including zero-byte files, When pickPhotos is called, Then it filters out zero-byte files', async () => {
    const validFile = new File(['valid'], 'valid.jpg', { type: 'image/jpeg' })
    const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' })
    const result = await pickPhotos([validFile, emptyFile])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(validFile)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTextFile } from './saveTextFile'

const writeFile = vi.fn()
const share = vi.fn()
vi.mock('@capacitor/filesystem', () => ({ Filesystem: { writeFile: (...a) => writeFile(...a) }, Directory: { Documents: 'DOCUMENTS' } }))
vi.mock('@capacitor/share', () => ({ Share: { share: (...a) => share(...a) } }))

describe('saveTextFile (EXPORT-CSV)', () => {
  beforeEach(() => {
    writeFile.mockReset().mockResolvedValue({ uri: 'file:///docs/a.csv' })
    share.mockReset().mockResolvedValue({})
  })

  it('Android : écrit dans Documents (UTF-8 en base64) puis ouvre le partage', async () => {
    const r = await saveTextFile({ fileName: 'a.csv', text: 'é;1', mime: 'text/csv', shareTitle: 'Vos données' }, { platform: () => 'android' })
    expect(writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: 'a.csv', directory: 'DOCUMENTS' }))
    const { data } = writeFile.mock.calls[0][0]
    expect(decodeURIComponent(escape(atob(data)))).toBe('é;1')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///docs/a.csv'] }))
    expect(r).toEqual({ saved: 'documents', platform: 'android', shared: true })
  })

  it('iPhone : même chemin, le fichier reste dans l’app Fichiers si le partage est annulé', async () => {
    share.mockRejectedValue(new Error('annulé'))
    const r = await saveTextFile({ fileName: 'a.csv', text: 'x', mime: 'text/csv' }, { platform: () => 'ios' })
    expect(r).toEqual({ saved: 'documents', platform: 'ios', shared: false })
  })

  it('navigateur : téléchargement par un lien, rien écrit dans Documents', async () => {
    const createObjectURL = vi.fn(() => 'blob:x')
    globalThis.URL.createObjectURL = createObjectURL
    globalThis.URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const r = await saveTextFile({ fileName: 'a.csv', text: 'x', mime: 'text/csv' }, { platform: () => 'web' })
    expect(writeFile).not.toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(createObjectURL.mock.calls[0][0].type).toBe('text/csv')
    expect(r).toEqual({ saved: 'download', platform: 'web', shared: false })
    click.mockRestore()
  })
})

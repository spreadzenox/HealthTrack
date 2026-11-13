import { describe, it, expect, vi } from 'vitest'

// Version iOS (HealthTrack-iOS) : dans l'app iPhone, le lien de téléchargement ne fait rien (WKWebView) ;
// le rapport passe, comme sur Android, par Documents puis la feuille de partage
vi.mock('@capacitor/core', async (importOriginal) => ({
  ...(await importOriginal()),
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' },
}))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: vi.fn().mockResolvedValue({ uri: 'file:///Documents/rapport.pdf' }) },
  Directory: { Documents: 'DOCUMENTS' },
}))
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn().mockResolvedValue({}) } }))

import { Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { saveAndShareReport } from './createReportPdf'

describe('saveAndShareReport sur iPhone', () => {
  it('écrit le PDF dans Documents et ouvre la feuille de partage', async () => {
    const result = await saveAndShareReport({ bytes: new Uint8Array([37, 80, 68, 70]), fileName: 'rapport.pdf' })
    expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: 'rapport.pdf', directory: 'DOCUMENTS' }))
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///Documents/rapport.pdf'] }))
    expect(result).toEqual({ saved: 'documents', shared: true })
  })
})

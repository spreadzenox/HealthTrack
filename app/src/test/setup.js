import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Les runners CI sont parfois lents (page qui recharge ses données après un enregistrement) :
// 1 s par défaut pour findBy* / waitFor a déjà fait échouer un test sur main.
configure({ asyncUtilTimeout: 3000 })

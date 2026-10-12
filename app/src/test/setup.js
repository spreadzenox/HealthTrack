import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Les runners CI sont parfois lents : 3 s au lieu d'1 s pour findBy* / waitFor.
configure({ asyncUtilTimeout: 3000 })

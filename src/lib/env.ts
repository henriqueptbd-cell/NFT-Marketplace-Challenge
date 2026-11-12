// A API mockada é o backend da demonstração, então o MSW fica ligado por
// padrão e só é desligado com um opt-out explícito: VITE_ENABLE_MOCKS=false.
export const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'

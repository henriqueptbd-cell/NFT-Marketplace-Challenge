import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

/**
 * Descarta os dados em cache sem desconectar os observers ativos.
 *
 * `queryClient.clear()` remove as queries da cache, mas os componentes já
 * montados continuam ligados às instâncias antigas e ficam presos no estado
 * pendente — o que travava a página de perfil em "carregando" logo após o
 * login. `resetQueries` mantém as instâncias, notifica os observers e
 * recarrega apenas o que está em uso.
 */
export function resetQueryCache() {
  void queryClient.resetQueries()
}

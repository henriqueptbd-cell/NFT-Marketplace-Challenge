import { nftReviewListSchema, type NftReview } from '@/api/types'

const authors = [
  'Marina Prado',
  'Rafael Tavares',
  'Bianca Salles',
  'Thiago Menezes',
  'Luiza Camargo',
  'Otávio Reis',
  'Camila Duarte',
  'Henrique Vasques',
  'Fernanda Lobo',
  'Igor Bastos',
  'Paula Serrano',
  'Vinícius Alves',
  'Renata Kobayashi',
  'Daniel Fontes',
  'Alice Ferraz',
  'Bruno Sampaio',
  'Clara Nogueira',
  'Diego Amorim',
  'Elisa Tanaka',
  'Fábio Rangel',
  'Gabriela Pires',
  'Heitor Marques',
  'Isabela Rocha',
  'Jonas Vieira',
]

const comments = [
  'A arte ficou ainda melhor ao vivo, as cores são bem mais vivas do que na vitrine.',
  'Transferência rápida e o criador respondeu no mesmo dia. Recomendo a coleção.',
  'Gostei da composição, mas esperava um pouco mais de contraste nas sombras.',
  'Segunda peça que compro desta coleção. O acabamento digital é impecável.',
  'Os metadados vieram completos e o histórico de propriedade é fácil de conferir.',
  'Entrega tranquila. Só demorou um pouco para o pagamento ser confirmado na rede.',
  'Bem diferente de tudo que eu tenho na carteira. Vale cada centavo.',
  'A curadoria desta coleção é excelente, mas o preço subiu rápido demais.',
  'Ótima experiência de compra e o suporte respondeu minhas dúvidas rapidinho.',
  'Amo a paleta usada nesta edição. Já está entre as minhas favoritas.',
  'A imagem em alta resolução é impressionante, dá para ver cada detalhe.',
  'Comprei para presentear e a pessoa amou. Processo bem simples do início ao fim.',
  'O token chegou na carteira em poucos minutos, sem nenhum problema.',
  'Pena que a edição é limitada, queria ter pego outras peças da mesma série.',
  'O processo de compra foi rápido e o preço estava melhor que em outras plataformas.',
  'A descrição bate exatamente com o que recebi. Curadoria de confiança.',
  'Já favoritei outros itens da mesma coleção para comprar no próximo drop.',
  'Detalhes muito bem trabalhados, principalmente a iluminação da cena.',
  'Chegou tudo certo, mas o preço em ETH oscilou bastante durante a compra.',
  'Uma das peças mais bonitas que já vi nesta plataforma. Recomendo demais.',
  'O criador publicou o processo da obra e isso me convenceu a comprar.',
]

const reviewRatings = [5, 5, 4, 5, 4, 5, 3, 5]

/** Hash estável para derivar notas e comentários sem aleatoriedade entre execuções. */
function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_003
  }
  return hash
}

export function buildNftReviews(nftId: string): NftReview[] {
  const seed = hashString(nftId)
  const count = 4 + (seed % 21)

  return nftReviewListSchema.parse(
    Array.from({ length: count }, (_, index) => ({
      id: `${nftId}-review-${index + 1}`,
      author: authors[(seed + index * 37) % authors.length],
      rating: reviewRatings[(seed + index * 17) % reviewRatings.length],
      comment: comments[(seed + index * 53) % comments.length],
      createdAt: new Date(
        Date.UTC(2026, 10, 10 - Math.floor(index / 2), 12, 0, 0),
      ).toISOString(),
    })),
  )
}

/** Nota e quantidade exibidas no catálogo saem das mesmas avaliações da aba. */
export function reviewSummary(nftId: string): {
  rating: number
  reviewCount: number
} {
  const reviews = buildNftReviews(nftId)
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return {
    rating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  }
}

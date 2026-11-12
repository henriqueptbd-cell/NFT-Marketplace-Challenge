# Handoff: identidade e carteiras no backend

Este guia separa o contrato do frontend e os handlers MSW da implementação necessária para produção. **Não há backend real confirmado neste repositório.** Consulte também a [referência da API](api.md) e a [visão geral da aplicação](application-overview.md).

## Comportamento atual — Hoje (MSW/demo)

### Modal, entrada e retorno

`AuthDialog` fica montado no `RootLayout`, sobre a rota atual, mantendo a página de trás montada. O estado global em [`src/lib/auth-dialog.ts`](../src/lib/auth-dialog.ts) guarda modo (`login`/`register`) e redirect. Abas alternam os formulários; botões Google/Facebook aparecem em ambos. `/login` e `/register` abrem o mesmo diálogo e navegam com `replace` para o destino interno; links do cabeçalho e páginas de conta abrem login preservando a origem.

Login valida e-mail e senha não vazia. Cadastro exige nome de 2–80 caracteres, e-mail, senha de ao menos 8 caracteres e confirmação igual; confirmação não é enviada à API. “Esqueci a senha” usa o e-mail digitado, solicita `POST /auth/forgot-password` e exibe confirmação ou erro; não há formulário de token/nova senha. O redirect só é aceito se começar por `/`, não começar por `//` nem conter barra invertida; inválido ou ausente cai em `/` ([`src/lib/account-routing.ts`](../src/lib/account-routing.ts)).

**Login social ainda é simulado:** `POST /auth/social` recebe `google` ou `facebook`, mas o handler seleciona uma conta demo fixa, sem OAuth, callback, vínculo de identidade ou autenticação real; pode retornar `503 SOCIAL_UNAVAILABLE`.

### Sessão, rememberMe, 401 e logout

`useAuthSession` recupera a sessão por `GET /auth/session`, sem retry e com cache de 15 s. O cliente espelha o usuário em `localStorage` para a interface, mas a credencial de sessão é o cookie `kurio_session`. O mock armazena hash SHA-256 do token e verifica expiração; ao autenticar, substitui sessões anteriores daquele usuário. O `rememberMe` escolhe uma hora e cookie sem `Max-Age` quando falso, ou 30 dias e `Max-Age=2592000` quando verdadeiro. O transporte demo inclui `mockSessionToken`, gravado pelo cliente como cookie apenas com mocks ligados. O `Set-Cookie` do handler tem `HttpOnly; SameSite=Lax; Path=/`, sem `Secure`.

O estado MSW também fica em `localStorage` e contém senhas em texto simples; somente o token de sessão é hasheado. Isso é exclusivamente demo. Após login, cadastro ou social, `useCompleteAuth` atualiza cache e tenta mesclar carrinho de visitante. Só fecha o modal e redireciona após sucesso; em falha mantém o diálogo e permite nova tentativa.

O interceptor Axios emite evento global para 401, exceto login, cadastro e logout. `useAuthError` trata uma vez, limpa usuário e cache de queries, desconecta realtime, mostra aviso e reabre login com caminho, query e hash atuais (exceto nas rotas `/login` e `/register`). Logout tenta `POST /auth/logout`, limpa dados locais mesmo se falhar; o hook limpa também cache, desconecta realtime e navega para `/` em `onSettled`.

### Perfil, senha e carteiras

`GET/PATCH /profile` lê/edita `displayName`, `username`, `email`, `ens`, `walletNickname`, `avatar` e `bio`. A página exige sessão e, após salvar, sincroniza cache do perfil, sessão e usuário persistido. Avatar é selecionado como imagem de até 1 MB, convertido a Data URL pelo `FileReader` e enviado como string; não há upload real. O handler demo aceita string de avatar até 2 MB. Troca de senha envia senha atual e nova; confirmação é apenas cliente. O mock compara e grava senhas em texto puro.

`GET /wallets` alimenta formulário para uma carteira principal e uma secundária opcional. Os campos são nome, apelido, endereço, rede, tipo (`software`, `hardware`, `custodial`), ENS, referral code e e-mail. Redes: Ethereum, Polygon e Solana. Validação atual é de formato: EVM `0x` + 40 hexadecimais, Solana alfabeto Base58 com 32–44 caracteres; igualdade EVM ignora caixa e Solana é exata. Não comprova posse nem validade criptográfica.

O MSW rejeita duplicata do mesmo usuário/rede, define a primeira carteira como principal e verifica ownership em edição, promoção e remoção. Não há unicidade global observada. Remover a única carteira retorna `409 LAST_WALLET`; remover a principal promove outra automaticamente. A API define `DELETE /wallets/:id` e `POST /wallets/:id/primary`, mas a página não exibe esses controles e mostra no máximo principal e primeira outra. Seu submit grava principal e depois secundária em chamadas separadas: falha na segunda não desfaz a primeira. “Igual à principal” copia os campos, e não cria cópia para o mesmo endereço/rede.

## Backend real (pendente): requisitos

### Identidade e segurança de sessão

Persistir usuários e credenciais em banco relacional; normalizar e impor unicidade de e-mail. Armazenar senha somente com hash adaptativo (preferencialmente Argon2id; bcrypt com custo calibrado é alternativa), salt por biblioteca, comparação em tempo constante e política de rehash. Validar no servidor, limitar corpos e nunca registrar senhas, tokens ou cookies. Decidir e impor também se `username` é único.

Emitir token de sessão opaco, imprevisível e de alta entropia; persistir somente hash, user ID, emissão, expiração, revogação e metadados mínimos. Rotacionar no login e após reset/mudança de senha; revogar no logout e decidir se mudança de senha encerra outras sessões. `GET /auth/session` deve ser autoridade e retornar 401 para sessão inválida. `rememberMe` deve controlar expiração real; `localStorage` jamais autentica.

Cookies: `HttpOnly`, `Secure` em HTTPS e `SameSite` conforme topologia. Em cross-site/iframe, `SameSite=None` exige `Secure`, mas cookies de terceiros podem ser bloqueados; preferir same-site/BFF quando possível e testar navegadores alvo. Definir `Domain`, CORS com origens explícitas e `Access-Control-Allow-Credentials` (sem wildcard com credenciais). Proteger operações cookie-authenticated contra CSRF via token anti-CSRF e/ou validação estrita de `Origin`/Fetch Metadata, além de SameSite. Definir `frame-ancestors` e origens permitidas de embedding.

Limitar tentativas por IP e identificador normalizado, com regras próprias para login, registro, reset e mudança de senha; considerar atraso progressivo e anti-automação. Erros de login não devem revelar existência de e-mail. Reset deve responder o mesmo status/mensagem para conta existente ou inexistente, enviar link por canal verificado e usar token aleatório de uso único, armazenando só hash, com expiração curta e invalidação após consumo. O endpoint atual só simula confirmação. Social permanece indisponível até OAuth real: Authorization Code/PKCE conforme cliente, `state`/`nonce`, callback restrito, validação de issuer/audience/assinatura e identidade externa única. Nunca autenticar por conta demo.

### Perfil, carteiras, migrações e endpoints

Derivar `userId` da sessão, ignorar/rejeitar IDs de usuário do cliente e filtrar cada leitura/escrita pelo proprietário. Autorizar IDs de recursos para prevenir IDOR. Mudança de e-mail deve exigir confirmação; mudança de senha verifica a senha atual. Avatar deve ir a object storage por upload autenticado, com MIME/conteúdo, bytes e dimensões validados, nome gerado e URL/chave retornada; substituir Data URL no PATCH.

Criar migrações versionadas para usuários (e-mail normalizado único), credenciais, perfil 1:1, sessões revogáveis indexadas, tokens de reset hasheados/expiráveis/de uso único e, quando implementado, identidades OAuth únicas por `(provider, subject)`. Tabela de carteiras deve ter owner, rede, endereço normalizado, tipo, metadados e índices. Impor unicidade por `(user_id, network, address_normalized)`; decidir separadamente se a mesma wallet pode estar em contas diferentes. Validar cada chain adequadamente (checksum EVM, decodificação/validação Solana e redes suportadas), normalizando sem alterar semântica. Endereço em formato correto não prova posse. Um futuro fluxo de prova de controle precisa de assinatura de nonce, expiração e proteção anti-replay; a UI atual não conecta wallet, assina mensagem ou envia transação.

Troca de principal e remoção devem ser transacionais: serializar alterações por usuário, manter exatamente uma principal quando houver carteiras, promover substituta ao remover a principal e impedir remoção da última se essa for regra de produto. Usar constraint de unicidade parcial `(user_id) WHERE is_primary` (ou equivalente) para concorrência e verificar ownership antes de alterar. A página salva principal/secundária em sequência; se atomicidade do formulário for requisito, considerar endpoint em lote.

Endpoints já consumidos: `POST /auth/login`, `/auth/register`, `/auth/logout`, `/auth/forgot-password`; `GET /auth/session`; `PATCH /auth/password`; `POST /auth/social`; `GET/PATCH /profile`; `GET/POST/PATCH/DELETE /wallets` e `POST /wallets/:id/primary`. Preservar schemas em [`src/api/endpoints`](../src/api/endpoints/index.ts) e [`src/api/types`](../src/api/types/index.ts), incluindo erros `{code,message,fieldErrors?}`. Como extensões pendentes, especificar consumo de reset (`POST /auth/reset-password`), callback OAuth e upload de avatar antes de mudar o cliente. Não migrar senhas nem estado MSW para produção; testar HTTPS/cookies/CSRF/CORS, sessão expirada e concorrência na escolha de principal.

## Decisões a confirmar

Topologia (same-site, domínios distintos ou iframe), navegadores de embedding, política de sessões simultâneas, verificação de e-mail, unicidade de username, unicidade global de wallet, regra para remover a última carteira, chains suportadas e provedor OAuth/storage de avatar. Os contratos atuais não decidem esses pontos.

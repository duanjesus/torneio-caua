// Roteiros do Marreta para o Torneio do Cauã: três convidados respondendo o convite pelo
// celular, um torcedor acompanhando o placar e a TV, e o organizador montando e apitando o
// torneio pelo painel. Rodar, da pasta do projeto:
//   marreta                     os cinco ao mesmo tempo, seguindo os fluxos abaixo
//   marreta --modo explorar     navegação sem roteiro
// A rodada sobe uma cópia isolada do site (marreta/compose.marreta.yml) com banco vazio e a
// semente de marreta/semente.sql, e a derruba no fim. Nada sai para WhatsApp, YouTube ou Google:
// esses endereços recebem uma página de mentira.
import type { BrowserContext, Locator, Page } from 'playwright'
import type { Alvo, Contexto, Fluxo, Persona } from '../../marreta/src/tipos.ts'

// PNG de 1×1 para a foto da criança
const FOTO = { name: 'crianca.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') }
const NOMES = ['Theo', 'Bia', 'Luiz', 'Nina', 'Rafa', 'Duda', 'Pedro', 'Malu', 'Tom', 'Lara']
const VIDEOS = ['dQw4w9WgXcQ', 'aqz-KE-bpKQ', 'M7lc1UVf-VE', 'ScMzIvxBSi4', 'jNQXAC9IVRw']
let contador = 0

export async function preparar(context: BrowserContext, _alvo: Alvo, _persona: Persona): Promise<void> {
  // Nada sai do ambiente de teste: WhatsApp, YouTube, Google e Lance Replay recebem uma página de mentira
  await context.route(/^https?:\/\/([\w-]+\.)*(wa\.me|whatsapp\.com|youtube\.com|youtube-nocookie\.com|ytimg\.com|youtu\.be|google\.com|lancereplay\.com\.br)\//, (rota) =>
    rota.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<title>fora do site</title><h1>Página de fora, bloqueada no teste</h1>' }),
  )
}

// ---------- utilidades ----------

// (o Next anuncia o título de cada página num elemento com role="alert": erro do site é só o <p>)
const erroNaTela = async (page: Page) => ((await page.locator('p[role="alert"]').first().innerText({ timeout: 500 }).catch(() => '')) ?? '').trim()
const numero = (texto: string) => Number(/-?\d+/.exec(texto)?.[0] ?? NaN)
const cartoesDeCrianca = (page: Page) => page.locator('form .cartao').filter({ has: page.locator('input[id$="-nome"]') })

async function esperarUrl(page: Page, padrao: RegExp, oQue: string): Promise<void> {
  await page.waitForURL(padrao, { timeout: 15_000 }).catch(() => {})
  if (!padrao.test(page.url())) throw new Error(`${oQue} e não saí da página: "${await erroNaTela(page)}" (estou em ${new URL(page.url()).pathname})`)
}

// ---------- convidados ----------

const abrirConvite: Fluxo = async ({ page, alvo, h }) => {
  h.passo('abrir o convite')
  await page.goto(alvo.urls.convite)
  await page.getByRole('link', { name: 'Confirmar presença' }).waitFor()
}

/** Preenche uma criança no último card do formulário. Devolve se ela joga. */
async function preencherCrianca(ctx: Contexto, card: Locator, podeFoto: boolean): Promise<boolean> {
  const { page, h } = ctx
  await h.digitar(card.locator('input[id$="-nome"]'), `${h.sorteio(NOMES)} ${h.sorteio(['Lima', 'Souza', 'Rocha', 'Dias'])}`)
  await card.locator('select[id$="-idade"]').selectOption(String(h.inteiro(4, 11)))
  let joga = true
  if (h.chance(0.25)) {
    await card.getByRole('button', { name: /Vai jogar/ }).click()
    joga = false
  }
  if (joga && h.chance(0.3)) await card.getByRole('button', { name: /goleiro/ }).click()
  if (joga && podeFoto && h.chance(0.4)) {
    h.passo('mandar a foto da criança para a escalação')
    await card.locator('input[type="file"]').setInputFiles(FOTO)
    await card.locator('img[src^="/fotos/"]').waitFor({ timeout: 15_000 }).catch(async () => {
      throw new Error(`Mandei a foto da criança e ela não apareceu no formulário: "${(await card.locator('.erro').allInnerTexts()).join(' ')}"`)
    })
  }
  await h.pausa(300, 1200)
  return joga
}

const confirmarComCriancas: Fluxo = async (ctx) => {
  const { page, persona, h } = ctx
  await abrirConvite(ctx)
  h.passo('tocar em Confirmar presença')
  await page.getByRole('link', { name: 'Confirmar presença' }).click()
  await page.locator('#responsavel').waitFor()
  h.passo('dizer que vai e preencher nome e WhatsApp')
  await page.getByRole('button', { name: /^Vou!/ }).click()
  const nome = `${persona.nome} ${h.inteiro(100, 999)}-${++contador}`
  await h.digitar(page.locator('#responsavel'), nome)
  await h.digitar(page.locator('#telefone'), `(21) 9${h.inteiro(1000, 9999)}-${h.inteiro(1000, 9999)}`)
  for (let i = h.inteiro(0, 2); i > 0; i--) await page.getByRole('button', { name: 'Mais um' }).click()

  const quantas = h.inteiro(1, 3)
  let jogam = 0
  for (let i = 0; i < quantas; i++) {
    h.passo(`adicionar a ${i + 1}ª criança`)
    await page.getByRole('button', { name: '+ Adicionar criança' }).click()
    if (await preencherCrianca(ctx, cartoesDeCrianca(page).last(), true)) jogam++
  }
  if (h.chance(0.4)) await page.locator('#recado').fill('Parabéns, Cauã! (recado do Marreta)')

  h.passo('enviar a resposta')
  await h.clicar(page.getByRole('button', { name: 'Enviar resposta' }))
  await esperarUrl(page, /\/confirmado\//, 'Enviei a resposta')
  await page.getByRole('heading', { level: 1, name: 'Tá convocado!' }).waitFor()
  const resumo = await page.locator('main').innerText()
  if (!resumo.includes(nome)) throw new Error(`A confirmação não mostra o nome que eu enviei ("${nome}").`)
  const listadas = await page.locator('main section li').count()
  if (listadas !== quantas) throw new Error(`Enviei ${quantas} crianças e a confirmação lista ${listadas}.`)
  if (jogam > 0) {
    const inscritas = numero(/(\d+) crianças? inscritas?/.exec(resumo)?.[1] ?? '')
    if (inscritas !== jogam) throw new Error(`Marquei ${jogam} crianças para jogar e a confirmação diz ${inscritas} inscritas.`)
    if (!resumo.includes('não permite jogar descalço')) throw new Error('Tenho criança jogando e a confirmação não avisa da chuteira, meião e caneleira.')
  }

  h.passo('voltar ao convite: ele tem de lembrar que já respondi')
  await page.goto(ctx.alvo.urls.convite)
  await page.getByRole('link', { name: 'Ver minha resposta' }).waitFor({ timeout: 5000 }).catch(() => {
    throw new Error('Voltei ao convite depois de responder e ele não mostra "Ver minha resposta".')
  })
  await h.pausa(800, 2500)
}

const mudarResposta: Fluxo = async (ctx) => {
  const { page, alvo, h } = ctx
  h.passo('abrir o convite e ir na minha resposta')
  await page.goto(alvo.urls.convite)
  const minha = page.getByRole('link', { name: 'Ver minha resposta' })
  if (!(await minha.waitFor({ timeout: 4000 }).then(() => true, () => false))) return h.pular('ainda não respondi neste celular')
  await minha.click()
  await esperarUrl(page, /\/confirmado\//, 'Toquei em Ver minha resposta')
  h.passo('tocar em Mudar minha resposta')
  await page.getByRole('link', { name: 'Mudar minha resposta' }).click()
  await page.getByRole('button', { name: 'Salvar alterações' }).waitFor()

  const vai = (await page.getByRole('button', { name: /^Vou!/ }).getAttribute('aria-pressed')) === 'true'
  let esperado = 'Tá convocado!'
  let criancas = await cartoesDeCrianca(page).count()
  const mudanca = h.sorteio(vai ? ['talvez', 'tirar', 'pôr', 'adultos'] : ['vou'])
  h.passo(`mudar a resposta: ${mudanca}`)
  if (mudanca === 'talvez') {
    await page.getByRole('button', { name: /^Talvez/ }).click()
    esperado = 'Anotado!'
  } else if (mudanca === 'vou') {
    await page.getByRole('button', { name: /^Vou!/ }).click()
    if ((await page.getByRole('button', { name: 'Mais um' }).isVisible()) && h.chance(0.5)) await page.getByRole('button', { name: 'Mais um' }).click()
  } else if (mudanca === 'tirar' && criancas > 0) {
    await cartoesDeCrianca(page).nth(h.inteiro(0, criancas - 1)).getByRole('button', { name: 'Remover', exact: true }).click()
    criancas--
  } else if (mudanca === 'pôr' || mudanca === 'tirar') {
    await page.getByRole('button', { name: '+ Adicionar criança' }).click()
    await preencherCrianca(ctx, cartoesDeCrianca(page).last(), false)
    criancas++
  } else {
    await page.getByRole('button', { name: 'Mais um' }).click()
  }
  // Conta de novo depois da mudança: quem tinha respondido "Não vou" guarda as crianças escondidas,
  // e elas voltam a aparecer quando a resposta vira "Vou!" ou "Talvez".
  criancas = await cartoesDeCrianca(page).count()
  // Quem passa a ir sem nenhum adulto e nenhuma criança cai no "diga quantas pessoas vêm": põe um adulto
  const adultos = page.locator('[aria-live="polite"]').first()
  if (esperado !== 'Que pena!' && criancas === 0 && (await adultos.isVisible()) && numero(await adultos.innerText()) === 0) {
    await page.getByRole('button', { name: 'Mais um' }).click()
  }

  h.passo('salvar as alterações')
  await h.clicar(page.getByRole('button', { name: 'Salvar alterações' }))
  await esperarUrl(page, /\/confirmado\//, 'Salvei as alterações')
  await page.getByRole('heading', { level: 1, name: esperado }).waitFor({ timeout: 8000 }).catch(async () => {
    throw new Error(`Mudei a resposta (${mudanca}) e a confirmação abriu com "${await page.locator('h1').first().innerText()}" em vez de "${esperado}".`)
  })
  const listadas = await page.locator('main section li').count()
  if (listadas !== criancas) throw new Error(`Depois de mudar a resposta (${mudanca}) deviam ficar ${criancas} crianças, e a confirmação lista ${listadas}.`)
}

const avisarQueNaoVai: Fluxo = async (ctx) => {
  const { page, persona, h } = ctx
  await abrirConvite(ctx)
  await page.getByRole('link', { name: 'Confirmar presença' }).click()
  await page.locator('#responsavel').waitFor()
  // Começa dizendo que vai, inscreve uma criança e só então muda de ideia: o servidor não pode
  // deixar essa criança inscrita no torneio (a verificação "Quem não vai não tem criança jogando" confere).
  h.passo('dizer que vai, inscrever uma criança e mudar para Não vou')
  await page.getByRole('button', { name: /^Vou!/ }).click()
  await page.getByRole('button', { name: '+ Adicionar criança' }).click()
  await preencherCrianca(ctx, cartoesDeCrianca(page).last(), false)
  await page.getByRole('button', { name: /^Não vou/ }).click()
  await h.digitar(page.locator('#responsavel'), `${persona.nome} não vai ${h.inteiro(100, 999)}-${++contador}`)
  await h.digitar(page.locator('#telefone'), `21 9${h.inteiro(1000, 9999)}${h.inteiro(1000, 9999)}`)
  h.passo('enviar')
  await h.clicar(page.getByRole('button', { name: 'Enviar resposta' }))
  await esperarUrl(page, /\/confirmado\//, 'Avisei que não vou')
  await page.getByRole('heading', { level: 1, name: 'Que pena!' }).waitFor()
  if (await page.getByText(/inscritas? no torneio/).isVisible()) throw new Error('Respondi que não vou e a confirmação diz que tenho criança inscrita no torneio.')
}

const enviarComErro: Fluxo = async (ctx) => {
  const { page, alvo, h } = ctx
  h.passo('abrir o formulário e enviar sem preencher nada')
  await page.goto(new URL('/confirmar', alvo.urls.convite).href)
  await page.getByRole('button', { name: 'Enviar resposta' }).click()
  const aviso = page.locator('p[role="alert"]')
  await aviso.waitFor({ timeout: 8000 }).catch(() => {
    throw new Error('Enviei o formulário vazio e nada avisou o que falta.')
  })
  const erros = await page.locator('.erro').count()
  if (erros < 3) throw new Error(`Formulário vazio: esperava avisos em presença, nome e WhatsApp, e apareceram ${erros}.`)
  h.passo('preencher o nome e um WhatsApp curto demais')
  await page.getByRole('button', { name: /^Talvez/ }).click()
  await h.digitar(page.locator('#responsavel'), 'Fulano do Marreta')
  await h.digitar(page.locator('#telefone'), '1234')
  await page.getByRole('button', { name: 'Enviar resposta' }).click()
  await page.waitForTimeout(1500)
  if (/\/confirmado\//.test(page.url())) throw new Error('O formulário aceitou o WhatsApp "1234".')
  const doTelefone = await page.locator('#telefone ~ .erro, #telefone + .erro').count()
  if (!doTelefone) throw new Error('Mandei um WhatsApp curto demais e o campo não mostra o erro.')
  // Campo corrigido perde o aviso na hora
  await page.locator('#telefone').fill('(21) 98888-7777')
  if (await page.locator('#telefone + .erro').isVisible()) throw new Error('Corrigi o WhatsApp e o aviso de erro continuou no campo.')
}

const linkInexistente: Fluxo = async ({ page, alvo, h }) => {
  h.passo('abrir um link de resposta que não existe')
  const r1 = await h.recusaEsperada(() => page.goto(new URL('/confirmado/link-que-nao-existe', alvo.urls.convite).href))
  if (r1?.status() !== 404) throw new Error(`Uma resposta que não existe respondeu HTTP ${r1?.status()} (deveria ser 404).`)
  h.passo('abrir a edição com um código que não existe')
  const r2 = await h.recusaEsperada(() => page.goto(new URL('/confirmar?t=codigo-errado', alvo.urls.convite).href))
  if (r2?.status() !== 404) throw new Error(`Editar com um código que não existe respondeu HTTP ${r2?.status()} (deveria ser 404).`)
  const volta = page.getByRole('link', { name: 'Ir para o convite' })
  if (!(await volta.isVisible())) throw new Error('A página de "não encontrado" não oferece o caminho de volta para o convite.')
  await volta.click()
  await page.waitForURL((url) => url.pathname === '/')
}

// ---------- torcida ----------

const entrarNoTorneio: Fluxo = async ({ page, alvo, h }) => {
  h.passo('abrir o placar do torneio')
  await page.goto(alvo.urls.torneio)
  await page.locator('h1').first().waitFor()
}

const acompanharTorneio: Fluxo = async (ctx) => {
  const { page, h } = ctx
  await entrarNoTorneio(ctx)
  const titulo = (await page.locator('h1').first().innerText()).trim()
  if (/em breve/i.test(titulo)) {
    const inscritos = await page.getByText(/craques? inscritos?/).innerText().catch(() => '')
    if (!inscritos) throw new Error('A página do torneio "em breve" não mostra quantos craques já estão inscritos.')
    return h.pausa(1500, 4000)
  }
  h.passo('pular entre as abas do torneio')
  const abas = page.getByRole('navigation', { name: 'Seções', exact: true }).getByRole('link')
  const total = await abas.count()
  if (total < 3) throw new Error(`O torneio está publicado e a barra de abas tem só ${total} abas.`)
  for (let i = 0; i < 2; i++) {
    const aba = abas.nth(h.inteiro(0, total - 1))
    const destino = (await aba.getAttribute('href'))?.slice(1) ?? ''
    await aba.click()
    await page.locator(`section#${destino}`).waitFor()
    await h.pausa(800, 2000)
  }
  // Em cada grupo, a soma dos jogos (J) de todos os times é par: cada jogo conta para dois
  for (const tabela of await page.locator('section#tabela table').all()) {
    const jogos = (await tabela.locator('tbody tr td:nth-child(4)').allInnerTexts()).reduce((s, t) => s + numero(t), 0)
    if (jogos % 2 !== 0) throw new Error(`Na tabela do torneio, a soma dos jogos (J) de um grupo deu ${jogos}, um número ímpar.`)
  }
  const escalacoes = await page.locator('section#escalacoes h3').count()
  if (escalacoes < 2) throw new Error(`O torneio está publicado e mostra ${escalacoes} escalações.`)
  await h.pausa(2000, 5000)
}

const olharTv: Fluxo = async ({ page, alvo, h }) => {
  const antes = page.viewportSize()
  await page.setViewportSize({ width: 1280, height: 720 })
  try {
    h.passo('abrir o modo TV numa tela 1280×720')
    await page.goto(new URL('/torneio/tv', alvo.urls.torneio).href)
    await page.locator('h1').first().waitFor()
    // Dois painéis seguidos: nenhum pode passar do espaço da tela (na TV não tem rolagem)
    for (let i = 0; i < 2; i++) {
      await page.waitForTimeout(i === 0 ? 1500 : 12_500)
      const estouro = await page.evaluate(() => {
        const painel = document.querySelector<HTMLElement>('[class*="aparecer"]')
        if (!painel) return null
        const titulo = document.querySelector('[class*="aparecer"] h2')?.textContent ?? 'painel'
        return painel.scrollHeight > painel.clientHeight + 4 ? `${titulo}: ${painel.scrollHeight}px num espaço de ${painel.clientHeight}px` : null
      })
      if (estouro) throw new Error(`Um painel do modo TV não cabe na tela e fica cortado (${estouro}).`)
    }
  } finally {
    if (antes) await page.setViewportSize(antes)
  }
}

// ---------- organizador, no painel ----------

const navegacao = (page: Page) => page.getByRole('navigation', { name: 'Seções do painel' })

const entrarNoPainel: Fluxo = async ({ page, alvo, senha, h }) => {
  h.passo('abrir o painel')
  await page.goto(alvo.urls.admin)
  const campo = page.locator('#senha')
  await campo.or(navegacao(page)).first().waitFor()
  if (await navegacao(page).isVisible()) return
  h.passo('entrar com a senha')
  await h.digitar(campo, senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('heading', { level: 1, name: 'Resumo' }).waitFor()
}

async function noPainel(ctx: Contexto, menu: string, titulo: string): Promise<void> {
  const { page, h } = ctx
  if (!new URL(page.url()).pathname.startsWith('/admin') || !(await navegacao(page).isVisible())) await entrarNoPainel(ctx)
  h.passo(`menu ${menu}`)
  await navegacao(page).getByRole('link', { name: menu, exact: true }).click()
  await page.getByRole('heading', { level: 1, name: titulo }).waitFor()
}

const montarTorneio: Fluxo = async (ctx) => {
  const { page, h } = ctx
  await noPainel(ctx, 'Tabela', 'Tabela')
  if (await page.getByRole('button', { name: 'Esconder' }).isVisible()) return h.pular('o torneio já está montado e publicado')

  await noPainel(ctx, 'Times', 'Times')
  const confirmados = numero(await page.getByText(/Entram os \d+ jogadores/).innerText())
  if (confirmados < 8) return h.pular(`só ${confirmados} jogadores confirmados`)
  h.passo('sortear 4 times')
  await page.locator('#num-times').selectOption('4')
  await page.getByRole('button', { name: /^Sortear/ }).click()
  await page.locator('main h3').nth(3).waitFor({ timeout: 15_000 })
  await page.waitForTimeout(800)
  const linhas = await page.locator('main .cartao p.text-xs').allInnerTexts()
  const tamanhos = linhas.map((t) => numero(/(\d+) jogadores/.exec(t)?.[1] ?? ''))
  const goleiros = linhas.map((t) => numero(/(\d+) goleiros?/.exec(t)?.[1] ?? '0'))
  const somados = tamanhos.reduce((s, n) => s + n, 0)
  if (tamanhos.length !== 4) throw new Error(`Sorteei 4 times e apareceram ${tamanhos.length}.`)
  if (Math.max(...tamanhos) - Math.min(...tamanhos) > 1) throw new Error(`O sorteio fez times desiguais: ${tamanhos.join(', ')} jogadores.`)
  if (Math.max(...goleiros) - Math.min(...goleiros) > 1) throw new Error(`O sorteio juntou goleiros num time só: ${goleiros.join(', ')} goleiros por time.`)
  // Quem confirmou enquanto eu sorteava pode ficar de fora (vai para "Sem time"): no mínimo os que a tela contou
  if (somados < confirmados) throw new Error(`Eram ${confirmados} jogadores confirmados e os times somam ${somados}.`)

  await noPainel(ctx, 'Tabela', 'Tabela')
  h.passo('gerar a tabela com o formato padrão')
  const previa = await page.getByText(/\d+ jogos ·/).innerText()
  const jogos = numero(previa)
  await page.getByRole('button', { name: /^Gerar tabela/ }).click()
  await page.getByRole('button', { name: 'Publicar no site' }).or(page.getByRole('button', { name: 'Esconder' })).first().waitFor({ timeout: 15_000 })
  await page.waitForTimeout(800)
  const naTela = await page.locator('main a[href^="/admin/jogos/"]').count()
  if (naTela !== jogos) throw new Error(`A prévia dizia ${jogos} jogos e a tabela gerada mostra ${naTela}.`)
  h.passo('publicar no site')
  await page.getByRole('button', { name: 'Publicar no site' }).click()
  await page.getByRole('button', { name: 'Esconder' }).waitFor({ timeout: 10_000 })

  h.passo('conferir o torneio publicado no site')
  await page.goto(ctx.alvo.urls.torneio)
  const titulo = (await page.locator('h1').first().innerText()).trim()
  if (/em breve/i.test(titulo)) throw new Error('Publiquei o torneio e o site continua dizendo "em breve".')
  const times = await page.locator('section#escalacoes h3').count()
  if (times !== 4) throw new Error(`Publiquei 4 times e o site mostra ${times} escalações.`)
}

/** Lê o placar grande do controle do jogo. */
async function placar(page: Page): Promise<[number, number]> {
  const [a, b] = await page.locator('span.text-8xl').allInnerTexts()
  return [numero(a), numero(b)]
}

async function esperarPlacar(page: Page, soma: number, oQue: string): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const [a, b] = await placar(page)
    if (a + b === soma) return
    await page.waitForTimeout(250)
  }
  const [a, b] = await placar(page)
  throw new Error(`${oQue} e o placar ficou ${a} x ${b} (esperava ${soma} gols no total).`)
}

const apitarJogo: Fluxo = async (ctx) => {
  const { page, h } = ctx
  await noPainel(ctx, 'Jogos', 'Jogos')
  const cartoes = page.locator('main a[href^="/admin/jogos/"]')
  if (!(await cartoes.count())) return h.pular('o torneio ainda não tem tabela')
  // Primeiro termina o que está rolando; senão, o próximo jogo com os dois times definidos
  const aoVivo = cartoes.filter({ hasText: 'Ao vivo' })
  let escolhido = (await aoVivo.count()) ? aoVivo.first() : null
  if (!escolhido) {
    for (const c of await cartoes.all()) {
      const texto = await c.innerText()
      if (/Encerrado/.test(texto) || /º do Grupo|Vencedor|Perdedor|A definir/.test(texto)) continue
      escolhido = c
      break
    }
  }
  if (!escolhido) return h.pular('nenhum jogo com os dois times definidos')
  const titulo = (await escolhido.innerText()).split('\n')[0]
  h.passo(`abrir ${titulo.split('·')[0].trim()}`)
  await escolhido.click()
  await page.waitForURL(/\/admin\/jogos\/\d+$/)
  const comecar = page.getByRole('button', { name: /Começar jogo/ })
  const gol = page.getByRole('button', { name: '⚽ Gol' })
  await comecar.or(gol.first()).first().waitFor()
  if (await comecar.isVisible()) {
    h.passo('começar o jogo')
    await comecar.click()
    await gol.first().waitFor({ timeout: 10_000 })
  }

  let [a, b] = await placar(page)
  for (let i = h.inteiro(0, 3); i > 0; i--) {
    const lado = h.inteiro(0, 1)
    h.passo(`marcar um gol do ${lado === 0 ? 'primeiro' : 'segundo'} time`)
    await gol.nth(lado).click()
    const jogadores = page.locator('button.justify-start')
    await page.getByRole('button', { name: 'Não sei quem fez' }).waitFor()
    if (h.chance(0.15)) {
      await page.getByRole('button', { name: 'Foi gol contra' }).click()
      await page.waitForTimeout(300)
    }
    const quantos = await jogadores.count()
    if (quantos && h.chance(0.85)) await jogadores.nth(h.inteiro(0, quantos - 1)).click()
    else await page.getByRole('button', { name: 'Não sei quem fez' }).click()
    if (lado === 0) a++
    else b++
    await esperarPlacar(page, a + b, 'Marquei um gol')
    await h.pausa(500, 1500)
  }
  if (a + b > 0 && h.chance(0.2)) {
    h.passo('apagar o último gol (foi marcado errado)')
    await page.getByRole('button', { name: 'Apagar' }).last().click()
    await esperarPlacar(page, a + b - 1, 'Apaguei um gol')
    ;[a, b] = await placar(page)
  }

  h.passo('encerrar o jogo')
  await page.getByRole('button', { name: /Encerrar jogo/ }).first().click()
  const penaltis = page.locator('#pen-a')
  await penaltis.or(page.getByRole('button', { name: 'Reabrir para corrigir' })).first().waitFor({ timeout: 10_000 })
  if (await penaltis.isVisible()) {
    h.passo('empate no mata-mata: informar os pênaltis')
    const pa = h.inteiro(2, 5)
    await penaltis.fill(String(pa))
    await page.locator('#pen-b').fill(String(pa + h.sorteio([-1, 1])))
    await page.getByRole('button', { name: 'Encerrar jogo', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Reabrir para corrigir' }).waitFor({ timeout: 10_000 }).catch(async () => {
    throw new Error(`Encerrei o jogo e ele não ficou encerrado: "${await page.locator('[role="alert"]').last().innerText().catch(() => '')}"`)
  })
  const [fa, fb] = await placar(page)
  if (fa !== a || fb !== b) throw new Error(`Encerrei o jogo com ${a} x ${b} e o placar final ficou ${fa} x ${fb}.`)

  if (h.chance(0.1)) {
    h.passo('reabrir para corrigir e encerrar de novo')
    await page.getByRole('button', { name: 'Reabrir para corrigir' }).click()
    await page.getByRole('button', { name: /Encerrar jogo/ }).first().waitFor()
    await page.getByRole('button', { name: /Encerrar jogo/ }).first().click()
    if (await penaltis.waitFor({ timeout: 3000 }).then(() => true, () => false)) {
      await penaltis.fill('4')
      await page.locator('#pen-b').fill('3')
      await page.getByRole('button', { name: 'Encerrar jogo', exact: true }).click()
    }
    await page.getByRole('button', { name: 'Reabrir para corrigir' }).waitFor({ timeout: 10_000 })
  }
}

const conferirNumeros: Fluxo = async (ctx) => {
  const { page, h } = ctx
  // Convidados respondem ao mesmo tempo: se os números não baterem, confere de novo antes de acusar
  for (let tentativa = 1; ; tentativa++) {
    await noPainel(ctx, 'Resumo', 'Resumo')
    const noResumo = numero(await page.locator('.cartao', { hasText: 'Jogadores inscritos' }).locator('p.font-display').innerText())
    await noPainel(ctx, 'Jogadores', 'Jogadores')
    const naLista = numero(await page.locator('main p').filter({ hasText: /inscritos? ·/ }).first().innerText())
    const linhas = await page.locator('main ul > li').count()
    if (noResumo === naLista && naLista === linhas) break
    if (tentativa === 2) throw new Error(`O Resumo diz ${noResumo} jogadores inscritos; a página Jogadores diz ${naLista} e lista ${linhas}.`)
    await h.pausa(500, 1000)
  }
}

const darNivel: Fluxo = async (ctx) => {
  const { page, h } = ctx
  await noPainel(ctx, 'Jogadores', 'Jogadores')
  const grupos = page.getByRole('group', { name: /^Nível de / })
  const total = await grupos.count()
  if (!total) return h.pular('ninguém inscrito')
  const grupo = grupos.nth(h.inteiro(0, total - 1))
  const quem = ((await grupo.getAttribute('aria-label')) ?? '').replace('Nível de ', '')
  // Nomes se repetem entre famílias: a linha é achada pelo nome E pelo link da família
  const familia = await grupo.locator('xpath=ancestor::li[1]').getByRole('link').first().getAttribute('href')
  const linha = () => page.locator('main ul > li').filter({ has: page.locator(`a[href="${familia}"]`) }).filter({ has: page.getByRole('group', { name: `Nível de ${quem}`, exact: true }) }).first()
  const nivel = String(h.inteiro(1, 3))
  h.passo(`dar nível ${nivel} para ${quem}`)
  const botao = grupo.getByRole('button', { name: nivel, exact: true })
  if ((await botao.getAttribute('aria-pressed')) === 'true') return h.pular(`${quem} já tinha nível ${nivel}`)
  // Espera a gravação voltar do servidor antes de recarregar (recarregar no meio cancela o envio)
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST', { timeout: 10_000 }), botao.click()])
  h.passo('recarregar: o nível tem de continuar marcado')
  await page.reload()
  const depois = await linha().getByRole('button', { name: nivel, exact: true }).getAttribute('aria-pressed')
  if (depois !== 'true') throw new Error(`Dei nível ${nivel} para ${quem} (${familia}) e, depois de recarregar, o nível não ficou marcado.`)
}

const abrirLembretes: Fluxo = async (ctx) => {
  const { page, h } = ctx
  await noPainel(ctx, 'Lembretes', 'Lembretes')
  for (const aba of [/^Quem marcou talvez/, /^Véspera/]) {
    h.passo(`abrir a aba ${aba.source.replace(/[\^\\/]/g, '')}`)
    const link = page.getByRole('link', { name: aba })
    await link.click()
    await page.waitForURL((url) => url.pathname === '/admin/lembretes' && (aba.source.includes('talvez') ? !url.search : url.search === '?tipo=vespera'))
    await page.waitForLoadState('networkidle').catch(() => {})
    // Convidados respondem ao mesmo tempo: o número da aba e a lista têm de bater na MESMA página
    // (lidos juntos, depois da navegação); se não baterem, recarrega uma vez antes de acusar.
    for (let tentativa = 1; ; tentativa++) {
      const esperado = numero(/\((\d+)\)/.exec(await link.innerText())?.[1] ?? '')
      const familias = await page.locator('main ul > li.cartao').count()
      if (familias === esperado) break
      if (tentativa === 2) throw new Error(`A aba diz ${esperado} famílias e lista ${familias}.`)
      await page.reload()
    }
    for (const href of await page.locator('main a[href^="https://wa.me/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))) {
      if (!/^https:\/\/wa\.me\/55\d{10,11}\?text=./.test(href)) throw new Error(`Um lembrete aponta para um WhatsApp esquisito: ${href.slice(0, 80)}`)
    }
  }
}

let lances = 0
const cadastrarLance: Fluxo = async (ctx) => {
  const { page, h } = ctx
  if (lances >= 5) return h.pular('já cadastrei lances de teste suficientes')
  await noPainel(ctx, 'Lances', 'Lances')
  const antes = await page.getByRole('button', { name: 'Remover do site' }).count()
  h.passo('colar o link de um vídeo do YouTube')
  await h.digitar(page.locator('#url-lance'), `https://youtu.be/${h.sorteio(VIDEOS)}`)
  const jogos = await page.locator('#jogo-lance option').count()
  if (jogos > 1 && h.chance(0.7)) {
    await page.locator('#jogo-lance').selectOption({ index: h.inteiro(1, jogos - 1) })
    const gols = await page.locator('#gol-lance option').count()
    if (gols > 1 && h.chance(0.6)) await page.locator('#gol-lance').selectOption({ index: h.inteiro(1, gols - 1) })
  }
  h.passo('tocar em Adicionar lance')
  await h.clicar(page.getByRole('button', { name: 'Adicionar lance' }))
  await page.getByText('Lance adicionado').waitFor({ timeout: 10_000 }).catch(async () => {
    throw new Error(`Não consegui adicionar o lance: "${(await page.locator('.erro').allInnerTexts()).join(' ')}"`)
  })
  lances++
  await page.waitForTimeout(800)
  const depois = await page.getByRole('button', { name: 'Remover do site' }).count()
  if (depois !== antes + 1) throw new Error(`Adicionei um lance e a lista foi de ${antes} para ${depois}.`)
}

// ---------- o que o Marreta carrega ----------

export const entrar: Record<string, Fluxo> = { convite: abrirConvite, admin: entrarNoPainel, torneio: entrarNoTorneio }

export const fluxos: Record<string, Fluxo> = {
  'convite: confirmar com crianças': confirmarComCriancas,
  'convite: mudar a resposta': mudarResposta,
  'convite: avisar que não vai': avisarQueNaoVai,
  'convite: enviar com erro': enviarComErro,
  'convite: link de resposta que não existe': linkInexistente,
  'torcida: acompanhar o torneio': acompanharTorneio,
  'torcida: olhar a TV': olharTv,
  'admin: montar o torneio': montarTorneio,
  'admin: apitar um jogo': apitarJogo,
  'admin: conferir os números': conferirNumeros,
  'admin: dar nível aos jogadores': darNivel,
  'admin: abrir os lembretes': abrirLembretes,
  'admin: cadastrar um lance': cadastrarLance,
}

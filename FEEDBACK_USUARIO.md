# Feedbacks do Usuário - Teste de Extração Upload

**Data**: 12 de Fevereiro de 2026  
**Página Testada**: Upload  
**Funcionalidade**: Extração de fichas

## Feedbacks Recebidos

### 1. Modal de Edicao nao Carrega Contexto de Extracao - CRITICO

**Situacao**:
- Usuario configurou antes da extracao:
  - Universo: U1
  - Mundo: M1 (criado na hora)
  - Episodio: 1 (criado na hora)
  - Titulo do Episodio: "O inicio"

**Problema Observado**:
Ao clicar em "Editar" na ficha de "Joaquim" (Personagem), o modal de edicao abre com:
- CATEGORIA: nao selecionada (mostra "Selecione uma categoria")
- MUNDO: nao selecionado (mostra "Selecione um Mundo")
- EPISODIO: nao selecionado (mostra "Nenhum episodio")

**Esperado**:
Todas as informacoes configuradas na hora da extracao deveriam aparecer pre-preenchidas no modal:
- Categoria: Personagem
- Mundo: M1
- Episodio: 1

**Impacto**:
- Usuario precisa reconfigurar manualmente todas as informacoes
- Experiencia de usuario ruim
- Risco de inconsistencia de dados

**Dados Corretos no Modal**:
- Titulo: "Joaquim" OK
- Resumo: "Amigo de Paulo e Ana, lembrancas do ensino medio." OK
- Descricao: Conteudo completo OK

**Proxima Acao**:
- Usuario vai salvar as fichas para verificar se elas se mantem assim no catalogo
- Aguardando resultado para validar se o problema e apenas na exibicao ou tambem na persistencia

### 2. Dropdown de Categoria Vazio - CRITICO

**Acao do Usuario**:
- Clicou no dropdown Categoria no modal de edicao

**Problema Observado**:
- O dropdown abre mas NAO mostra nenhuma opcao
- Deveria mostrar lista de categorias (Personagem, Local, Evento, etc)
- Dropdown aparece vazio sem conteudo

**Impacto**:
- Usuario nao consegue selecionar categoria
- Modal de edicao fica inutilizavel
- Nao e possivel salvar a ficha com categoria selecionada

**Possivel Causa**:
- Categorias nao estao sendo carregadas no modal de edicao
- Problema de carregamento de dados ou props do componente NewFichaModal
- Pode estar relacionado ao problema anterior (contexto nao carregado)

### 3. Mundo Nao e Persistido Apos Salvar - CRITICO

**Acao do Usuario**:
1. Clicou no dropdown de Mundo
2. Selecionou M1 (que apareceu corretamente no dropdown)
3. Clicou em Salvar
4. Recebeu aviso: ficha atualizada com sucesso
5. Abriu a ficha novamente para editar

**Problema Observado**:
- Apos salvar, o Mundo continua nao selecionado
- Dropdown mostra Selecione um Mundo novamente
- M1 nao foi persistido no banco de dados
- Mensagem de sucesso foi enganosa (dados nao foram salvos)

**Impacto**:
- CRITICO: Dados nao estao sendo salvos corretamente
- Usuario perde informacoes ao salvar
- Impossivel associar fichas a mundos
- Integridade de dados comprometida

**Diferenca do Problema 1**:
- Problema 1: Contexto nao carregava ao abrir modal
- Problema 3: Dados selecionados nao sao salvos no banco
- Ambos afetam a persistencia de dados

**Nota Positiva**:
- Dropdown de Mundo estava funcionando (M1 aparecia na lista)
- Selecao era possivel
- Problema esta no salvamento ou persistencia

### 4. Dropdown de Episodio Fecha Modal Automaticamente - CRITICO

**Acao do Usuario**:
- Clicou no dropdown de Episodio

**Problema Observado**:
- Modal foi fechado AUTOMATICAMENTE
- Nao foi possivel ver se havia opcoes no dropdown
- Apareceu mensagem: Ficha atualizada
- Comportamento inesperado e confuso

**Impacto**:
- CRITICO: Modal fica inutilizavel ao tentar acessar dropdown de Episodio
- Usuario nao consegue selecionar episodio
- Possivel problema de event bubbling ou click handler incorreto
- Modal fecha sem usuario querer

**Possivel Causa**:
- Event bubbling: Click no dropdown esta propagando para elemento pai
- Handler de click esta fechando o modal
- Problema no componente de dropdown de episodio
- Falta de stopPropagation() ou preventDefault()

**Relacao com Problema Anterior**:
- Problema 3 mencionava: usuario reportou que dropdown de episodio em edit modal fecha imediatamente
- Este e exatamente esse problema manifestando-se
- Confirma a existencia de bug de event handling no dropdown de episodio

### 5. Diferenca Critica: Upload vs Catalogo - ACHADO IMPORTANTE

**Contexto**:
- Usuario salvou fichas de Upload para Catalogo
- Abriu ficha de Paulo no Catalogo para editar
- Comparou com comportamento em Upload

**Problema em UPLOAD**:
- Modal de edicao nao carregava contexto
- Categoria: nao selecionada
- Mundo: nao selecionado
- Episodio: nao selecionado

**Funcionamento Correto em CATALOGO**:
- Modal de edicao CARREGA contexto corretamente
- Categoria: Personagem (aparece selecionado)
- Mundo: M1 (aparece corretamente)
- Episodio: Nenhum episodio (correto, pois personagem nao tem episodio)
- Titulo, Resumo, Descricao: Todos carregam corretamente

**Conclusao**:
- O problema NAO esta no componente NewFichaModal em si
- O problema esta em como Upload passa dados para o modal
- Catalogo passa dados corretamente, Upload nao
- Diferenca esta na origem dos dados ou como sao passados ao modal

**Proxima Acao**:
- Comparar como Upload vs Catalogo chamam o modal de edicao
- Verificar como dados sao passados ao componente NewFichaModal
- Problema provavelmente em upload/page.tsx na funcao de edicao

### 6. Categoria Nao e Persistida Apos Salvar - CRITICO

**Acao do Usuario**:
1. Abriu ficha de Paulo no Catalogo (Personagem)
2. Clicou no dropdown de Categoria
3. Dropdown mostrou TODAS as categorias corretamente
4. Selecionou Local (mudou de Personagem para Local)
5. Clicou em Salvar
6. Recebeu mensagem de sucesso
7. Abriu a ficha novamente

**Problema Observado**:
- Apos salvar, categoria continuava sendo Personagem
- Mudanca para Local nao foi persistida
- Mensagem de sucesso foi enganosa (dados nao foram salvos)

**Impacto**:
- CRITICO: Categoria nao pode ser alterada
- Dados nao sao persistidos no banco
- Mensagens de sucesso enganam usuario
- Impossivel reclassificar fichas

**Padrao Observado**:
- Problema 3: Mundo nao era persistido
- Problema 6: Categoria nao e persistida
- Problema comum: Dropdowns nao persistem dados
- Possivel problema no endpoint de salvamento (PUT /api/fichas)

**Nota Positiva**:
- Dropdown de categoria funciona (mostra todas as opcoes)
- Selecao e possivel
- Problema esta no salvamento ou persistencia

### 7. Mundo Tambem Nao e Persistido em Catalogo - CRITICO

**Acao do Usuario**:
- Tentou alterar o Mundo na ficha de Paulo
- Clicou em Salvar
- Recebeu mensagem de sucesso

**Problema Observado**:
- Mundo nao foi alterado
- Mudanca nao foi persistida
- Mensagem de sucesso foi enganosa

**Confirmacao de Padrao**:
- Problema 3: Mundo nao persistia em Upload
- Problema 6: Categoria nao persiste em Catalogo
- Problema 7: Mundo nao persiste em Catalogo
- CONFIRMADO: Nenhum dropdown persiste dados

**Conclusao Critica**:
- Problema NAO esta em Upload especificamente
- Problema esta no endpoint de salvamento (PUT /api/fichas)
- Todos os dropdowns (categoria, mundo, episodio) nao persistem
- Possivel que o objeto enviado ao backend nao contenha esses campos
- Ou o backend ignora esses campos no UPDATE

### 8. Campos de Texto Funcionam, Apenas Dropdowns Nao Persistem - ACHADO CRITICO

**Acao do Usuario**:
- Alterou Titulo (campo de texto)
- Alterou Resumo (campo de texto)
- Alterou Descricao (campo de texto)
- Clicou em Salvar

**Resultado**:
- TODOS os campos de texto foram alterados corretamente
- Alteracoes foram persistidas no banco
- Mensagens de sucesso foram precisas

**Comparacao**:
- Campos de texto: FUNCIONAM perfeitamente
- Dropdowns (categoria, mundo, episodio): NAO FUNCIONAM

**Conclusao Critica**:
- Problema NAO esta no endpoint de salvamento em geral
- Problema esta ESPECIFICAMENTE nos campos de dropdown
- Possivel causa:
  1. Valores dos dropdowns nao estao sendo coletados corretamente
  2. Valores nao estao sendo incluidos no objeto enviado
  3. Nomes dos campos estao errados no formulario
  4. Problema no componente NewFichaModal ao coletar valores

**Proxima Investigacao**:
- Verificar como NewFichaModal coleta valores de categoria, mundo, episodio
- Verificar se esses campos estao sendo incluidos no objeto formData
- Comparar com como campos de texto sao coletados (que funcionam)
- Problema provavelmente em NewFichaModal.tsx

### 9. Episodio Nao Carrega e Dropdown Fecha em Catalogo - CRITICO

**Acao do Usuario**:
- Abriu ficha de Paulo em Catalogo
- Verificou campo de Episodio
- Clicou no dropdown de Episodio

**Problema Observado**:
1. Campo de Episodio nao indica Episodio 1 (deveria mostrar)
2. Dropdown chegou a aparecer brevemente com Episodio 1: O Inicio
3. Modal fechou rapidamente logo em seguida
4. Mesmo problema que em Upload (Problema 4)

**Impacto**:
- Episodio nao carrega no modal
- Dropdown de episodio causa fechamento do modal
- Impossivel selecionar episodio
- Bug de event handling afeta Catalogo tambem

**Confirmacao de Padrao**:
- Problema 4: Dropdown de episodio fecha modal em Upload
- Problema 9: Dropdown de episodio fecha modal em Catalogo
- CONFIRMADO: Bug em dropdown de episodio em TODAS as paginas
- Problema nao esta em Upload especificamente
- Problema esta no componente de dropdown de episodio

**Nota Importante**:
- Dropdown chegou a aparecer (diferente de Upload)
- Isso sugere que em Catalogo o dropdown funciona melhor
- Mas ainda tem o problema de event bubbling que fecha o modal

### 10. Erro 400 em Projetos ao Clicar Dropdown - CRITICO

**Acao do Usuario**:
- Foi para Projetos
- Tentou inserir Episodio 1 na Sinopse
- Clicou no dropdown de Episodio

**Problema Observado**:
1. Modal fechou (mesmo problema que Upload e Catalogo)
2. Apareceu mensagem: tipo e titulo sao obrigatorios
3. POST /api/fichas retornou erro 400
4. Network logs mostram erro na requisicao

**Impacto**:
- CRITICO: Erro 400 indica dados obrigatorios nao sendo enviados
- Mensagem de erro aponta para tipo e titulo
- Mas tipo e titulo deveriam estar preenchidos
- Problema pode estar em como dados sao coletados do modal

**Analise do Erro**:
- Erro 400 = Bad Request
- Mensagem: tipo e titulo sao obrigatorios
- Isso sugere que o objeto enviado nao contem tipo ou titulo
- Ou contem mas com valores vazios ou nulos
- Relacionado ao Problema 8: Dropdowns nao sao coletados corretamente

**Hipotese**:
- Quando dropdown e clicado, algo dispara uma requisicao POST
- Essa requisicao nao contem tipo e titulo
- Possivelmente um onChange handler que tenta salvar sem dados completos
- Ou um event listener incorreto que tenta fazer POST prematuramente

### 11. Fluxo Quebrado em Projetos: Modal Intermediario - DESIGN ISSUE

**Acao do Usuario**:
- Clicou em + Nova Sinopse
- Clicou em + Novo Conceito
- Clicou em + Nova Regra

**Problema Observado**:
1. Abre modal pedindo para escolher categoria
2. Clica no dropdown de categoria
3. Nao ha nenhuma opcao (vazio)
4. Fluxo esperado: Deveria abrir ficha de criacao direto

**Comportamento Esperado**:
- Clica em Nova Sinopse: Abre ficha de criacao de Sinopse
- Clica em Novo Conceito: Abre ficha de criacao de Conceito
- Clica em Nova Regra: Abre ficha de criacao de Regra
- Nao deveria ter modal intermediario pedindo categoria

**Impacto**:
- DESIGN ISSUE: Fluxo de criacao ficou mais complexo
- Modal intermediario e desnecessario (categoria ja e conhecida)
- Dropdown de categoria vazio torna modal inutilizavel
- Regrediu em relacao ao fluxo anterior

**Causa Provavel**:
- Unificacao de modals em NewFichaModal causou essa mudanca
- Antes havia modals separados para cada tipo
- Agora usa modal generico que pede categoria
- Mas categoria deveria ser passada como parametro

**Solucao Esperada**:
- Botoes deveriam passar categoria pre-selecionada
- Modal deveria abrir com categoria ja preenchida
- Ou deveria abrir ficha de criacao direto sem intermediario

### 12. Título do Modal com "Nova" - Problema de Gênero - SOLICITACAO DE MUDANCA

**Acao do Usuario**:
- Em Catalogo, clicou em Nova Ficha
- Selecionou categoria Conceito
- Modal abriu com titulo Nova Conceito

**Problema Observado**:
1. Titulo diz Nova Conceito (deveria ser Novo Conceito)
2. Testou outras categorias: todas tem Nova na frente
3. Problema: Se usuario criar categoria neutra, fica esquisito

**Solicitacao do Usuario**:
- Remover a palavra Nova do inicio do titulo
- Deixar apenas o nome da categoria
- Titulo deveria ser: Conceito, Personagem, Local, Evento etc

**Beneficio**:
- Funciona para qualquer categoria (masculina, feminina, neutra)
- Mais simples e direto
- Sem problemas de gênero gramatical
- Escalavel para categorias customizadas do usuario

**Implementacao**:
- Mudar titulo do modal de Nova Ficha de Novo Conceito para apenas Conceito
- Aplicar a mesma logica para todas as categorias
- Titulo deveria ser: {nomeCategoria}

---

## Notas
- Estes feedbacks serão usados para ajustes futuros
- Nenhuma ação será tomada até confirmação do usuário

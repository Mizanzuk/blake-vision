# Modificações Pendentes

## 1. Avatares não estão aparecendo
- Problema: Ícones de interrogação ao invés das imagens dos agentes
- Solução: Verificar caminhos das imagens (provavelmente `/urthona.webp` e `/urizen.webp`)

## 2. Posicionamento do menu contextual
- Deve aparecer sempre **acima** da primeira linha do texto selecionado
- Não deve cobrir nada do texto selecionado
- Ajustar cálculo de posição para considerar altura do menu

## 3. Alinhar rodapé do chat com rodapé do campo de conteúdo
- O input de mensagem do chat deve estar na mesma altura dos botões "Excluir", "Salvar" e "Publicar"
- Ajustar padding/margin do chat para alinhar verticalmente

## 4. Alinhar botão "Abrir barra lateral" com botão "Fechar barra lateral"
- O botão de abrir (quando sidebar está fechada) está muito abaixo
- Deve estar na mesma altura do botão de fechar (quando sidebar está aberta)
- Ajustar `pt-48` para um valor menor (provavelmente `pt-4` ou `pt-6`)

## 5. Problema com refresh e novo texto

### Refresh:
- Ao dar F5 com um texto aberto, deveria manter o mesmo texto
- Mas está criando um novo texto com os dados do texto anterior

### Novo texto:
- Ao clicar em "+ Novo Texto", deveria limpar tudo
- Mas está mantendo informações do texto anterior (título, universo, mundo, episódio, categoria)

### Possível causa:
- Não está salvando o ID do texto atual em URL ou localStorage
- Função `handleNewTexto` não está limpando todos os estados

### Solução:
1. Adicionar ID do texto na URL (query param ou path)
2. Ao dar refresh, verificar URL e carregar texto correspondente
3. Limpar TODOS os estados ao criar novo texto

---

*Aguardando mais modificações do usuário...*

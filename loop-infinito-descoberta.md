# Descoberta: Loop Infinito de Re-renderizações

## Problema Reportado pelo Usuário

Ao tentar mudar o estilo do texto (fonte), aparece no console do navegador:

```
ResizeObserver loop completed with undelivered notifications.
```

E o número no erro fica crescendo até 6.

## Análise

1. **ResizeObserver loop** indica que há re-renderizações infinitas
2. Isso explica por que o `fontFamily` não muda - o estado é resetado a cada re-renderização
3. O ResizeObserver provavelmente vem do TipTap editor
4. Não há ResizeObserver explícito no código do projeto

## Possíveis Causas

1. **TipTap interno**: O editor TipTap usa ResizeObserver internamente
2. **useEffect problemático**: Algum useEffect está causando re-renderizações
3. **Prop drilling**: O `fontFamily` sendo passado para TiptapEditor pode estar causando loop
4. **Container com classes dinâmicas**: O `clsx` com classes condicionais pode estar causando re-renderização

## Próximos Passos

1. Adicionar `React.memo` no TiptapEditor para evitar re-renderizações desnecessárias
2. Verificar se o `fontFamily` prop está causando o loop
3. Adicionar `useMemo` nas classes do container
4. Suprimir o warning do ResizeObserver se necessário
